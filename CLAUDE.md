# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Website + API backend for **SPiRiT – Bar, Hookah Lounge & Coffee** in Teplice, Czech Republic. Runs on **Cloudflare Workers** with **Hono** framework, **D1** (SQLite) database, and **R2** object storage for photos.

The site has a main landing page, public subpages (Galerie, Kvíz), public API, and a protected admin panel (Dungeon).

## Tech stack

- **Runtime:** Cloudflare Workers
- **Framework:** Hono (TypeScript)
- **Database:** Cloudflare D1 (SQLite)
- **Object storage:** Cloudflare R2 (gallery photos)
- **Static assets:** Served by CF Workers Assets from `public/`
- **Frontend:** Vanilla HTML/CSS/JS (no build step)

## Development

```bash
cm up               # Start local dev server at http://localhost:8787
cm deploy           # Deploy to Cloudflare Workers
cm db:migrate       # Run migrations locally
cm db:migrate:prod  # Run migrations on production
cm create-admin     # Create admin user interactively (username + password)
cm db:console       # Local D1 console
cm help             # Show all available commands
```

## Project structure

```
spirit-bar/
├── public/                    # Static files (CF Workers Assets)
│   ├── index.html             # Main landing page
│   ├── style.css              # Main site styles
│   ├── script.js              # Main site JS
│   ├── galerie.js             # Public gallery page JS
│   ├── kviz.js                # Public quiz page JS
│   ├── qr.js                  # QR code display logic
│   ├── qrcode-generator.js    # QR code generation library
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── dungeon/               # Admin SPA assets
│   │   ├── app.js             # Admin SPA (vanilla JS IIFE)
│   │   └── style.css          # Admin styles
│   ├── img/
│   │   ├── logo/              # Logos (gradient, white, white on bg)
│   │   ├── photo/             # Bar photos (webp, carousel)
│   │   ├── shop/              # Shop section photos
│   │   └── favicon/           # Favicons, OG image, site.webmanifest
│   └── font/
│       ├── Anton-Regular.ttf
│       └── BRAVEEightyone-Regular.ttf
├── src/
│   ├── index.ts               # Hono entry point, CORS, route mounting
│   ├── lib/
│   │   ├── auth.ts            # PBKDF2 + JWT helpers
│   │   └── layout.ts          # Shared HTML shell for public subpages
│   └── routes/
│       ├── api.ts             # Public API (/api/*)
│       ├── dungeon.ts         # Admin panel (/dungeon/*)
│       ├── galerie.ts         # Public gallery page (/galerie)
│       └── kviz.ts            # Public quiz page (/kviz)
├── migrations/
│   ├── 0001_create_quiz_registrations.sql
│   ├── 0002_create_admins.sql
│   ├── 0003_create_galleries.sql
│   ├── 0004_create_gallery_photos.sql
│   ├── 0005_create_quizzes.sql
│   └── 0006_create_quiz_teams.sql
├── bin/
│   └── cm                     # Dev commands (bash)
├── wrangler.toml
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Routing

| Path | Handling | Description |
|------|----------|-------------|
| `GET /` | CF Assets | `public/index.html` (Worker not invoked) |
| `GET /style.css`, `/script.js`, etc. | CF Assets | Static files |
| `GET /galerie` | Worker → Hono | Public gallery subpage (server-rendered shell + `galerie.js`) |
| `GET /kviz` | Worker → Hono | Public quiz subpage (server-rendered shell + `kviz.js`) |
| `GET /api/*` | Worker → Hono | Public API (CORS-enabled) |
| `GET /dungeon` | Worker → Hono | Admin SPA (inline HTML) |
| `GET /dungeon/photos/:key` | Worker → Hono → R2 | Serve gallery photos from R2 |
| `*/dungeon/api/*` | Worker → Hono | Admin API (auth-protected) |
| `GET /*` | Worker catch-all | 404 |

Public subpages (`/galerie`, `/kviz`) use a shared HTML shell from `src/lib/layout.ts` that includes the site nav, footer, theme toggle, and scroll behaviour.

## Brand

| Token | Value |
|---|---|
| `--blue` | `#2635d4` (cobalt, gradient start) |
| `--cyan` | `#00cfff` (bright cyan, gradient end) |
| `--dark` | `#020408` (page background) |
| Font | Anton (headings), Inter (body) |

The brand gradient always runs `#2635d4 → #00cfff`. Do not use gold/amber – previous versions used gold and it was intentionally replaced.

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

## Public API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/quizzes` | List all quizzes (with confirmed team counts) |
| GET | `/api/quizzes/:id/taken` | Get taken icons & team names for a quiz |
| POST | `/api/quizzes/:id/register` | Register a team (body: `{team_name, icon, email, members[]}`) |
| GET | `/api/galleries` | List all galleries (with cover photo) |
| GET | `/api/galleries/:id` | Gallery detail with photos |
| POST | `/api/quiz/register` | Legacy quiz registration (body: `{name, email, phone?}`) |

## Admin panel (/dungeon)

Protected admin SPA at `/dungeon`. Auth via PBKDF2 password hashing + JWT in httpOnly cookie.

- `JWT_SECRET` must be set via `wrangler secret put JWT_SECRET` for production
- Create an admin user locally with `cm create-admin` (prompts for username and password)
- Login rate-limited: 5 attempts per IP per 15 min

Dashboard sections: **Galerie** (full CRUD + photo upload/reorder), **Kvízy** (CRUD + team management/payments), Nastavení (placeholder).

### Dungeon API routes (auth-protected)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/dungeon/api/login` | Authenticate, set session cookie |
| POST | `/dungeon/api/logout` | Clear session cookie |
| GET | `/dungeon/api/me` | Verify session (returns username) |
| GET | `/dungeon/api/galleries` | List galleries |
| POST | `/dungeon/api/galleries` | Create gallery |
| PUT | `/dungeon/api/galleries/:id` | Update gallery |
| DELETE | `/dungeon/api/galleries/:id` | Delete gallery + R2 photos |
| GET | `/dungeon/api/galleries/:id/photos` | List photos |
| POST | `/dungeon/api/galleries/:id/photos` | Upload photo (multipart, resized to webp) |
| PUT | `/dungeon/api/galleries/:id/photos/reorder` | Reorder photos |
| DELETE | `/dungeon/api/galleries/:id/photos/:photoId` | Delete photo |
| GET | `/dungeon/api/quizzes` | List quizzes (with team counts) |
| POST | `/dungeon/api/quizzes` | Create quiz |
| PUT | `/dungeon/api/quizzes/:id` | Update quiz |
| DELETE | `/dungeon/api/quizzes/:id` | Delete quiz |
| GET | `/dungeon/api/quizzes/:id/teams` | List teams with members |
| PUT | `/dungeon/api/teams/:id/payment` | Set payment status (cash/card/bank/free/null) |
| DELETE | `/dungeon/api/teams/:id` | Delete team |
| GET | `/dungeon/api/mail` | Dev mail catcher (returns `[]` in prod) |
| DELETE | `/dungeon/api/mail` | Clear caught emails |
| GET | `/dungeon/api/quiz/registrations` | Legacy quiz registrations list |

### Dungeon frontend (public/dungeon/)

`app.js` is a single-file vanilla JS IIFE with:
- **DatePicker** – custom calendar dropdown (Czech day/month names, `dd. mm. yyyy` format, ISO value in `dataset.value`)
- **Galerie** – CRUD forms, photo upload with client-side resize to webp, drag-and-drop reorder
- **Kvízy** – CRUD forms (defaults: 8 teams, 400 CZK, auto-incrementing quiz number), list split into "Nadcházející"/"Proběhlé", team detail with payment management and 10s auto-polling

## Email

Transactional email abstraction in `src/lib/email.ts`.

- **`sendEmail(env, { to, subject, html, text? })`** — sends an email
- **Production:** uses [Resend API](https://resend.com). Set key via `wrangler secret put RESEND_API_KEY`
- **Development:** `ENVIRONMENT=development` in `wrangler.toml` causes emails to be caught in-memory instead of sent. View caught emails in Dungeon → Pošta section.
- In-memory mailbox holds max 100 emails (FIFO). `getMailbox()` / `clearMailbox()` for programmatic access.

## Database

D1 binding name: `DB`. R2 binding name: `PHOTOS`. Migrations are in `migrations/`. Run `cm db:migrate` locally before testing API routes.

### Tables

- `quiz_registrations` – legacy quiz signups (name, email, phone)
- `admins` – admin users (username, password_hash)
- `galleries` – photo galleries (title, description, date_from, date_to)
- `gallery_photos` – photos in galleries (gallery_id, filename, r2_key, width, height, size_bytes, sort_order)
- `quizzes` – quiz events (quiz_number, date, max_participants, price)
- `quiz_teams` – registered teams (quiz_id, team_name, icon, email, payment_status)
- `quiz_team_members` – team members (team_id, name)
