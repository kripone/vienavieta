// Fona plānotājs ss.com ievākšanai portāla servera procesā (Render Starter neaizmieg).
// Ātrā kārta ik SS_QUICK_EVERY_MIN minūtes katrai sadaļai, pilnā kārta reizi SS_FULL_EVERY_HOURS stundās.
// Stāvoklis glabājas tabulā crawl_state, tāpēc pēc pārstartēšanas pilnā kārta neatkārtojas lieki.
import { db, schema } from "@/db";
import { SS_FULL_EVERY_HOURS, SS_QUICK_EVERY_MIN, SS_SECTIONS } from "../constants";
import { geocodePending, geocodingEnabled } from "../geocode";
import { ensureDailySnapshot } from "../market";
import { autopliusEnabled, tickAutoplius } from "./autoplius-pages";
import { backfillBodies, backfillHouseTail, backfillMakeModel, ensureMotoModels, forceModelRecrawl, forcePlacesRecrawl } from "./backfill";
import { crawlSection } from "./ss-pages";
import { detailsEnabled, fillVehicleCities } from "./ss-details";
import { importVzdIfChanged } from "./vzd";
import { runDueFeed } from "./dealer-feed";

const g = globalThis as unknown as { ssCrawlerStarted?: boolean };

export function ssCrawlerEnabled() {
  const v = process.env.SS_CRAWL;
  return v === "on" || (process.env.NODE_ENV === "production" && v !== "off");
}

async function tick() {
  const mm = await backfillMakeModel().catch((e) => (console.error("Marku/modeļu pārrēķins neizdevās:", e), null));
  if (mm) console.log("Marku/modeļu pārrēķins:", JSON.stringify(mm));
  await backfillHouseTail().catch((e) => console.error("VZD īsās adreses:", e));
  const mo = await ensureMotoModels().catch((e) => (console.error("Moto modeļi:", e), null));
  if (mo) console.log("Moto modeļi:", JSON.stringify(mo));
  if (await forceModelRecrawl().catch(() => false)) console.log("Auto/moto pilnā kārta sākta no jauna modeļu atpazīšanai");
  if (await forcePlacesRecrawl().catch(() => false)) console.log("Īpašumu pilnā kārta sākta no jauna vietu precizēšanai");
  const bf = await backfillBodies().catch((e) => (console.error("Virsbūvju pārrēķins neizdevās:", e), null));
  if (bf) console.log("Virsbūvju pārrēķins:", JSON.stringify(bf));
  // tirgus momentuzņēmums reizi dienā (pēc 3:00 UTC, kad nakts pilnās kārtas parasti beigušās)
  if (new Date().getUTCHours() >= 3) {
    const snap = await ensureDailySnapshot().catch((e) => console.error("Tirgus momentuzņēmums neizdevās:", e));
    if (snap) console.log("Tirgus momentuzņēmums:", JSON.stringify(snap));
  }
  // īpašumu adreses → precīza vieta kartē (līdz 40 adresēm minūtē; katra tikai vienreiz)
  if (geocodingEnabled()) {
    const g = await geocodePending(40).catch((e) => (console.error("Ģeokodēšana:", e), null));
    if (g && (g.done || g.errors)) console.log("Ģeokodēšana:", JSON.stringify(g));
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
  // salonu plūsmas: pa vienai, katra reizi DEALER_FEED.EVERY_HOURS stundās
  (async () => {
    await new Promise((r) => setTimeout(r, 120_000));
    for (;;) {
      const r = await runDueFeed().catch((e) => (console.error("Salonu plūsmas:", e instanceof Error ? e.message : e), null));
      if (r) console.log("Salona plūsma:", JSON.stringify({ ...r, errors: r.errors.slice(0, 3) }));
      await new Promise((res) => setTimeout(res, r ? 10_000 : 300_000));
    }
  })();
  // VZD darījumu atvērtie dati: pārbauda reizi 12 h, ielādē, ja datu kopa mainījusies (reizi mēnesī)
  if (process.env.VZD_IMPORT !== "off") {
    (async () => {
      await new Promise((r) => setTimeout(r, 180_000));
      for (;;) {
        try {
          const r = await importVzdIfChanged();
          if (r) console.log("VZD darījumi:", JSON.stringify(r));
        } catch (e) {
          console.error("VZD darījumi:", e instanceof Error ? e.message : e);
        }
        await new Promise((res) => setTimeout(res, 3600_000));
      }
    })();
  }
  // atsevišķa cilpa: transporta sludinājumu pilsētas no sludinājuma lapām (lēni, katra lapa vienreiz)
  if (detailsEnabled()) {
    (async () => {
      await new Promise((r) => setTimeout(r, 90_000));
      for (;;) {
        const r = await fillVehicleCities().catch((e) => (console.error("ss.com pilsētas:", e instanceof Error ? e.message : e), null));
        if (r && (r.found || r.errors)) console.log("ss.com pilsētas:", JSON.stringify(r));
        await new Promise((res) => setTimeout(res, r ? 15_000 : 600_000));
      }
    })();
  }
  // autoplius.lt vieglie auto: ātrā kārta ik AUTOPLIUS.quickEveryMin, pilnā reizi diennaktī (Playwright pārlūks)
  if (autopliusEnabled()) {
    (async () => {
      await new Promise((r) => setTimeout(r, 150_000));
      for (;;) {
        const r = await tickAutoplius().catch((e) => (console.error("autoplius.lt ievākšana:", e instanceof Error ? e.message : e), null));
        if (r) console.log(`autoplius.lt ${r.mode}:`, JSON.stringify({ ...r, errors: r.errors.slice(0, 3), errorCount: r.errors.length }));
        await new Promise((res) => setTimeout(res, 60_000));
      }
    })();
  }
}
