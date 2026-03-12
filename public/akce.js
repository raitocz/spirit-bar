(function () {
  var app = document.getElementById("akce-app");
  if (!app) return;

  var DAY_NAMES = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];
  var MONTH_NAMES = [
    "ledna", "února", "března", "dubna", "května", "června",
    "července", "srpna", "září", "října", "listopadu", "prosince",
  ];
  var MONTH_LABELS = [
    "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
    "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
  ];

  var eventsData = [];

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    return DAY_NAMES[d.getDay()] + " " + d.getDate() + ". " + MONTH_NAMES[d.getMonth()];
  }

  function formatDateRange(dateFrom, dateTo) {
    if (!dateTo) return formatDate(dateFrom);
    return formatDate(dateFrom) + " – " + formatDate(dateTo);
  }

  function isToday(dateStr, dateToStr) {
    var today = new Date().toISOString().slice(0, 10);
    if (dateToStr) return dateStr <= today && today <= dateToStr;
    return dateStr === today;
  }

  function isTomorrow(dateStr) {
    var t = new Date();
    t.setDate(t.getDate() + 1);
    return dateStr === t.toISOString().slice(0, 10);
  }

  function renderDescription(desc) {
    if (!desc) return "";
    var lines = desc.split("\n");
    var html = "";
    var inList = false;
    for (var i = 0; i < lines.length; i++) {
      var trimmed = lines[i].trim();
      if (trimmed.match(/^[-*] /)) {
        if (!inList) { html += "<ul>"; inList = true; }
        var item = esc(trimmed.replace(/^[-*] /, ""));
        item = applyInlineFormatting(item);
        html += "<li>" + item + "</li>";
      } else {
        if (inList) { html += "</ul>"; inList = false; }
        if (trimmed === "") {
          html += "<br>";
        } else {
          var p = esc(trimmed);
          p = applyInlineFormatting(p);
          html += "<p>" + p + "</p>";
        }
      }
    }
    if (inList) html += "</ul>";
    return html;
  }

  function applyInlineFormatting(text) {
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    return text;
  }

  function photoUrl(r2Key) {
    return "/dungeon/photos/" + r2Key;
  }

  function buildTags(ev) {
    var tags = [];
    if (ev.entry_fee > 0) tags.push(ev.entry_fee + " Kč");
    if (ev.has_competitions) tags.push("Soutěže");
    if (ev.has_special_drinks) tags.push("Speciální drinky");
    if (ev.has_costume_reward) tags.push("Odměna za kostým");
    if (ev.has_tasting) tags.push("Ochutnávková session");
    if (ev.linked_quiz_id) tags.push("Pub Quiz");
    return tags;
  }

  // ── Calendar helpers ──

  function toICSDate(dateStr, timeStr) {
    // dateStr: "2026-03-12", timeStr: "19:00" → "20260312T190000"
    return dateStr.replace(/-/g, "") + "T" + timeStr.replace(":", "") + "00";
  }

  function toICSEndDate(dateStr, dateToStr, timeStr) {
    // End = date_to+1 day (all-day style) or date + time + 3h
    var end = dateToStr || dateStr;
    var d = new Date(end + "T" + timeStr + ":00");
    if (dateToStr) {
      // Multi-day: end at same time on last day + 3h
      d.setHours(d.getHours() + 3);
    } else {
      d.setHours(d.getHours() + 3);
    }
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00";
  }

  function googleCalUrl(ev) {
    var start = toICSDate(ev.date, ev.time);
    var end = toICSEndDate(ev.date, ev.date_to, ev.time);
    var params = [
      "action=TEMPLATE",
      "text=" + encodeURIComponent(ev.title),
      "dates=" + start + "/" + end,
      "location=" + encodeURIComponent("SPiRiT Bar, Školní 605/18, 415 01 Teplice"),
      "details=" + encodeURIComponent(ev.description || "")
    ];
    return "https://calendar.google.com/calendar/render?" + params.join("&");
  }

  function generateICS(ev) {
    var start = toICSDate(ev.date, ev.time);
    var end = toICSEndDate(ev.date, ev.date_to, ev.time);
    var now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z/, "Z");
    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SPiRiT Bar//Events//CS",
      "BEGIN:VEVENT",
      "DTSTART:" + start,
      "DTEND:" + end,
      "SUMMARY:" + ev.title,
      "LOCATION:SPiRiT Bar\\, Školní 605/18\\, 415 01 Teplice",
      "DESCRIPTION:" + (ev.description || "").replace(/\n/g, "\\n"),
      "DTSTAMP:" + now,
      "UID:" + ev.id + "@spirit-bar.cz",
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    return lines.join("\r\n");
  }

  function downloadICS(ev) {
    var ics = generateICS(ev);
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = ev.title.replace(/[^a-zA-Z0-9áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ ]/g, "").replace(/ +/g, "_") + ".ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function outlookUrl(ev) {
    var start = ev.date + "T" + ev.time + ":00";
    var endD = new Date(start);
    endD.setHours(endD.getHours() + 3);
    var end = endD.toISOString().slice(0, 19);
    var params = [
      "path=/calendar/action/compose",
      "rru=addevent",
      "subject=" + encodeURIComponent(ev.title),
      "startdt=" + encodeURIComponent(start),
      "enddt=" + encodeURIComponent(end),
      "location=" + encodeURIComponent("SPiRiT Bar, Školní 605/18, 415 01 Teplice"),
      "body=" + encodeURIComponent(ev.description || "")
    ];
    return "https://outlook.live.com/calendar/0/action/compose?" + params.join("&");
  }

  // ── Modal ──

  function openModal(ev) {
    var dateLabel = formatDateRange(ev.date, ev.date_to);
    var tags = buildTags(ev);

    var tagsHtml = "";
    if (tags.length) {
      tagsHtml = '<div class="akce-modal-tags">';
      for (var j = 0; j < tags.length; j++) {
        tagsHtml += '<span class="akce-pub-tag">' + esc(tags[j]) + '</span>';
      }
      tagsHtml += '</div>';
    }

    var coverHtml = ev.cover_r2_key
      ? '<div class="akce-modal-cover"><img src="' + photoUrl(ev.cover_r2_key) + '" alt="' + esc(ev.title) + '"></div>'
      : '';

    var descHtml = ev.description
      ? '<div class="akce-modal-desc">' + renderDescription(ev.description) + '</div>'
      : '';

    var registerHtml = ev.linked_quiz_id
      ? '<a href="/kviz?register=' + ev.linked_quiz_id + '" class="akce-register-btn">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>' +
          ' Registrace na kvíz' +
        '</a>'
      : '';

    var overlay = document.createElement("div");
    overlay.className = "akce-modal-overlay";
    overlay.innerHTML =
      '<div class="akce-modal">' +
        coverHtml +
        '<div class="akce-modal-body">' +
          '<div class="akce-modal-date-row">' +
            '<span class="akce-pub-date">' + esc(dateLabel) + '</span>' +
            '<span class="akce-pub-time">' + esc(ev.time) + '</span>' +
          '</div>' +
          '<h2 class="akce-modal-title">' + esc(ev.title) + '</h2>' +
          tagsHtml +
          descHtml +
        '</div>' +
        '<div class="akce-modal-footer">' +
          '<div class="akce-cal-wrap">' +
            '<button class="akce-cal-btn">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
              ' Přidat do kalendáře' +
            '</button>' +
            '<div class="akce-cal-dropdown">' +
              '<button class="akce-cal-option" data-cal="google">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>' +
                ' Google Calendar' +
              '</button>' +
              '<button class="akce-cal-option" data-cal="apple">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>' +
                ' Apple Calendar' +
              '</button>' +
              '<button class="akce-cal-option" data-cal="outlook">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M24 7.387v10.478c0 .23-.08.424-.238.576-.16.154-.352.232-.578.232h-8.15v-6.09l1.386 1.006c.07.047.154.07.252.07s.18-.023.252-.07L24 8.852v-1.46l-.003-.004zm-9.966 5.275h-3.37v6.156h3.37v-6.156z" fill="#0072C6"/><path d="M24 7.39v-.58c0-.227-.08-.42-.238-.576-.16-.154-.352-.232-.578-.232h-8.15v2.32l7.117 5.164.004-.003.027-.02c.54-.39.814-.844.818-1.356V7.39z" fill="#0072C6"/><path d="M9.695 7.002H6.63v11.816h3.065c.36 0 .664-.12.914-.363.25-.243.375-.537.375-.882V8.247c0-.345-.125-.64-.375-.883a1.262 1.262 0 0 0-.914-.362z" fill="#0072C6"/><path d="M14.666 2H1.68c-.467 0-.862.16-1.188.478C.165 2.797 0 3.182 0 3.638v12.944c0 .456.165.84.493 1.16.326.318.72.478 1.187.478h12.986c.466 0 .86-.16 1.187-.478.327-.32.49-.704.49-1.16V3.638c0-.456-.163-.84-.49-1.16A1.63 1.63 0 0 0 14.666 2zM8.17 15.549c-.588.573-1.337.86-2.249.86s-1.66-.287-2.25-.86c-.587-.574-.882-1.313-.882-2.218V6.89c0-.906.295-1.644.883-2.218.59-.574 1.338-.86 2.25-.86.91 0 1.66.286 2.248.86.59.574.884 1.312.884 2.218v6.44c0 .905-.295 1.644-.884 2.218z" fill="#0072C6"/><ellipse cx="5.921" cy="10.11" rx="1.56" ry="3.38" fill="white"/></svg>' +
                ' Outlook' +
              '</button>' +
            '</div>' +
          '</div>' +
          registerHtml +
          '<button class="akce-modal-close">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            ' Zavřít' +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    // Fade in
    requestAnimationFrame(function () {
      overlay.classList.add("active");
    });

    function close() {
      overlay.classList.remove("active");
      setTimeout(function () {
        overlay.remove();
        document.body.style.overflow = "";
      }, 250);
    }

    overlay.querySelector(".akce-modal-close").addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    // Calendar dropdown
    var calBtn = overlay.querySelector(".akce-cal-btn");
    var calDrop = overlay.querySelector(".akce-cal-dropdown");
    calBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      calDrop.classList.toggle("open");
    });
    overlay.querySelectorAll(".akce-cal-option").forEach(function (opt) {
      opt.addEventListener("click", function (e) {
        e.stopPropagation();
        var cal = opt.dataset.cal;
        if (cal === "google") {
          window.open(googleCalUrl(ev), "_blank");
        } else if (cal === "apple") {
          downloadICS(ev);
        } else if (cal === "outlook") {
          window.open(outlookUrl(ev), "_blank");
        }
        calDrop.classList.remove("open");
      });
    });
    // Close dropdown on outside click
    overlay.querySelector(".akce-modal").addEventListener("click", function () {
      calDrop.classList.remove("open");
    });

    // Escape key
    function onKey(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); }
    }
    document.addEventListener("keydown", onKey);

    // Fade in cover image
    var img = overlay.querySelector(".akce-modal-cover img");
    if (img) {
      if (img.complete && img.naturalWidth) { img.classList.add("loaded"); }
      else { img.addEventListener("load", function () { img.classList.add("loaded"); }, { once: true }); }
    }
  }

  // ── Render list ──

  async function loadEvents() {
    app.innerHTML = '<div class="akce-pub-loading"><div class="galerie-spinner"></div></div>';

    try {
      var res = await fetch("/api/events");
      eventsData = await res.json();

      if (!eventsData.length) {
        app.innerHTML =
          '<div class="container" style="padding-top:8rem;text-align:center;">' +
          '<p class="section-label">Akce</p>' +
          '<h2 class="section-title">Žádné akce</h2>' +
          '<p class="section-sub" style="margin-top:1rem;color:var(--muted)">Sledujte nás pro novinky o připravovaných eventech.</p>' +
          '</div>';
        return;
      }

      // Split into upcoming and past
      var today = new Date().toISOString().slice(0, 10);
      var upcoming = [];
      var past = [];
      for (var i = 0; i < eventsData.length; i++) {
        var ev = eventsData[i];
        var endDate = ev.date_to || ev.date;
        if (endDate >= today) {
          upcoming.push(ev);
        } else {
          past.push(ev);
        }
      }

      function groupByMonth(events) {
        var byMonth = {};
        for (var i = 0; i < events.length; i++) {
          var key = events[i].date.slice(0, 7);
          if (!byMonth[key]) byMonth[key] = [];
          byMonth[key].push(events[i]);
        }
        return byMonth;
      }

      function renderCard(ev, isPast) {
        var dateLabel = formatDateRange(ev.date, ev.date_to);
        var whenBadge = "";
        if (!isPast) {
          if (isToday(ev.date, ev.date_to)) whenBadge = '<span class="akce-pub-when akce-pub-when--today">Dnes</span>';
          else if (isTomorrow(ev.date)) whenBadge = '<span class="akce-pub-when akce-pub-when--tomorrow">Zítra</span>';
        }

        var tags = buildTags(ev);
        var tagsHtml = "";
        if (tags.length) {
          tagsHtml = '<div class="akce-pub-tags">';
          for (var j = 0; j < tags.length; j++) {
            tagsHtml += '<span class="akce-pub-tag">' + esc(tags[j]) + '</span>';
          }
          tagsHtml += '</div>';
        }

        var coverSrc = ev.cover_thumb_r2_key || ev.cover_r2_key;
        var coverHtml = coverSrc
          ? '<div class="akce-pub-cover"><img src="' + photoUrl(coverSrc) + '" alt="' + esc(ev.title) + '" loading="lazy"></div>'
          : '';

        var cardClass = 'akce-pub-card';
        if (isPast) cardClass += ' akce-pub-card--past';
        else if (isToday(ev.date, ev.date_to)) cardClass += ' akce-pub-card--today';

        return '<div class="' + cardClass + '" data-id="' + ev.id + '">' +
          coverHtml +
          '<div class="akce-pub-content">' +
            '<div class="akce-pub-date-row">' +
              '<span class="akce-pub-date">' + esc(dateLabel) + '</span>' +
              '<span class="akce-pub-time">' + esc(ev.time) + '</span>' +
              whenBadge +
            '</div>' +
            '<h3 class="akce-pub-title">' + esc(ev.title) + '</h3>' +
            tagsHtml +
          '</div>' +
        '</div>';
      }

      function renderMonthGroup(byMonth, sortOrder, isPast) {
        var keys = Object.keys(byMonth).sort(sortOrder === 'desc'
          ? function (a, b) { return b.localeCompare(a); }
          : function (a, b) { return a.localeCompare(b); });
        var html = '';
        for (var m = 0; m < keys.length; m++) {
          var mk = keys[m];
          var monthIdx = parseInt(mk.slice(5, 7), 10) - 1;
          var year = mk.slice(0, 4);
          html += '<h3 class="akce-pub-month">' + esc(MONTH_LABELS[monthIdx] + " " + year) + '</h3>';
          html += '<div class="akce-pub-list">';
          var events = byMonth[mk];
          for (var i = 0; i < events.length; i++) {
            html += renderCard(events[i], isPast);
          }
          html += '</div>';
        }
        return html;
      }

      var html = '<div class="container akce-pub-container">' +
        '<p class="section-label">Akce</p>' +
        '<h2 class="section-title">Nadcházející akce</h2>';

      if (upcoming.length) {
        html += renderMonthGroup(groupByMonth(upcoming), 'asc', false);
      } else {
        html += '<p style="color:var(--muted);margin-top:1.5rem;">Žádné nadcházející akce.</p>';
      }

      if (past.length) {
        html += '<h2 class="section-title" style="margin-top:3rem;">Proběhlé akce</h2>';
        html += renderMonthGroup(groupByMonth(past), 'desc', true);
      }

      html += '</div>';
      app.innerHTML = html;

      // Open modal on card click
      app.querySelectorAll(".akce-pub-card").forEach(function (card) {
        card.addEventListener("click", function () {
          var id = Number(card.dataset.id);
          var ev = eventsData.find(function (e) { return e.id === id; });
          if (ev) openModal(ev);
        });
      });

      // Fade in images
      app.querySelectorAll("img").forEach(function (img) {
        if (img.complete && img.naturalWidth) {
          img.classList.add("loaded");
        } else {
          img.addEventListener("load", function () { img.classList.add("loaded"); }, { once: true });
        }
      });

    } catch (err) {
      app.innerHTML =
        '<div class="container" style="padding-top:8rem;text-align:center;">' +
        '<h2 class="section-title">Chyba při načítání</h2>' +
        '<p style="color:var(--muted)">' + esc(err.message) + '</p>' +
        '</div>';
    }
  }

  loadEvents();
})();
