import { Hono } from "hono";
import { sendEmail, quizRegistrationEmail } from "../lib/email";

type Bindings = {
  DB: D1Database;
  RESEND_API_KEY?: string;
  ENVIRONMENT?: string;
};

export const api = new Hono<{ Bindings: Bindings }>();

// ── Rate limiting ──
// NOTE: In-memory rate limiting is per-isolate on Cloudflare Workers.
// For production hardening, consider Cloudflare Rate Limiting API or KV-backed counters.

const rateLimits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(
  ip: string,
  prefix: string,
  maxRequests: number,
  windowMs: number
): boolean {
  // Periodic cleanup of expired entries
  const now = Date.now();
  if (rateLimits.size > 100) {
    for (const [k, v] of rateLimits) {
      if (now > v.resetAt) rateLimits.delete(k);
    }
  }

  const key = prefix + ":" + ip;
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > maxRequests;
}

// Health check
api.get("/health", (c) => c.json({ status: "ok" }));

// Register for a quiz
api.post("/quiz/register", async (c) => {
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
  if (rateLimit(ip, "quiz-reg", 5, 15 * 60 * 1000)) {
    return c.json({ error: "too many registration attempts, try again later" }, 429);
  }

  const body = await c.req.json<{
    name?: string;
    email?: string;
    phone?: string;
  }>();

  if (!body.name || !body.email) {
    return c.json({ error: "name and email are required" }, 400);
  }

  const email = body.email.trim().toLowerCase();

  try {
    await c.env.DB.prepare(
      `INSERT INTO quiz_registrations (name, email, phone) VALUES (?, ?, ?)`
    )
      .bind(body.name.trim(), email, body.phone?.trim() ?? null)
      .run();
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return c.json({ error: "email already registered" }, 409);
    }
    throw e;
  }

  return c.json({ success: true }, 201);
});

// NOTE: quiz/registrations listing moved to /dungeon/api/quiz/registrations (auth-protected)

// ── Public Quizzes endpoint ──

api.get("/quizzes", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT q.id, q.quiz_number, q.date, q.max_participants, q.price,
            COUNT(qt.id) AS registered_teams,
            COUNT(CASE WHEN qt.placement IS NOT NULL THEN 1 END) AS results_count
     FROM quizzes q
     LEFT JOIN quiz_teams qt ON qt.quiz_id = q.id AND qt.payment_status IS NOT NULL
     GROUP BY q.id
     ORDER BY q.date DESC
     LIMIT 200`
  ).all();
  return c.json(results);
});

// Get taken icons and team names for a quiz
api.get("/quizzes/:id/taken", async (c) => {
  const quizId = Number(c.req.param("id"));
  const { results } = await c.env.DB.prepare(
    "SELECT icon, team_name FROM quiz_teams WHERE quiz_id = ?"
  )
    .bind(quizId)
    .all<{ icon: string; team_name: string }>();
  return c.json({
    icons: results.map((r) => r.icon),
    names: results.map((r) => r.team_name),
  });
});

// Register a team for a quiz
api.post("/quizzes/:id/register", async (c) => {
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
  if (rateLimit(ip, "team-reg", 10, 15 * 60 * 1000)) {
    return c.json({ error: "too many registration attempts, try again later" }, 429);
  }

  const quizId = Number(c.req.param("id"));
  const body = await c.req.json<{
    team_name?: string;
    icon?: string;
    email?: string;
    members?: string[];
  }>();

  if (!body.team_name?.trim()) {
    return c.json({ error: "team_name is required" }, 400);
  }
  if (!body.email?.trim()) {
    return c.json({ error: "email is required" }, 400);
  }
  if (!Array.isArray(body.members) || body.members.length < 1 || body.members.length > 4) {
    return c.json({ error: "members must be an array of 1–4 names" }, 400);
  }
  const members = body.members.map((m) => (typeof m === "string" ? m.trim() : ""));
  if (members.some((m) => !m)) {
    return c.json({ error: "all member names must be non-empty" }, 400);
  }

  const quiz = await c.env.DB.prepare("SELECT id, quiz_number, date, max_participants, price FROM quizzes WHERE id = ?")
    .bind(quizId)
    .first<{ id: number; quiz_number: number; date: string; max_participants: number; price: number }>();

  if (!quiz) {
    return c.json({ error: "quiz not found" }, 404);
  }

  const today = new Date().toISOString().slice(0, 10);
  if (quiz.date < today) {
    return c.json({ error: "registration is closed for past quizzes" }, 400);
  }

  const teamCount = await c.env.DB.prepare(
    "SELECT COUNT(*) AS cnt FROM quiz_teams WHERE quiz_id = ? AND payment_status IS NOT NULL"
  )
    .bind(quizId)
    .first<{ cnt: number }>();

  if (teamCount && teamCount.cnt >= quiz.max_participants) {
    return c.json({ error: "quiz is full" }, 400);
  }

  const icon = body.icon?.trim() || "🐶";
  const trimmedName = body.team_name.trim();

  // Check unique team name
  const dupName = await c.env.DB.prepare(
    "SELECT id FROM quiz_teams WHERE quiz_id = ? AND team_name = ?"
  )
    .bind(quizId, trimmedName)
    .first();
  if (dupName) {
    return c.json({ error: "Tým s tímto názvem je již registrován" }, 409);
  }

  // Check unique icon
  const dupIcon = await c.env.DB.prepare(
    "SELECT id FROM quiz_teams WHERE quiz_id = ? AND icon = ?"
  )
    .bind(quizId, icon)
    .first();
  if (dupIcon) {
    return c.json({ error: "Tato ikona je již zabraná, zvol jinou" }, 409);
  }

  let teamId: number;
  try {
    const teamResult = await c.env.DB.prepare(
      "INSERT INTO quiz_teams (quiz_id, team_name, icon, email) VALUES (?, ?, ?, ?)"
    )
      .bind(quizId, trimmedName, icon, body.email.trim().toLowerCase())
      .run();
    teamId = teamResult.meta.last_row_id;
  } catch (e: unknown) {
    // Handle race condition: UNIQUE constraint violation despite earlier SELECT checks
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return c.json({ error: "Tým nebo ikona již existuje, zkus to znovu" }, 409);
    }
    throw e;
  }

  const memberStmts = members.map((name) =>
    c.env.DB.prepare("INSERT INTO quiz_team_members (team_id, name) VALUES (?, ?)").bind(teamId, name)
  );
  await c.env.DB.batch(memberStmts);

  // Send confirmation email (fire-and-forget)
  try {
    const emailMsg = quizRegistrationEmail({
      quizNumber: quiz.quiz_number,
      date: quiz.date,
      price: quiz.price,
      teamName: trimmedName,
      icon,
      members,
      email: body.email!.trim().toLowerCase(),
    });
    c.executionCtx.waitUntil(
      sendEmail(c.env, emailMsg).catch(() => {})
    );
  } catch {
    // never fail registration due to email error
  }

  return c.json({ success: true }, 201);
});

// ── Public Quiz Results ──

api.get("/quizzes/:id/results", async (c) => {
  const quizId = Number(c.req.param("id"));
  const { results } = await c.env.DB.prepare(
    `SELECT team_name, icon, placement, score
     FROM quiz_teams
     WHERE quiz_id = ? AND placement IS NOT NULL
     ORDER BY placement`
  )
    .bind(quizId)
    .all();
  return c.json(results);
});

// ── Public Gallery endpoints ──

api.get("/galleries", async (c) => {
  const { results: galleries } = await c.env.DB.prepare(
    `SELECT g.*, gp.r2_key AS cover_r2_key, gp.width AS cover_width, gp.height AS cover_height,
            gp.cover_thumb_r2_key, gp.thumb_r2_key AS cover_thumb_fallback
     FROM galleries g
     LEFT JOIN gallery_photos gp ON gp.id = (
       SELECT id FROM gallery_photos WHERE gallery_id = g.id ORDER BY sort_order, created_at LIMIT 1
     )
     ORDER BY g.date_from DESC
     LIMIT 200`
  ).all();
  return c.json(galleries);
});

api.get("/galleries/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const gallery = await c.env.DB.prepare(
    "SELECT * FROM galleries WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!gallery) return c.json({ error: "not found" }, 404);

  const { results: photos } = await c.env.DB.prepare(
    "SELECT * FROM gallery_photos WHERE gallery_id = ? ORDER BY sort_order, created_at"
  )
    .bind(id)
    .all();

  return c.json({ ...gallery, photos });
});
