import { and, asc, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { groupPrimaryOnly } from "./dedupe";
import {
  AMENITIES, BODY_TYPES, COLORS, CONDITIONS, DEALS, DRIVES, FUELS, GEARBOXES, HEATING, MATERIALS, PROPERTY_GROUPS, PROPERTY_TYPES,
  PURPOSES, SERIES, VEHICLE_CLASSES, VEHICLE_CLASS_LABEL, DEAL_LABEL, type VehicleClass,
  REGION_GROUPS_LOC,
  REGION_GROUP_LABEL,
  SOURCE_LABEL,
} from "./constants";

const { listings, places, regions, makes, models, users, listingPhotos } = schema;

const LV_SOURCES = ["own", "ss.com", "mm.lv", "city24.lv", "zip.lv", "pp.lv", "finder.porsche.com", "bravo-auto.lv", "veho.lv", "mollerauto.lv", "toyota.lv", "lexus.lv", "cars.bmwwess.lv"] as const;
const LT_SOURCES = ["autoplius.lt", "aruodas.lt"] as const;

export const PAGE_SIZE = 24;
export const SORTS = ["new", "cheap", "dear", "drop", "old"] as const;

type Raw = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean);
const int = (v: string | string[] | undefined, min = -1e9, max = 2e9) => {
  const n = Number(one(v));
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : undefined;
};
const dec = (v: string | string[] | undefined) => {
  const n = Number(one(v)?.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const pick = <T extends readonly string[]>(v: string | string[] | undefined, list: T) => {
  const s = one(v);
  return s && (list as readonly string[]).includes(s) ? (s as T[number]) : undefined;
};

/** Zona kartē: "lat,lon;lat,lon;…" (3–80 punkti Latvijas un Lietuvas apkaimē). */
function parseZone(v: string | string[] | undefined): [number, number][] | undefined {
  const s = one(v);
  if (!s) return;
  const pts = s.split(";").map((p) => p.split(",").map(Number) as [number, number]);
  if (pts.length < 3 || pts.length > 80) return;
  if (!pts.every(([la, lo]) => la > 53.5 && la < 58.5 && lo > 20 && lo < 29)) return;
  return pts;
}

/** Nolasa un pārbauda meklēšanas parametrus no URL. Nederīgās vērtības tiek ignorētas. */
export function parseSearch(raw: Raw) {
  const cat = pick(raw.cat, ["vehicle", "property"] as const);
  const vc = pick(raw.vc, VEHICLE_CLASSES) ?? (cat === "vehicle" ? "car" : undefined);
  const ptypeRaw = one(raw.ptype);
  const ptype = ptypeRaw?.startsWith("g:") ? (ptypeRaw.slice(2) in PROPERTY_GROUPS ? ptypeRaw : undefined) : pick(raw.ptype, PROPERTY_TYPES);
  const locRaw = one(raw.loc);
  const loc = locRaw && (/^[rp]:\d{1,6}$/.test(locRaw) || locRaw in REGION_GROUPS_LOC) ? locRaw : undefined;
  return {
    cat,
    vc,
    q: one(raw.q)?.slice(0, 80),
    pmin: int(raw.pmin, 0),
    pmax: int(raw.pmax, 0),
    loc,
    // Lietuva ir tikai transportam; pārējās sadaļās meklē Latvijā.
    country: cat === "vehicle" ? pick(raw.country, ["LV", "LT"] as const) : undefined,
    seller: pick(raw.seller, ["private", "dealer", "verified"] as const),
    /** own = tikai VienāVietā, ext = no citiem portāliem */
    src: pick(raw.src, ["own", "ext"] as const),
    /** konkrētu avotu saraksts (piem. "ss.com,autoplius.lt"); tukšs = visi avoti */
    sources: many(raw.sources).filter((x) => x in SOURCE_LABEL),
    sort: pick(raw.sort, SORTS) ?? "new",
    page: int(raw.page, 1, 1000) ?? 1,
    zone: parseZone(raw.zone),
    // transports
    make: int(raw.make, 1),
    model: int(raw.model, 1),
    ymin: int(raw.ymin, 1900, 2100),
    ymax: int(raw.ymax, 1900, 2100),
    kmmax: int(raw.kmmax, 0),
    fuel: pick(raw.fuel, FUELS),
    el: one(raw.el) === "1",
    gear: pick(raw.gear, GEARBOXES),
    body: vc ? pick(raw.body, BODY_TYPES[vc as VehicleClass]) : undefined,
    drive: pick(raw.drive, DRIVES),
    kwmin: int(raw.kwmin, 1),
    ccmin: dec(raw.ccmin),
    ccmax: dec(raw.ccmax),
    color: pick(raw.color, COLORS),
    // īpašumi
    ptype,
    deal: pick(raw.deal, DEALS),
    rmin: int(raw.rmin, 0, 50),
    rmax: int(raw.rmax, 0, 50),
    amin: int(raw.amin, 0),
    amax: int(raw.amax, 0),
    sqmmax: int(raw.sqmmax, 1),
    fmin: int(raw.fmin, -5, 100),
    fmax: int(raw.fmax, -5, 100),
    notfirst: one(raw.notfirst) === "1",
    notlast: one(raw.notlast) === "1",
    lmin: int(raw.lmin, 0),
    lmax: int(raw.lmax, 0),
    series: pick(raw.series, SERIES),
    material: pick(raw.material, MATERIALS),
    heating: pick(raw.heating, HEATING),
    condition: pick(raw.condition, CONDITIONS),
    builtmin: int(raw.builtmin, 1500, 2100),
    purpose: pick(raw.purpose, PURPOSES),
    amen: many(raw.amen).filter((a) => (AMENITIES as readonly string[]).includes(a)),
  };
}
export type SearchParams = ReturnType<typeof parseSearch>;

function conditions(s: SearchParams): SQL[] {
  const c: SQL[] = [eq(listings.status, "active")];
  const add = (x: SQL | undefined) => x && c.push(x);

  if (s.cat) add(eq(listings.kind, s.cat));
  if (s.pmin != null) add(gte(listings.price, s.pmin));
  if (s.pmax != null) add(lte(listings.price, s.pmax));
  if (s.loc) {
    const group = REGION_GROUPS_LOC[s.loc];
    const id = Number(s.loc.slice(2));
    add(
      group ? inArray(regions.name, group)
      // pagasts vai pilsēta: ieskaitot tās ciemus
      : s.loc[0] === "p" ? or(eq(listings.placeId, id), sql`${listings.placeId} in (select id from places where parent_id = ${id})`)!
      : eq(places.regionId, id),
    );
  }
  // Ārējiem sludinājumiem vieta var nebūt zināma (piem. ss.com auto RSS); valsti tad nosaka avots.
  const inCountry = (c: "LV" | "LT") =>
    or(eq(regions.country, c), and(isNull(listings.placeId), inArray(listings.source, c === "LV" ? [...LV_SOURCES] : [...LT_SOURCES])));
  if (s.cat === "vehicle") {
    if (s.country) add(inCountry(s.country));
  } else if (s.cat === "property") {
    // Nekustamais īpašums: tikai Latvija (LT īpašumu avotu pagaidām nav).
    add(inCountry("LV"));
  } else {
    // "Visi": Latvijas sludinājumi + Lietuvas auto (autoplius.lt), lai galvenajā lapā un kartē redzami arī tie.
    add(or(inCountry("LV"), and(eq(listings.kind, "vehicle"), inCountry("LT")))!);
  }
  // dublikāti starp portāliem: viena kartīte grupai (sk. src/lib/dedupe.ts); ar avota filtru rāda visus no tā avota
  if (!s.src && !s.sources.length) add(groupPrimaryOnly);
  if (s.src === "own") add(eq(listings.source, "own"));
  else if (s.src === "ext") add(ne(listings.source, "own"));
  if (s.sources.length) add(inArray(listings.source, s.sources as (typeof listings.$inferSelect.source)[]));
  if (s.seller === "verified") add(isNotNull(users.identityVerifiedAt));
  else if (s.seller === "dealer") add(inArray(users.sellerType, ["dealer", "agency"]));
  else if (s.seller) add(eq(users.sellerType, s.seller));
  if (s.q) {
    const like = `%${s.q.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
    add(or(ilike(listings.title, like), ilike(listings.description, like), ilike(makes.name, like), ilike(models.name, like), ilike(places.name, like), ilike(listings.address, like)));
  }
  if (s.zone) {
    const poly = s.zone.map(([la, lo]) => `(${lo},${la})`).join(",");
    add(sql`point(${listings.lon}, ${listings.lat}) <@ ${`(${poly})`}::polygon`);
  }

  if (s.cat === "vehicle") {
    if (s.vc) add(eq(listings.vehicleClass, s.vc as never));
    if (s.make) add(eq(listings.makeId, s.make));
    if (s.model) add(eq(listings.modelId, s.model));
    if (s.ymin) add(gte(listings.year, s.ymin));
    if (s.ymax) add(lte(listings.year, s.ymax));
    if (s.kmmax != null) add(lte(listings.mileageKm, s.kmmax));
    if (s.el) add(eq(listings.fuel, "Elektro"));
    else if (s.fuel) add(eq(listings.fuel, s.fuel));
    if (s.gear) add(eq(listings.gearbox, s.gear));
    if (s.body) add(eq(listings.body, s.body));
    if (s.drive) add(eq(listings.drive, s.drive));
    if (s.kwmin) add(gte(listings.powerKw, s.kwmin));
    if (s.ccmin != null) add(gte(listings.engineL, String(s.ccmin)));
    if (s.ccmax != null) add(lte(listings.engineL, String(s.ccmax)));
    if (s.color) add(eq(listings.color, s.color));
  }

  if (s.cat === "property") {
    if (s.ptype?.startsWith("g:")) add(inArray(listings.propertyType, [...PROPERTY_GROUPS[s.ptype.slice(2) as keyof typeof PROPERTY_GROUPS]]));
    else if (s.ptype) add(eq(listings.propertyType, s.ptype));
    if (s.deal) add(eq(listings.deal, s.deal as never));
    if (s.rmin != null) add(gte(listings.rooms, s.rmin));
    if (s.rmax != null) add(lte(listings.rooms, s.rmax));
    if (s.amin != null) add(gte(listings.areaM2, String(s.amin)));
    if (s.amax != null) add(lte(listings.areaM2, String(s.amax)));
    if (s.sqmmax) add(sql`${listings.deal} = 'sell' and ${listings.areaM2} > 0 and ${listings.price} / ${listings.areaM2} <= ${s.sqmmax}`);
    if (s.fmin != null) add(gte(listings.floor, s.fmin));
    if (s.fmax != null) add(lte(listings.floor, s.fmax));
    if (s.notfirst) add(sql`${listings.floor} > 1`);
    if (s.notlast) add(sql`${listings.floor} < ${listings.floors}`);
    if (s.lmin != null) add(gte(listings.landM2, s.lmin));
    if (s.lmax != null) add(lte(listings.landM2, s.lmax));
    if (s.series) add(eq(listings.series, s.series));
    if (s.material) add(eq(listings.material, s.material));
    if (s.heating) add(eq(listings.heating, s.heating));
    if (s.condition) add(eq(listings.condition, s.condition));
    if (s.builtmin) add(gte(listings.builtYear, s.builtmin));
    if (s.purpose) add(eq(listings.purpose, s.purpose));
    if (s.amen.length) add(sql`${listings.amenities} @> array[${sql.join(s.amen.map((a) => sql`${a}`), sql`, `)}]::text[]`);
  }
  return c;
}

const coverThumb = sql<string | null>`(select ${listingPhotos.thumbKey} from ${listingPhotos} where ${listingPhotos.listingId} = ${listings.id} order by ${listingPhotos.position} limit 1)`;
const photoCount = sql<number>`(select count(*)::int from ${listingPhotos} where ${listingPhotos.listingId} = ${listings.id})`;

/** Kopējais skaits nemainās bieži: kešojam 60 s (lēna datubāze). */
const countCache = new Map<string, { total: number; at: number }>();
let topCheck = { at: 0, has: false };
/** Vai ir kāds aktīvs TOP sludinājums (pārbauda reizi minūtē). */
async function hasTopListings() {
  if (Date.now() - topCheck.at < 60_000) return topCheck.has;
  const r = await db.execute(sql`select 1 from listings where top_until > now() and status = 'active' limit 1`).catch(() => ({ rows: [1] }));
  topCheck = { at: Date.now(), has: r.rows.length > 0 };
  return topCheck.has;
}

/** Atrod sludinājumus vienai lapai un kopējo skaitu. */
export async function searchListings(s: SearchParams) {
  const where = and(...conditions(s));
  const base = () =>
    db
      .select({
        id: listings.id, kind: listings.kind, status: listings.status, title: listings.title, price: listings.price, deal: listings.deal,
        createdAt: listings.createdAt, year: listings.year, mileageKm: listings.mileageKm, fuel: listings.fuel, gearbox: listings.gearbox,
        body: listings.body, vehicleClass: listings.vehicleClass, color: listings.color, groupKey: listings.groupKey, source: listings.source, externalUrl: listings.externalUrl, externalThumbUrl: listings.externalThumbUrl, makeId: listings.makeId, modelId: listings.modelId, placeId: listings.placeId, propertyType: listings.propertyType, rooms: listings.rooms, areaM2: listings.areaM2, landM2: listings.landM2,
        place: places.name, address: listings.address, region: regions.name, regionKind: regions.kind, thumbKey: coverThumb, photoCount, firstPrice: listings.firstPrice,
      })
      .from(listings)
      .leftJoin(places, eq(listings.placeId, places.id))
      .leftJoin(regions, eq(places.regionId, regions.id))
      .leftJoin(makes, eq(listings.makeId, makes.id))
      .leftJoin(models, eq(listings.modelId, models.id))
      .leftJoin(users, eq(listings.userId, users.id));

  const now = new Date();
  // TOP sludinājumi vienmēr pirmie, tad izvēlētā kārtošana; "uzcelt" skaitās kā jauns
  const top = sql`case when ${listings.topUntil} > ${now} then 0 else 1 end`;
  const fresh = sql`greatest(${listings.createdAt}, coalesce(${listings.bumpedAt}, ${listings.createdAt}))`;
  // "drop": lielākais kritums % no sākuma cenas; "old": visilgāk tirgū
  const dropPct = sql`coalesce((${listings.firstPrice} - ${listings.price})::float / nullif(${listings.firstPrice}, 0), 0)`;
  const order =
    s.sort === "cheap" ? [asc(listings.price)]
    : s.sort === "dear" ? [desc(listings.price)]
    : s.sort === "drop" ? [desc(dropPct)]
    : s.sort === "old" ? [asc(listings.createdAt)]
    : [desc(fresh)];

  // Divos soļos: vispirms tikai lapas ID (lēts kārtojums), tad pilnie dati 24 rindām.
  // Citādi apakšvaicājumi (bildes) izpildās visām atbilstošajām rindām pirms kārtošanas.
  const idsQuery = db
    .select({ id: listings.id })
    .from(listings)
    .leftJoin(places, eq(listings.placeId, places.id))
    .leftJoin(regions, eq(places.regionId, regions.id))
    .leftJoin(makes, eq(listings.makeId, makes.id))
    .leftJoin(models, eq(listings.modelId, models.id))
    .leftJoin(users, eq(listings.userId, users.id))
    .where(where)
    // TOP kārtojums tikai, ja kāds TOP vispār ir (citādi izmanto indeksu listings_fresh_idx)
    .orderBy(...((await hasTopListings()) ? [top] : []), ...order, desc(listings.id))
    .limit(PAGE_SIZE)
    .offset((s.page - 1) * PAGE_SIZE);
  const pageRows = idsQuery.then(async (ids) => {
    if (!ids.length) return [];
    const full = await base().where(inArray(listings.id, ids.map((r) => r.id)));
    const byId = new Map(full.map((r) => [r.id, r]));
    return ids.map((r) => byId.get(r.id)!).filter(Boolean);
  });
  const countKey = JSON.stringify({ ...s, page: 1, sort: "" });
  const cached = countCache.get(countKey);
  const countQuery = cached && cached.at > Date.now() - 60_000 ? Promise.resolve([{ total: cached.total }]) : db
      .select({ total: count() })
      .from(listings)
      .leftJoin(places, eq(listings.placeId, places.id))
      .leftJoin(regions, eq(places.regionId, regions.id))
      .leftJoin(makes, eq(listings.makeId, makes.id))
      .leftJoin(models, eq(listings.modelId, models.id))
      .leftJoin(users, eq(listings.userId, users.id))
      .where(where)
      .then((r) => {
        countCache.set(countKey, { total: r[0].total, at: Date.now() });
        if (countCache.size > 500) countCache.delete(countCache.keys().next().value!);
        return r;
      });
  const [rows, [{ total }]] = await Promise.all([pageRows, countQuery]);
  return { rows, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Kartes skats: robežas un tālummaiņa, ko pārlūks atsūta pēc katras kustības. */
export type MapView = { west: number; south: number; east: number; north: number; zoom: number };
export type MapPoint = { id: string; lat: number; lon: number; kind: "vehicle" | "property"; price: number; title: string };
export type MapCell = { lat: number; lon: number; n: number };
/** Ja redzamajā laukumā ir vairāk sludinājumu, serveris atdod rūtiņu kopsavilkumu (skaits + vidējā vieta), nevis katru punktu. */
export const MAP_POINTS_MAX = 2000;

/**
 * Kartes dati redzamajam laukumam ar tiem pašiem filtriem kā sarakstā (zona netiek piemērota: tā kartē ir uzzīmēta).
 * Skaiti ir īsti: vai nu visi punkti (≤ MAP_POINTS_MAX; tālāk tos klasterē pārlūks), vai rūtiņas ar sludinājumu skaitu.
 */
export async function searchMapView(s: SearchParams, v: MapView): Promise<{ total: number; points?: MapPoint[]; cells?: MapCell[] }> {
  const where = and(...conditions({ ...s, zone: undefined }), isNotNull(listings.lat),
    sql`${listings.lat} between ${v.south} and ${v.north}`, sql`${listings.lon} between ${v.west} and ${v.east}`) ?? sql`true`;
  const from = sql`
      from ${listings}
      left join ${places} on ${eq(listings.placeId, places.id)}
      left join ${regions} on ${eq(places.regionId, regions.id)}
      left join ${makes} on ${eq(listings.makeId, makes.id)}
      left join ${models} on ${eq(listings.modelId, models.id)}
      left join ${users} on ${eq(listings.userId, users.id)}
      where ${where}`;
  const total = Number((await db.execute<{ n: string }>(sql`select count(*) n ${from}`)).rows[0]?.n ?? 0);
  if (total <= MAP_POINTS_MAX) {
    const r = await db.execute(sql`select ${listings.id} as id, ${listings.lat} as lat, ${listings.lon} as lon, ${listings.kind} as kind, ${listings.price} as price, ${listings.title} as title ${from}`);
    return { total, points: (r.rows as MapPoint[]).map((p) => ({ ...p, lat: Number(p.lat), lon: Number(p.lon) })) };
  }
  // rūtiņa ≈ 90 ekrāna pikseļi šajā tālummaiņā (platuma grādi Latvijas platumā ir ~1,8× garāki par garuma grādiem)
  const cx = (360 / (256 * 2 ** v.zoom)) * 90, cy = cx * 0.55;
  const r = await db.execute<{ lat: number; lon: number; n: string }>(sql`
    select avg(${listings.lat}) lat, avg(${listings.lon}) lon, count(*) n ${from}
    group by floor(${listings.lat} / ${cy}), floor(${listings.lon} / ${cx})`);
  return { total, cells: r.rows.map((c) => ({ lat: Number(c.lat), lon: Number(c.lon), n: Number(c.n) })) };
}

/** Pārvērš parametrus atpakaļ URL (izlaižot tukšos un noklusētos). */
export function toQuery(s: Partial<Record<string, unknown>>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(s)) {
    if (v == null || v === "" || v === false || (Array.isArray(v) && !v.length)) continue;
    if (k === "sort" && v === "new") continue;
    if (k === "page" && v === 1) continue;
    if (k === "zone" && Array.isArray(v)) p.set(k, (v as [number, number][]).map(([a, b]) => `${a},${b}`).join(";"));
    else p.set(k, Array.isArray(v) ? v.join(",") : v === true ? "1" : String(v));
  }
  return p.toString();
}

/** Saglabātajai meklēšanai: jaunie sludinājumi kopš `since` (jaunākie pirmie) un to kopskaits. */
export async function newListingsSince(s: SearchParams, since: Date, until: Date, limit = 10) {
  const where = and(...conditions(s), sql`${listings.createdAt} > ${since}`, sql`${listings.createdAt} <= ${until}`);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: listings.id, title: listings.title, price: listings.price, deal: listings.deal, kind: listings.kind,
        place: places.name, address: listings.address, region: regions.name, regionKind: regions.kind, thumbKey: coverThumb,
      })
      .from(listings)
      .leftJoin(places, eq(listings.placeId, places.id))
      .leftJoin(regions, eq(places.regionId, regions.id))
      .leftJoin(makes, eq(listings.makeId, makes.id))
      .leftJoin(models, eq(listings.modelId, models.id))
      .leftJoin(users, eq(listings.userId, users.id))
      .where(where)
      .orderBy(desc(listings.createdAt))
      .limit(limit),
    db
      .select({ total: count() })
      .from(listings)
      .leftJoin(places, eq(listings.placeId, places.id))
      .leftJoin(regions, eq(places.regionId, regions.id))
      .leftJoin(makes, eq(listings.makeId, makes.id))
      .leftJoin(models, eq(listings.modelId, models.id))
      .leftJoin(users, eq(listings.userId, users.id))
      .where(where),
  ]);
  return { rows, total };
}

/** Meklēšanas parametri glabāšanai: tikai derīgie filtri, bez lapas un kārtošanas. */
export function normalizeFilters(raw: Raw): Record<string, string> {
  const s = parseSearch(raw);
  const q = new URLSearchParams(toQuery({ ...s, page: 1, sort: "new" }));
  if (!s.cat) q.delete("vc");
  return Object.fromEntries(q);
}

/** Cilvēkam saprotams saglabātās meklēšanas nosaukums, piem. "Vieglie auto · BMW 3. sērija · līdz 15 000 € · Rīga". */
export async function describeSearch(s: SearchParams) {
  const parts: string[] = [];
  parts.push(s.cat === "vehicle" ? VEHICLE_CLASS_LABEL[(s.vc ?? "car") as VehicleClass] : s.cat === "property" ? (s.ptype?.replace(/^g:/, "") ?? "Nekustamais īpašums") : "Visi sludinājumi");
  if (s.cat === "property" && s.deal) parts.push(DEAL_LABEL[s.deal]);
  if (s.make) {
    const mk = await db.query.makes.findFirst({ where: eq(makes.id, s.make), columns: { name: true } });
    const md = s.model ? await db.query.models.findFirst({ where: eq(models.id, s.model), columns: { name: true } }) : null;
    if (mk) parts.push([mk.name, md?.name].filter(Boolean).join(" "));
  }
  if (s.q) parts.push(`“${s.q}”`);
  const nf = new Intl.NumberFormat("lv-LV");
  if (s.pmin != null && s.pmax != null) parts.push(`${nf.format(s.pmin)}–${nf.format(s.pmax)} €`);
  else if (s.pmax != null) parts.push(`līdz ${nf.format(s.pmax)} €`);
  else if (s.pmin != null) parts.push(`no ${nf.format(s.pmin)} €`);
  if (s.ymin && s.ymin === s.ymax) parts.push(`${s.ymin}. g.`);
  else {
    if (s.ymin) parts.push(`no ${s.ymin}. g.`);
    if (s.ymax) parts.push(`līdz ${s.ymax}. g.`);
  }
  if (s.cat === "vehicle") {
    for (const x of [s.el ? "Elektro" : s.fuel, s.gear, s.body, s.drive, s.color]) if (x) parts.push(x);
    if (s.ccmax != null) parts.push(`dzinējs līdz ${String(s.ccmax).replace(".", ",")} l`);
    if (s.kmmax != null) parts.push(`līdz ${nf.format(s.kmmax)} km`);
  }
  if (s.rmin && s.rmin === s.rmax) parts.push(`${s.rmin} ist.`);
  else if (s.rmin) parts.push(`${s.rmin}+ ist.`);
  if (s.cat === "property") {
    if (s.amin != null && s.amax != null) parts.push(`${s.amin}–${s.amax} m²`);
    else if (s.amin != null) parts.push(`no ${s.amin} m²`);
    else if (s.amax != null) parts.push(`līdz ${s.amax} m²`);
    if (s.fmin != null && s.fmin === s.fmax) parts.push(`${s.fmin}. stāvs`);
    if (s.series) parts.push(s.series);
  }
  if (s.loc && REGION_GROUPS_LOC[s.loc]) parts.push(REGION_GROUP_LABEL[s.loc]);
  else if (s.loc) {
    const id = Number(s.loc.slice(2));
    const row = s.loc[0] === "p"
      ? await db.query.places.findFirst({ where: eq(places.id, id), columns: { name: true } })
      : await db.query.regions.findFirst({ where: eq(regions.id, id), columns: { name: true } });
    if (row) parts.push(row.name);
  } else if (s.country === "LT") parts.push("Lietuva");
  if (s.zone) parts.push("zona kartē");
  if (s.src === "own") parts.push("tikai VienāVietā");
  else if (s.src === "ext") parts.push("no citiem portāliem");
  return parts.join(" · ").slice(0, 160);
}

/** Joslai: sludinājumu skaits pa virsbūvēm (auto) vai īpašuma veidiem, ievērojot pārējos filtrus. */
export async function typeCounts(s: SearchParams): Promise<Record<string, number>> {
  const isCar = s.cat === "vehicle";
  const col = isCar ? listings.body : listings.propertyType;
  const rows = await db
    .select({ k: col, n: count() })
    .from(listings)
    .leftJoin(places, eq(listings.placeId, places.id))
    .leftJoin(regions, eq(places.regionId, regions.id))
    .leftJoin(makes, eq(listings.makeId, makes.id))
    .leftJoin(models, eq(listings.modelId, models.id))
    .leftJoin(users, eq(listings.userId, users.id))
    .where(and(...conditions(isCar ? { ...s, body: undefined } : { ...s, ptype: undefined })))
    .groupBy(col);
  return Object.fromEntries(rows.filter((r) => r.k).map((r) => [r.k as string, r.n]));
}

// ---------- SEO lapām: skaiti pa markām/modeļiem/reģioniem un cenu kopsavilkums (kešots 10 min) ----------
const facetCache = new Map<string, { at: number; v: unknown }>();
async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = facetCache.get(key);
  if (hit && hit.at > Date.now() - 10 * 60_000) return hit.v as T;
  const v = await fn();
  facetCache.set(key, { at: Date.now(), v });
  if (facetCache.size > 2000) facetCache.delete(facetCache.keys().next().value!);
  return v;
}

export type Facet = { id: number; name: string; n: number };

/** Sludinājumu skaits pa markām, modeļiem vai reģioniem pie dotajiem filtriem (pašu dimensiju neskaitot). */
export function facetCounts(s: SearchParams, by: "make" | "model" | "region"): Promise<Facet[]> {
  const base = { ...s, page: 1, sort: "new" as const, ...(by === "make" ? { make: undefined, model: undefined } : by === "model" ? { model: undefined } : { loc: undefined }) };
  return cached(`facet:${by}:${JSON.stringify(base)}`, async () => {
    const idCol = by === "make" ? makes.id : by === "model" ? models.id : regions.id;
    const nameCol = by === "make" ? makes.name : by === "model" ? models.name : regions.name;
    const rows = await db
      .select({ id: idCol, name: nameCol, n: count() })
      .from(listings)
      .leftJoin(places, eq(listings.placeId, places.id))
      .leftJoin(regions, eq(places.regionId, regions.id))
      .leftJoin(makes, eq(listings.makeId, makes.id))
      .leftJoin(models, eq(listings.modelId, models.id))
      .leftJoin(users, eq(listings.userId, users.id))
      .where(and(...conditions(base), isNotNull(idCol)))
      .groupBy(idCol, nameCol)
      .orderBy(desc(count()));
    return rows.filter((r) => r.id != null && r.name).map((r) => ({ id: Number(r.id), name: String(r.name), n: Number(r.n) }));
  });
}

/** Sludināmumu skaits pa avotiem pie dotajiem filtriem (pašu avota filtru neskaitot) — "Avoti" čipiem. */
export function sourceCounts(s: SearchParams): Promise<{ source: string; n: number }[]> {
  const base = { ...s, page: 1, sort: "new" as const, src: undefined, sources: [] as string[] };
  return cached(`src:${JSON.stringify(base)}`, async () => {
    const rows = await db
      .select({ source: listings.source, n: count() })
      .from(listings)
      .leftJoin(places, eq(listings.placeId, places.id))
      .leftJoin(regions, eq(places.regionId, regions.id))
      .leftJoin(makes, eq(listings.makeId, makes.id))
      .leftJoin(models, eq(listings.modelId, models.id))
      .leftJoin(users, eq(listings.userId, users.id))
      .where(and(...conditions(base)))
      .groupBy(listings.source)
      .orderBy(desc(count()));
    return rows.map((r) => ({ source: String(r.source), n: Number(r.n) }));
  });
}

/** Skaits un cenas mediāna (bez nulles cenām). */
export function priceSummary(s: SearchParams): Promise<{ n: number; median: number | null }> {
  const base = { ...s, page: 1, sort: "new" as const };
  return cached(`sum:${JSON.stringify(base)}`, async () => {
    const [r] = await db
      .select({ n: count(), median: sql<number | null>`percentile_cont(0.5) within group (order by ${listings.price}) filter (where ${listings.price} > 0)` })
      .from(listings)
      .leftJoin(places, eq(listings.placeId, places.id))
      .leftJoin(regions, eq(places.regionId, regions.id))
      .leftJoin(makes, eq(listings.makeId, makes.id))
      .leftJoin(models, eq(listings.modelId, models.id))
      .leftJoin(users, eq(listings.userId, users.id))
      .where(and(...conditions(base)));
    return { n: Number(r?.n ?? 0), median: r?.median != null ? Math.round(Number(r.median)) : null };
  });
}

export type PriceInsights = {
  n: number; median: number; p25: number; p75: number; lo: number; hi: number;
  /** stabiņi no lo līdz hi: [cena no, cena līdz, skaits] */
  bins: [number, number, number][];
  cheap: number; mid: number; dear: number; cheapMax: number; dearMin: number;
  drops: number; dropPct: number | null;
};

/** Mini analītika meklēšanas rezultātiem: mediāna, cenu sadalījums (lēti < 80% mediānas, dārgi > 120%) un cenu samazinājumi 30 dienās. */
export function priceInsights(s: SearchParams): Promise<PriceInsights | null> {
  const base = { ...s, page: 1, sort: "new" as const };
  return cached(`ins:${JSON.stringify(base)}`, async () => {
    const from = <T extends Record<string, unknown>>(sel: T) =>
      db.select(sel as never).from(listings)
        .leftJoin(places, eq(listings.placeId, places.id))
        .leftJoin(regions, eq(places.regionId, regions.id))
        .leftJoin(makes, eq(listings.makeId, makes.id))
        .leftJoin(models, eq(listings.modelId, models.id))
        .leftJoin(users, eq(listings.userId, users.id));
    const where = and(...conditions(base), sql`${listings.price} > 0`);
    const pc = (f: number) => sql<number>`percentile_cont(${f}::float8) within group (order by ${listings.price})`;
    const dropped = sql`${listings.firstPrice} > ${listings.price} and exists (select 1 from price_history h where h.listing_id = ${listings.id} and h.changed_at > now() - interval '30 days')`;
    const [st] = (await from({
      n: count(), p5: pc(0.05), p25: pc(0.25), median: pc(0.5), p75: pc(0.75), p95: pc(0.95),
      drops: sql<number>`count(*) filter (where ${dropped})`,
      dropPct: sql<number | null>`avg((${listings.firstPrice} - ${listings.price})::numeric / nullif(${listings.firstPrice}, 0) * 100) filter (where ${dropped})`,
    }).where(where)) as unknown as { n: number; p5: number; p25: number; median: number; p75: number; p95: number; drops: number; dropPct: number | null }[];
    const n = Number(st?.n ?? 0);
    if (n < 8 || st.median == null) return null;
    const median = Math.round(Number(st.median));
    const lo = Math.floor(Number(st.p5)), hi = Math.max(lo + 12, Math.ceil(Number(st.p95)));
    // sliekšņus noapaļo (100 € vai 10 € īrei un lētām lietām), lai skaitļi būtu viegli lasāmi
    const unit = median >= 2000 ? 100 : 10;
    const rnd = (v: number) => Math.round(v / unit) * unit;
    const cheapMax = rnd(median * 0.8), dearMin = rnd(median * 1.2);
    const N = 14;
    const [rows, [seg]] = await Promise.all([
      from({ b: sql<number>`least(${N}::int, greatest(1, width_bucket(${listings.price}::numeric, ${lo}::numeric, ${hi}::numeric, ${N}::int)))`, c: count() }).where(where).groupBy(sql`1`) as unknown as Promise<{ b: number; c: number }[]>,
      from({ cheap: sql<number>`count(*) filter (where ${listings.price} < ${cheapMax}::int)`, dear: sql<number>`count(*) filter (where ${listings.price} > ${dearMin}::int)` }).where(where) as unknown as Promise<{ cheap: number; dear: number }[]>,
    ]);
    const step = (hi - lo) / N;
    const bins = Array.from({ length: N }, (_, i) => [Math.round(lo + i * step), Math.round(lo + (i + 1) * step), Number(rows.find((r) => Number(r.b) === i + 1)?.c ?? 0)] as [number, number, number]);
    const cheap = Number(seg?.cheap ?? 0), dear = Number(seg?.dear ?? 0);
    return {
      n, median: rnd(median), p25: rnd(Number(st.p25)), p75: rnd(Number(st.p75)), lo, hi, bins,
      cheap, dear, mid: n - cheap - dear, cheapMax, dearMin,
      drops: Number(st.drops ?? 0), dropPct: st.dropPct != null ? Math.round(Number(st.dropPct) * 10) / 10 : null,
    };
  });
}
