/**
 * Shared HTML shell for public subpages (galerie, kviz, etc.).
 * Keeps nav, footer, theme toggle, and scroll behaviour in one place.
 */

const errorContent: Record<number, { icon: string; title: string; sub: string }> = {
  403: {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="url(#eg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2635d4"/><stop offset="100%" stop-color="#00cfff"/></linearGradient></defs><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>`,
    title: "Přístup odepřen",
    sub: "Sem nemáš přístup, kamaráde! Tohle je VIP zóna.",
  },
  404: {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="url(#eg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2635d4"/><stop offset="100%" stop-color="#00cfff"/></linearGradient></defs><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
    title: "Stránka nenalezena",
    sub: "Tady nic není… asi ses ztratil v dýmu z vodní dýmky 💨",
  },
  500: {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="url(#eg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2635d4"/><stop offset="100%" stop-color="#00cfff"/></linearGradient></defs><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    title: "Chyba serveru",
    sub: "Něco se pokazilo… barman to hned spraví! 🍹",
  },
};

const defaultError = {
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="url(#eg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2635d4"/><stop offset="100%" stop-color="#00cfff"/></linearGradient></defs><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  title: "Něco se pokazilo",
  sub: "Zkus to znovu nebo se vrať na hlavní stránku.",
};

export function errorPage(status: number, langPrefix = ""): string {
  const e = errorContent[status] ?? defaultError;
  return pageShell({
    title: `${status} – SPiRiT Teplice`,
    description: e.title,
    canonical: "https://spirit-bar.cz",
    activePage: "",
    langPrefix,
    slot: `
<section class="error-page">
  <div class="error-code">${status}</div>
  <div class="error-icon">${e.icon}</div>
  <h1 class="error-title">${e.title}</h1>
  <p class="error-sub">${e.sub}</p>
  <a href="${langPrefix || "/"}" class="btn btn-primary" style="margin-top:1.5rem">Zpět na hlavní stránku</a>
</section>`,
  });
}

interface PageOptions {
  title: string;
  description: string;
  canonical: string;
  /** Which nav link gets the "active" class – must match the href exactly */
  activePage: string;
  /** HTML that goes between nav and footer */
  slot: string;
  /** Page-specific <script src="…"> tags (e.g. '/galerie.js') */
  scripts?: string[];
  /** Language prefix for nav links (e.g. '/en', '/de') */
  langPrefix?: string;
}

const navLinks: { href: string; label: string }[] = [
  { href: "/#about", label: "O nás" },
  { href: "/#services", label: "Nabídka" },
  { href: "/#gallery", label: "Prohlídka" },
  { href: "/#hours", label: "Otevírací doba" },
  { href: "/#shop", label: "Krámek" },
  { href: "/#map-section", label: "Kde nás najdete" },
  { href: "/#contact", label: "Kontakt" },
  { href: "/galerie", label: "Galerie" },
  { href: "/kviz", label: "Kvíz" },
];

function prefixHref(href: string, prefix: string): string {
  if (!prefix) return href;
  // /#about → /en#about (no slash before #, so browser path stays /en)
  if (href.startsWith("/#")) return prefix + "#" + href.slice(2);
  if (href.startsWith("/")) return prefix + href;
  return href;
}

export function pageShell(opts: PageOptions): string {
  const lp = opts.langPrefix ?? "";
  const navItems = navLinks
    .map(
      (l) => {
        const href = prefixHref(l.href, lp);
        return `<li><a href="${href}"${l.href === opts.activePage ? ' class="active"' : ""}>${l.label}</a></li>`;
      }
    )
    .join("\n      ");

  const scriptTags = (opts.scripts ?? [])
    .map((s) => `<script src="${s}"></script>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
  <meta name="description" content="${opts.description}" />
  <link rel="canonical" href="${opts.canonical}" />

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
  <script src="/i18n.js" defer></script>
</head>
<body>

<!-- NAV -->
<nav id="navbar">
  <a href="${lp ? lp : "/"}" class="nav-logo">
    <img src="/img/logo/logo_white_png.png" alt="SPiRiT" />
  </a>
  <ul class="nav-links" id="navLinks">
      ${navItems}
    <li><button id="themeToggle" class="theme-toggle" aria-label="Přepnout motiv"><span class="theme-toggle-icon">🌙</span><span class="theme-toggle-label">Světlý motiv</span></button></li>
  </ul>
  <div id="langPicker" class="lang-picker"></div>
  <button class="hamburger" id="hamburger" aria-label="Menu">
    <span></span><span></span><span></span>
  </button>
</nav>

${opts.slot}

<!-- FOOTER -->
<footer>
  <div class="footer-logo">
    <img src="/img/logo/logo_white_png.png" alt="SPiRiT" />
  </div>
  <p class="footer-sub">Bar &nbsp;·&nbsp; Hookah Lounge &nbsp;·&nbsp; Coffee</p>
  <p class="footer-copy">© 2026 SPiRiT Teplice &nbsp;·&nbsp; Školní 605/18, 415 01 Teplice</p>
</footer>

<script src="/subpage.js"></script>
${scriptTags}
</body>
</html>`;
}
