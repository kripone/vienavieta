// ss.com RSS imports. Lieto tikai ss.com publicētās RSS plūsmas (sk. SS_FEEDS) un no tām ņem tikai faktus:
// marka/modelis, gads, nobraukums, tilpums, cena, istabas, platība, stāvs, sērija, zeme un vieta (no adreses ceļa).
// Pārdevēja teksts un bildes netiek kopētas; virsrakstu veidojam paši; kartītē ir saite uz oriģinālu.
import { and, eq, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { EXTERNAL_TTL_DAYS, SERIES, SS_FEEDS } from "../constants";
import { landLabel } from "../listing-input";

const { listings, places, regions, makes, models, priceHistory } = schema;

type Feed = (typeof SS_FEEDS)[number];
export type RssItem = { link: string; pubDate: Date; fields: Record<string, string[]> };

// tikai ASCII: HTTP galvenēs nedrīkst būt garumzīmes
const USER_AGENT = "VienaVietaBot/1.0 (+https://vienavieta-omew.onrender.com; RSS reader)";

// ---------- RSS parsēšana ----------
const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");

/** Izvelk "Nosaukums: <b>v1<br>v2</b>" pārus no ss.com RSS apraksta. */
export function parseFields(html: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const clean = html.replace(/<img[^>]*>/gi, "").replace(/<a [^>]*>[\s\S]*?<\/a>/gi, "");
  for (const part of clean.split(/<br\s*\/>/i)) {
    const m = part.match(/^\s*([^:<]*):\s*<b>([\s\S]*)<\/b>\s*$/i);
    if (!m) continue;
    const label = decode(m[1].trim());
    const values = m[2]
      .split(/<br\s*\/?>/i)
      .map((v) => decode(v.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim())
      .filter(Boolean);
    if (label && values.length) out[label] = values;
  }
  return out;
}

export function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const body = m[1];
    const link = body.match(/<link>\s*([^<\s]+)\s*<\/link>/)?.[1];
    const pub = body.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1];
    const desc = body.match(/<description>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/description>/)?.[1] ?? "";
    if (!link || !/^https:\/\/www\.ss\.(com|lv)\/msg\//.test(link)) continue;
    const d = pub ? new Date(pub) : new Date();
    items.push({ link, pubDate: Number.isNaN(d.getTime()) ? new Date() : d, fields: parseFields(desc) });
  }
  return items;
}

// ---------- vērtību pārveidošana ----------
const first = (f: Record<string, string[]>, k: string) => f[k]?.[0];

/** "13,500 €" → 13500; "520 €/mēn." → 520 (+ deal rent); "pērku" → null */
export function parsePrice(v?: string): { price: number; deal: "sell" | "rent" | "day" } | null {
  if (!v) return null;
  const m = v.replace(/\s/g, "").match(/^([\d,.]+)€(\/mēn\.|\/dienā|\/ned\.)?/);
  if (!m) return null;
  const price = Math.round(Number(m[1].replace(/,/g, "")));
  if (!Number.isFinite(price) || price <= 0 || price > 50_000_000) return null;
  return { price, deal: m[2] === "/mēn." ? "rent" : m[2] === "/dienā" ? "day" : "sell" };
}

const int = (v?: string) => {
  const n = parseInt(String(v ?? "").replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

/** "121 tūkst." → 121000 */
const mileage = (v?: string) => {
  const m = v?.match(/^([\d\s]+)\s*tūkst/);
  return m ? int(m[1])! * 1000 : int(v);
};

/** "1453 m²" → 1453; "2 ha." → 20000 */
export function parseLand(v?: string) {
  if (!v) return null;
  const n = Number(v.replace(/[^\d.,]/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return /ha/.test(v) ? Math.round(n * 10_000) : Math.round(n);
}

/** "1.8H" → { engineL: 1.8, fuel: Hibrīds } */
function engine(v?: string) {
  const m = v?.match(/^(\d+(?:\.\d+)?)\s*([A-Z]*)$/i);
  if (!m) return { engineL: null, fuel: null };
  const l = Number(m[1]);
  const suf = m[2].toUpperCase();
  return {
    engineL: l > 0 && l < 20 ? l.toFixed(2) : null,
    fuel: suf === "D" ? "Dīzelis" : suf === "H" ? "Hibrīds" : suf === "G" ? "Benzīns/gāze" : suf === "E" ? "Elektro" : suf === "" ? "Benzīns" : null,
  };
}

const SERIES_MAP: Record<string, string> = {
  "103.": "103. sērija", "104.": "104. sērija", "119.": "119. sērija", "467.": "467. sērija", "602.": "602. sērija",
  "Lit. pr.": "Lietuviešu", "Hrušč.": "Hruščova laika", "Staļina": "Staļina laika", "P. kara": "Pirmskara",
  "M. ģim.": "Mazģimeņu", "Specpr.": "Specprojekts", "Jaun.": "Jaunais projekts", "Renov.": "Renovēta ēka",
};
const series = (v?: string) => (v && SERIES_MAP[v] && (SERIES as readonly string[]).includes(SERIES_MAP[v]) ? SERIES_MAP[v] : null);

/** Burti bez garumzīmēm un ss.com transliterācijas īpatnībām: "Pļavnieki" un "plyavnieki" → "plavnieki". */
export function slug(s: string) {
  return s
    .toLocaleLowerCase("lv")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/sh/g, "s").replace(/zh/g, "z").replace(/ch/g, "c").replace(/ya/g, "a").replace(/y/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------- vietas ----------
type PlaceRow = { id: number; name: string; lat: number; lon: number; region: string };
const SEGMENT_SKIP = new Set(["riga-region", "other", "all", "today", "sell", "hand_over"]);
const ALIASES: Record<string, string> = { centre: "centrs", "maskavas-priekspilseta": "maskavas-forstate", vecriga: "vecriga" };

export function makePlaceFinder(rows: PlaceRow[]) {
  const bySlug = new Map<string, PlaceRow[]>();
  for (const p of rows) {
    const k = slug(p.name);
    bySlug.set(k, [...(bySlug.get(k) ?? []), p]);
  }
  const regionCity = new Map(rows.map((p) => [slug(p.region), p.region]));
  return (url: string, categoryDepth: number): PlaceRow | null => {
    // https://www.ss.com/msg/lv/real-estate/flats/riga/agenskalns/abcde.html → ["riga","agenskalns"]
    const segs = new URL(url).pathname.split("/").filter(Boolean).slice(2 + categoryDepth, -1);
    const norm = segs
      .filter((s) => !SEGMENT_SKIP.has(s))
      .map((s) => slug(s.replace(/-and-reg$/, "").replace(/-(pag|nov)$/, "")))
      .map((s) => ALIASES[s] ?? s);
    const region = segs.map((s) => regionCity.get(slug(s.replace(/-and-reg$/, "")))).find(Boolean);
    for (const s of [...norm].reverse()) {
      const exact = bySlug.get(s);
      if (exact?.length) return exact.find((p) => p.region === region) ?? exact[0];
      if (s.length >= 5) {
        const pre = rows.filter((p) => slug(p.name).startsWith(s.slice(0, Math.max(5, s.length - 2))));
        if (pre.length) return pre.find((p) => p.region === region) ?? pre[0];
      }
    }
    // tikai pilsēta bez apkaimes (piem. ".../flats/riga/x.html") → tās centrs; citādi vietu labāk neminēt nekā minēt nepareizi
    if (region && norm.length === 1 && !segs[0].endsWith("-and-reg")) {
      return rows.find((p) => p.region === region && slug(p.name) === "centrs") ?? null;
    }
    return null;
  };
}

// ---------- marka / modelis ----------
type MakeRow = { id: number; name: string; vehicleClass: string };
type ModelRow = { id: number; makeId: number; name: string };

function matchModel(list: ModelRow[], makeId: number, raw: string) {
  const r = slug(raw.replace(/\(.*?\)/g, ""));
  const mine = list.filter((m) => m.makeId === makeId);
  return mine.find((m) => slug(m.name) === r) ?? mine.find((m) => slug(m.name).replace(/-/g, "") === r.replace(/-/g, "")) ?? mine.find((m) => r.startsWith(slug(m.name)) && slug(m.name).length >= 2) ?? null;
}

// ---------- viena ieraksta pārveide ----------
export type ImportRow = typeof listings.$inferInsert;

export function mapItem(
  feed: Feed,
  item: RssItem,
  ctx: { findPlace: ReturnType<typeof makePlaceFinder>; makes: MakeRow[]; models: ModelRow[] },
): ImportRow | null {
  const f = item.fields;
  const priced = parsePrice(first(f, "Cena"));
  if (!priced) return null; // "pērku", "maiņai" bez cenas u.c.
  const externalId = new URL(item.link).pathname.split("/").pop()!.replace(/\.html$/, "");
  const base = {
    kind: feed.kind as "vehicle" | "property",
    status: "active" as const,
    source: "ss.com" as const,
    externalUrl: item.link,
    externalId,
    price: priced.price,
    // ienākšanas laiks pie mums (ne ss.com publicēšanas laiks), lai saglabāto meklēšanu paziņojumi tos neizlaistu
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (feed.kind === "vehicle") {
    const path = new URL(item.link).pathname;
    if (feed.vehicleClass === "moto" && !path.includes("/motorcycles/")) return null; // rezerves daļas, skuteri u.c.
    // marka: no "Marka" lauka (auto) vai adreses ceļa (moto: …/motorcycles/kawasaki/…)
    const makeRaw = first(f, "Marka") ?? path.split("/").filter(Boolean).at(-2) ?? "";
    const modelRaw = feed.vehicleClass === "car" ? (f["Modelis"]?.[0] ?? f["Marka"]?.[1] ?? "") : (first(f, "Modelis") ?? "");
    const make = ctx.makes.find((m) => m.vehicleClass === feed.vehicleClass && slug(m.name) === slug(makeRaw));
    const model = make ? matchModel(ctx.models, make.id, modelRaw) : null;
    const year = int(first(f, "Gads"));
    const { engineL, fuel } = engine(first(f, "Tilpums"));
    const makeName = make?.name ?? (makeRaw ? makeRaw[0].toUpperCase() + makeRaw.slice(1) : "");
    const modelName = model?.name ?? modelRaw;
    const title = [makeName, modelName, engineL ? Number(engineL).toFixed(1) : "", fuel === "Dīzelis" ? "dīzelis" : fuel === "Hibrīds" ? "hibrīds" : "", year ?? ""]
      .filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (!title) return null;
    return {
      ...base,
      title: title.slice(0, 120),
      vehicleClass: feed.vehicleClass,
      makeId: make?.id ?? null,
      modelId: model?.id ?? null,
      makeText: make ? null : makeName || null,
      modelText: model ? null : modelRaw || null,
      year: year && year > 1900 && year < 2100 ? year : null,
      mileageKm: mileage(first(f, "Nobraukums")),
      engineL,
      fuel,
    };
  }

  // nekustamais īpašums
  const place = ctx.findPlace(item.link, 2);
  const rooms = int(first(f, "Ist."));
  const area = feed.propertyType === "Zeme" ? null : int(first(f, "m²"));
  const land = feed.propertyType === "Zeme" ? parseLand(first(f, "m²")) : parseLand(first(f, "Zem. pl."));
  const floorRaw = first(f, "Stāvs")?.match(/^(-?\d+)\/(\d+)/);
  const where = place ? `, ${place.name}` : "";
  const title =
    feed.propertyType === "Dzīvoklis" ? `${rooms ?? 1}-istabu dzīvoklis${area ? `, ${area} m²` : ""}${where}`
    : feed.propertyType === "Māja" ? `Privātmāja${area ? ` ${area} m²` : ""}${land ? `, zeme ${landLabel(land)}` : ""}${where}`
    : `Zemes gabals${land ? ` ${landLabel(land)}` : ""}${where}`;
  return {
    ...base,
    title: title.slice(0, 120),
    propertyType: feed.propertyType,
    deal: priced.deal,
    rooms: rooms && rooms > 0 && rooms < 50 ? rooms : null,
    areaM2: area && area > 0 ? String(area) : null,
    landM2: land,
    floor: floorRaw ? Number(floorRaw[1]) : null,
    floors: floorRaw ? Number(floorRaw[2]) : int(first(f, "Stāvi")),
    series: series(first(f, "Sērija")),
    placeId: place?.id ?? null,
    lat: place ? place.lat + (Math.random() - 0.5) * 0.006 : null,
    lon: place ? place.lon + (Math.random() - 0.5) * 0.012 : null,
  };
}

// ---------- imports ----------
export type ImportResult = { feeds: number; items: number; created: number; updated: number; skipped: number; hidden: number; errors: string[] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function importSsRss(fetchXml: (url: string) => Promise<string> = defaultFetch): Promise<ImportResult> {
  const res: ImportResult = { feeds: 0, items: 0, created: 0, updated: 0, skipped: 0, hidden: 0, errors: [] };
  const [placeRows, makeRows, modelRows] = await Promise.all([
    db.select({ id: places.id, name: places.name, lat: places.lat, lon: places.lon, region: regions.name })
      .from(places).innerJoin(regions, eq(places.regionId, regions.id)).where(eq(regions.country, "LV")),
    db.select({ id: makes.id, name: makes.name, vehicleClass: makes.vehicleClass }).from(makes),
    db.select({ id: models.id, makeId: models.makeId, name: models.name }).from(models),
  ]);
  const ctx = { findPlace: makePlaceFinder(placeRows as PlaceRow[]), makes: makeRows as MakeRow[], models: modelRows };

  const seen = new Set<string>();
  for (const feed of SS_FEEDS) {
    let xml: string;
    try {
      xml = await fetchXml(feed.url);
      res.feeds++;
    } catch (err) {
      res.errors.push(`${feed.url}: ${err instanceof Error ? err.message : err}`);
      continue;
    }
    for (const item of parseRss(xml)) {
      res.items++;
      const row = mapItem(feed, item, ctx);
      if (!row || seen.has(row.externalId!)) {
        res.skipped++;
        continue;
      }
      seen.add(row.externalId!);
      const existing = await db.query.listings.findFirst({
        where: and(eq(listings.source, "ss.com"), eq(listings.externalId, row.externalId!)),
        columns: { id: true, price: true },
      });
      if (!existing) {
        const [ins] = await db.insert(listings).values(row).onConflictDoNothing().returning({ id: listings.id });
        if (ins) {
          await db.insert(priceHistory).values({ listingId: ins.id, price: row.price });
          res.created++;
        }
      } else {
        // atkārtoti RSS (pacelts vai mainīta cena): atjaunojam cenu un "redzēts" laiku
        await db.update(listings).set({ price: row.price, updatedAt: new Date() }).where(eq(listings.id, existing.id));
        if (existing.price !== row.price) await db.insert(priceHistory).values({ listingId: existing.id, price: row.price });
        res.updated++;
      }
    }
    await sleep(1500); // pieklājīgi: plūsmas pa vienai
  }

  // vecie ārējie sludinājumi (RSS nepasaka, kad oriģināls izdzēsts)
  const cutoff = new Date(Date.now() - EXTERNAL_TTL_DAYS * 86_400_000);
  const hidden = await db
    .update(listings)
    .set({ status: "hidden" })
    .where(and(eq(listings.source, "ss.com"), eq(listings.status, "active"), lt(listings.updatedAt, cutoff)))
    .returning({ id: listings.id });
  res.hidden = hidden.length;
  return res;
}

async function defaultFetch(url: string) {
  const r = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "application/rss+xml, text/xml" }, signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

