// Web Push paziņojumi (VAPID). Atslēgas: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (npx web-push generate-vapid-keys),
// VAPID_SUBJECT (piem. mailto:info@vienavieta.lv). Bez atslēgām push ir izslēgts, e-pasti strādā kā līdz šim.
import { eq, inArray } from "drizzle-orm";
import webpush from "web-push";
import { db, schema } from "@/db";
import { LOCALES, type Locale } from "@/i18n/core";

const { pushSubscriptions } = schema;

export const pushPublicKey = () => process.env.VAPID_PUBLIC_KEY || "";
export const pushEnabled = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:info@vienavieta.lv", process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  configured = true;
}

/** Pieņemam tikai zināmo pārlūku push serveru adreses (citādi serveris sūtītu pieprasījumus uz jebkuru adresi). */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /(^|\.)push\.apple\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/, /(^|\.)push\.services\.mozilla\.com$/];
export function validEndpoint(endpoint: string) {
  try {
    const u = new URL(endpoint);
    return u.protocol === "https:" && !u.port && !u.username && PUSH_HOSTS.some((re) => re.test(u.hostname)) && endpoint.length < 1000;
  } catch {
    return false;
  }
}

export const asLocale = (s: string | null | undefined): Locale => ((LOCALES as readonly string[]).includes(String(s)) ? (s as Locale) : "lv");

export type PushMessage = { title: string; body: string; url: string; tag?: string };

/**
 * Nosūta paziņojumu visām lietotāja ierīcēm. Teksts tiek veidots katras ierīces valodā.
 * Atgriež nosūtīto skaitu; nederīgos abonementus (404/410) izdzēš.
 */
export async function pushToUser(userId: string, make: (locale: Locale) => PushMessage): Promise<number> {
  if (!pushEnabled()) return 0;
  configure();
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  let sent = 0;
  const gone: string[] = [];
  const ok: string[] = [];
  for (const s of subs) {
    const msg = make(asLocale(s.locale));
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(msg),
        { TTL: 24 * 3600, urgency: "normal", topic: msg.tag?.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || undefined },
      );
      sent++;
      ok.push(s.id);
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) gone.push(s.id);
      else console.error("Push neizdevās:", code ?? (err instanceof Error ? err.message : err));
    }
  }
  if (gone.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, gone));
  if (ok.length) await db.update(pushSubscriptions).set({ lastSentAt: new Date() }).where(inArray(pushSubscriptions.id, ok));
  return sent;
}

export async function userHasPush(userId: string) {
  const [r] = await db.select({ id: pushSubscriptions.id }).from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)).limit(1);
  return Boolean(r);
}
