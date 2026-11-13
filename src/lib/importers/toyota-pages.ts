// toyota.lv un lexus.lv (Amserv Rīga/Liepāja, Lexus Riga Krasta/Airport) lietoto auto ievākšana.
// Toyota Europe kopīgā "approved used" platforma: atklāts JSON API
// (POST usc-webcomponents.toyota-europe.com/v1/api/usedcars/results/lv/lv?brand=toyota|lexus),
// bez bot aizsardzības — pietiek ar parasto HTTP (servera plūsma). Atbilde dod VIN, marku,
// modeli, gadu, cenu, nobraukumu, tilpumu, jaudu (kW), degvielu, ātrumkārbu, virsbūvi, krāsu,
// dīlera pilsētu un bildes. Virsrakstus veidojam paši no faktiem, tāpat kā ss.com.
// Detaļu lapas neatveram (pdp.auto-<uuid> pāradresē uz kanonisko URL).
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { EXTERNAL_TTL_DAYS, TOYOTA } from "../constants";
import { linkDuplicate } from "../dedupe";
import { inferBody } from "../illustrations";
import { mapColor } from "./bravo-pages";
import { findMake, matchModel, slug, vehicleTitle, type ImportRow, type MakeRow, type ModelRow, type PlaceRow } from "./ss-rss";
import { loadCtx } from "./ss-pages";

const { listings, priceHistory, crawlState } = schema;

type BrandCfg = { brand: "toyota" | "lexus"; source: "toyota.lv" | "lexus.lv"; pdpBase: string; key: string; filters: unknown[] };

/** Toyota vaicājumam lietojam tādus pašus Latvijas filtrus kā mājaslapa; Lexus ar tiem atdod 0, tāpēc bez (distributorCode 94401 jau ierobežo uz LV). */
const BRANDS: BrandCfg[] = [
  {
    brand: "toyota",
    source: "toyota.lv",
    pdpBase: "https://www.toyota.lv/toyota-approved/pdp.auto-",
    key: "toyota:cars",
    filters: [
      { filterId: "usedCarLocation", valueIds: ["62a80233-ff86-418d-950d-f36e84c7a28c", "00CD9-79514-4734D-8C000-01200-1"] },
      { filterId: "usedCarBrand", valueIds: ["38"] },
    ],
  },
  { brand: "lexus", source: "lexus.lv", pdpBase: "https://www.lexus.lv/lexus-select/pdp.auto-", key: "lexus:cars", filters: [] },
];

export type ToyotaRow = {
  link: string;
  externalId: string; // platformas uuid
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
  city: string | null;
};

type ApiVehicle = {
  id?: string;
  vin?: string;
  mileage?: { value?: number };
  price?: { sellingPriceInclVAT?: number };
  exteriorColour?: string;
  images?: { url?: string }[];
  dealer?: { address?: { city?: string } };
  product?: {
    brand?: { description?: string };
    model?: { description?: string };
    modelYear?: string;
    bodyType?: string;
    engine?: { displayFuelType?: string; displacement?: { value?: number }; powerOutputKilowatts?: { value?: number } };
    transmission?: { transmissionType?: { description?: string } };
  };
};

/** Viena API lapa (100 auto lapā). */
async function fetchPage(cfg: BrandCfg, offset: number, count: number): Promise<{ vehicles: ApiVehicle[]; total: number }> {
  const r = await fetch(`https://usc-webcomponents.toyota-europe.com/v1/api/usedcars/results/lv/lv?brand=${cfg.brand}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36", Referer: `https://www.${cfg.brand}.lv/` },
    body: JSON.stringify({
      uscEnv: "production",
      filters: cfg.filters,
      filterContext: "used",
      offset,
      resultCount: count,
      sortOrder: "published",
      distributorCode: "94401",
    }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = (await r.json()) as { results?: ApiVehicle[]; totalResultCount?: number };
  return { vehicles: d.results ?? [], total: d.totalResultCount ?? 0 };
}

/** API auto objekts → mūsu rinda. */
export function mapVehicle(cfg: BrandCfg, v: ApiVehicle): ToyotaRow | null {
  if (!v.id) return null;
  const price = v.price?.sellingPriceInclVAT;
  if (!price || price < 300 || price > 1_000_000) return null;
  const p = v.product ?? {};
  const cc = p.engine?.displacement?.value;
  const kw = p.engine?.powerOutputKilowatts?.value;
  const km = v.mileage?.value;
  const year = Number(p.modelYear);
  const img = v.images?.[0]?.url;
  return {
    link: `${cfg.pdpBase}${v.id}`,
    externalId: v.id,
    makeRaw: p.brand?.description?.trim() ?? "",
    modelRaw: p.model?.description?.trim() ?? "",
    price,
    year: year > 1950 && year < 2100 ? year : null,
    mileageKm: typeof km === "number" && km >= 0 && km < 2_000_000 ? km : null,
    engineL: cc && cc >= 400 && cc <= 9000 ? (Math.round(cc / 100) / 10).toFixed(1) : null,
    powerKw: kw && kw >= 10 && kw <= 2000 ? kw : null,
    fuelRaw: p.engine?.displayFuelType ?? null,
    gearboxRaw: p.transmission?.transmissionType?.description ?? null,
    bodyRaw: p.bodyType ?? null,
    colorRaw: v.exteriorColour ?? null,
    thumb: img ? (img.startsWith("//") ? `https:${img}` : img) : null,
    city: v.dealer?.address?.city ?? null,
  };
}

/** "Benzīns" / "Dīzeļdegviela" / "Hibrīds" / "Uzlādējamais hibrīds" / "Elektrisks" → mūsu FUELS. */
function mapFuel(v?: string | null) {
  const s = slug(v ?? "");
  if (!s) return null;
  if (s.includes("hibrid") || s.includes("hbrid")) return "Hibrīds"; // arī uzlādējamais
  if (s.includes("elektr")) return "Elektro";
  if (s.includes("dzelis") || s.includes("dizelis") || s.includes("dizeldegviela")) return "Dīzelis";
  if (s.includes("benzins")) return "Benzīns";
  return null;
}

/** Toyota virsbūve ("Suv", "Universālis", "Pasažieru Furgons") → mūsu katalogs. */
function mapBody(v?: string | null) {
  const s = slug(v ?? "");
  if (!s) return null;
  if (s === "suv" || s === "crossover" || s.includes("apvid")) return "Apvidus";
  if (s.includes("universal") || s === "wagon" || s === "estate" || s === "touring") return "Universāls";
  if (s.includes("sedan")) return "Sedans";
  if (s.includes("hecbek") || s.includes("hatchback")) return "Hečbeks";
  if (s.includes("furgon") || s.includes("van")) return "Mikroautobuss";
  if (s.includes("pikap") || s.includes("pickup")) return "Pikaps";
  if (s.includes("kupej") || s.includes("coupe")) return "Kupeja";
  if (s.includes("kabrio") || s.includes("cabrio") || s.includes("convertible")) return "Kabriolets";
  if (s.includes("miniven") || s.includes("minivan")) return "Minivens";
  return null;
}

type Ctx = { makes: MakeRow[]; models: ModelRow[]; findCity: (t: string) => PlaceRow | null };

/** Rinda → mūsu sludinājums. */
export function mapRow(cfg: BrandCfg, r: ToyotaRow, ctx: Ctx, createdAt: Date): ImportRow | null {
  const make = findMake(ctx.makes, "car", r.makeRaw);
  const model = make ? matchModel(ctx.models, make.id, r.modelRaw, make.name) : null;
  const modelName = model?.name ?? r.modelRaw;
  const fuel = mapFuel(r.fuelRaw);
  const title = vehicleTitle(make?.name ?? r.makeRaw, modelName, r.engineL, fuel, r.year);
  if (!title) return null;
  const city = r.city ? ctx.findCity(r.city) : null;
  return {
    kind: "vehicle",
    status: "active",
    source: cfg.source,
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
    gearbox: slug(r.gearboxRaw ?? "").startsWith("manual") ? "Manuāla" : r.gearboxRaw ? "Automāts" : null,
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

export type CrawlResult = { mode: "quick" | "full"; brands: string; pages: number; rows: number; created: number; updated: number; priceChanged: number; duplicates: number; removed: number; errors: string[]; ms: number };

/** Saglabā vienas markas rindas: jaunos ievieto, esošajiem atjauno cenu un "redzēts" laiku. */
async function saveRows(cfg: BrandCfg, rows: ToyotaRow[], ctx: Ctx, res: CrawlResult, mode: "quick" | "full") {
  const now = new Date();
  const createdAt = mode === "full" ? new Date(now.getTime() - 86_400_000) : now;
  const mapped = rows.map((r) => mapRow(cfg, r, ctx, createdAt)).filter((x): x is ImportRow => Boolean(x));
  const byId = new Map(mapped.map((m) => [m.externalId!, m]));
  if (!byId.size) return;
  const existing = await db
    .select({ id: listings.id, externalId: listings.externalId, price: listings.price, status: listings.status, thumb: listings.externalThumbUrl, makeId: listings.makeId, modelId: listings.modelId, fuel: listings.fuel })
    .from(listings)
    .where(and(eq(listings.source, cfg.source), inArray(listings.externalId, [...byId.keys()])));
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
 * Viena kārta abām markām (toyota + lexus). "quick": pirmie 24 jaunākie no katras.
 * "full": viss saraksts; izdzēstie (ilgāk par EXTERNAL_TTL_DAYS neredzētie) tiek paslēpti.
 */
export async function crawlToyota(mode: "quick" | "full"): Promise<CrawlResult> {
  const started = new Date();
  const res: CrawlResult = { mode, brands: BRANDS.map((b) => b.brand).join("+"), pages: 0, rows: 0, created: 0, updated: 0, priceChanged: 0, duplicates: 0, removed: 0, errors: [], ms: 0 };
  const fullCtx = await loadCtx();
  const ctx: Ctx = { makes: fullCtx.makes, models: fullCtx.models, findCity: fullCtx.findCity };
  for (const cfg of BRANDS) {
    try {
      if (mode === "quick") {
        const d = await fetchPage(cfg, 0, 24);
        res.pages++;
        const rows = d.vehicles.map((v) => mapVehicle(cfg, v)).filter((x): x is ToyotaRow => Boolean(x));
        res.rows += rows.length;
        await saveRows(cfg, rows, ctx, res, mode);
      } else {
        let offset = 0;
        const all: ToyotaRow[] = [];
        for (;;) {
          const d = await fetchPage(cfg, offset, 100);
          res.pages++;
          all.push(...d.vehicles.map((v) => mapVehicle(cfg, v)).filter((x): x is ToyotaRow => Boolean(x)));
          offset += 100;
          if (offset >= (d.total || 0) || !d.vehicles.length) break;
        }
        res.rows += all.length;
        await saveRows(cfg, all, ctx, res, mode);
        const cutoff = new Date(Date.now() - EXTERNAL_TTL_DAYS * 86_400_000);
        const stale = await db
          .update(listings)
          .set({ status: "hidden" })
          .where(and(eq(listings.source, cfg.source), eq(listings.status, "active"), lt(listings.updatedAt, cutoff)))
          .returning({ id: listings.id });
        res.removed += stale.length;
      }
      const set = mode === "full" ? { lastFullAt: started, lastResult: res as unknown as Record<string, unknown> } : { lastQuickAt: started };
      await db.insert(crawlState).values({ name: cfg.key, ...set }).onConflictDoUpdate({ target: crawlState.name, set });
    } catch (err) {
      res.errors.push(`${cfg.brand}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  res.ms = Date.now() - started.getTime();
  return res;
}

export function toyotaEnabled() {
  const v = process.env.TOYOTA_CRAWL;
  return v === "on" || (process.env.NODE_ENV === "production" && v !== "off");
}

/** Plānotāja solis: ātrā vai pilnā kārta, ja pienācis laiks; citādi null. */
export async function tickToyota(): Promise<CrawlResult | null> {
  const st = await db.query.crawlState.findFirst({ where: eq(crawlState.name, TOYOTA.key) });
  const now = Date.now();
  const fullDue = !st?.lastFullAt || now - st.lastFullAt.getTime() > TOYOTA.fullEveryHours * 3600_000;
  const quickDue = !st?.lastQuickAt || now - st.lastQuickAt.getTime() > TOYOTA.quickEveryMin * 60_000;
  if (!fullDue && !quickDue) return null;
  return crawlToyota(fullDue ? "full" : "quick");
}
