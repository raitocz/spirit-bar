export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface CaughtEmail extends EmailMessage {
  id: number;
  sentAt: string;
}

const mailbox: CaughtEmail[] = [];
let nextId = 1;
const MAX_MAILBOX = 100;

export async function sendEmail(
  env: { ENVIRONMENT?: string; RESEND_API_KEY?: string },
  msg: EmailMessage
): Promise<void> {
  if (env.ENVIRONMENT === "development") {
    mailbox.push({ ...msg, id: nextId++, sentAt: new Date().toISOString() });
    if (mailbox.length > MAX_MAILBOX) mailbox.shift();
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "SPiRiT <noreply@spirit-bar.cz>",
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      ...(msg.text ? { text: msg.text } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

export function getMailbox(): CaughtEmail[] {
  return mailbox;
}

export function clearMailbox(): void {
  mailbox.length = 0;
}

// ── Email templates ──

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#020408;font-family:Inter,Arial,sans-serif;color:#e0e0e0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#020408;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#060b16;border-radius:8px;overflow:hidden;border-top:4px solid #2635d4;border-image:linear-gradient(to right,#2635d4,#00cfff) 1;">
    <tr><td align="center" style="padding:32px 24px 16px;">
      <img src="https://spirit-bar.cz/img/logo/logo_white_png.png" alt="SPiRiT" width="180" style="display:block;max-width:180px;height:auto;">
    </td></tr>
    <tr><td style="padding:8px 32px 32px;">
      ${content}
    </td></tr>
    <tr><td style="padding:24px 32px;border-top:1px solid #1a1f2e;text-align:center;font-size:13px;color:#666;">
      <p style="margin:0 0 4px;">SPiRiT – Bar, Hookah Lounge &amp; Coffee</p>
      <p style="margin:0 0 4px;">Školní 605/18, 415 01 Teplice</p>
      <p style="margin:0 0 4px;">+420 731 829 346</p>
      <p style="margin:0;"><a href="https://spirit-bar.cz" style="color:#00cfff;text-decoration:none;">spirit-bar.cz</a></p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

const CZECH_MONTHS = [
  "ledna", "února", "března", "dubna", "května", "června",
  "července", "srpna", "září", "října", "listopadu", "prosince",
];

function formatCzechDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()}. ${CZECH_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

interface QuizEmailOpts {
  quizNumber: number;
  date: string;
  price: number;
  teamName: string;
  icon: string;
  members: string[];
  email: string;
}

export function quizRegistrationEmail(opts: QuizEmailOpts): EmailMessage {
  const { quizNumber, date, price, teamName, icon, members, email } = opts;
  const czDate = formatCzechDate(date);

  const spdMsg = teamName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9 ]/g, "").substring(0, 40);
  const spdString = `SPD*1.0*ACC:CZ7703000000000356961515*AM:${price.toFixed(2)}*CC:CZK*PT:IP*MSG:Kviz #${quizNumber} - ${spdMsg}*RN:SPiRiT Teplice - Kviz #${quizNumber}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(spdString)}`;

  const membersList = members.map((m) => `<li style="padding:2px 0;">${escapeHtml(m)}</li>`).join("");

  const html = emailLayout(`
      <h1 style="margin:0 0 24px;font-size:28px;text-align:center;color:#fff;">${escapeHtml(icon)} ${escapeHtml(teamName)}</h1>
      <p style="margin:0 0 20px;font-size:16px;color:#ccc;text-align:center;">Děkujeme za registraci na kvíz!</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#888;width:100px;">Kdy</td>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#e0e0e0;">${czDate} v 19:00</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#888;">Kde</td>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#e0e0e0;">SPiRiT, Školní 605/18, Teplice</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#888;">Tým</td>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#e0e0e0;">${escapeHtml(icon)} ${escapeHtml(teamName)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#888;vertical-align:top;">Členové</td>
          <td style="padding:10px 0;color:#e0e0e0;"><ul style="margin:0;padding:0 0 0 18px;">${membersList}</ul></td>
        </tr>
      </table>
      <div style="background-color:#0d1117;border-radius:8px;padding:24px;text-align:center;">
        <p style="margin:0 0 12px;color:#f0c040;font-weight:600;">⚠️ Registrace bude potvrzena zaplacením poplatku ${price} Kč</p>
        <p style="margin:0 0 20px;color:#ccc;font-size:14px;">Uhradit můžeš hotově na baru nebo převodem:</p>
        <img src="${qrUrl}" alt="QR platba" width="200" height="200" style="display:block;margin:0 auto;border-radius:4px;">
      </div>
  `);

  const membersText = members.map((m, i) => `  ${i + 1}. ${m}`).join("\n");
  const text = `${icon} ${teamName} – Potvrzení registrace na Kvíz #${quizNumber}

Kdy: ${czDate} v 19:00
Kde: SPiRiT, Školní 605/18, Teplice
Tým: ${icon} ${teamName}
Členové:
${membersText}

Registrace bude potvrzena zaplacením poplatku ${price} Kč.
Uhradit můžeš hotově na baru nebo převodem.

---
SPiRiT – Bar, Hookah Lounge & Coffee
Školní 605/18, 415 01 Teplice
+420 731 829 346
https://spirit-bar.cz`;

  return { to: email, subject: `Potvrzení registrace – Kvíz #${quizNumber}`, html, text };
}

export function quizConfirmationEmail(opts: QuizEmailOpts): EmailMessage {
  const { quizNumber, date, price, teamName, icon, members, email } = opts;
  const czDate = formatCzechDate(date);

  const membersList = members.map((m) => `<li style="padding:2px 0;">${escapeHtml(m)}</li>`).join("");

  const html = emailLayout(`
      <h1 style="margin:0 0 24px;font-size:28px;text-align:center;color:#fff;">${escapeHtml(icon)} ${escapeHtml(teamName)}</h1>
      <div style="background-color:#0d1117;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
        <p style="margin:0;color:#00cfff;font-size:18px;font-weight:600;">✅ Účast potvrzena!</p>
      </div>
      <p style="margin:0 0 20px;font-size:16px;color:#ccc;text-align:center;">Účast vašeho týmu na kvízu byla potvrzena. Těšíme se na vás!</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#888;width:100px;">Kdy</td>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#e0e0e0;">${czDate} v 19:00</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#888;">Kde</td>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#e0e0e0;">SPiRiT, Školní 605/18, Teplice</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#888;">Tým</td>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#e0e0e0;">${escapeHtml(icon)} ${escapeHtml(teamName)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#888;">Platba</td>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#00cfff;font-weight:600;">${price} Kč – zaplaceno ✓</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#888;vertical-align:top;">Členové</td>
          <td style="padding:10px 0;color:#e0e0e0;"><ul style="margin:0;padding:0 0 0 18px;">${membersList}</ul></td>
        </tr>
      </table>
  `);

  const membersText = members.map((m, i) => `  ${i + 1}. ${m}`).join("\n");
  const text = `${icon} ${teamName} – Účast potvrzena! Kvíz #${quizNumber}

Účast vašeho týmu na kvízu byla potvrzena. Těšíme se na vás!

Kdy: ${czDate} v 19:00
Kde: SPiRiT, Školní 605/18, Teplice
Tým: ${icon} ${teamName}
Platba: ${price} Kč – zaplaceno
Členové:
${membersText}

---
SPiRiT – Bar, Hookah Lounge & Coffee
Školní 605/18, 415 01 Teplice
+420 731 829 346
https://spirit-bar.cz`;

  return { to: email, subject: `Účast potvrzena – Kvíz #${quizNumber}`, html, text };
}

export function adminInviteEmail(opts: { username: string; email: string; role: string; setupUrl: string }): EmailMessage {
  const { username, email, role, setupUrl } = opts;

  const roleLabel = role === "admin" ? "Admin" : role === "quizmaster" ? "Quizmaster" : "Staff";

  const html = emailLayout(`
      <h1 style="margin:0 0 24px;font-size:28px;text-align:center;color:#fff;">Vítej v Dungeonu!</h1>
      <p style="margin:0 0 20px;font-size:16px;color:#ccc;text-align:center;">Byl/a jsi pozván/a do administrace SPiRiT.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#888;width:120px;">Uživatel</td>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#e0e0e0;font-weight:600;">${escapeHtml(username)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#888;">Role</td>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#e0e0e0;">${escapeHtml(roleLabel)}</td>
        </tr>
      </table>
      <div style="text-align:center;margin:32px 0;">
        <a href="${escapeHtml(setupUrl)}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#2635d4,#00cfff);color:#fff;text-decoration:none;border-radius:100px;font-weight:600;font-size:16px;letter-spacing:.04em;">Nastavit heslo</a>
      </div>
      <p style="margin:0;font-size:13px;color:#666;text-align:center;">Odkaz je platný 24 hodin. Pokud jsi o přístup nežádal/a, tento email ignoruj.</p>
  `);

  const text = `Vítej v Dungeonu!

Byl/a jsi pozván/a do administrace SPiRiT.

Uživatel: ${username}
Role: ${roleLabel}

Nastav si heslo na: ${setupUrl}

Odkaz je platný 24 hodin.

---
SPiRiT – Bar, Hookah Lounge & Coffee
Školní 605/18, 415 01 Teplice
+420 731 829 346
https://spirit-bar.cz`;

  return { to: email, subject: "Pozvánka do SPiRiT Dungeon – nastav si heslo", html, text };
}

// ── Monthly shift summary email ──

interface MonthlyShiftSummaryOpts {
  username: string;
  email: string;
  monthName: string;
  year: number;
  totalShifts: number;
  totalHours: number;
  earnings: number | null;
  hourlyWage: number;
  unloggedDates: string[];
}

export function monthlyShiftSummaryEmail(opts: MonthlyShiftSummaryOpts): EmailMessage {
  const { username, monthName, year, totalShifts, totalHours, earnings, hourlyWage, unloggedDates, email } = opts;

  function formatCZK(amount: number): string {
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + " Kč";
  }

  let warningHtml = "";
  let warningText = "";
  if (unloggedDates.length > 0) {
    const DAY_NAMES_CZ = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];
    const datesListHtml = unloggedDates.map(d => {
      const dt = new Date(d + "T00:00:00");
      return `<li style="padding:3px 0;color:#e0e0e0;">${DAY_NAMES_CZ[dt.getDay()]} ${dt.getDate()}. ${CZECH_MONTHS[dt.getMonth()]}</li>`;
    }).join("");
    const datesListText = unloggedDates.map(d => {
      const dt = new Date(d + "T00:00:00");
      return `  - ${DAY_NAMES_CZ[dt.getDay()]} ${dt.getDate()}. ${CZECH_MONTHS[dt.getMonth()]}`;
    }).join("\n");

    warningHtml = `
      <div style="background:linear-gradient(135deg,rgba(220,80,50,.2),rgba(255,160,50,.15));border:1px solid rgba(220,80,50,.4);border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;color:#ff9070;font-weight:700;font-size:16px;">⚠️ ${unloggedDates.length} nezapsaných směn</p>
        <ul style="margin:0 0 12px;padding:0 0 0 18px;font-size:14px;">${datesListHtml}</ul>
        <p style="margin:0;color:#ff9070;font-size:14px;font-weight:600;">Doplň je prosím nejpozději dnes, jinak za ně nebude vyplacena mzda.</p>
      </div>`;

    warningText = `⚠️ ${unloggedDates.length} NEZAPSANÝCH SMĚN\n\n${datesListText}\n\nDoplň je prosím nejpozději dnes, jinak za ně nebude vyplacena mzda.\n\n`;
  }

  let earningsHtml = "";
  let earningsText = "";
  if (earnings !== null) {
    earningsHtml = `
        <tr>
          <td style="padding:12px 0;color:#888;">Orientační výdělek</td>
          <td style="padding:12px 0;color:#00cfff;font-weight:700;font-size:18px;">${formatCZK(earnings)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:4px 0 12px;color:#666;font-size:12px;">Při sazbě ${hourlyWage} Kč/h. Skutečná částka se může lišit.</td>
        </tr>`;
    earningsText = `Orientační výdělek: ${formatCZK(earnings)} (při sazbě ${hourlyWage} Kč/h, skutečná částka se může lišit)\n`;
  }

  const html = emailLayout(`
      <h1 style="margin:0 0 8px;font-size:24px;text-align:center;color:#fff;">Měsíční přehled směn</h1>
      <p style="margin:0 0 24px;font-size:16px;color:#888;text-align:center;">${escapeHtml(monthName)} ${year} · ${escapeHtml(username)}</p>
      ${warningHtml}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #1a1f2e;color:#888;width:180px;">Odpracovaných směn</td>
          <td style="padding:12px 0;border-bottom:1px solid #1a1f2e;color:#e0e0e0;font-weight:600;">${totalShifts}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #1a1f2e;color:#888;">Celkem hodin</td>
          <td style="padding:12px 0;border-bottom:1px solid #1a1f2e;color:#e0e0e0;font-weight:600;">${totalHours}h</td>
        </tr>
        ${earningsHtml}
      </table>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://spirit-bar.cz/dungeon#smeny/zapis" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#2635d4,#00cfff);color:#fff;text-decoration:none;border-radius:100px;font-weight:600;font-size:14px;">Otevřít Dungeon</a>
      </div>
  `);

  const text = `Měsíční přehled směn – ${monthName} ${year}
Uživatel: ${username}

${warningText}Odpracovaných směn: ${totalShifts}
Celkem hodin: ${totalHours}h
${earningsText}
---
SPiRiT – Bar, Hookah Lounge & Coffee
Školní 605/18, 415 01 Teplice
+420 731 829 346
https://spirit-bar.cz`;

  return { to: email, subject: `Přehled směn – ${monthName} ${year}`, html, text };
}

export function quizAdminNotificationEmail(opts: QuizEmailOpts): EmailMessage {
  const { quizNumber, date, teamName, icon, members, email } = opts;
  const czDate = formatCzechDate(date);

  const membersList = members.map((m) => `<li style="padding:2px 0;">${escapeHtml(m)}</li>`).join("");

  const html = emailLayout(`
      <h1 style="margin:0 0 24px;font-size:28px;text-align:center;color:#fff;">Nová registrace na kvíz</h1>
      <p style="margin:0 0 20px;font-size:16px;color:#ccc;text-align:center;">Na Kvíz #${quizNumber} se zaregistroval nový tým.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#888;width:120px;">Kvíz</td>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#e0e0e0;">#${quizNumber} – ${czDate}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#888;">Tým</td>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#e0e0e0;">${escapeHtml(icon)} ${escapeHtml(teamName)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#888;">Kontakt</td>
          <td style="padding:10px 0;border-bottom:1px solid #1a1f2e;color:#e0e0e0;"><a href="mailto:${escapeHtml(email)}" style="color:#00cfff;text-decoration:none;">${escapeHtml(email)}</a></td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#888;vertical-align:top;">Členové</td>
          <td style="padding:10px 0;color:#e0e0e0;"><ul style="margin:0;padding:0 0 0 18px;">${membersList}</ul></td>
        </tr>
      </table>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://spirit-bar.cz/dungeon#kvizy" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#2635d4,#00cfff);color:#fff;text-decoration:none;border-radius:100px;font-weight:600;font-size:14px;">Otevřít Dungeon</a>
      </div>
  `);

  const membersText = members.map((m, i) => `  ${i + 1}. ${m}`).join("\n");
  const text = `Nová registrace na Kvíz #${quizNumber}

Kvíz: #${quizNumber} – ${czDate}
Tým: ${icon} ${teamName}
Kontakt: ${email}
Členové:
${membersText}

---
SPiRiT – Bar, Hookah Lounge & Coffee
Školní 605/18, 415 01 Teplice
+420 731 829 346
https://spirit-bar.cz`;

  return { to: "kvizy@spirit-bar.cz", subject: `Nová registrace – Kvíz #${quizNumber}: ${icon} ${teamName}`, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
