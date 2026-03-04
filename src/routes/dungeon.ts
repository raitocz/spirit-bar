import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { verifyPassword, signJwt, verifyJwt } from "../lib/auth";
import { getMailbox, clearMailbox, sendEmail, quizConfirmationEmail } from "../lib/email";
import { errorPage } from "../lib/layout";

type Bindings = {
  DB: D1Database;
  PHOTOS: R2Bucket;
  JWT_SECRET: string;
  ENVIRONMENT?: string;
  RESEND_API_KEY?: string;
};

export const dungeon = new Hono<{ Bindings: Bindings }>();

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + "T00:00:00").getTime());
}

// ── Public photo serving (no auth) ──

dungeon.get("/photos/:key{.+}", async (c) => {
  const key = c.req.param("key");

  // Prevent path traversal — only allow keys under galleries/
  if (!key.startsWith("galleries/") || key.includes("..")) {
    return c.html(errorPage(403), 403);
  }

  const object = await c.env.PHOTOS.get(key);
  if (!object) return c.html(errorPage(404), 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("Content-Type", "image/webp");

  return new Response(object.body, { headers });
});

// ── Login rate limiting ──

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) return false;
  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

function recordLoginAttempt(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  } else {
    entry.count++;
  }
}

function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

// ── API routes ──

dungeon.post("/api/login", async (c) => {
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";

  if (isRateLimited(ip)) {
    return c.json({ error: "too many login attempts, try again later" }, 429);
  }

  const body = await c.req.json<{ username?: string; password?: string }>();
  if (!body.username || !body.password) {
    return c.json({ error: "username and password are required" }, 400);
  }

  const row = await c.env.DB.prepare(
    "SELECT id, username, password_hash FROM admins WHERE username = ?"
  )
    .bind(body.username.trim().toLowerCase())
    .first<{ id: number; username: string; password_hash: string }>();

  if (!row || !(await verifyPassword(body.password, row.password_hash))) {
    recordLoginAttempt(ip);
    return c.json({ error: "invalid credentials" }, 401);
  }

  clearLoginAttempts(ip);

  const token = await signJwt(
    { sub: row.id, username: row.username },
    c.env.JWT_SECRET
  );

  setCookie(c, "dungeon_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/dungeon",
    maxAge: 86400,
  });

  return c.json({ username: row.username });
});

dungeon.post("/api/logout", (c) => {
  deleteCookie(c, "dungeon_token", { path: "/dungeon" });
  return c.json({ ok: true });
});

// ── Auth middleware for all API routes except login ──

dungeon.use("/api/*", async (c, next) => {
  if (c.req.path === "/dungeon/api/login" || c.req.path === "/dungeon/api/logout") return next();
  const token = getCookie(c, "dungeon_token");
  if (!token) return c.json({ error: "not authenticated" }, 401);
  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ error: "invalid session" }, 401);
  c.set("user" as never, payload);
  await next();
});

dungeon.get("/api/me", (c) => {
  const user = c.get("user" as never) as { username: string };
  return c.json({ username: user.username });
});

// ── Quiz registrations (auth-protected) ──

dungeon.get("/api/quiz/registrations", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, email, phone, created_at FROM quiz_registrations ORDER BY created_at DESC"
  ).all();
  return c.json({ registrations: results });
});

// ── Galleries CRUD ──

dungeon.get("/api/galleries", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM galleries ORDER BY date_from DESC"
  ).all();
  return c.json(results);
});

dungeon.post("/api/galleries", async (c) => {
  const body = await c.req.json<{
    title?: string;
    description?: string;
    date_from?: string;
    date_to?: string;
  }>();
  if (!body.title?.trim() || !body.date_from?.trim()) {
    return c.json({ error: "title and date_from are required" }, 400);
  }
  if (!isValidDate(body.date_from.trim())) {
    return c.json({ error: "date_from must be YYYY-MM-DD" }, 400);
  }
  if (body.date_to?.trim() && !isValidDate(body.date_to.trim())) {
    return c.json({ error: "date_to must be YYYY-MM-DD" }, 400);
  }
  const result = await c.env.DB.prepare(
    "INSERT INTO galleries (title, description, date_from, date_to) VALUES (?, ?, ?, ?)"
  )
    .bind(
      body.title.trim(),
      (body.description ?? "").trim(),
      body.date_from.trim(),
      body.date_to?.trim() || null
    )
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM galleries WHERE id = ?")
    .bind(result.meta.last_row_id)
    .first();
  return c.json(row, 201);
});

dungeon.put("/api/galleries/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{
    title?: string;
    description?: string;
    date_from?: string;
    date_to?: string;
  }>();
  if (!body.title?.trim() || !body.date_from?.trim()) {
    return c.json({ error: "title and date_from are required" }, 400);
  }
  if (!isValidDate(body.date_from.trim())) {
    return c.json({ error: "date_from must be YYYY-MM-DD" }, 400);
  }
  if (body.date_to?.trim() && !isValidDate(body.date_to.trim())) {
    return c.json({ error: "date_to must be YYYY-MM-DD" }, 400);
  }
  const { meta } = await c.env.DB.prepare(
    "UPDATE galleries SET title = ?, description = ?, date_from = ?, date_to = ? WHERE id = ?"
  )
    .bind(
      body.title.trim(),
      (body.description ?? "").trim(),
      body.date_from.trim(),
      body.date_to?.trim() || null,
      id
    )
    .run();
  if (!meta.changes) return c.json({ error: "not found" }, 404);
  const row = await c.env.DB.prepare("SELECT * FROM galleries WHERE id = ?")
    .bind(id)
    .first();
  return c.json(row);
});

dungeon.delete("/api/galleries/:id", async (c) => {
  const id = Number(c.req.param("id"));

  // Delete all R2 objects for this gallery
  const { results: photos } = await c.env.DB.prepare(
    "SELECT r2_key FROM gallery_photos WHERE gallery_id = ?"
  )
    .bind(id)
    .all<{ r2_key: string }>();

  if (photos.length) {
    await Promise.all(photos.map((p) => c.env.PHOTOS.delete(p.r2_key)));
  }

  const { meta } = await c.env.DB.prepare("DELETE FROM galleries WHERE id = ?")
    .bind(id)
    .run();
  if (!meta.changes) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});

// ── Gallery Photos ──

dungeon.get("/api/galleries/:id/photos", async (c) => {
  const galleryId = Number(c.req.param("id"));
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM gallery_photos WHERE gallery_id = ? ORDER BY sort_order, created_at"
  )
    .bind(galleryId)
    .all();
  return c.json(results);
});

dungeon.post("/api/galleries/:id/photos", async (c) => {
  const galleryId = Number(c.req.param("id"));

  // Verify gallery exists
  const gallery = await c.env.DB.prepare(
    "SELECT id FROM galleries WHERE id = ?"
  )
    .bind(galleryId)
    .first();
  if (!gallery) return c.json({ error: "gallery not found" }, 404);

  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));

  if (!file || !width || !height) {
    return c.json({ error: "file, width, and height are required" }, 400);
  }

  const allowedTypes = ["image/webp", "image/jpeg", "image/png", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "invalid file type, only images allowed (webp, jpeg, png, gif)" }, 400);
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: "file too large (max 10 MB)" }, 413);
  }

  const uuid = crypto.randomUUID();
  const r2Key = `galleries/${galleryId}/${uuid}.webp`;
  const arrayBuffer = await file.arrayBuffer();

  await c.env.PHOTOS.put(r2Key, arrayBuffer, {
    httpMetadata: { contentType: "image/webp" },
  });

  const result = await c.env.DB.prepare(
    "INSERT INTO gallery_photos (gallery_id, filename, r2_key, width, height, size_bytes) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(galleryId, file.name || "photo.webp", r2Key, width, height, arrayBuffer.byteLength)
    .run();

  const row = await c.env.DB.prepare(
    "SELECT * FROM gallery_photos WHERE id = ?"
  )
    .bind(result.meta.last_row_id)
    .first();

  return c.json(row, 201);
});

dungeon.put("/api/galleries/:id/photos/reorder", async (c) => {
  const galleryId = Number(c.req.param("id"));
  const body = await c.req.json<{ photoIds?: number[] }>();
  if (!Array.isArray(body.photoIds)) {
    return c.json({ error: "photoIds array is required" }, 400);
  }
  if (body.photoIds.length > 500) {
    return c.json({ error: "too many photos to reorder" }, 400);
  }

  const stmts = body.photoIds.map((id, i) =>
    c.env.DB.prepare(
      "UPDATE gallery_photos SET sort_order = ? WHERE id = ? AND gallery_id = ?"
    ).bind(i, id, galleryId)
  );
  await c.env.DB.batch(stmts);

  return c.json({ ok: true });
});

dungeon.delete("/api/galleries/:id/photos/:photoId", async (c) => {
  const galleryId = Number(c.req.param("id"));
  const photoId = Number(c.req.param("photoId"));

  const photo = await c.env.DB.prepare(
    "SELECT r2_key FROM gallery_photos WHERE id = ? AND gallery_id = ?"
  )
    .bind(photoId, galleryId)
    .first<{ r2_key: string }>();

  if (!photo) return c.json({ error: "not found" }, 404);

  await c.env.PHOTOS.delete(photo.r2_key);
  await c.env.DB.prepare("DELETE FROM gallery_photos WHERE id = ?")
    .bind(photoId)
    .run();

  return c.json({ ok: true });
});

// ── Quizzes CRUD ──

dungeon.get("/api/quizzes", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT q.*,
       COUNT(qt.id) AS total_teams,
       COUNT(CASE WHEN qt.payment_status IS NOT NULL THEN 1 END) AS confirmed_teams,
       COUNT(CASE WHEN qt.placement IS NOT NULL THEN 1 END) AS results_count
     FROM quizzes q
     LEFT JOIN quiz_teams qt ON qt.quiz_id = q.id
     GROUP BY q.id
     ORDER BY q.date DESC`
  ).all();
  return c.json(results);
});

dungeon.post("/api/quizzes", async (c) => {
  const body = await c.req.json<{
    quiz_number?: number;
    date?: string;
    max_participants?: number;
    price?: number;
  }>();
  if (!body.quiz_number || !body.date?.trim() || !body.max_participants || body.price == null) {
    return c.json({ error: "quiz_number, date, max_participants, and price are required" }, 400);
  }
  if (!isValidDate(body.date.trim())) {
    return c.json({ error: "date must be YYYY-MM-DD" }, 400);
  }
  const result = await c.env.DB.prepare(
    "INSERT INTO quizzes (quiz_number, date, max_participants, price) VALUES (?, ?, ?, ?)"
  )
    .bind(body.quiz_number, body.date.trim(), body.max_participants, body.price)
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM quizzes WHERE id = ?")
    .bind(result.meta.last_row_id)
    .first();
  return c.json(row, 201);
});

dungeon.put("/api/quizzes/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{
    quiz_number?: number;
    date?: string;
    max_participants?: number;
    price?: number;
  }>();
  if (!body.quiz_number || !body.date?.trim() || !body.max_participants || body.price == null) {
    return c.json({ error: "quiz_number, date, max_participants, and price are required" }, 400);
  }
  if (!isValidDate(body.date.trim())) {
    return c.json({ error: "date must be YYYY-MM-DD" }, 400);
  }
  const { meta } = await c.env.DB.prepare(
    "UPDATE quizzes SET quiz_number = ?, date = ?, max_participants = ?, price = ? WHERE id = ?"
  )
    .bind(body.quiz_number, body.date.trim(), body.max_participants, body.price, id)
    .run();
  if (!meta.changes) return c.json({ error: "not found" }, 404);
  const row = await c.env.DB.prepare("SELECT * FROM quizzes WHERE id = ?")
    .bind(id)
    .first();
  return c.json(row);
});

dungeon.delete("/api/quizzes/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const { meta } = await c.env.DB.prepare("DELETE FROM quizzes WHERE id = ?")
    .bind(id)
    .run();
  if (!meta.changes) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});

// ── Quiz teams (auth-protected) ──

dungeon.get("/api/quizzes/:id/teams", async (c) => {
  const quizId = Number(c.req.param("id"));
  const { results: teams } = await c.env.DB.prepare(
    "SELECT * FROM quiz_teams WHERE quiz_id = ? ORDER BY created_at DESC"
  )
    .bind(quizId)
    .all();

  if (!teams.length) return c.json([]);

  const teamIds = teams.map((t: any) => t.id);
  const placeholders = teamIds.map(() => "?").join(",");
  const { results: members } = await c.env.DB.prepare(
    `SELECT * FROM quiz_team_members WHERE team_id IN (${placeholders}) ORDER BY id`
  )
    .bind(...teamIds)
    .all();

  const teamsWithMembers = teams.map((t: any) => ({
    ...t,
    members: members.filter((m: any) => m.team_id === t.id),
  }));

  return c.json(teamsWithMembers);
});

dungeon.put("/api/teams/:id/payment", async (c) => {
  const teamId = Number(c.req.param("id"));
  const body = await c.req.json<{ payment_status?: string }>();
  const valid = ["cash", "bank", "card", "free", null];
  if (!valid.includes(body.payment_status ?? null)) {
    return c.json({ error: "payment_status must be one of: cash, bank, card, free, or null" }, 400);
  }
  const { meta } = await c.env.DB.prepare(
    "UPDATE quiz_teams SET payment_status = ? WHERE id = ?"
  )
    .bind(body.payment_status ?? null, teamId)
    .run();
  if (!meta.changes) return c.json({ error: "team not found" }, 404);
  return c.json({ ok: true });
});

dungeon.post("/api/teams/:id/confirm", async (c) => {
  const teamId = Number(c.req.param("id"));

  const team = await c.env.DB.prepare(
    "SELECT qt.*, q.quiz_number, q.date, q.price FROM quiz_teams qt JOIN quizzes q ON q.id = qt.quiz_id WHERE qt.id = ?"
  )
    .bind(teamId)
    .first<{ id: number; quiz_id: number; team_name: string; icon: string; email: string; payment_status: string | null; quiz_number: number; date: string; price: number }>();

  if (!team) return c.json({ error: "team not found" }, 404);
  if (!team.payment_status) return c.json({ error: "team has not paid yet" }, 400);

  const { results: members } = await c.env.DB.prepare(
    "SELECT name FROM quiz_team_members WHERE team_id = ? ORDER BY id"
  )
    .bind(teamId)
    .all<{ name: string }>();

  const emailMsg = quizConfirmationEmail({
    quizNumber: team.quiz_number,
    date: team.date,
    price: team.price,
    teamName: team.team_name,
    icon: team.icon,
    members: members.map((m) => m.name),
    email: team.email,
  });

  await sendEmail(c.env, emailMsg);

  return c.json({ ok: true });
});

dungeon.put("/api/quizzes/:id/results", async (c) => {
  const quizId = Number(c.req.param("id"));
  const quiz = await c.env.DB.prepare("SELECT id, date FROM quizzes WHERE id = ?")
    .bind(quizId)
    .first<{ id: number; date: string }>();
  if (!quiz) return c.json({ error: "quiz not found" }, 404);

  const today = new Date().toISOString().slice(0, 10);
  if (quiz.date >= today) {
    return c.json({ error: "can only set results for past quizzes" }, 400);
  }

  const body = await c.req.json<{ teams?: { id: number; placement: number; score: number | null }[] }>();
  if (!Array.isArray(body.teams) || !body.teams.length) {
    return c.json({ error: "teams array is required" }, 400);
  }
  if (body.teams.length > 100) {
    return c.json({ error: "too many teams" }, 400);
  }

  const stmts = body.teams.map((t) =>
    c.env.DB.prepare(
      "UPDATE quiz_teams SET placement = ?, score = ? WHERE id = ? AND quiz_id = ?"
    ).bind(t.placement, t.score ?? null, t.id, quizId)
  );
  await c.env.DB.batch(stmts);

  return c.json({ success: true });
});

dungeon.delete("/api/teams/:id", async (c) => {
  const teamId = Number(c.req.param("id"));
  const { meta } = await c.env.DB.prepare("DELETE FROM quiz_teams WHERE id = ?")
    .bind(teamId)
    .run();
  if (!meta.changes) return c.json({ error: "team not found" }, 404);
  return c.json({ ok: true });
});

// ── Mail catcher (dev only) ──

dungeon.get("/api/mail", (c) => {
  if (c.env.ENVIRONMENT !== "development") return c.json([]);
  return c.json(getMailbox());
});

dungeon.delete("/api/mail", (c) => {
  clearMailbox();
  return c.json({ ok: true });
});

// ── SPA catch-all: serve inline HTML ──

const spaHtml = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>SPiRiT Dungeon</title>
  <link rel="icon" href="/img/favicon/favicon.ico">
  <link rel="stylesheet" href="/dungeon/style.css">
</head>
<body>
  <div id="app"></div>
  <script src="/dungeon/app.js"></script>
</body>
</html>`;

dungeon.get("/", (c) => c.html(spaHtml));
dungeon.get("/*", (c) => {
  // Don't catch API or static asset requests
  const path = c.req.path;
  if (path.startsWith("/dungeon/api/") || path.includes(".")) {
    return c.html(errorPage(404), 404);
  }
  return c.html(spaHtml);
});
