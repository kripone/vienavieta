// Pieteikšanās ar Telegram (oficiālais Login Widget). Telegram pārvirza lietotāju uz šo
// adresi ar parakstītiem laukiem (id, first_name, username, auth_date, hash). Parakstu
// pārbaudām ar HMAC-SHA256 (atslēga = SHA256(bota tokens)) — viltot to nevar.
// Sesiju izveidojam caur esošo magic-link mehānismu: ieliekam verifikācijas ierakstu
// tādā pašā formātā kā magic-link spraudnis un pāradresējam uz oficiālo verify maršrutu,
// kas pats izveido lietotāju (ja nav), sesiju un sīkdatni.
// Piezīme: konts sasaistās ar esošu e-pasta kontu tikai tad, ja lietotājs iepriekš
// piesaistījis Telegram čatu sadaļā Paziņojumi (Telegram nesniedz e-pastu).
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { telegramEnabled } from "@/lib/telegram";

const { users, verifications } = schema;

/** Telegram Login Widget paraksta pārbaude (https://core.telegram.org/widgets/login). */
function validAuth(q: Record<string, string>, botToken: string): boolean {
  const { hash, ...rest } = q;
  if (!hash || !/^\d+$/.test(rest.id ?? "") || !/^\d+$/.test(rest.auth_date ?? "")) return false;
  if (Math.abs(Date.now() / 1000 - Number(rest.auth_date)) > 86400) return false;
  const check = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");
  const secret = createHash("sha256").update(botToken).digest();
  const h = createHmac("sha256", secret).update(check).digest("hex");
  const a = Buffer.from(h);
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = Object.fromEntries(url.searchParams.entries());
  const next = q.next?.startsWith("/") ? q.next : "/";
  delete q.next; // mūsu parametrs, nevis Telegram — neietilpst parakstā
  // aiz starpniekservera req.url origin ir iekšējā adrese (localhost:10000) — lietojam publisko
  const origin = (process.env.APP_URL || process.env.BETTER_AUTH_URL || url.origin).replace(/\/$/, "");
  const fail = (code: string) => Response.redirect(new URL(`/ielogoties?error=${encodeURIComponent(code)}`, origin), 302);

  if (!telegramEnabled()) return fail("telegram_disabled");
  if (!validAuth(q, process.env.TELEGRAM_BOT_TOKEN!)) return fail("INVALID_TOKEN");

  const tgId = q.id;
  const name = [q.first_name, q.last_name].filter(Boolean).join(" ").trim() || q.username || `Telegram ${tgId}`;

  // ja čats jau piesaistīts kontam (Paziņojumu sadaļā), ielagojamies tajā pašā kontā
  const [user] = await db.select().from(users).where(eq(users.telegramChatId, tgId)).limit(1);
  if (user?.blockedAt) return fail("blocked");
  const email = user?.email ?? `tg-${tgId}@telegram.vienavieta.lv`;

  const token = randomBytes(24).toString("base64url");
  await db.insert(verifications).values({
    identifier: `magic-link:${token}`,
    value: JSON.stringify({ type: "magic-link", email, name }),
    expiresAt: new Date(Date.now() + 15 * 60_000),
  });

  const verify = new URL("/api/auth/magic-link/verify", origin);
  verify.searchParams.set("token", token);
  verify.searchParams.set("callbackURL", next);
  verify.searchParams.set("newUserCallbackURL", "/profils?jauns=1");
  verify.searchParams.set("errorCallbackURL", "/ielogoties");
  return Response.redirect(verify.toString(), 302);
}
