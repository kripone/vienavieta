// cars.bmwwess.lv (Wess Select — BMW un citu marku mazlietoto auto katalogs) ievākšana.
// WooCommerce veikals ar servera renderētām kartītēm (?product-page=N), Cloudflare ir,
// bet parastais HTTP paiet cauri (servera plūsma). Saraksta kartīte dod marku/modeli (virsraksts),
// gadu, ātrumkārbu, nobraukumu, cenu un sīktēlu; degvielu, tilpumu, jaudu, krāsu un virsbūvi
// paņemam no detaļu lapas (tikai jaunajiem sludinājumiem — ikonu bloks car-attributes).
// Virsrakstus veidojam paši no faktiem, tāpat kā ss.com.
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { EXTERNAL_TTL_DAYS, WESS } from "../constants";
import { linkDuplicate } from "../dedupe";
import { inferBody } from "../illustrations";
import { mapColor } from "./bravo-pages";
import { findMake, matchModel, slug, vehicleTitle, type ImportRow, type MakeRow, type ModelRow, type PlaceRow } from "./ss-rss";
import { loadCtx } from "./ss-pages";

const { listings, priceHistory, crawlState } = schema;

export type WessRow = {
  link: string;
  externalId: string; // URL slugs (unikāls WP ierakstam)
  makeRaw: string;
  modelRaw: string;
  price: number;
  year: number | null;
  mileageKm: number | null;
  gearboxRaw: string | null;
  thumb: string | null;
  // no detaļu lapas (tikai jaunajiem):
  fuelRaw: string | null;
  engineL: string | null;
  powerKw: number | null;
  colorRaw: string | null;
  bodyRaw: string | null;
};

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Viena saraksta lapa (servera HTML). */
export async function fetchListPage(p: number): Promise<string> {
  const r = await fetch(p === 1 ? WESS.url : `${WESS.url}?product-page=${p}`, { headers: UA });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

/** Izvelk kartītes no saraksta lapas HTML. */
export function parseListPage(html: string): WessRow[] {
  const rows: WessRow[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/<li class="product-item-wrapper[\s\S]*?<\/li>/g)) {
    const card = m[0];
    const link = card.match(/href="(https:\/\/cars\.bmwwess\.lv\/product\/([a-z0-9-]+)\/)"/);
    if (!link || seen.has(link[2]) || link[2].startsWith("__trashed")) continue;
    seen.add(link[2]);
    const price = Number((card.match(/<bdi>[\s\S]*?&nbsp;([\d\s]+)<\/bdi>/)?.[1] ?? "").replace(/\s/g, ""));
    if (!Number.isFinite(price) || price < 300 || price > 1_000_000) continue;
    const title = card.match(/<h3>([^<]+)<\/h3>/)?.[1]?.trim() ?? "";
    const year = Number(card.match(/products\/calendar\.png[\s\S]{0,300}?<span>(\d{4})/)?.[1]);
    const km = Number((card.match(/products\/speedometer\.png[\s\S]{0,300}?<span>([\d\s]+)\s*km/)?.[1] ?? "").replace(/\s/g, ""));
    rows.push({
      link: link[1],
      externalId: link[2],
      makeRaw: title.split(/\s+/)[0] ?? "",
      modelRaw: title.split(/\s+/).slice(1).join(" "),
      price,
      year: year > 1950 && year < 2100 ? year : null,
      mileageKm: Number.isFinite(km) && km >= 0 && km < 2_000_000 ? km : null,
      gearboxRaw: card.match(/products\/mt\.png[\s\S]{0,300}?<span>([^<]+)<\/span>/)?.[1]?.trim() ?? null,
      thumb: card.match(/<img[^>]*src="(https:\/\/[^"]+?\.(?:jpe?g|webp|png))"/)?.[1] ?? null,
      fuelRaw: null,
      engineL: null,
      powerKw: null,
      colorRaw: null,
      bodyRaw: null,
    });
  }
  return rows;
}

/** Detaļu lapa: papildu fakti no car-attributes ikonu bloka. */
export async function enrichFromDetail(row: WessRow): Promise<void> {
  const r = await fetch(row.link, { headers: UA });
  if (!r.ok) return;
  const html = await r.text();
  const section = html.match(/<section class="car-attributes">([\s\S]*?)<\/section>/)?.[1] ?? "";
  const val = (icon: string) => section.match(new RegExp(`products/${icon}\\.png[\\s\\S]{0,300}?<span>([^<]+)<\\/span>`))?.[1]?.trim() ?? null;
  row.fuelRaw = val("gas-station");
  const engine = val("engine_l"); // "3 l"
  const cc = engine ? Number(engine.replace(/[^\d.,]/g, "").replace(",", ".")) : NaN;
  row.engineL = Number.isFinite(cc) && cc >= 0.4 && cc <= 20 ? cc.toFixed(1) : null;
  const kw = Number(val("engine_kw")?.match(/(\d+)\s*kW/)?.[1]); // "180 kW (245 Zs)"
  row.powerKw = Number.isFinite(kw) && kw >= 10 && kw <= 2000 ? kw : null;
  row.colorRaw = val("color");
  row.bodyRaw = val("body");
}

/** "Benzīns" / "Dīzelis" / "Elektro" / "Hibrīds" → mūsu FUELS. */
function mapFuel(v?: string | null) {
  const s = slug(v ?? "");
  if (!s) return null;
  if (s.includes("hibrid") || s.includes("hbrid")) return "Hibrīds";
  if (s.includes("elektr")) return "Elektro";
  if (s.includes("dzelis") || s.includes("dizelis")) return "Dīzelis";
  if (s.includes("benzins")) return "Benzīns";
  return null;
}

type Ctx = { makes: MakeRow[]; models: ModelRow[]; findCity: (t: string) => PlaceRow | null };

/** Rinda → mūsu sludinājums. */
export function mapRow(r: WessRow, ctx: Ctx, createdAt: Date): ImportRow | null {
  let make = findMake(ctx.makes, "car", r.makeRaw);
  let modelRaw = r.modelRaw;
  if (!make && r.modelRaw) {
    // marka var būt divos vārdos ("Mercedes-Benz ..." jau viens vārds; "Land Rover ..." — divi)
    make = findMake(ctx.makes, "car", `${r.makeRaw} ${r.modelRaw.split(/\s+/)[0] ?? ""}`);
    if (make) modelRaw = r.modelRaw.split(/\s+/).slice(1).join(" ");
  }
  const model = make ? matchModel(ctx.models, make.id, modelRaw, make.name) : null;
  const modelName = model?.name ?? modelRaw;
  const fuel = mapFuel(r.fuelRaw);
  const title = vehicleTitle(make?.name ?? r.makeRaw, modelName, r.engineL, fuel, r.year);
  if (!title) return null;
  const city = ctx.findCity("Rīga"); // Wess Select salons atrodas Mārupē pie Rīgas (K. Ulmaņa gatve)
  return {
    kind: "vehicle",
    status: "active",
    source: "cars.bmwwess.lv",
    externalUrl: r.link,
    externalId: r.externalId,
    externalThumbUrl: r.thumb,
    title: title.slice(0, 120),
    vehicleClass: "car",
    makeId: make?.id ?? null,
    modelId: model?.id ?? null,
    makeText: make ? null : r.makeRaw || null,
    modelText: model ? null : modelRaw || null,
    year: r.year,
    mileageKm: r.mileageKm,
    engineL: r.engineL,
    powerKw: r.powerKw,
    fuel,
    gearbox: slug(r.gearboxRaw ?? "").startsWith("manual") || slug(r.gearboxRaw ?? "").startsWith("mehan") ? "Manuāla" : r.gearboxRaw ? "Automāts" : null,
    body: mapBodyLocal(r.bodyRaw) ?? inferBody(modelName) ?? inferBody(modelRaw),
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

/** Wess virsbūve ("Hečbeks", "Sedans", "Universāls"…) → mūsu katalogs. */
function mapBodyLocal(v?: string | null) {
  const s = slug(v ?? "");
  if (!s) return null;
  if (s.includes("hecbek")) return "Hečbeks";
  if (s.includes("sedan")) return "Sedans";
  if (s.includes("universal") || s.includes("touring")) return "Universāls";
  if (s.includes("apvid") || s.includes("suv") || s.includes("krosover")) return "Apvidus";
  if (s.includes("kupej")) return "Kupeja";
  if (s.includes("kabrio")) return "Kabriolets";
  if (s.includes("miniven")) return "Minivens";
  if (s.includes("pikap")) return "Pikaps";
  if (s.includes("furgon") || s.includes("mikroautobus")) return "Mikroautobuss";
  return null;
}

export type CrawlResult = { mode: "quick" | "full"; pages: number; rows: number; created: number; updated: number; priceChanged: number; duplicates: number; removed: number; errors: string[]; ms: number };

/** Saglabā lapas kartītes: jaunajiem paņem detaļu lapu, ievieto; esošajiem atjauno cenu un "redzēts" laiku. */
async function saveRows(rows: WessRow[], ctx: Ctx, res: CrawlResult, mode: "quick" | "full") {
  const now = new Date();
  const createdAt = mode === "full" ? new Date(now.getTime() - 86_400_000) : now;
  const ids = rows.map((r) => r.externalId);
  if (!ids.length) return;
  const existing = await db
    .select({ id: listings.id, externalId: listings.externalId, price: listings.price, status: listings.status, thumb: listings.externalThumbUrl })
    .from(listings)
    .where(and(eq(listings.source, "cars.bmwwess.lv"), inArray(listings.externalId, ids)));
  const known = new Set(existing.map((e) => e.externalId!));
  // detaļu lapas paņemam tikai jaunajiem (degviela, tilpums, jauda, krāsa, virsbūve)
  for (const r of rows) {
    if (known.has(r.externalId)) continue;
    await enrichFromDetail(r).catch(() => {});
    await sleep(600);
  }
  const mapped = rows.map((r) => mapRow(r, ctx, createdAt)).filter((x): x is ImportRow => Boolean(x));
  const byId = new Map(mapped.map((m) => [m.externalId!, m]));
  if (!byId.size) return;
  const existingFull = await db
    .select({ id: listings.id, externalId: listings.externalId, price: listings.price, status: listings.status, thumb: listings.externalThumbUrl, makeId: listings.makeId, modelId: listings.modelId, fuel: listings.fuel })
    .from(listings)
    .where(and(eq(listings.source, "cars.bmwwess.lv"), inArray(listings.externalId, [...byId.keys()])));
  const seen = new Set<string>();
  const touch: string[] = [];
  for (const e of existingFull) {
    seen.add(e.externalId!);
    const row = byId.get(e.externalId!)!;
    if (e.status === "hidden") continue; // paslēpis moderators: neaiztiekam
    const better = (row.makeId && !e.makeId) || (row.modelId && !e.modelId);
    if (e.price !== row.price || e.status === "deleted" || e.thumb !== row.externalThumbUrl || better) {
      await db
        .update(listings)
        .set({
          price: row.price,
          status: "active",
          externalThumbUrl: row.externalThumbUrl,
          updatedAt: now,
          ...(e.price !== row.price ? { firstPrice: sql`coalesce(${listings.firstPrice}, ${e.price})` } : {}),
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
 * Viena kārta. "quick": pirmā lapa. "full": visas lapas (~2);
 * izdzēstie (ilgāk par EXTERNAL_TTL_DAYS neredzētie) tiek paslēpti.
 */
export async function crawlWess(mode: "quick" | "full"): Promise<CrawlResult> {
  const started = new Date();
  const res: CrawlResult = { mode, pages: 0, rows: 0, created: 0, updated: 0, priceChanged: 0, duplicates: 0, removed: 0, errors: [], ms: 0 };
  const fullCtx = await loadCtx();
  const ctx: Ctx = { makes: fullCtx.makes, models: fullCtx.models, findCity: fullCtx.findCity };
  try {
    const rows = parseListPage(await fetchListPage(1));
    res.pages = 1;
    if (mode === "full") {
      for (let p = 2; p <= 10; p++) {
        const pageRows = parseListPage(await fetchListPage(p));
        if (!pageRows.length) break;
        rows.push(...pageRows.filter((r) => !rows.some((x) => x.externalId === r.externalId)));
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
      .where(and(eq(listings.source, "cars.bmwwess.lv"), eq(listings.status, "active"), lt(listings.updatedAt, cutoff)))
      .returning({ id: listings.id });
    res.removed = stale.length;
  }
  res.ms = Date.now() - started.getTime();

  const set = mode === "full" ? { lastFullAt: started, lastResult: res as unknown as Record<string, unknown> } : { lastQuickAt: started };
  await db.insert(crawlState).values({ name: WESS.key, ...set }).onConflictDoUpdate({ target: crawlState.name, set });
  return res;
}

export function wessEnabled() {
  const v = process.env.WESS_CRAWL;
  return v === "on" || (process.env.NODE_ENV === "production" && v !== "off");
}

/** Plānotāja solis: ātrā vai pilnā kārta, ja pienācis laiks; citādi null. */
export async function tickWess(): Promise<CrawlResult | null> {
  const st = await db.query.crawlState.findFirst({ where: eq(crawlState.name, WESS.key) });
  const now = Date.now();
  const fullDue = !st?.lastFullAt || now - st.lastFullAt.getTime() > WESS.fullEveryHours * 3600_000;
  const quickDue = !st?.lastQuickAt || now - st.lastQuickAt.getTime() > WESS.quickEveryMin * 60_000;
  if (!fullDue && !quickDue) return null;
  return crawlWess(fullDue ? "full" : "quick");
}
