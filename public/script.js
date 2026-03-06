/* ── Dev environment border ── */
(function () {
  if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  var b = document.createElement('div');
  b.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;border:3px solid #34d399;border-radius:4px;';
  b.addEventListener('click', function () { b.remove(); });
  document.addEventListener('click', function (e) {
    var r = 6;
    if (e.clientX < r || e.clientY < r || e.clientX > innerWidth - r || e.clientY > innerHeight - r) {
      b.style.pointerEvents = 'auto';
      b.remove();
    }
  });
  document.body.appendChild(b);
})();

function toggleNav() { document.getElementById('navLinks').classList.toggle('open'); }
function closeNav()  { document.getElementById('navLinks').classList.remove('open'); }

/* ── Theme toggle ── */
(function () {
  var saved = localStorage.getItem('spirit-theme');
  if (saved === 'light') document.body.classList.add('light');
})();

function updateThemeButtons(isLight) {
  var lightLabel = typeof t === 'function' ? t('hero.theme_light') : 'Světlý motiv';
  var darkLabel  = typeof t === 'function' ? t('hero.theme_dark')  : 'Tmavý motiv';
  var icon = isLight ? '☀️' : '🌙';
  var label = isLight ? darkLabel : lightLabel;

  var nav = document.getElementById('themeToggle');
  if (nav) {
    var navIcon = nav.querySelector('.theme-toggle-icon');
    var navLabel = nav.querySelector('.theme-toggle-label');
    if (navIcon) navIcon.textContent = icon;
    if (navLabel) navLabel.textContent = label;
  }
  var hero = document.querySelector('.hero-theme-toggle');
  if (hero) {
    hero.querySelector('.hero-theme-icon').textContent = icon;
    hero.lastChild.textContent = ' ' + label;
  }
}

function toggleTheme() {
  var isLight = document.body.classList.toggle('light');
  localStorage.setItem('spirit-theme', isLight ? 'light' : 'dark');
  updateThemeButtons(isLight);
}

/* Set correct state on load */
(function () {
  updateThemeButtons(document.body.classList.contains('light'));
})();

/* ── Show quiz hero button only if upcoming quizzes exist ── */
(function () {
  var btn = document.getElementById('quizHeroBtn');
  if (!btn) return;
  var prefix = typeof langPrefix === 'function' ? langPrefix() : '';
  btn.setAttribute('href', prefix + '/kviz');
  fetch('/api/quizzes').then(function (r) { return r.json(); }).then(function (quizzes) {
    var today = new Date().toISOString().slice(0, 10);
    var hasUpcoming = quizzes.some(function (q) { return q.date >= today; });
    if (hasUpcoming) btn.style.display = '';
  }).catch(function () {});
})();

(function () {
  const map = { 1:0, 2:1, 3:2, 4:3, 5:4, 6:5, 0:6 };
  const row = document.getElementById('row-' + map[new Date().getDay()]);
  if (row) row.classList.add('today');
})();

const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));

window.addEventListener('scroll', () => {
  document.getElementById('navbar').style.padding =
    window.scrollY > 60 ? '.65rem 2.5rem' : '1rem 2.5rem';
});

/* ── Scroll-spy ── */
const navAs = document.querySelectorAll('.nav-links a[href^="#"]');
const spyObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navAs.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, {
  /* section enters the "active zone" when between 20 % and 65 % from the top */
  rootMargin: '-20% 0px -65% 0px'
});
document.querySelectorAll('section[id]').forEach(s => spyObs.observe(s));

/* ── Carousel ── */
(function () {
  const track  = document.getElementById('carouselTrack');
  const dotsEl = document.getElementById('carouselDots');
  const thumbsEl = document.getElementById('carouselThumbs');
  const slides = track.querySelectorAll('.carousel-slide');
  const thumbs = thumbsEl.querySelectorAll('.carousel-thumb');
  const total  = slides.length;
  let   cur    = 0;
  let   timer  = null;
  let   touchX = 0;

  /* Build dots */
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Snímek ' + (i + 1));
    d.addEventListener('click', () => { goTo(i); resetAuto(); });
    dotsEl.appendChild(d);
  });
  const dots = dotsEl.querySelectorAll('.carousel-dot');

  function goTo(n) {
    cur = (n + total) % total;
    track.style.transform = `translateX(-${cur * 100}%)`;
    dots.forEach((d, i)   => d.classList.toggle('active', i === cur));
    thumbs.forEach((t, i) => t.classList.toggle('active', i === cur));
    /* Scroll only within the thumbs strip, never the page */
    const tc = document.getElementById('carouselThumbs');
    const th = thumbs[cur];
    if (tc && th) {
      tc.scrollTo({ left: th.offsetLeft - tc.offsetWidth / 2 + th.offsetWidth / 2, behavior: 'smooth' });
    }
  }

  function resetAuto() {
    clearInterval(timer);
    timer = setInterval(() => goTo(cur + 1), 4500);
  }

  document.getElementById('prevBtn').addEventListener('click', () => { goTo(cur - 1); resetAuto(); });
  document.getElementById('nextBtn').addEventListener('click', () => { goTo(cur + 1); resetAuto(); });
  thumbs.forEach((t, i) => t.addEventListener('click', () => { goTo(i); resetAuto(); }));

  /* Swipe */
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const dx = touchX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) { goTo(cur + (dx > 0 ? 1 : -1)); resetAuto(); }
  });

  /* Pause on hover */
  const wrap = document.querySelector('.carousel-wrap');
  wrap.addEventListener('mouseenter', () => clearInterval(timer));
  wrap.addEventListener('mouseleave', resetAuto);

  /* Keyboard */
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { goTo(cur - 1); resetAuto(); }
    if (e.key === 'ArrowRight') { goTo(cur + 1); resetAuto(); }
  });

  goTo(0);
  resetAuto();
})();

/* ── Leaflet map ── */
(function () {
  const LAT = 50.64284, LNG = 13.82447;

  const map = L.map('spirit-map', {
    center: [LAT, LNG],
    zoom: 17,
    zoomControl: true,
    scrollWheelZoom: false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  const pinIcon = L.divIcon({
    className: '',
    html: `<div class="spirit-pin">
             <div class="pin-head"></div>
             <div class="pin-stem"></div>
             <div class="pin-label">SPiRiT</div>
           </div>`,
    iconSize: [60, 68],
    iconAnchor: [30, 54],
    popupAnchor: [0, -56]
  });

  L.marker([LAT, LNG], { icon: pinIcon })
    .addTo(map)
    .bindPopup(
      '<strong style="color:#00cfff;font-family:Anton,sans-serif;letter-spacing:.06em">SPiRiT</strong>' +
      '<br><span style="font-size:.82rem;color:#aaa">Školní 605/18, Teplice</span>',
      { className: 'spirit-popup' }
    );
})();
