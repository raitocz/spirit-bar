// SPiRiT Dungeon – Admin SPA
(function () {
  "use strict";

  const app = document.getElementById("app");
  let currentUser = null;
  let currentRole = null;
  let currentUserId = null;
  const validPages = ["galerie", "kvizy", "smeny", "akce", "posta", "obeznik", "uzivatele", "logy", "nastaveni"];
  let currentPage = (function() {
    const h = location.hash.replace("#", "").split("/")[0];
    return validPages.includes(h) ? h : null;
  })();

  // ── Dev environment border ──
  (function () {
    if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
    const b = document.createElement("div");
    b.style.cssText = "position:fixed;inset:0;z-index:99999;pointer-events:none;border:3px solid #34d399;border-radius:4px;";
    document.addEventListener("click", (e) => {
      const r = 6;
      if (e.clientX < r || e.clientY < r || e.clientX > innerWidth - r || e.clientY > innerHeight - r) b.remove();
    });
    document.body.appendChild(b);
  })();

  // ── Toast notifications ──

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = "toast toast--" + type;
    const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
    const iconSpan = document.createElement("span");
    iconSpan.className = "toast-icon";
    iconSpan.textContent = icon;
    const msgSpan = document.createElement("span");
    msgSpan.textContent = message;
    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("toast--visible"));
    setTimeout(() => {
      toast.classList.remove("toast--visible");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ── Confirm dialog ──

  function showConfirm(title, message) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      const modal = document.createElement("div");
      modal.className = "modal";
      const h3 = document.createElement("h3");
      h3.textContent = title;
      const p = document.createElement("p");
      p.innerHTML = message; // callers must escape user data with esc()
      const btns = document.createElement("div");
      btns.className = "modal-btns";
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn-secondary";
      cancelBtn.dataset.action = "cancel";
      cancelBtn.textContent = "Zrušit";
      const okBtn = document.createElement("button");
      okBtn.className = "btn-primary";
      okBtn.dataset.action = "ok";
      okBtn.textContent = "Potvrdit";
      btns.appendChild(cancelBtn);
      btns.appendChild(okBtn);
      modal.appendChild(h3);
      modal.appendChild(p);
      modal.appendChild(btns);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      function close(result) {
        overlay.remove();
        resolve(result);
      }
      overlay.querySelector('[data-action="cancel"]').addEventListener("click", () => close(false));
      overlay.querySelector('[data-action="ok"]').addEventListener("click", () => close(true));
      overlay.addEventListener("click", (e) => { if (e.target === overlay) close(false); });
    });
  }

  // ── Color contrast utility ──

  function contrastColor(hex) {
    if (!hex) return "#fff";
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.55 ? "#000" : "#fff";
  }

  // ── DatePicker ──

  const DatePicker = (() => {
    const MONTHS = [
      "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
      "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
    ];
    const DAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

    function formatDisplay(iso) {
      if (!iso) return "";
      const [y, m, d] = iso.split("-");
      return d + ". " + m + ". " + y;
    }

    function toISO(y, m, d) {
      return y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    }

    function create(inputId, isoValue) {
      const input = document.getElementById(inputId);
      if (!input) return;

      // Wrap input
      const wrap = document.createElement("div");
      wrap.className = "datepicker-wrap";
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);

      // Convert to text input
      input.type = "text";
      input.readOnly = true;
      input.classList.add("datepicker-input");

      // Set initial value
      if (isoValue) {
        input.dataset.value = isoValue;
        input.value = formatDisplay(isoValue);
      } else {
        input.dataset.value = "";
        input.value = "";
      }

      let viewYear, viewMonth; // 0-indexed month
      let dropdown = null;

      function initView() {
        if (input.dataset.value) {
          const [y, m] = input.dataset.value.split("-");
          viewYear = Number(y);
          viewMonth = Number(m) - 1;
        } else {
          const now = new Date();
          viewYear = now.getFullYear();
          viewMonth = now.getMonth();
        }
      }

      function open() {
        if (dropdown) return;
        initView();
        dropdown = document.createElement("div");
        dropdown.className = "datepicker-dropdown";
        wrap.appendChild(dropdown);
        render();
        setTimeout(() => document.addEventListener("click", outsideClick), 0);
      }

      function close() {
        if (!dropdown) return;
        dropdown.remove();
        dropdown = null;
        document.removeEventListener("click", outsideClick);
      }

      function outsideClick(e) {
        if (!wrap.contains(e.target)) close();
      }

      function render() {
        if (!dropdown) return;

        const today = new Date();
        const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());
        const selectedISO = input.dataset.value || "";

        // First day of month and day-of-week (Mon=0)
        const firstDay = new Date(viewYear, viewMonth, 1);
        const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

        let html = `
          <div class="datepicker-header">
            <button type="button" class="datepicker-prev">&lsaquo;</button>
            <span>${MONTHS[viewMonth]} ${viewYear}</span>
            <button type="button" class="datepicker-next">&rsaquo;</button>
          </div>
          <div class="datepicker-grid">
            ${DAYS.map((d) => `<div class="datepicker-weekday">${d}</div>`).join("")}
        `;

        // Previous month fill
        for (let i = startDow - 1; i >= 0; i--) {
          const d = prevMonthDays - i;
          const pm = viewMonth === 0 ? 11 : viewMonth - 1;
          const py = viewMonth === 0 ? viewYear - 1 : viewYear;
          const iso = toISO(py, pm, d);
          html += `<button type="button" class="datepicker-day datepicker-day--other" data-iso="${iso}">${d}</button>`;
        }

        // Current month
        for (let d = 1; d <= daysInMonth; d++) {
          const iso = toISO(viewYear, viewMonth, d);
          let cls = "datepicker-day";
          if (iso === todayISO) cls += " datepicker-day--today";
          if (iso === selectedISO) cls += " datepicker-day--selected";
          html += `<button type="button" class="${cls}" data-iso="${iso}">${d}</button>`;
        }

        // Next month fill
        const totalCells = startDow + daysInMonth;
        const remaining = (7 - (totalCells % 7)) % 7;
        for (let d = 1; d <= remaining; d++) {
          const nm = viewMonth === 11 ? 0 : viewMonth + 1;
          const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
          const iso = toISO(ny, nm, d);
          html += `<button type="button" class="datepicker-day datepicker-day--other" data-iso="${iso}">${d}</button>`;
        }

        html += "</div>";
        dropdown.innerHTML = html;

        // Event listeners
        dropdown.querySelector(".datepicker-prev").addEventListener("click", (e) => {
          e.stopPropagation();
          viewMonth--;
          if (viewMonth < 0) { viewMonth = 11; viewYear--; }
          render();
        });
        dropdown.querySelector(".datepicker-next").addEventListener("click", (e) => {
          e.stopPropagation();
          viewMonth++;
          if (viewMonth > 11) { viewMonth = 0; viewYear++; }
          render();
        });
        dropdown.querySelectorAll(".datepicker-day").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            input.dataset.value = btn.dataset.iso;
            input.value = formatDisplay(btn.dataset.iso);
            close();
          });
        });
      }

      input.addEventListener("click", (e) => {
        e.stopPropagation();
        if (dropdown) close(); else open();
      });
    }

    return { create };
  })();

  // ── API helpers ──

  async function api(method, path, body) {
    const opts = {
      method,
      headers: {},
      credentials: "same-origin",
    };
    if (body) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    const res = await fetch("/dungeon/api" + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  // ── Check session on load ──

  async function checkSession() {
    try {
      const data = await api("GET", "/me");
      currentUserId = data.id;
      currentUser = data.username;
      currentRole = data.role || "staff";
      renderDashboard();
    } catch {
      renderLogin();
    }
  }

  // ── Login screen ──

  function renderLogin() {
    app.innerHTML = `
      <div class="login-wrap">
        <div class="login-card">
          <img src="/img/logo/logo_white_png.png" alt="SPiRiT" class="login-logo">
          <div class="login-title">Dungeon Admin</div>
          <form id="login-form">
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" name="username" autocomplete="username" required>
            </div>
            <div class="form-group">
              <label for="password">Heslo</label>
              <div class="password-wrap">
                <input type="password" id="password" name="password" autocomplete="current-password" required>
                <button type="button" class="password-toggle" id="password-toggle" aria-label="Zobrazit heslo">
                  <svg class="eye-icon" id="eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg class="eye-icon" id="eye-closed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>
            <label class="remember-label"><input type="checkbox" id="remember"> Zapamatovat přihlášení</label>
            <button type="submit" class="login-btn">Přihlásit se</button>
            <div class="login-error" id="login-error"></div>
          </form>
        </div>
      </div>
    `;

    const form = document.getElementById("login-form");
    form.addEventListener("submit", handleLogin);

    // Cyan pulse on keystroke
    const card = document.querySelector(".login-card");
    form.addEventListener("input", () => {
      card.classList.remove("pulse");
      void card.offsetWidth;
      card.classList.add("pulse");
    });

    document.getElementById("password-toggle").addEventListener("click", () => {
      const input = document.getElementById("password");
      const open = document.getElementById("eye-open");
      const closed = document.getElementById("eye-closed");
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      open.style.display = isHidden ? "none" : "";
      closed.style.display = isHidden ? "" : "none";
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    const btn = e.target.querySelector(".login-btn");
    const errorEl = document.getElementById("login-error");
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    errorEl.textContent = "";
    btn.disabled = true;
    btn.textContent = "Přihlašování...";

    try {
      const remember = document.getElementById("remember").checked;
      const data = await api("POST", "/login", { username, password, remember });
      currentUserId = data.id;
      currentUser = data.username;
      currentRole = data.role || "staff";
      renderDashboard();
    } catch (err) {
      errorEl.textContent = err.message === "invalid credentials"
        ? "Neplatné přihlašovací údaje"
        : "Chyba při přihlášení";
      btn.disabled = false;
      btn.textContent = "Přihlásit se";
    }
  }

  // ── Dashboard ──

  // ── ACL ──

  const pages = {
    galerie:   { label: "Galerie",    icon: "\uD83D\uDDBC\uFE0F", roles: ["admin"] },
    kvizy:     { label: "Kvízy",      icon: "\uD83C\uDFAF",       roles: ["admin", "quizmaster"], writeRoles: ["admin"] },
    smeny:     { label: "Směny",      icon: "\uD83D\uDCC5",       roles: ["admin", "staff"] },
    akce:      { label: "Kalendář akcí", icon: "\uD83C\uDF89",    roles: ["admin"] },
    posta:     { label: "Pošta",      icon: "\u2709\uFE0F",       roles: ["admin"] },
    obeznik:   { label: "Oběžníky",   icon: "\uD83D\uDCE8",       roles: ["admin"] },
    uzivatele: { label: "Uživatelé",  icon: "\uD83D\uDC65",       roles: ["admin"] },
    logy:      { label: "Logy",       icon: "\uD83D\uDCCB",       roles: ["admin"] },
    nastaveni: { label: "Nastavení",  icon: "\u2699\uFE0F",       roles: ["admin"] },
  };

  const defaultPage = { admin: "galerie", quizmaster: "kvizy", staff: "smeny" };

  function canSeePage(key) {
    const p = pages[key];
    return p && p.roles.includes(currentRole);
  }

  function canWrite(key) {
    const p = pages[key];
    if (!p) return false;
    return (p.writeRoles || p.roles).includes(currentRole);
  }

  function renderDashboard() {
    // Resolve initial page or redirect away from pages the user can't see
    if (!currentPage || !canSeePage(currentPage)) {
      currentPage = defaultPage[currentRole] || "galerie";
      location.hash = currentPage;
    }

    const navItems = Object.entries(pages)
      .filter(([key]) => canSeePage(key))
      .map(
        ([key, { label, icon }]) =>
          `<li><a href="#" data-page="${key}" class="${key === currentPage ? "active" : ""}">
            <span class="nav-icon">${icon}</span>${label}
          </a></li>`
      )
      .join("");

    app.innerHTML = `
      <div class="dashboard">
        <div class="sidebar-overlay" id="sidebar-overlay"></div>
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-logo">
            <img src="/img/logo/logo_white_png.png" alt="SPiRiT">
            <span class="sidebar-label">Dungeon</span>
          </div>
          <ul class="sidebar-nav">${navItems}</ul>
          <div class="sidebar-bottom">
            <a href="/" class="sidebar-frontend-link">
              <span class="nav-icon">\uD83C\uDF10</span>Frontend
            </a>
            <a href="#" id="logout-btn">
              <span class="nav-icon">\uD83D\uDEAA</span>Odhlásit se
            </a>
            <div class="sidebar-version" id="sidebar-version"></div>
          </div>
        </aside>
        <main class="main">
          <div class="main-header">
            <button class="burger-btn" id="burger-btn" aria-label="Menu">
              <span></span><span></span><span></span>
            </button>
            <h1 id="page-title">${pages[currentPage].label}</h1>
            <span class="main-user"><span class="role-badge role-badge--${esc(currentRole)}">${esc(currentRole)}</span> ${esc(currentUser)}</span>
          </div>
          <div class="main-content" id="page-content"></div>
        </main>
      </div>
    `;

    // Nav click handlers
    document.querySelectorAll(".sidebar-nav a").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page && page !== currentPage) {
          stopTeamsPolling();
          stopShiftsPolling();
          currentPage = page;
          currentQuizId = null;
          resultsMode = false;
          location.hash = page;
          renderDashboard();
        }
      });
    });

    document.getElementById("logout-btn").addEventListener("click", handleLogout);

    // Load version badge
    fetch("/version.json").then(r => r.json()).then(data => {
      const el = document.getElementById("sidebar-version");
      if (el && data.version) {
        el.textContent = "v" + data.version;
        el.style.cursor = "pointer";
        el.addEventListener("click", () => showChangelog());
      }
    }).catch(() => {});

    // Burger menu toggle
    const burger = document.getElementById("burger-btn");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    function closeMobileMenu() {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
    }

    burger.addEventListener("click", () => {
      const isOpen = sidebar.classList.toggle("open");
      overlay.classList.toggle("open", isOpen);
    });

    overlay.addEventListener("click", closeMobileMenu);

    // Close menu when nav link is clicked (mobile)
    document.querySelectorAll(".sidebar-nav a").forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });

    // Render page content
    const content = document.getElementById("page-content");
    if (currentPage === "galerie") {
      renderGalerie(content);
    } else if (currentPage === "kvizy") {
      renderKvizy(content);
    } else if (currentPage === "smeny") {
      renderSmeny(content);
    } else if (currentPage === "akce") {
      renderAkce(content);
    } else if (currentPage === "posta") {
      renderPosta(content);
    } else if (currentPage === "obeznik") {
      renderObeznik(content);
    } else if (currentPage === "uzivatele") {
      renderUzivatele(content);
    } else if (currentPage === "logy") {
      renderLogy(content);
    } else if (currentPage === "nastaveni") {
      renderNastaveni(content);
    } else {
      content.innerHTML = `<div class="placeholder-msg">Sekce „${pages[currentPage].label}" – připravuje se</div>`;
    }
  }

  // ── Galerie ──

  let galleries = [];
  let editingGalleryId = null;
  let currentGalleryId = null;

  async function loadGalleries() {
    galleries = await api("GET", "/galleries");
  }

  function renderGalerie(container) {
    if (currentGalleryId) {
      renderGalleryDetail(container);
      return;
    }

    container.innerHTML = `
      <div class="gallery-toolbar">
        <button class="btn-primary" id="gallery-add-btn">+ Přidat galerii</button>
        <button class="btn-secondary" id="regen-all-thumbs-btn">Přegenerovat všechny náhledy</button>
        <span id="regen-all-status" style="margin-left:0.5rem;color:var(--muted);font-size:0.85rem;"></span>
      </div>
      <div id="gallery-form-wrap"></div>
      <div class="gallery-list" id="gallery-list">
        <div class="placeholder-msg">Načítání…</div>
      </div>
    `;

    document.getElementById("gallery-add-btn").addEventListener("click", () => {
      editingGalleryId = null;
      showGalleryForm();
    });
    document.getElementById("regen-all-thumbs-btn").addEventListener("click", regenerateAllThumbnails);

    loadGalleries().then(renderGalleryList).catch(() => {
      document.getElementById("gallery-list").innerHTML =
        '<div class="placeholder-msg">Nepodařilo se načíst galerie</div>';
    });
  }

  function renderGalleryList() {
    const list = document.getElementById("gallery-list");
    if (!galleries.length) {
      list.innerHTML = '<div class="placeholder-msg">Žádné galerie</div>';
      return;
    }

    // Group by year (sorted DESC from API)
    const byYear = {};
    galleries.forEach((g) => {
      const year = g.date_from ? g.date_from.slice(0, 4) : "—";
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(g);
    });

    let html = "";
    Object.keys(byYear)
      .sort((a, b) => b.localeCompare(a))
      .forEach((year) => {
        html += `<div class="year-header">${esc(year)}</div>`;
        byYear[year].forEach((g) => {
          html += `
            <div class="gallery-card" data-id="${g.id}">
              <div class="gallery-card-body">
                <div class="gallery-card-title">${esc(g.title)}</div>
                <div class="gallery-card-date">${formatDateRange(g.date_from, g.date_to)}</div>
                ${g.description ? `<div class="gallery-card-desc">${esc(g.description)}</div>` : ""}
              </div>
              <div class="gallery-card-actions">
                <button class="btn-small btn-edit" data-id="${g.id}">Upravit</button>
                <button class="btn-small btn-delete" data-id="${g.id}">Smazat</button>
              </div>
            </div>`;
        });
      });
    list.innerHTML = html;

    list.querySelectorAll(".gallery-card-body").forEach((body) => {
      body.style.cursor = "pointer";
      body.addEventListener("click", () => {
        currentGalleryId = Number(body.closest(".gallery-card").dataset.id);
        renderDashboard();
      });
    });

    list.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        editingGalleryId = Number(btn.dataset.id);
        showGalleryForm();
      });
    });

    list.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteGallery(Number(btn.dataset.id));
      });
    });
  }

  function showGalleryForm() {
    const wrap = document.getElementById("gallery-form-wrap");
    const g = editingGalleryId
      ? galleries.find((x) => x.id === editingGalleryId)
      : null;

    wrap.innerHTML = `
      <form class="gallery-form" id="gallery-form">
        <div class="form-group">
          <label for="gf-title">Název *</label>
          <input type="text" id="gf-title" required value="${g ? esc(g.title) : ""}">
        </div>
        <div class="form-group">
          <label for="gf-desc">Popis</label>
          <textarea id="gf-desc" rows="2">${g ? esc(g.description) : ""}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="gf-from">Datum od *</label>
            <input type="text" id="gf-from" required readonly>
          </div>
          <div class="form-group">
            <label for="gf-to">Datum do</label>
            <input type="text" id="gf-to" readonly>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">${g ? "Uložit" : "Vytvořit"}</button>
          <button type="button" class="btn-secondary" id="gf-cancel">Zrušit</button>
        </div>
        <div class="login-error" id="gf-error"></div>
      </form>
    `;

    DatePicker.create("gf-from", g ? g.date_from : "");
    DatePicker.create("gf-to", g ? (g.date_to || "") : "");

    document.getElementById("gf-cancel").addEventListener("click", () => {
      wrap.innerHTML = "";
      editingGalleryId = null;
    });

    document.getElementById("gallery-form").addEventListener("submit", handleGallerySubmit);
  }

  async function handleGallerySubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector(".btn-primary");
    const errorEl = document.getElementById("gf-error");
    errorEl.textContent = "";
    btn.disabled = true;

    const payload = {
      title: document.getElementById("gf-title").value,
      description: document.getElementById("gf-desc").value,
      date_from: document.getElementById("gf-from").dataset.value,
      date_to: document.getElementById("gf-to").dataset.value || null,
    };

    try {
      if (editingGalleryId) {
        await api("PUT", "/galleries/" + editingGalleryId, payload);
      } else {
        await api("POST", "/galleries", payload);
      }
      editingGalleryId = null;
      document.getElementById("gallery-form-wrap").innerHTML = "";
      await loadGalleries();
      renderGalleryList();
    } catch (err) {
      errorEl.textContent = err.message;
      btn.disabled = false;
    }
  }

  async function deleteGallery(id) {
    if (!await showConfirm("Smazat galerii", "Opravdu smazat tuto galerii? Všechny fotky budou odstraněny.")) return;
    try {
      await api("DELETE", "/galleries/" + id);
      await loadGalleries();
      renderGalleryList();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function formatDateRange(from, to) {
    const f = formatDate(from);
    if (!to) return f;
    return f + " – " + formatDate(to);
  }

  function formatDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return d + ". " + m + ". " + y;
  }

  function esc(str) {
    const el = document.createElement("span");
    el.textContent = str;
    return el.innerHTML;
  }

  // ── Gallery Detail ──

  async function renderGalleryDetail(container) {
    const gallery = galleries.find((g) => g.id === currentGalleryId);
    const title = gallery ? esc(gallery.title) : "Galerie";

    container.innerHTML = `
      <div class="gallery-detail-header">
        <button class="btn-secondary" id="gallery-back-btn">&larr; Zpět</button>
        <h2>${title}</h2>
      </div>
      <div class="upload-area" id="upload-area">
        <button class="btn-primary" id="photo-upload-btn">Nahrát fotky</button>
        <button class="btn-secondary" id="regen-thumbs-btn">Přegenerovat náhledy</button>
        <input type="file" id="photo-file-input" multiple accept="image/*" hidden>
        <div class="upload-status" id="upload-status"></div>
      </div>
      <div class="photo-grid" id="photo-grid">
        <div class="placeholder-msg">Načítání…</div>
      </div>
    `;

    document.getElementById("gallery-back-btn").addEventListener("click", () => {
      currentGalleryId = null;
      renderDashboard();
    });

    const fileInput = document.getElementById("photo-file-input");
    document.getElementById("photo-upload-btn").addEventListener("click", () => {
      fileInput.click();
    });
    fileInput.addEventListener("change", handlePhotoUpload);
    document.getElementById("regen-thumbs-btn").addEventListener("click", regenerateThumbnails);

    loadAndRenderPhotos();
  }

  let galleryPhotos = [];

  async function loadAndRenderPhotos() {
    try {
      galleryPhotos = await api("GET", "/galleries/" + currentGalleryId + "/photos");
      renderPhotoGrid();
    } catch {
      document.getElementById("photo-grid").innerHTML =
        '<div class="placeholder-msg">Nepodařilo se načíst fotky</div>';
    }
  }

  let dragSrcCard = null;

  function renderPhotoGrid() {
    const grid = document.getElementById("photo-grid");
    if (!galleryPhotos.length) {
      grid.innerHTML = '<div class="placeholder-msg">Žádné fotky</div>';
      return;
    }
    grid.innerHTML = galleryPhotos.map((p) => `
      <div class="photo-card" data-id="${p.id}" draggable="true">
        <div class="photo-card-drag-handle" title="Přetáhněte pro změnu pořadí">⠿</div>
        <img class="photo-card-img" src="/dungeon/photos/${p.r2_key}" alt="${esc(p.filename)}" loading="lazy">
        <button class="photo-card-delete" data-id="${p.id}" title="Smazat">&times;</button>
      </div>
    `).join("");

    grid.querySelectorAll(".photo-card-delete").forEach((btn) => {
      btn.addEventListener("click", () => deletePhoto(Number(btn.dataset.id)));
    });

    // Drag-and-drop
    grid.querySelectorAll(".photo-card").forEach((card) => {
      card.addEventListener("dragstart", (e) => {
        dragSrcCard = card;
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", card.dataset.id);
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        grid.querySelectorAll(".photo-card").forEach((c) => c.classList.remove("drag-over"));
        dragSrcCard = null;
      });

      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (card !== dragSrcCard) {
          card.classList.add("drag-over");
        }
      });

      card.addEventListener("dragleave", () => {
        card.classList.remove("drag-over");
      });

      card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over");
        if (!dragSrcCard || card === dragSrcCard) return;

        // Reorder in DOM
        const allCards = Array.from(grid.querySelectorAll(".photo-card"));
        const fromIdx = allCards.indexOf(dragSrcCard);
        const toIdx = allCards.indexOf(card);

        // Reorder the data array
        const moved = galleryPhotos.splice(fromIdx, 1)[0];
        galleryPhotos.splice(toIdx, 0, moved);

        // Re-render and persist
        renderPhotoGrid();
        savePhotoOrder();
      });
    });
  }

  async function savePhotoOrder() {
    const photoIds = galleryPhotos.map((p) => p.id);
    try {
      await api("PUT", "/galleries/" + currentGalleryId + "/photos/reorder", { photoIds });
    } catch (err) {
      console.error("Failed to save photo order:", err);
    }
  }

  async function deletePhoto(photoId) {
    if (!await showConfirm("Smazat fotku", "Opravdu smazat tuto fotku?")) return;
    try {
      await api("DELETE", "/galleries/" + currentGalleryId + "/photos/" + photoId);
      galleryPhotos = galleryPhotos.filter((p) => p.id !== photoId);
      renderPhotoGrid();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handlePhotoUpload() {
    const fileInput = document.getElementById("photo-file-input");
    const files = Array.from(fileInput.files);
    if (!files.length) return;

    const status = document.getElementById("upload-status");
    const uploadBtn = document.getElementById("photo-upload-btn");
    uploadBtn.disabled = true;

    for (let i = 0; i < files.length; i++) {
      status.textContent = `Nahrávání ${i + 1} / ${files.length}…`;
      try {
        const resized = await resizeImage(files[i], 1920, 1080);
        const formData = new FormData();
        formData.append("file", resized.blob, files[i].name.replace(/\.[^.]+$/, ".webp"));
        formData.append("width", resized.width);
        formData.append("height", resized.height);

        // Generate thumbnails client-side
        const thumbBlob = await generateThumb(resized.blob, 800, 0.82);
        formData.append("thumb", thumbBlob, "thumb.webp");
        const coverThumbBlob = await generateThumb(resized.blob, 350, 0.82);
        formData.append("cover_thumb", coverThumbBlob, "cover.webp");

        const res = await fetch("/dungeon/api/galleries/" + currentGalleryId + "/photos", {
          method: "POST",
          headers: { "Authorization": "Bearer " + getToken() },
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }
        const photo = await res.json();
        galleryPhotos.push(photo);
      } catch (err) {
        status.textContent = `Chyba u "${files[i].name}": ${err.message}`;
        uploadBtn.disabled = false;
        fileInput.value = "";
        return;
      }
    }

    status.textContent = "";
    uploadBtn.disabled = false;
    fileInput.value = "";
    renderPhotoGrid();
  }

  async function regenerateThumbnails() {
    if (!galleryPhotos.length) {
      showToast("Žádné fotky k přegenerování", "info");
      return;
    }
    const btn = document.getElementById("regen-thumbs-btn");
    const status = document.getElementById("upload-status");
    btn.disabled = true;

    let done = 0;
    let errors = 0;
    for (const photo of galleryPhotos) {
      done++;
      status.textContent = `Generování náhledů ${done} / ${galleryPhotos.length}…`;
      try {
        // Fetch full-res image from R2
        const imgSrc = "/dungeon/photos/" + photo.r2_key;
        const thumbBlob = await generateThumb(imgSrc, 800, 0.82);
        const coverThumbBlob = await generateThumb(imgSrc, 350, 0.82);

        const formData = new FormData();
        formData.append("thumb", thumbBlob, "thumb.webp");
        formData.append("cover_thumb", coverThumbBlob, "cover.webp");

        const res = await fetch("/dungeon/api/galleries/" + currentGalleryId + "/photos/" + photo.id + "/thumbs", {
          method: "PUT",
          headers: { "Authorization": "Bearer " + getToken() },
          body: formData,
        });
        if (!res.ok) throw new Error("Failed");
      } catch {
        errors++;
      }
    }

    status.textContent = "";
    btn.disabled = false;
    if (errors) {
      showToast(`Hotovo (${errors} chyb)`, "error");
    } else {
      showToast(`Náhledy přegenerovány (${galleryPhotos.length} fotek)`, "success");
    }
    // Reload photos to get updated thumb keys
    loadAndRenderPhotos();
  }

  async function regenerateAllThumbnails() {
    const btn = document.getElementById("regen-all-thumbs-btn");
    const status = document.getElementById("regen-all-status");
    btn.disabled = true;

    try {
      const allGalleries = await api("GET", "/galleries");
      if (!allGalleries.length) {
        showToast("Žádné galerie", "info");
        btn.disabled = false;
        return;
      }

      let totalPhotos = 0;
      let done = 0;
      let errors = 0;

      // Collect all photos from all galleries
      const galleryPhotosAll = [];
      for (const g of allGalleries) {
        status.textContent = `Načítání galerie „${g.title}"…`;
        const photos = await api("GET", "/galleries/" + g.id + "/photos");
        photos.forEach((p) => galleryPhotosAll.push({ galleryId: g.id, photo: p }));
      }

      totalPhotos = galleryPhotosAll.length;
      if (!totalPhotos) {
        showToast("Žádné fotky k přegenerování", "info");
        status.textContent = "";
        btn.disabled = false;
        return;
      }

      for (const { galleryId, photo } of galleryPhotosAll) {
        done++;
        status.textContent = `Generování náhledů ${done} / ${totalPhotos}…`;
        try {
          const imgSrc = "/dungeon/photos/" + photo.r2_key;
          const thumbBlob = await generateThumb(imgSrc, 800, 0.82);
          const coverThumbBlob = await generateThumb(imgSrc, 350, 0.82);

          const formData = new FormData();
          formData.append("thumb", thumbBlob, "thumb.webp");
          formData.append("cover_thumb", coverThumbBlob, "cover.webp");

          const res = await fetch("/dungeon/api/galleries/" + galleryId + "/photos/" + photo.id + "/thumbs", {
            method: "PUT",
            headers: { "Authorization": "Bearer " + getToken() },
            body: formData,
          });
          if (!res.ok) throw new Error("Failed");
        } catch {
          errors++;
        }
      }

      status.textContent = "";
      btn.disabled = false;
      if (errors) {
        showToast(`Hotovo: ${totalPhotos} fotek, ${errors} chyb`, "error");
      } else {
        showToast(`Všechny náhledy přegenerovány (${totalPhotos} fotek)`, "success");
      }
    } catch (err) {
      status.textContent = "";
      btn.disabled = false;
      showToast("Chyba: " + err.message, "error");
    }
  }

  function resizeImage(file, maxW, maxH, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let w = img.width;
        let h = img.height;

        // For portrait images, swap max bounds
        const mw = w >= h ? maxW : maxH;
        const mh = w >= h ? maxH : maxW;

        if (w > mw || h > mh) {
          const ratio = Math.min(mw / w, mh / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Canvas export failed"));
            resolve({ blob, width: w, height: h });
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      img.src = url;
    });
  }

  // Generate thumbnail blob from an image source (URL or blob)
  function generateThumb(src, maxW, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxW) {
          h = Math.round(h * (maxW / w));
          w = maxW;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Thumb export failed")),
          "image/webp",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image for thumb"));
      img.src = typeof src === "string" ? src : URL.createObjectURL(src);
    });
  }

  // ── Směny ──

  let shiftStaff = [];
  let shiftsPollingTimer = null;
  let shiftViewYear = null;
  let shiftViewMonth = null;
  let shiftMonthData = null;
  let smenyTab = "rozpis";

  const DAY_NAMES_SHORT = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
  const MONTH_NAMES = [
    "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
    "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
  ];

  function getShiftInfo(dow) {
    if (dow === 1) return { label: "Zavřeno", duration: null };
    if (dow === 5 || dow === 6) return { label: "16:30–02:00", duration: "9.5h" };
    return { label: "16:30–22:00", duration: "5.5h" };
  }

  function renderSmeny(container) {
    const isStaff = currentRole === "staff";
    const isAdmin = currentRole === "admin";

    // Read sub-tab from hash (e.g. #smeny/zapis, #smeny/prehled)
    const hashSub = location.hash.replace("#", "").split("/")[1];
    if (hashSub === "prehled") smenyTab = "prehled";
    else if (isStaff && hashSub === "zapis") smenyTab = "zapis";
    else if (smenyTab !== "prehled") smenyTab = "rozpis";

    // Tabs: admin sees Rozpis + Přehled, staff sees Rozpis + Zápis + Přehled
    let tabsHtml = `<div class="smeny-tabs">
      <button class="smeny-tab${smenyTab === "rozpis" ? " active" : ""}" data-tab="rozpis">Rozpis</button>
      ${isStaff ? `<button class="smeny-tab${smenyTab === "zapis" ? " active" : ""}" data-tab="zapis">Zápis</button>` : ""}
      <button class="smeny-tab${smenyTab === "prehled" ? " active" : ""}" data-tab="prehled">Přehled</button>
    </div>`;

    container.innerHTML = tabsHtml + '<div id="smeny-content"></div>';

    container.querySelectorAll(".smeny-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        smenyTab = btn.dataset.tab;
        location.hash = smenyTab === "rozpis" ? "smeny" : "smeny/" + smenyTab;
        renderSmeny(container);
      });
    });

    const content = document.getElementById("smeny-content");
    if (smenyTab === "prehled") {
      renderPrehled(content);
    } else if (smenyTab === "zapis") {
      renderZapis(content);
    } else {
      renderRozpis(content);
    }

    // Start live polling for shift changes
    startShiftsPolling();
  }

  function renderRozpis(container) {
    const now = new Date();
    if (!shiftViewYear) shiftViewYear = now.getFullYear();
    if (!shiftViewMonth) shiftViewMonth = now.getMonth() + 1;

    container.innerHTML = `
      <div class="shifts-nav">
        <button class="shifts-nav-btn" id="shifts-prev">&lsaquo;</button>
        <span class="shifts-nav-title" id="shifts-title"></span>
        <button class="shifts-nav-btn" id="shifts-next">&rsaquo;</button>
        <button class="btn-secondary btn-small" id="shifts-today">Dnes</button>
      </div>
      <div class="shifts-table-wrap">
        <div id="shifts-table"><div class="placeholder-msg">Načítání…</div></div>
      </div>
      <div id="shifts-stats-wrap"></div>
    `;

    updateShiftsTitle();

    document.getElementById("shifts-prev").addEventListener("click", () => {
      shiftViewMonth--;
      if (shiftViewMonth < 1) { shiftViewMonth = 12; shiftViewYear--; }
      updateShiftsTitle();
      loadAndRenderShifts();
    });
    document.getElementById("shifts-next").addEventListener("click", () => {
      shiftViewMonth++;
      if (shiftViewMonth > 12) { shiftViewMonth = 1; shiftViewYear++; }
      updateShiftsTitle();
      loadAndRenderShifts();
    });
    document.getElementById("shifts-today").addEventListener("click", () => {
      const t = new Date();
      shiftViewYear = t.getFullYear();
      shiftViewMonth = t.getMonth() + 1;
      updateShiftsTitle();
      loadAndRenderShifts();
    });

    loadAndRenderShifts();
  }

  function updateShiftsTitle() {
    const el = document.getElementById("shifts-title");
    if (el) el.textContent = MONTH_NAMES[shiftViewMonth - 1] + " " + shiftViewYear;
  }

  async function loadAndRenderShifts() {
    const tableEl = document.getElementById("shifts-table");
    if (!tableEl) return;
    tableEl.innerHTML = '<div class="placeholder-msg">Načítání…</div>';
    try {
      if (!shiftStaff.length) {
        shiftStaff = await api("GET", "/shifts/staff");
      }
      shiftMonthData = await api("GET", "/shifts/" + shiftViewYear + "/" + shiftViewMonth);
      renderShiftsTable();
    } catch (err) {
      tableEl.innerHTML = '<div class="placeholder-msg">Nepodařilo se načíst směny</div>';
      showToast(err.message, "error");
    }
  }

  async function silentRefreshShifts() {
    if (!shiftViewYear || !shiftViewMonth) return;
    try {
      const fresh = await api("GET", "/shifts/" + shiftViewYear + "/" + shiftViewMonth);
      const oldJson = JSON.stringify(shiftMonthData?.days);
      const newJson = JSON.stringify(fresh.days);
      if (oldJson !== newJson) {
        shiftMonthData = fresh;
        if (smenyTab === "rozpis") {
          renderShiftsTable();
        }
      }
    } catch (_) {}

    // Also refresh Zápis calendar data if on that tab
    if (smenyTab === "zapis") {
      try {
        const data = await api("GET", "/shift-logs/month/" + zapisViewYear + "/" + zapisViewMonth);
        const newAssigned = new Set(data.assigned);
        const newLogged = new Set(data.logged);
        const changed = JSON.stringify([...newAssigned]) !== JSON.stringify([...zapisMonthAssigned])
          || JSON.stringify([...newLogged]) !== JSON.stringify([...zapisMonthLogged]);
        if (changed) {
          zapisMonthAssigned = newAssigned;
          zapisMonthLogged = newLogged;
          renderZapisCalendar();
        }
      } catch (_) {}
    }
  }

  function startShiftsPolling() {
    stopShiftsPolling();
    shiftsPollingTimer = setInterval(silentRefreshShifts, 5000);
  }

  function stopShiftsPolling() {
    if (shiftsPollingTimer) {
      clearInterval(shiftsPollingTimer);
      shiftsPollingTimer = null;
    }
  }

  function renderShiftsTable() {
    const tableEl = document.getElementById("shifts-table");
    if (!tableEl || !shiftMonthData) return;

    const isAdmin = currentRole === "admin";
    const todayStr = new Date().toISOString().slice(0, 10);

    const hookahStaff = shiftStaff.filter(s => s.staff_type === "hookah" || s.staff_type === "both" || s.role === "admin");
    const barStaff = shiftStaff.filter(s => s.staff_type === "bartender" || s.staff_type === "both" || s.role === "admin");

    let html = `<table class="shifts-table">
      <thead><tr>
        <th>Den</th>
        <th>Čas</th>
        <th>Dýmky</th>
        <th>Bar</th>
        <th>Výpomoc</th>
        <th>Můžu (záloha)</th>
        <th>Nemůžu</th>
      </tr></thead><tbody>`;

    for (const day of shiftMonthData.days) {
      const dow = day.day_of_week;
      const isMonday = dow === 1;
      const isWeekend = dow === 5 || dow === 6;
      const isToday = day.date === todayStr;
      const info = getShiftInfo(dow);
      const dayNum = Number(day.date.split("-")[2]);

      let rowClass = "";
      if (isMonday) rowClass = "shift-row--monday";
      else if (isWeekend) rowClass = "shift-row--weekend";
      if (isToday) rowClass += " shift-row--today";

      html += `<tr class="${rowClass}" data-date="${day.date}">`;

      // Den (includes time info for mobile)
      const mobileTime = isMonday
        ? '<span class="shift-mobile-time">Zavřeno</span>'
        : `<span class="shift-mobile-time">${info.label}</span><span class="shift-duration">${info.duration}</span>`;
      html += `<td class="shift-day" data-label="Den">${dayNum}. <span class="shift-day-name">${DAY_NAMES_SHORT[dow]}</span>${mobileTime}</td>`;

      // Čas (hidden on mobile via CSS)
      if (isMonday) {
        html += `<td class="shift-hours" data-label="Čas"><span class="shift-closed">Zavřeno</span></td>`;
      } else {
        html += `<td class="shift-hours" data-label="Čas">${info.label} <span class="shift-duration shift-mobile-time-hide">${info.duration}</span></td>`;
      }

      if (isMonday) {
        html += `<td data-label="Dýmky"></td><td data-label="Bar"></td><td data-label="Výpomoc"></td><td data-label="Můžu"></td><td data-label="Nemůžu"></td>`;
      } else {
        // Dýmky
        if (isAdmin) {
          const hColor = day.hookah?.color;
          const hStyle = hColor ? `background:${hColor}20;border-color:${hColor}88` : "";
          const hChipStyle = hColor ? `background:${hColor}25;border-color:${hColor}55;color:${hColor}` : "";
          html += `<td data-label="Dýmky">`;
          html += `<select class="shift-select shift-select-desktop" style="${hStyle}" data-col="hookah" data-date="${day.date}" data-prev="${day.hookah?.id || ""}">`;
          html += `<option value="">—</option>`;
          for (const s of hookahStaff) {
            html += `<option value="${s.id}"${day.hookah?.id === s.id ? " selected" : ""}>${esc(s.username)}</option>`;
          }
          html += `</select>`;
          html += `<button class="shift-pos-picker shift-select-mobile" data-col="hookah" data-date="${day.date}" style="${hChipStyle}">`;
          html += day.hookah ? esc(day.hookah.username) : '—';
          html += `</button>`;
          html += `</td>`;
        } else {
          html += `<td data-label="Dýmky">${renderStaffPositionCell(day, "hookah", day.hookah)}</td>`;
        }

        // Bar
        if (isAdmin) {
          const bColor = day.bar?.color;
          const bStyle = bColor ? `background:${bColor}20;border-color:${bColor}88` : "";
          const bChipStyle = bColor ? `background:${bColor}25;border-color:${bColor}55;color:${bColor}` : "";
          html += `<td data-label="Bar">`;
          html += `<select class="shift-select shift-select-desktop" style="${bStyle}" data-col="bar" data-date="${day.date}" data-prev="${day.bar?.id || ""}">`;
          html += `<option value="">—</option>`;
          for (const s of barStaff) {
            html += `<option value="${s.id}"${day.bar?.id === s.id ? " selected" : ""}>${esc(s.username)}</option>`;
          }
          html += `</select>`;
          html += `<button class="shift-pos-picker shift-select-mobile" data-col="bar" data-date="${day.date}" style="${bChipStyle}">`;
          html += day.bar ? esc(day.bar.username) : '—';
          html += `</button>`;
          html += `</td>`;
        } else {
          html += `<td data-label="Bar">${renderStaffPositionCell(day, "bar", day.bar)}</td>`;
        }

        // Výpomoc (only Fri/Sat)
        html += `<td data-label="Výpomoc">${isWeekend ? renderAvailChips(day, "helper") : '<span class="shift-empty">—</span>'}</td>`;

        // Můžu (záloha)
        html += `<td data-label="Můžu">${renderAvailChips(day, "available")}</td>`;

        // Nemůžu
        html += `<td data-label="Nemůžu">${renderAvailChips(day, "unavailable")}</td>`;
      }

      html += `</tr>`;
    }

    html += `</tbody></table>`;
    tableEl.innerHTML = html;

    // Wire up select change handlers (admin only)
    if (isAdmin) {
      tableEl.querySelectorAll(".shift-select-desktop").forEach(sel => {
        sel.addEventListener("change", handleShiftSelectChange);
      });

      // Mobile position pickers
      tableEl.querySelectorAll(".shift-pos-picker").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          openPositionPicker(btn);
        });
      });
    }

    // Wire up chip add/remove
    wireUpChipHandlers(tableEl);

    // Render stats table below
    renderShiftStats();
  }

  let cachedHourlyWage = null;

  function refreshShiftStats() {
    const wrap = document.getElementById("shifts-stats-wrap");
    if (!wrap) return;
    buildShiftStatsHTML(wrap);
  }

  async function renderShiftStats() {
    if (!shiftMonthData || !shiftStaff.length) return;
    const wrap = document.getElementById("shifts-stats-wrap");
    if (!wrap) return;

    // Fetch hourly wage once, then use cache
    if (cachedHourlyWage === null) {
      try {
        const wageData = await api("GET", "/settings/hourly-wage");
        cachedHourlyWage = wageData.hourly_wage ?? 0;
      } catch (_) {
        cachedHourlyWage = 0;
      }
    }

    buildShiftStatsHTML(wrap);
  }

  function buildShiftStatsHTML(tableEl) {
    // Collect stats per user
    const stats = {};
    for (const s of shiftStaff) {
      stats[s.id] = { id: s.id, username: s.username, color: s.color, shifts: 0, weekend: 0, helper: 0, hours: 0 };
    }

    for (const day of shiftMonthData.days) {
      const dow = day.day_of_week;
      if (dow === 1) continue; // Monday closed
      const isWknd = dow === 5 || dow === 6;
      const hrs = isWknd ? 9.5 : 5.5;

      for (const pos of [day.hookah, day.bar]) {
        if (pos && stats[pos.id]) {
          stats[pos.id].shifts++;
          stats[pos.id].hours += hrs;
          if (isWknd) stats[pos.id].weekend++;
        }
      }

      for (const u of (day.helper || [])) {
        if (stats[u.id]) {
          stats[u.id].helper++;
          stats[u.id].hours += hrs;
        }
      }
    }

    // Filter to users with at least one entry
    const rows = Object.values(stats).filter(s => s.shifts > 0 || s.helper > 0);

    const existing = tableEl.querySelector(".shifts-stats");

    if (!rows.length) {
      if (existing) existing.remove();
      return;
    }

    // Sort by total hours desc
    rows.sort((a, b) => b.hours - a.hours);

    const showWage = cachedHourlyWage > 0;
    const isAdmin = currentRole === "admin";

    function formatCZK(amount) {
      return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + " Kč";
    }

    let inner = '<h3 class="shifts-stats-title">Statistiky měsíce</h3>';
    inner += '<table class="shifts-stats-table"><thead><tr>';
    inner += '<th>Jméno</th><th>Směny</th><th>Víkend</th><th>Výpomoc</th><th>Hodiny</th>';
    if (showWage) inner += '<th>Mzda <span style="font-weight:400;color:var(--muted);font-size:.75em">(orientační)</span></th>';
    inner += '</tr></thead><tbody>';

    for (const r of rows) {
      const chipStyle = r.color ? `background:${r.color}25;border-color:${r.color}55;color:${r.color}` : "";
      inner += `<tr>`;
      inner += `<td><span class="shift-chip" style="${chipStyle}">${esc(r.username)}</span></td>`;
      inner += `<td>${r.shifts + r.helper}</td>`;
      inner += `<td>${r.weekend}</td>`;
      inner += `<td>${r.helper}</td>`;
      inner += `<td>${r.hours}h</td>`;
      if (showWage) {
        const wage = r.hours * cachedHourlyWage;
        if (isAdmin || r.id === currentUserId) {
          inner += `<td class="stats-wage">${formatCZK(wage)}</td>`;
        } else {
          inner += `<td></td>`;
        }
      }
      inner += `</tr>`;
    }

    inner += '</tbody></table>';

    if (existing) {
      // Replace innerHTML in-place — no DOM removal/insertion, no scroll jump
      existing.innerHTML = inner;
    } else {
      tableEl.insertAdjacentHTML("beforeend", '<div class="shifts-stats">' + inner + '</div>');
    }
  }

  function isUserOnPosition(day, userId) {
    if (day.hookah && day.hookah.id === userId) return true;
    if (day.bar && day.bar.id === userId) return true;
    if ((day.helper || []).some(u => u.id === userId)) return true;
    return false;
  }

  function renderStaffPositionCell(day, position, assigned) {
    if (assigned) {
      const isSelf = assigned.id === currentUserId;
      const color = assigned.color;
      const chipStyle = color
        ? `background:${color}25;border-color:${color}55;color:${color}`
        : "";
      let cellHtml = `<span class="shift-chip${isSelf ? " shift-chip--self" : ""}" style="${chipStyle}">${esc(assigned.username)}`;
      if (isSelf) {
        const now = new Date();
        const lockDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        const lockStr = lockDate.toISOString().slice(0, 10);
        if (day.date > lockStr) {
          cellHtml += ` <button class="shift-chip-remove shift-self-unassign" data-date="${day.date}" data-position="${position}">&times;</button>`;
        }
      }
      cellHtml += `</span>`;
      return cellHtml;
    }
    // Not assigned — check if current user can self-assign
    const selfStaff = shiftStaff.find(s => s.id === currentUserId);
    const qualified = selfStaff && (
      selfStaff.role === "admin" ||
      (position === "hookah" && ["hookah", "both"].includes(selfStaff.staff_type)) ||
      (position === "bar" && ["bartender", "both"].includes(selfStaff.staff_type))
    );
    if (qualified && !isUserOnPosition(day, currentUserId)) {
      return `<button class="shift-chip-add-self shift-self-assign" data-date="${day.date}" data-position="${position}">+ Já</button>`;
    }
    return '<span class="shift-empty">—</span>';
  }

  function renderAvailChips(day, status) {
    const list = status === "available" ? day.available : status === "unavailable" ? day.unavailable : (day.helper || []);
    const isAdmin = currentRole === "admin";
    let html = '<div class="shift-chips" data-date="' + day.date + '" data-status="' + status + '">';

    for (const u of list) {
      const isSelf = u.id === currentUserId;
      let canRemove = isAdmin || isSelf;
      // Staff: apply 7-day lock for helper removal (same as shift positions)
      if (canRemove && !isAdmin && isSelf && status === "helper") {
        const now = new Date();
        const lockDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        const lockStr = lockDate.toISOString().slice(0, 10);
        if (day.date <= lockStr) canRemove = false;
      }
      const chipColor = u.color;
      const chipStyle = chipColor
        ? `background:${chipColor}25;border-color:${chipColor}55;color:${chipColor}`
        : "";
      html += `<span class="shift-chip${isSelf ? " shift-chip--self" : ""}" style="${chipStyle}">`;
      html += esc(u.username);
      if (canRemove) {
        html += ` <button class="shift-chip-remove" data-user-id="${u.id}" data-username="${esc(u.username)}">&times;</button>`;
      }
      html += `</span>`;
    }

    // Add button
    if (isAdmin) {
      html += `<button class="shift-chip-add" data-date="${day.date}" data-status="${status}">+</button>`;
    } else {
      // Staff: show "+Já" if not already in this list and not on another position
      const selfInList = list.some(u => u.id === currentUserId);
      const blocked = status === "helper" && isUserOnPosition(day, currentUserId);
      if (!selfInList && !blocked) {
        html += `<button class="shift-chip-add-self" data-date="${day.date}" data-status="${status}">+ Já</button>`;
      }
    }

    html += '</div>';
    return html;
  }

  async function handleShiftSelectChange(e) {
    const sel = e.target;
    const date = sel.dataset.date;
    const col = sel.dataset.col;
    const prevVal = sel.dataset.prev;

    // Read both selects for this row
    const row = sel.closest("tr");
    const hookahSel = row.querySelector('[data-col="hookah"]');
    const barSel = row.querySelector('[data-col="bar"]');

    const body = {
      hookah_user_id: hookahSel?.value ? Number(hookahSel.value) : null,
      bar_user_id: barSel?.value ? Number(barSel.value) : null,
    };

    try {
      await api("PUT", "/shifts/" + date, body);
      sel.dataset.prev = sel.value;
      // Re-color the select based on the chosen user
      const userId = sel.value ? Number(sel.value) : null;
      const staff = shiftStaff.find(s => s.id === userId);
      const c = staff?.color;
      sel.style.background = c ? c + "20" : "";
      sel.style.borderColor = c ? c + "88" : "";
      // Update local data for stats
      const day = shiftMonthData.days.find(d => d.date === date);
      if (day) {
        const hookahId = hookahSel?.value ? Number(hookahSel.value) : null;
        const barId = barSel?.value ? Number(barSel.value) : null;
        day.hookah = hookahId ? shiftStaff.find(s => s.id === hookahId) || { id: hookahId, username: "?", color: null } : null;
        day.bar = barId ? shiftStaff.find(s => s.id === barId) || { id: barId, username: "?", color: null } : null;
      }
      refreshShiftStats();
      showToast("Uloženo");
    } catch (err) {
      sel.value = prevVal || "";
      showToast(err.message, "error");
    }
  }

  function wireUpChipHandlers(tableEl) {
    // Remove chip
    tableEl.querySelectorAll(".shift-chip-remove").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const chipsDiv = btn.closest(".shift-chips");
        const date = chipsDiv.dataset.date;
        const userId = Number(btn.dataset.userId);
        try {
          await api("PUT", "/shifts/" + date + "/availability", { user_id: userId, status: null });
          // Update local data & re-render row chips
          const day = shiftMonthData.days.find(d => d.date === date);
          if (day) {
            day.available = day.available.filter(u => u.id !== userId);
            day.unavailable = day.unavailable.filter(u => u.id !== userId);
            day.helper = (day.helper || []).filter(u => u.id !== userId);
          }
          reRenderRowChips(date);
          refreshShiftStats();
          showToast("Odebráno");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

    // Admin add chip (opens dropdown)
    tableEl.querySelectorAll(".shift-chip-add").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openChipDropdown(btn);
      });
    });

    // Staff self-assign to hookah/bar position
    tableEl.querySelectorAll(".shift-self-assign").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const date = btn.dataset.date;
        const position = btn.dataset.position;
        try {
          await api("PUT", "/shifts/" + date + "/self-assign", { position });
          const day = shiftMonthData.days.find(d => d.date === date);
          if (day) {
            const selfStaff = shiftStaff.find(s => s.id === currentUserId);
            const userData = { id: currentUserId, username: currentUser, color: selfStaff?.color || null };
            if (position === "hookah") day.hookah = userData;
            else day.bar = userData;
          }
          reRenderRowPositionCells(date);
          refreshShiftStats();
          showToast("Uloženo");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

    // Staff self-unassign from hookah/bar position
    tableEl.querySelectorAll(".shift-self-unassign").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const date = btn.dataset.date;
        const position = btn.dataset.position;
        try {
          await api("PUT", "/shifts/" + date + "/self-assign", { position, remove: true });
          const day = shiftMonthData.days.find(d => d.date === date);
          if (day) {
            if (position === "hookah") day.hookah = null;
            else day.bar = null;
          }
          reRenderRowPositionCells(date);
          refreshShiftStats();
          showToast("Odebráno");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

    // Staff self-add
    tableEl.querySelectorAll(".shift-chip-add-self").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const date = btn.dataset.date;
        const status = btn.dataset.status;
        try {
          await api("PUT", "/shifts/" + date + "/availability", { user_id: currentUserId, status: status });
          // Update local data
          const day = shiftMonthData.days.find(d => d.date === date);
          if (day) {
            for (const s of ["available", "unavailable", "helper"]) {
              if (s !== status) day[s] = (day[s] || []).filter(u => u.id !== currentUserId);
            }
            const statusList = day[status] || (day[status] = []);
            if (!statusList.some(u => u.id === currentUserId)) {
              const selfStaff = shiftStaff.find(st => st.id === currentUserId);
              statusList.push({ id: currentUserId, username: currentUser, color: selfStaff?.color || null });
            }
          }
          reRenderRowChips(date);
          refreshShiftStats();
          showToast("Uloženo");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  }

  function reRenderRowPositionCells(date) {
    const day = shiftMonthData.days.find(d => d.date === date);
    if (!day) return;
    const row = document.querySelector('tr[data-date="' + date + '"]');
    if (!row) return;
    const cells = row.querySelectorAll("td");
    // cells[2] = Dýmky, cells[3] = Bar (0=Den, 1=Čas)
    if (cells[2]) cells[2].innerHTML = renderStaffPositionCell(day, "hookah", day.hookah);
    if (cells[3]) cells[3].innerHTML = renderStaffPositionCell(day, "bar", day.bar);
    wireUpChipHandlers(row);
  }

  function reRenderRowChips(date) {
    const day = shiftMonthData.days.find(d => d.date === date);
    if (!day) return;
    const row = document.querySelector('tr[data-date="' + date + '"]');
    if (!row) return;
    const cells = row.querySelectorAll("td");
    const helperCell = cells[cells.length - 3];
    const availCell = cells[cells.length - 2];
    const unavailCell = cells[cells.length - 1];
    if (helperCell) helperCell.innerHTML = renderAvailChips(day, "helper");
    if (availCell) availCell.innerHTML = renderAvailChips(day, "available");
    if (unavailCell) unavailCell.innerHTML = renderAvailChips(day, "unavailable");
    wireUpChipHandlers(row);
  }

  function openChipDropdown(btn) {
    // Close any existing dropdown
    closeChipDropdown();

    const date = btn.dataset.date;
    const status = btn.dataset.status;
    const day = shiftMonthData.days.find(d => d.date === date);
    if (!day) return;

    // Get users already in this column
    const existing = (status === "available" ? day.available : day.unavailable).map(u => u.id);
    const eligible = shiftStaff.filter(s => !existing.includes(s.id));

    if (!eligible.length) {
      showToast("Žádný další staff k přidání", "error");
      return;
    }

    const dd = document.createElement("div");
    dd.className = "shift-chip-dropdown";
    dd.id = "shift-chip-dropdown-active";

    for (const s of eligible) {
      const item = document.createElement("div");
      item.className = "shift-chip-dropdown-item";
      item.textContent = s.username;
      item.addEventListener("click", async (e) => {
        e.stopPropagation();
        closeChipDropdown();
        try {
          await api("PUT", "/shifts/" + date + "/availability", { user_id: s.id, status: status });
          // Update local data
          for (const st of ["available", "unavailable", "helper"]) {
            if (st !== status) day[st] = (day[st] || []).filter(u => u.id !== s.id);
          }
          const statusList = day[status] || (day[status] = []);
          if (!statusList.some(u => u.id === s.id)) {
            statusList.push({ id: s.id, username: s.username, color: s.color || null });
          }
          reRenderRowChips(date);
          refreshShiftStats();
          showToast("Přidáno");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
      dd.appendChild(item);
    }

    const chipsDiv = btn.closest(".shift-chips");
    chipsDiv.appendChild(dd);

    // Close on outside click
    setTimeout(() => document.addEventListener("click", closeChipDropdown), 0);
  }

  function closeChipDropdown() {
    const dd = document.getElementById("shift-chip-dropdown-active");
    if (dd) dd.remove();
    document.removeEventListener("click", closeChipDropdown);
  }

  function openPositionPicker(btn) {
    closeChipDropdown();
    const col = btn.dataset.col;
    const date = btn.dataset.date;
    const day = shiftMonthData.days.find(d => d.date === date);
    if (!day) return;

    const staffList = col === "hookah"
      ? shiftStaff.filter(s => s.staff_type === "hookah" || s.staff_type === "both" || s.role === "admin")
      : shiftStaff.filter(s => s.staff_type === "bartender" || s.staff_type === "both" || s.role === "admin");

    const currentId = day[col]?.id || null;

    const dd = document.createElement("div");
    dd.className = "shift-chip-dropdown";
    dd.id = "shift-chip-dropdown-active";

    // "None" option
    const noneItem = document.createElement("div");
    noneItem.className = "shift-chip-dropdown-item" + (!currentId ? " shift-chip-dropdown-item--active" : "");
    noneItem.textContent = "— nikdo —";
    noneItem.addEventListener("click", async (e) => {
      e.stopPropagation();
      closeChipDropdown();
      await applyPositionChange(date, col, null);
    });
    dd.appendChild(noneItem);

    for (const s of staffList) {
      const item = document.createElement("div");
      item.className = "shift-chip-dropdown-item" + (s.id === currentId ? " shift-chip-dropdown-item--active" : "");
      item.textContent = s.username;
      item.addEventListener("click", async (e) => {
        e.stopPropagation();
        closeChipDropdown();
        await applyPositionChange(date, col, s.id);
      });
      dd.appendChild(item);
    }

    const td = btn.closest("td");
    td.style.position = "relative";
    td.appendChild(dd);
    setTimeout(() => document.addEventListener("click", closeChipDropdown), 0);
  }

  async function applyPositionChange(date, col, userId) {
    const day = shiftMonthData.days.find(d => d.date === date);
    if (!day) return;

    const row = document.querySelector('tr[data-date="' + date + '"]');
    const hookahSel = row?.querySelector('.shift-select-desktop[data-col="hookah"]');
    const barSel = row?.querySelector('.shift-select-desktop[data-col="bar"]');

    const body = {
      hookah_user_id: col === "hookah" ? (userId || null) : (hookahSel?.value ? Number(hookahSel.value) : (day.hookah?.id || null)),
      bar_user_id: col === "bar" ? (userId || null) : (barSel?.value ? Number(barSel.value) : (day.bar?.id || null)),
    };

    try {
      await api("PUT", "/shifts/" + date, body);

      // Update local data
      const staff = userId ? shiftStaff.find(s => s.id === userId) : null;
      day[col] = staff ? { id: staff.id, username: staff.username, color: staff.color } : null;

      // Sync desktop select
      const sel = row?.querySelector('.shift-select-desktop[data-col="' + col + '"]');
      if (sel) {
        sel.value = userId || "";
        const c = staff?.color;
        sel.style.background = c ? c + "20" : "";
        sel.style.borderColor = c ? c + "88" : "";
      }

      // Update mobile button
      const btn = row?.querySelector('.shift-pos-picker[data-col="' + col + '"]');
      if (btn) {
        btn.textContent = staff ? staff.username : "—";
        const chipStyle = staff?.color ? `background:${staff.color}25;border-color:${staff.color}55;color:${staff.color}` : "";
        btn.setAttribute("style", chipStyle);
      }

      refreshShiftStats();
      showToast("Uloženo");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // ── Přehled směn ──

  async function renderPrehled(container) {
    const isAdmin = currentRole === "admin";

    // Load staff list for admin dropdown
    if (isAdmin && !shiftStaff.length) {
      try { shiftStaff = await api("GET", "/shifts/staff"); } catch (_) {}
    }

    let headerHtml = "";
    if (isAdmin) {
      const opts = shiftStaff.map(s =>
        `<option value="${s.id}"${s.id === currentUserId ? " selected" : ""}>${esc(s.username)}</option>`
      ).join("");
      headerHtml = `<div class="prehled-header">
        <label class="prehled-select-label">Zobrazit přehled pro</label>
        <select class="prehled-select" id="prehled-user-select">${opts}</select>
      </div>`;
    }

    container.innerHTML = headerHtml + '<div id="prehled-content" class="prehled-content"><div class="prehled-loading">Načítání…</div></div>';

    if (isAdmin) {
      document.getElementById("prehled-user-select").addEventListener("change", () => loadPrehled());
    }

    loadPrehled();
  }

  async function loadPrehled() {
    const wrap = document.getElementById("prehled-content");
    if (!wrap) return;

    const isAdmin = currentRole === "admin";
    let userId = null;
    if (isAdmin) {
      const sel = document.getElementById("prehled-user-select");
      userId = sel ? sel.value : currentUserId;
    }

    wrap.innerHTML = '<div class="prehled-loading">Načítání…</div>';

    try {
      const url = "/shifts/overview" + (userId ? "?user_id=" + userId : "");
      const data = await api("GET", url);
      renderPrehledData(wrap, data);
    } catch (err) {
      wrap.innerHTML = `<div class="prehled-empty">Chyba: ${esc(err.message)}</div>`;
    }
  }

  function renderPrehledData(wrap, data) {
    const DAY_NAMES_FULL = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];

    function formatDate(dateStr) {
      const d = new Date(dateStr + "T00:00:00");
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const dayName = DAY_NAMES_FULL[d.getDay()];
      return { short: day + ". " + month + ".", dayName, dow: d.getDay() };
    }

    function posLabel(pos) {
      if (pos === "hookah") return "Dýmky";
      if (pos === "bar") return "Bar";
      return "Výpomoc";
    }

    function posIcon(pos) {
      if (pos === "hookah") return "💨";
      if (pos === "bar") return "🍸";
      return "🤝";
    }

    function shiftTime(dow) {
      if (dow === 5 || dow === 6) return "16:30 – 02:00";
      return "16:30 – 22:00";
    }

    function formatCZK(amount) {
      return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + "\u00a0Kč";
    }

    let html = "";

    // ── Upcoming shifts ──
    html += '<div class="prehled-section">';
    html += '<h3 class="prehled-section-title">Nadcházející směny</h3>';

    if (data.upcoming.length === 0) {
      html += '<div class="prehled-empty">Žádné naplánované směny v následujících 10 dnech</div>';
    } else {
      html += '<div class="prehled-cards">';
      const today = new Date().toISOString().slice(0, 10);
      for (const shift of data.upcoming) {
        const f = formatDate(shift.date);
        const isToday = shift.date === today;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = shift.date === tomorrow.toISOString().slice(0, 10);
        let whenLabel = "";
        if (isToday) whenLabel = '<span class="prehled-when prehled-when--today">Dnes</span>';
        else if (isTomorrow) whenLabel = '<span class="prehled-when prehled-when--tomorrow">Zítra</span>';

        html += `<div class="prehled-card${isToday ? " prehled-card--today" : ""}">
          <div class="prehled-card-top">
            <div class="prehled-card-date">
              <span class="prehled-card-day">${f.short}</span>
              <span class="prehled-card-dayname">${f.dayName}</span>
            </div>
            ${whenLabel}
          </div>
          <div class="prehled-card-body">
            <span class="prehled-card-pos">${posIcon(shift.position)} ${posLabel(shift.position)}</span>
            <span class="prehled-card-time">${shiftTime(f.dow)}</span>
          </div>
        </div>`;
      }
      html += '</div>';
    }
    html += '</div>';

    // ── Past shifts (logged) ──
    html += '<div class="prehled-section">';
    html += '<h3 class="prehled-section-title">Odpracované směny</h3>';

    const pastWithLogs = data.past.filter(s => s.log);
    const pastWithoutLogs = data.past.filter(s => !s.log);

    if (data.past.length === 0) {
      html += '<div class="prehled-empty">Zatím žádné odpracované směny</div>';
    } else {
      html += '<div class="prehled-past-list">';
      for (const shift of data.past) {
        const f = formatDate(shift.date);
        const hasLog = !!shift.log;
        let timeStr = shiftTime(f.dow);
        let hoursStr = "";
        if (hasLog) {
          timeStr = shift.log.time_from + " – " + shift.log.time_to;
          const [fH, fM] = shift.log.time_from.split(":").map(Number);
          const [tH, tM] = shift.log.time_to.split(":").map(Number);
          let mins = (tH * 60 + tM) - (fH * 60 + fM);
          if (mins <= 0) mins += 1440;
          const hrs = mins / 60;
          hoursStr = hrs % 1 === 0 ? hrs + "h" : hrs.toFixed(1) + "h";
        }

        html += `<div class="prehled-past-row${!hasLog ? " prehled-past-row--nolog" : ""}"${!hasLog ? ` data-goto-zapis="${shift.date}"` : ""}>
          <div class="prehled-past-date">
            <span class="prehled-past-day">${f.short}</span>
            <span class="prehled-past-dayname">${f.dayName}</span>
          </div>
          <span class="prehled-past-pos">${posIcon(shift.position)} ${posLabel(shift.position)}</span>
          <span class="prehled-past-time">${timeStr}</span>
          ${hoursStr ? `<span class="prehled-past-hours">${hoursStr}</span>` : `<span class="prehled-past-nolog">nezapsáno</span>`}
        </div>`;
      }
      html += '</div>';
    }
    html += '</div>';

    // ── Summary ──
    html += '<div class="prehled-section">';
    html += '<h3 class="prehled-section-title">Souhrn</h3>';
    html += '<div class="prehled-summary">';

    html += `<div class="prehled-stat">
      <span class="prehled-stat-value">${data.summary.total_shifts}</span>
      <span class="prehled-stat-label">odpracovaných směn</span>
    </div>`;

    html += `<div class="prehled-stat">
      <span class="prehled-stat-value">${data.summary.total_hours}h</span>
      <span class="prehled-stat-label">celkem hodin</span>
    </div>`;

    if (data.summary.total_earnings !== null) {
      html += `<div class="prehled-stat prehled-stat--earnings">
        <span class="prehled-stat-value">${formatCZK(data.summary.total_earnings)}</span>
        <span class="prehled-stat-label">orientační výdělek</span>
        <span class="prehled-stat-hint">Při sazbě ${data.summary.hourly_wage}\u00a0Kč/h. Skutečná částka se může lišit.</span>
      </div>`;
    }

    html += '</div>';
    html += '</div>';

    wrap.innerHTML = html;

    // Click on unlogged past shift → go to Zápis for that date
    wrap.querySelectorAll("[data-goto-zapis]").forEach(el => {
      el.addEventListener("click", () => {
        const date = el.dataset.gotoZapis;
        const d = new Date(date + "T00:00:00");
        zapisSelectedDate = date;
        zapisViewYear = d.getFullYear();
        zapisViewMonth = d.getMonth() + 1;
        smenyTab = "zapis";
        location.hash = "smeny/zapis";
        const container = document.getElementById("smeny-content").parentElement;
        renderSmeny(container);
      });
    });
  }

  // ── Zápis směn ──

  function getDefaultTimes(dow) {
    if (dow === 1) return null;
    if (dow === 5 || dow === 6) return { from: "16:30", to: "02:00" };
    return { from: "16:30", to: "22:00" };
  }

  function getZapisDefaultDate() {
    const now = new Date();
    if (now.getHours() < 6) {
      now.setDate(now.getDate() - 1);
    }
    return now;
  }

  let zapisSelectedDate = null;
  let zapisViewYear = null;
  let zapisViewMonth = null;
  let zapisMonthAssigned = new Set();
  let zapisMonthLogged = new Set();

  function parseTime(str) {
    const m = String(str).match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return h * 60 + min;
  }

  function formatTime(totalMin) {
    const m = ((totalMin % 1440) + 1440) % 1440;
    return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  }

  function createTimePicker(id, initialValue, onChange) {
    const val = initialValue || "00:00";
    const html = `
      <div class="time-picker" id="${id}-wrap">
        <button type="button" class="time-picker-btn" data-dir="-1">−</button>
        <input type="text" id="${id}" class="time-picker-input" value="${val}" maxlength="5" inputmode="numeric">
        <button type="button" class="time-picker-btn" data-dir="1">+</button>
      </div>
    `;
    return {
      html,
      wire() {
        const wrap = document.getElementById(id + "-wrap");
        const input = document.getElementById(id);
        wrap.querySelectorAll(".time-picker-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const dir = Number(btn.dataset.dir);
            let mins = parseTime(input.value);
            if (mins === null) mins = 0;
            mins += dir * 15;
            input.value = formatTime(mins);
            if (onChange) onChange();
          });
        });
        input.addEventListener("blur", () => {
          // Normalize on blur
          let v = input.value.trim();
          // Support typing "1630" -> "16:30"
          if (/^\d{3,4}$/.test(v)) {
            v = v.padStart(4, "0");
            v = v.slice(0, 2) + ":" + v.slice(2);
          }
          const mins = parseTime(v);
          if (mins !== null) {
            input.value = formatTime(mins);
          }
          if (onChange) onChange();
        });
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            input.blur();
          }
        });
      },
      getValue() {
        return document.getElementById(id)?.value || "";
      }
    };
  }

  async function renderZapis(container) {
    const defaultDate = getZapisDefaultDate();
    if (!zapisViewYear) zapisViewYear = defaultDate.getFullYear();
    if (!zapisViewMonth) zapisViewMonth = defaultDate.getMonth() + 1;
    if (!zapisSelectedDate) {
      zapisSelectedDate = defaultDate.getFullYear() + "-" +
        String(defaultDate.getMonth() + 1).padStart(2, "0") + "-" +
        String(defaultDate.getDate()).padStart(2, "0");
    }

    container.innerHTML = `
      <div class="zapis-layout">
        <div class="zapis-calendar" id="zapis-calendar"></div>
        <div class="zapis-form-wrap" id="zapis-form"></div>
      </div>
    `;

    await loadZapisMonth();
    renderZapisCalendar();
    loadZapisDay(zapisSelectedDate);
  }

  async function loadZapisMonth() {
    try {
      const data = await api("GET", "/shift-logs/month/" + zapisViewYear + "/" + zapisViewMonth);
      zapisMonthAssigned = new Set(data.assigned);
      zapisMonthLogged = new Set(data.logged);
    } catch (_) {
      zapisMonthAssigned = new Set();
      zapisMonthLogged = new Set();
    }
  }

  function renderZapisCalendar() {
    const cal = document.getElementById("zapis-calendar");
    if (!cal) return;

    const year = zapisViewYear;
    const month = zapisViewMonth;
    const todayStr = getZapisDefaultDate();
    const todayISO = todayStr.getFullYear() + "-" +
      String(todayStr.getMonth() + 1).padStart(2, "0") + "-" +
      String(todayStr.getDate()).padStart(2, "0");

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
    // Convert to Mon=0 grid
    const startOffset = (firstDow + 6) % 7;

    let gridHtml = "";
    // Day headers (Mon-Sun)
    const hdrs = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
    for (const h of hdrs) {
      gridHtml += `<div class="zapis-cal-hdr">${h}</div>`;
    }

    // Empty cells before first day
    for (let i = 0; i < startOffset; i++) {
      gridHtml += `<div class="zapis-cal-day zapis-cal-day--empty"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dow = new Date(year, month - 1, d).getDay();
      const isMonday = dow === 1;
      const isSelected = dateStr === zapisSelectedDate;
      const isToday = dateStr === todayISO;

      const isAssigned = zapisMonthAssigned.has(dateStr);
      const isLogged = zapisMonthLogged.has(dateStr);

      let cls = "zapis-cal-day";
      if (isMonday) cls += " zapis-cal-day--monday";
      if (isSelected) cls += " zapis-cal-day--selected";
      else if (isAssigned && !isLogged) cls += " zapis-cal-day--pending";
      else if (isAssigned && isLogged) cls += " zapis-cal-day--logged";
      if (isToday && !isSelected) cls += " zapis-cal-day--today";

      gridHtml += `<div class="${cls}" data-date="${dateStr}">${d}</div>`;
    }

    cal.innerHTML = `
      <div class="zapis-cal-nav">
        <button class="shifts-nav-btn" id="zapis-prev">&lsaquo;</button>
        <span class="zapis-cal-title">${MONTH_NAMES[month - 1]} ${year}</span>
        <button class="shifts-nav-btn" id="zapis-next">&rsaquo;</button>
      </div>
      <div class="zapis-cal-grid">${gridHtml}</div>
    `;

    document.getElementById("zapis-prev").addEventListener("click", async () => {
      zapisViewMonth--;
      if (zapisViewMonth < 1) { zapisViewMonth = 12; zapisViewYear--; }
      await loadZapisMonth();
      renderZapisCalendar();
    });
    document.getElementById("zapis-next").addEventListener("click", async () => {
      zapisViewMonth++;
      if (zapisViewMonth > 12) { zapisViewMonth = 1; zapisViewYear++; }
      await loadZapisMonth();
      renderZapisCalendar();
    });

    cal.querySelectorAll(".zapis-cal-day[data-date]").forEach(el => {
      if (el.classList.contains("zapis-cal-day--monday")) return;
      el.addEventListener("click", () => {
        zapisSelectedDate = el.dataset.date;
        renderZapisCalendar();
        loadZapisDay(zapisSelectedDate);
      });
    });
  }

  async function loadZapisDay(date) {
    const form = document.getElementById("zapis-form");
    if (!form) return;

    const dow = new Date(date + "T00:00:00").getDay();
    if (dow === 1) {
      form.innerHTML = `<div class="zapis-info"><span class="zapis-info-icon">🚫</span><p>Pondělí – zavřeno</p></div>`;
      return;
    }

    form.innerHTML = '<div class="zapis-info"><span class="zapis-info-icon">⏳</span><p>Načítání…</p></div>';

    try {
      const data = await api("GET", "/shift-logs/" + date);

      if (!data.assigned) {
        form.innerHTML = `<div class="zapis-info"><span class="zapis-info-icon">ℹ️</span><p>Na tento den nemáte přiřazenou směnu.</p></div>`;
        return;
      }

      if (data.log) {
        const posLabel = data.position === "hookah" ? "Dýmky" : data.position === "bar" ? "Bar" : "Výpomoc";

        // Calculate hours
        let fromMin = parseTime(data.log.time_from);
        let toMin = parseTime(data.log.time_to);
        let totalMin = 0;
        if (fromMin !== null && toMin !== null) {
          totalMin = toMin - fromMin;
          if (totalMin <= 0) totalMin += 1440; // crosses midnight
        }
        const hours = totalMin / 60;
        const hoursStr = hours % 1 === 0 ? hours + "h" : hours.toFixed(1) + "h";

        // Fetch wage (use cache)
        let earningsHtml = "";
        if (cachedHourlyWage === null) {
          try {
            const wd = await api("GET", "/settings/hourly-wage");
            cachedHourlyWage = wd.hourly_wage ?? 0;
          } catch (_) { cachedHourlyWage = 0; }
        }
        if (cachedHourlyWage > 0 && totalMin > 0) {
          const earn = Math.round(hours * cachedHourlyWage);
          const earnStr = earn.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + " Kč";
          earningsHtml = `<div class="zapis-locked-earnings">+ ${earnStr}</div>`;
        }

        const dateObj = new Date(date + "T00:00:00");
        const dayName = DAY_NAMES_SHORT[dateObj.getDay()];
        const dayNum = dateObj.getDate();
        const monthName = MONTH_NAMES[dateObj.getMonth()];

        form.innerHTML = `
          <div class="zapis-locked">
            <div class="zapis-locked-header">
              <span class="zapis-locked-date">${dayName} ${dayNum}. ${monthName}</span>
              <span class="zapis-locked-badge">✓ Zadáno</span>
            </div>
            <div class="zapis-locked-pos">${posLabel}</div>
            <div class="zapis-locked-times">
              <div class="zapis-locked-time">
                <span class="zapis-locked-time-label">Od</span>
                <span class="zapis-locked-time-value">${esc(data.log.time_from)}</span>
              </div>
              <div class="zapis-locked-time-sep">→</div>
              <div class="zapis-locked-time">
                <span class="zapis-locked-time-label">Do</span>
                <span class="zapis-locked-time-value">${esc(data.log.time_to)}</span>
              </div>
            </div>
            <div class="zapis-locked-summary">
              <span class="zapis-locked-hours">${hoursStr}</span>
              ${earningsHtml}
            </div>
            ${data.log.note ? `<div class="zapis-locked-note">${esc(data.log.note)}</div>` : ""}
          </div>
        `;
        return;
      }

      // Show entry form
      const defaults = getDefaultTimes(dow);
      const posLabel = data.position === "hookah" ? "Dýmky" : data.position === "bar" ? "Bar" : "Výpomoc";

      const dateObj = new Date(date + "T00:00:00");
      const dayName = DAY_NAMES_SHORT[dateObj.getDay()];
      const dayNum = dateObj.getDate();
      const monthName = MONTH_NAMES[dateObj.getMonth()];

      const fromPicker = createTimePicker("zapis-from", defaults ? defaults.from : "16:30", checkNoteRequired);
      const toPicker = createTimePicker("zapis-to", defaults ? defaults.to : "22:00", checkNoteRequired);

      form.innerHTML = `
        <div class="zapis-entry">
          <div class="zapis-entry-header">
            <span class="zapis-entry-date">${dayName} ${dayNum}. ${monthName}</span>
            <span class="zapis-entry-pos">${posLabel}</span>
          </div>
          <div class="zapis-time-row">
            <div class="zapis-time-field">
              <label>Od</label>
              ${fromPicker.html}
            </div>
            <div class="zapis-time-field">
              <label>Do</label>
              ${toPicker.html}
            </div>
          </div>
          <div class="form-group" id="zapis-note-group">
            <label>Poznámka <span class="zapis-note-hint">(např. důvod delší směny)</span></label>
            <input type="text" id="zapis-note" placeholder="Volitelné">
          </div>
          <button class="btn-primary" id="zapis-save">Uložit směnu</button>
        </div>
      `;

      fromPicker.wire();
      toPicker.wire();

      const noteInput = document.getElementById("zapis-note");
      const noteGroup = document.getElementById("zapis-note-group");

      function checkNoteRequired() {
        if (!defaults) return;
        const changed = fromPicker.getValue() !== defaults.from || toPicker.getValue() !== defaults.to;
        noteGroup.classList.toggle("zapis-note-required", changed && !noteInput.value.trim());
        noteInput.placeholder = changed ? "Povinné – vysvětlete změnu" : "Volitelné";
      }

      noteInput.addEventListener("input", checkNoteRequired);

      document.getElementById("zapis-save").addEventListener("click", async () => {
        const timeFrom = fromPicker.getValue();
        const timeTo = toPicker.getValue();
        const note = noteInput.value.trim();

        if (!timeFrom || !timeTo || parseTime(timeFrom) === null || parseTime(timeTo) === null) {
          showToast("Vyplňte oba časy", "error");
          return;
        }

        // Client-side note check
        if (defaults && (timeFrom !== defaults.from || timeTo !== defaults.to) && !note) {
          noteGroup.classList.add("zapis-note-required");
          noteInput.focus();
          showToast("Při změně času je poznámka povinná", "error");
          return;
        }

        try {
          await api("POST", "/shift-logs", { date, time_from: timeFrom, time_to: timeTo, note: note || undefined });
          showToast("Směna uložena");
          zapisMonthLogged.add(date);
          renderZapisCalendar();
          loadZapisDay(date);
        } catch (err) {
          showToast(err.message, "error");
        }
      });

    } catch (err) {
      form.innerHTML = `<div class="zapis-info"><span class="zapis-info-icon">❌</span><p>Chyba: ${esc(err.message)}</p></div>`;
    }
  }

  // ── Pošta ──

  function renderPosta(container) {
    container.innerHTML = `
      <div class="mail-toolbar">
        <button class="btn-secondary btn-refresh" id="mail-refresh-btn">&#x21bb; Obnovit</button>
        <button class="btn-small btn-delete" id="mail-clear-btn">Smazat vše</button>
      </div>
      <div class="gallery-list" id="mail-list">
        <div class="placeholder-msg">Načítání…</div>
      </div>
    `;

    document.getElementById("mail-refresh-btn").addEventListener("click", loadAndRenderMail);
    document.getElementById("mail-clear-btn").addEventListener("click", async () => {
      if (!await showConfirm("Smazat emaily", "Opravdu smazat všechny zachycené emaily?")) return;
      try {
        await api("DELETE", "/mail");
        loadAndRenderMail();
      } catch (err) {
        showToast(err.message, "error");
      }
    });

    loadAndRenderMail();
  }

  var mailCache = [];

  async function loadAndRenderMail() {
    var list = document.getElementById("mail-list");
    try {
      var mails = await api("GET", "/mail");
      mailCache = mails;
      if (!mails.length) {
        list.innerHTML = '<div class="placeholder-msg">Žádné emaily</div>';
        return;
      }

      list.innerHTML = mails
        .slice()
        .reverse()
        .map(function (m) {
          var date = new Date(m.sentAt);
          var dd = String(date.getDate()).padStart(2, "0");
          var mm = String(date.getMonth() + 1).padStart(2, "0");
          var yy = date.getFullYear();
          var hh = String(date.getHours()).padStart(2, "0");
          var mi = String(date.getMinutes()).padStart(2, "0");
          var timeStr = dd + ". " + mm + ". " + yy + " " + hh + ":" + mi;

          return '<div class="mail-card" data-mail-id="' + m.id + '">' +
              '<div class="mail-card-header">' +
                '<div class="mail-card-subject">' + esc(m.subject) + '</div>' +
                '<div class="mail-card-meta">' + esc(m.to) + ' · ' + timeStr + '</div>' +
              '</div>' +
            '</div>';
        })
        .join("");

      list.querySelectorAll(".mail-card-header").forEach(function (header) {
        header.addEventListener("click", function () {
          var card = header.closest(".mail-card");
          var mailId = Number(card.dataset.mailId);
          var mail = mailCache.find(function (m) { return m.id === mailId; });
          if (mail) openMailPopup(mail);
        });
      });
    } catch (e) {
      list.innerHTML = '<div class="placeholder-msg">Nepodařilo se načíst emaily</div>';
    }
  }

  function openMailPopup(mail) {
    var w = window.open("", "_blank", "width=700,height=800");
    if (!w) return;
    w.document.write('<html><head><title>Email preview</title></head><body style="margin:0;height:100vh"><iframe sandbox="allow-same-origin allow-popups allow-top-navigation" style="width:100%;height:100%;border:none" srcdoc=""></iframe></body></html>');
    w.document.close();
    w.document.querySelector("iframe").srcdoc = mail.html;
  }

  // ── Kvízy ──

  let quizzes = [];
  let editingQuizId = null;
  let currentQuizId = null;
  let resultsMode = false;

  async function loadQuizzes() {
    quizzes = await api("GET", "/quizzes");
  }

  function renderKvizy(container) {
    if (currentQuizId && resultsMode) {
      renderQuizResults(container);
      return;
    }
    if (currentQuizId) {
      renderQuizDetail(container);
      return;
    }

    const readOnly = !canWrite("kvizy");

    container.innerHTML = `
      ${readOnly ? "" : '<div class="gallery-toolbar"><button class="btn-primary" id="quiz-add-btn">+ Přidat kvíz</button></div>'}
      <div id="quiz-form-wrap"></div>
      <div class="gallery-list" id="quiz-list">
        <div class="placeholder-msg">Načítání…</div>
      </div>
    `;

    if (!readOnly) {
      document.getElementById("quiz-add-btn").addEventListener("click", () => {
        editingQuizId = null;
        showQuizForm();
      });
    }

    loadQuizzes().then(renderQuizList).catch(() => {
      document.getElementById("quiz-list").innerHTML =
        '<div class="placeholder-msg">Nepodařilo se načíst kvízy</div>';
    });
  }

  function renderQuizCard(q) {
    const total = q.total_teams || 0;
    const confirmed = q.confirmed_teams || 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    const isPast = q.date < todayStr;
    const readOnly = !canWrite("kvizy");
    return `
      <div class="gallery-card" data-id="${q.id}">
        <div class="gallery-card-body">
          <div class="gallery-card-title">Kvíz #${esc(String(q.quiz_number))}</div>
          <div class="gallery-card-date">${formatDate(q.date)}</div>
          <div class="gallery-card-desc">Max ${esc(String(q.max_participants))} týmů · ${esc(String(q.price))} Kč</div>
          <div class="quiz-card-teams">Týmy: ${total} přihlášených · ${confirmed} potvrzených</div>
        </div>
        <div class="gallery-card-actions">
          ${isPast && q.results_count ? `<button class="btn-small btn-edit btn-results" data-id="${q.id}">🏆 Výsledky</button>` : ""}
          ${!readOnly && isPast && !q.results_count ? `<button class="btn-small btn-edit btn-results" data-id="${q.id}">🏆 Vyhlásit</button>` : ""}
          ${readOnly ? "" : `<button class="btn-small btn-edit" data-id="${q.id}">Upravit</button>`}
          ${readOnly ? "" : `<button class="btn-small btn-delete" data-id="${q.id}">Smazat</button>`}
        </div>
      </div>`;
  }

  function renderQuizList() {
    const list = document.getElementById("quiz-list");
    if (!quizzes.length) {
      list.innerHTML = '<div class="placeholder-msg">Žádné kvízy</div>';
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const upcoming = quizzes.filter((q) => q.date >= todayStr);
    const past = quizzes.filter((q) => q.date < todayStr);

    let html = "";

    if (upcoming.length) {
      html += '<div class="year-header">Nadcházející</div>';
      html += upcoming.map(renderQuizCard).join("");
    }

    if (past.length) {
      html += '<div class="year-header">Proběhlé</div>';
      html += past.map(renderQuizCard).join("");
    }

    list.innerHTML = html;

    list.querySelectorAll(".gallery-card-body").forEach((body) => {
      body.style.cursor = "pointer";
      body.addEventListener("click", () => {
        currentQuizId = Number(body.closest(".gallery-card").dataset.id);
        renderDashboard();
      });
    });

    list.querySelectorAll(".btn-results").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        currentQuizId = Number(btn.dataset.id);
        resultsMode = true;
        renderDashboard();
      });
    });

    list.querySelectorAll(".btn-edit:not(.btn-results)").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        editingQuizId = Number(btn.dataset.id);
        showQuizForm();
      });
    });

    list.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteQuiz(Number(btn.dataset.id));
      });
    });
  }

  function showQuizForm() {
    const wrap = document.getElementById("quiz-form-wrap");
    const q = editingQuizId
      ? quizzes.find((x) => x.id === editingQuizId)
      : null;

    // Defaults for new quiz
    const nextNumber = q ? q.quiz_number : (quizzes.length
      ? Math.max(...quizzes.map((x) => x.quiz_number)) + 1
      : 1);
    const defaultMax = q ? q.max_participants : 8;
    const defaultPrice = q ? q.price : 400;

    wrap.innerHTML = `
      <form class="gallery-form" id="quiz-form">
        <div class="form-row">
          <div class="form-group">
            <label for="qf-number">Číslo kvízu *</label>
            <input type="number" id="qf-number" required min="1" value="${nextNumber}">
          </div>
          <div class="form-group">
            <label for="qf-date">Datum *</label>
            <input type="text" id="qf-date" required readonly>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="qf-max">Max účastníků *</label>
            <input type="number" id="qf-max" required min="1" value="${defaultMax}">
          </div>
          <div class="form-group">
            <label for="qf-price">Cena (CZK) *</label>
            <input type="number" id="qf-price" required min="0" value="${defaultPrice}">
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">${q ? "Uložit" : "Vytvořit"}</button>
          <button type="button" class="btn-secondary" id="qf-cancel">Zrušit</button>
        </div>
        <div class="login-error" id="qf-error"></div>
      </form>
    `;

    DatePicker.create("qf-date", q ? q.date : "");

    document.getElementById("qf-cancel").addEventListener("click", () => {
      wrap.innerHTML = "";
      editingQuizId = null;
    });

    document.getElementById("quiz-form").addEventListener("submit", handleQuizSubmit);
  }

  async function handleQuizSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector(".btn-primary");
    const errorEl = document.getElementById("qf-error");
    errorEl.textContent = "";
    btn.disabled = true;

    const payload = {
      quiz_number: Number(document.getElementById("qf-number").value),
      date: document.getElementById("qf-date").dataset.value,
      max_participants: Number(document.getElementById("qf-max").value),
      price: Number(document.getElementById("qf-price").value),
    };

    try {
      if (editingQuizId) {
        await api("PUT", "/quizzes/" + editingQuizId, payload);
      } else {
        await api("POST", "/quizzes", payload);
      }
      editingQuizId = null;
      document.getElementById("quiz-form-wrap").innerHTML = "";
      await loadQuizzes();
      renderQuizList();
    } catch (err) {
      errorEl.textContent = err.message;
      btn.disabled = false;
    }
  }

  async function deleteQuiz(id) {
    if (!await showConfirm("Smazat kvíz", "Opravdu smazat tento kvíz? Všechny registrované týmy budou odstraněny.")) return;
    try {
      await api("DELETE", "/quizzes/" + id);
      await loadQuizzes();
      renderQuizList();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // ── Quiz Detail (teams) ──

  const paymentLabels = {
    cash: "💵 Hotově",
    card: "💳 Kartou",
    free: "🎁 Zdarma",
    bank: "🏦 Převodem",
  };

  let quizTeams = [];

  async function renderQuizDetail(container) {
    const quiz = quizzes.find((q) => q.id === currentQuizId);
    const title = quiz ? "Kvíz #" + esc(String(quiz.quiz_number)) : "Kvíz";

    container.innerHTML = `
      <div class="gallery-detail-header">
        <button class="btn-secondary" id="quiz-back-btn">&larr; Zpět</button>
        <h2>${title}</h2>
        ${quiz ? `<span class="quiz-detail-meta">${formatDate(quiz.date)} · Max ${quiz.max_participants} týmů · ${quiz.price} Kč</span>` : ""}
        <button class="btn-secondary btn-refresh" id="quiz-refresh-btn">&#x21bb; Obnovit</button>
      </div>
      <div class="quiz-teams-list" id="quiz-teams-list">
        <div class="placeholder-msg">Načítání…</div>
      </div>
    `;

    document.getElementById("quiz-back-btn").addEventListener("click", () => {
      stopTeamsPolling();
      currentQuizId = null;
      renderDashboard();
    });

    document.getElementById("quiz-refresh-btn").addEventListener("click", () => {
      loadAndRenderTeams();
    });

    loadAndRenderTeams();
    startTeamsPolling();
  }

  let teamsPollingTimer = null;

  function startTeamsPolling() {
    stopTeamsPolling();
    teamsPollingTimer = setInterval(loadAndRenderTeams, 10000);
  }

  function stopTeamsPolling() {
    if (teamsPollingTimer) {
      clearInterval(teamsPollingTimer);
      teamsPollingTimer = null;
    }
  }

  async function loadAndRenderTeams() {
    try {
      quizTeams = await api("GET", "/quizzes/" + currentQuizId + "/teams");
      renderTeamsList();
    } catch {
      document.getElementById("quiz-teams-list").innerHTML =
        '<div class="placeholder-msg">Nepodařilo se načíst týmy</div>';
    }
  }

  function formatDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso + (iso.includes("T") ? "" : "T00:00:00") + "Z");
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return dd + ". " + mm + ". " + yy + " " + hh + ":" + mi;
  }

  let expandedTeamId = null;

  function renderTeamRow(team) {
    const paid = team.payment_status !== null && team.payment_status !== undefined;
    const statusLabel = paid ? paymentLabels[team.payment_status] || team.payment_status : "Nezaplaceno";
    const statusClass = paid ? "team-status--paid" : "team-status--unpaid";
    const isOpen = expandedTeamId === team.id;
    const memberCount = (team.members || []).length;

    let html = `
      <div class="team-row ${isOpen ? "team-row--open" : ""}" data-team-id="${team.id}">
        <div class="team-row-summary" data-team-id="${team.id}">
          <span class="team-icon">${esc(team.icon)}</span>
          <span class="team-row-name">${esc(team.team_name)}</span>
          <span class="team-row-meta">(${esc(team.email)})</span>
          <span class="team-row-members-inline">(${(team.members || []).map((m) => esc(m.name)).join(", ")})</span>
          <span class="team-row-count">${memberCount} čl.</span>
          <span class="team-status ${statusClass}">${statusLabel}</span>
          <span class="team-row-chevron">${isOpen ? "▾" : "›"}</span>
        </div>`;

    if (isOpen) {
      const members = (team.members || []).map((m) =>
        `<span class="team-member">${esc(m.name)}</span>`
      ).join("");

      const registered = team.created_at ? formatDateTime(team.created_at) : "";

      const readOnly = !canWrite("kvizy");
      html += `
        <div class="team-detail">
          <div class="team-detail-info">
            <div class="team-card-email">${esc(team.email)}</div>
            ${registered ? `<div class="team-card-registered">Registrace: ${registered}</div>` : ""}
          </div>
          <div class="team-members">${members}</div>
          ${readOnly ? "" : `<div class="team-card-actions">
            <div class="team-payment-btns">
              <span class="team-payment-label">Platba:</span>
              <button class="btn-small btn-payment ${team.payment_status === "cash" ? "btn-payment--active" : ""}" data-team-id="${team.id}" data-status="cash">💵 Hotově</button>
              <button class="btn-small btn-payment ${team.payment_status === "card" ? "btn-payment--active" : ""}" data-team-id="${team.id}" data-status="card">💳 Kartou</button>
              <button class="btn-small btn-payment ${team.payment_status === "free" ? "btn-payment--active" : ""}" data-team-id="${team.id}" data-status="free">🎁 Zdarma</button>
              <button class="btn-small btn-payment ${team.payment_status === "bank" ? "btn-payment--active" : ""}" data-team-id="${team.id}" data-status="bank">🏦 Převodem</button>
            </div>
            <div class="team-danger-btns">
              ${paid ? `<button class="btn-small btn-confirm-team" data-team-id="${team.id}">${team.confirmed_at ? "✉️ Potvrdit znovu" : "✉️ Potvrdit"}</button>` : ""}
              ${paid ? `<button class="btn-small btn-cancel-payment" data-team-id="${team.id}">↩ Zrušit platbu</button>` : ""}
              <button class="btn-small btn-delete btn-delete-team" data-team-id="${team.id}">🗑 Smazat</button>
            </div>
          </div>`}
        </div>`;
    }

    html += `</div>`;
    return html;
  }

  function renderTeamsList() {
    const list = document.getElementById("quiz-teams-list");
    if (!quizTeams.length) {
      list.innerHTML = '<div class="placeholder-msg">Zatím žádné registrované týmy</div>';
      return;
    }

    const confirmed = quizTeams.filter((t) => t.payment_status !== null && t.payment_status !== undefined);
    const unconfirmed = quizTeams.filter((t) => t.payment_status === null || t.payment_status === undefined);

    let html = "";

    if (confirmed.length) {
      html += `<div class="teams-section-header teams-section--confirmed">Potvrzené (${confirmed.length})</div>`;
      html += confirmed.map(renderTeamRow).join("");
    }

    if (unconfirmed.length) {
      html += `<div class="teams-section-header teams-section--unconfirmed">Nepotvrzené (${unconfirmed.length})</div>`;
      html += unconfirmed.map(renderTeamRow).join("");
    }

    list.innerHTML = html;

    // Row toggle
    list.querySelectorAll(".team-row-summary").forEach((row) => {
      row.addEventListener("click", () => {
        const id = Number(row.dataset.teamId);
        expandedTeamId = expandedTeamId === id ? null : id;
        renderTeamsList();
      });
    });

    // Payment buttons
    list.querySelectorAll(".btn-payment").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        setTeamPayment(Number(btn.dataset.teamId), btn.dataset.status);
      });
    });

    // Cancel payment buttons
    list.querySelectorAll(".btn-cancel-payment").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        setTeamPayment(Number(btn.dataset.teamId), null);
      });
    });

    // Confirm buttons
    list.querySelectorAll(".btn-confirm-team").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        confirmTeam(Number(btn.dataset.teamId));
      });
    });

    // Delete buttons
    list.querySelectorAll(".btn-delete-team").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteTeam(Number(btn.dataset.teamId));
      });
    });
  }

  async function setTeamPayment(teamId, status) {
    try {
      await api("PUT", "/teams/" + teamId + "/payment", { payment_status: status });
      // Update local data
      const team = quizTeams.find((t) => t.id === teamId);
      if (team) team.payment_status = status;
      renderTeamsList();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function confirmTeam(teamId) {
    const team = quizTeams.find((t) => t.id === teamId);
    if (!team) return;

    const msg = team.confirmed_at
      ? `Týmu <strong>${esc(team.icon)} ${esc(team.team_name)}</strong> bude znovu odeslán potvrzující email.`
      : `Týmu <strong>${esc(team.icon)} ${esc(team.team_name)}</strong> bude odeslán potvrzující email.`;

    if (!await showConfirm("Potvrdit účast?", msg)) return;

    try {
      await api("POST", "/teams/" + teamId + "/confirm");
      team.confirmed_at = new Date().toISOString();
      renderTeamsList();
      showToast("Potvrzující email odeslán!");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // ── Quiz Results (Vyhlásit) ──

  let resultsTeams = [];

  async function renderQuizResults(container) {
    const quiz = quizzes.find((q) => q.id === currentQuizId);
    const title = quiz ? "Kvíz #" + esc(String(quiz.quiz_number)) + " — Výsledky" : "Výsledky";
    const readOnly = !canWrite("kvizy");

    container.innerHTML = `
      <div class="gallery-detail-header">
        <button class="btn-secondary" id="results-back-btn">&larr; Zpět</button>
        <h2>${title}</h2>
        ${readOnly ? "" : '<button class="btn-primary" id="results-save-btn">Uložit</button>'}
      </div>
      <div id="results-list">
        <div class="placeholder-msg">Načítání…</div>
      </div>
    `;

    document.getElementById("results-back-btn").addEventListener("click", () => {
      resultsMode = false;
      currentQuizId = null;
      renderDashboard();
    });

    if (!readOnly) {
      document.getElementById("results-save-btn").addEventListener("click", saveResults);
    }

    try {
      const teams = await api("GET", "/quizzes/" + currentQuizId + "/teams");
      // Sort by existing placement, then unplaced at end
      resultsTeams = teams.sort((a, b) => {
        const ap = a.placement != null ? a.placement : 9999;
        const bp = b.placement != null ? b.placement : 9999;
        return ap - bp;
      });
      renderResultsList();
    } catch {
      document.getElementById("results-list").innerHTML =
        '<div class="placeholder-msg">Nepodařilo se načíst týmy</div>';
    }
  }

  function renderResultsList() {
    const list = document.getElementById("results-list");
    if (!resultsTeams.length) {
      list.innerHTML = '<div class="placeholder-msg">Žádné týmy k seřazení</div>';
      return;
    }

    const readOnly = !canWrite("kvizy");
    const medals = ["🥇", "🥈", "🥉"];
    const medalClasses = ["results-row--gold", "results-row--silver", "results-row--bronze"];

    list.innerHTML = resultsTeams.map((team, i) => {
      const place = i + 1;
      const medal = medals[i] || "";
      const medalClass = medalClasses[i] || "";
      const scoreVal = team.score != null ? team.score : "";
      return `
        <div class="results-row ${medalClass}" ${readOnly ? "" : 'draggable="true"'} data-idx="${i}">
          <span class="results-placement">${place}.</span>
          <span class="results-medal">${medal}</span>
          <span class="team-icon">${esc(team.icon)}</span>
          <span class="results-team-name">${esc(team.team_name)}</span>
          ${readOnly
            ? `<span style="font-size:.85rem;color:var(--muted);min-width:80px;text-align:center;">${scoreVal !== "" ? scoreVal + " b." : "–"}</span>`
            : `<input type="number" class="results-score-input" data-idx="${i}" value="${scoreVal}" placeholder="Skóre">`}
        </div>`;
    }).join("");

    if (readOnly) return;

    // Drag-and-drop
    let dragIdx = null;

    list.querySelectorAll(".results-row").forEach((row) => {
      row.addEventListener("dragstart", (e) => {
        dragIdx = Number(row.dataset.idx);
        row.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });

      row.addEventListener("dragend", () => {
        row.classList.remove("dragging");
        dragIdx = null;
        list.querySelectorAll(".results-row").forEach((r) => r.classList.remove("drag-over"));
      });

      row.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        list.querySelectorAll(".results-row").forEach((r) => r.classList.remove("drag-over"));
        row.classList.add("drag-over");
      });

      row.addEventListener("dragleave", () => {
        row.classList.remove("drag-over");
      });

      row.addEventListener("drop", (e) => {
        e.preventDefault();
        row.classList.remove("drag-over");
        const dropIdx = Number(row.dataset.idx);
        if (dragIdx === null || dragIdx === dropIdx) return;

        // Persist score inputs before reorder
        collectScores();

        const moved = resultsTeams.splice(dragIdx, 1)[0];
        resultsTeams.splice(dropIdx, 0, moved);
        renderResultsList();
      });
    });

    // Score input change
    list.querySelectorAll(".results-score-input").forEach((input) => {
      input.addEventListener("change", () => {
        const idx = Number(input.dataset.idx);
        resultsTeams[idx].score = input.value !== "" ? Number(input.value) : null;
      });
    });
  }

  function collectScores() {
    document.querySelectorAll(".results-score-input").forEach((input) => {
      const idx = Number(input.dataset.idx);
      if (resultsTeams[idx]) {
        resultsTeams[idx].score = input.value !== "" ? Number(input.value) : null;
      }
    });
  }

  async function saveResults() {
    collectScores();
    const teams = resultsTeams.map((t, i) => ({
      id: t.id,
      placement: i + 1,
      score: t.score ?? null,
    }));

    const btn = document.getElementById("results-save-btn");
    btn.disabled = true;
    btn.textContent = "Ukládání…";

    try {
      await api("PUT", "/quizzes/" + currentQuizId + "/results", { teams });
      btn.textContent = "Uloženo ✓";
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = "Uložit";
      }, 1500);
    } catch (err) {
      showToast(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Uložit";
    }
  }

  async function deleteTeam(teamId) {
    if (!await showConfirm("Smazat tým", "Opravdu smazat tento tým z kvízu?")) return;
    try {
      await api("DELETE", "/teams/" + teamId);
      quizTeams = quizTeams.filter((t) => t.id !== teamId);
      renderTeamsList();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // ── Uživatelé (admin only) ──

  let adminUsers = [];

  async function loadUsers() {
    adminUsers = await api("GET", "/users");
  }

  let showingUserForm = false;

  function renderUzivatele(container) {
    container.innerHTML = `
      <div class="gallery-toolbar">
        <button class="btn-primary" id="btn-add-user">+ Nový uživatel</button>
      </div>
      <div id="user-form-area"></div>
      <div class="users-list" id="users-list">
        <div class="placeholder-msg">Načítání…</div>
      </div>
    `;

    document.getElementById("btn-add-user").addEventListener("click", () => {
      showingUserForm = !showingUserForm;
      renderUserForm();
    });

    loadUsers().then(() => renderUsersList()).catch((err) => {
      document.getElementById("users-list").innerHTML = `<div class="placeholder-msg">Chyba: ${esc(err.message)}</div>`;
    });

    if (showingUserForm) renderUserForm();
  }

  function renderUserForm() {
    const area = document.getElementById("user-form-area");
    if (!area) return;
    if (!showingUserForm) { area.innerHTML = ""; return; }

    area.innerHTML = `
      <div class="gallery-form" style="margin-bottom:1.5rem;">
        <form id="create-user-form">
          <div class="form-row">
            <div class="form-group">
              <label for="new-username">Uživatelské jméno</label>
              <input type="text" id="new-username" placeholder="jan.novak" required pattern="[a-z0-9_.\\-]+" minlength="2" maxlength="30">
            </div>
            <div class="form-group">
              <label for="new-email">Email</label>
              <input type="email" id="new-email" placeholder="jan@example.com" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="new-role">Role</label>
              <select id="new-role" class="role-select" style="width:100%;padding:.75rem 1rem;font-size:.9rem;border-radius:8px;">
                <option value="staff">Staff</option>
                <option value="quizmaster">Quizmaster</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="form-group" id="new-staff-type-wrap">
              <label for="new-staff-type">Typ staffu</label>
              <select id="new-staff-type" class="role-select" style="width:100%;padding:.75rem 1rem;font-size:.9rem;border-radius:8px;">
                <option value="">– Nevybráno –</option>
                <option value="hookah">Dýmkař</option>
                <option value="bartender">Barman</option>
                <option value="both">Barodýmkař</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" id="create-user-btn">Vytvořit a poslat pozvánku</button>
            <button type="button" class="btn-secondary" id="cancel-user-btn">Zrušit</button>
          </div>
          <div id="create-user-error" style="margin-top:.75rem;font-size:.82rem;color:#d05560;min-height:1.2em;"></div>
        </form>
      </div>
    `;

    document.getElementById("cancel-user-btn").addEventListener("click", () => {
      showingUserForm = false;
      renderUserForm();
    });

    // Show/hide staff_type based on role
    const roleSelect = document.getElementById("new-role");
    const staffTypeWrap = document.getElementById("new-staff-type-wrap");
    function toggleStaffType() {
      staffTypeWrap.style.display = roleSelect.value === "staff" ? "" : "none";
    }
    toggleStaffType();
    roleSelect.addEventListener("change", toggleStaffType);

    document.getElementById("create-user-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("create-user-btn");
      const errorEl = document.getElementById("create-user-error");
      const username = document.getElementById("new-username").value.trim();
      const email = document.getElementById("new-email").value.trim();
      const role = document.getElementById("new-role").value;
      const staffType = role === "staff" ? (document.getElementById("new-staff-type").value || null) : null;

      errorEl.textContent = "";
      btn.disabled = true;
      btn.textContent = "Vytvářím…";

      try {
        const newUser = await api("POST", "/users", { username, email, role, staff_type: staffType });
        adminUsers.push(newUser);
        showingUserForm = false;
        renderUserForm();
        renderUsersList();
        showToast("Uživatel vytvořen, pozvánka odeslána");
      } catch (err) {
        errorEl.textContent = err.message;
        btn.disabled = false;
        btn.textContent = "Vytvořit a poslat pozvánku";
      }
    });
  }

  const roleLabels = { admin: "Admin", quizmaster: "Quizmaster", staff: "Staff" };
  const staffTypeLabels = { hookah: "Dýmkař", bartender: "Barman", both: "Barodýmkař" };

  function renderUsersList() {
    const list = document.getElementById("users-list");
    if (!list) return;
    if (!adminUsers.length) {
      list.innerHTML = `<div class="placeholder-msg">Žádní uživatelé</div>`;
      return;
    }
    list.innerHTML = `
      <table class="users-table">
        <thead>
          <tr>
            <th>Uživatel</th>
            <th>Email</th>
            <th>Role</th>
            <th>Typ staffu</th>
            <th>Barva</th>
            <th>Stav</th>
            <th>Vytvořen</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${adminUsers.map((u) => {
            const isPending = u.invite_pending;
            return `
            <tr data-user-id="${u.id}">
              <td class="users-username">${esc(u.username)}</td>
              <td class="users-date" data-label="Email">${u.email ? esc(u.email) : '<span style="color:var(--muted);">—</span>'}</td>
              <td data-label="Role">
                <select class="role-select role-select--${u.role}" data-user-id="${u.id}" data-current="${u.role}">
                  <option value="admin"${u.role === "admin" ? " selected" : ""}>Admin</option>
                  <option value="quizmaster"${u.role === "quizmaster" ? " selected" : ""}>Quizmaster</option>
                  <option value="staff"${u.role === "staff" ? " selected" : ""}>Staff</option>
                </select>
              </td>
              <td data-label="Typ">
                ${u.role === "staff" || u.role === "admin"
                  ? `<select class="role-select staff-type-select" data-user-id="${u.id}" data-current="${u.staff_type || ""}">
                      <option value=""${!u.staff_type ? " selected" : ""}>—</option>
                      <option value="hookah"${u.staff_type === "hookah" ? " selected" : ""}>Dýmkař</option>
                      <option value="bartender"${u.staff_type === "bartender" ? " selected" : ""}>Barman</option>
                      <option value="both"${u.staff_type === "both" ? " selected" : ""}>Barodýmkař</option>
                    </select>`
                  : `<span style="color:var(--muted);">—</span>`}
              </td>
              <td data-label="Barva">
                <label class="color-swatch" style="background:${u.color || '#666'}">
                  <input type="color" class="user-color-input" data-user-id="${u.id}" value="${u.color || '#666666'}">
                </label>
              </td>
              <td data-label="Stav">
                ${isPending
                  ? `<span class="role-badge" style="background:rgba(224,160,48,.15);color:#e0a030;">Čeká na heslo</span>`
                  : `<span class="role-badge" style="background:rgba(52,211,153,.15);color:#34d399;">Aktivní</span>`}
              </td>
              <td class="users-date" data-label="Vytvořen">${u.created_at ? new Date(u.created_at).toLocaleDateString("cs-CZ") : "–"}</td>
              <td style="white-space:nowrap;">
                ${isPending ? `<button class="btn-small btn-edit" data-reinvite-user="${u.id}" style="margin-right:.3rem;">Poslat znovu</button>` : ""}
                ${!isPending && u.username !== currentUser ? `<button class="btn-small btn-secondary" data-force-logout="${u.id}" style="margin-right:.3rem;">Odhlásit</button>` : ""}
                ${u.username !== currentUser ? `<button class="btn-danger-sm" data-delete-user="${u.id}">Smazat</button>` : ""}
              </td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    `;

    // Role change handlers
    list.querySelectorAll(".role-select").forEach((sel) => {
      sel.addEventListener("change", async (e) => {
        const userId = Number(sel.dataset.userId);
        const newRole = sel.value;
        try {
          await api("PUT", "/users/" + userId + "/role", { role: newRole });
          const user = adminUsers.find((u) => u.id === userId);
          if (user) user.role = newRole;
          sel.dataset.current = newRole;
          sel.className = "role-select role-select--" + newRole;
          showToast("Role změněna");
        } catch (err) {
          sel.value = sel.dataset.current;
          showToast(err.message, "error");
        }
      });
    });

    // Color change handlers
    list.querySelectorAll(".user-color-input").forEach((input) => {
      input.addEventListener("change", async () => {
        const userId = Number(input.dataset.userId);
        const newColor = input.value;
        try {
          await api("PUT", "/users/" + userId + "/color", { color: newColor });
          const user = adminUsers.find((u) => u.id === userId);
          if (user) user.color = newColor;
          input.closest(".color-swatch").style.background = newColor;
          // Invalidate shift staff cache so colors refresh
          shiftStaff = [];
          showToast("Barva změněna");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

    // Staff type change handlers
    list.querySelectorAll(".staff-type-select").forEach((sel) => {
      sel.addEventListener("change", async () => {
        const userId = Number(sel.dataset.userId);
        const newType = sel.value || null;
        try {
          await api("PUT", "/users/" + userId + "/staff-type", { staff_type: newType });
          const user = adminUsers.find((u) => u.id === userId);
          if (user) user.staff_type = newType;
          sel.dataset.current = newType || "";
          // Clear cached shift staff so it reloads with updated types
          shiftStaff = [];
          showToast("Typ staffu změněn");
        } catch (err) {
          sel.value = sel.dataset.current;
          showToast(err.message, "error");
        }
      });
    });

    // Reinvite handlers
    list.querySelectorAll("[data-reinvite-user]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const userId = Number(btn.dataset.reinviteUser);
        const user = adminUsers.find((u) => u.id === userId);
        const email = prompt("Email pro odeslání nové pozvánky:");
        if (!email) return;
        btn.disabled = true;
        btn.textContent = "Odesílám…";
        try {
          await api("POST", "/users/" + userId + "/reinvite", { email });
          showToast("Pozvánka odeslána");
        } catch (err) {
          showToast(err.message, "error");
        }
        btn.disabled = false;
        btn.textContent = "Poslat znovu";
      });
    });

    // Force-logout handlers
    list.querySelectorAll("[data-force-logout]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const userId = Number(btn.dataset.forceLogout);
        const user = adminUsers.find((u) => u.id === userId);
        if (!await showConfirm("Odhlásit uživatele", `Opravdu odhlásit uživatele &bdquo;${esc(user?.username || "")}&ldquo; ze všech zařízení?`)) return;
        try {
          await api("POST", "/users/" + userId + "/force-logout");
          showToast("Uživatel odhlášen");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

    // Delete handlers
    list.querySelectorAll("[data-delete-user]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const userId = Number(btn.dataset.deleteUser);
        const user = adminUsers.find((u) => u.id === userId);
        if (!await showConfirm("Smazat uživatele", `Opravdu smazat uživatele &bdquo;${esc(user?.username || "")}&ldquo;?`)) return;
        try {
          await api("DELETE", "/users/" + userId);
          adminUsers = adminUsers.filter((u) => u.id !== userId);
          renderUsersList();
          showToast("Uživatel smazán");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  }

  async function handleLogout(e) {
    e.preventDefault();
    try {
      await api("POST", "/logout");
    } catch {
      // ignore
    }
    currentUserId = null;
    currentUser = null;
    currentRole = null;
    currentPage = null;
    renderLogin();
  }

  // ── Nastavení ──

  // ── Kalendář akcí ──

  let akceViewYear = null;
  let akceViewMonth = null;
  let akceSelectedDate = null;
  let akceMonthEvents = [];

  function parseAkceHash() {
    const raw = location.hash.replace("#", "");
    const parts = raw.split("/"); // akce / date / action / id
    return { date: parts[1] || null, action: parts[2] || null, id: parts[3] || null };
  }

  function setAkceHash(date, action, id) {
    let h = "#akce";
    if (date) h += "/" + date;
    if (action) h += "/" + action;
    if (id) h += "/" + id;
    history.replaceState(null, "", h);
  }

  function renderAkce(container) {
    const now = new Date();
    const hashInfo = parseAkceHash();

    if (hashInfo.date && /^\d{4}-\d{2}-\d{2}$/.test(hashInfo.date)) {
      akceSelectedDate = hashInfo.date;
      const d = new Date(hashInfo.date + "T00:00:00");
      akceViewYear = d.getFullYear();
      akceViewMonth = d.getMonth() + 1;
    }

    if (!akceViewYear) akceViewYear = now.getFullYear();
    if (!akceViewMonth) akceViewMonth = now.getMonth() + 1;

    container.innerHTML = `
      <div class="akce-layout">
        <div class="akce-calendar" id="akce-calendar"></div>
        <div class="akce-panel" id="akce-panel">
          <div class="zapis-info"><span class="zapis-info-icon">\uD83D\uDCC5</span><p>Vyber den v kalendáři</p></div>
        </div>
      </div>
    `;

    loadAkceMonth().then(async () => {
      renderAkceCalendar();
      if (!akceSelectedDate) {
        const today = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
        akceSelectedDate = today;
        renderAkceCalendar();
      }
      renderAkceDay();

      // Restore form state from hash
      if (hashInfo.action === "new") {
        renderAkceForm(null);
      } else if (hashInfo.action === "edit" && hashInfo.id) {
        try {
          const ev = await api("GET", "/events/" + hashInfo.id);
          renderAkceForm(ev);
        } catch (_) {}
      }
    });
  }

  async function loadAkceMonth() {
    try {
      akceMonthEvents = await api("GET", "/events/month/" + akceViewYear + "/" + akceViewMonth);
    } catch (_) {
      akceMonthEvents = [];
    }
  }

  function renderAkceCalendar() {
    const cal = document.getElementById("akce-calendar");
    if (!cal) return;

    const year = akceViewYear;
    const month = akceViewMonth;
    const now = new Date();
    const todayISO = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDow = new Date(year, month - 1, 1).getDay();
    const startOffset = (firstDow + 6) % 7;

    // Dates that have events
    const eventDates = new Set(akceMonthEvents.map(e => e.date));

    let gridHtml = "";
    const hdrs = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
    for (const h of hdrs) {
      gridHtml += '<div class="zapis-cal-hdr">' + h + '</div>';
    }
    for (let i = 0; i < startOffset; i++) {
      gridHtml += '<div class="zapis-cal-day zapis-cal-day--empty"></div>';
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = year + "-" + String(month).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      const isSelected = dateStr === akceSelectedDate;
      const isToday = dateStr === todayISO;
      const hasEvent = eventDates.has(dateStr);

      let cls = "zapis-cal-day";
      if (isSelected) cls += " zapis-cal-day--selected";
      else if (hasEvent) cls += " zapis-cal-day--pending";
      if (isToday && !isSelected) cls += " zapis-cal-day--today";

      gridHtml += '<div class="' + cls + '" data-date="' + dateStr + '">' + d + '</div>';
    }

    cal.innerHTML = '<div class="zapis-cal-nav">' +
      '<button class="shifts-nav-btn" id="akce-prev">&lsaquo;</button>' +
      '<span class="zapis-cal-title">' + MONTH_NAMES[month - 1] + ' ' + year + '</span>' +
      '<button class="shifts-nav-btn" id="akce-next">&rsaquo;</button>' +
      '</div><div class="zapis-cal-grid">' + gridHtml + '</div>';

    document.getElementById("akce-prev").addEventListener("click", async () => {
      akceViewMonth--;
      if (akceViewMonth < 1) { akceViewMonth = 12; akceViewYear--; }
      await loadAkceMonth();
      renderAkceCalendar();
    });
    document.getElementById("akce-next").addEventListener("click", async () => {
      akceViewMonth++;
      if (akceViewMonth > 12) { akceViewMonth = 1; akceViewYear++; }
      await loadAkceMonth();
      renderAkceCalendar();
    });

    cal.querySelectorAll(".zapis-cal-day[data-date]").forEach(el => {
      el.addEventListener("click", () => {
        akceSelectedDate = el.dataset.date;
        setAkceHash(akceSelectedDate);
        renderAkceCalendar();
        renderAkceDay();
      });
    });
  }

  function renderAkceDay() {
    const panel = document.getElementById("akce-panel");
    if (!panel || !akceSelectedDate) return;

    const dateObj = new Date(akceSelectedDate + "T00:00:00");
    const DAY_NAMES_FULL = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];
    const dayLabel = DAY_NAMES_FULL[dateObj.getDay()] + " " + dateObj.getDate() + ". " + MONTH_NAMES[dateObj.getMonth()];

    const dayEvents = akceMonthEvents.filter(e => e.date === akceSelectedDate);

    let html = '<div class="akce-day-header">' +
      '<span class="akce-day-title">' + esc(dayLabel) + '</span>' +
      '<button class="btn-primary btn-small" id="akce-add-btn">+ Přidat akci</button>' +
      '</div>';

    if (dayEvents.length === 0) {
      html += '<div class="akce-empty">Žádné akce v tento den</div>';
    } else {
      html += '<div class="akce-list">';
      for (const ev of dayEvents) {
        const tags = [];
        if (ev.entry_fee > 0) tags.push(ev.entry_fee + " Kč");
        if (ev.has_competitions) tags.push("Soutěže");
        if (ev.has_special_drinks) tags.push("Speciální drinky");
        if (ev.has_costume_reward) tags.push("Odměna za kostým");
        if (ev.has_tasting) tags.push("Ochutnávková session");

        html += '<div class="akce-card" data-id="' + ev.id + '">' +
          (ev.cover_r2_key ? '<img class="akce-card-cover" src="/dungeon/photos/' + esc(ev.cover_r2_key) + '" alt="">' : '') +
          '<div class="akce-card-body">' +
          '<div class="akce-card-time">' + esc(ev.time) + '</div>' +
          '<div class="akce-card-title">' + esc(ev.title) + '</div>' +
          (tags.length ? '<div class="akce-card-tags">' + tags.map(t => '<span class="akce-tag">' + esc(t) + '</span>').join("") + '</div>' : '') +
          '</div>' +
          '<div class="akce-card-actions">' +
          '<button class="btn-small btn-secondary akce-edit-btn" data-id="' + ev.id + '">Upravit</button>' +
          '<button class="btn-small btn-delete akce-delete-btn" data-id="' + ev.id + '">Smazat</button>' +
          '</div></div>';
      }
      html += '</div>';
    }

    panel.innerHTML = html;

    document.getElementById("akce-add-btn").addEventListener("click", () => {
      setAkceHash(akceSelectedDate, "new");
      renderAkceForm(null);
    });

    panel.querySelectorAll(".akce-edit-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          const ev = await api("GET", "/events/" + btn.dataset.id);
          setAkceHash(akceSelectedDate, "edit", btn.dataset.id);
          renderAkceForm(ev);
        } catch (err) { showToast(err.message, "error"); }
      });
    });

    panel.querySelectorAll(".akce-delete-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm("Opravdu smazat tuto akci?")) return;
        try {
          await api("DELETE", "/events/" + btn.dataset.id);
          akceMonthEvents = akceMonthEvents.filter(ev => ev.id !== Number(btn.dataset.id));
          renderAkceCalendar();
          renderAkceDay();
          showToast("Akce smazána");
        } catch (err) { showToast(err.message, "error"); }
      });
    });
  }

  function renderAkceForm(existing) {
    const panel = document.getElementById("akce-panel");
    if (!panel) return;

    const isEdit = !!existing;
    const date = isEdit ? existing.date : akceSelectedDate;
    const dateTo = isEdit ? (existing.date_to || "") : "";
    const time = isEdit ? existing.time : "19:00";
    const title = isEdit ? existing.title : "";
    const description = isEdit ? existing.description : "";
    const entryFee = isEdit ? existing.entry_fee : 0;
    const hasComp = isEdit ? existing.has_competitions : 0;
    const hasDrinks = isEdit ? existing.has_special_drinks : 0;
    const hasCostume = isEdit ? existing.has_costume_reward : 0;
    const hasTasting = isEdit ? existing.has_tasting : 0;
    const linkedQuizId = isEdit ? (existing.linked_quiz_id || 0) : 0;
    const hasCover = isEdit && existing.cover_r2_key;

    const timePicker = createTimePicker("akce-time", time, () => {});

    panel.innerHTML = '<div class="akce-form">' +
      '<div class="akce-form-header">' +
        '<h3>' + (isEdit ? "Upravit akci" : "Nová akce") + '</h3>' +
        '<button class="btn-secondary btn-small" id="akce-form-cancel">\u2190 Zpět</button>' +
      '</div>' +
      '<div class="akce-form-columns">' +
        '<div class="akce-form-left">' +
          '<div class="akce-form-row akce-form-row--datetime">' +
            '<div class="form-group"><label>Datum</label><input type="text" id="akce-date-from" readonly placeholder="\u2014"></div>' +
            '<div class="form-group"><label>Datum do <span style="color:var(--muted);font-weight:400;font-size:.75em">(volitelné)</span></label><input type="text" id="akce-date-to" readonly placeholder="\u2014"></div>' +
            '<div class="form-group"><label>\u010Cas za\u010D\u00E1tku</label>' + timePicker.html + '</div>' +
            '<div class="form-group"><label>Vstupné (K\u010D)</label><input type="number" id="akce-fee" value="' + entryFee + '" min="0" step="50"></div>' +
          '</div>' +
          '<div class="form-group"><label>Název akce</label><input type="text" id="akce-title" value="' + esc(title) + '" placeholder="nap\u0159. Karaoke Night"></div>' +
          '<div class="form-group"><label>Popis <span style="color:var(--muted);font-weight:400;font-size:.75em">(Markdown: **bold**, *italic*, - seznam)</span></label>' +
            '<textarea id="akce-desc" rows="5" placeholder="Zadej kl\u00ED\u010Dov\u00E1 slova a info (nap\u0159. halloween, speci\u00E1ln\u00ED drinky, sout\u011B\u017Ee) a klikni na AI \u2728 \u2013 popisek se vygeneruje s\u00E1m">' + esc(description) + '</textarea>' +
            '<button type="button" class="btn-ai" id="akce-ai-btn" title="Vygenerovat popis pomoc\u00ED AI z kl\u00ED\u010Dov\u00FDch slov">AI \u2728</button></div>' +
        '</div>' +
        '<div class="akce-form-right">' +
          '<div class="form-group"><label>Cover obr\u00E1zek <span style="color:var(--muted);font-weight:400;font-size:.75em">(max 1280\u00D7720, webp)</span></label>' +
            (hasCover ? '<div class="akce-cover-preview" id="akce-cover-preview"><img src="/dungeon/photos/' + esc(existing.cover_r2_key) + '" alt=""><button class="btn-small btn-delete" id="akce-cover-remove">Odebrat</button></div>' : '') +
            '<input type="file" id="akce-cover-input" accept="image/*">' +
            '<div class="akce-cover-thumb" id="akce-cover-thumb"></div>' +
          '</div>' +
          '<div class="akce-options">' +
            '<label class="akce-toggle"><input type="checkbox" id="akce-comp"' + (hasComp ? ' checked' : '') + '><span>Sout\u011B\u017Ee</span></label>' +
            '<label class="akce-toggle"><input type="checkbox" id="akce-drinks"' + (hasDrinks ? ' checked' : '') + '><span>Speci\u00E1ln\u00ED drinky</span></label>' +
            '<label class="akce-toggle"><input type="checkbox" id="akce-costume"' + (hasCostume ? ' checked' : '') + '><span>Odm\u011Bna za kost\u00FDm</span></label>' +
            '<label class="akce-toggle"><input type="checkbox" id="akce-tasting"' + (hasTasting ? ' checked' : '') + '><span>Ochutn\u00E1vkov\u00E1 session</span></label>' +
            '<label class="akce-toggle"><input type="checkbox" id="akce-quiz-toggle"' + (linkedQuizId ? ' checked' : '') + '><span>Pub Quiz</span></label>' +
            '<div class="form-group" id="akce-quiz-select-wrap" style="' + (linkedQuizId ? '' : 'display:none') + '"><label>Propojen\u00FD kv\u00EDz</label><div class="akce-quiz-picker" id="akce-quiz-picker"><div class="akce-quiz-picker-value" id="akce-quiz-picker-value">Na\u010D\u00EDt\u00E1n\u00ED\u2026</div></div></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<button class="btn-primary" id="akce-save">' + (isEdit ? "Ulo\u017Eit zm\u011Bny" : "Vytvo\u0159it akci") + '</button>' +
    '</div>';

    timePicker.wire();
    DatePicker.create("akce-date-from", date);
    DatePicker.create("akce-date-to", dateTo);

    // AI description generator
    document.getElementById("akce-ai-btn").addEventListener("click", async function () {
      var btn = this;
      var desc = document.getElementById("akce-desc");
      var keywords = desc.value.trim();
      if (!keywords) { desc.focus(); return; }
      var titleVal = document.getElementById("akce-title").value.trim();
      btn.disabled = true;
      btn.textContent = "Generuji…";
      try {
        var res = await api("POST", "/ai/event-description", {
          keywords: keywords,
          title: titleVal || undefined,
          date: date || undefined
        });
        if (res.description) desc.value = res.description;
      } catch (e) {
        alert("Chyba AI: " + (e.message || e));
      }
      btn.disabled = false;
      btn.textContent = "AI ✨";
    });

    // Pub Quiz toggle + custom quiz picker
    const quizToggle = document.getElementById("akce-quiz-toggle");
    const quizSelectWrap = document.getElementById("akce-quiz-select-wrap");
    const quizPicker = document.getElementById("akce-quiz-picker");
    const quizPickerValue = document.getElementById("akce-quiz-picker-value");
    let quizPickerSelectedId = linkedQuizId || "";
    let quizPickerDropdown = null;
    let quizPickerItems = [];

    quizToggle.addEventListener("change", () => {
      quizSelectWrap.style.display = quizToggle.checked ? "" : "none";
      if (quizToggle.checked && !quizPickerItems.length) loadQuizzesForEvent();
    });

    function renderQuizPickerValue() {
      if (!quizPickerSelectedId) {
        quizPickerValue.textContent = "— Bez propojení —";
        quizPickerValue.classList.add("placeholder");
      } else {
        const item = quizPickerItems.find(i => String(i.id) === String(quizPickerSelectedId));
        quizPickerValue.textContent = item ? item.label : "Kvíz #" + quizPickerSelectedId;
        quizPickerValue.classList.remove("placeholder");
      }
    }

    function openQuizPicker() {
      if (quizPickerDropdown) { closeQuizPicker(); return; }
      quizPickerDropdown = document.createElement("div");
      quizPickerDropdown.className = "akce-quiz-dropdown";
      // "No link" option
      let html = '<button type="button" class="akce-quiz-option' + (!quizPickerSelectedId ? ' selected' : '') + '" data-qid="">— Bez propojení —</button>';
      for (const item of quizPickerItems) {
        html += '<button type="button" class="akce-quiz-option' + (String(item.id) === String(quizPickerSelectedId) ? ' selected' : '') + (item.match ? ' match' : '') + '" data-qid="' + item.id + '">' +
          '<span class="akce-quiz-option-label">' + esc(item.label) + '</span>' +
          (item.match ? '<span class="akce-quiz-option-badge">Stejný den</span>' : '') +
          '</button>';
      }
      quizPickerDropdown.innerHTML = html;
      quizPicker.appendChild(quizPickerDropdown);

      quizPickerDropdown.querySelectorAll(".akce-quiz-option").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          quizPickerSelectedId = btn.dataset.qid;
          renderQuizPickerValue();
          closeQuizPicker();
        });
      });

      // Close on outside click
      setTimeout(() => document.addEventListener("click", outsideClickQuiz), 0);
    }

    function closeQuizPicker() {
      if (quizPickerDropdown) { quizPickerDropdown.remove(); quizPickerDropdown = null; }
      document.removeEventListener("click", outsideClickQuiz);
    }

    function outsideClickQuiz(e) {
      if (!quizPicker.contains(e.target)) closeQuizPicker();
    }

    quizPickerValue.addEventListener("click", (e) => { e.stopPropagation(); openQuizPicker(); });

    async function loadQuizzesForEvent() {
      try {
        const quizzes = await api("GET", "/quizzes");
        const sorted = quizzes.slice().sort((a, b) => {
          const diffA = Math.abs(new Date(a.date) - new Date(date));
          const diffB = Math.abs(new Date(b.date) - new Date(date));
          return diffA - diffB;
        });
        quizPickerItems = sorted.map(q => {
          const qDate = new Date(q.date + "T00:00:00");
          const dateStr = qDate.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
          return { id: q.id, label: "Kvíz #" + q.quiz_number + " – " + dateStr, match: q.date === date };
        });
        renderQuizPickerValue();
      } catch (e) {
        quizPickerValue.textContent = "Chyba při načítání";
      }
    }

    if (linkedQuizId) loadQuizzesForEvent();

    let coverFile = null;
    let removeCover = false;
    let coverDimensions = null;

    // Cover preview for new upload
    document.getElementById("akce-cover-input").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const resized = await resizeImage(file, 1280, 720, 0.88);
        coverFile = new File([resized.blob], "cover.webp", { type: "image/webp" });
        coverDimensions = { width: resized.width, height: resized.height };
        const url = URL.createObjectURL(resized.blob);
        const thumb = document.getElementById("akce-cover-thumb");
        thumb.innerHTML = '<img src="' + url + '" alt="Náhled">';
        // Hide old preview if exists
        const oldPreview = document.getElementById("akce-cover-preview");
        if (oldPreview) oldPreview.style.display = "none";
      } catch (err) {
        showToast("Chyba při zpracování obrázku: " + err.message, "error");
      }
    });

    // Remove existing cover
    const removeBtn = document.getElementById("akce-cover-remove");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        removeCover = true;
        document.getElementById("akce-cover-preview").style.display = "none";
      });
    }

    document.getElementById("akce-form-cancel").addEventListener("click", () => {
      setAkceHash(akceSelectedDate);
      renderAkceDay();
    });

    document.getElementById("akce-save").addEventListener("click", async () => {
      const titleVal = document.getElementById("akce-title").value.trim();
      const descVal = document.getElementById("akce-desc").value;
      const timeVal = timePicker.getValue();
      const fee = Number(document.getElementById("akce-fee").value) || 0;
      const comp = document.getElementById("akce-comp").checked ? "1" : "0";
      const drinks = document.getElementById("akce-drinks").checked ? "1" : "0";
      const costume = document.getElementById("akce-costume").checked ? "1" : "0";
      const tasting = document.getElementById("akce-tasting").checked ? "1" : "0";
      const quizLinked = document.getElementById("akce-quiz-toggle").checked ? quizPickerSelectedId : "";

      if (!titleVal) { showToast("Vyplň název akce", "error"); return; }
      if (!timeVal || parseTime(timeVal) === null) { showToast("Vyplň čas začátku", "error"); return; }

      const dateFromVal = document.getElementById("akce-date-from").dataset.value || date;
      const dateToVal = document.getElementById("akce-date-to").dataset.value || "";
      if (!dateFromVal) { showToast("Vyplň datum akce", "error"); return; }
      const fd = new FormData();
      fd.append("date", dateFromVal);
      fd.append("date_to", dateToVal);
      fd.append("time", timeVal);
      fd.append("title", titleVal);
      fd.append("description", descVal);
      fd.append("entry_fee", String(fee));
      fd.append("has_competitions", comp);
      fd.append("has_special_drinks", drinks);
      fd.append("has_costume_reward", costume);
      fd.append("has_tasting", tasting);
      fd.append("linked_quiz_id", quizLinked);

      if (coverFile) {
        fd.append("cover", coverFile);
        fd.append("cover_width", String(coverDimensions.width));
        fd.append("cover_height", String(coverDimensions.height));
        try {
          const thumbBlob = await generateThumb(coverFile, 650, 0.82);
          fd.append("cover_thumb", thumbBlob, "cover_thumb.webp");
        } catch (e) { /* thumb generation failed, proceed without */ }
      }
      if (removeCover) {
        fd.append("remove_cover", "1");
      }

      try {
        const saveBtn = document.getElementById("akce-save");
        saveBtn.disabled = true;
        saveBtn.textContent = "Ukládání…";

        const url = isEdit ? "/events/" + existing.id : "/events";
        const method = isEdit ? "PUT" : "POST";
        const res = await fetch("/dungeon/api" + url, { method, body: fd, credentials: "same-origin" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");

        showToast(isEdit ? "Akce upravena" : "Akce vytvořena");
        setAkceHash(akceSelectedDate);
        await loadAkceMonth();
        renderAkceCalendar();
        renderAkceDay();
      } catch (err) {
        showToast(err.message, "error");
        const saveBtn = document.getElementById("akce-save");
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = isEdit ? "Uložit změny" : "Vytvořit akci"; }
      }
    });
  }

  // ── Oběžníky ──

  const newsletters = [
    {
      id: "monthly-summary",
      title: "Měsíční přehled směn",
      description: "Souhrn odpracovaných směn, hodin a orientačního výdělku za předchozí měsíc. Obsahuje varování o nezapsaných směnách.",
      frequency: "1× měsíčně (1. den v měsíci, 8:00)",
      recipients: "Všichni staff a admin s přiřazenými směnami v daném měsíci",
    },
  ];

  function renderObeznik(container) {
    container.innerHTML = `
      <div class="obeznik-list" id="obeznik-list">
        ${newsletters.map(n => `
          <div class="obeznik-card" data-id="${n.id}">
            <div class="obeznik-card-header">
              <h3 class="obeznik-card-title">${esc(n.title)}</h3>
              <span class="obeznik-card-freq">${esc(n.frequency)}</span>
            </div>
            <p class="obeznik-card-desc">${esc(n.description)}</p>
            <p class="obeznik-card-recipients"><strong>Příjemci:</strong> ${esc(n.recipients)}</p>
          </div>
        `).join("")}
      </div>
      <div id="obeznik-preview" class="obeznik-preview" style="display:none;">
        <button class="btn-secondary" id="obeznik-back">← Zpět</button>
        <div class="obeznik-preview-meta" id="obeznik-preview-meta"></div>
        <div class="obeznik-preview-frame-wrap">
          <iframe id="obeznik-preview-iframe" class="obeznik-preview-iframe" sandbox=""></iframe>
        </div>
      </div>
    `;

    container.querySelectorAll(".obeznik-card").forEach(card => {
      card.addEventListener("click", () => loadObeznikPreview(card.dataset.id));
    });

    document.getElementById("obeznik-back").addEventListener("click", () => {
      document.getElementById("obeznik-list").style.display = "";
      document.getElementById("obeznik-preview").style.display = "none";
    });
  }

  async function loadObeznikPreview(id) {
    const listEl = document.getElementById("obeznik-list");
    const previewEl = document.getElementById("obeznik-preview");
    const metaEl = document.getElementById("obeznik-preview-meta");
    const iframe = document.getElementById("obeznik-preview-iframe");

    listEl.style.display = "none";
    previewEl.style.display = "";
    metaEl.innerHTML = '<span class="obeznik-loading">Načítání náhledu…</span>';

    try {
      const data = await api("GET", "/newsletters/" + id + "/preview");
      const nl = newsletters.find(n => n.id === id);

      metaEl.innerHTML = `
        <h2 class="obeznik-preview-title">${esc(nl ? nl.title : id)}</h2>
        <p class="obeznik-preview-subject">Předmět: <strong>${esc(data.subject)}</strong></p>
        <p class="obeznik-preview-hint">Ukázkový email s náhodnými údaji</p>
      `;

      iframe.srcdoc = data.html;
    } catch (err) {
      metaEl.innerHTML = `<p class="obeznik-error">Chyba: ${esc(err.message)}</p>`;
    }
  }

  // ── Nastavení ──

  var DEFAULT_AI_PROMPT = "Jsi copywriter pro SPiRiT \u2013 Bar, Hookah Lounge & Coffee v Teplic\u00edch. P\u00ed\u0161e\u0161 kr\u00e1tk\u00e9, v\u00fdsti\u017en\u00e9 popisky akc\u00ed pro web.\n\nStyl:\n- Neform\u00e1ln\u00ed, p\u0159\u00e1telsk\u00fd, ale ne p\u0159ehnan\u011b\n- Sm\u011b\u0159uj k akci, \u017e\u00e1dn\u00e9 zbyte\u010dn\u00e9 fr\u00e1ze\n- Pi\u0161 \u010desky, p\u0159irozen\u011b, bez kli\u0161\u00e9\n- Pou\u017e\u00edvej Markdown: **bold** pro d\u016fle\u017eit\u00e9 v\u011bci, - pro seznamy\n- Popis by m\u011bl m\u00edt 2\u20134 v\u011bty nebo kr\u00e1tk\u00e9 odstavce\n- Nepou\u017e\u00edvej emoji\n- Nepi\u0161 nadpis/n\u00e1zev akce \u2013 ten u\u017e existuje zvl\u00e1\u0161\u0165\n- C\u00edlovka: mlad\u00ed lid\u00e9 18\u201335 co r\u00e1di zajdou na drink";

  async function renderNastaveni(container) {
    container.innerHTML = '<div class="placeholder-msg">Načítání…</div>';
    try {
      const settings = await api("GET", "/settings");
      const wage = settings.hourly_wage || "";
      const aiPrompt = settings.ai_event_prompt || "";

      container.innerHTML = `
        <div class="settings-grid">
        <div class="settings-card">
          <div class="settings-card-header">
            <span class="settings-card-icon">\uD83D\uDCB0</span>
            <div>
              <h3 class="settings-card-title">Hodinová mzda</h3>
              <p class="settings-card-desc">Sazba pro výpočet měsíční mzdy ve statistikách směn</p>
            </div>
          </div>
          <form id="wage-form" class="settings-card-body">
            <div class="form-group">
              <label>Částka</label>
              <div class="settings-input-row">
                <input type="number" id="wage-input" value="${esc(wage)}" min="0" step="1">
                <span class="settings-unit">Kč / hod</span>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Uložit</button>
              <span id="wage-saved" class="settings-saved">Uloženo \u2713</span>
            </div>
          </form>
        </div>

        <div class="settings-card">
          <div class="settings-card-header">
            <span class="settings-card-icon">\u2728</span>
            <div>
              <h3 class="settings-card-title">AI – system prompt</h3>
              <p class="settings-card-desc">Instrukce pro AI agenta, který generuje popisky akcí. Pokud je pole prázdné, použije se výchozí prompt.</p>
            </div>
          </div>
          <form id="ai-prompt-form" class="settings-card-body">
            <div class="form-group">
              <textarea id="ai-prompt-input" rows="12" placeholder="Výchozí prompt se použije automaticky…">${esc(aiPrompt)}</textarea>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Uložit</button>
              <button type="button" class="btn-secondary" id="ai-prompt-default">Obnovit výchozí</button>
              <span id="ai-prompt-saved" class="settings-saved">Uloženo \u2713</span>
            </div>
          </form>
        </div>
        </div>
      `;

      document.getElementById("wage-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const val = document.getElementById("wage-input").value.trim();
        if (!val) return;
        await api("PUT", "/settings/hourly_wage", { value: val });
        const saved = document.getElementById("wage-saved");
        saved.classList.add("visible");
        setTimeout(() => { saved.classList.remove("visible"); }, 2000);
      });

      document.getElementById("ai-prompt-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const val = document.getElementById("ai-prompt-input").value.trim();
        await api("PUT", "/settings/ai_event_prompt", { value: val });
        const saved = document.getElementById("ai-prompt-saved");
        saved.classList.add("visible");
        setTimeout(() => { saved.classList.remove("visible"); }, 2000);
      });

      document.getElementById("ai-prompt-default").addEventListener("click", () => {
        document.getElementById("ai-prompt-input").value = DEFAULT_AI_PROMPT;
      });
    } catch (err) {
      container.innerHTML = `<div class="placeholder-msg">Chyba při načítání nastavení</div>`;
    }
  }

  // ── Changelog modal ──
  async function showChangelog() {
    try {
      const data = await (await fetch("/version.json")).json();
      if (!data.changelog) throw new Error();
      // Simple markdown → HTML: headings and list items
      const html = data.changelog.split("\n").map(function(line) {
        if (line.startsWith("## ")) return '<h3 class="changelog-version">' + esc(line.slice(3)) + "</h3>";
        if (line.startsWith("- ")) return '<div class="changelog-item">' + esc(line.slice(2)) + "</div>";
        return "";
      }).join("\n");

      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.innerHTML =
        '<div class="modal changelog-modal">' +
          '<h2 class="changelog-title">Changelog</h2>' +
          '<div class="changelog-content">' + html + '</div>' +
          '<div class="modal-btns"><button class="btn-primary" data-action="ok">Zavřít</button></div>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.querySelector('[data-action="ok"]').addEventListener("click", () => overlay.remove());
      overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    } catch {
      showToast("Changelog se nepodařilo načíst", "error");
    }
  }

  // ── Logy (audit log) ──

  const AUDIT_CATEGORIES = {
    auth: "Přihlášení",
    gallery: "Galerie",
    quiz: "Kvízy",
    team: "Týmy",
    user: "Uživatelé",
    event: "Akce",
    settings: "Nastavení",
    ai: "AI",
  };

  const AUDIT_ACTIONS = {
    login: "Přihlášení",
    login_failed: "Neúspěšné přihlášení",
    logout: "Odhlášení",
    setup_password: "Nastavení hesla",
    create: "Vytvoření",
    update: "Úprava",
    delete: "Smazání",
    upload_photo: "Nahrání fotky",
    delete_photo: "Smazání fotky",
    set_results: "Nastavení výsledků",
    set_payment: "Změna platby",
    send_confirmation: "Odeslání potvrzení",
    change_role: "Změna role",
    force_logout: "Vynucené odhlášení",
    reinvite: "Opětovná pozvánka",
    generate_description: "Generování popisu",
  };

  const CATEGORY_COLORS = {
    auth: "#38bdf8",
    gallery: "#4ade80",
    quiz: "#facc15",
    team: "#fb923c",
    user: "#a78bfa",
    event: "#f472b6",
    settings: "#94a3b8",
    ai: "#2dd4bf",
  };

  async function renderLogy(container) {
    let auditCategory = "";
    let auditUserId = "";
    let auditOffset = 0;
    const auditLimit = 50;
    let auditUsers = [];

    try {
      auditUsers = await api("GET", "/audit-log/users");
    } catch {}

    container.innerHTML = `
      <div class="audit-toolbar">
        <select id="audit-cat" class="form-input audit-select">
          <option value="">Všechny kategorie</option>
          ${Object.entries(AUDIT_CATEGORIES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}
        </select>
        <select id="audit-user" class="form-input audit-select">
          <option value="">Všichni uživatelé</option>
          ${auditUsers.map(u => `<option value="${u.user_id}">${esc(u.username)}</option>`).join("")}
        </select>
      </div>
      <div id="audit-table-wrap"></div>
    `;

    const catSel = document.getElementById("audit-cat");
    const userSel = document.getElementById("audit-user");

    catSel.addEventListener("change", () => { auditCategory = catSel.value; auditOffset = 0; loadAudit(); });
    userSel.addEventListener("change", () => { auditUserId = userSel.value; auditOffset = 0; loadAudit(); });

    async function loadAudit() {
      const wrap = document.getElementById("audit-table-wrap");
      let url = `/audit-log?limit=${auditLimit}&offset=${auditOffset}`;
      if (auditCategory) url += `&category=${auditCategory}`;
      if (auditUserId) url += `&user_id=${auditUserId}`;

      try {
        const data = await api("GET", url);
        const items = data.items || [];
        const total = data.total || 0;
        const totalPages = Math.ceil(total / auditLimit);
        const currentPageNum = Math.floor(auditOffset / auditLimit) + 1;

        if (!items.length) {
          wrap.innerHTML = '<div class="placeholder-msg">Žádné záznamy</div>';
          return;
        }

        let html = `<table class="audit-table">
          <thead><tr><th>Čas</th><th>Uživatel</th><th>Kategorie</th><th>Akce</th><th>Detail</th></tr></thead>
          <tbody>`;

        for (const item of items) {
          const catLabel = AUDIT_CATEGORIES[item.category] || item.category;
          const catColor = CATEGORY_COLORS[item.category] || "#64748b";
          const actionLabel = AUDIT_ACTIONS[item.action] || item.action;
          const time = item.created_at ? new Date(item.created_at + "Z").toLocaleString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
          const detail = item.details || (item.entity_type && item.entity_id ? `${item.entity_type} #${item.entity_id}` : "");

          html += `<tr>
            <td class="audit-time">${esc(time)}</td>
            <td>${item.username ? esc(item.username) : '<span class="muted">—</span>'}</td>
            <td><span class="audit-badge" style="background:${catColor}">${esc(catLabel)}</span></td>
            <td>${esc(actionLabel)}</td>
            <td class="audit-detail">${esc(detail)}</td>
          </tr>`;
        }

        html += "</tbody></table>";

        if (totalPages > 1) {
          html += `<div class="audit-paging">
            <button class="btn-secondary btn-sm" id="audit-prev" ${currentPageNum <= 1 ? "disabled" : ""}>Předchozí</button>
            <span class="audit-page-info">${currentPageNum} / ${totalPages}</span>
            <button class="btn-secondary btn-sm" id="audit-next" ${currentPageNum >= totalPages ? "disabled" : ""}>Další</button>
          </div>`;
        }

        wrap.innerHTML = html;

        const prevBtn = document.getElementById("audit-prev");
        const nextBtn = document.getElementById("audit-next");
        if (prevBtn) prevBtn.addEventListener("click", () => { auditOffset -= auditLimit; loadAudit(); });
        if (nextBtn) nextBtn.addEventListener("click", () => { auditOffset += auditLimit; loadAudit(); });
      } catch (err) {
        wrap.innerHTML = `<div class="placeholder-msg">Chyba: ${esc(err.message)}</div>`;
      }
    }

    loadAudit();
  }

  // ── Hash navigation ──
  window.addEventListener("hashchange", () => {
    const raw = location.hash.replace("#", "");
    const page = raw.split("/")[0];
    const sub = raw.split("/")[1] || null;
    // Akce sub-routes handled internally via replaceState, skip re-render
    if (page === currentPage && page === "akce") return;
    // Handle sub-tab changes within same page (e.g. smeny -> smeny/zapis)
    if (page === currentPage && page === "smeny" && sub !== smenyTab) {
      smenyTab = sub === "zapis" ? "zapis" : "rozpis";
      const content = document.getElementById("page-content");
      if (content) renderSmeny(content);
      return;
    }
    if (page && page !== currentPage && pages[page]) {
      stopTeamsPolling();
      stopShiftsPolling();
      currentPage = page;
      currentQuizId = null;
      resultsMode = false;
      renderDashboard();
    }
  });

  // ── Init ──
  checkSession();
})();
