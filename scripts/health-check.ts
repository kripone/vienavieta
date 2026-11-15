// Sistēmas veselības pārbaude un pašdziedināšana (lokāli, ik 30 min caur Kimi Work uzdevumu). Bez AI kredītiem.
// 1) Crawl plūsmas: vai kāda nav nokavējusi (quick >3h vai full >48h); lokālās palaiž uzreiz.
// 2) Vietne: https://vienavieta.lv un /api/health atbild 200.
// 3) Render: pēdējā izvietošana 'live'; serveris nav crash-loopā (restarti pēdējās 2h).
// 4) Detaļu nolasīšana: ja segums <90%, tad detail_checked_at jāatsvaidzina pēdējās 6h.
// 5) Lielajiem avotiem (ss.com, autoplius.lt) jābūt jauniem sludinājumiem pēdējās 24h.
// Telegramā sūta TIKAI jaunās problēmas (stāvokli glabā crawl_state 'health:alerts') + ziņu, kad viss atrisināts.
// Env: DATABASE_URL (ārējā virkne), TELEGRAM_BOT_TOKEN, ADMIN_TG_CHAT, RENDER_API_KEY (neobligāta — bez tās 3. punkts izlaists).
import { eq, like } from "drizzle-orm";
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
  ["veho:", null],
  ["moller:", null],
  ["toyota:", null],
  ["lexus:", null],
  ["wess:", null],
];

const QUICK_MAX_H = 3;
const FULL_MAX_H = 48;
const RENDER_OWNER = "tea-dbn7oquc6qcc73cthhvg";
const RENDER_SERVICE = "srv-dbnf0srrjlhs738kmbtg";

async function sendTG(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.ADMIN_TG_CHAT;
  if (!token || !chat) return console.warn("Telegram nav iestatīts, ziņa:", text.slice(0, 200));
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  console.log("telegram:", ((await r.json()) as { ok?: boolean }).ok ? "nosūtīts" : "kļūda");
}

async function main() {
  const issues = new Map<string, string>(); // atslēga → cilvēkam lasāms apraksts
  const now = Date.now();

  // ── 1) crawl plūsmas + pašdziedināšana ─────────────────────────────
  let states = await db.select().from(crawlState).where(like(crawlState.name, "%:%"));
  const staleOf = (rows: typeof states) => {
    const out: string[] = [];
    for (const [prefix] of FLOWS) {
      const stale = rows.filter((s) => s.name.startsWith(prefix)).filter((s) => {
        const qOk = s.lastQuickAt && now - s.lastQuickAt.getTime() < QUICK_MAX_H * 3600_000;
        const fOk = s.lastFullAt && now - s.lastFullAt.getTime() < FULL_MAX_H * 3600_000;
        return !qOk || !fOk;
      });
      if (stale.length) out.push(prefix);
    }
    return out;
  };

  let stale = staleOf(states);
  if (stale.length) {
    console.log("⚠️ nokavējušas:", stale.join(", "));
    for (const prefix of stale) {
      const script = FLOWS.find(([p]) => p === prefix)?.[1];
      if (!script) continue;
      console.log(`🔧 palaižu ${script} ...`);
      try {
        const { stdout } = await run("npx", ["tsx", script], { env: process.env, cwd: process.cwd(), timeout: 45 * 60_000, maxBuffer: 1024 * 1024 });
        console.log(stdout.trim().split("\n").slice(-2).join("\n"));
      } catch (e) {
        console.error(`${script} neizdevās:`, e instanceof Error ? e.message.slice(0, 300) : e);
      }
    }
    states = await db.select().from(crawlState).where(like(crawlState.name, "%:%"));
    stale = staleOf(states);
    if (!stale.length) console.log("✅ plūsmas salabotas");
  }
  if (stale.length) {
    const names = states.filter((s) => stale.some((p) => s.name.startsWith(p))).map((s) => s.name);
    issues.set("crawlers", `šīs plūsmas nestrādā >${QUICK_MAX_H}h un neizdevās salabot:\n${names.map((n) => `• ${n}`).join("\n")}`);
  }

  // ── 2) vietne atbild ────────────────────────────────────────────────
  for (const [key, url] of [["site", "https://vienavieta.lv/"], ["api", "https://vienavieta.lv/api/health"]] as const) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (r.status !== 200) issues.set(key, `${url} atbild ar ${r.status}`);
    } catch (e) {
      issues.set(key, `${url} nav sasniedzama (${e instanceof Error ? e.message.slice(0, 80) : e})`);
    }
  }

  // ── 3) Render: izvietošana un restarti ─────────────────────────────
  const rkey = process.env.RENDER_API_KEY;
  if (rkey) {
    try {
      const dep = await fetch(`https://api.render.com/v1/services/${RENDER_SERVICE}/deploys?limit=1`, { headers: { Authorization: `Bearer ${rkey}` } });
      const [d] = (await dep.json()) as { deploy?: { status?: string } }[];
      const st = d?.deploy?.status ?? "?";
      if (st !== "live") issues.set("render-deploy", `pēdējā izvietošana statusā "${st}" (vajag "live")`);
    } catch (e) {
      console.warn("render deploys:", e instanceof Error ? e.message.slice(0, 100) : e);
    }
    try {
      const since = new Date(now - 2 * 3600_000).toISOString();
      const lg = await fetch(`https://api.render.com/v1/logs?ownerId=${RENDER_OWNER}&resource=${RENDER_SERVICE}&limit=400&startTime=${since}`, { headers: { Authorization: `Bearer ${rkey}` } });
      const logs = ((await lg.json()) as { logs?: { message?: string }[] }).logs ?? [];
      const restarts = logs.filter((l) => (l.message ?? "").includes("ss.com ievākšana: ieslēgta")).length;
      if (restarts > 2) issues.set("render-restarts", `serveris restartējies ${restarts}x pēdējās 2h (iespējams OOM — pēdējo reizi tā bija Playwright atmiņas pārtērēšana)`);
    } catch (e) {
      console.warn("render logs:", e instanceof Error ? e.message.slice(0, 100) : e);
    }
  }

  // ── 4) detaļu nolasīšanas temps ────────────────────────────────────
  const det = await db.execute<{ source: string; total: string; done: string; last: Date | null }>(`
    select source, count(*) as total,
      count(*) filter (where detail_checked_at is not null) as done,
      max(detail_checked_at) as last
    from listings where source in ('autoplius.lt','city24.lv') and status='active' group by source`);
  for (const row of det.rows) {
    const total = Number(row.total), done = Number(row.done);
    if (!total) continue;
    const staleDetail = !row.last || now - new Date(row.last).getTime() > 6 * 3600_000;
    if (done / total < 0.9 && staleDetail) {
      issues.set(`details-${row.source}`, `detaļu nolasīšana apstājusies: ${done}/${total} (${Math.round((done / total) * 100)}%), pēdējoreiz pirms >6h (vai Mac ir ieslēgts?)`);
    }
  }

  // ── 5) lielie avoti bez jauniem sludinājumiem 24h ──────────────────
  const fresh = await db.execute<{ source: string; n: string }>(`
    select source, count(*) as n from listings
    where source in ('ss.com','autoplius.lt') and created_at > now() - interval '24 hours' group by source`);
  for (const src of ["ss.com", "autoplius.lt"]) {
    if (!fresh.rows.some((r) => r.source === src)) issues.set(`quiet-${src}`, `${src} pēdējās 24h nav neviens jauns sludinājums`);
  }

  // ── Telegram: tikai JAUNAS problēmas + atlabušo ziņa ───────────────
  const [marker] = await db.select().from(crawlState).where(eq(crawlState.name, "health:alerts"));
  const prev = new Set(((marker?.lastResult as { keys?: string[] } | null)?.keys ?? []) as string[]);
  const cur = new Set(issues.keys());
  const newOnes = [...cur].filter((k) => !prev.has(k));
  const resolved = [...prev].filter((k) => !cur.has(k));

  if (newOnes.length) {
    await sendTG(`⚠️ <b>VienāVietā veselības pārbaude</b>\n${newOnes.map((k) => `• ${issues.get(k)}`).join("\n")}`);
  } else if (resolved.length && prev.size && !cur.size) {
    await sendTG("✅ VienāVietā: visas veselības problēmas atrisinātas.");
  }
  if (cur.size) console.log("aktīvās problēmas:", [...cur].join(", "));
  else console.log("✅ viss vesels");

  await db
    .insert(crawlState)
    .values({ name: "health:alerts", lastQuickAt: new Date(), lastResult: { keys: [...cur] } })
    .onConflictDoUpdate({ target: crawlState.name, set: { lastQuickAt: new Date(), lastResult: { keys: [...cur] } } });
}
main().then(() => process.exit(0), (e) => (console.error(e), process.exit(1)));
