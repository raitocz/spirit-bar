import { Hono } from "hono";

export const galerie = new Hono();

const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Galerie – SPiRiT Teplice</title>
  <meta name="description" content="Fotogalerie z akcí a večerů v SPiRiT baru v Teplicích." />
  <link rel="canonical" href="https://spirit-bar.cz/galerie" />

  <!-- Favicons -->
  <link rel="icon" type="image/x-icon" href="/img/favicon/favicon.ico" />
  <link rel="icon" type="image/png" sizes="32x32" href="/img/favicon/favicon-32x32.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/img/favicon/apple-touch-icon.png" />
  <meta name="theme-color" content="#00cfff" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

  <!-- Styles -->
  <link rel="stylesheet" href="/style.css" />
</head>
<body>

<!-- NAV -->
<nav id="navbar">
  <a href="/" class="nav-logo">
    <img src="/img/logo/logo_white_png.png" alt="SPiRiT" />
  </a>
  <ul class="nav-links" id="navLinks">
    <li><a href="/#about">O nás</a></li>
    <li><a href="/#services">Nabídka</a></li>
    <li><a href="/galerie" class="active">Galerie</a></li>
    <li><a href="/#hours">Otevírací doba</a></li>
    <li><a href="/#shop">Krámek</a></li>
    <li><a href="/#map-section">Kde nás najdete</a></li>
    <li><a href="/#contact">Kontakt</a></li>
    <li><button id="themeToggle" class="theme-toggle" aria-label="Přepnout motiv">🌙</button></li>
  </ul>
  <button class="hamburger" id="hamburger" aria-label="Menu">
    <span></span><span></span><span></span>
  </button>
</nav>

<div id="galerie-app" class="galerie-page"></div>

<!-- FOOTER -->
<footer>
  <div class="footer-logo">
    <img src="/img/logo/logo_white_png.png" alt="SPiRiT" />
  </div>
  <p class="footer-sub">Bar &nbsp;·&nbsp; Hookah Lounge &nbsp;·&nbsp; Coffee</p>
  <p class="footer-copy">© 2026 SPiRiT Teplice &nbsp;·&nbsp; Školní 605/18, 415 01 Teplice</p>
</footer>

<script src="/galerie.js"></script>
<script>
// Nav helpers (same as main page)
function toggleNav() {
  document.getElementById('navLinks').classList.toggle('open');
}
function closeNav() {
  document.getElementById('navLinks').classList.remove('open');
}
document.getElementById('hamburger').addEventListener('click', toggleNav);

// Theme toggle (same logic as main page)
function applyTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'light' ? '☀️' : '🌙';
}
function toggleTheme() {
  const next = document.body.classList.contains('light') ? 'dark' : 'light';
  localStorage.setItem('spirit-theme', next);
  applyTheme(next);
}
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
applyTheme(localStorage.getItem('spirit-theme') || 'dark');

// Navbar shrink on scroll
window.addEventListener('scroll', () => {
  document.getElementById('navbar').style.padding =
    window.scrollY > 40 ? '.6rem 2.5rem' : '1rem 2.5rem';
});
</script>
</body>
</html>`;

galerie.get("/", (c) => c.html(html));
galerie.get("/*", (c) => {
  const path = c.req.path;
  if (path.includes(".")) return c.text("Not Found", 404);
  return c.html(html);
});
