import { Hono } from "hono";
import { hashPassword, verifyPassword, signJwt, verifyJwt } from "../lib/auth";
import { getMailbox, clearMailbox, sendEmail, quizConfirmationEmail, adminInviteEmail, monthlyShiftSummaryEmail } from "../lib/email";
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

const USER_COLORS = [
  "#e06030", "#34d399", "#f472b6", "#a78bfa",
  "#facc15", "#38bdf8", "#fb7185", "#4ade80",
  "#c084fc", "#f59e0b", "#22d3ee", "#818cf8",
  "#a3e635", "#fb923c", "#e879f9", "#2dd4bf",
];

function isValidImageMagic(bytes: Uint8Array): boolean {
  // WebP: RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  // GIF: GIF87a or GIF89a
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return true;
  return false;
}

async function hashInviteToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function pickColor(usedColors: string[]): string {
  const used = new Set(usedColors.map(c => c?.toLowerCase()));
  for (const c of USER_COLORS) {
    if (!used.has(c)) return c;
  }
  // All taken — offset based on count
  return USER_COLORS[usedColors.length % USER_COLORS.length];
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
// NOTE: In-memory rate limiting is per-isolate on Cloudflare Workers.
// For production hardening, consider Cloudflare Rate Limiting API or KV-backed counters.

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

function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of loginAttempts) {
    if (now > entry.resetAt) loginAttempts.delete(key);
  }
  for (const [key, entry] of setupPasswordAttempts) {
    if (now > entry.resetAt) setupPasswordAttempts.delete(key);
  }
}

// ── API routes ──

function setSessionCookie(c: any, token: string, remember: boolean) {
  const maxAge = remember ? 365 * 24 * 60 * 60 : undefined; // 1 year or session
  const isSecure = new URL(c.req.url).protocol === "https:";
  c.header("Set-Cookie",
    `session=${token}; Path=/dungeon; HttpOnly; SameSite=Lax${isSecure ? "; Secure" : ""}${maxAge ? `; Max-Age=${maxAge}` : ""}`
  );
}

function clearSessionCookie(c: any) {
  const isSecure = new URL(c.req.url).protocol === "https:";
  c.header("Set-Cookie",
    `session=; Path=/dungeon; HttpOnly; SameSite=Lax${isSecure ? "; Secure" : ""}; Max-Age=0`
  );
}

function getCookieToken(c: any): string | null {
  const cookies = c.req.header("cookie") || "";
  const match = cookies.match(/(?:^|;\s*)session=([^\s;]+)/);
  return match ? match[1] : null;
}

dungeon.post("/api/login", async (c) => {
  cleanupRateLimits();
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";

  if (isRateLimited(ip)) {
    return c.json({ error: "too many login attempts, try again later" }, 429);
  }

  const body = await c.req.json<{ username?: string; password?: string; remember?: boolean }>();
  if (!body.username || !body.password) {
    return c.json({ error: "username and password are required" }, 400);
  }

  const row = await c.env.DB.prepare(
    "SELECT id, username, password_hash, role, session_version FROM admins WHERE username = ?"
  )
    .bind(body.username.trim().toLowerCase())
    .first<{ id: number; username: string; password_hash: string; role: string; session_version: number }>();

  if (!row || !(await verifyPassword(body.password, row.password_hash))) {
    recordLoginAttempt(ip);
    return c.json({ error: "invalid credentials" }, 401);
  }

  clearLoginAttempts(ip);

  const expiresIn = body.remember ? 365 * 24 * 60 * 60 : 24 * 60 * 60;
  const token = await signJwt(
    { sub: row.id, username: row.username, role: row.role, sv: row.session_version },
    c.env.JWT_SECRET,
    expiresIn
  );

  setSessionCookie(c, token, !!body.remember);
  return c.json({ id: row.id, username: row.username, role: row.role });
});

dungeon.post("/api/logout", (c) => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});

// ── Setup password (public – no auth) ──

const setupPasswordAttempts = new Map<string, { count: number; resetAt: number }>();

dungeon.post("/api/setup-password", async (c) => {
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";

  // Rate limit: 10 attempts per IP per 15 min
  const now = Date.now();
  const entry = setupPasswordAttempts.get(ip);
  if (entry && now <= entry.resetAt && entry.count >= 10) {
    return c.json({ error: "too many attempts, try again later" }, 429);
  }
  if (!entry || now > (entry?.resetAt ?? 0)) {
    setupPasswordAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
  } else {
    entry.count++;
  }

  const body = await c.req.json<{ token?: string; password?: string }>();
  if (!body.token || !body.password) {
    return c.json({ error: "token and password are required" }, 400);
  }

  // Validate token format (64 hex chars)
  if (!/^[a-f0-9]{64}$/.test(body.token)) {
    return c.json({ error: "invalid token" }, 400);
  }

  // Validate password strength server-side
  const pw = body.password;
  if (pw.length < 8) return c.json({ error: "password must be at least 8 characters" }, 400);
  if (!/[a-z]/.test(pw)) return c.json({ error: "password must contain a lowercase letter" }, 400);
  if (!/[A-Z]/.test(pw)) return c.json({ error: "password must contain an uppercase letter" }, 400);
  if (!/[0-9]/.test(pw)) return c.json({ error: "password must contain a number" }, 400);
  if (!/[^a-zA-Z0-9]/.test(pw)) return c.json({ error: "password must contain a special character" }, 400);

  const tokenHash = await hashInviteToken(body.token);
  const user = await c.env.DB.prepare(
    "SELECT id, username, role, invite_token, invite_expires FROM admins WHERE invite_token = ?"
  )
    .bind(tokenHash)
    .first<{ id: number; username: string; role: string; invite_token: string; invite_expires: string }>();

  if (!user) {
    return c.json({ error: "invalid or expired token" }, 400);
  }

  // Check expiry
  if (new Date(user.invite_expires) < new Date()) {
    // Clear expired token
    await c.env.DB.prepare("UPDATE admins SET invite_token = NULL, invite_expires = NULL WHERE id = ?")
      .bind(user.id)
      .run();
    return c.json({ error: "token has expired, ask an admin to resend the invite" }, 400);
  }

  // Hash password and clear invite token (single-use)
  const passwordHash = await hashPassword(pw);
  await c.env.DB.prepare(
    "UPDATE admins SET password_hash = ?, invite_token = NULL, invite_expires = NULL WHERE id = ?"
  )
    .bind(passwordHash, user.id)
    .run();

  // Auto-login: create JWT + set cookie
  const jwt = await signJwt(
    { sub: user.id, username: user.username, role: user.role, sv: 1 },
    c.env.JWT_SECRET
  );

  setSessionCookie(c, jwt, false);
  return c.json({ username: user.username, role: user.role });
});

// ── Auth middleware for all API routes except login ──

dungeon.use("/api/*", async (c, next) => {
  if (
    c.req.path === "/dungeon/api/login" ||
    c.req.path === "/dungeon/api/logout" ||
    c.req.path === "/dungeon/api/setup-password"
  ) return next();
  const token = getCookieToken(c);
  if (!token) return c.json({ error: "not authenticated" }, 401);
  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ error: "invalid session" }, 401);

  // Re-validate user exists, get current role, and check session_version
  const dbUser = await c.env.DB.prepare("SELECT role, session_version FROM admins WHERE id = ? AND password_hash != 'invite_pending'")
    .bind(payload.sub)
    .first<{ role: string; session_version: number }>();
  if (!dbUser) return c.json({ error: "user no longer exists" }, 401);
  if (payload.sv !== undefined && payload.sv !== dbUser.session_version) {
    clearSessionCookie(c);
    return c.json({ error: "session invalidated" }, 401);
  }
  payload.role = dbUser.role;

  c.set("user" as never, payload);
  await next();
});

dungeon.get("/api/me", (c) => {
  const user = c.get("user" as never) as { sub: number; username: string; role: string };
  return c.json({ id: user.sub, username: user.username, role: user.role });
});

// ── ACL ──

function requireRole(c: any, ...allowed: string[]): Response | null {
  const user = c.get("user" as never) as { role: string };
  if (!allowed.includes(user.role)) {
    return c.json({ error: "forbidden" }, 403);
  }
  return null;
}

// ── Quiz registrations (admin-only) ──

dungeon.get("/api/quiz/registrations", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, email, phone, created_at FROM quiz_registrations ORDER BY created_at DESC"
  ).all();
  return c.json({ registrations: results });
});

// ── Galleries CRUD (admin-only) ──

dungeon.get("/api/galleries", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM galleries ORDER BY date_from DESC"
  ).all();
  return c.json(results);
});

dungeon.post("/api/galleries", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
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
  const denied = requireRole(c, "admin");
  if (denied) return denied;
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
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const id = Number(c.req.param("id"));

  // Delete all R2 objects for this gallery (including thumbnails)
  const { results: photos } = await c.env.DB.prepare(
    "SELECT r2_key, thumb_r2_key, cover_thumb_r2_key FROM gallery_photos WHERE gallery_id = ?"
  )
    .bind(id)
    .all<{ r2_key: string; thumb_r2_key: string | null; cover_thumb_r2_key: string | null }>();

  if (photos.length) {
    const deletes = photos.flatMap((p) => {
      const keys = [p.r2_key];
      if (p.thumb_r2_key) keys.push(p.thumb_r2_key);
      if (p.cover_thumb_r2_key) keys.push(p.cover_thumb_r2_key);
      return keys;
    });
    await Promise.all(deletes.map((k) => c.env.PHOTOS.delete(k)));
  }

  const { meta } = await c.env.DB.prepare("DELETE FROM galleries WHERE id = ?")
    .bind(id)
    .run();
  if (!meta.changes) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});

// ── Gallery Photos ──

dungeon.get("/api/galleries/:id/photos", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const galleryId = Number(c.req.param("id"));
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM gallery_photos WHERE gallery_id = ? ORDER BY sort_order, created_at"
  )
    .bind(galleryId)
    .all();
  return c.json(results);
});

dungeon.post("/api/galleries/:id/photos", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
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

  const arrayBuffer = await file.arrayBuffer();

  // Validate actual file content via magic bytes (don't trust client-declared MIME type)
  const magicBytes = new Uint8Array(arrayBuffer.slice(0, 12));
  if (!isValidImageMagic(magicBytes)) {
    return c.json({ error: "file content does not match an allowed image type" }, 400);
  }

  const uuid = crypto.randomUUID();
  const r2Key = `galleries/${galleryId}/${uuid}.webp`;

  // Handle optional thumbnails (client-generated)
  const thumbFile = formData.get("thumb") as File | null;
  const coverThumbFile = formData.get("cover_thumb") as File | null;
  let thumbR2Key: string | null = null;
  let coverThumbR2Key: string | null = null;

  const uploads: Promise<any>[] = [
    c.env.PHOTOS.put(r2Key, arrayBuffer, { httpMetadata: { contentType: "image/webp" } }),
  ];

  if (thumbFile) {
    thumbR2Key = `galleries/${galleryId}/${uuid}_thumb.webp`;
    uploads.push(c.env.PHOTOS.put(thumbR2Key, await thumbFile.arrayBuffer(), { httpMetadata: { contentType: "image/webp" } }));
  }
  if (coverThumbFile) {
    coverThumbR2Key = `galleries/${galleryId}/${uuid}_cover.webp`;
    uploads.push(c.env.PHOTOS.put(coverThumbR2Key, await coverThumbFile.arrayBuffer(), { httpMetadata: { contentType: "image/webp" } }));
  }

  await Promise.all(uploads);

  const result = await c.env.DB.prepare(
    "INSERT INTO gallery_photos (gallery_id, filename, r2_key, width, height, size_bytes, thumb_r2_key, cover_thumb_r2_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(galleryId, file.name || "photo.webp", r2Key, width, height, arrayBuffer.byteLength, thumbR2Key, coverThumbR2Key)
    .run();

  const row = await c.env.DB.prepare(
    "SELECT * FROM gallery_photos WHERE id = ?"
  )
    .bind(result.meta.last_row_id)
    .first();

  return c.json(row, 201);
});

dungeon.put("/api/galleries/:id/photos/reorder", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
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
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const galleryId = Number(c.req.param("id"));
  const photoId = Number(c.req.param("photoId"));

  const photo = await c.env.DB.prepare(
    "SELECT r2_key, thumb_r2_key, cover_thumb_r2_key FROM gallery_photos WHERE id = ? AND gallery_id = ?"
  )
    .bind(photoId, galleryId)
    .first<{ r2_key: string; thumb_r2_key: string | null; cover_thumb_r2_key: string | null }>();

  if (!photo) return c.json({ error: "not found" }, 404);

  const deletes = [c.env.PHOTOS.delete(photo.r2_key)];
  if (photo.thumb_r2_key) deletes.push(c.env.PHOTOS.delete(photo.thumb_r2_key));
  if (photo.cover_thumb_r2_key) deletes.push(c.env.PHOTOS.delete(photo.cover_thumb_r2_key));
  await Promise.all(deletes);

  await c.env.DB.prepare("DELETE FROM gallery_photos WHERE id = ?")
    .bind(photoId)
    .run();

  return c.json({ ok: true });
});

// Upload thumbnail for existing photo (backfill)
dungeon.put("/api/galleries/:id/photos/:photoId/thumbs", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const galleryId = Number(c.req.param("id"));
  const photoId = Number(c.req.param("photoId"));

  const photo = await c.env.DB.prepare(
    "SELECT r2_key FROM gallery_photos WHERE id = ? AND gallery_id = ?"
  )
    .bind(photoId, galleryId)
    .first<{ r2_key: string }>();
  if (!photo) return c.json({ error: "not found" }, 404);

  const formData = await c.req.formData();
  const thumbFile = formData.get("thumb") as File | null;
  const coverThumbFile = formData.get("cover_thumb") as File | null;

  if (!thumbFile) return c.json({ error: "thumb is required" }, 400);

  // Derive thumb keys from original r2_key
  const base = photo.r2_key.replace(/\.webp$/, "");
  const thumbR2Key = `${base}_thumb.webp`;
  const coverThumbR2Key = coverThumbFile ? `${base}_cover.webp` : null;

  const uploads: Promise<any>[] = [
    c.env.PHOTOS.put(thumbR2Key, await thumbFile.arrayBuffer(), { httpMetadata: { contentType: "image/webp" } }),
  ];
  if (coverThumbFile && coverThumbR2Key) {
    uploads.push(c.env.PHOTOS.put(coverThumbR2Key, await coverThumbFile.arrayBuffer(), { httpMetadata: { contentType: "image/webp" } }));
  }
  await Promise.all(uploads);

  await c.env.DB.prepare(
    "UPDATE gallery_photos SET thumb_r2_key = ?, cover_thumb_r2_key = ? WHERE id = ?"
  ).bind(thumbR2Key, coverThumbR2Key, photoId).run();

  return c.json({ ok: true });
});

// ── Quizzes CRUD ──

dungeon.get("/api/quizzes", async (c) => {
  const denied = requireRole(c, "admin", "quizmaster");
  if (denied) return denied;
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
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const body = await c.req.json<{
    quiz_number?: number;
    date?: string;
    max_participants?: number;
    price?: number;
  }>();
  if (!body.quiz_number || !body.date?.trim() || !body.max_participants || body.price == null) {
    return c.json({ error: "quiz_number, date, max_participants, and price are required" }, 400);
  }
  if (!Number.isInteger(body.quiz_number) || body.quiz_number < 1) {
    return c.json({ error: "quiz_number must be a positive integer" }, 400);
  }
  if (!Number.isInteger(body.max_participants) || body.max_participants < 1) {
    return c.json({ error: "max_participants must be a positive integer" }, 400);
  }
  if (!Number.isFinite(body.price) || body.price < 0) {
    return c.json({ error: "price must be a non-negative number" }, 400);
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
  const denied = requireRole(c, "admin");
  if (denied) return denied;
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
  if (!Number.isInteger(body.quiz_number) || body.quiz_number < 1) {
    return c.json({ error: "quiz_number must be a positive integer" }, 400);
  }
  if (!Number.isInteger(body.max_participants) || body.max_participants < 1) {
    return c.json({ error: "max_participants must be a positive integer" }, 400);
  }
  if (!Number.isFinite(body.price) || body.price < 0) {
    return c.json({ error: "price must be a non-negative number" }, 400);
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
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const id = Number(c.req.param("id"));
  const { meta } = await c.env.DB.prepare("DELETE FROM quizzes WHERE id = ?")
    .bind(id)
    .run();
  if (!meta.changes) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});

// ── Quiz teams (auth-protected) ──

dungeon.get("/api/quizzes/:id/teams", async (c) => {
  const denied = requireRole(c, "admin", "quizmaster");
  if (denied) return denied;
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
  const denied = requireRole(c, "admin");
  if (denied) return denied;
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
  const denied = requireRole(c, "admin");
  if (denied) return denied;
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

  await c.env.DB.prepare(
    "UPDATE quiz_teams SET confirmed_at = ? WHERE id = ?"
  )
    .bind(new Date().toISOString(), teamId)
    .run();

  return c.json({ ok: true });
});

dungeon.put("/api/quizzes/:id/results", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
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
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const teamId = Number(c.req.param("id"));
  const { meta } = await c.env.DB.prepare("DELETE FROM quiz_teams WHERE id = ?")
    .bind(teamId)
    .run();
  if (!meta.changes) return c.json({ error: "team not found" }, 404);
  return c.json({ ok: true });
});

// ── Admin user management (admin-only) ──

dungeon.get("/api/users", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const { results } = await c.env.DB.prepare(
    "SELECT id, username, email, role, staff_type, color, created_at, CASE WHEN password_hash = 'invite_pending' THEN 1 ELSE 0 END AS invite_pending FROM admins ORDER BY created_at"
  ).all();

  // Backfill colors for users that don't have one yet (batched)
  const usedColors = results.filter((u: any) => u.color).map((u: any) => u.color as string);
  const colorUpdates: any[] = [];
  for (const u of results as any[]) {
    if (!u.color) {
      u.color = pickColor(usedColors);
      usedColors.push(u.color);
      colorUpdates.push(c.env.DB.prepare("UPDATE admins SET color = ? WHERE id = ?").bind(u.color, u.id));
    }
  }
  if (colorUpdates.length) await c.env.DB.batch(colorUpdates);

  return c.json(results);
});

dungeon.put("/api/users/:id/role", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{ role?: string }>();
  const validRoles = ["admin", "quizmaster", "staff"];
  if (!body.role || !validRoles.includes(body.role)) {
    return c.json({ error: "role must be one of: admin, quizmaster, staff" }, 400);
  }

  // Prevent removing the last admin
  if (body.role !== "admin") {
    const currentUser = c.get("user" as never) as { sub: number };
    const { results } = await c.env.DB.prepare(
      "SELECT id FROM admins WHERE role = 'admin'"
    ).all();
    const adminIds = results.map((r: any) => r.id);
    if (adminIds.length === 1 && adminIds[0] === id) {
      return c.json({ error: "cannot remove the last admin" }, 400);
    }
  }

  const { meta } = await c.env.DB.prepare(
    "UPDATE admins SET role = ? WHERE id = ?"
  )
    .bind(body.role, id)
    .run();
  if (!meta.changes) return c.json({ error: "user not found" }, 404);
  return c.json({ ok: true });
});

dungeon.delete("/api/users/:id", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const id = Number(c.req.param("id"));
  const currentUser = c.get("user" as never) as { sub: number };

  // Prevent self-deletion
  if (currentUser.sub === id) {
    return c.json({ error: "cannot delete yourself" }, 400);
  }

  const { meta } = await c.env.DB.prepare("DELETE FROM admins WHERE id = ?")
    .bind(id)
    .run();
  if (!meta.changes) return c.json({ error: "user not found" }, 404);
  return c.json({ ok: true });
});

dungeon.post("/api/users", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;

  const body = await c.req.json<{ username?: string; email?: string; role?: string; staff_type?: string | null }>();
  if (!body.username?.trim() || !body.email?.trim()) {
    return c.json({ error: "username and email are required" }, 400);
  }

  const username = body.username.trim().toLowerCase();
  const email = body.email.trim().toLowerCase();
  const validRoles = ["admin", "quizmaster", "staff"];
  const role = validRoles.includes(body.role || "") ? body.role! : "staff";
  const validStaffTypes = ["hookah", "bartender", "both", null];
  const staffType = role === "staff" && validStaffTypes.includes(body.staff_type ?? null)
    ? (body.staff_type ?? null)
    : null;

  if (!/^[a-z0-9_.-]+$/.test(username)) {
    return c.json({ error: "username can only contain lowercase letters, numbers, dots, hyphens, and underscores" }, 400);
  }
  if (username.length < 2 || username.length > 30) {
    return c.json({ error: "username must be 2-30 characters" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: "invalid email address" }, 400);
  }

  // Check for duplicate username
  const existing = await c.env.DB.prepare("SELECT id FROM admins WHERE username = ?")
    .bind(username)
    .first();
  if (existing) {
    return c.json({ error: "username already exists" }, 409);
  }

  // Check for duplicate email
  const existingEmail = await c.env.DB.prepare("SELECT id FROM admins WHERE email = ?")
    .bind(email)
    .first();
  if (existingEmail) {
    return c.json({ error: "email already exists" }, 409);
  }

  // Auto-assign color
  const { results: existingColors } = await c.env.DB.prepare("SELECT color FROM admins WHERE color IS NOT NULL").all();
  const color = pickColor(existingColors.map((r: any) => r.color));

  // Generate secure invite token (32 random bytes → 64 hex chars), store hash in DB
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const inviteToken = [...tokenBytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  const inviteTokenHash = await hashInviteToken(inviteToken);
  const inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Insert user with placeholder password hash (cannot login until password is set)
  const result = await c.env.DB.prepare(
    "INSERT INTO admins (username, password_hash, role, staff_type, email, color, invite_token, invite_expires) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(username, "invite_pending", role, staffType, email, color, inviteTokenHash, inviteExpires)
    .run();

  // Build setup URL
  const origin = new URL(c.req.url).origin;
  const setupUrl = `${origin}/dungeon/setup-password?token=${inviteToken}`;

  await sendEmail(c.env, adminInviteEmail({ username, email, role, setupUrl }));

  const row = await c.env.DB.prepare("SELECT id, username, email, role, staff_type, created_at FROM admins WHERE id = ?")
    .bind(result.meta.last_row_id)
    .first();
  return c.json(row, 201);
});

dungeon.post("/api/users/:id/force-logout", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const id = Number(c.req.param("id"));
  const { meta } = await c.env.DB.prepare(
    "UPDATE admins SET session_version = session_version + 1 WHERE id = ?"
  ).bind(id).run();
  if (!meta.changes) return c.json({ error: "user not found" }, 404);
  return c.json({ ok: true });
});

dungeon.post("/api/users/:id/reinvite", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;

  const id = Number(c.req.param("id"));
  const body = await c.req.json<{ email?: string }>();
  if (!body.email?.trim()) {
    return c.json({ error: "email is required" }, 400);
  }

  const user = await c.env.DB.prepare("SELECT id, username, role, password_hash FROM admins WHERE id = ?")
    .bind(id)
    .first<{ id: number; username: string; role: string; password_hash: string }>();
  if (!user) return c.json({ error: "user not found" }, 404);
  if (user.password_hash !== "invite_pending") {
    return c.json({ error: "user already has a password set" }, 400);
  }

  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const inviteToken = [...tokenBytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  const inviteTokenHash = await hashInviteToken(inviteToken);
  const inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await c.env.DB.prepare("UPDATE admins SET invite_token = ?, invite_expires = ? WHERE id = ?")
    .bind(inviteTokenHash, inviteExpires, id)
    .run();

  const origin = new URL(c.req.url).origin;
  const setupUrl = `${origin}/dungeon/setup-password?token=${inviteToken}`;

  await sendEmail(c.env, adminInviteEmail({
    username: user.username,
    email: body.email.trim().toLowerCase(),
    role: user.role,
    setupUrl,
  }));

  return c.json({ ok: true });
});

// ── Mail catcher (dev only) ──

dungeon.get("/api/mail", (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  if (c.env.ENVIRONMENT !== "development") return c.json([]);
  return c.json(getMailbox());
});

dungeon.delete("/api/mail", (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  clearMailbox();
  return c.json({ ok: true });
});

// ── Settings ──

dungeon.get("/api/settings", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const { results } = await c.env.DB.prepare("SELECT key, value FROM settings").all();
  const settings: Record<string, string> = {};
  for (const r of results as any[]) settings[r.key] = r.value;
  return c.json(settings);
});

const ALLOWED_SETTINGS_KEYS = ["hourly_wage"];

dungeon.put("/api/settings/:key", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const key = c.req.param("key");
  if (!ALLOWED_SETTINGS_KEYS.includes(key)) {
    return c.json({ error: "unknown setting key" }, 400);
  }
  const body = await c.req.json<{ value?: string }>();
  if (body.value === undefined || body.value === null) {
    return c.json({ error: "value is required" }, 400);
  }
  await c.env.DB.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).bind(key, String(body.value)).run();
  return c.json({ ok: true });
});

// Public setting for hourly wage (staff can read)
dungeon.get("/api/settings/hourly-wage", async (c) => {
  const denied = requireRole(c, "admin", "staff", "quizmaster");
  if (denied) return denied;
  const row = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'hourly_wage'").first<{ value: string }>();
  return c.json({ hourly_wage: row ? Number(row.value) : null });
});

// ── Shifts ──

dungeon.get("/api/shifts/staff", async (c) => {
  const denied = requireRole(c, "admin", "staff");
  if (denied) return denied;
  const { results } = await c.env.DB.prepare(
    "SELECT id, username, staff_type, color FROM admins WHERE role IN ('admin', 'staff') ORDER BY username"
  ).all();
  return c.json(results);
});

dungeon.put("/api/users/:id/staff-type", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{ staff_type?: string | null }>();
  const valid = ["hookah", "bartender", "both", null];
  if (!valid.includes(body.staff_type ?? null)) {
    return c.json({ error: "staff_type must be one of: hookah, bartender, both, or null" }, 400);
  }
  const { meta } = await c.env.DB.prepare("UPDATE admins SET staff_type = ? WHERE id = ?")
    .bind(body.staff_type ?? null, id)
    .run();
  if (!meta.changes) return c.json({ error: "user not found" }, 404);
  return c.json({ ok: true });
});

dungeon.put("/api/users/:id/color", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{ color?: string }>();
  if (!body.color || !/^#[0-9a-fA-F]{6}$/.test(body.color)) {
    return c.json({ error: "color must be a valid hex color (e.g. #e06030)" }, 400);
  }
  const { meta } = await c.env.DB.prepare("UPDATE admins SET color = ? WHERE id = ?")
    .bind(body.color.toLowerCase(), id)
    .run();
  if (!meta.changes) return c.json({ error: "user not found" }, 404);
  return c.json({ ok: true });
});

dungeon.get("/api/shifts/:year/:month", async (c) => {
  const denied = requireRole(c, "admin", "staff");
  if (denied) return denied;
  const year = Number(c.req.param("year"));
  const month = Number(c.req.param("month"));
  if (!year || !month || month < 1 || month > 12) {
    return c.json({ error: "invalid year/month" }, 400);
  }

  const monthStr = String(month).padStart(2, "0");
  const prefix = `${year}-${monthStr}-`;

  // Get all shifts for this month
  const { results: shifts } = await c.env.DB.prepare(
    `SELECT s.date, s.hookah_user_id, s.bar_user_id,
       h.username AS hookah_username, h.color AS hookah_color,
       b.username AS bar_username, b.color AS bar_color
     FROM shifts s
     LEFT JOIN admins h ON h.id = s.hookah_user_id
     LEFT JOIN admins b ON b.id = s.bar_user_id
     WHERE s.date LIKE ?`
  ).bind(prefix + "%").all();

  // Get all availability for this month
  const { results: avail } = await c.env.DB.prepare(
    `SELECT sa.date, sa.user_id, sa.status, a.username, a.color
     FROM shift_availability sa
     JOIN admins a ON a.id = sa.user_id
     WHERE sa.date LIKE ?`
  ).bind(prefix + "%").all();

  // Build days
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: any[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${monthStr}-${String(d).padStart(2, "0")}`;
    const dow = new Date(year, month - 1, d).getDay(); // 0=Sun

    const shift = shifts.find((s: any) => s.date === dateStr) as any;
    const dayAvail = avail.filter((a: any) => a.date === dateStr);

    days.push({
      date: dateStr,
      day_of_week: dow,
      hookah: shift?.hookah_user_id ? { id: shift.hookah_user_id, username: shift.hookah_username, color: shift.hookah_color } : null,
      bar: shift?.bar_user_id ? { id: shift.bar_user_id, username: shift.bar_username, color: shift.bar_color } : null,
      available: dayAvail.filter((a: any) => a.status === "available").map((a: any) => ({ id: a.user_id, username: a.username, color: a.color })),
      unavailable: dayAvail.filter((a: any) => a.status === "unavailable").map((a: any) => ({ id: a.user_id, username: a.username, color: a.color })),
      helper: dayAvail.filter((a: any) => a.status === "helper").map((a: any) => ({ id: a.user_id, username: a.username, color: a.color })),
    });
  }

  return c.json({ year, month, days });
});

dungeon.put("/api/shifts/:date", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;
  const date = c.req.param("date");
  if (!isValidDate(date)) return c.json({ error: "invalid date" }, 400);

  // Block Mondays
  const dow = new Date(date + "T00:00:00").getDay();
  if (dow === 1) return c.json({ error: "Monday is closed" }, 400);

  const body = await c.req.json<{ hookah_user_id?: number | null; bar_user_id?: number | null }>();

  // Validate staff types if set
  if (body.hookah_user_id) {
    const user = await c.env.DB.prepare("SELECT staff_type FROM admins WHERE id = ?").bind(body.hookah_user_id).first<{ staff_type: string }>();
    if (!user || !["hookah", "both"].includes(user.staff_type)) {
      return c.json({ error: "user is not qualified for hookah position" }, 400);
    }
  }
  if (body.bar_user_id) {
    const user = await c.env.DB.prepare("SELECT staff_type FROM admins WHERE id = ?").bind(body.bar_user_id).first<{ staff_type: string }>();
    if (!user || !["bartender", "both"].includes(user.staff_type)) {
      return c.json({ error: "user is not qualified for bar position" }, 400);
    }
  }

  // Same person can't be on two positions
  if (body.hookah_user_id && body.bar_user_id && body.hookah_user_id === body.bar_user_id) {
    return c.json({ error: "Stejný člověk nemůže být na dvou pozicích najednou" }, 400);
  }

  // Check hookah user isn't helper that day
  if (body.hookah_user_id) {
    const h = await c.env.DB.prepare("SELECT id FROM shift_availability WHERE date = ? AND user_id = ? AND status = 'helper'").bind(date, body.hookah_user_id).first();
    if (h) return c.json({ error: "Tento člověk je na tento den zapsaný jako výpomoc" }, 400);
  }
  // Check bar user isn't helper that day
  if (body.bar_user_id) {
    const h = await c.env.DB.prepare("SELECT id FROM shift_availability WHERE date = ? AND user_id = ? AND status = 'helper'").bind(date, body.bar_user_id).first();
    if (h) return c.json({ error: "Tento člověk je na tento den zapsaný jako výpomoc" }, 400);
  }

  // Check who was previously assigned – remove their shift_logs if unassigned
  const prev = await c.env.DB.prepare("SELECT hookah_user_id, bar_user_id FROM shifts WHERE date = ?")
    .bind(date).first<{ hookah_user_id: number | null; bar_user_id: number | null }>();

  const removedUserIds: number[] = [];
  if (prev) {
    if (prev.hookah_user_id && prev.hookah_user_id !== (body.hookah_user_id ?? null)) {
      removedUserIds.push(prev.hookah_user_id);
    }
    if (prev.bar_user_id && prev.bar_user_id !== (body.bar_user_id ?? null)) {
      removedUserIds.push(prev.bar_user_id);
    }
  }

  // Upsert
  await c.env.DB.prepare(
    `INSERT INTO shifts (date, hookah_user_id, bar_user_id)
     VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET hookah_user_id = excluded.hookah_user_id, bar_user_id = excluded.bar_user_id`
  ).bind(date, body.hookah_user_id ?? null, body.bar_user_id ?? null).run();

  // Delete shift logs for removed users
  for (const uid of removedUserIds) {
    await c.env.DB.prepare("DELETE FROM shift_logs WHERE date = ? AND user_id = ?")
      .bind(date, uid).run();
  }

  return c.json({ ok: true });
});

dungeon.put("/api/shifts/:date/self-assign", async (c) => {
  const denied = requireRole(c, "admin", "staff");
  if (denied) return denied;
  const date = c.req.param("date");
  if (!isValidDate(date)) return c.json({ error: "invalid date" }, 400);

  const dow = new Date(date + "T00:00:00").getDay();
  if (dow === 1) return c.json({ error: "Monday is closed" }, 400);

  const currentUser = c.get("user" as never) as { sub: number; role: string };
  const body = await c.req.json<{ position: string; remove?: boolean }>();

  if (!["hookah", "bar"].includes(body.position)) {
    return c.json({ error: "position must be hookah or bar" }, 400);
  }

  // Get current shift to preserve the other position
  const existing = await c.env.DB.prepare("SELECT hookah_user_id, bar_user_id FROM shifts WHERE date = ?")
    .bind(date).first<{ hookah_user_id: number | null; bar_user_id: number | null }>();

  // Staff cannot modify past/today shifts
  if (currentUser.role === "staff") {
    const today = new Date().toISOString().slice(0, 10);
    if (date <= today) {
      return c.json({ error: "Nemůžeš měnit směny, které už proběhly nebo probíhají" }, 400);
    }
  }

  if (body.remove) {
    // Can only remove self
    if (body.position === "hookah" && existing?.hookah_user_id !== currentUser.sub) {
      return c.json({ error: "you are not assigned to this position" }, 400);
    }
    if (body.position === "bar" && existing?.bar_user_id !== currentUser.sub) {
      return c.json({ error: "you are not assigned to this position" }, 400);
    }
  } else {
    // Verify staff_type qualification
    const user = await c.env.DB.prepare("SELECT staff_type FROM admins WHERE id = ?")
      .bind(currentUser.sub).first<{ staff_type: string }>();
    if (!user) return c.json({ error: "user not found" }, 404);

    if (body.position === "hookah" && !["hookah", "both"].includes(user.staff_type)) {
      return c.json({ error: "not qualified for hookah position" }, 403);
    }
    if (body.position === "bar" && !["bartender", "both"].includes(user.staff_type)) {
      return c.json({ error: "not qualified for bar position" }, 403);
    }

    // Check not already on other position or helper
    const otherPos = body.position === "hookah" ? "bar_user_id" : "hookah_user_id";
    if (existing && (existing as any)[otherPos] === currentUser.sub) {
      return c.json({ error: "Už jsi zapsaný na jinou pozici v tento den" }, 400);
    }
    const helperCheck = await c.env.DB.prepare(
      "SELECT id FROM shift_availability WHERE date = ? AND user_id = ? AND status = 'helper'"
    ).bind(date, currentUser.sub).first();
    if (helperCheck) {
      return c.json({ error: "Už jsi zapsaný jako výpomoc v tento den" }, 400);
    }
  }

  const hookah = body.position === "hookah"
    ? (body.remove ? null : currentUser.sub)
    : (existing?.hookah_user_id ?? null);
  const bar = body.position === "bar"
    ? (body.remove ? null : currentUser.sub)
    : (existing?.bar_user_id ?? null);

  await c.env.DB.prepare(
    `INSERT INTO shifts (date, hookah_user_id, bar_user_id)
     VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET hookah_user_id = excluded.hookah_user_id, bar_user_id = excluded.bar_user_id`
  ).bind(date, hookah, bar).run();

  return c.json({ ok: true });
});

dungeon.put("/api/shifts/:date/availability", async (c) => {
  const denied = requireRole(c, "admin", "staff");
  if (denied) return denied;
  const date = c.req.param("date");
  if (!isValidDate(date)) return c.json({ error: "invalid date" }, 400);

  const dow = new Date(date + "T00:00:00").getDay();
  if (dow === 1) return c.json({ error: "Monday is closed" }, 400);

  const body = await c.req.json<{ user_id?: number; status?: string | null }>();
  if (!body.user_id) return c.json({ error: "user_id is required" }, 400);

  const currentUser = c.get("user" as never) as { sub: number; role: string };

  // Staff can only set their own availability
  if (currentUser.role === "staff" && currentUser.sub !== body.user_id) {
    return c.json({ error: "forbidden" }, 403);
  }

  // Staff cannot modify availability for past/today shifts
  if (currentUser.role === "staff") {
    const today = new Date().toISOString().slice(0, 10);
    if (date <= today) {
      return c.json({ error: "Nemůžeš měnit dostupnost u směn, které už proběhly nebo probíhají" }, 400);
    }
  }

  // Check if user is already assigned to a shift (hookah/bar/helper) this day
  const assignedShift = await c.env.DB.prepare("SELECT hookah_user_id, bar_user_id FROM shifts WHERE date = ?").bind(date).first<{ hookah_user_id: number | null; bar_user_id: number | null }>();
  const isOnShift = assignedShift && (assignedShift.hookah_user_id === body.user_id || assignedShift.bar_user_id === body.user_id);
  const isHelper = await c.env.DB.prepare("SELECT id FROM shift_availability WHERE date = ? AND user_id = ? AND status = 'helper'").bind(date, body.user_id).first();

  if (isOnShift || isHelper) {
    return c.json({ error: "Tento člověk je na tento den již zapsaný na směně" }, 400);
  }

  if (body.status === null || body.status === undefined) {
    // Remove availability
    await c.env.DB.prepare("DELETE FROM shift_availability WHERE date = ? AND user_id = ?")
      .bind(date, body.user_id).run();
  } else {
    if (!["available", "unavailable", "helper"].includes(body.status)) {
      return c.json({ error: "status must be available, unavailable, or helper" }, 400);
    }
    if (body.status === "helper" && dow !== 5 && dow !== 6) {
      return c.json({ error: "helper is only available on Friday and Saturday" }, 400);
    }
    await c.env.DB.prepare(
      `INSERT INTO shift_availability (date, user_id, status)
       VALUES (?, ?, ?)
       ON CONFLICT(date, user_id) DO UPDATE SET status = excluded.status`
    ).bind(date, body.user_id, body.status).run();
  }

  return c.json({ ok: true });
});

// ── Shift Logs ──

function getDefaultShiftTimes(dow: number): { from: string; to: string } | null {
  if (dow === 1) return null; // Monday closed
  if (dow === 5 || dow === 6) return { from: "16:30", to: "02:00" };
  return { from: "16:30", to: "22:00" };
}

dungeon.get("/api/shift-logs/month/:year/:month", async (c) => {
  const denied = requireRole(c, "admin", "staff");
  if (denied) return denied;
  const userId = (c.get as any)("user").sub;
  const year = Number(c.req.param("year"));
  const month = Number(c.req.param("month"));
  if (!year || !month || month < 1 || month > 12) {
    return c.json({ error: "invalid year/month" }, 400);
  }

  const prefix = `${year}-${String(month).padStart(2, "0")}-%`;

  // Parallel fetch: assigned shifts, helper availability, and logged shifts
  const [{ results: shiftRows }, { results: helperRows }, { results: logRows }] = await Promise.all([
    c.env.DB.prepare(
      "SELECT date FROM shifts WHERE date LIKE ? AND (hookah_user_id = ? OR bar_user_id = ?)"
    ).bind(prefix, userId, userId).all(),
    c.env.DB.prepare(
      "SELECT date FROM shift_availability WHERE date LIKE ? AND user_id = ? AND status = 'helper'"
    ).bind(prefix, userId).all(),
    c.env.DB.prepare(
      "SELECT date FROM shift_logs WHERE date LIKE ? AND user_id = ?"
    ).bind(prefix, userId).all(),
  ]);

  const assigned = new Set<string>();
  for (const r of shiftRows as any[]) assigned.add(r.date);
  for (const r of helperRows as any[]) assigned.add(r.date);

  const logged = new Set<string>();
  for (const r of logRows as any[]) logged.add(r.date);

  return c.json({
    assigned: [...assigned],
    logged: [...logged],
  });
});

dungeon.get("/api/shift-logs/:date", async (c) => {
  const denied = requireRole(c, "admin", "staff");
  if (denied) return denied;
  const date = c.req.param("date");
  if (!isValidDate(date)) return c.json({ error: "invalid date" }, 400);

  const userId = (c.get as any)("user").sub;

  // Parallel fetch: shift assignment, helper status, existing log
  const [shift, helper, log] = await Promise.all([
    c.env.DB.prepare(
      "SELECT hookah_user_id, bar_user_id FROM shifts WHERE date = ?"
    ).bind(date).first<{ hookah_user_id: number | null; bar_user_id: number | null }>(),
    c.env.DB.prepare(
      "SELECT id FROM shift_availability WHERE date = ? AND user_id = ? AND status = 'helper'"
    ).bind(date, userId).first(),
    c.env.DB.prepare(
      "SELECT time_from, time_to, note, created_at FROM shift_logs WHERE date = ? AND user_id = ?"
    ).bind(date, userId).first<{ time_from: string; time_to: string; note: string; created_at: string }>(),
  ]);

  let position: string | null = null;
  if (shift?.hookah_user_id === userId) position = "hookah";
  else if (shift?.bar_user_id === userId) position = "bar";
  else if (helper) position = "helper";

  return c.json({ assigned: position !== null, position, log: log || null });
});

dungeon.post("/api/shift-logs", async (c) => {
  const denied = requireRole(c, "admin", "staff");
  if (denied) return denied;

  const userId = (c.get as any)("user").sub;
  const body = await c.req.json<{ date: string; time_from: string; time_to: string; note?: string }>();

  if (!body.date || !isValidDate(body.date)) return c.json({ error: "invalid date" }, 400);
  if (!body.time_from || !body.time_to) return c.json({ error: "time_from and time_to are required" }, 400);
  if (!/^\d{2}:\d{2}$/.test(body.time_from) || !/^\d{2}:\d{2}$/.test(body.time_to)) {
    return c.json({ error: "invalid time format (expected HH:MM)" }, 400);
  }

  const dow = new Date(body.date + "T00:00:00").getDay();
  if (dow === 1) return c.json({ error: "Monday is closed" }, 400);

  // Parallel check: assignment + duplicate log
  const [shift, helper, existing] = await Promise.all([
    c.env.DB.prepare(
      "SELECT hookah_user_id, bar_user_id FROM shifts WHERE date = ?"
    ).bind(body.date).first<{ hookah_user_id: number | null; bar_user_id: number | null }>(),
    c.env.DB.prepare(
      "SELECT id FROM shift_availability WHERE date = ? AND user_id = ? AND status = 'helper'"
    ).bind(body.date, userId).first(),
    c.env.DB.prepare(
      "SELECT id FROM shift_logs WHERE date = ? AND user_id = ?"
    ).bind(body.date, userId).first(),
  ]);

  const isAssigned = (shift?.hookah_user_id === userId) || (shift?.bar_user_id === userId) || !!helper;
  if (!isAssigned) return c.json({ error: "not assigned to this day" }, 403);
  if (existing) return c.json({ error: "shift already logged for this day" }, 409);

  // Check if note required (times differ from default)
  const defaults = getDefaultShiftTimes(dow);
  if (defaults && (body.time_from !== defaults.from || body.time_to !== defaults.to)) {
    if (!body.note || !body.note.trim()) {
      return c.json({ error: "note is required when times differ from schedule" }, 400);
    }
  }

  await c.env.DB.prepare(
    "INSERT INTO shift_logs (date, user_id, time_from, time_to, note) VALUES (?, ?, ?, ?, ?)"
  ).bind(body.date, userId, body.time_from, body.time_to, body.note?.trim() || "").run();

  return c.json({ ok: true });
});

// ── Shift Overview ──

dungeon.get("/api/shifts/overview", async (c) => {
  const denied = requireRole(c, "admin", "staff");
  if (denied) return denied;

  const authUser = (c.get as any)("user");
  const isAdmin = authUser.role === "admin";
  let targetUserId = authUser.sub;

  // Admin can view any user's overview
  const qUserId = c.req.query("user_id");
  if (qUserId) {
    if (!isAdmin) return c.json({ error: "forbidden" }, 403);
    targetUserId = Number(qUserId);
  }

  const today = new Date().toISOString().slice(0, 10);

  // Upcoming shifts: next 10 days (today inclusive), where user is assigned
  const futureLimit = new Date();
  futureLimit.setDate(futureLimit.getDate() + 10);
  const futureLimitStr = futureLimit.toISOString().slice(0, 10);

  const [
    { results: upcomingShifts },
    { results: upcomingHelper },
    { results: pastShifts },
    { results: pastHelper },
    { results: logs },
    wageRow,
  ] = await Promise.all([
    c.env.DB.prepare(
      `SELECT s.date,
              CASE WHEN s.hookah_user_id = ? THEN 'hookah' ELSE 'bar' END as position
       FROM shifts s
       WHERE s.date >= ? AND s.date <= ?
         AND (s.hookah_user_id = ? OR s.bar_user_id = ?)
       ORDER BY s.date ASC`
    ).bind(targetUserId, today, futureLimitStr, targetUserId, targetUserId).all(),
    c.env.DB.prepare(
      `SELECT date FROM shift_availability
       WHERE user_id = ? AND status = 'helper' AND date >= ? AND date <= ?
       ORDER BY date ASC`
    ).bind(targetUserId, today, futureLimitStr).all(),
    c.env.DB.prepare(
      `SELECT s.date,
              CASE WHEN s.hookah_user_id = ? THEN 'hookah' ELSE 'bar' END as position
       FROM shifts s
       WHERE s.date < ?
         AND (s.hookah_user_id = ? OR s.bar_user_id = ?)
       ORDER BY s.date DESC`
    ).bind(targetUserId, today, targetUserId, targetUserId).all(),
    c.env.DB.prepare(
      `SELECT date FROM shift_availability
       WHERE user_id = ? AND status = 'helper' AND date < ?
       ORDER BY date DESC`
    ).bind(targetUserId, today).all(),
    c.env.DB.prepare(
      `SELECT date, time_from, time_to, note FROM shift_logs
       WHERE user_id = ? ORDER BY date DESC`
    ).bind(targetUserId).all(),
    c.env.DB.prepare("SELECT value FROM settings WHERE key = 'hourly_wage'").first<{ value: string }>(),
  ]);

  // Merge upcoming
  const upcoming: any[] = [];
  for (const s of upcomingShifts as any[]) {
    upcoming.push({ date: s.date, position: s.position });
  }
  for (const h of upcomingHelper as any[]) {
    if (!upcoming.find((u: any) => u.date === h.date)) {
      upcoming.push({ date: (h as any).date, position: "helper" });
    }
  }
  upcoming.sort((a: any, b: any) => a.date.localeCompare(b.date));

  // Merge past
  const past: any[] = [];
  const logsMap = new Map<string, any>();
  for (const l of logs as any[]) logsMap.set(l.date, l);

  for (const s of pastShifts as any[]) {
    past.push({ date: s.date, position: s.position, log: logsMap.get(s.date) || null });
  }
  for (const h of pastHelper as any[]) {
    if (!past.find((p: any) => p.date === (h as any).date)) {
      past.push({ date: (h as any).date, position: "helper", log: logsMap.get((h as any).date) || null });
    }
  }
  past.sort((a: any, b: any) => a.date.localeCompare(b.date));

  // Summary: count from logged shifts
  let totalShifts = 0;
  let totalMinutes = 0;
  for (const l of logs as any[]) {
    totalShifts++;
    const [fH, fM] = l.time_from.split(":").map(Number);
    const [tH, tM] = l.time_to.split(":").map(Number);
    let mins = (tH * 60 + tM) - (fH * 60 + fM);
    if (mins <= 0) mins += 1440;
    totalMinutes += mins;
  }

  const hourlyWage = wageRow ? Number(wageRow.value) : 0;

  return c.json({
    upcoming,
    past,
    summary: {
      total_shifts: totalShifts,
      total_hours: Math.round(totalMinutes / 6) / 10, // 1 decimal
      total_earnings: hourlyWage > 0 ? Math.round((totalMinutes / 60) * hourlyWage) : null,
      hourly_wage: hourlyWage,
    },
  });
});

// ── Oběžníky (newsletter preview) ──

dungeon.get("/api/newsletters/monthly-summary/preview", async (c) => {
  const denied = requireRole(c, "admin");
  if (denied) return denied;

  // Generate preview with sample data
  const msg = monthlyShiftSummaryEmail({
    username: "Pepa",
    email: "pepa@example.com",
    monthName: "Únor",
    year: 2026,
    totalShifts: 12,
    totalHours: 89.5,
    earnings: 12530,
    hourlyWage: 140,
    unloggedDates: ["2026-02-14", "2026-02-21"],
  });

  return c.json({ subject: msg.subject, html: msg.html });
});

// ── Setup password landing page (public) ──

const setupPasswordHtml = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Nastavení hesla – SPiRiT Dungeon</title>
  <link rel="icon" href="/img/favicon/favicon.ico">
  <link rel="stylesheet" href="/dungeon/style.css">
  <style>
    .setup-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(ellipse 60% 60% at 50% 40%, rgba(38,53,212,.12) 0%, transparent 70%), #020408; }
    .setup-card { width: 100%; max-width: 420px; padding: 2.5rem 2rem; background: #060b16; border: 1px solid rgba(0,207,255,.1); border-radius: 12px; text-align: center; }
    .setup-card h1 { font-size: 1.3rem; margin-bottom: .5rem; color: #fff; }
    .setup-card .subtitle { font-size: .85rem; color: #4a6080; margin-bottom: 2rem; }
    .setup-card .form-group { text-align: left; margin-bottom: 1rem; }
    .setup-card .form-group label { display: block; font-size: .75rem; letter-spacing: .1em; text-transform: uppercase; color: #4a6080; margin-bottom: .4rem; }
    .setup-card .form-group input { width: 100%; padding: .75rem 1rem; background: #0a1020; border: 1px solid rgba(0,207,255,.15); border-radius: 8px; color: #dde5f5; font-size: .9rem; font-family: inherit; outline: none; transition: border-color .2s; }
    .setup-card .form-group input:focus { border-color: #00cfff; box-shadow: 0 0 0 3px rgba(0,207,255,.1); }
    .strength-bar { height: 4px; border-radius: 2px; background: #10192e; margin-top: .5rem; overflow: hidden; }
    .strength-bar-fill { height: 100%; width: 0; border-radius: 2px; transition: width .3s, background .3s; }
    .strength-checks { display: flex; flex-wrap: wrap; gap: .3rem .8rem; margin-top: .6rem; }
    .strength-check { font-size: .72rem; color: #4a6080; transition: color .2s; }
    .strength-check.pass { color: #00cfff; }
    .setup-btn { width: 100%; padding: .85rem; margin-top: 1rem; background: linear-gradient(135deg, #2635d4, #00cfff); color: #fff; border: none; border-radius: 100px; font-size: .82rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; font-family: inherit; transition: .25s; }
    .setup-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,207,255,.35); filter: brightness(1.1); }
    .setup-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; box-shadow: none; filter: none; }
    .setup-error { margin-top: 1rem; font-size: .82rem; color: #d05560; min-height: 1.2em; }
    .setup-success { text-align: center; }
    .setup-success .check { font-size: 3rem; margin-bottom: 1rem; }
    .setup-success p { color: #ccc; margin-bottom: 1.5rem; }
    .setup-expired { text-align: center; padding: 2rem 0; }
    .setup-expired .icon { font-size: 3rem; margin-bottom: 1rem; }
    .setup-expired p { color: #4a6080; }
    .password-wrap { position: relative; }
    .password-wrap input { padding-right: 2.8rem; }
    .pw-toggle { position: absolute; right: .6rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #4a6080; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; transition: color .2s; }
    .pw-toggle:hover { color: #00cfff; }
  </style>
</head>
<body>
  <div class="setup-wrap">
    <div class="setup-card" id="setup-card">
      <div style="text-align:center;color:#4a6080;">Načítání…</div>
    </div>
  </div>
  <script>
  (function() {
    const card = document.getElementById("setup-card");
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      card.innerHTML = '<div class="setup-expired"><div class="icon">&#x26A0;&#xFE0F;</div><h1>Neplatný odkaz</h1><p>Odkaz pro nastavení hesla je neplatný.</p></div>';
      return;
    }

    const eyeOpenSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    const eyeClosedSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

    card.innerHTML =
      '<img src="/img/logo/logo_white_png.png" alt="SPiRiT" style="height:48px;margin-bottom:.5rem;">' +
      '<h1>Nastavení hesla</h1>' +
      '<p class="subtitle">Zvol si heslo pro přístup do Dungeonu</p>' +
      '<form id="setup-form">' +
        '<div class="form-group">' +
          '<label for="pw1">Heslo</label>' +
          '<div class="password-wrap">' +
            '<input type="password" id="pw1" autocomplete="new-password" required>' +
            '<button type="button" class="pw-toggle" data-target="pw1">' + eyeOpenSvg + '</button>' +
          '</div>' +
          '<div class="strength-bar"><div class="strength-bar-fill" id="strength-fill"></div></div>' +
          '<div class="strength-checks" id="strength-checks">' +
            '<span class="strength-check" data-rule="len">Min. 8 znaků</span>' +
            '<span class="strength-check" data-rule="lower">Malé písmeno</span>' +
            '<span class="strength-check" data-rule="upper">Velké písmeno</span>' +
            '<span class="strength-check" data-rule="num">Číslo</span>' +
            '<span class="strength-check" data-rule="special">Speciální znak</span>' +
          '</div>' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="pw2">Heslo znovu</label>' +
          '<div class="password-wrap">' +
            '<input type="password" id="pw2" autocomplete="new-password" required>' +
            '<button type="button" class="pw-toggle" data-target="pw2">' + eyeOpenSvg + '</button>' +
          '</div>' +
        '</div>' +
        '<button type="submit" class="setup-btn" id="setup-btn" disabled>Nastavit heslo</button>' +
        '<div class="setup-error" id="setup-error"></div>' +
      '</form>';

    var pw1 = document.getElementById("pw1");
    var pw2 = document.getElementById("pw2");
    var fill = document.getElementById("strength-fill");
    var checks = document.getElementById("strength-checks");
    var btn = document.getElementById("setup-btn");
    var errorEl = document.getElementById("setup-error");

    // Toggle password visibility
    document.querySelectorAll(".pw-toggle").forEach(function(toggle) {
      toggle.addEventListener("click", function() {
        var input = document.getElementById(toggle.dataset.target);
        var isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        toggle.innerHTML = isHidden ? eyeClosedSvg : eyeOpenSvg;
      });
    });

    function checkStrength(pw) {
      var rules = {
        len: pw.length >= 8,
        lower: /[a-z]/.test(pw),
        upper: /[A-Z]/.test(pw),
        num: /[0-9]/.test(pw),
        special: /[^a-zA-Z0-9]/.test(pw)
      };
      var passed = 0;
      for (var k in rules) {
        var el = checks.querySelector("[data-rule='" + k + "']");
        if (rules[k]) { el.classList.add("pass"); passed++; }
        else { el.classList.remove("pass"); }
      }
      var pct = (passed / 5) * 100;
      fill.style.width = pct + "%";
      fill.style.background = passed <= 2 ? "#d05560" : passed <= 3 ? "#e0a030" : passed <= 4 ? "#00cfff" : "#34d399";
      return passed === 5;
    }

    function validate() {
      var allPass = checkStrength(pw1.value);
      var match = pw1.value && pw2.value && pw1.value === pw2.value;
      btn.disabled = !(allPass && match);
      if (pw2.value && !match) {
        pw2.style.borderColor = "#d05560";
      } else if (match) {
        pw2.style.borderColor = "#00cfff";
      } else {
        pw2.style.borderColor = "";
      }
    }

    pw1.addEventListener("input", validate);
    pw2.addEventListener("input", validate);

    document.getElementById("setup-form").addEventListener("submit", async function(e) {
      e.preventDefault();
      errorEl.textContent = "";
      btn.disabled = true;
      btn.textContent = "Nastavuji…";

      try {
        var res = await fetch("/dungeon/api/setup-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token, password: pw1.value })
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");

        card.innerHTML =
          '<div class="setup-success">' +
            '<div class="check">&#x2705;</div>' +
            '<h1>Heslo nastaveno!</h1>' +
            '<p>Za chvíli budeš přesměrován/a do Dungeonu…</p>' +
          '</div>';
        setTimeout(function() { location.href = "/dungeon"; }, 1500);
      } catch (err) {
        var msg = err.message;
        if (msg.includes("expired")) msg = "Platnost odkazu vypršela. Požádej admina o novou pozvánku.";
        else if (msg.includes("invalid")) msg = "Neplatný odkaz. Možná už byl použit.";
        errorEl.textContent = msg;
        btn.disabled = false;
        btn.textContent = "Nastavit heslo";
      }
    });
  })();
  </script>
</body>
</html>`;

dungeon.get("/setup-password", (c) => {
  return c.html(setupPasswordHtml);
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
