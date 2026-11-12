// mollerauto.lv (Moller Auto: Audi, Volkswagen, Škoda oficiālais dīleris) lietoto auto ievākšana.
// Magento veikals ar servera renderētām kartītēm (/lv/used-cars.html?p=N), bez bot aizsardzības
// — pietiek ar parasto HTTP (servera plūsma). Kartītes data-gtm-product atributā ir pilns JSON:
// marka, modelis, pirmā reģistrācija, nobraukums, virsbūve, tilpums, jauda (ZS/kW), degviela,
// ātrumkārba, krāsa; data-sku = VIN. Virsrakstus veidojam paši no faktiem, tāpat kā ss.com.
// Sludinājumu lapas neatveram.
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { EXTERNAL_TTL_DAYS, MOLLER } from "../constants";
import { linkDuplicate } from "../dedupe";
import { inferBody } from "../illustrations";
import { mapBody, mapColor } from "./bravo-pages";
import { findMake, matchModel, slug, vehicleTitle, type ImportRow, type MakeRow, type ModelRow, type PlaceRow } from "./ss-rss";
import { loadCtx } from "./ss-pages";

const { listings, priceHistory, crawlState } = schema;

export type MollerRow = {
  link: string;
  externalId: string;
  vin: string | null;
  makeRaw: string;
  modelRaw: string;
  price: number;
  year: number | null;
  mileageKm: number | null;
  engineL: string | null;
  powerKw: number | null;
  fuelRaw: string | null;
  gearboxRaw: string | null;
  bodyRaw: string | null;
  colorRaw: string | null;
  thumb: string | null;
};

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" };

/** HTML entiijas (&#x12B; &#257; &amp; …) → teksts. */
const decode = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ");

/** Viena saraksta lapa (servera HTML, bez pārlūka). */
export async function fetchListPage(p: number): Promise<string> {
  const r = await fetch(`${MOLLER.url}?p=${p}`, { headers: UA });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

type Gtm = { brand?: string; variant?: string; dimension1?: number; dimension4?: string; dimension5?: string; dimension6?: string; dimension7?: string; dimension8?: string; dimension9?: string; dimension10?: string; dimension12?: string };

/** Izvelk kartītes no lapas HTML: <li class="plp-grid__item"> ar data-gtm-product JSON. */
export function parseListPage(html: string): MollerRow[] {
  const rows: MollerRow[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/<li class="plp-grid__item">([\s\S]*?)<\/li>\s*(?=<li class="plp-grid__item">|<\/ol>|<\/ul>)/g)) {
    const card = m[1];
    const link = card.match(/href="(https:\/\/mollerauto\.lv\/lv\/(\d+)\.html)"/);
    if (!link || seen.has(link[2])) continue;
    seen.add(link[2]);
    let g: Gtm = {};
    const gtm = card.match(/data-gtm-product="([^"]+)"/)?.[1];
    if (gtm) { try { g = JSON.parse(decode(gtm)).ecommerce.click.products[0] ?? {}; } catch {} }
    const price = Number(card.match(/data-price-amount="(\d+)"/)?.[1] ?? g.dimension1);
    if (!Number.isFinite(price) || price < 300 || price > 1_000_000) continue;
    const year = Number((g.dimension4 ?? "").match(/(\d{4})/)?.[1]);
    const km = Number((g.dimension5 ?? "").replace(/[^\d]/g, ""));
    const cc = Number((g.dimension7 ?? "").replace(/[^\d]/g, ""));
    const kw = Number((g.dimension9 ?? "").match(/\((\d+)\s*kw\)/i)?.[1] ?? (g.dimension9 ?? "").match(/(\d+)\s*kw/i)?.[1]);
    rows.push({
      link: link[1],
      externalId: link[2],
      vin: card.match(/data-sku="([A-HJ-NPR-Z0-9]{17})"/)?.[1] ?? null,
      makeRaw: g.brand ?? "",
      modelRaw: g.variant ?? "",
      price,
      year: year > 1950 && year < 2100 ? year : null,
      mileageKm: Number.isFinite(km) && km >= 0 && km < 2_000_000 ? km : null,
      engineL: cc >= 400 && cc <= 9000 ? (Math.round(cc / 100) / 10).toFixed(1) : null,
      powerKw: Number.isFinite(kw) && kw >= 10 && kw <= 2000 ? kw : null,
      fuelRaw: g.dimension8 ?? null,
      gearboxRaw: g.dimension10 ?? null,
      bodyRaw: g.dimension6 ?? null,
      colorRaw: g.dimension12 ?? null,
      thumb: card.match(/<img[^>]*src="(https:\/\/[^"]+\.(?:jpe?g|webp|png))[^"]*"/)?.[1] ?? null,
    });
  }
  return rows;
}

/** "benzīns" / "dīzelis" / "elektro" / "Plug-in hybrid (petrol / electric)" → mūsu FUELS. */
function mapFuel(v?: string | null) {
  const s = slug(v ?? "");
  if (!s) return null;
  if (s.includes("hibrid") || s.includes("hbrid")) return "Hibrīds"; // slug("hybrid") → "hbrid"; jāpārbauda pirms petrol/electric
  if (s.includes("elektro") || s.includes("electric")) return "Elektro";
  if (s.includes("dzelis") || s.includes("dizelis")) return "Dīzelis"; // slug("Dīzelis") → "dizelis"
  if (s.includes("benzins") || s.includes("petrol")) return "Benzīns";
  return null;
}

type Ctx = { makes: MakeRow[]; models: ModelRow[]; findCity: (t: string) => PlaceRow | null };

/** Kartīte → mūsu sludinājums. */
export function mapRow(r: MollerRow, ctx: Ctx, createdAt: Date): ImportRow | null {
  const make = findMake(ctx.makes, "car", r.makeRaw);
  const model = make ? matchModel(ctx.models, make.id, r.modelRaw, make.name) : null;
  const modelName = model?.name ?? r.modelRaw;
  const fuel = mapFuel(r.fuelRaw);
  const title = vehicleTitle(make?.name ?? r.makeRaw, modelName, r.engineL, fuel, r.year);
  if (!title) return null;
  const city = ctx.findCity("Rīga"); // Moller Auto salons atrodas Rīgā (Brīvības gatve)
  return {
    kind: "vehicle",
    status: "active",
    source: "mollerauto.lv",
    externalUrl: r.link,
    externalId: r.externalId,
    externalThumbUrl: r.thumb,
    title: title.slice(0, 120),
    vehicleClass: "car",
    makeId: make?.id ?? null,
    modelId: model?.id ?? null,
    makeText: make ? null : r.makeRaw || null,
    modelText: model ? null : r.modelRaw || null,
    year: r.year,
    mileageKm: r.mileageKm,
    engineL: r.engineL,
    powerKw: r.powerKw,
    fuel,
    gearbox: slug(r.gearboxRaw ?? "").includes("manual") || slug(r.gearboxRaw ?? "").includes("mehan") ? "Manuāla" : r.gearboxRaw ? "Automāts" : null,
    body: mapBody(r.bodyRaw) ?? inferBody(modelName) ?? inferBody(r.modelRaw),
    color: mapColor(r.colorRaw),
    price: r.price,
    placeId: city?.id ?? null,
    lat: city ? city.lat + (Math.random() - 0.5) * 0.01 : null,
    lon: city ? city.lon + (Math.random() - 0.5) * 0.02 : null,
    geoPrecision: city ? "place" : null,
    createdAt,
    updatedAt: new Date(),
  };
}

export type CrawlResult = { mode: "quick" | "full"; pages: number; rows: number; created: number; updated: number; priceChanged: number; duplicates: number; removed: number; errors: string[]; ms: number };

/** Saglabā lapas kartītes: jaunos ievieto, esošajiem atjauno cenu un "redzēts" laiku. */
async function saveRows(rows: MollerRow[], ctx: Ctx, res: CrawlResult, mode: "quick" | "full") {
  const now = new Date();
  const createdAt = mode === "full" ? new Date(now.getTime() - 86_400_000) : now;
  const mapped = rows.map((r) => mapRow(r, ctx, createdAt)).filter((x): x is ImportRow => Boolean(x));
  const byId = new Map(mapped.map((m) => [m.externalId!, m]));
  if (!byId.size) return;
  const existing = await db
    .select({ id: listings.id, externalId: listings.externalId, price: listings.price, status: listings.status, thumb: listings.externalThumbUrl, makeId: listings.makeId, modelId: listings.modelId, fuel: listings.fuel })
    .from(listings)
    .where(and(eq(listings.source, "mollerauto.lv"), inArray(listings.externalId, [...byId.keys()])));
  const seen = new Set<string>();
  const touch: string[] = [];
  for (const e of existing) {
    seen.add(e.externalId!);
    const row = byId.get(e.externalId!)!;
    if (e.status === "hidden") continue; // paslēpis moderators: neaiztiekam
    const better = (row.makeId && !e.makeId) || (row.modelId && !e.modelId);
    if (e.price !== row.price || e.status === "deleted" || e.thumb !== row.externalThumbUrl || e.fuel !== row.fuel || better) {
      await db
        .update(listings)
        .set({
          price: row.price,
          status: "active",
          externalThumbUrl: row.externalThumbUrl,
          updatedAt: now,
          ...(e.price !== row.price ? { firstPrice: sql`coalesce(${listings.firstPrice}, ${e.price})` } : {}),
          ...(e.fuel !== row.fuel ? { fuel: row.fuel, title: row.title } : {}),
          ...(better ? { makeId: row.makeId, modelId: row.modelId, makeText: row.makeText, modelText: row.modelText, title: row.title, body: row.body } : {}),
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
 * Viena kārta. "quick": pirmā lapa (jaunākie, 12). "full": visas lapas (?p=1..N, ~5);
 * izdzēstie (ilgāk par EXTERNAL_TTL_DAYS neredzētie) tiek paslēpti.
 */
export async function crawlMoller(mode: "quick" | "full"): Promise<CrawlResult> {
  const started = new Date();
  const res: CrawlResult = { mode, pages: 0, rows: 0, created: 0, updated: 0, priceChanged: 0, duplicates: 0, removed: 0, errors: [], ms: 0 };
  const fullCtx = await loadCtx();
  const ctx: Ctx = { makes: fullCtx.makes, models: fullCtx.models, findCity: fullCtx.findCity };
  try {
    const first = await fetchListPage(1);
    res.pages = 1;
    const rows = parseListPage(first);
    if (mode === "full") {
      const lastPage = Math.max(1, ...[...first.matchAll(/used-cars\.html\?p=(\d+)/g)].map((m) => Number(m[1])));
      for (let p = 2; p <= lastPage; p++) {
        rows.push(...parseListPage(await fetchListPage(p)));
        res.pages++;
      }
    }
    res.rows = rows.length;
    await saveRows(rows, ctx, res, mode);
  } catch (err) {
    res.errors.push(err instanceof Error ? err.message : String(err));
  }

  if (mode === "full") {
    const cutoff = new Date(Date.now() - EXTERNAL_TTL_DAYS * 86_400_000);
    const stale = await db
      .update(listings)
      .set({ status: "hidden" })
      .where(and(eq(listings.source, "mollerauto.lv"), eq(listings.status, "active"), lt(listings.updatedAt, cutoff)))
      .returning({ id: listings.id });
    res.removed = stale.length;
  }
  res.ms = Date.now() - started.getTime();

  const set = mode === "full" ? { lastFullAt: started, lastResult: res as unknown as Record<string, unknown> } : { lastQuickAt: started };
  await db.insert(crawlState).values({ name: MOLLER.key, ...set }).onConflictDoUpdate({ target: crawlState.name, set });
  return res;
}

export function mollerEnabled() {
  const v = process.env.MOLLER_CRAWL;
  return v === "on" || (process.env.NODE_ENV === "production" && v !== "off");
}

/** Plānotāja solis: ātrā vai pilnā kārta, ja pienācis laiks; citādi null. */
export async function tickMoller(): Promise<CrawlResult | null> {
  const st = await db.query.crawlState.findFirst({ where: eq(crawlState.name, MOLLER.key) });
  const now = Date.now();
  const fullDue = !st?.lastFullAt || now - st.lastFullAt.getTime() > MOLLER.fullEveryHours * 3600_000;
  const quickDue = !st?.lastQuickAt || now - st.lastQuickAt.getTime() > MOLLER.quickEveryMin * 60_000;
  if (!fullDue && !quickDue) return null;
  return crawlMoller(fullDue ? "full" : "quick");
}
