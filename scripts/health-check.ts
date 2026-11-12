// Crawleru veselības pārbaude un pašdziedināšana (lokāli, ik stundu caur Kimi Work uzdevumu).
// 1) Pārbauda, vai kāda aktīvā crawl plūsma nav nokavējusi (quick >3h un full >40h).
// 2) Lokālajām plūsmām (autoplius, city24 — skrien tikai no šī datora) uzreiz palaiž kārtu.
// 3) Ja pēc labojuma problēmas paliek (vai vainīga ir servera plūsma), sūta brīdinājumu
//    administratoram Telegramā. Ja viss vesels — klusē (rīta kopsavilkums stāsta pārējo).
// Env: DATABASE_URL (ārējā virkne), TELEGRAM_BOT_TOKEN, ADMIN_TG_CHAT.
import { like } from "drizzle-orm";
import { db, schema } from "../src/db";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const { crawlState } = schema;

// [crawl_state prefikss, lokālais labojamskripts (null = servera plūsma, no šejienes nelabojama)]
const FLOWS: [string, string | null][] = [
  ["autoplius:", "scripts/autoplius-crawl.ts"],
  ["city24:", "scripts/city24-crawl.ts"],
  ["porsche:", "scripts/porsche-crawl.ts"],
  ["ss2:", null],
  ["zip:", null],
  ["pp:", null],
  ["bravo:", null],
];

const QUICK_MAX_H = 3;
const FULL_MAX_H = 48;

async function main() {
  const states = await db.select().from(crawlState).where(like(schema.crawlState.name, "%:%"));
  const now = Date.now();
  const staleOf = () => {
    const out: string[] = [];
    for (const [prefix] of FLOWS) {
      const rows = states.filter((s) => s.name.startsWith(prefix));
      const stale = rows.filter((s) => {
        // ātrajai kārtai jāskrien regulāri (visām plūsmām ≤1h cikls), pilnajai — vismaz reizi divās dienās
        const qOk = s.lastQuickAt && now - s.lastQuickAt.getTime() < QUICK_MAX_H * 3600_000;
        const fOk = s.lastFullAt && now - s.lastFullAt.getTime() < FULL_MAX_H * 3600_000;
        return !qOk || !fOk;
      });
      if (stale.length) out.push(prefix);
    }
    return out;
  };

  let stale = staleOf();
  if (!stale.length) {
    console.log("✅ visas plūsmas svaigas");
    return;
  }
  console.log("⚠️ nokavējušas:", stale.join(", "));

  // pašdziedināšana: lokālās plūsmas palaižam uzreiz
  for (const prefix of stale) {
    const script = FLOWS.find(([p]) => p === prefix)?.[1];
    if (!script) continue;
    console.log(`🔧 palaižu ${script} ...`);
    try {
      const { stdout } = await run("npx", ["tsx", script], { env: process.env, cwd: process.cwd(), timeout: 20 * 60_000, maxBuffer: 1024 * 1024 });
      console.log(stdout.trim().split("\n").slice(-2).join("\n"));
    } catch (e) {
      console.error(`${script} neizdevās:`, e instanceof Error ? e.message.slice(0, 300) : e);
    }
  }

  // pēc labojuma pārbaudām vēlreiz
  const states2 = await db.select().from(crawlState).where(like(schema.crawlState.name, "%:%"));
  states.splice(0, states.length, ...states2);
  stale = staleOf();
  if (!stale.length) {
    console.log("✅ viss salabots, plūsmas atjaunotas");
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.ADMIN_TG_CHAT;
  if (!token || !chat) {
    console.warn("joprojām nokavēts:", stale.join(", "), "(Telegram nav iestatīts)");
    return;
  }
  const names = states.filter((s) => stale.some((p) => s.name.startsWith(p))).map((s) => s.name);
  const msg = `⚠️ <b>VienāVietā crawleri apstājušies</b>\nŠīs plūsmas nav skrējušas >${QUICK_MAX_H}h un tās neizdevās salabot automātiski:\n${names.map((n) => `• ${n}`).join("\n")}\n\nPārbaudi serveri / lokālo datoru.`;
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: msg, parse_mode: "HTML" }),
  });
  console.log("brīdinājums nosūtīts:", (await r.json()) as object);
}
main().then(() => process.exit(0), (e) => (console.error(e), process.exit(1)));
