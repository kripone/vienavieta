// bravo-auto.lv (Inchcape Latvija mazlietoto auto zīmols: BMW, MINI, Ford, Mazda, Jaguar, Land Rover,
// Toyota u.c. treid-in auto) sarakstu ievākšana. Bez Cloudflare — pietiek ar parasto HTTP (servera plūsma).
// Kartītes ir servera renderētas ar data-* atributiem: marka, modelis, gads, cena, nobraukums, tilpums,
// jauda (ZS), degviela, ātrumkārba, virsbūve, krāsa, salons; sīktēls no azureedge CDN (rādām, neglabājam).
// Virsrakstus veidojam paši no faktiem, tāpat kā ss.com. Sludinājumu lapas neatveram.
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { BRAVO, EXTERNAL_TTL_DAYS } from "../constants";
import { linkDuplicate } from "../dedupe";
import { inferBody } from "../illustrations";
import { findMake, matchModel, slug, vehicleTitle, type ImportRow, type MakeRow, type ModelRow, type PlaceRow } from "./ss-rss";
import { loadCtx } from "./ss-pages";

const { listings, priceHistory, crawlState } = schema;

export type BravoRow = {
  link: string;
  externalId: string;
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
  isMoto: boolean;
  thumb: string | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** HTML entiijas (&#x12B; &#257; &amp; …) → teksts. */
const decode = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ");

const attr = (tag: string, name: string) => decode(tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? "").trim() || null;

/** Viena saraksta lapa (servera HTML, bez pārlūka). */
export async function fetchListPage(pageIndex: number, pageSize: number): Promise<string> {
  const r = await fetch(`${BRAVO.url}?pageSize=${pageSize}&pageIndex=${pageIndex}`, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

/** Izvelk kartītes no lapas HTML: <li data-bodyType=… data-brand=…> ar <a href> un <img src>. */
export function parseListPage(html: string): BravoRow[] {
  const rows: BravoRow[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/<li\b[^>]*\bdata-brand="[^"]*"[^>]*>[\s\S]*?(?=<li\b[^>]*\bdata-brand=|$)/g)) {
    const card = m[0];
    const href = card.match(/<a\s+href="(\/auto\/[^"]+)"/)?.[1] ?? "";
    const externalId = href.match(/-t-([0-9a-z]+)$/i)?.[1];
    if (!href || !externalId || seen.has(externalId)) continue;
    const price = Number(attr(card, "data-price"));
    if (!Number.isFinite(price) || price < 300 || price > 1_000_000) continue;
    seen.add(externalId);
    const bodyRaw = attr(card, "data-bodyType");
    const engineCc = Number(attr(card, "data-engineSize"));
    const powerHp = Number(attr(card, "data-power"));
    const km = Number(attr(card, "data-mileage"));
    const year = Number(attr(card, "data-year"));
    rows.push({
      link: `https://bravo-auto.lv${href}`,
      externalId,
      makeRaw: attr(card, "data-brand") ?? "",
      modelRaw: attr(card, "data-model") ?? "",
      price,
      year: year > 1950 && year < 2100 ? year : null,
      mileageKm: Number.isFinite(km) && km >= 0 && km < 2_000_000 ? km : null,
      engineL: engineCc >= 400 && engineCc <= 9000 ? (Math.round(engineCc / 100) / 10).toFixed(1) : null,
      powerKw: powerHp >= 10 && powerHp <= 2000 ? Math.round(powerHp * 0.7355) : null,
      fuelRaw: attr(card, "data-fuel"),
      gearboxRaw: attr(card, "data-transmission"),
      bodyRaw,
      colorRaw: attr(card, "data-color"),
      isMoto: slug(bodyRaw ?? "") === "saddle",
      thumb: card.match(/<img[^>]*src="(https:\/\/[^"]+\.(?:webp|jpe?g|png))[^"]*"/)?.[1] ?? null,
    });
  }
  return rows;
}

/** Bravo virsbūve (angļu/lv jauktis) → mūsu katalogs. */
function mapBody(v?: string | null) {
  const s = slug(v ?? "");
  if (!s) return null;
  if (s === "sedan" || s === "sedans") return "Sedans";
  if (s === "wagon" || s === "estate" || s === "touring" || s === "universals") return "Universāls";
  if (s === "suv" || s === "crossover" || s === "apvidus") return "Apvidus";
  if (s === "hatchback" || s === "hecbeks") return "Hečbeks";
  if (s === "coupe" || s === "kupeja") return "Kupeja";
  if (s === "convertible" || s === "cabrio" || s === "kabriolets") return "Kabriolets";
  if (s === "minivan" || s === "minivens") return "Minivens";
  if (s === "pickup" || s === "pikaps") return "Pikaps";
  return null;
}

/** Bravo krāsa ("Light gray", "Blue Metāliska", "KALAHARI GOLD") → mūsu COLORS. */
function mapColor(v?: string | null) {
  const s = slug(v ?? "");
  if (!s) return null;
  if (/balt|white/.test(s)) return "Balta";
  if (/meln|black/.test(s)) return "Melna";
  if (/sudrab|silver/.test(s)) return "Sudraba";
  if (/pelek|gra|gray|grey/.test(s)) return "Pelēka";
  if (/zil|blue/.test(s)) return "Zila";
  if (/sarkan|red/.test(s)) return "Sarkana";
  if (/zal|green/.test(s)) return "Zaļa";
  if (/brun|brown|beige|bez|gold|zeltain/.test(s)) return "Brūna";
  return "Cita";
}

/** "Dīzelis" / "Plug-in Hibrīds" → mūsu FUELS. */
function mapFuel(v?: string | null) {
  const s = slug(v ?? "");
  if (!s) return null;
  if (s.includes("hibrid")) return "Hibrīds";
  if (s.includes("elektro")) return "Elektro";
  if (s.includes("dzelis") || s.includes("dizelis")) return "Dīzelis"; // slug("Dīzelis") → "dizelis"
  if (s.includes("benzins")) return "Benzīns";
  return null;
}

type Ctx = { makes: MakeRow[]; models: ModelRow[]; findCity: (t: string) => PlaceRow | null };

/** Kartīte → mūsu sludinājums (virsrakstu veidojam paši no faktiem, tāpat kā ss.com). */
export function mapRow(r: BravoRow, ctx: Ctx, createdAt: Date): ImportRow | null {
  const vc = r.isMoto ? "moto" : "car";
  const make = findMake(ctx.makes, vc, r.makeRaw) ?? (vc === "moto" ? findMake(ctx.makes, vc, "BMW") : null);
  const model = make ? matchModel(ctx.models, make.id, r.modelRaw, make.name) : null;
  const modelName = model?.name ?? r.modelRaw;
  const fuel = mapFuel(r.fuelRaw);
  const title = vehicleTitle(make?.name ?? r.makeRaw, modelName, r.engineL, fuel, r.year);
  if (!title) return null;
  const city = ctx.findCity("Rīga"); // Bravo autosaloni atrodas Rīgā (K. Ulmaņa gatve)
  return {
    kind: "vehicle",
    status: "active",
    source: "bravo-auto.lv",
    externalUrl: r.link,
    externalId: r.externalId,
    externalThumbUrl: r.thumb,
    title: title.slice(0, 120),
    vehicleClass: vc,
    makeId: make?.id ?? null,
    modelId: model?.id ?? null,
    makeText: make ? null : r.makeRaw || null,
    modelText: model ? null : r.modelRaw || null,
    year: r.year,
    mileageKm: r.mileageKm,
    engineL: r.engineL,
    powerKw: r.powerKw,
    fuel,
    gearbox: slug(r.gearboxRaw ?? "").startsWith("manu") ? "Manuāla" : r.gearboxRaw ? "Automāts" : null,
    body: r.isMoto ? null : (mapBody(r.bodyRaw) ?? inferBody(modelName) ?? inferBody(r.modelRaw)),
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
async function saveRows(rows: BravoRow[], ctx: Ctx, res: CrawlResult, mode: "quick" | "full") {
  const now = new Date();
  const createdAt = mode === "full" ? new Date(now.getTime() - 86_400_000) : now;
  const mapped = rows.map((r) => mapRow(r, ctx, createdAt)).filter((x): x is ImportRow => Boolean(x));
  const byId = new Map(mapped.map((m) => [m.externalId!, m]));
  if (!byId.size) return;
  const existing = await db
    .select({ id: listings.id, externalId: listings.externalId, price: listings.price, status: listings.status, thumb: listings.externalThumbUrl, makeId: listings.makeId, modelId: listings.modelId })
    .from(listings)
    .where(and(eq(listings.source, "bravo-auto.lv"), inArray(listings.externalId, [...byId.keys()])));
  const seen = new Set<string>();
  const touch: string[] = [];
  for (const e of existing) {
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
 * Viena kārta. "quick": pirmā lapa (jaunākie, 24). "full": viss salons vienā lapā (pageSize=500);
 * izdzēstie (ilgāk par EXTERNAL_TTL_DAYS neredzētie) tiek paslēpti.
 */
export async function crawlBravo(mode: "quick" | "full"): Promise<CrawlResult> {
  const started = new Date();
  const res: CrawlResult = { mode, pages: 0, rows: 0, created: 0, updated: 0, priceChanged: 0, duplicates: 0, removed: 0, errors: [], ms: 0 };
  const fullCtx = await loadCtx();
  const ctx: Ctx = { makes: fullCtx.makes, models: fullCtx.models, findCity: fullCtx.findCity };
  try {
    const html = await fetchListPage(1, mode === "full" ? 500 : 24);
    const rows = parseListPage(html);
    res.pages = 1;
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
      .where(and(eq(listings.source, "bravo-auto.lv"), eq(listings.status, "active"), lt(listings.updatedAt, cutoff)))
      .returning({ id: listings.id });
    res.removed = stale.length;
  }
  res.ms = Date.now() - started.getTime();

  const set = mode === "full" ? { lastFullAt: started, lastResult: res as unknown as Record<string, unknown> } : { lastQuickAt: started };
  await db.insert(crawlState).values({ name: BRAVO.key, ...set }).onConflictDoUpdate({ target: crawlState.name, set });
  return res;
}

export function bravoEnabled() {
  const v = process.env.BRAVO_CRAWL;
  return v === "on" || (process.env.NODE_ENV === "production" && v !== "off");
}

/** Plānotāja solis: ātrā vai pilnā kārta, ja pienācis laiks; citādi null. */
export async function tickBravo(): Promise<CrawlResult | null> {
  const st = await db.query.crawlState.findFirst({ where: eq(crawlState.name, BRAVO.key) });
  const now = Date.now();
  const fullDue = !st?.lastFullAt || now - st.lastFullAt.getTime() > BRAVO.fullEveryHours * 3600_000;
  const quickDue = !st?.lastQuickAt || now - st.lastQuickAt.getTime() > BRAVO.quickEveryMin * 60_000;
  if (!fullDue && !quickDue) return null;
  return crawlBravo(fullDue ? "full" : "quick");
}
