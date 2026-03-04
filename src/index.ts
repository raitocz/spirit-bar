import { Hono } from "hono";
import { cors } from "hono/cors";
import { api } from "./routes/api";
import { dungeon } from "./routes/dungeon";
import { galerie } from "./routes/galerie";
import { kviz } from "./routes/kviz";
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
app.route("/galerie", galerie);
app.route("/kviz", kviz);

// Catch-all: let CF Assets handle static files; if nothing matched, 404
app.all("*", (c) => c.html(errorPage(404), 404));

export default app;
