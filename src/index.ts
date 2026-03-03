import { Hono } from "hono";
import { cors } from "hono/cors";
import { api } from "./routes/api";
import { dungeon } from "./routes/dungeon";
import { galerie } from "./routes/galerie";

type Bindings = {
  DB: D1Database;
  ASSETS: Fetcher;
  PHOTOS: R2Bucket;
  JWT_SECRET: string;
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

// Catch-all: let CF Assets handle static files; if nothing matched, 404
app.all("*", (c) => c.text("Not Found", 404));

export default app;
