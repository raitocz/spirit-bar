import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
};

export const api = new Hono<{ Bindings: Bindings }>();

// Health check
api.get("/health", (c) => c.json({ status: "ok" }));

// Register for a quiz
api.post("/quiz/register", async (c) => {
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

// ── Public Gallery endpoints ──

api.get("/galleries", async (c) => {
  const { results: galleries } = await c.env.DB.prepare(
    `SELECT g.*, gp.r2_key AS cover_r2_key, gp.width AS cover_width, gp.height AS cover_height
     FROM galleries g
     LEFT JOIN gallery_photos gp ON gp.id = (
       SELECT id FROM gallery_photos WHERE gallery_id = g.id ORDER BY sort_order, created_at LIMIT 1
     )
     ORDER BY g.date_from DESC`
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
