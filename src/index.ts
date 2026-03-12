import { Hono } from "hono";
import { cors } from "hono/cors";
import { api } from "./routes/api";
import { dungeon } from "./routes/dungeon";
import { createGalerie } from "./routes/galerie";
import { createKviz } from "./routes/kviz";
import { createAkce } from "./routes/akce";
import { errorPage } from "./lib/layout";
import { sendEmail, monthlyShiftSummaryEmail } from "./lib/email";

type Bindings = {
  DB: D1Database;
  ASSETS: Fetcher;
  PHOTOS: R2Bucket;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  ENVIRONMENT?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ── Security headers ──
app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  c.res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Dungeon setup-password has inline scripts; use 'unsafe-inline' fallback there
  const isDungeonSetup = c.req.path === "/dungeon/setup-password";
  const scriptSrc = isDungeonSetup
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' https://unpkg.com/leaflet@1.9.4/";
  c.res.headers.set("Content-Security-Policy",
    "default-src 'self'; " +
    scriptSrc + "; " +
    "style-src 'self' 'unsafe-inline' https://unpkg.com/leaflet@1.9.4/ https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https://spirit-bar.cz https://*.basemaps.cartocdn.com https://basemaps.cartocdn.com https://*.tile.openstreetmap.org; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );
});

app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      if (!origin) return "https://spirit-bar.cz";
      const allowed = [
        "https://spirit-bar.cz",
        "https://www.spirit-bar.cz",
        "http://localhost:8787",
      ];
      return allowed.includes(origin) ? origin : "https://spirit-bar.cz";
    },
  })
);
// Redirect legacy ?lang=XX query params to path-based language prefixes
app.use("*", async (c, next) => {
  const lang = c.req.query("lang");
  if (lang) {
    const url = new URL(c.req.url);
    url.searchParams.delete("lang");
    const normalizedLang = lang.toLowerCase();
    if (normalizedLang === "cs") {
      // Czech is default, just strip the param
      return c.redirect(url.pathname + url.search, 301);
    }
    const supported = ["en", "de", "pl", "sigma"];
    if (supported.includes(normalizedLang)) {
      // Prepend language prefix to path
      const path = url.pathname === "/" ? "" : url.pathname;
      url.pathname = `/${normalizedLang}${path}`;
      return c.redirect(url.pathname + url.search, 301);
    }
    // Unknown language – strip the param and continue
    return c.redirect(url.pathname + url.search, 301);
  }
  return next();
});

app.route("/api", api);
app.route("/dungeon", dungeon);

// Default (Czech) routes
app.route("/galerie", createGalerie(""));
app.route("/kviz", createKviz(""));
app.route("/akce", createAkce(""));

// Language-prefixed routes
const LANGS = ["en", "de", "pl", "sigma"] as const;
for (const lang of LANGS) {
  // Homepage: /:lang and /:lang/ → serve index.html via ASSETS
  const serveLangHome = async (c: any) => {
    const url = new URL(c.req.url);
    url.pathname = "/index.html";
    const res = await c.env.ASSETS.fetch(new Request(url));
    return new Response(res.body, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  };
  app.get(`/${lang}`, serveLangHome);
  app.get(`/${lang}/`, serveLangHome);

  // Subpages: /:lang/galerie, /:lang/kviz
  app.route(`/${lang}/galerie`, createGalerie(`/${lang}`));
  app.route(`/${lang}/kviz`, createKviz(`/${lang}`));
  app.route(`/${lang}/akce`, createAkce(`/${lang}`));
}

// Catch-all: let CF Assets handle static files; if nothing matched, 404
app.all("*", (c) => {
  const match = c.req.path.match(/^\/(en|de|pl|sigma)(\/|$)/);
  const lp = match ? `/${match[1]}` : "";
  return c.html(errorPage(404, lp), 404);
});

// ── Cron: monthly shift summary emails (1st of each month at 8:00 CET) ──

const CZECH_MONTH_NAMES = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
];

async function handleMonthlyShiftSummary(env: Bindings) {
  // Previous month
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // 1-12
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prefix = `${prevYear}-${String(prevMonth).padStart(2, "0")}-%`;
  const monthName = CZECH_MONTH_NAMES[prevMonth - 1];

  // Get all staff/admin users with email
  const { results: users } = await env.DB.prepare(
    "SELECT id, username, email FROM admins WHERE role IN ('admin', 'staff') AND email IS NOT NULL AND password_hash != 'invite_pending'"
  ).all<{ id: number; username: string; email: string }>();

  if (!users.length) return;

  // Get hourly wage
  const wageRow = await env.DB.prepare("SELECT value FROM settings WHERE key = 'hourly_wage'").first<{ value: string }>();
  const hourlyWage = wageRow ? Number(wageRow.value) : 0;

  for (const user of users) {
    // Get shifts where user was assigned
    const [{ results: shiftRows }, { results: helperRows }, { results: logRows }] = await Promise.all([
      env.DB.prepare(
        "SELECT date FROM shifts WHERE date LIKE ? AND (hookah_user_id = ? OR bar_user_id = ?)"
      ).bind(prefix, user.id, user.id).all<{ date: string }>(),
      env.DB.prepare(
        "SELECT date FROM shift_availability WHERE date LIKE ? AND user_id = ? AND status = 'helper'"
      ).bind(prefix, user.id).all<{ date: string }>(),
      env.DB.prepare(
        "SELECT date, time_from, time_to FROM shift_logs WHERE date LIKE ? AND user_id = ?"
      ).bind(prefix, user.id).all<{ date: string; time_from: string; time_to: string }>(),
    ]);

    // All assigned dates
    const assignedDates = new Set<string>();
    for (const r of shiftRows) assignedDates.add(r.date);
    for (const r of helperRows) assignedDates.add(r.date);

    if (assignedDates.size === 0) continue; // No shifts this month

    // Logged dates
    const loggedDates = new Set<string>();
    let totalMinutes = 0;
    for (const l of logRows) {
      loggedDates.add(l.date);
      const [fH, fM] = l.time_from.split(":").map(Number);
      const [tH, tM] = l.time_to.split(":").map(Number);
      let mins = (tH * 60 + tM) - (fH * 60 + fM);
      if (mins <= 0) mins += 1440;
      totalMinutes += mins;
    }

    // Unlogged dates
    const unloggedDates = [...assignedDates].filter(d => !loggedDates.has(d)).sort();

    const totalHours = Math.round(totalMinutes / 6) / 10;
    const earnings = hourlyWage > 0 ? Math.round((totalMinutes / 60) * hourlyWage) : null;

    const emailMsg = monthlyShiftSummaryEmail({
      username: user.username,
      email: user.email,
      monthName,
      year: prevYear,
      totalShifts: logRows.length,
      totalHours,
      earnings,
      hourlyWage,
      unloggedDates,
    });

    try {
      await sendEmail(env, emailMsg);
    } catch (e) {
      console.error(`Failed to send monthly summary to ${user.email}:`, e);
    }
  }
}

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(handleMonthlyShiftSummary(env));
  },
};
