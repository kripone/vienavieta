import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; text: string; html: string };

const smtpConfigured = Boolean(process.env.SMTP_HOST);

const transport = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      connectionTimeout: 10_000,
    })
  : null;

const fromHeader = () => process.env.EMAIL_FROM ?? "VienāVietā <info@vienavieta.lv>";

/** "Vārds <adrese>" → { name, email } */
function parseFrom(from: string) {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].replace(/^"|"$/g, "") || undefined, email: m[2] } : { email: from.trim() };
}

/**
 * Brevo transakciju API caur HTTPS (ports 443). Vajadzīgs, jo Render bezmaksas plānā
 * izejošie SMTP porti (25, 465, 587) ir bloķēti.
 */
async function sendViaBrevo(mail: Mail) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: parseFrom(fromHeader()),
      to: [{ email: mail.to }],
      subject: mail.subject,
      textContent: mail.text,
      htmlContent: mail.html,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Brevo API kļūda ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

/**
 * Nosūta e-pastu: vispirms Brevo API (ja BREVO_API_KEY), citādi SMTP (ja SMTP_HOST).
 * Bez abiem (lokālā izstrāde) vēstule tiek izdrukāta servera konsolē;
 * produkcijā tad sūtīšana neizdodas, lai kļūda nepaliktu nepamanīta.
 */
export async function sendMail(mail: Mail) {
  if (process.env.BREVO_API_KEY) return sendViaBrevo(mail);
  if (!transport) {
    if (process.env.NODE_ENV === "production" && !process.env.ALLOW_CONSOLE_EMAIL) {
      throw new Error("E-pasta sūtīšana nav iestatīta (BREVO_API_KEY vai SMTP_HOST).");
    }
    console.log(`\n[e-pasts] Kam: ${mail.to}\n[e-pasts] Tēma: ${mail.subject}\n${mail.text}\n`);
    return;
  }
  await transport.sendMail({ from: fromHeader(), ...mail });
}

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function magicLinkEmail(url: string): Omit<Mail, "to"> {
  const safe = escapeHtml(url);
  return {
    subject: "Tava pieteikšanās saite VienāVietā",
    text: `Sveiki!\n\nLai pieteiktos VienāVietā, atver šo saiti (derīga 15 minūtes):\n${url}\n\nJa tu nepieprasīji pieteikšanos, vienkārši ignorē šo vēstuli.`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#181b24">
      <p>Sveiki!</p>
      <p>Lai pieteiktos <b>VienāVietā</b>, spied pogu. Saite ir derīga 15 minūtes.</p>
      <p><a href="${safe}" style="display:inline-block;background:#9e3039;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Pieteikties</a></p>
      <p style="color:#5d6475;font-size:13px">Ja poga nestrādā, atver šo saiti: <br>${safe}</p>
      <p style="color:#5d6475;font-size:13px">Ja tu nepieprasīji pieteikšanos, vienkārši ignorē šo vēstuli.</p></div>`,
  };
}
