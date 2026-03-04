// SPiRiT – Kvíz public page
(function () {
  "use strict";

  var container = document.getElementById("kviz-app");
  var openFormQuizId = null;
  var openResultsQuizId = null;
  var quizzesData = [];

  function esc(str) {
    var el = document.createElement("span");
    el.textContent = str;
    return el.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
  }

  function formatPrice(price) {
    return price + "\u00a0Kč";
  }

  async function init() {
    container.innerHTML = '<div class="galerie-loading"><div class="galerie-spinner"></div></div>';

    try {
      var res = await fetch("/api/quizzes");
      if (!res.ok) throw new Error("Fetch failed");
      quizzesData = await res.json();
      renderAll();
    } catch (e) {
      container.innerHTML =
        '<div class="container" style="padding-top:8rem;text-align:center;">' +
        '<p style="color:var(--muted);">Kvízy se nepodařilo načíst.</p></div>';
    }
  }

  function renderAll() {
    var today = new Date().toISOString().slice(0, 10);
    var upcoming = quizzesData
      .filter(function (q) { return q.date >= today; })
      .sort(function (a, b) { return a.date.localeCompare(b.date); });
    var past = quizzesData
      .filter(function (q) { return q.date < today; })
      .sort(function (a, b) { return b.date.localeCompare(a.date); });

    render(upcoming, past);
  }

  function renderCard(q, isPast) {
    var registered = q.registered_teams || 0;
    var max = q.max_participants;
    var spotsLeft = max - registered;
    var isFull = spotsLeft <= 0;

    var html =
      '<div class="kviz-card' + (isPast ? " kviz-card--past" : "") + '" data-quiz-id="' + q.id + '">' +
        '<div class="kviz-card-number">Kvíz #' + esc(String(q.quiz_number)) + "</div>" +
        '<div class="kviz-card-date">' + formatDate(q.date) + "</div>" +
        '<div class="kviz-card-meta">' +
          "<span>" + formatPrice(q.price) + " / tým</span>" +
          '<span class="kviz-card-price">' + esc(String(max)) + " týmů max</span>" +
        "</div>";

    if (!isPast) {
      html +=
        '<div class="kviz-card-footer">' +
          '<span class="kviz-spots' + (isFull ? " kviz-spots--full" : (spotsLeft <= 2 ? " kviz-spots--low" : "")) + '">' +
            (isFull ? "Kapacita naplněna" : (spotsLeft <= 2 ? "⚠ " : "") + "Volná místa: " + spotsLeft + "/" + max) +
          "</span>";

      if (isFull) {
        html += '<button class="btn kviz-register-btn" disabled>Kapacita naplněna</button>';
      } else {
        html += '<button class="btn kviz-register-btn" data-quiz-id="' + q.id + '">Registrovat tým</button>';
      }
      html += "</div>";

      if (openFormQuizId === q.id) {
        html += renderForm(q);
      }
    }

    if (isPast && q.results_count) {
      html +=
        '<div class="kviz-card-footer">' +
          '<button class="btn kviz-results-btn" data-quiz-id="' + q.id + '">🏆 Výsledky</button>' +
        '</div>';

      if (openResultsQuizId === q.id) {
        html += '<div class="kviz-results" id="kviz-results-' + q.id + '"><div class="galerie-loading"><div class="galerie-spinner"></div></div></div>';
      }
    }

    html += "</div>";
    return html;
  }

  function renderForm(q) {
    var animals = [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
      "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔",
      "🐧", "🦉", "🐉", "🦄"
    ];
    var emojiRow = '<div class="kviz-emoji-row">';
    animals.forEach(function (em) {
      emojiRow += '<button type="button" class="kviz-emoji-btn" data-emoji="' + em + '">' + em + '</button>';
    });
    emojiRow += "</div>";

    return (
      '<div class="kviz-form" data-quiz-id="' + q.id + '">' +
        '<div class="form-group">' +
          '<label>Jméno týmu</label>' +
          '<input type="text" class="kviz-input kviz-team-name" placeholder="Název vašeho týmu" required>' +
        "</div>" +
        '<div class="form-group">' +
          '<label>Ikona týmu</label>' +
          '<input type="hidden" class="kviz-icon-input" value="">' +
          emojiRow +
        "</div>" +
        '<div class="form-group">' +
          '<label>E-mail</label>' +
          '<input type="email" class="kviz-input kviz-email" placeholder="kontakt@email.cz" required>' +
        "</div>" +
        '<div class="kviz-members">' +
          '<div class="kviz-member-row">' +
            '<input type="text" class="kviz-input kviz-member-input" placeholder="Jméno soutěžícího 1" required>' +
          "</div>" +
        "</div>" +
        '<button type="button" class="kviz-add-member">+ Přidat člena</button>' +
        '<div class="kviz-form-actions">' +
          '<button type="button" class="btn btn-primary kviz-submit-btn">Registrovat</button>' +
        "</div>" +
        '<div class="kviz-form-error" style="display:none;"></div>' +
      "</div>"
    );
  }

  function render(upcoming, past) {
    var html =
      '<div class="container" style="padding-top:8rem;">' +
      '<p class="section-label">Kvízy</p>' +
      '<h2 class="section-title">Kvízové večery</h2>' +
      '<div class="section-divider"></div>';

    if (upcoming.length) {
      html += '<h3 class="kviz-subheading">Nadcházející</h3>';
      upcoming.forEach(function (q) { html += renderCard(q, false); });
    }

    if (past.length) {
      html += '<h3 class="kviz-subheading kviz-subheading--past">Historie</h3>';
      past.forEach(function (q) { html += renderCard(q, true); });
    }

    if (!upcoming.length && !past.length) {
      html += '<p style="color:var(--muted);margin-top:2rem;">Zatím nejsou naplánovány žádné kvízy.</p>';
    }

    html += "</div>";
    container.innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    // Register buttons
    container.querySelectorAll(".kviz-register-btn:not([disabled])").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var qid = Number(btn.getAttribute("data-quiz-id"));
        if (openFormQuizId === qid) {
          openFormQuizId = null;
        } else {
          openFormQuizId = qid;
        }
        renderAll();
      });
    });

    // Results buttons
    container.querySelectorAll(".kviz-results-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var qid = Number(btn.getAttribute("data-quiz-id"));
        if (openResultsQuizId === qid) {
          openResultsQuizId = null;
          renderAll();
        } else {
          openResultsQuizId = qid;
          renderAll();
          loadResults(qid);
        }
      });
    });

    // Emoji preset buttons
    container.querySelectorAll(".kviz-emoji-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.disabled) return;
        var form = btn.closest(".kviz-form");
        form.querySelectorAll(".kviz-emoji-btn").forEach(function (b) {
          b.classList.remove("kviz-emoji-btn--selected");
        });
        btn.classList.add("kviz-emoji-btn--selected");
        form.querySelector(".kviz-icon-input").value = btn.getAttribute("data-emoji");
      });
    });

    // Fetch taken icons/names for open form and disable them
    container.querySelectorAll(".kviz-form").forEach(function (form) {
      var qid = form.getAttribute("data-quiz-id");
      fetch("/api/quizzes/" + qid + "/taken")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var takenIcons = data.icons || [];
          var takenNames = data.names || [];
          form._takenNames = takenNames;

          // Disable taken emojis
          var firstAvailable = null;
          form.querySelectorAll(".kviz-emoji-btn").forEach(function (btn) {
            var emoji = btn.getAttribute("data-emoji");
            if (takenIcons.indexOf(emoji) !== -1) {
              btn.disabled = true;
              btn.classList.add("kviz-emoji-btn--taken");
            } else if (!firstAvailable) {
              firstAvailable = btn;
            }
          });

          // Auto-select first available
          if (firstAvailable) {
            firstAvailable.classList.add("kviz-emoji-btn--selected");
            form.querySelector(".kviz-icon-input").value = firstAvailable.getAttribute("data-emoji");
          }
        })
        .catch(function () {});
    });

    // Add member buttons
    container.querySelectorAll(".kviz-add-member").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var form = btn.closest(".kviz-form");
        var membersDiv = form.querySelector(".kviz-members");
        var count = membersDiv.querySelectorAll(".kviz-member-row").length;
        if (count >= 4) return;
        var row = document.createElement("div");
        row.className = "kviz-member-row";
        row.innerHTML =
          '<input type="text" class="kviz-input kviz-member-input" placeholder="Jméno soutěžícího ' + (count + 1) + '">' +
          '<button type="button" class="kviz-remove-member">\u00d7</button>';
        membersDiv.appendChild(row);
        row.querySelector(".kviz-remove-member").addEventListener("click", function () {
          row.remove();
          updateMemberPlaceholders(form);
          if (membersDiv.querySelectorAll(".kviz-member-row").length < 4) {
            btn.style.display = "";
          }
        });
        if (membersDiv.querySelectorAll(".kviz-member-row").length >= 4) {
          btn.style.display = "none";
        }
      });
    });

    // Submit buttons
    container.querySelectorAll(".kviz-submit-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var form = btn.closest(".kviz-form");
        submitForm(form);
      });
    });
  }

  function updateMemberPlaceholders(form) {
    var rows = form.querySelectorAll(".kviz-member-row");
    rows.forEach(function (row, i) {
      row.querySelector(".kviz-member-input").placeholder = "Jméno soutěžícího " + (i + 1);
    });
  }

  async function submitForm(form) {
    var quizId = Number(form.getAttribute("data-quiz-id"));
    var teamName = form.querySelector(".kviz-team-name").value.trim();
    var icon = form.querySelector(".kviz-icon-input").value.trim();
    var email = form.querySelector(".kviz-email").value.trim();
    var memberInputs = form.querySelectorAll(".kviz-member-input");
    var members = [];
    memberInputs.forEach(function (inp) {
      var v = inp.value.trim();
      if (v) members.push(v);
    });

    var errDiv = form.querySelector(".kviz-form-error");

    if (!teamName) {
      showError(errDiv, "Vyplňte jméno týmu.");
      return;
    }
    var takenNames = form._takenNames || [];
    if (takenNames.indexOf(teamName) !== -1) {
      showError(errDiv, "Tým s tímto názvem je již registrován. Zvol jiný název.");
      return;
    }
    if (!icon) {
      showError(errDiv, "Vyber ikonu týmu.");
      return;
    }
    if (!email) {
      showError(errDiv, "Vyplňte e-mail.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(errDiv, "Zadejte platnou e-mailovou adresu.");
      return;
    }
    if (members.length < 1) {
      showError(errDiv, "Vyplňte alespoň jednoho člena.");
      return;
    }

    var submitBtn = form.querySelector(".kviz-submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Odesílám…";
    errDiv.style.display = "none";

    try {
      var res = await fetch("/api/quizzes/" + quizId + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: teamName,
          icon: icon || "🧠",
          email: email,
          members: members,
        }),
      });

      if (!res.ok) {
        var data = await res.json();
        throw new Error(data.error || "Registrace se nezdařila.");
      }

      // Build payment QR code
      var quiz = quizzesData.find(function (q) { return q.id === quizId; });
      var price = quiz ? quiz.price : 400;
      var quizNum = quiz ? quiz.quiz_number : "";
      var spdMsg = teamName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9 ]/g, "").slice(0, 50);
      var spdString = "SPD*1.0*ACC:CZ7703000000000356961515*AM:" + price.toFixed(2) + "*CC:CZK*PT:IP*MSG:Kviz #" + quizNum + " - " + spdMsg + "*RN:SPiRiT Teplice - Kviz #" + quizNum;
      var qrSvg = typeof QR !== "undefined" ? QR.toSVG(spdString, { size: 200, gradient: true }) : "";

      // Replace form with success + payment info
      form.innerHTML =
        '<div class="kviz-success">' +
          '<span class="kviz-success-icon">✓</span>' +
          '<strong>Registrace vytvořena!</strong>' +
          '<p class="kviz-success-notice">⚠ Registrace bude potvrzena zaplacením poplatku ⚠</p>' +
          '<p class="kviz-success-subtitle">Uhradit můžeš hotově na baru nebo převodem pomocí následujícího QR kódu:</p>' +
          '<div class="kviz-qr">' + qrSvg + '</div>' +
          '<div class="kviz-warning">Zaplať co nejdříve, aby ti někdo místo nevyfoukl!</div>' +
          '<p style="color:var(--muted);font-size:.85rem;margin-top:1rem;">Na <strong style="color:#fff;">' + esc(email) + '</strong> jsme poslali potvrzující email.</p>' +
        "</div>";

      openFormQuizId = null;
    } catch (e) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Registrovat";
      showError(errDiv, e.message);
    }
  }

  function showError(errDiv, msg) {
    errDiv.textContent = msg;
    errDiv.style.display = "block";
  }

  async function loadResults(quizId) {
    var wrap = document.getElementById("kviz-results-" + quizId);
    if (!wrap) return;

    try {
      var res = await fetch("/api/quizzes/" + quizId + "/results");
      if (!res.ok) throw new Error("Fetch failed");
      var teams = await res.json();

      if (!teams.length) {
        wrap.innerHTML = '<p style="color:var(--muted);padding:1rem;">Žádné výsledky.</p>';
        return;
      }

      var medals = ["🥇", "🥈", "🥉"];
      var medalClasses = ["kviz-result--gold", "kviz-result--silver", "kviz-result--bronze"];

      var html = '<div class="kviz-results-list">';
      teams.forEach(function (t, i) {
        var medal = medals[i] || "";
        var cls = medalClasses[i] || "";
        html +=
          '<div class="kviz-result-row ' + cls + '">' +
            '<span class="kviz-result-place">' + (i + 1) + '.</span>' +
            '<span class="kviz-result-medal">' + medal + '</span>' +
            '<span class="kviz-result-icon">' + esc(t.icon) + '</span>' +
            '<span class="kviz-result-name">' + esc(t.team_name) + '</span>' +
            (t.score != null ? '<span class="kviz-result-score">' + esc(String(t.score)) + ' b.</span>' : '') +
          '</div>';
      });
      html += '</div>';
      wrap.innerHTML = html;
    } catch (e) {
      wrap.innerHTML = '<p style="color:var(--muted);padding:1rem;">Výsledky se nepodařilo načíst.</p>';
    }
  }

  init();
})();
