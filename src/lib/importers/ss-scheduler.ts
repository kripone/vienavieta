// Fona plānotājs ss.com ievākšanai portāla servera procesā (Render Starter neaizmieg).
// Ātrā kārta ik SS_QUICK_EVERY_MIN minūtes katrai sadaļai, pilnā kārta reizi SS_FULL_EVERY_HOURS stundās.
// Stāvoklis glabājas tabulā crawl_state, tāpēc pēc pārstartēšanas pilnā kārta neatkārtojas lieki.
import { db, schema } from "@/db";
import { SS_FULL_EVERY_HOURS, SS_QUICK_EVERY_MIN, SS_SECTIONS } from "../constants";
import { ensureDailySnapshot } from "../market";
import { crawlSection } from "./ss-pages";

const g = globalThis as unknown as { ssCrawlerStarted?: boolean };

export function ssCrawlerEnabled() {
  const v = process.env.SS_CRAWL;
  return v === "on" || (process.env.NODE_ENV === "production" && v !== "off");
}

async function tick() {
  // tirgus momentuzņēmums reizi dienā (pēc 3:00 UTC, kad nakts pilnās kārtas parasti beigušās)
  if (new Date().getUTCHours() >= 3) {
    const snap = await ensureDailySnapshot().catch((e) => console.error("Tirgus momentuzņēmums neizdevās:", e));
    if (snap) console.log("Tirgus momentuzņēmums:", JSON.stringify(snap));
  }
  const state = new Map((await db.select().from(schema.crawlState)).map((s) => [s.name, s]));
  const now = Date.now();
  for (const section of SS_SECTIONS) {
    const st = state.get(section.key);
    const fullDue = !st?.lastFullAt || now - st.lastFullAt.getTime() > SS_FULL_EVERY_HOURS * 3600_000;
    const quickDue = !st?.lastQuickAt || now - st.lastQuickAt.getTime() > SS_QUICK_EVERY_MIN * 60_000;
    if (!fullDue && !quickDue) continue;
    const r = await crawlSection(section, fullDue ? "full" : "quick");
    const { errors, ...rest } = r;
    console.log(`ss.com ${r.mode} ${section.key}:`, JSON.stringify({ ...rest, errors: errors.slice(0, 3), errorCount: errors.length }));
    // pēc katras pilnās kārtas atgriežamies sākumā, lai pārējo sadaļu ātrās kārtas nenokavētu
    if (fullDue) return;
  }
}

export function startSsCrawler() {
  if (g.ssCrawlerStarted || !ssCrawlerEnabled() || !process.env.DATABASE_URL) return;
  g.ssCrawlerStarted = true;
  console.log("ss.com ievākšana: ieslēgta");
  (async () => {
    await new Promise((r) => setTimeout(r, 30_000)); // ļaujam serverim iesilt
    for (;;) {
      try {
        await tick();
      } catch (err) {
        console.error("ss.com ievākšana neizdevās:", err instanceof Error ? err.message : err);
      }
      await new Promise((r) => setTimeout(r, 60_000));
    }
  })();
}
