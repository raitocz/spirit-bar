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
