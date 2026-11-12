// pp.lv sludinājumu ievākšana caur portāla publisko JSON API (bez Cloudflare — pietiek ar parasto HTTP).
// API: GET https://apipub.pp.lv/lv/api_user/v1/categories/<id>/lots?orderDirection=DESC&orderColumn=orderDate
// (20 jaunākie ieraksti; lapošanas parametru API neatbalsta, tāpēc lasām tikai pirmo lapu — vecākus
// sludinājumus paņem ienākšanas brīdī, pārējos paslēpj EXTERNAL_TTL_DAYS noteikums).
// Fakti nāk strukturēti no adFilterValues (gads/nobraukums/tilpums/ātrumkārba/virsbūve/krāsa auto;
// istabas/platība/stāvs īpašumiem), vieta — no publicLocation (regiona vecāku ķēdes augšgalā pilsēta,
// īpašumiem bieži arī koordinātes un adrese). Darījuma veids (pārdod/īrē) — no action.name.
// Bildes rādām no img.pp.lv (640x480), neglabājam.
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { BODY_TYPES, COLORS, EXTERNAL_TTL_DAYS, PP_CRAWL, PP_SECTIONS, type PropertyType, type VehicleClass } from "../constants";
import { linkDuplicate } from "../dedupe";
import { inferBody } from "../illustrations";
import { landLabel } from "../listing-input";
import { mapFuel, mapGearbox } from "./autoplius-pages";
import { findMake, matchModel, slug, vehicleTitle, type ImportRow, type MakeRow, type ModelRow, type PlaceRow } from "./ss-rss";
import { loadCtx } from "./ss-pages";

const { listings, priceHistory, crawlState } = schema;

export type PpSection = {
  key: string;
  catId: number;
  kind: "vehicle" | "property";
  vehicleClass?: VehicleClass;
  propertyType?: PropertyType;
};

type PpRegion = { id: number; name: string; slug?: string; parent?: PpRegion | null };
type PpFilter = { filter?: { name?: string } | null; value?: { displayValue?: string | number } | null; textValue?: string | number | null };
export type PpLot = {
  id: number;
  title: string;
  frontUrl: string;
  action?: { name?: string } | null;
  prices?: { value: string; priceType?: { name?: string } | null }[] | null;
  publicLocation?: {
    region?: PpRegion | null;
    coordinateX?: number | null;
    coordinateY?: number | null;
    address?: string | null;
    accurateCoordinates?: boolean;
  } | null;
  thumbnail?: { storageId: string; extension: string } | null;
  adFilterValues?: PpFilter[] | null;
  category?: { slug?: { en?: string } } | null;
};

/** Bilžu serveris: storageId sadalīts pa diviem simboliem ceļā (rādām no img.pp.lv, neglabājam). */
const thumbOf = (t: PpLot["thumbnail"]) => (t ? `https://img.pp.lv/storage/${t.storageId.slice(0, 2)}/${t.storageId.slice(2, 4)}/${t.storageId}/640x480.${t.extension || "jpg"}` : null);

/** Publiskā API jaunāko sludinājumu lapa (20 ieraksti). */
export async function fetchLots(catId: number): Promise<PpLot[]> {
  const r = await fetch(`https://apipub.pp.lv/lv/api_user/v1/categories/${catId}/lots?orderDirection=DESC&orderColumn=orderDate`, {
    headers: { Referer: "https://pp.lv/", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36" },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = (await r.json()) as { content?: { data?: PpLot[] } };
  if (!d.content?.data) throw new Error("API atbildes kļūda");
  return d.content.data;
}

type Ctx = { makes: MakeRow[]; models: ModelRow[]; findCity: (t: string) => PlaceRow | null };

/** adFilterValues → vārdnīca "filtra nosaukums" → "vērtība". */
function filterMap(lot: PpLot): Map<string, string> {
  const m = new Map<string, string>();
  for (const f of lot.adFilterValues ?? []) {
    const name = f.filter?.name;
    const raw = f.value?.displayValue ?? f.textValue ?? undefined;
    if (name && raw != null) m.set(name, String(raw));
  }
  return m;
}

const numFrom = (s: string | undefined) => {
  const m = s?.replace(/[\s ]/g, "").match(/^\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(",", ".")) || null : null;
};

/** Cena: pārdošanai tips "Cena", īrei "Par mēnesi" (citus tipus, piem. "Par m²", ignorējam). */
function priceOf(lot: PpLot): number | null {
  const ps = lot.prices ?? [];
  const p = ps.find((x) => x.priceType?.name === "Cena") ?? ps.find((x) => x.priceType?.name === "Par mēnesi") ?? ps[0];
  const v = p ? Number(p.value) : NaN;
  return Number.isFinite(v) ? Math.round(v) : null;
}

/** Darījuma veids no action.name ("Pārdod"/"Īrē"/"Izīrē"); pārējie (piem. "Pērk") nav sludinājumi. */
function dealOf(lot: PpLot): "sell" | "rent" | null {
  const a = (lot.action?.name ?? "").toLowerCase();
  if (a.startsWith("pārdod")) return "sell";
  if (a.includes("īrē")) return "rent";
  return null;
}

/** Pilsēta no regiona vecāku ķēdes: mēģina no augšējā līmeņa (pilsēta/novads) līdz apkaimei. */
function findPlace(region: PpRegion | null | undefined, ctx: Ctx): PlaceRow | null {
  const chain: PpRegion[] = [];
  for (let r: PpRegion | null | undefined = region; r; r = r.parent) chain.push(r);
  for (const r of chain.reverse()) {
    const p = ctx.findCity(r.name);
    if (p) return p;
  }
  return null;
}

// pp.lv lieto vīriešu dzimtes krāsu/virsbūves formas — pārvedam uz mūsu katalogu
const COLOR_MAP: Record<string, (typeof COLORS)[number]> = {
  melns: "Melna", balta: "Balta", pelēks: "Pelēka", sudraba: "Sudraba", zils: "Zila", sarkans: "Sarkana",
  zaļš: "Zaļa", brūns: "Brūna", oranžs: "Cita", dzeltens: "Cita", violets: "Cita", rozā: "Cita", bēšs: "Cita", cits: "Cita",
};
const BODY_MAP: Record<string, string> = {
  sedans: "Sedans", limuzīns: "Sedans", "universālis": "Universāls", hečbeks: "Hečbeks", apvidus: "Apvidus", krosovers: "Apvidus",
  minivens: "Minivens", kupeja: "Kupeja", kabriolets: "Kabriolets", pikaps: "Pikaps", mikroautobuss: "Mikroautobuss",
};

/** Strukturētie auto fakti + kategorijas slug (transports/vieglie-auto/<marka>/<modelis>) → sludinājums. */
export function mapVehicle(lot: PpLot, vc: VehicleClass, ctx: Ctx, now: Date): ImportRow | null {
  const f = filterMap(lot);
  const slugEn = lot.category?.slug?.en ?? "";
  const parts = slugEn.split("/").filter(Boolean); // piem. transport/vieglie-auto/volkswagen/amarok
  const makes = ctx.makes.filter((m) => m.vehicleClass === vc).sort((a, b) => slug(b.name).length - slug(a.name).length);
  let make = makes.find((m) => slug(m.name) === parts[2]) ?? null;
  let modelRaw = make ? (parts[3] ?? "").replace(/-/g, " ").trim() : "";
  if (!make) {
    // rezerve: pirmā virsraksta vārda marka (kā zip.lv)
    const firstWord = (lot.title.split(/\s+/)[0] ?? "").replace(/[,;:.]/g, "");
    make = firstWord ? findMake(ctx.makes, vc, firstWord) : null;
    modelRaw = make && !modelRaw ? lot.title.slice(firstWord.length).trim().split(/[,.]/)[0]!.trim() : modelRaw;
  }
  const model = make ? matchModel(ctx.models, make.id, modelRaw, make.name) : null;
  const makeName = make?.name ?? "";
  const modelName = model?.name ?? modelRaw;
  if (!makeName) return null;

  const year = numFrom(f.get("Izlaiduma gads"));
  const mileageParsed = numFrom(f.get("Nobraukums, km"));
  const mileageKm = mileageParsed != null && mileageParsed <= 2_000_000 ? Math.round(mileageParsed) : null;
  const fuelRaw = f.get("Degvielas tips");
  const fuel = mapFuel(fuelRaw) ?? (fuelRaw?.toLowerCase().startsWith("hibr") ? "Hibrīds" : null);
  const engineParsed = f.get("Motora tilpums")?.replace(",", ".") ?? null;
  // engine_l kolonna ir numeric(4,2): derīgs 0.4–20 l
  const engineL = engineParsed && Number(engineParsed) >= 0.4 && Number(engineParsed) <= 20 ? Number(engineParsed).toFixed(2).replace(/\.?0+$/, "") : null;
  const gearbox = mapGearbox(f.get("Ātrumkārba"));
  const bodyRaw = (f.get("Virsbūves tips") ?? "").toLowerCase();
  const body = BODY_MAP[bodyRaw] ?? (vc !== "car" ? ((BODY_TYPES[vc] as readonly string[]).find((b) => b.toLowerCase() === bodyRaw) ?? null) : null);
  const color = COLOR_MAP[(f.get("Krāsa") ?? "").toLowerCase()] ?? null;

  const place = findPlace(lot.publicLocation?.region, ctx);
  const title = vehicleTitle(makeName, modelName, engineL, fuel, year != null ? Math.round(year) : null);
  if (!title) return null;
  const price = priceOf(lot);
  if (price == null || price < 30 || price > 50_000_000) return null;
  return {
    kind: "vehicle",
    status: "active",
    source: "pp.lv",
    externalUrl: lot.frontUrl,
    externalId: String(lot.id),
    externalThumbUrl: thumbOf(lot.thumbnail),
    title: title.slice(0, 120),
    vehicleClass: vc,
    makeId: make?.id ?? null,
    modelId: model?.id ?? null,
    makeText: make ? null : makeName || null,
    modelText: model ? null : modelRaw || null,
    year: year != null ? Math.round(year) : null,
    mileageKm,
    engineL,
    fuel,
    gearbox,
    color,
    body: body ?? inferBody(modelName) ?? inferBody(modelRaw),
    placeId: place?.id ?? null,
    lat: place ? place.lat + (Math.random() - 0.5) * 0.01 : null,
    lon: place ? place.lon + (Math.random() - 0.5) * 0.02 : null,
    geoPrecision: place ? "place" : null,
    price,
    createdAt: now,
    updatedAt: now,
  };
}

/** Strukturētie īpašuma fakti + publicLocation (adrese/koordinātes) → sludinājums. */
export function mapProperty(lot: PpLot, section: PpSection, ctx: Ctx, now: Date): ImportRow | null {
  const ptype = section.propertyType!;
  const f = filterMap(lot);
  const loc = lot.publicLocation;
  const place = findPlace(loc?.region, ctx);
  const street = loc?.address?.trim().slice(0, 80) || null;

  const rooms = numFrom(f.get("Istabu skaits"));
  const floor = numFrom(f.get("Stāvs"));
  const floors = numFrom(f.get("Stāvu skaits"));
  const areaM2 = numFrom(f.get("Platība, m2"));
  // "Zemes platība" reizēm satur tikai mērvienību ("m2") — ņemam tikai skaitliskās vērtības
  const landM2raw = numFrom(f.get("Zemes platība"));
  const landM2 = ptype === "Zeme" ? (landM2raw ?? (areaM2 != null ? Math.round(areaM2) : null)) : landM2raw != null ? Math.round(landM2raw) : null;

  const where = place ? `, ${slug(place.name) === "centrs" ? place.region : place.name}` : "";
  const area = areaM2 != null ? (Number.isInteger(areaM2) ? String(areaM2) : areaM2.toFixed(2).replace(/0$/, "")) : "";
  const title =
    ptype === "Dzīvoklis"
      ? `${rooms ?? 1}-istabu dzīvoklis${area ? `, ${area} m²` : ""}${where}`
      : ptype === "Māja"
        ? `Privātmāja${area ? ` ${area} m²` : ""}${where}`
        : `Zemes gabals${landM2 ? ` ${landLabel(landM2)}` : ""}${where}`;

  // koordinātes: ja avots dod precīzas, mazliet izjaucam; citādi pilsētas centrs ar lielāku izkliedi
  const hasCoords = Number.isFinite(loc?.coordinateX) && Number.isFinite(loc?.coordinateY);
  const lat = hasCoords ? loc!.coordinateX! + (Math.random() - 0.5) * 0.0016 : place ? place.lat + (Math.random() - 0.5) * 0.006 : null;
  const lon = hasCoords ? loc!.coordinateY! + (Math.random() - 0.5) * 0.003 : place ? place.lon + (Math.random() - 0.5) * 0.012 : null;

  const deal = dealOf(lot);
  if (!deal) return null; // "Pērk"/"Maina" u.tml. nav pārdošanas sludinājumi
  const price = priceOf(lot);
  if (price == null || price < 30 || price > 50_000_000) return null;
  return {
    kind: "property",
    status: "active",
    source: "pp.lv",
    externalUrl: lot.frontUrl,
    externalId: String(lot.id),
    externalThumbUrl: thumbOf(lot.thumbnail),
    title: title.slice(0, 120),
    address: street && place ? `${street}, ${slug(place.name) === "centrs" ? place.region : `${place.name}, ${place.region}`}` : null,
    geoPrecision: place || hasCoords ? "place" : null,
    propertyType: ptype,
    deal,
    rooms: ptype === "Zeme" ? null : rooms != null ? Math.round(rooms) : null,
    areaM2: areaM2 != null ? String(areaM2) : null,
    landM2,
    floor: ptype === "Dzīvoklis" && floor != null ? Math.round(floor) : null,
    floors: floors != null ? Math.round(floors) : null,
    placeId: place?.id ?? null,
    lat,
    lon,
    price,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapLot(lot: PpLot, section: PpSection, ctx: Ctx, now: Date): ImportRow | null {
  return section.kind === "vehicle" ? mapVehicle(lot, section.vehicleClass ?? "car", ctx, now) : mapProperty(lot, section, ctx, now);
}

export type CrawlResult = { mode: "quick" | "full"; pages: number; rows: number; created: number; updated: number; priceChanged: number; duplicates: number; removed: number; errors: string[]; ms: number };

/** Saglabā lapas ierakstus: jaunos ievieto, esošajiem atjauno cenu un "redzēts" laiku. */
async function saveRows(items: PpLot[], section: PpSection, ctx: Ctx, res: CrawlResult) {
  const now = new Date();
  const mapped = items.map((i) => mapLot(i, section, ctx, now)).filter((x): x is ImportRow => Boolean(x));
  const byId = new Map(mapped.map((m) => [m.externalId!, m]));
  if (!byId.size) return;
  const existing = await db
    .select({ id: listings.id, externalId: listings.externalId, price: listings.price, status: listings.status, thumb: listings.externalThumbUrl, makeId: listings.makeId, modelId: listings.modelId, placeId: listings.placeId })
    .from(listings)
    .where(and(eq(listings.source, "pp.lv"), inArray(listings.externalId, [...byId.keys()])));
  const seen = new Set<string>();
  const touch: string[] = [];
  for (const e of existing) {
    seen.add(e.externalId!);
    const row = byId.get(e.externalId!)!;
    if (e.status === "hidden") continue; // paslēpis moderators: neaiztiekam
    const better = (row.makeId && !e.makeId) || (row.modelId && !e.modelId);
    const newPlace = row.placeId && !e.placeId;
    if (e.price !== row.price || e.status === "deleted" || e.thumb !== row.externalThumbUrl || better || newPlace) {
      await db
        .update(listings)
        .set({
          price: row.price,
          status: "active",
          externalThumbUrl: row.externalThumbUrl,
          updatedAt: now,
          ...(e.price !== row.price ? { firstPrice: sql`coalesce(${listings.firstPrice}, ${e.price})` } : {}),
          ...(newPlace ? { placeId: row.placeId, lat: row.lat, lon: row.lon, geoPrecision: "place" } : {}),
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
 * Vienas kategorijas kārta. Gan "quick", gan "full" lasa to pašu pirmo lapu (API lapošanu neatbalsta);
 * "full" papildus paslēpj tos pašus ierakstus, kas ilgāk par EXTERNAL_TTL_DAYS nav parādījušies sarakstā.
 */
export async function crawlPpSection(section: PpSection, mode: "quick" | "full"): Promise<CrawlResult> {
  const started = new Date();
  const res: CrawlResult = { mode, pages: 0, rows: 0, created: 0, updated: 0, priceChanged: 0, duplicates: 0, removed: 0, errors: [], ms: 0 };
  const fullCtx = await loadCtx();
  const ctx: Ctx = { makes: fullCtx.makes, models: fullCtx.models, findCity: fullCtx.findCity };
  try {
    const items = await fetchLots(section.catId);
    res.pages = 1;
    res.rows = items.length;
    await saveRows(items, section, ctx, res);
  } catch (err) {
    res.errors.push(err instanceof Error ? err.message : String(err));
  }

  if (mode === "full") {
    const cutoff = new Date(Date.now() - EXTERNAL_TTL_DAYS * 86_400_000);
    const stale = await db
      .update(listings)
      .set({ status: "hidden" })
      .where(
        and(
          eq(listings.source, "pp.lv"),
          eq(listings.kind, section.kind),
          section.kind === "vehicle" ? eq(listings.vehicleClass, section.vehicleClass ?? "car") : eq(listings.propertyType, section.propertyType ?? "Dzīvoklis"),
          eq(listings.status, "active"),
          lt(listings.updatedAt, cutoff),
        ),
      )
      .returning({ id: listings.id });
    res.removed = stale.length;
  }
  res.ms = Date.now() - started.getTime();

  const set = mode === "full" ? { lastFullAt: started, lastResult: res as unknown as Record<string, unknown> } : { lastQuickAt: started };
  await db.insert(crawlState).values({ name: section.key, ...set }).onConflictDoUpdate({ target: crawlState.name, set });
  return res;
}

export function ppEnabled() {
  const v = process.env.PP_CRAWL;
  return v === "on" || (process.env.NODE_ENV === "production" && v !== "off");
}

/** Plānotāja solis: pa vienai kategorijai izpilda ātro vai pilno kārtu, ja pienācis laiks; citādi null. */
export async function tickPp(): Promise<(CrawlResult & { section: string }) | null> {
  const state = new Map((await db.select().from(crawlState)).map((s) => [s.name, s]));
  const now = Date.now();
  for (const section of PP_SECTIONS) {
    const st = state.get(section.key);
    const fullDue = !st?.lastFullAt || now - st.lastFullAt.getTime() > PP_CRAWL.fullEveryHours * 3600_000;
    const quickDue = !st?.lastQuickAt || now - st.lastQuickAt.getTime() > PP_CRAWL.quickEveryMin * 60_000;
    if (!fullDue && !quickDue) continue;
    const r = await crawlPpSection(section, fullDue ? "full" : "quick");
    return { ...r, section: section.key };
  }
  return null;
}
