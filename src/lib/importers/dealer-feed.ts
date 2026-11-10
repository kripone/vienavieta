// Salonu un aģentūru sludinājumu plūsmas: XML (arī Facebook/Google auto katalogs), CSV vai JSON pēc saites.
// Plūsmu pievieno pats salons (/importi); sludinājumi kļūst par salona sludinājumiem mūsu portālā.
// Bildes rādām no salona servera (remote_photos), neglabājam. Aprakstu ņemam: tas ir salona paša teksts.
// City24 formāta JSON (aģentūru eksports vai City24 partneru plūsma): city24-format.ts, bez brokeru datiem, viena bilde.
// dealer_feeds.source = portāls (tikai administrators): sludinājumi ar portāla avotu, bez apraksta un kontaktiem,
// viens sīktēls un saite uz oriģinālu ar UTM.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { XMLParser } from "fast-xml-parser";
import { and, eq, inArray, notInArray, sql, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { BODY_TYPES, DEALER_FEED, PARTNER_UTM, type PropertyType } from "../constants";
import { city24ToFlat, isCity24Item } from "./city24-format";
import { inferBody } from "../illustrations";
import { landLabel } from "../listing-input";
import { findMake, matchModel, vehicleTitle } from "./ss-rss";
import { loadCtx } from "./ss-pages";
import { linkDuplicate } from "../dedupe";

const { listings, priceHistory, dealerFeeds, users } = schema;

// ---------- droša lejupielāde (tikai publiski serveri) ----------
function privateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
    const m = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return m ? privateIp(m[1]) : false;
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

/** Pārbauda, vai adrese ir publisks http(s) serveris (nevis mūsu iekšējais tīkls). */
export async function checkFeedUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("Nederīga saite.");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Saitei jāsākas ar https:// vai http://.");
  if (u.username || u.password) throw new Error("Saitē nedrīkst būt lietotājvārds vai parole.");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) throw new Error("Šo adresi nevar izmantot.");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new Error("Serveris nav atrasts.");
  if (addrs.some((a) => privateIp(a.address))) throw new Error("Šo adresi nevar izmantot.");
  return u;
}

async function fetchFeed(raw: string) {
  let url = await checkFeedUrl(raw);
  for (let hop = 0; hop < 4; hop++) {
    const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(60_000), headers: { "user-agent": "VienaVietaBot/1.0 (dealer feed)" } });
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
      url = await checkFeedUrl(new URL(r.headers.get("location")!, url).toString());
      continue;
    }
    if (!r.ok || !r.body) throw new Error(`Serveris atbildēja ${r.status}.`);
    const reader = r.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > DEALER_FEED.MAX_BYTES) {
        await reader.cancel();
        throw new Error(`Plūsma ir pārāk liela (vairāk par ${DEALER_FEED.MAX_BYTES / 1_000_000} MB).`);
      }
      chunks.push(value);
    }
    return { text: Buffer.concat(chunks).toString("utf8").replace(/^﻿/, ""), type: r.headers.get("content-type") ?? "" };
  }
  throw new Error("Pārāk daudz pāradresāciju.");
}

// ---------- formātu nolasīšana → plakani ieraksti ----------
type Flat = Record<string, string[]>;
const keyOf = (k: string) => k.replace(/^@_/, "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

/** Saplacina XML/JSON objektu: { "make": ["BMW"], "image.url": [...], "address.city": ["Rīga"] } */
function flatten(o: unknown, prefix = "", out: Flat = {}): Flat {
  const put = (k: string, v: string) => {
    const t = v.trim();
    if (t) (out[k] ??= []).push(t);
  };
  if (o == null) return out;
  if (Array.isArray(o)) {
    for (const x of o) flatten(x, prefix, out);
    return out;
  }
  if (typeof o !== "object") {
    put(prefix, String(o));
    return out;
  }
  const obj = o as Record<string, unknown>;
  // Facebook adrese: <component name="city">Rīga</component>
  if (obj["@_name"] != null && obj["#text"] != null) {
    put(`${prefix}.${keyOf(String(obj["@_name"]))}`, String(obj["#text"]));
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("@_") && k !== "@_url" && k !== "@_href") continue;
    const kk = k === "#text" ? prefix : prefix ? `${prefix}.${keyOf(k)}` : keyOf(k);
    flatten(v, kk, out);
  }
  return out;
}

const ITEM_KEYS = ["listing", "vehicle", "item", "ad", "advert", "offer", "car", "property", "entry", "sludinajums", "product"];

function findItems(o: unknown): unknown[] {
  const queue: unknown[] = [o];
  while (queue.length) {
    const cur = queue.shift();
    if (Array.isArray(cur)) {
      if (cur.length && cur.every((x) => x && typeof x === "object" && !Array.isArray(x))) return cur;
      continue;
    }
    if (!cur || typeof cur !== "object") continue;
    for (const [k, v] of Object.entries(cur as Record<string, unknown>)) {
      if (ITEM_KEYS.includes(keyOf(k))) return Array.isArray(v) ? v : [v];
    }
    for (const v of Object.values(cur as Record<string, unknown>)) if (v && typeof v === "object") queue.push(v);
  }
  return [];
}

/** CSV ar , ; vai tab atdalītāju, pēdiņām un pārnesumiem laukos. */
export function parseCsv(text: string): Flat[] {
  const first = text.slice(0, text.indexOf("\n") + 1 || text.length);
  const delim = [";", "\t", ","].map((d) => [d, first.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
      } else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  const [head, ...body] = rows;
  if (!head) return [];
  const keys = head.map((h) => keyOf(h));
  return body.map((r) => {
    const f: Flat = {};
    keys.forEach((k, i) => {
      const v = (r[i] ?? "").trim();
      if (!k || !v) return;
      // vairākas bildes vienā šūnā: atdalītas ar | , vai atstarpi
      const vals = /image|photo|bilde|foto/.test(k) ? v.split(/[|,\s]+/).filter((x) => /^https?:\/\//.test(x)) : [v];
      (f[k] ??= []).push(...vals);
    });
    return f;
  });
}

export function parseFeed(text: string, type = ""): Flat[] {
  const t = text.trimStart();
  if (t.startsWith("<")) {
    const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", parseTagValue: false, trimValues: true, processEntities: true }).parse(t);
    return findItems(xml).map((x) => flatten(x));
  }
  if (t.startsWith("[") || t.startsWith("{") || /json/.test(type)) {
    const j = JSON.parse(t);
    const arr = Array.isArray(j) ? j : findItems(j);
    // City24 formāts: tikai objekta fakti, bez brokeru datiem (city24-format.ts)
    if (arr.some(isCity24Item)) return arr.filter(isCity24Item).map((x) => city24ToFlat(x as Record<string, unknown>));
    return arr.map((x) => flatten(x));
  }
  return parseCsv(text);
}

// ---------- lauku nosaukumi un vērtības ----------
const ALIASES: Record<string, string[]> = {
  id: ["id", "vehicleid", "listingid", "homelistingid", "sku", "ref", "reference", "stocknumber", "itemid", "externalid"],
  title: ["title", "name", "virsraksts"],
  make: ["make", "brand", "marka"],
  model: ["model", "modelis"],
  year: ["year", "modelyear", "gads", "izlaidumagads"],
  mileage: ["mileage.value", "mileage", "km", "odometer", "nobraukums", "mileagekm"],
  mileageUnit: ["mileage.unit"],
  price: ["price", "cena", "saleprice", "price.value"],
  fuel: ["fueltype", "fuel", "degviela"],
  gearbox: ["transmission", "gearbox", "atrumkarba"],
  body: ["bodystyle", "body", "bodytype", "virsbuve"],
  color: ["exteriorcolor", "color", "colour", "krasa"],
  engine: ["engine", "enginesize", "enginedisplacement", "tilpums", "displacement"],
  power: ["powerkw", "kw", "jaudakw", "power"],
  drive: ["drivetrain", "drive", "piedzina"],
  vin: ["vin"],
  description: ["description", "apraksts"],
  url: ["url", "link", "saite"],
  city: ["address.component.city", "address.city", "city", "pilseta", "location", "vieta", "address.region"],
  street: ["address.component.addr1", "address.addr1", "street", "iela", "address.street"],
  kind: ["kind", "category", "kategorija"],
  propertyType: ["propertytype", "type", "veids", "propertykind"],
  deal: ["deal", "listingtype", "availability", "darijums"],
  rooms: ["rooms", "numrooms", "numberofrooms", "numberofbedrooms", "istabas"],
  area: ["area", "aream2", "floorarea", "floorsize.value", "floorsize", "platiba", "livingarea"],
  land: ["land", "landarea", "lotsize", "landm2", "zeme"],
  floor: ["floor", "stavs"],
  floors: ["floors", "numfloors", "stavuskaits"],
  lat: ["lat", "latitude", "address.latitude", "platums"],
  lon: ["lon", "lng", "longitude", "address.longitude", "garums"],
  cityFallback: ["cityfallback"],
  format: ["format"],
};
const IMAGE_KEYS = /^(image|images|imagelink|imageurl|additionalimagelink|photo|photos|picture|bilde|bildes|foto)(\.|$)/;

const get = (f: Flat, field: keyof typeof ALIASES) => {
  for (const a of ALIASES[field]) if (f[a]?.length) return f[a][0];
  return undefined;
};
const num = (v?: string) => {
  if (!v) return null;
  const m = v.replace(/\s/g, "").replace(",", ".").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};
const images = (f: Flat) =>
  [...new Set(Object.entries(f).filter(([k]) => IMAGE_KEYS.test(k)).flatMap(([, v]) => v).filter((x) => /^https?:\/\/\S+$/i.test(x)))].slice(0, DEALER_FEED.MAX_PHOTOS);

const pick = <T extends string>(v: string | undefined, rules: [RegExp, T][]) => {
  if (!v) return null;
  for (const [re, out] of rules) if (re.test(v.toLowerCase())) return out;
  return null;
};
const FUEL: [RegExp, string][] = [[/plug|hybrid|hibr|гибр/, "Hibrīds"], [/elect|elektr|электр|ev\b/, "Elektro"], [/lpg|gāz|gaz|газ|cng/, "Benzīns/gāze"], [/dies|dīz|диз/, "Dīzelis"], [/petrol|gasol|benz|бенз/, "Benzīns"]];
const GEAR: [RegExp, string][] = [[/auto|автом|dsg|cvt/, "Automāts"], [/man|мех/, "Manuāla"]];
const BODY: [RegExp, string][] = [
  [/sedan|седан/, "Sedans"], [/hatch|хэтч|hečb/, "Hečbeks"], [/wagon|estate|kombi|univers|универс|touring|avant/, "Universāls"],
  [/suv|crossover|4x4|apvid|внедор|джип/, "Apvidus"], [/coupe|kupe|купе/, "Kupeja"], [/convert|cabrio|kabri|кабри/, "Kabriolets"],
  [/minivan|mpv|vienat|минив/, "Minivens"], [/pick|пикап/, "Pikaps"], [/van|bus|furg|фург|микроав/, "Mikroautobuss"],
];
const PTYPE: [RegExp, PropertyType][] = [
  [/summer|vasarn|dārza|darza|дач|cottage/, "Vasarnīca"], [/room|istaba|комнат/, "Istaba"], [/farm|lauku|хутор|countryside/, "Lauku īpašums"],
  [/forest|mež|mez|лес/, "Mežs"], [/office|biroj|офис/, "Birojs"], [/shop|retail|tirdzn|магаз|торгов/, "Tirdzniecības telpas"],
  [/warehouse|storage|noliktav|склад/, "Noliktava"], [/industr|ražoš|razos|производ/, "Ražošanas telpas"], [/garage|garāž|garaz|гараж/, "Garāža"],
  [/parking|stāvviet|stavviet|парков/, "Stāvvieta"], [/commercial|komerc|коммерч/, "Komercēka"],
  [/apart|flat|dzīvok|dzivok|кварт/, "Dzīvoklis"], [/house|māja|maja|дом|villa|private/, "Māja"], [/land|zeme|участ|plot/, "Zeme"],
];

/** Portāla saitei pieliek UTM atzīmes (lai partneris redz, ka apmeklētājs nāk no mums). */
function withUtm(url: string) {
  try {
    const u = new URL(url);
    for (const [k, v] of new URLSearchParams(PARTNER_UTM)) if (!u.searchParams.has(k)) u.searchParams.set(k, v);
    return u.toString().slice(0, 500);
  } catch {
    return url;
  }
}

// ---------- imports ----------
export type FeedResult = { items: number; created: number; updated: number; removed: number; skipped: number; errors: string[]; ms: number };

export async function runFeed(feedId: number): Promise<FeedResult> {
  const t0 = Date.now();
  const res: FeedResult = { items: 0, created: 0, updated: 0, removed: 0, skipped: 0, errors: [], ms: 0 };
  const [feed] = await db.select().from(dealerFeeds).where(eq(dealerFeeds.id, feedId));
  if (!feed) throw new Error("Plūsma nav atrasta.");
  const [owner] = await db.select({ id: users.id, phone: users.phone, email: users.email, blockedAt: users.blockedAt }).from(users).where(eq(users.id, feed.userId));
  try {
    if (!owner || owner.blockedAt) throw new Error("Lietotājs bloķēts.");
    const { text, type } = feed.content != null ? { text: feed.content, type: "" } : await fetchFeed(feed.url);
    let rows: Flat[];
    try {
      rows = parseFeed(text, type);
    } catch {
      throw new Error("Plūsmu neizdevās nolasīt: tā nav derīgs XML, CSV vai JSON.");
    }
    rows = rows.slice(0, DEALER_FEED.MAX_ITEMS);
    res.items = rows.length;
    if (!rows.length) throw new Error("Plūsmā nav atrasts neviens sludinājums.");
    const ctx = await loadCtx();
    const source = feed.source ?? "own";
    const partner = source !== "own";
    const seen: string[] = [];
    for (const [i, f] of rows.entries()) {
      const itemId = (get(f, "id") ?? get(f, "url") ?? `${i}`).slice(0, 120);
      const externalId = `feed:${feed.id}:${itemId}`;
      const price = Math.round(num(get(f, "price")) ?? 0);
      if (price <= 0 || price > 50_000_000) { res.skipped++; if (res.errors.length < 10) res.errors.push(`${itemId}: nav cenas`); continue; }
      const kindRaw = get(f, "kind");
      const ptypeRaw = get(f, "propertyType");
      const kind: "vehicle" | "property" =
        kindRaw ? (/prop|nekust|ipas|īpaš|real|home|недв/i.test(kindRaw) ? "property" : "vehicle") : get(f, "make") ? "vehicle" : ptypeRaw && pick(ptypeRaw, PTYPE) ? "property" : feed.kind;
      const city = get(f, "city");
      const fallback = get(f, "cityFallback");
      // "Āgenskalns" + "Rīga" → apkaime Rīgā; ja tādas nav, pilsēta (nevis cita "Centrs" citā pilsētā)
      const place = city && fallback ? ctx.findIn(fallback, city) ?? ctx.findCity(fallback) : city ? ctx.findCity(city) : null;
      const lat = num(get(f, "lat")), lon = num(get(f, "lon"));
      const exact = lat != null && lon != null && lat > 55.5 && lat < 58.2 && lon > 20.8 && lon < 28.3;
      // portāla partneru plūsma: tikai fakti, viens sīktēls un saite uz oriģinālu (ar UTM); bez apraksta un kontaktiem
      const url = get(f, "url")?.slice(0, 500) ?? null;
      if (partner && !url) { res.skipped++; if (res.errors.length < 10) res.errors.push(`${itemId}: nav saites uz oriģinālu`); continue; }
      const photos = partner || get(f, "format") === "city24" ? images(f).slice(0, 1) : images(f);
      const base = {
        kind,
        status: "active" as const,
        source,
        externalId,
        externalUrl: partner && url ? withUtm(url) : url,
        externalThumbUrl: photos[0] ?? null,
        remotePhotos: partner ? [] : photos,
        feedId: feed.id,
        userId: partner ? null : feed.userId,
        price,
        description: partner ? null : get(f, "description")?.slice(0, 5000) ?? null,
        placeId: place?.id ?? null,
        lat: exact ? lat : place ? place.lat + (Math.random() - 0.5) * 0.01 : null,
        lon: exact ? lon : place ? place.lon + (Math.random() - 0.5) * 0.02 : null,
        geoPrecision: exact ? "street" : place ? "place" : null,
        contactPhone: partner ? null : owner.phone ?? null,
        contactEmail: partner ? null : owner.email,
        updatedAt: new Date(),
      };
      let row: typeof listings.$inferInsert;
      if (kind === "vehicle") {
        const makeRaw = get(f, "make") ?? "";
        const make = makeRaw ? findMake(ctx.makes, "car", makeRaw) : null;
        const modelRaw = get(f, "model") ?? "";
        const model = make && modelRaw ? matchModel(ctx.models, make.id, modelRaw, make.name) : null;
        const year = Math.round(num(get(f, "year")) ?? 0);
        if (!makeRaw || year < 1950 || year > new Date().getFullYear() + 1) { res.skipped++; if (res.errors.length < 10) res.errors.push(`${itemId}: nav markas vai gada`); continue; }
        let km = num(get(f, "mileage"));
        if (km != null && /mi/i.test(get(f, "mileageUnit") ?? "")) km = km * 1.609;
        const eng = num(get(f, "engine"));
        const engineL = eng ? (eng > 50 ? Math.round(eng / 100) / 10 : Math.round(eng * 10) / 10) : null;
        const fuel = pick(get(f, "fuel"), FUEL);
        const modelName = model?.name ?? modelRaw;
        const bodyRaw = pick(get(f, "body"), BODY);
        const body = bodyRaw && (BODY_TYPES.car as readonly string[]).includes(bodyRaw) ? bodyRaw : inferBody(modelName);
        const makeName = make?.name ?? makeRaw;
        row = {
          ...base,
          vehicleClass: "car",
          makeId: make?.id ?? null,
          modelId: model?.id ?? null,
          makeText: make ? null : makeRaw.slice(0, 60),
          modelText: model ? null : modelRaw.slice(0, 60) || null,
          year,
          mileageKm: km != null ? Math.round(km) : null,
          fuel,
          gearbox: pick(get(f, "gearbox"), GEAR),
          body,
          engineL: engineL ? String(engineL) : null,
          powerKw: num(get(f, "power")) ? Math.round(num(get(f, "power"))!) : null,
          color: get(f, "color")?.slice(0, 30) ?? null,
          vin: get(f, "vin")?.slice(0, 17) ?? null,
          title: ((partner ? undefined : get(f, "title")) ?? vehicleTitle(makeName, modelName, engineL ? String(engineL) : null, fuel, year)).slice(0, 120),
        };
      } else {
        const ptype = pick(ptypeRaw, PTYPE) ?? "Dzīvoklis";
        const rooms = Math.round(num(get(f, "rooms")) ?? 0) || null;
        const area = num(get(f, "area"));
        const land = num(get(f, "land"));
        if (!area && !land) { res.skipped++; if (res.errors.length < 10) res.errors.push(`${itemId}: nav platības`); continue; }
        const deal = /rent|īr|ir[eē]|nom|аренд/i.test(get(f, "deal") ?? "") ? "rent" : "sell";
        const where = place ? `, ${place.name === "Centrs" ? place.region : place.name}` : "";
        const title =
          ptype === "Dzīvoklis" ? `${rooms ?? 1}-istabu dzīvoklis${area ? `, ${area} m²` : ""}${where}`
          : ptype === "Māja" ? `Privātmāja${area ? ` ${area} m²` : ""}${land ? `, zeme ${landLabel(land)}` : ""}${where}`
          : ptype === "Vasarnīca" ? `Vasarnīca${area ? ` ${area} m²` : ""}${land ? `, zeme ${landLabel(land)}` : ""}${where}`
          : ptype === "Zeme" ? `Zemes gabals${land ? ` ${landLabel(land)}` : ""}${where}`
          : ptype === "Mežs" ? `Meža īpašums${land ? ` ${landLabel(land)}` : ""}${where}`
          : `${ptype}${area ? ` ${area} m²` : land ? ` ${landLabel(land)}` : ""}${where}`;
        const street = get(f, "street");
        row = {
          ...base,
          propertyType: ptype,
          deal,
          rooms,
          areaM2: area ? String(area) : null,
          landM2: land ? Math.round(land) : null,
          floor: Math.round(num(get(f, "floor")) ?? NaN) || null,
          floors: Math.round(num(get(f, "floors")) ?? NaN) || null,
          address: street && place ? `${street}, ${place.name}, ${place.region}` : null,
          title: ((partner ? undefined : get(f, "title")) ?? title).slice(0, 120),
        };
      }
      seen.push(externalId);
      const [existing] = await db.select({ id: listings.id, price: listings.price, status: listings.status }).from(listings).where(and(eq(listings.source, source), eq(listings.externalId, externalId)));
      if (existing) {
        if (existing.status === "hidden" || existing.status === "pending") continue; // moderators paslēpis
        const { kind: _k, source: _s, externalId: _e, userId: _u, ...upd } = row;
        void _k; void _s; void _e; void _u;
        await db
          .update(listings)
          .set({ ...upd, ...(existing.price !== price ? { firstPrice: sql`coalesce(${listings.firstPrice}, ${existing.price})` } : {}) })
          .where(eq(listings.id, existing.id));
        if (existing.price !== price) await db.insert(priceHistory).values({ listingId: existing.id, price });
        res.updated++;
      } else {
        const [ins] = await db.insert(listings).values(row).onConflictDoNothing().returning({ id: listings.id });
        if (ins) {
          await db.insert(priceHistory).values({ listingId: ins.id, price });
          await linkDuplicate(ins.id).catch(() => null); // tas pats auto ss.com → viena kartīte
          res.created++;
        }
      }
    }
    // plūsmā vairs nav → noņemts
    if (seen.length) {
      const gone = await db
        .update(listings)
        .set({ status: "deleted", updatedAt: new Date() })
        .where(and(eq(listings.feedId, feed.id), eq(listings.status, "active"), notInArray(listings.externalId, seen)))
        .returning({ id: listings.id });
      res.removed = gone.length;
    }
  } catch (e) {
    res.errors.unshift(e instanceof Error ? e.message : String(e));
  }
  res.ms = Date.now() - t0;
  await db.update(dealerFeeds).set({ lastRunAt: new Date(), lastResult: res }).where(eq(dealerFeeds.id, feed.id));
  return res;
}

/** Plānotājam: viena plūsma, kuras kārta pienākusi (reizi DEALER_FEED.EVERY_HOURS stundās). */
export async function runDueFeed() {
  const due = new Date(Date.now() - DEALER_FEED.EVERY_HOURS * 3600_000);
  const [f] = await db
    .select({ id: dealerFeeds.id })
    .from(dealerFeeds)
    // augšupielādētus failus atkārtoti nenolasām (tos atjauno, augšupielādējot no jauna)
    .where(and(eq(dealerFeeds.active, true), isNull(dealerFeeds.content), sql`(${dealerFeeds.lastRunAt} is null or ${dealerFeeds.lastRunAt} < ${due})`))
    .orderBy(sql`${dealerFeeds.lastRunAt} nulls first`)
    .limit(1);
  return f ? { id: f.id, ...(await runFeed(f.id)) } : null;
}

/** Plūsmas dzēšana: tās sludinājumus atzīmē kā dzēstus. */
export async function removeFeedListings(feedId: number) {
  await db.update(listings).set({ status: "deleted", updatedAt: new Date() }).where(and(eq(listings.feedId, feedId), inArray(listings.status, ["active", "sold"])));
}
