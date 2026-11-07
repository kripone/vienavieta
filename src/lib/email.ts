import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; text: string; html: string };

const smtpConfigured = Boolean(process.env.SMTP_HOST);

const transport = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

/**
 * Nosūta e-pastu. Ja SMTP nav iestatīts (lokālā izstrāde), vēstule tiek izdrukāta servera konsolē.
 * Produkcijā bez SMTP iestatījumiem sūtīšana neizdodas, lai kļūda nepaliktu nepamanīta.
 */
export async function sendMail(mail: Mail) {
  if (!transport) {
    if (process.env.NODE_ENV === "production" && !process.env.ALLOW_CONSOLE_EMAIL) {
      throw new Error("E-pasta sūtīšana nav iestatīta (SMTP_HOST).");
    }
    console.log(`\n[e-pasts] Kam: ${mail.to}\n[e-pasts] Tēma: ${mail.subject}\n${mail.text}\n`);
    return;
  }
  await transport.sendMail({ from: process.env.EMAIL_FROM ?? "VienāVietā <noreply@vienavieta.lv>", ...mail });
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

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
