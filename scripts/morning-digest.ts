// Rīta kopsavilkums Telegramā administratoram: cik sludinājumu katrs avots ievācis pēdējās 24h,
// aktīvo skaits, pēdējo crawl kārtu laiki un kļūdas. Palaiž GitHub Actions (sk. .github/workflows/digest.yml).
// Env: DATABASE_URL (ārējā virkne), TELEGRAM_BOT_TOKEN, ADMIN_TG_CHAT (čata id, kam sūtīt).
import { count, sql } from "drizzle-orm";
import { db, schema } from "../src/db";

const { listings, crawlState } = schema;

const SOURCES = ["ss.com", "city24.lv", "autoplius.lt", "zip.lv", "pp.lv"] as const;

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.ADMIN_TG_CHAT;
  if (!token || !chat) throw new Error("Vajag TELEGRAM_BOT_TOKEN un ADMIN_TG_CHAT");

  const since = new Date(Date.now() - 24 * 3600_000);
  const lines: string[] = [];
  let newTotal = 0;

  for (const src of SOURCES) {
    const [fresh] = await db.select({ c: count() }).from(listings).where(sql`${listings.source} = ${src} AND ${listings.createdAt} >= ${since}`);
    const [active] = await db.select({ c: count() }).from(listings).where(sql`${listings.source} = ${src} AND ${listings.status} = 'active'`);
    newTotal += fresh.c;
    lines.push(`• ${src}: <b>+${fresh.c}</b> (aktīvi ${active.c})`);
  }

  // crawl kārtu laiki un kļūdas (autoplius/city24 skrien no lokālā datora — tā uzreiz redzams, vai dzīvi)
  const states = await db.select().from(crawlState).orderBy(crawlState.name);
  const fmt = (d: Date | null) => (d ? d.toISOString().slice(5, 16).replace("T", " ") + "Z" : "—");
  const crawls: string[] = [];
  const problems: string[] = [];
  for (const s of states) {
    const errs = (s.lastResult as { errors?: string[]; errorCount?: number } | null)?.errors?.length ?? 0;
    crawls.push(`• ${s.name}: quick ${fmt(s.lastQuickAt)}, full ${fmt(s.lastFullAt)}${errs ? ` (${errs} kļūdas)` : ""}`);
    const tooOld = (d: Date | null, h: number) => !d || Date.now() - d.getTime() > h * 3600_000;
    // quick kārtai jāskrien biežāk kā reizi 2h; full — reizi 36h
    if (tooOld(s.lastQuickAt, 2) && tooOld(s.lastFullAt, 36)) problems.push(`⚠️ ${s.name}: nekas nav skrējis >2h`);
    else if (errs) problems.push(`⚠️ ${s.name}: pēdējā kārta ar ${errs} kļūdām`);
  }

  const date = new Date().toLocaleDateString("lv-LV", { day: "numeric", month: "long", timeZone: "Europe/Riga" });
  const msg = [
    `🌅 <b>VienāVietā rīts — ${date}</b>`,
    `Jauni pēdējās 24h: <b>${newTotal}</b>`,
    "",
    ...lines,
    "",
    "🕷 Crawl kārtas:",
    ...crawls,
    ...(problems.length ? ["", ...problems] : ["", "✅ Viss kārtās skrien regulāri"]),
  ].join("\n");

  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: msg.slice(0, 4000), parse_mode: "HTML", disable_web_page_preview: true }),
  });
  const d = (await r.json()) as { ok: boolean; description?: string };
  if (!d.ok) throw new Error(`Telegram: ${d.description}`);
  console.log("kopsavilkums nosūtīts:", newTotal, "jauni");
}
main().then(() => process.exit(0), (e) => (console.error(e), process.exit(1)));
