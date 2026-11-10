// ss.com sarakstu lapu ievākšana (lietotājs 2026-11-07 apstiprināja jurista atzinumu, sk. CLAUDE.md).
// Lasa tikai sadaļu sarakstu tabulas (marka, gads, cena, istabas, platība …) un saiti uz sludinājumu.
// Sludinājumu lapas, bildes un pārdevēju aprakstus neatver un nekopē; virsrakstu veidojam paši (mapItem).
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { SS_QUICK_PAGES, SS_REQUEST_DELAY_MS, SS_SECTIONS } from "../constants";
import { linkDuplicate } from "../dedupe";
import { makeCityFinder, makePlaceFinder, mapItem, slug, type MakeRow, type ModelRow, type PlaceRow, type RssItem } from "./ss-rss";

const { listings, places, regions, makes, models, priceHistory, crawlState } = schema;

export type Section = (typeof SS_SECTIONS)[number];
export type PageRow = { link: string; fields: Record<string, string[]>; thumb?: string; snippet?: string; region?: string };

const USER_AGENT = "VienaVietaBot/1.0 (+https://vienavieta.lv)";
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
    // sludinājuma teksta sākums: tikai modeļa atpazīšanai, ja ss.com modelis ir "Citi" (neglabājam, nerādām)
    const snippet = text(body.match(/<a[^>]*class="am"[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? "");
    // pilsēta/rajons zem sludinājuma (motocikliem ir; vieglajiem auto ss.com sarakstā nav)
    const region = text(body.match(/<div class="ads_region">([\s\S]*?)<\/div>/)?.[1] ?? "") || undefined;
    rows.push({ link: `https://www.ss.com${href}`, fields, thumb, snippet, region });
  }
  const pages = [...html.matchAll(/class="navi"[^>]*href="[^"]*?page(\d+)\.html"/g), ...html.matchAll(/href="[^"]*?page(\d+)\.html"[^>]*class="navi"/g)].map((x) => Number(x[1]));
  return { rows, lastPage: Math.max(1, ...pages) };
}

const pageUrl = (base: string, n: number) => (n <= 1 ? base : `${base}page${n}.html`);

export async function defaultFetch(url: string) {
  const r = await fetch(url, { headers: { "user-agent": USER_AGENT, "accept-language": "lv" }, signal: AbortSignal.timeout(30_000), redirect: "follow" });
  if (r.status === 429 || r.status === 503) throw Object.assign(new Error(`HTTP ${r.status}`), { retryAfter: 60_000 });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

type Ctx = { findPlace: ReturnType<typeof makePlaceFinder>; findCity: (t: string) => PlaceRow | null; findIn: (region: string, name: string) => PlaceRow | null; makes: MakeRow[]; models: ModelRow[] };
export async function loadCtx(): Promise<Ctx> {
  const [placeRows, makeRows, modelRows] = await Promise.all([
    db.select({ id: places.id, name: places.name, lat: places.lat, lon: places.lon, region: regions.name, kind: places.kind, parentId: places.parentId })
      .from(places).innerJoin(regions, eq(places.regionId, regions.id)).where(eq(regions.country, "LV")),
    db.select({ id: makes.id, name: makes.name, vehicleClass: makes.vehicleClass }).from(makes),
    db.select({ id: models.id, makeId: models.makeId, name: models.name }).from(models),
  ]);
  const rows = placeRows as PlaceRow[];
  /** Vieta pēc nosaukuma konkrētā reģionā (piem. "Rīga" + "Āgenskalns"); citādi null. */
  const findIn = (region: string, name: string) => {
    const r = slug(region), n = slug(name);
    return rows.find((p) => slug(p.region) === r && slug(p.name) === n) ?? null;
  };
  return { findPlace: makePlaceFinder(rows), findCity: makeCityFinder(rows), findIn, makes: makeRows as MakeRow[], models: modelRows };
}

export type CrawlResult = { section: string; mode: "quick" | "full"; pages: number; rows: number; created: number; updated: number; priceChanged: number; duplicates: number; removed: number; errors: string[]; ms: number };

/** Saglabā vienas lapas rindas: jaunos ievieto, esošajiem atjauno cenu un "redzēts" laiku. */
async function saveRows(section: Section, pageRows: PageRow[], ctx: Ctx, res: CrawlResult, mode: "quick" | "full") {
  const now = new Date();
  // pilnajā kārtā atrastie (bet ātrajās nepamanītie) ir vecāki sludinājumi: lai tie neaizsprosto "jaunākos",
  // tiem ievietošanas laiks ir diennakti agrāk
  const createdAt = mode === "full" ? new Date(now.getTime() - 86_400_000) : now;
  const mapped = pageRows
    .map((r) => {
      const m = mapItem(section, { link: r.link, pubDate: now, fields: r.fields, snippet: r.snippet } as RssItem, ctx);
      if (!m) return null;
      // transportam: pilsēta no saraksta (ja ir) → vietas centrs kartē
      const city = m.kind === "vehicle" && !m.placeId && r.region ? ctx.findCity(r.region) : null;
      return {
        ...m,
        externalThumbUrl: r.thumb ?? null,
        createdAt,
        ...(city ? { placeId: city.id, lat: city.lat + (Math.random() - 0.5) * 0.01, lon: city.lon + (Math.random() - 0.5) * 0.02, geoPrecision: "place" } : {}),
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const byId = new Map(mapped.map((m) => [m.externalId!, m]));
  if (!byId.size) return;
  const existing = await db
    .select({ id: listings.id, externalId: listings.externalId, price: listings.price, status: listings.status, thumb: listings.externalThumbUrl, address: listings.address, makeId: listings.makeId, modelId: listings.modelId, body: listings.body, placeId: listings.placeId, propertyType: listings.propertyType })
    .from(listings)
    .where(and(eq(listings.source, "ss.com"), inArray(listings.externalId, [...byId.keys()])));
  const seen = new Set<string>();
  const touch: string[] = [];
  for (const e of existing) {
    seen.add(e.externalId!);
    const row = byId.get(e.externalId!)!;
    if (e.status === "hidden") continue; // paslēpis moderators: neaiztiekam
    const newAddress = row.address && row.address !== e.address;
    // labāk atpazīta marka/modelis (piem. "Citi" → EV6, "Mercedes" → Mercedes-Benz): atjaunojam arī virsrakstu un virsbūvi
    const better = (row.makeId && !e.makeId) || (row.modelId && !e.modelId);
    const newPlace = row.kind === "vehicle" && row.placeId && !e.placeId;
    // īpašumam vieta precizēta (pagasts/ciems pēc VZD kataloga, piem. Salas pag. nevis Salaspils): jauna vieta, virsraksts, adrese
    const movedPlace = row.kind === "property" && row.placeId && row.placeId !== e.placeId;
    // īpašuma veids precizēts (piem. "Māja" → "Vasarnīca" pēc teksta): atjaunojam veidu un virsrakstu
    const newType = row.kind === "property" && row.propertyType && row.propertyType !== e.propertyType;
    if (e.price !== row.price || e.status === "deleted" || e.thumb !== row.externalThumbUrl || newAddress || better || newPlace || newType || movedPlace) {
      await db
        .update(listings)
        .set({
          price: row.price, status: "active", externalThumbUrl: row.externalThumbUrl, updatedAt: now,
          ...(e.price !== row.price ? { firstPrice: sql`coalesce(${listings.firstPrice}, ${e.price})` } : {}),
          ...(newAddress ? { address: row.address, geoPrecision: "place" } : {}),
          ...(newType ? { propertyType: row.propertyType, title: row.title } : {}),
          ...(newPlace ? { placeId: row.placeId, lat: row.lat, lon: row.lon, geoPrecision: "place" } : {}),
          ...(movedPlace ? { placeId: row.placeId, lat: row.lat, lon: row.lon, geoPrecision: "place", title: row.title, address: row.address } : {}),
          ...(better ? { makeId: row.makeId, modelId: row.modelId, makeText: row.makeText, modelText: row.modelText, title: row.title, ...(e.body ? {} : { body: row.body }) } : {}),
        })
        .where(eq(listings.id, e.id));
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
  // pirmā adrese, kas rāda sludinājumu sarakstu (dažām sadaļām ss.com galvenā lapa ir reģionu izvēle)
  const candidates = [section.url, ...("alt" in section ? section.alt : [])];
  let base = candidates[0];
  for (let n = 1; n <= last; n++) {
    try {
      let html = await fetchHtml(pageUrl(base, n));
      let parsed = parseListPage(html);
      for (let i = 1; n === 1 && !parsed.rows.length && i < candidates.length; i++) {
        await sleep(delayMs);
        base = candidates[i];
        html = await fetchHtml(base);
        parsed = parseListPage(html);
      }
      const { rows, lastPage } = parsed;
      // kopējo lapu skaitu rāda tikai 1. lapa (saite "atpakaļ" uz pēdējo); tālākajās redzams tikai ~10 lapu logs
      if (n === 1) last = Math.min(last, lastPage);
      res.pages++;
      res.rows += rows.length;
      await saveRows(section, rows, ctx, res, mode);
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
        section.kind === "vehicle" ? eq(listings.vehicleClass, section.vehicleClass)
        : section.propertyType === "Māja" ? inArray(listings.propertyType, ["Māja", "Vasarnīca"]) // sadaļā ir arī vasarnīcas
        : eq(listings.propertyType, section.propertyType);
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
