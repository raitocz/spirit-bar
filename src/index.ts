import { Hono } from "hono";
import { cors } from "hono/cors";
import { api } from "./routes/api";
import { dungeon } from "./routes/dungeon";
import { createGalerie } from "./routes/galerie";
import { createKviz } from "./routes/kviz";
import { errorPage } from "./lib/layout";

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
    "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://basemaps.cartocdn.com https://*.tile.openstreetmap.org; " +
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
}

// Catch-all: let CF Assets handle static files; if nothing matched, 404
app.all("*", (c) => {
  const match = c.req.path.match(/^\/(en|de|pl|sigma)(\/|$)/);
  const lp = match ? `/${match[1]}` : "";
  return c.html(errorPage(404, lp), 404);
});

export default app;
