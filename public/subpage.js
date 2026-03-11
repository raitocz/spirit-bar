// SPiRiT – shared subpage JS (nav, theme, scroll)
(function () {
  "use strict";

  // Nav helpers
  function toggleNav() {
    document.getElementById('navLinks').classList.toggle('open');
  }
  function closeNav() {
    document.getElementById('navLinks').classList.remove('open');
  }
  var hamburger = document.getElementById('hamburger');
  if (hamburger) hamburger.addEventListener('click', toggleNav);
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', closeNav);
  });

  // Theme toggle
  function applyTheme(theme) {
    document.body.classList.toggle('light', theme === 'light');
    var icon = theme === 'light' ? '\u2600\uFE0F' : '\uD83C\uDF19';
    var label = theme === 'light' ? 'Tmav\u00fd motiv' : 'Sv\u011btl\u00fd motiv';
    var btn = document.getElementById('themeToggle');
    if (btn) {
      var iconEl = btn.querySelector('.theme-toggle-icon');
      var labelEl = btn.querySelector('.theme-toggle-label');
      if (iconEl) iconEl.textContent = icon;
      if (labelEl) labelEl.textContent = label;
    }
  }
  function toggleTheme() {
    var next = document.body.classList.contains('light') ? 'dark' : 'light';
    localStorage.setItem('spirit-theme', next);
    applyTheme(next);
  }
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  applyTheme(localStorage.getItem('spirit-theme') || 'dark');

  // Navbar shrink on scroll
  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(function () {
        document.getElementById('navbar').style.padding =
          window.scrollY > 40 ? '.6rem 2.5rem' : '1rem 2.5rem';
        scrollTicking = false;
      });
    }
  }, { passive: true });

  // Dev environment border
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    var b = document.createElement('div');
    b.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;border:3px solid #34d399;border-radius:4px;';
    document.addEventListener('click', function (e) {
      var r = 6;
      if (e.clientX < r || e.clientY < r || e.clientX > innerWidth - r || e.clientY > innerHeight - r) b.remove();
    });
    document.body.appendChild(b);
  }
})();
