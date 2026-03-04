import { Hono } from "hono";
import { pageShell, errorPage } from "../lib/layout";

export const galerie = new Hono();

const html = pageShell({
  title: "Galerie – SPiRiT Teplice",
  description: "Fotogalerie z akcí a večerů v SPiRiT baru v Teplicích.",
  canonical: "https://spirit-bar.cz/galerie",
  activePage: "/galerie",
  slot: '<div id="galerie-app" class="galerie-page"></div>',
  scripts: ["/galerie.js"],
});

galerie.get("/", (c) => c.html(html));
galerie.get("/*", (c) => {
  const path = c.req.path;
  if (path.includes(".")) return c.html(errorPage(404), 404);
  return c.html(html);
});
