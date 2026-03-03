// SPiRiT Dungeon – Admin SPA
(function () {
  "use strict";

  const app = document.getElementById("app");
  let currentUser = null;
  let currentPage = "galerie";

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
          currentPage = page;
          renderDashboard();
        }
      });
    });

    document.getElementById("logout-btn").addEventListener("click", handleLogout);

    // Render page content
    const content = document.getElementById("page-content");
    if (currentPage === "galerie") {
      renderGalerie(content);
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
    list.innerHTML = galleries.map((g) => `
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
      </div>
    `).join("");

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
            <input type="date" id="gf-from" required value="${g ? g.date_from : ""}">
          </div>
          <div class="form-group">
            <label for="gf-to">Datum do</label>
            <input type="date" id="gf-to" value="${g?.date_to ?? ""}">
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">${g ? "Uložit" : "Vytvořit"}</button>
          <button type="button" class="btn-secondary" id="gf-cancel">Zrušit</button>
        </div>
        <div class="login-error" id="gf-error"></div>
      </form>
    `;

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
      date_from: document.getElementById("gf-from").value,
      date_to: document.getElementById("gf-to").value || null,
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
