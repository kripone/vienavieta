// zip.lv sludinājumu ievākšana caur portāla publisko JSON API (bez Cloudflare — pietiek ar parasto HTTP).
// API: GET https://zip.lv/api/public/lv/classifieds/items/list?cat_id=<id>&page=<n> (18 rindas lapā).
// Lasa tikai saraksta datus: cena, virsraksta fakti (marka/modelis/gads vai adrese), parametru rinda
// (virsbūve/degviela/tilpums/ātrumkārba auto; pilsēta/istabas/stāvs/platība īpašumiem) un sīktēla adrese
// (bildes rādām no i.zip.lv ar avota norādi, neglabājam). Auto atrašanās vietu (sarakstā tās nav)
// nolasām no sludinājuma lapas tikai jaunajiem ierakstiem. Virsrakstus veidojam paši no faktiem.
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { BODY_TYPES, COLORS, EXTERNAL_TTL_DAYS, FUELS, ZIP_CRAWL, ZIP_SECTIONS, type PropertyType, type VehicleClass } from "../constants";
import { linkDuplicate } from "../dedupe";
import { inferBody } from "../illustrations";
import { landLabel } from "../listing-input";
import { findMake, matchModel, slug, vehicleTitle, type ImportRow, type MakeRow, type ModelRow, type PlaceRow } from "./ss-rss";
import { loadCtx } from "./ss-pages";

const { listings, priceHistory, crawlState } = schema;

export type ZipSection = {
  key: string;
  catId: number;
  kind: "vehicle" | "property";
  vehicleClass?: VehicleClass;
  propertyType?: PropertyType;
  deal?: "sell" | "rent";
};

type ZipImage = { path: string; filename: string };
export type ZipItem = {
  id: number;
  price: number;
  price_type: string;
  f_title: string;
  subtitle_data: string[];
  descr: string;
  images: ZipImage[];
  view_url: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Bilžu serveris: sīktēls ar zm_ priedēkli (rādām no zip.lv, neglabājam). */
const thumbOf = (images: ZipImage[]) => (images[0] ? `https://i.zip.lv/${images[0].path}zm_${images[0].filename}` : null);

/** Publiskā API viena lapa. Atgriež tukšu sarakstu kļūdas gadījumā (met kļūdu, ja nav JSON). */
export async function fetchListPage(catId: number, page: number): Promise<{ items: ZipItem[]; qty: number; pageSize: number }> {
  const r = await fetch(`https://zip.lv/api/public/lv/classifieds/items/list?cat_id=${catId}&page=${page}`, {
    headers: { "X-App-Request": "zip-app", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36" },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = (await r.json()) as { success: boolean; data?: { result?: { qty: number; page_size: number; items: ZipItem[] } } };
  if (!d.success || !d.data?.result) throw new Error("API atbildes kļūda");
  return { items: d.data.result.items, qty: d.data.result.qty, pageSize: d.data.result.page_size || 18 };
}

/** Auto sludinājuma lapā ir "Vieta" lauks (saraksta API to nesatur). */
async function fetchVehicleCity(viewUrl: string): Promise<string | null> {
  const r = await fetch(`https://zip.lv${viewUrl}`, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) return null;
  const html = await r.text();
  const m = html.match(/Vieta<\/b>\s*<span[^>]*>([^<]{2,60})</);
  return m ? m[1].trim() : null;
}

type Ctx = { makes: MakeRow[]; models: ModelRow[]; findCity: (t: string) => PlaceRow | null };

const num = (s: string | undefined, re: RegExp) => {
  const m = s?.match(re);
  return m ? Number(m[1].replace(/[\s ]/g, "").replace(",", ".")) || null : null;
};

/** "BMW 520, 2001" → marka/modelis/gads; parametru rinda → virsbūve/degviela/tilpums/ātrumkārba. */
export function mapVehicle(item: ZipItem, vc: VehicleClass, ctx: Ctx, createdAt: Date): ImportRow | null {
  const titleM = item.f_title.match(/^(.+?),\s*((?:19|20)\d{2})\s*$/) ?? item.f_title.match(/^(.*?)\s*((?:19|20)\d{2})$/);
  const nameRaw = (titleM ? titleM[1] : item.f_title).trim();
  const year = titleM ? Number(titleM[2]) : null;
  if (!nameRaw) return null;

  const makes = ctx.makes.filter((m) => m.vehicleClass === vc).sort((a, b) => slug(b.name).length - slug(a.name).length);
  const nameSlug = slug(nameRaw);
  let make = makes.find((m) => nameSlug === slug(m.name) || nameSlug.startsWith(`${slug(m.name)}-`)) ?? null;
  let modelRaw = make ? nameRaw.trim().slice(make.name.length).replace(/^[\s-]+/, "") : "";
  if (!make) {
    const firstWord = nameRaw.split(/\s+/)[0] ?? "";
    make = findMake(ctx.makes, vc, firstWord);
    modelRaw = nameRaw.slice(firstWord.length).trim();
  }
  const model = make ? matchModel(ctx.models, make.id, modelRaw, make.name) : null;
  const makeName = make?.name ?? nameRaw.split(/\s+/)[0] ?? "";
  const modelName = model?.name ?? modelRaw;

  const sub = item.subtitle_data;
  const engineRaw = sub.find((s) => /litri/i.test(s)) ?? null;
  const engineParsed = engineRaw?.match(/([\d]+(?:[.,]\d+)?)\s*litri/i)?.[1]?.replace(",", ".") ?? null;
  // engine_l kolonna ir numeric(4,2): derīgs 0.4–20 l; dīvainas vērtības (piem. "321333.0") izlaižam
  const engineL = engineParsed && Number(engineParsed) >= 0.4 && Number(engineParsed) <= 20 ? engineParsed : null;
  const fuel = sub.find((s) => (FUELS as readonly string[]).includes(s)) ?? null;
  const gearRaw = sub.find((s) => /automātiska|manuāla/i.test(s)) ?? null;
  const gearbox = gearRaw ? (/^manuāla/i.test(gearRaw) ? "Manuāla" : "Automāts") : null;
  const bodyRaw = vc === "car" ? (sub.find((s) => (BODY_TYPES.car as readonly string[]).includes(s)) ?? null) : null;

  // nobraukums un krāsa sarakstā nav strukturēti — mēģinām no apraksta (tekstu neglabājam)
  const kmParsed = num(item.descr, /(\d{1,3}(?:[\s ]\d{3})+|\d{4,7})\s*km/i);
  const mileageKm = kmParsed != null && kmParsed <= 2_000_000 ? kmParsed : null;
  const colorRaw = item.descr.match(/krāsa\s*[–\-:]\s*([a-zāēīūļķņšžč]+)/i)?.[1] ?? "";
  const color = (COLORS as readonly string[]).find((c) => c.toLowerCase() === colorRaw.toLowerCase()) ?? null;

  const title = vehicleTitle(makeName, modelName, engineL, fuel, year);
  if (!title) return null;
  return {
    kind: "vehicle",
    status: "active",
    source: "zip.lv",
    externalUrl: `https://zip.lv${item.view_url}`,
    externalId: String(item.id),
    externalThumbUrl: thumbOf(item.images),
    title: title.slice(0, 120),
    vehicleClass: vc,
    makeId: make?.id ?? null,
    modelId: model?.id ?? null,
    makeText: make ? null : makeName || null,
    modelText: model ? null : modelRaw || null,
    year,
    mileageKm,
    engineL,
    fuel,
    gearbox,
    color,
    body: bodyRaw ?? inferBody(modelName) ?? inferBody(modelRaw),
    price: item.price,
    createdAt,
    updatedAt: new Date(),
  };
}

/** "Stabu 57, Centrs" + ["Rīga", "2 istabu", "1/5 stāvs", "49m²"] → īpašuma sludinājums. */
export function mapProperty(item: ZipItem, section: ZipSection, ctx: Ctx, createdAt: Date): ImportRow | null {
  const ptype = section.propertyType!;
  const sub = item.subtitle_data;
  // vieta: f_title pēdējā daļa (apkaime/pilsēta/pagasts), rezervē parametru rindas pirmā šūna
  const fParts = item.f_title.split(",").map((p) => p.trim()).filter(Boolean);
  const candidates = [fParts[fParts.length - 1], sub[0]]
    .filter((x): x is string => Boolean(x))
    .flatMap((x) => [x, x.replace(/\s+(pag|nov|pils)\.?$/i, ""), x.replace(/\s+un rajons?$/i, "")]);
  let place: PlaceRow | null = null;
  for (const c of candidates) {
    place = ctx.findCity(c);
    if (place) break;
  }
  const street = fParts.length > 1 ? fParts.slice(0, -1).join(", ").slice(0, 80) : null;

  const rooms = num(sub.find((s) => /istab/i.test(s)), /^(\d+)/);
  const floorM = (sub.find((s) => /^\d+\s*\/\s*\d+\s*st/i.test(s)) ?? "").match(/^(\d+)\s*\/\s*(\d+)/);
  const floorsOnly = num(sub.find((s) => /^\d+\s*stāvi/i.test(s)), /^(\d+)/);
  const areaM2 = num(sub.find((s) => /m²/i.test(s)), /([\d]+(?:[.,]\d+)?)\s*m²/i);
  const landHa = num(sub.find((s) => /ha/i.test(s)), /([\d]+(?:[.,]\d+)?)\s*ha/i);
  const landM2 = landHa != null ? Math.round(landHa * 10000) : null;

  const where = place ? `, ${slug(place.name) === "centrs" ? place.region : place.name}` : "";
  const area = areaM2 != null ? (Number.isInteger(areaM2) ? String(areaM2) : areaM2.toFixed(2).replace(/0$/, "")) : "";
  const title =
    ptype === "Dzīvoklis"
      ? `${rooms ?? 1}-istabu dzīvoklis${area ? `, ${area} m²` : ""}${where}`
      : ptype === "Māja"
        ? `Privātmāja${area ? ` ${area} m²` : ""}${where}`
        : `Zemes gabals${landM2 ? ` ${landLabel(landM2)}` : ""}${where}`;
  return {
    kind: "property",
    status: "active",
    source: "zip.lv",
    externalUrl: `https://zip.lv${item.view_url}`,
    externalId: String(item.id),
    externalThumbUrl: thumbOf(item.images),
    title: title.slice(0, 120),
    address: street && place ? `${street}, ${slug(place.name) === "centrs" ? place.region : `${place.name}, ${place.region}`}` : null,
    geoPrecision: place ? "place" : null,
    propertyType: ptype,
    deal: section.deal,
    rooms: ptype === "Zeme" ? null : rooms,
    areaM2: areaM2 != null ? String(areaM2) : null,
    landM2,
    floor: ptype === "Dzīvoklis" && floorM ? Number(floorM[1]) : null,
    floors: floorM ? Number(floorM[2]) : floorsOnly,
    placeId: place?.id ?? null,
    lat: place ? place.lat + (Math.random() - 0.5) * 0.006 : null,
    lon: place ? place.lon + (Math.random() - 0.5) * 0.012 : null,
    price: item.price,
    createdAt,
    updatedAt: new Date(),
  };
}

export function mapItem(item: ZipItem, section: ZipSection, ctx: Ctx, createdAt: Date): ImportRow | null {
  if (!Number.isFinite(item.price) || item.price < 30 || item.price > 50_000_000) return null;
  return section.kind === "vehicle" ? mapVehicle(item, section.vehicleClass ?? "car", ctx, createdAt) : mapProperty(item, section, ctx, createdAt);
}

export type CrawlResult = { mode: "quick" | "full"; pages: number; rows: number; created: number; updated: number; priceChanged: number; duplicates: number; removed: number; errors: string[]; ms: number };

/** Saglabā vienas lapas ierakstus: jaunos ievieto, esošajiem atjauno cenu un "redzēts" laiku. */
async function saveRows(items: ZipItem[], section: ZipSection, ctx: Ctx, res: CrawlResult, mode: "quick" | "full") {
  const now = new Date();
  // pilnajā kārtā atrastie ir vecāki sludinājumi: lai neaizsprosto "jaunākos", ienākšanas laiks diennakti agrāk
  const createdAt = mode === "full" ? new Date(now.getTime() - 86_400_000) : now;
  const mapped = items.map((i) => mapItem(i, section, ctx, createdAt)).filter((x): x is ImportRow => Boolean(x));
  const byId = new Map(mapped.map((m) => [m.externalId!, m]));
  if (!byId.size) return;
  const existing = await db
    .select({ id: listings.id, externalId: listings.externalId, price: listings.price, status: listings.status, thumb: listings.externalThumbUrl, makeId: listings.makeId, modelId: listings.modelId, placeId: listings.placeId })
    .from(listings)
    .where(and(eq(listings.source, "zip.lv"), inArray(listings.externalId, [...byId.keys()])));
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
  // jaunajiem auto atrašanās vieta nav saraksta API — nolasām no sludinājuma lapas (parasti daži vienā kārtā)
  for (const r of fresh) {
    if (r.kind !== "vehicle" || r.placeId) continue;
    try {
      const cityRaw = await fetchVehicleCity(new URL(r.externalUrl!).pathname);
      // "Apes pagasts, Apes novads" → mēģina katru daļu, arī bez pag./nov. priedēkļa
      const parts = (cityRaw ?? "").split(",").map((p) => p.trim()).filter(Boolean);
      let place: PlaceRow | null = null;
      for (const part of parts) {
        const cleaned = part.replace(/\s+(pag|nov|pils)\.?$/i, "");
        place = ctx.findCity(part) ?? (cleaned !== part ? ctx.findCity(cleaned) : null);
        if (place) break;
      }
      if (place) {
        r.placeId = place.id;
        r.lat = place.lat + (Math.random() - 0.5) * 0.01;
        r.lon = place.lon + (Math.random() - 0.5) * 0.02;
        r.geoPrecision = "place";
      }
      await sleep(800);
    } catch {
      // bez vietas arī der — valsti tad nosaka avots
    }
  }
  if (fresh.length) {
    const ins = await db.insert(listings).values(fresh).onConflictDoNothing().returning({ id: listings.id, price: listings.price });
    if (ins.length) await db.insert(priceHistory).values(ins.map((i) => ({ listingId: i.id, price: i.price })));
    res.created += ins.length;
    for (const i of ins) if (await linkDuplicate(i.id).catch(() => null)) res.duplicates++;
  }
}

/**
 * Vienas kategorijas kārta. "quick": pirmā lapa (jaunie un cenu maiņas).
 * "full": līdz ZIP_CRAWL.maxPages lapām; izdzēstos paslēpj pēc EXTERNAL_TTL_DAYS (kā autoplius.lt).
 */
export async function crawlZipSection(section: ZipSection, mode: "quick" | "full", delayMs = ZIP_CRAWL.delayMs): Promise<CrawlResult> {
  const started = new Date();
  const res: CrawlResult = { mode, pages: 0, rows: 0, created: 0, updated: 0, priceChanged: 0, duplicates: 0, removed: 0, errors: [], ms: 0 };
  const fullCtx = await loadCtx();
  const ctx: Ctx = { makes: fullCtx.makes, models: fullCtx.models, findCity: fullCtx.findCity };
  let last: number = mode === "quick" ? ZIP_CRAWL.quickPages : ZIP_CRAWL.maxPages;
  let failsInRow = 0;
  for (let n = 1; n <= last; n++) {
    try {
      const { items, qty, pageSize } = await fetchListPage(section.catId, n);
      if (n === 1) last = Math.min(last, Math.max(1, Math.ceil(qty / pageSize)));
      res.pages++;
      res.rows += items.length;
      await saveRows(items, section, ctx, res, mode);
      failsInRow = 0;
      if (!items.length) break;
    } catch (err) {
      res.errors.push(`lapa ${n}: ${err instanceof Error ? err.message : err}`);
      if (++failsInRow >= 3) break;
    }
    if (n < last) await sleep(delayMs);
  }

  if (mode === "full") {
    // neredzētos nedzēšam pēc vienas kārtas: paslēpjam tikai tos, kas ilgāk par EXTERNAL_TTL_DAYS
    // nav redzēti nevienā kārtā — avotā izdzēstie vairs neparādās sarakstos
    const cutoff = new Date(Date.now() - EXTERNAL_TTL_DAYS * 86_400_000);
    const stale = await db
      .update(listings)
      .set({ status: "hidden" })
      .where(
        and(
          eq(listings.source, "zip.lv"),
          eq(listings.kind, section.kind),
          section.kind === "vehicle" ? eq(listings.vehicleClass, section.vehicleClass ?? "car") : eq(listings.propertyType, section.propertyType ?? "Dzīvoklis"),
          section.deal ? eq(listings.deal, section.deal) : undefined,
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

export function zipEnabled() {
  const v = process.env.ZIP_CRAWL;
  return v === "on" || (process.env.NODE_ENV === "production" && v !== "off");
}

/** Plānotāja solis: pa vienai kategorijai izpilda ātro vai pilno kārtu, ja pienācis laiks; citādi null. */
export async function tickZip(): Promise<(CrawlResult & { section: string }) | null> {
  const state = new Map((await db.select().from(crawlState)).map((s) => [s.name, s]));
  const now = Date.now();
  for (const section of ZIP_SECTIONS) {
    const st = state.get(section.key);
    const fullDue = !st?.lastFullAt || now - st.lastFullAt.getTime() > ZIP_CRAWL.fullEveryHours * 3600_000;
    const quickDue = !st?.lastQuickAt || now - st.lastQuickAt.getTime() > ZIP_CRAWL.quickEveryMin * 60_000;
    if (!fullDue && !quickDue) continue;
    const r = await crawlZipSection(section, fullDue ? "full" : "quick");
    return { ...r, section: section.key };
  }
  return null;
}
