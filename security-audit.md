# Security Audit — SPiRiT Bar (2026-03-11)

## Souhrn

Kompletní bezpečnostní audit backendu (Hono/CF Workers) i frontendu (vanilla JS SPA). Dvě kola — první identifikovalo 18 issues, všechny opraveny. Re-audit potvrdil korektnost oprav a identifikoval 3 zbývající architekturální MEDIUM a 4 LOW.

**CRITICAL: 0 | HIGH: 0 | MEDIUM: 3 | LOW: 4**

---

## Opravené issues (implementováno 2026-03-11)

### HIGH (2 — opraveno)

| # | Issue | Soubor | Oprava |
|---|-------|--------|--------|
| H1 | XSS v `showToast()` — innerHTML s neescapovaným `err.message` | `app.js:33` | Nahrazeno `createElement`/`textContent` |
| H2 | XSS v `showConfirm()` — innerHTML s neescapovanými parametry | `app.js:54-62` | Title přes `textContent`, message přes `innerHTML` (callers escapují přes `esc()`), username v deleteUser escapován |

### MEDIUM (8 — opraveno)

| # | Issue | Soubor | Oprava |
|---|-------|--------|--------|
| M1 | JWT role není revalidován z DB | `dungeon.ts` auth middleware | Middleware nyní queruje DB pro aktuální roli na každý request |
| M2 | In-memory rate limiting neefektivní na Workers | `dungeon.ts`, `api.ts` | Dokumentováno komentáři, přidán cleanup expired entries |
| M3 | Race condition při registraci týmu | `api.ts:144-175` | Migrace 0018: UNIQUE indexy na `(quiz_id, team_name)` a `(quiz_id, icon)` + try/catch constraint violation |
| M4 | Chybí security headers | `index.ts` | Přidán middleware: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy` |
| M5 | Email preview přes `document.write()` | `app.js:2179` | Sandboxed `<iframe sandbox="allow-same-origin" srcdoc="...">` |
| M6 | Leaflet bez SRI | `index.html:151-152` | Přidány `integrity` + `crossorigin` atributy |
| M7 | Neomezené query výsledky | `api.ts` | `LIMIT 200` na public gallery/quiz endpointy |
| M8 | CSP příliš volné pro unpkg.com | `index.ts` | Zpřísněno na `https://unpkg.com/leaflet@1.9.4/` |

### LOW (8 — opraveno)

| # | Issue | Soubor | Oprava |
|---|-------|--------|--------|
| L1 | `DELETE /api/mail` chybí `requireRole` | `dungeon.ts:863` | Přidáno `requireRole(c, "admin")` |
| L2 | Invite token uložen jako plaintext | `dungeon.ts` | SHA-256 hash před uložením, hash input tokenu při lookup |
| L3 | Settings key není whitelistovaný | `dungeon.ts:882` | Whitelist `["hourly_wage"]` |
| L4 | Chybí validace záporných čísel | `dungeon.ts` quiz CRUD | `Number.isInteger`, `Number.isFinite`, range checks |
| L5 | Photo upload chybí auth header | `app.js:865-869` | Přidán `Authorization: Bearer` header |
| L6 | Inline `onclick` handlery | `index.html` | Přesunuty do `script.js` přes `addEventListener` |
| L7 | MIME type je client-declared | `dungeon.ts:380` | Magic bytes validace (JPEG/PNG/WebP/GIF) |
| L8 | Rate limit map memory leak | `dungeon.ts`, `api.ts` | Periodický cleanup expired entries |

### Drobnosti z re-auditu (3 — opraveno)

| Issue | Soubor | Oprava |
|-------|--------|--------|
| `currentUser`/`currentRole` neescapováno v dashboard headeru | `app.js:462` | Escapováno přes `esc()` |
| `err.message` neescapováno v users list error | `app.js:2853` | Escapováno přes `esc()` |
| Shift-log endpointy omezené jen na staff (vyloučen admin) | `dungeon.ts` | Přidána role `"admin"` ke všem 3 shift-log endpointům |

---

## Zbývající issues (architekturální, neexploitovatelné)

### MEDIUM (3)

| # | Issue | Popis | Mitigace |
|---|-------|-------|----------|
| M1 | JWT v sessionStorage | Bearer token přístupný z JS — XSS by ho mohl exfiltrovat | Striktní CSP (`script-src 'self' https://unpkg.com/leaflet@1.9.4/`). Přechod na httpOnly cookie = větší refactor, doporučeno jako separate PR. |
| M2 | Timing side-channel na password compare | `verifyPassword` používá `===` místo constant-time | PBKDF2 100k iterací dominuje timing. Přes síť + CF CDN prakticky neexploitovatelné. |
| M3 | In-memory rate limiting per-isolate | CF Workers isolates nesdílejí paměť | Dokumentováno. Pro hardening přejít na CF Rate Limiting API nebo KV. |

### LOW (4)

| # | Issue | Popis |
|---|-------|-------|
| L1 | Rate limit cleanup threshold-based v api.ts | Funguje, jen jiná strategie (size > 100) než dungeon.ts (per-request) |
| L2 | Chybí max-length validace na string inputy | Team names, gallery titles — D1 to zvládne, CF Workers body size limit chrání |
| L3 | Google Fonts bez SRI | Standard practice — Google mění obsah per User-Agent |
| L4 | `cachedHourlyWage` v JS paměti pro staff | Nízká citlivost, API endpoint pro čtení wage je i tak povolen staff roli |

---

## Bezpečnostní vrstvy — přehled

### Autentizace
- PBKDF2 (SHA-256, 100k iterací, 16B salt, 32B key)
- JWT HS256 s 24h expirací
- Role revalidována z DB na každý request
- Invite-pending uživatelé blokováni v auth middleware
- Login rate limit: 5 pokusů / 15 min / IP

### Autorizace
- `requireRole()` na každém admin endpointu
- Staff nemůže přistoupit k admin-only operacím
- Self-deletion admina blokována
- Ochrana posledního admina (nelze odebrat poslední admin roli)

### Ochrana dat
- Invite tokeny hashované (SHA-256) v DB
- Hesla hashovaná (PBKDF2)
- Žádné secrets v client-side kódu
- Photo upload: magic bytes + MIME type + 10MB limit

### HTTP bezpečnost
- `X-Frame-Options: DENY` (anti-clickjacking)
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` (script-src pinned, frame-ancestors none)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Leaflet SRI hashes
- CORS whitelist (3 originy)

### XSS ochrana
- `showToast()` — `textContent` (ne innerHTML)
- `showConfirm()` — title přes `textContent`, message přes `innerHTML` s povinným `esc()`
- Všechny user-data v innerHTML escapovány přes `esc()`
- Email preview v sandboxed iframe
- Žádné inline event handlery v HTML

### CSRF ochrana
- Bearer token v Authorization header (browser ho nepřipojí automaticky)
- Žádné cookie-based auth = žádný CSRF vektor

### Race conditions
- UNIQUE DB constrainty na quiz team name + icon
- Constraint violation handling v catch blocku
