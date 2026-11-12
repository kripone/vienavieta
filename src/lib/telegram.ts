// Telegram paziņojumi: bota API (bez atkarībām — tīrs HTTPS), piesaistes saišu ģenerēšana
// un bota atjauninājumu apstrāde. Piesaiste: lietotājs Paziņojumu lapā dabū saiti
// https://t.me/<bots>?start=<vienreizējs kods>, atver to Telegram un spiež Start — bots
// nosūta /start <kods>, mēs pēc koda atrodam lietotāju un saglabājam viņa chat_id.
// Vajadzīgie env: TELEGRAM_BOT_TOKEN (no @BotFather), TELEGRAM_BOT_USERNAME (bez @),
// TELEGRAM_WEBHOOK_SECRET (jebkāda garlaicīga virkne; webhook reģistrē scripts/telegram-setup.ts).
import { randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "@/db";

const { users } = schema;

export function telegramEnabled() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME);
}

const api = (method: string) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

/** Nosūta ziņu čatam (HTML režīms; saitēm Telegram pats parāda priekšskatījumu). */
export async function sendTelegram(chatId: string | number, html: string): Promise<void> {
  const r = await fetch(api("sendMessage"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: "HTML", disable_web_page_preview: false }),
    signal: AbortSignal.timeout(15_000),
  });
  const d = (await r.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!r.ok || !d?.ok) throw new Error(`Telegram API: ${d?.description ?? `HTTP ${r.status}`}`);
}

/** Dziļā saite, ko lietotājs atver Telegram lietotnē. */
export function telegramLinkUrl(token: string) {
  return `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(token)}`;
}

/** Izveido lietotājam vienreizēju piesaistes kodu (derīgs 10 min) un atgriež t.me saiti. */
export async function createLinkToken(userId: string): Promise<string> {
  const token = randomBytes(16).toString("base64url");
  await db
    .update(users)
    .set({ telegramLinkToken: token, telegramLinkExpires: new Date(Date.now() + 10 * 60_000) })
    .where(eq(users.id, userId));
  return telegramLinkUrl(token);
}

/** Webhook paraksta pārbaude (Telegram sūta X-Telegram-Bot-Api-Secret-Token galveni). */
export function validWebhookSecret(header: string | null): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true; // nav iestatīts: nepārbaudām (izstrādes režīms)
  if (!header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

type TgUser = { id?: number; username?: string; first_name?: string };
type TgUpdate = { message?: { text?: string; chat?: { id?: number }; from?: TgUser } };

const appUrl = () => (process.env.APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");

/** Bota ziņas apstrāde: /start <kods> piesaista čatu, /stop atvieno. */
export async function handleUpdate(u: TgUpdate): Promise<void> {
  const text = u.message?.text?.trim() ?? "";
  const chatId = u.message?.chat?.id;
  if (!chatId) return;

  if (text === "/stop") {
    await db.update(users).set({ telegramChatId: null, telegramUsername: null }).where(eq(users.telegramChatId, String(chatId)));
    await sendTelegram(chatId, "Paziņojumi izslēgti. Pieslēgt atkal vari vietnes sadaļā Paziņojumi.").catch(() => {});
    return;
  }
  const m = text.match(/^\/start(?:\s+(\S+))?/);
  if (!m) {
    await sendTelegram(chatId, `Sveiki! Esmu VienāVietā paziņojumu bots. Piesaisti savu kontu vietnē: ${appUrl()}/pazinojumi`).catch(() => {});
    return;
  }
  const token = m[1];
  if (!token) {
    await sendTelegram(chatId, `Lai piesaistītu paziņojumus, atver saiti no vietnes: ${appUrl()}/pazinojumi`).catch(() => {});
    return;
  }
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.telegramLinkToken, token), gt(users.telegramLinkExpires, new Date())))
    .limit(1);
  if (!user) {
    await sendTelegram(chatId, "Saite ir novecojusi. Ģenerē jaunu vietnes sadaļā Paziņojumi un mēģini vēlreiz.").catch(() => {});
    return;
  }
  await db
    .update(users)
    .set({
      telegramChatId: String(chatId),
      telegramUsername: u.message?.from?.username ?? null,
      telegramLinkToken: null,
      telegramLinkExpires: null,
    })
    .where(eq(users.id, user.id));
  // piesaistot ieslēdzam Telegram visām viņa saglabātajām meklēšanām (katru var izslēgt atsevišķi)
  await db.update(schema.savedSearches).set({ notifyTelegram: true }).where(eq(schema.savedSearches.userId, user.id));
  await sendTelegram(chatId, `✅ Paziņojumi pieslēgti! Jaunus sludinājumus no saglabātajām meklēšanām sūtīšu šeit. Iestatījumi: ${appUrl()}/pazinojumi`).catch(() => {});
}
