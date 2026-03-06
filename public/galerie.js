(function () {
  var app = document.getElementById("galerie-app");
  var cache = {};

  function tt(key) {
    return typeof t === "function" ? t(key) : key;
  }

  function prefix() {
    return typeof langPrefix === "function" ? langPrefix() : "";
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    var d = new Date(dateStr + "T00:00:00");
    var lang = (typeof currentLang !== "undefined" && currentLang !== "sigma") ? currentLang : "en";
    if (lang === "cs") lang = "cs-CZ";
    return d.toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" });
  }

  function photoUrl(r2Key) {
    return "/dungeon/photos/" + r2Key;
  }

  // ── Gallery list view ──
  async function renderList() {
    app.innerHTML = '<div class="galerie-loading"><div class="galerie-spinner"></div></div>';

    try {
      if (!cache.list) {
        var res = await fetch("/api/galleries");
        cache.list = await res.json();
      }
      var galleries = cache.list;

      if (!galleries.length) {
        app.innerHTML =
          '<div class="container" style="padding-top:8rem;text-align:center;">' +
          '<p class="section-label">' + escHtml(tt("galerie.label")) + '</p>' +
          '<h2 class="section-title">' + escHtml(tt("galerie.empty_title")) + '</h2>' +
          '<div class="section-divider" style="margin:1rem auto 2rem;"></div>' +
          '<p style="color:var(--muted);">' + escHtml(tt("galerie.empty_desc")) + '</p>' +
          "</div>";
        return;
      }

      // Group by year
      var byYear = {};
      galleries.forEach(function (g) {
        var year = g.date_from ? g.date_from.slice(0, 4) : "\u2014";
        if (!byYear[year]) byYear[year] = [];
        byYear[year].push(g);
      });
      var years = Object.keys(byYear).sort(function (a, b) { return b.localeCompare(a); });

      var html =
        '<div class="container" style="padding-top:8rem;">' +
        '<p class="section-label">' + escHtml(tt("galerie.label")) + '</p>' +
        '<h2 class="section-title">' + escHtml(tt("galerie.title")) + '</h2>' +
        '<div class="section-divider"></div>';

      years.forEach(function (year) {
        html += '<h3 class="galerie-year">' + escHtml(year) + '</h3>';
        html += '<div class="galerie-grid">';

        byYear[year].forEach(function (g) {
          var cover = g.cover_r2_key
            ? '<img src="' + photoUrl(g.cover_r2_key) + '" alt="' + escHtml(g.title) + '" loading="lazy" />'
            : '<div class="galerie-card-placeholder"></div>';

          var dateLabel = formatDate(g.date_from);
          if (g.date_to) dateLabel += " \u2013 " + formatDate(g.date_to);

          html +=
            '<a href="' + prefix() + '/galerie/' + g.id + '" class="galerie-card" data-id="' + g.id + '">' +
            '<div class="galerie-card-img">' + cover + '</div>' +
            '<div class="galerie-card-overlay">' +
            '<h3>' + escHtml(g.title) + "</h3>" +
            '<span class="galerie-card-date">' + dateLabel + "</span>" +
            "</div>" +
            "</a>";
        });

        html += "</div>";
      });

      html += "</div>";
      app.innerHTML = html;

      // SPA click handler
      app.querySelectorAll(".galerie-card").forEach(function (card) {
        card.addEventListener("click", function (e) {
          e.preventDefault();
          var id = card.dataset.id;
          history.pushState(null, "", prefix() + "/galerie/" + id);
          renderDetail(id);
        });
      });
    } catch (err) {
      app.innerHTML =
        '<div class="container" style="padding-top:8rem;text-align:center;">' +
        '<p style="color:var(--muted);">' + escHtml(tt("galerie.load_error")) + '</p></div>';
    }
  }

  // ── Gallery detail view ──
  async function renderDetail(id) {
    app.innerHTML = '<div class="galerie-loading"><div class="galerie-spinner"></div></div>';

    try {
      var cacheKey = "detail_" + id;
      if (!cache[cacheKey]) {
        var res = await fetch("/api/galleries/" + id);
        if (!res.ok) throw new Error("not found");
        cache[cacheKey] = await res.json();
      }
      var gallery = cache[cacheKey];

      var dateLabel = formatDate(gallery.date_from);
      if (gallery.date_to) dateLabel += " \u2013 " + formatDate(gallery.date_to);

      var html =
        '<div class="container" style="padding-top:8rem;">' +
        '<div class="galerie-detail-header">' +
        '<a href="' + prefix() + '/galerie" class="galerie-back">' + escHtml(tt("galerie.back")) + '</a>' +
        '<h2 class="section-title">' + escHtml(gallery.title) + "</h2>" +
        '<span class="galerie-detail-date">' + dateLabel + "</span>";

      if (gallery.description) {
        html += '<p class="galerie-detail-desc">' + escHtml(gallery.description) + "</p>";
      }

      html += "</div>";

      if (gallery.photos && gallery.photos.length) {
        html += '<div class="galerie-photo-grid">';
        gallery.photos.forEach(function (p) {
          html +=
            '<div class="galerie-photo">' +
            '<img src="' + photoUrl(p.r2_key) + '" alt="' + escHtml(gallery.title) +
            '" loading="lazy" width="' + p.width + '" height="' + p.height + '" />' +
            "</div>";
        });
        html += "</div>";
      } else {
        html += '<p style="color:var(--muted);margin-top:2rem;">' + escHtml(tt("galerie.no_photos")) + '</p>';
      }

      html += "</div>";
      app.innerHTML = html;

      // SPA back link
      var backLink = app.querySelector(".galerie-back");
      if (backLink) {
        backLink.addEventListener("click", function (e) {
          e.preventDefault();
          history.pushState(null, "", prefix() + "/galerie");
          renderList();
        });
      }

      // Lightbox
      app.querySelectorAll(".galerie-photo img").forEach(function (img) {
        img.addEventListener("click", function () {
          openLightbox(img.src);
        });
      });
    } catch (err) {
      app.innerHTML =
        '<div class="container" style="padding-top:8rem;text-align:center;">' +
        '<a href="' + prefix() + '/galerie" class="galerie-back">' + escHtml(tt("galerie.back")) + '</a>' +
        '<p style="color:var(--muted);margin-top:2rem;">' + escHtml(tt("galerie.not_found")) + '</p></div>';

      var bl = app.querySelector(".galerie-back");
      if (bl) bl.addEventListener("click", function (e) {
        e.preventDefault();
        history.pushState(null, "", prefix() + "/galerie");
        renderList();
      });
    }
  }

  // ── Lightbox ──
  function openLightbox(src) {
    var overlay = document.createElement("div");
    overlay.className = "galerie-lightbox";
    overlay.innerHTML = '<img src="' + src + '" alt="" />';
    overlay.addEventListener("click", function () {
      overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  // ── Router ──
  function route() {
    var path = location.pathname;
    // Strip lang prefix for matching
    var clean = path.replace(/^\/(en|de|pl|sigma)/, "");
    var match = clean.match(/^\/galerie\/(\d+)/);
    if (match) {
      renderDetail(match[1]);
    } else {
      renderList();
    }
  }

  window.addEventListener("popstate", route);

  function escHtml(str) {
    var div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  // Initial render
  route();
})();
