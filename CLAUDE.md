# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static one-page website for **SPiRiT – Bar, Hookah Lounge & Coffee** in Teplice, Czech Republic. No build system, no package manager, no framework – everything is a single `index.html` file with inline CSS and JS.

## Development

Open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

A local server is required for the Leaflet map tiles and Google Fonts to load correctly.

## Architecture

All code lives in `index.html`:

- **CSS** – inline `<style>` block, CSS custom properties in `:root` for the brand palette
- **JS** – inline `<script>` at the bottom; no dependencies except Leaflet (loaded from unpkg CDN)
- **Fonts** – Anton loaded from Google Fonts with a local TTF fallback in `font/Anton-Regular.ttf`; BRAVEEightyone TTF is present in `font/` but not used on the site
- **Map** – Leaflet.js 1.9.4 with CartoDB Dark Matter tiles; CSS filter applied only to `.leaflet-tile-pane` so the custom marker is unaffected
- **Carousel** – vanilla JS, no library; state managed in a single IIFE

## Brand

| Token | Value |
|---|---|
| `--blue` | `#2635d4` (cobalt, gradient start) |
| `--cyan` | `#00cfff` (bright cyan, gradient end) |
| `--dark` | `#020408` (page background) |
| Font | Anton (headings), Inter (body) |

The brand gradient always runs `#2635d4 → #00cfff`. Do not use gold/amber – previous versions used gold and it was intentionally replaced.

## Assets

```
img/
  logo_png.png        – colour gradient logo, transparent bg (used in hero)
  logo_white_png.png  – all-white logo (used in nav & footer)
  logo.jpg            – circular logo on black bg (source for favicons)
  favicon/            – all favicon & OG image variants
  PXL_20250920_175659499.MP.jpg  – hero background photo (blurred layer)
  *.jpg / *.png       – bar photos used in carousel
font/
  Anton-Regular.ttf
  BRAVEEightyone-Regular.ttf
```

## Key business data

- **Address:** Školní 605/18, 415 01 Teplice
- **GPS:** `50.64284, 13.82447`
- **Phone:** +420 731 829 346
- **Email:** info@spirit-bar.cz
- **Opening hours:** Tue–Thu & Sun 17:00–22:00 · Fri–Sat 17:00–02:00 · Mon closed
- **Domain (production):** `https://spirit-bar.cz` – update in `canonical`, `og:image`, `og:url`, `sitemap.xml`, and `robots.txt` before deploying

## SEO files

- `robots.txt` and `sitemap.xml` are at the project root – update `lastmod` in sitemap after content changes
- JSON-LD `BarOrPub` schema is inline in `<head>`; keep it in sync if hours or contact details change
