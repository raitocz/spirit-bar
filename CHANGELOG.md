# Changelog

## 1.8.0 (2026-03-12)
- Automatické verzování s changelogem (semver) při každém commitu
- Číslo verze a changelog zobrazitelný v administraci (sidebar badge)
- Skill `/commit` pro Claude Code s česky psaným changelogem
- Zpětně doplněna historie verzí od 1.0.0

## 1.7.0 (2026-03-12)
- Admin uživatelé se mohou přiřadit na všechny typy směn (bar, dýmky, výpomoc)
- Opraveno odebírání výpomoci ze směn
- Responzivní zobrazení všech sekcí v administraci (uživatelé, galerie, kvízy, týmy)
- Staff se nemůže odebrat ze směny v následujících 7 dnech
- Příkaz `cm create-admin` nyní aktualizuje existujícího uživatele místo chyby

## 1.6.0 (2026-03-12)
- Kalendář akcí s kompletním CRUD a veřejnou stránkou
- Integrace akcí s kvízy
- Navigační odkazy ve stylu pilulky
- Notifikační email pro admina při registraci týmu na kvíz
- Aktualizovaný emoji picker

## 1.5.0 (2026-03-11)
- Cookie-based autentizace (nahrazení JWT v hlavičkách)
- Přehled směn pro staff (nadcházející, odpracované, statistiky)
- Měsíční cron emaily se souhrnem směn
- Systém oběžníků pro hromadné emaily
- Hero video s dissolve přechodem na úvodní stránce
- Opravy produkčních emailů a zabezpečení podstránek

## 1.4.0 (2026-03-11)
- Systém směn s rozpisy, zápisem hodin a nastavením
- Správa staffu s typy pozic (dýmkař, barman, barodýmkař)
- Live aktualizace směn s auto-pollingem
- Bezpečnostní vylepšení (CSP, rate limiting, sanitizace)
- Náhledy galerií s thumbnaily
- Optimalizace výkonu frontendu

## 1.3.0 (2026-03-06)
- Podpora 5 jazyků (čeština, angličtina, němčina, polština, Sigma)
- Přepínač jazyků v mobilní navigaci
- Vylepšení mobilního menu a přepínače motivů
- Oprava přetečení burger menu na krátkých obrazovkách

## 1.2.0 (2026-03-04)
- Kvízy s registrací týmů, platbami a potvrzovacími emaily
- Správa týmů v administraci (platby, potvrzení, mazání)
- Chybové stránky s českými texty (403, 404, 500)
- Zálohovací příkazy pro databázi
- Toast notifikace v administraci

## 1.1.0 (2026-03-03)
- Administrační panel (Dungeon) s přihlášením
- Správa fotogalerií s uploadem a řazením
- Přepínání světlého/tmavého motivu
- Sekce Obchod na úvodní stránce

## 1.0.0 (2026-03-01)
- Úvodní stránka baru SPiRiT s karuselem fotek
- SEO optimalizace (schema.org, sitemap, robots.txt)
- Responzivní design pro mobily
- Nasazení na Cloudflare Workers
