// SPiRiT Dungeon – Admin SPA
(function () {
  "use strict";

  const app = document.getElementById("app");
  let currentUser = null;
  let currentPage = "galerie";

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
      currentUser = data.username;
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
            <button type="submit" class="login-btn">Přihlásit se</button>
            <div class="login-error" id="login-error"></div>
          </form>
        </div>
      </div>
    `;

    const form = document.getElementById("login-form");
    form.addEventListener("submit", handleLogin);

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
      const data = await api("POST", "/login", { username, password });
      currentUser = data.username;
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

  const pages = {
    galerie: { label: "Galerie", icon: "\uD83D\uDDBC\uFE0F" },
    kvizy: { label: "Kvízy", icon: "\uD83C\uDFAF" },
    posta: { label: "Pošta", icon: "\u2709\uFE0F" },
    nastaveni: { label: "Nastavení", icon: "\u2699\uFE0F" },
  };

  function renderDashboard() {
    const navItems = Object.entries(pages)
      .map(
        ([key, { label, icon }]) =>
          `<li><a href="#" data-page="${key}" class="${key === currentPage ? "active" : ""}">
            <span class="nav-icon">${icon}</span>${label}
          </a></li>`
      )
      .join("");

    app.innerHTML = `
      <div class="dashboard">
        <aside class="sidebar">
          <div class="sidebar-logo">
            <img src="/img/logo/logo_white_png.png" alt="SPiRiT">
            <span class="sidebar-label">Dungeon</span>
          </div>
          <ul class="sidebar-nav">${navItems}</ul>
          <div class="sidebar-bottom">
            <a href="#" id="logout-btn">
              <span class="nav-icon">\uD83D\uDEAA</span>Odhlásit se
            </a>
          </div>
        </aside>
        <main class="main">
          <div class="main-header">
            <h1 id="page-title">${pages[currentPage].label}</h1>
            <span class="main-user">${currentUser}</span>
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
          currentPage = page;
          currentQuizId = null;
          resultsMode = false;
          renderDashboard();
        }
      });
    });

    document.getElementById("logout-btn").addEventListener("click", handleLogout);

    // Render page content
    const content = document.getElementById("page-content");
    if (currentPage === "galerie") {
      renderGalerie(content);
    } else if (currentPage === "kvizy") {
      renderKvizy(content);
    } else if (currentPage === "posta") {
      renderPosta(content);
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
    if (!confirm("Opravdu smazat tuto galerii?")) return;
    try {
      await api("DELETE", "/galleries/" + id);
      await loadGalleries();
      renderGalleryList();
    } catch (err) {
      alert("Chyba: " + err.message);
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
    if (!confirm("Smazat tuto fotku?")) return;
    try {
      await api("DELETE", "/galleries/" + currentGalleryId + "/photos/" + photoId);
      galleryPhotos = galleryPhotos.filter((p) => p.id !== photoId);
      renderPhotoGrid();
    } catch (err) {
      alert("Chyba: " + err.message);
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

        const res = await fetch("/dungeon/api/galleries/" + currentGalleryId + "/photos", {
          method: "POST",
          credentials: "same-origin",
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

  function resizeImage(file, maxW, maxH) {
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
          0.85
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      img.src = url;
    });
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
      if (!confirm("Smazat všechny emaily?")) return;
      try {
        await api("DELETE", "/mail");
        loadAndRenderMail();
      } catch (err) {
        alert("Chyba: " + err.message);
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
    w.document.write(mail.html);
    w.document.close();
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

    container.innerHTML = `
      <div class="gallery-toolbar">
        <button class="btn-primary" id="quiz-add-btn">+ Přidat kvíz</button>
      </div>
      <div id="quiz-form-wrap"></div>
      <div class="gallery-list" id="quiz-list">
        <div class="placeholder-msg">Načítání…</div>
      </div>
    `;

    document.getElementById("quiz-add-btn").addEventListener("click", () => {
      editingQuizId = null;
      showQuizForm();
    });

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
          ${isPast && !q.results_count ? `<button class="btn-small btn-edit btn-results" data-id="${q.id}">🏆 Vyhlásit</button>` : ""}
          <button class="btn-small btn-edit" data-id="${q.id}">Upravit</button>
          <button class="btn-small btn-delete" data-id="${q.id}">Smazat</button>
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
    if (!confirm("Opravdu smazat tento kvíz?")) return;
    try {
      await api("DELETE", "/quizzes/" + id);
      await loadQuizzes();
      renderQuizList();
    } catch (err) {
      alert("Chyba: " + err.message);
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

  function renderTeamCard(team) {
    const paid = team.payment_status !== null && team.payment_status !== undefined;
    const statusLabel = paid ? paymentLabels[team.payment_status] || team.payment_status : "Nezaplaceno";
    const statusClass = paid ? "team-status--paid" : "team-status--unpaid";

    const members = (team.members || []).map((m) =>
      `<span class="team-member">${esc(m.name)}</span>`
    ).join("");

    const registered = team.created_at ? formatDateTime(team.created_at) : "";

    return `
      <div class="team-card" data-team-id="${team.id}">
        <div class="team-card-header">
          <span class="team-icon">${esc(team.icon)}</span>
          <div class="team-card-info">
            <div class="team-card-name">${esc(team.team_name)}</div>
            <div class="team-card-email">${esc(team.email)}</div>
            ${registered ? `<div class="team-card-registered">Registrace: ${registered}</div>` : ""}
          </div>
          <span class="team-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="team-members">${members}</div>
        <div class="team-card-actions">
          <div class="team-payment-btns">
            <span class="team-payment-label">Platba:</span>
            <button class="btn-small btn-payment ${team.payment_status === "cash" ? "btn-payment--active" : ""}" data-team-id="${team.id}" data-status="cash">💵 Hotově</button>
            <button class="btn-small btn-payment ${team.payment_status === "card" ? "btn-payment--active" : ""}" data-team-id="${team.id}" data-status="card">💳 Kartou</button>
            <button class="btn-small btn-payment ${team.payment_status === "free" ? "btn-payment--active" : ""}" data-team-id="${team.id}" data-status="free">🎁 Zdarma</button>
            <button class="btn-small btn-payment ${team.payment_status === "bank" ? "btn-payment--active" : ""}" data-team-id="${team.id}" data-status="bank">🏦 Převodem</button>
          </div>
          <div class="team-danger-btns">
            ${paid ? `<button class="btn-small btn-confirm-team" data-team-id="${team.id}">✉️ Potvrdit</button>` : ""}
            ${paid ? `<button class="btn-small btn-cancel-payment" data-team-id="${team.id}">Zrušit platbu</button>` : ""}
            <button class="btn-small btn-delete btn-delete-team" data-team-id="${team.id}">Smazat</button>
          </div>
        </div>
      </div>`;
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
      html += confirmed.map(renderTeamCard).join("");
    }

    if (unconfirmed.length) {
      html += `<div class="teams-section-header teams-section--unconfirmed">Nepotvrzené (${unconfirmed.length})</div>`;
      html += unconfirmed.map(renderTeamCard).join("");
    }

    list.innerHTML = html;

    // Payment buttons
    list.querySelectorAll(".btn-payment").forEach((btn) => {
      btn.addEventListener("click", () => {
        setTeamPayment(Number(btn.dataset.teamId), btn.dataset.status);
      });
    });

    // Cancel payment buttons
    list.querySelectorAll(".btn-cancel-payment").forEach((btn) => {
      btn.addEventListener("click", () => {
        setTeamPayment(Number(btn.dataset.teamId), null);
      });
    });

    // Confirm buttons
    list.querySelectorAll(".btn-confirm-team").forEach((btn) => {
      btn.addEventListener("click", () => {
        confirmTeam(Number(btn.dataset.teamId));
      });
    });

    // Delete buttons
    list.querySelectorAll(".btn-delete-team").forEach((btn) => {
      btn.addEventListener("click", () => {
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
      alert("Chyba: " + err.message);
    }
  }

  async function confirmTeam(teamId) {
    const team = quizTeams.find((t) => t.id === teamId);
    if (!team) return;

    // Show confirmation modal
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <h3>Potvrdit účast?</h3>
        <p>Týmu <strong>${esc(team.icon)} ${esc(team.team_name)}</strong> bude odeslán potvrzující email.</p>
        <div class="modal-btns">
          <button class="btn-secondary" id="modal-cancel">Zrušit</button>
          <button class="btn-primary" id="modal-ok">Odeslat</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    document.getElementById("modal-cancel").addEventListener("click", () => {
      overlay.remove();
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.getElementById("modal-ok").addEventListener("click", async () => {
      const okBtn = document.getElementById("modal-ok");
      okBtn.disabled = true;
      okBtn.textContent = "Odesílání…";
      try {
        await api("POST", "/teams/" + teamId + "/confirm");
        overlay.remove();
        alert("Potvrzující email odeslán!");
      } catch (err) {
        overlay.remove();
        alert("Chyba: " + err.message);
      }
    });
  }

  // ── Quiz Results (Vyhlásit) ──

  let resultsTeams = [];

  async function renderQuizResults(container) {
    const quiz = quizzes.find((q) => q.id === currentQuizId);
    const title = quiz ? "Kvíz #" + esc(String(quiz.quiz_number)) + " — Výsledky" : "Výsledky";

    container.innerHTML = `
      <div class="gallery-detail-header">
        <button class="btn-secondary" id="results-back-btn">&larr; Zpět</button>
        <h2>${title}</h2>
        <button class="btn-primary" id="results-save-btn">Uložit</button>
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

    document.getElementById("results-save-btn").addEventListener("click", saveResults);

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

    const medals = ["🥇", "🥈", "🥉"];
    const medalClasses = ["results-row--gold", "results-row--silver", "results-row--bronze"];

    list.innerHTML = resultsTeams.map((team, i) => {
      const place = i + 1;
      const medal = medals[i] || "";
      const medalClass = medalClasses[i] || "";
      const scoreVal = team.score != null ? team.score : "";
      return `
        <div class="results-row ${medalClass}" draggable="true" data-idx="${i}">
          <span class="results-placement">${place}.</span>
          <span class="results-medal">${medal}</span>
          <span class="team-icon">${esc(team.icon)}</span>
          <span class="results-team-name">${esc(team.team_name)}</span>
          <input type="number" class="results-score-input" data-idx="${i}" value="${scoreVal}" placeholder="Skóre">
        </div>`;
    }).join("");

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
      alert("Chyba: " + err.message);
      btn.disabled = false;
      btn.textContent = "Uložit";
    }
  }

  async function deleteTeam(teamId) {
    if (!confirm("Opravdu smazat tým z kvízu?")) return;
    try {
      await api("DELETE", "/teams/" + teamId);
      quizTeams = quizTeams.filter((t) => t.id !== teamId);
      renderTeamsList();
    } catch (err) {
      alert("Chyba: " + err.message);
    }
  }

  async function handleLogout(e) {
    e.preventDefault();
    try {
      await api("POST", "/logout");
    } catch {
      // ignore
    }
    currentUser = null;
    currentPage = "galerie";
    renderLogin();
  }

  // ── Init ──
  checkSession();
})();
