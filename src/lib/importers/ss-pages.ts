// ss.com sarakstu lapu ievākšana (lietotājs 2026-11-07 apstiprināja jurista atzinumu, sk. CLAUDE.md).
// Lasa tikai sadaļu sarakstu tabulas (marka, gads, cena, istabas, platība …) un saiti uz sludinājumu.
// Sludinājumu lapas, bildes un pārdevēju aprakstus neatver un nekopē; virsrakstu veidojam paši (mapItem).
import { and, eq, inArray, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { SS_QUICK_PAGES, SS_REQUEST_DELAY_MS, SS_SECTIONS } from "../constants";
import { linkDuplicate } from "../dedupe";
import { makePlaceFinder, mapItem, type MakeRow, type ModelRow, type PlaceRow, type RssItem } from "./ss-rss";

const { listings, places, regions, makes, models, priceHistory, crawlState } = schema;

export type Section = (typeof SS_SECTIONS)[number];
export type PageRow = { link: string; fields: Record<string, string[]>; thumb?: string };

const USER_AGENT = "VienaVietaBot/1.0 (+https://vienavieta-omew.onrender.com)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
const text = (html: string) => decode(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

/** Izvelk sarakstu tabulu: kolonnu nosaukumi no galvenes un katras rindas vērtības (ar <br> sadalītas daļas). */
export function parseListPage(html: string): { rows: PageRow[]; lastPage: number } {
  const head = html.match(/<tr id="head_line">([\s\S]*?)<\/tr>/)?.[1] ?? "";
  const labels = [...head.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => text(m[1])).slice(1); // 1. = "Sludinājumi … datums"
  const rows: PageRow[] = [];
  for (const m of html.matchAll(/<tr id="tr_(\d+)"[^>]*>([\s\S]*?)<\/tr>/g)) {
    const body = m[2];
    const href = body.match(/<a[^>]*class="am"[^>]*href="([^"]+)"/)?.[1] ?? body.match(/<a[^>]*href="([^"]+)"[^>]*class="am"/)?.[1];
    if (!href || !href.startsWith("/msg/")) continue;
    const cells = [...body.matchAll(/<td class="msga2-[or][^"]*"[^>]*>([\s\S]*?)<\/td>/g)].map((c) =>
      c[1].split(/<br\s*\/?>/i).map(text).filter(Boolean),
    );
    const fields: Record<string, string[]> = {};
    labels.forEach((label, i) => {
      if (label && cells[i]?.length) fields[label] = cells[i];
    });
    // sīktēla adrese (rādām no ss.com servera, neglabājam un nelejupielādējam)
    const thumb = body.match(/<img[^>]*src="(https:\/\/i\.ss\.com\/[^"]+\.th2\.jpg)"/)?.[1];
    rows.push({ link: `https://www.ss.com${href}`, fields, thumb });
  }
  const pages = [...html.matchAll(/class="navi"[^>]*href="[^"]*?page(\d+)\.html"/g), ...html.matchAll(/href="[^"]*?page(\d+)\.html"[^>]*class="navi"/g)].map((x) => Number(x[1]));
  return { rows, lastPage: Math.max(1, ...pages) };
}

const pageUrl = (s: Section, n: number) => (n <= 1 ? s.url : `${s.url}page${n}.html`);

async function defaultFetch(url: string) {
  const r = await fetch(url, { headers: { "user-agent": USER_AGENT, "accept-language": "lv" }, signal: AbortSignal.timeout(30_000), redirect: "follow" });
  if (r.status === 429 || r.status === 503) throw Object.assign(new Error(`HTTP ${r.status}`), { retryAfter: 60_000 });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

type Ctx = { findPlace: ReturnType<typeof makePlaceFinder>; makes: MakeRow[]; models: ModelRow[] };
async function loadCtx(): Promise<Ctx> {
  const [placeRows, makeRows, modelRows] = await Promise.all([
    db.select({ id: places.id, name: places.name, lat: places.lat, lon: places.lon, region: regions.name })
      .from(places).innerJoin(regions, eq(places.regionId, regions.id)).where(eq(regions.country, "LV")),
    db.select({ id: makes.id, name: makes.name, vehicleClass: makes.vehicleClass }).from(makes),
    db.select({ id: models.id, makeId: models.makeId, name: models.name }).from(models),
  ]);
  return { findPlace: makePlaceFinder(placeRows as PlaceRow[]), makes: makeRows as MakeRow[], models: modelRows };
}

export type CrawlResult = { section: string; mode: "quick" | "full"; pages: number; rows: number; created: number; updated: number; priceChanged: number; duplicates: number; removed: number; errors: string[]; ms: number };

/** Saglabā vienas lapas rindas: jaunos ievieto, esošajiem atjauno cenu un "redzēts" laiku. */
async function saveRows(section: Section, pageRows: PageRow[], ctx: Ctx, res: CrawlResult) {
  const now = new Date();
  const mapped = pageRows
    .map((r) => {
      const m = mapItem(section, { link: r.link, pubDate: now, fields: r.fields } as RssItem, ctx);
      return m ? { ...m, externalThumbUrl: r.thumb ?? null } : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const byId = new Map(mapped.map((m) => [m.externalId!, m]));
  if (!byId.size) return;
  const existing = await db
    .select({ id: listings.id, externalId: listings.externalId, price: listings.price, status: listings.status, thumb: listings.externalThumbUrl })
    .from(listings)
    .where(and(eq(listings.source, "ss.com"), inArray(listings.externalId, [...byId.keys()])));
  const seen = new Set<string>();
  const touch: string[] = [];
  for (const e of existing) {
    seen.add(e.externalId!);
    const row = byId.get(e.externalId!)!;
    if (e.status === "hidden") continue; // paslēpis moderators: neaiztiekam
    if (e.price !== row.price || e.status === "deleted" || e.thumb !== row.externalThumbUrl) {
      await db.update(listings).set({ price: row.price, status: "active", externalThumbUrl: row.externalThumbUrl, updatedAt: now }).where(eq(listings.id, e.id));
      if (e.price !== row.price) {
        await db.insert(priceHistory).values({ listingId: e.id, price: row.price });
        res.priceChanged++;
      }
    } else touch.push(e.id);
    res.updated++;
  }
  if (touch.length) await db.update(listings).set({ updatedAt: now }).where(inArray(listings.id, touch));
  const fresh = [...byId.values()].filter((r) => !seen.has(r.externalId!));
  if (fresh.length) {
    const ins = await db.insert(listings).values(fresh).onConflictDoNothing().returning({ id: listings.id, price: listings.price });
    if (ins.length) await db.insert(priceHistory).values(ins.map((i) => ({ listingId: i.id, price: i.price })));
    res.created += ins.length;
    for (const i of ins) if (await linkDuplicate(i.id).catch(() => null)) res.duplicates++;
  }
}

/**
 * Viena sadaļa. "quick": pirmās SS_QUICK_PAGES lapas (jaunie, paceltie, cenu maiņas).
 * "full": visas lapas; beigās sludinājumi, kas šajā kārtā netika redzēti, tiek atzīmēti kā izdzēsti avotā.
 */
export async function crawlSection(section: Section, mode: "quick" | "full", fetchHtml: (url: string) => Promise<string> = defaultFetch, delayMs = SS_REQUEST_DELAY_MS): Promise<CrawlResult> {
  const started = new Date();
  const res: CrawlResult = { section: section.key, mode, pages: 0, rows: 0, created: 0, updated: 0, priceChanged: 0, duplicates: 0, removed: 0, errors: [], ms: 0 };
  const ctx = await loadCtx();
  let last = mode === "quick" ? SS_QUICK_PAGES : Infinity;
  let failsInRow = 0;
  for (let n = 1; n <= last; n++) {
    try {
      const html = await fetchHtml(pageUrl(section, n));
      const { rows, lastPage } = parseListPage(html);
      // kopējo lapu skaitu rāda tikai 1. lapa (saite "atpakaļ" uz pēdējo); tālākajās redzams tikai ~10 lapu logs
      if (n === 1) last = Math.min(last, lastPage);
      res.pages++;
      res.rows += rows.length;
      await saveRows(section, rows, ctx, res);
      failsInRow = 0;
      if (!rows.length) break;
    } catch (err) {
      const e = err as Error & { retryAfter?: number };
      res.errors.push(`lapa ${n}: ${e.message}`);
      if (++failsInRow >= 5) break;
      if (e.retryAfter) await sleep(e.retryAfter);
      if (last === Infinity) last = n + 1; // nezinām lapu skaitu: mēģinām nākamo
    }
    if (n < last) await sleep(delayMs);
  }

  if (mode === "full") {
    // pa kārtas laiku pacelti sludinājumi pārlec uz 1. lapu: vēlreiz izejam pirmās lapas, tad dzēšam neredzētos
    const quick = await crawlSection(section, "quick", fetchHtml, delayMs);
    res.created += quick.created;
    res.updated += quick.updated;
    // dzēšam neredzētos tikai, ja tiešām izietas gandrīz visas lapas un kļūdu maz
    const complete = Number.isFinite(last) && res.pages >= last * 0.95 && res.errors.length <= Math.max(2, res.pages * 0.02);
    if (complete && Number.isFinite(last)) {
      const sameCategory =
        section.kind === "vehicle" ? eq(listings.vehicleClass, section.vehicleClass) : eq(listings.propertyType, section.propertyType);
      const gone = await db
        .update(listings)
        .set({ status: "deleted" })
        .where(and(eq(listings.source, "ss.com"), eq(listings.kind, section.kind), sameCategory, eq(listings.status, "active"), lt(listings.updatedAt, started)))
        .returning({ id: listings.id });
      res.removed = gone.length;
    }
  }
  res.ms = Date.now() - started.getTime();

  const set = mode === "full" ? { lastFullAt: started, lastResult: res as unknown as Record<string, unknown> } : { lastQuickAt: started };
  await db.insert(crawlState).values({ name: section.key, ...set }).onConflictDoUpdate({ target: crawlState.name, set });
  return res;
}
