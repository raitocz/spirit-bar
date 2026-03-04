import { Hono } from "hono";
import { pageShell, errorPage } from "../lib/layout";

export const kviz = new Hono();

const html = pageShell({
  title: "Kvízy – SPiRiT Teplice",
  description:
    "Kvízové večery v SPiRiT baru v Teplicích – nadcházející termíny a historie.",
  canonical: "https://spirit-bar.cz/kviz",
  activePage: "/kviz",
  slot: '<div id="kviz-app" class="kviz-page"></div>',
  scripts: ["/qrcode-generator.js", "/qr.js", "/kviz.js"],
});

kviz.get("/", (c) => c.html(html));
kviz.get("/*", (c) => {
  const path = c.req.path;
  if (path.includes(".")) return c.html(errorPage(404), 404);
  return c.html(html);
});
