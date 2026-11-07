import { and, asc, count, desc, eq, gte, ilike, inArray, isNotNull, lte, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  AMENITIES, BODY_TYPES, COLORS, CONDITIONS, DEALS, DRIVES, FUELS, GEARBOXES, HEATING, MATERIALS, PROPERTY_GROUPS, PROPERTY_TYPES,
  PURPOSES, SERIES, VEHICLE_CLASSES, type VehicleClass,
} from "./constants";

const { listings, places, regions, makes, models, users, listingPhotos } = schema;

export const PAGE_SIZE = 24;
export const SORTS = ["new", "cheap", "dear"] as const;

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

/** Zona kartē: "lat,lon;lat,lon;…" (3–80 punkti Latvijas apkaimē). */
function parseZone(v: string | string[] | undefined): [number, number][] | undefined {
  const s = one(v);
  if (!s) return;
  const pts = s.split(";").map((p) => p.split(",").map(Number) as [number, number]);
  if (pts.length < 3 || pts.length > 80) return;
  if (!pts.every(([la, lo]) => la > 54 && la < 59 && lo > 19 && lo < 30)) return;
  return pts;
}

/** Nolasa un pārbauda meklēšanas parametrus no URL. Nederīgās vērtības tiek ignorētas. */
export function parseSearch(raw: Raw) {
  const cat = pick(raw.cat, ["vehicle", "property"] as const);
  const vc = pick(raw.vc, VEHICLE_CLASSES) ?? (cat === "vehicle" ? "car" : undefined);
  const ptypeRaw = one(raw.ptype);
  const ptype = ptypeRaw?.startsWith("g:") ? (ptypeRaw.slice(2) in PROPERTY_GROUPS ? ptypeRaw : undefined) : pick(raw.ptype, PROPERTY_TYPES);
  const locRaw = one(raw.loc);
  const loc = locRaw && /^[rp]:\d{1,6}$/.test(locRaw) ? locRaw : undefined;
  return {
    cat,
    vc,
    q: one(raw.q)?.slice(0, 80),
    pmin: int(raw.pmin, 0),
    pmax: int(raw.pmax, 0),
    loc,
    seller: pick(raw.seller, ["private", "dealer", "verified"] as const),
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
    const id = Number(s.loc.slice(2));
    add(s.loc[0] === "p" ? eq(listings.placeId, id) : eq(places.regionId, id));
  }
  if (s.seller === "verified") add(isNotNull(users.identityVerifiedAt));
  else if (s.seller) add(eq(users.sellerType, s.seller));
  if (s.q) {
    const like = `%${s.q.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
    add(or(ilike(listings.title, like), ilike(listings.description, like), ilike(makes.name, like), ilike(models.name, like), ilike(places.name, like)));
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

/** Atrod sludinājumus vienai lapai un kopējo skaitu. */
export async function searchListings(s: SearchParams) {
  const where = and(...conditions(s));
  const base = () =>
    db
      .select({
        id: listings.id, kind: listings.kind, status: listings.status, title: listings.title, price: listings.price, deal: listings.deal,
        createdAt: listings.createdAt, year: listings.year, mileageKm: listings.mileageKm, fuel: listings.fuel, gearbox: listings.gearbox,
        body: listings.body, propertyType: listings.propertyType, rooms: listings.rooms, areaM2: listings.areaM2, landM2: listings.landM2,
        place: places.name, region: regions.name, regionKind: regions.kind, thumbKey: coverThumb, photoCount,
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
  const order = s.sort === "cheap" ? [asc(listings.price)] : s.sort === "dear" ? [desc(listings.price)] : [desc(fresh)];

  const [rows, [{ total }]] = await Promise.all([
    base().where(where).orderBy(top, ...order, desc(listings.id)).limit(PAGE_SIZE).offset((s.page - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(listings)
      .leftJoin(places, eq(listings.placeId, places.id))
      .leftJoin(makes, eq(listings.makeId, makes.id))
      .leftJoin(models, eq(listings.modelId, models.id))
      .leftJoin(users, eq(listings.userId, users.id))
      .where(where),
  ]);
  return { rows, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Punkti kartei visiem atbilstošajiem sludinājumiem (bez zonas filtra, lai redzētu arī apkārtni). */
export async function searchPoints(s: SearchParams, limit = 3000) {
  const where = and(...conditions({ ...s, zone: undefined }), isNotNull(listings.lat));
  return db
    .select({ id: listings.id, lat: listings.lat, lon: listings.lon, kind: listings.kind, price: listings.price, title: listings.title })
    .from(listings)
    .leftJoin(places, eq(listings.placeId, places.id))
    .leftJoin(makes, eq(listings.makeId, makes.id))
    .leftJoin(models, eq(listings.modelId, models.id))
    .leftJoin(users, eq(listings.userId, users.id))
    .where(where)
    .limit(limit);
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
