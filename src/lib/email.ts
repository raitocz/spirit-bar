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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
