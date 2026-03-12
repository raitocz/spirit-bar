import { Hono } from "hono";
import { pageShell } from "../lib/layout";

export function createAkce(langPrefix: string) {
  const akce = new Hono();

  const html = pageShell({
    title: "Akce – SPiRiT Teplice",
    description: "Nadcházející akce a eventy v SPiRiT baru v Teplicích. Karaoke, ochutnávky, tematické večery a další.",
    canonical: "https://spirit-bar.cz/akce",
    activePage: "/akce",
    langPrefix,
    slot: '<div id="akce-app" class="akce-page"></div>',
    scripts: ["/akce.js"],
  });

  akce.get("/", (c) => c.html(html));

  return akce;
}
