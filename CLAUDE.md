# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

One-page website + API backend for **SPiRiT – Bar, Hookah Lounge & Coffee** in Teplice, Czech Republic. Runs on **Cloudflare Workers** with **Hono** framework and **D1** (SQLite) database.

## Tech stack

- **Runtime:** Cloudflare Workers
- **Framework:** Hono (TypeScript)
- **Database:** Cloudflare D1 (SQLite)
- **Static assets:** Served by CF Workers Assets from `public/`
- **Frontend:** Vanilla HTML/CSS/JS (no build step)

## Development

```bash
cm up           # Start local dev server at http://localhost:8787
cm help         # Show all available commands
```

Key `cm` commands:
- `cm up` – local dev server (wrangler dev)
- `cm deploy` – deploy to Cloudflare Workers
- `cm db:create` – create D1 database (copy ID to `wrangler.toml`)
- `cm db:migrate` – run migrations locally
- `cm db:migrate:prod` – run migrations on production
- `cm db:seed` – create admin user interactively

## Project structure

```
spirit-bar/
├── public/                  # Static files (CF Workers Assets)
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── img/
│   └── font/
├── src/
│   ├── index.ts             # Hono entry point
│   ├── lib/
│   │   └── auth.ts          # PBKDF2 + JWT helpers
│   └── routes/
│       ├── api.ts           # API routes (/api/health, /api/quiz/*)
│       └── dungeon.ts       # Admin panel routes (/dungeon/*)
├── migrations/
│   ├── 0001_create_quiz_registrations.sql
│   └── 0002_create_admins.sql
├── bin/
│   └── cm                   # Dev commands (bash)
├── wrangler.toml
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Routing

- `GET /` → CF Assets → `public/index.html` (Worker not invoked)
- `GET /style.css` → CF Assets → static file
- `POST /api/quiz/register` → Worker → Hono → D1
- `GET /api/health` → Worker → `{"status":"ok"}`
- `GET /dungeon` → Worker → Hono → admin SPA
- `POST /dungeon/api/login` → Worker → Hono → D1
- `GET /unknown` → Worker catch-all → 404

## Brand

| Token | Value |
|---|---|
| `--blue` | `#2635d4` (cobalt, gradient start) |
| `--cyan` | `#00cfff` (bright cyan, gradient end) |
| `--dark` | `#020408` (page background) |
| Font | Anton (headings), Inter (body) |

The brand gradient always runs `#2635d4 → #00cfff`. Do not use gold/amber – previous versions used gold and it was intentionally replaced.

## Assets

All static assets live in `public/`:

```
public/img/
  logo/               – logos (gradient, white, white on bg)
  photo/              – bar photos (webp, used in carousel)
  shop/               – shop section photos
  favicon/            – favicons, OG image, site.webmanifest
public/font/
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

- `robots.txt` and `sitemap.xml` are in `public/` – update `lastmod` in sitemap after content changes
- JSON-LD `BarOrPub` schema is inline in `public/index.html` `<head>`; keep it in sync if hours or contact details change

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/quiz/register` | Register for quiz (body: `{name, email, phone?}`) |
| GET | `/api/quiz/registrations` | List all registrations |

## Admin panel (/dungeon)

Protected admin SPA at `/dungeon`. Auth via PBKDF2 password hashing + JWT in httpOnly cookie.

- `JWT_SECRET` must be set via `wrangler secret put JWT_SECRET` for production
- Seed user created by migration `0002`: `raito` / `RootPass123*`
- Use `cm db:seed` to create additional admin users interactively

| Method | Path | Description |
|--------|------|-------------|
| POST | `/dungeon/api/login` | Authenticate, set session cookie |
| POST | `/dungeon/api/logout` | Clear session cookie |
| GET | `/dungeon/api/me` | Verify session (returns username) |
| GET | `/dungeon` | Serve admin SPA |
| GET | `/dungeon/*` | Client-side routing (serves SPA) |

Dashboard sections (currently placeholder): Galerie, Kvízy, Nastavení.

## Database

D1 binding name: `DB`. Migrations are in `migrations/`. Run `cm db:migrate` locally before testing API routes.
