// veho.lv (Mercedes-Benz oficiālais dīleris Latvijā; arī citu zīmolu treid-in auto) ievākšana.
// Mājaslapa ir Next.js ar Cookiebot, bet auto saraksts nāk no atklāta JSON API
// (https://veho.lv/api/vehicle-search/?page=N&vehicle_base_type[]=car&category=used) — bez
// bot aizsardzības, pietiek ar parasto HTTP (servera plūsma). Detaļu lapas neatveram:
// API dod marku, modeli, gadu, cenu, nobraukumu, degvielu, VIN, bildes un salona pilsētu.
// Virsrakstus veidojam paši no faktiem, tāpat kā ss.com. Ātrumkārbas/tilpuma API nedod.
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { EXTERNAL_TTL_DAYS, VEHO } from "../constants";
import { linkDuplicate } from "../dedupe";
import { inferBody } from "../illustrations";
import { findMake, matchModel, vehicleTitle, type ImportRow, type MakeRow, type ModelRow, type PlaceRow } from "./ss-rss";
import { loadCtx } from "./ss-pages";

const { listings, priceHistory, crawlState } = schema;

export type VehoRow = {
  link: string;
  externalId: string; // "P-000000000000000012" (unikāls visā Veho sistēmā)
  makeRaw: string;
  modelRaw: string;
  typeRaw: string; // pilns nosaukums, piem. "Mercedes-Benz EQE 350"
  price: number;
  year: number | null;
  mileageKm: number | null;
  fuelRaw: string | null;
  thumb: string | null;
  city: string | null;
};

type VehoVehicle = {
  external_id?: string;
  make?: string;
  model?: string;
  type?: string;
  model_year?: number;
  mileageNum?: number;
  fuel?: string;
  price?: string;
  images?: string[];
  href?: string;
  locationData?: { city?: string };
};

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36", Accept: "application/json" };

/** Viena API lapa (0-bāzēta). */
export async function fetchPage(page: number): Promise<{ vehicles: VehoVehicle[]; totalPages: number }> {
  const r = await fetch(`${VEHO.url}?page=${page}&vehicle_base_type%5B%5D=car&category=used&stage-language=lv`, { headers: UA });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = (await r.json()) as { vehicles?: VehoVehicle[]; paging?: { totalPages?: number } };
  return { vehicles: d.vehicles ?? [], totalPages: d.paging?.totalPages ?? 1 };
}

/** Detaļu lapas URL (pārbaudīts pārlūkā): /vieglie-auto/vehicle-page-lv/<marka>/<modelis>/<id>/ */
const pageUrl = (make: string, model: string, id: string) =>
  `https://veho.lv/vieglie-auto/vehicle-page-lv/${encodeURIComponent(make.toLowerCase())}/${encodeURIComponent(model.toLowerCase())}/${encodeURIComponent(id)}/`;

/** API auto objekts → mūsu rinda. */
export function mapVehicle(v: VehoVehicle): VehoRow | null {
  const pid = v.href?.match(/P-\d{6,}/)?.[0];
  const id = v.external_id?.trim();
  if (!pid || !id) return null;
  const price = Number((v.price ?? "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(price) || price < 300 || price > 1_000_000) return null;
  const year = v.model_year && v.model_year > 1950 && v.model_year < 2100 ? v.model_year : null;
  const km = v.mileageNum;
  return {
    link: pageUrl(v.make ?? "", v.model ?? "", id),
    externalId: pid,
    makeRaw: v.make?.trim() ?? "",
    modelRaw: v.model?.trim() ?? "",
    typeRaw: v.type?.trim() ?? "",
    price,
    year,
    mileageKm: typeof km === "number" && km >= 0 && km < 2_000_000 ? km : null,
    fuelRaw: v.fuel ?? null,
    thumb: v.images?.[0] ?? null,
    city: v.locationData?.city ?? null,
  };
}

/** "diesel" / "hybrid_petrol" / "electric" → mūsu FUELS. */
function mapFuel(v?: string | null) {
  const s = (v ?? "").toLowerCase();
  if (!s) return null;
  if (s.includes("hybrid")) return "Hibrīds";
  if (s.includes("electric")) return "Elektro";
  if (s.includes("diesel")) return "Dīzelis";
  if (s.includes("petrol") || s.includes("gasoline")) return "Benzīns";
  return null;
}

type Ctx = { makes: MakeRow[]; models: ModelRow[]; findCity: (t: string) => PlaceRow | null };

/** Rinda → mūsu sludinājums. */
export function mapRow(r: VehoRow, ctx: Ctx, createdAt: Date): ImportRow | null {
  const make = findMake(ctx.makes, "car", r.makeRaw);
  const model = make ? matchModel(ctx.models, make.id, r.modelRaw, make.name) : null;
  const modelName = model?.name ?? r.modelRaw;
  const fuel = mapFuel(r.fuelRaw);
  const title = vehicleTitle(make?.name ?? r.makeRaw, modelName, null, fuel, r.year);
  if (!title) return null;
  const city = r.city ? ctx.findCity(r.city) : null;
  return {
    kind: "vehicle",
    status: "active",
    source: "veho.lv",
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
    engineL: null,
    powerKw: null,
    fuel,
    gearbox: null,
    body: inferBody(modelName) ?? inferBody(r.typeRaw),
    color: null,
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

/** Saglabā lapas rindas: jaunos ievieto, esošajiem atjauno cenu un "redzēts" laiku. */
async function saveRows(rows: VehoRow[], ctx: Ctx, res: CrawlResult, mode: "quick" | "full") {
  const now = new Date();
  const createdAt = mode === "full" ? new Date(now.getTime() - 86_400_000) : now;
  const mapped = rows.map((r) => mapRow(r, ctx, createdAt)).filter((x): x is ImportRow => Boolean(x));
  const byId = new Map(mapped.map((m) => [m.externalId!, m]));
  if (!byId.size) return;
  const existing = await db
    .select({ id: listings.id, externalId: listings.externalId, price: listings.price, status: listings.status, thumb: listings.externalThumbUrl, makeId: listings.makeId, modelId: listings.modelId })
    .from(listings)
    .where(and(eq(listings.source, "veho.lv"), inArray(listings.externalId, [...byId.keys()])));
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
 * Viena kārta. "quick": pirmā lapa (jaunākie). "full": visas lapas (pašlaik ~30 auto);
 * izdzēstie (ilgāk par EXTERNAL_TTL_DAYS neredzētie) tiek paslēpti.
 */
export async function crawlVeho(mode: "quick" | "full"): Promise<CrawlResult> {
  const started = new Date();
  const res: CrawlResult = { mode, pages: 0, rows: 0, created: 0, updated: 0, priceChanged: 0, duplicates: 0, removed: 0, errors: [], ms: 0 };
  const fullCtx = await loadCtx();
  const ctx: Ctx = { makes: fullCtx.makes, models: fullCtx.models, findCity: fullCtx.findCity };
  try {
    const first = await fetchPage(0);
    const rows = first.vehicles.map(mapVehicle).filter((x): x is VehoRow => Boolean(x));
    res.pages = 1;
    if (mode === "full") {
      for (let p = 1; p < first.totalPages; p++) {
        const d = await fetchPage(p);
        rows.push(...d.vehicles.map(mapVehicle).filter((x): x is VehoRow => Boolean(x)));
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
      .where(and(eq(listings.source, "veho.lv"), eq(listings.status, "active"), lt(listings.updatedAt, cutoff)))
      .returning({ id: listings.id });
    res.removed = stale.length;
  }
  res.ms = Date.now() - started.getTime();

  const set = mode === "full" ? { lastFullAt: started, lastResult: res as unknown as Record<string, unknown> } : { lastQuickAt: started };
  await db.insert(crawlState).values({ name: VEHO.key, ...set }).onConflictDoUpdate({ target: crawlState.name, set });
  return res;
}

export function vehoEnabled() {
  const v = process.env.VEHO_CRAWL;
  return v === "on" || (process.env.NODE_ENV === "production" && v !== "off");
}

/** Plānotāja solis: ātrā vai pilnā kārta, ja pienācis laiks; citādi null. */
export async function tickVeho(): Promise<CrawlResult | null> {
  const st = await db.query.crawlState.findFirst({ where: eq(crawlState.name, VEHO.key) });
  const now = Date.now();
  const fullDue = !st?.lastFullAt || now - st.lastFullAt.getTime() > VEHO.fullEveryHours * 3600_000;
  const quickDue = !st?.lastQuickAt || now - st.lastQuickAt.getTime() > VEHO.quickEveryMin * 60_000;
  if (!fullDue && !quickDue) return null;
  return crawlVeho(fullDue ? "full" : "quick");
}
