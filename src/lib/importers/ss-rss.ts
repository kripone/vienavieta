// ss.com RSS imports. Lieto tikai ss.com publicētās RSS plūsmas (sk. SS_FEEDS) un no tām ņem tikai faktus:
// marka/modelis, gads, nobraukums, tilpums, cena, istabas, platība, stāvs, sērija, zeme un vieta (no adreses ceļa).
// Pārdevēja teksts un bildes netiek kopētas; virsrakstu veidojam paši; kartītē ir saite uz oriģinālu.
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { EXTERNAL_TTL_DAYS, SERIES, SS_FEEDS, type PropertyType } from "../constants";
import { linkDuplicate } from "../dedupe";
import { inferBody } from "../illustrations";
import { landLabel } from "../listing-input";

const { listings, places, regions, makes, models, priceHistory } = schema;

/** Plūsmas vai sadaļas apraksts: kas tajā ir (transports ar klasi vai īpašums ar veidu). */
type Feed = { kind: "vehicle"; vehicleClass: "car" | "moto" | "camper" } | { kind: "property"; propertyType: PropertyType; url?: string };
export type RssItem = { link: string; pubDate: Date; fields: Record<string, string[]>; /** sludinājuma teksta sākums, tikai modeļa atpazīšanai */ snippet?: string };

// tikai ASCII: HTTP galvenēs nedrīkst būt garumzīmes
const USER_AGENT = "VienaVietaBot/1.0 (+https://vienavieta.lv; RSS reader)";

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
    const snippet = body.match(/<title>\s*<!\[CDATA\[([\s\S]*?)\]\]>/)?.[1];
    if (!link || !/^https:\/\/www\.ss\.(com|lv)\/msg\//.test(link)) continue;
    const d = pub ? new Date(pub) : new Date();
    items.push({ link, pubDate: Number.isNaN(d.getTime()) ? new Date() : d, fields: parseFields(desc), snippet });
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
  const m2 = /ha/.test(v) ? Math.round(n * 10_000) : Math.round(n);
  // virs 10 000 ha (100M m²) ir acīmredzama mērvienības/parse kļūda; land_m2 kolonna ir
  // integer (max ~2.15 mljrd m²), lielāka vērtija nogāž insert (city24 "677000 ha" gadījums)
  return m2 > 100_000_000 ? null : m2;
}

/** "1.8H" → { engineL: 1.8, fuel: Hibrīds } */
function engine(v?: string) {
  if (v?.trim().toUpperCase() === "E") return { engineL: null, fuel: "Elektro" };
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
// ss.com adresē vieta ir hierarhija: <rajons>/<pilsēta | X-pag | X-l-t | X-nov>/<ciems>, piem.
// riga-region/salas-pag/spunciems, liepaja-and-reg/nicas-pag, riga/agenskalns. Mūsu katalogs (VZD adrešu reģistrs):
// novads → pilsēta / pagasts → ciems. Pēc prefiksa nemin: labāk bez vietas nekā nepareiza vieta.
type PlaceRow = { id: number; name: string; lat: number; lon: number; region: string; kind?: string | null; parentId?: number | null };
const SEGMENT_SKIP = new Set(["other", "all", "today", "sell", "hand_over"]);
const ALIASES: Record<string, string> = { centre: "centrs", "maskavas-priekspilseta": "maskavas-forstate", vecriga: "vecriga" };
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
/** "Salas pagasts" → "salas" (ss.com raksta "salas-pag") */
const parishStem = (name: string) => norm(name.replace(/ pagasts$/, ""));

/** ss.com rajons → mūsdienu novadi (pēc 2021./2025. gada reformas) un valstspilsēta. */
const SS_AREA: Record<string, { regions: string[]; city?: string }> = {
  riga: { regions: [], city: "Rīga" },
  jurmala: { regions: [], city: "Jūrmala" },
  "riga-region": { regions: ["Ādažu novads", "Ķekavas novads", "Mārupes novads", "Olaines novads", "Ropažu novads", "Salaspils novads", "Saulkrastu novads", "Siguldas novads"] },
  "aizkraukle-and-reg": { regions: ["Aizkraukles novads"] },
  "aluksne-and-reg": { regions: ["Alūksnes novads"] },
  "balvi-and-reg": { regions: ["Balvu novads"] },
  "bauska-and-reg": { regions: ["Bauskas novads"] },
  "cesis-and-reg": { regions: ["Cēsu novads"] },
  "daugavpils-and-reg": { regions: ["Augšdaugavas novads"], city: "Daugavpils" },
  "dobele-and-reg": { regions: ["Dobeles novads"] },
  "gulbene-and-reg": { regions: ["Gulbenes novads"] },
  "jekabpils-and-reg": { regions: ["Jēkabpils novads"] },
  "jelgava-and-reg": { regions: ["Jelgavas novads"], city: "Jelgava" },
  "kraslava-and-reg": { regions: ["Krāslavas novads"] },
  "kuldiga-and-reg": { regions: ["Kuldīgas novads"] },
  "liepaja-and-reg": { regions: ["Dienvidkurzemes novads"], city: "Liepāja" },
  "limbadzi-and-reg": { regions: ["Limbažu novads"] },
  "limbazi-and-reg": { regions: ["Limbažu novads"] },
  "ludza-and-reg": { regions: ["Ludzas novads"] },
  "madona-and-reg": { regions: ["Madonas novads"] },
  "ogre-and-reg": { regions: ["Ogres novads"] },
  "preili-and-reg": { regions: ["Preiļu novads", "Līvānu novads"] },
  "rezekne-and-reg": { regions: ["Rēzeknes novads"], city: "Rēzekne" },
  "saldus-and-reg": { regions: ["Saldus novads"] },
  "talsi-and-reg": { regions: ["Talsu novads"] },
  "tukums-and-reg": { regions: ["Tukuma novads"] },
  "valka-and-reg": { regions: ["Valkas novads", "Smiltenes novads"] },
  "valmiera-and-reg": { regions: ["Valmieras novads"] },
  "ventspils-and-reg": { regions: ["Ventspils novads"], city: "Ventspils" },
};

export function makePlaceFinder(rows: PlaceRow[]) {
  const byRegion = new Map<string, PlaceRow[]>();
  for (const p of rows) byRegion.set(p.region, [...(byRegion.get(p.region) ?? []), p]);
  const prefer = (list: PlaceRow[], regions: string[]) => list.find((p) => regions.includes(p.region)) ?? (list.length === 1 ? list[0] : null);
  const towns = rows.filter((p) => p.kind === "town");
  const parishes = rows.filter((p) => p.kind === "parish");
  const villages = rows.filter((p) => p.kind === "village");

  /** valstspilsētas apkaime: precīzi, tad pēc prefiksa tikai šīs pilsētas robežās; citādi centrs */
  function inCity(city: string, rest: string[]): PlaceRow | null {
    const list = byRegion.get(city) ?? [];
    const segs = rest.filter((s) => !SEGMENT_SKIP.has(s)).map((s) => ALIASES[norm(s)] ?? norm(s));
    for (const s of [...segs].reverse()) {
      if (s === norm(city)) continue;
      const exact = list.find((p) => norm(p.name) === s);
      if (exact) return exact;
      if (s.length >= 5) {
        const pre = list.find((p) => norm(p.name).startsWith(s.slice(0, Math.max(5, s.length - 2))));
        if (pre) return pre;
      }
    }
    return list.find((p) => norm(p.name) === "centrs") ?? (list.length === 1 ? list[0] : list.find((p) => norm(p.name) === norm(city)) ?? list[0] ?? null);
  }

  return (url: string, categoryDepth: number): PlaceRow | null => {
    // https://www.ss.com/msg/lv/real-estate/flats/riga/agenskalns/abcde.html → ["riga","agenskalns"]
    const segs = new URL(url).pathname.split("/").filter(Boolean).slice(2 + categoryDepth, -1);
    if (!segs.length) return null;
    const area = SS_AREA[segs[0]];
    if (!area) return null; // ārzemes, "other"
    if (!area.regions.length) return inCity(area.city!, segs.slice(1));
    const s1 = segs[1];
    if (!s1 || SEGMENT_SKIP.has(s1)) return null;
    // valstspilsēta savā rajonā (liepaja-and-reg/liepaja) vai Rīga/Jūrmala Rīgas rajonā
    for (const city of [area.city, "Rīga", "Jūrmala"]) if (city && s1 === norm(city)) return inCity(city, segs.slice(2));
    const m = s1.match(/^(.+)-(pag|l-t|nov)$/);
    let base: PlaceRow | null = null;
    if (m?.[2] === "l-t") {
      // "lauku teritorija" (ikskiles-l-t, keguma-l-t): pilsēta ar apkārtni → pilsēta; ja tādas nav, pagasts
      const stem = m[1];
      base = prefer(towns.filter((t) => area.regions.includes(t.region) && stem.startsWith(norm(t.name).slice(0, -1))), area.regions)
        ?? prefer(parishes.filter((p) => parishStem(p.name) === stem), area.regions);
    } else if (m) base = prefer(parishes.filter((p) => parishStem(p.name) === m[1]), area.regions);
    else {
      base = prefer(towns.filter((p) => norm(p.name) === s1), area.regions)
        ?? prefer(parishes.filter((p) => parishStem(p.name) === s1), area.regions)
        ?? prefer(villages.filter((p) => norm(p.name) === s1 && area.regions.includes(p.region)), area.regions);
    }
    const s2 = segs[2] && !SEGMENT_SKIP.has(segs[2]) ? norm(segs[2]).replace(/-\d+$/, "") : null;
    if (s2) {
      const inside = base ? villages.filter((v) => v.parentId === base!.id && norm(v.name).replace(/-\d+$/, "") === s2) : [];
      const v = inside[0]
        ?? prefer(towns.filter((t) => norm(t.name) === s2 && area.regions.includes(t.region)), area.regions) // adazu-nov/adazi → Ādaži
        ?? prefer(parishes.filter((p) => parishStem(p.name) === s2.replace(/-(pag|l-t)$/, "") && area.regions.includes(p.region)), area.regions)
        ?? prefer(villages.filter((v) => norm(v.name) === s2 && area.regions.includes(v.region)), area.regions);
      if (v) return v;
    }
    return base;
  };
}

/** "Ogre un raj." / "Rīga" / "Jūrmala" → pilsētas vieta (pilsētām: centrs). "Rīgas rajons" u.c. bez pilsētas → null. */
export function makeCityFinder(rows: PlaceRow[]) {
  return (t: string): PlaceRow | null => {
    const s = slug(t.replace(/\s+un\s+raj\.?$/i, ""));
    if (!s || /rajons$/.test(s)) return null;
    const city = rows.filter((p) => slug(p.region) === s);
    if (city.length) return city.find((p) => slug(p.name) === "centrs" || slug(p.name) === "centras") ?? city[0];
    return rows.find((p) => slug(p.name) === s) ?? null;
  };
}

// ---------- marka / modelis ----------
type MakeRow = { id: number; name: string; vehicleClass: string };
type ModelRow = { id: number; makeId: number; name: string };

/** ss.com markas nosaukumi, kas atšķiras no mūsu kataloga. */
const MAKE_ALIASES: Record<string, string> = {
  buerstner: "burstner", buestner: "burstner", bursner: "burstner", "eura-mobil": "eura-mobil", euramobil: "eura-mobil",
  mercedes: "mercedes-benz", "mercedes-benz": "mercedes-benz", vw: "volkswagen", "land-rover": "land-rover", landrover: "land-rover",
  "alfa-romeo": "alfa-romeo", alfa: "alfa-romeo", citroen: "citroen", skoda: "skoda", "rolls-royce": "rolls-royce", vaz: "lada", "gaz": "gaz",
};

export function findMake(makes: MakeRow[], vehicleClass: string, raw: string) {
  const k = slug(raw);
  const want = MAKE_ALIASES[k] ?? k;
  return (
    makes.find((m) => m.vehicleClass === vehicleClass && slug(m.name) === want) ??
    // atstarpju/defišu variācijas: "Dong feng" → "Dongfeng", "Mercedes Benz" → "Mercedes-Benz"
    makes.find((m) => m.vehicleClass === vehicleClass && slug(m.name).replace(/-/g, "") === want.replace(/-/g, "")) ??
    null
  );
}

/** ss.com modeļu pieraksts → mūsu katalogs: BMW "320d" → "3. sērija", Mercedes "E220" → "E klase", "ML350" → "M klase". */
/** ss.com modeļu nosaukumi, kas mūsu katalogā saucas citādi (pēc markas, slug formā). */
const MODEL_ALIASES: Record<string, Record<string, string>> = {
  audi: { allroad: "A6 Allroad" },
  volkswagen: { t3: "Transporter", t4: "Transporter", t5: "Transporter", t6: "Transporter", "t6-1": "Transporter", t7: "Transporter" },
  skoda: { praktik: "Roomster" },
};

function normalizeModel(makeName: string, raw: string) {
  let r = raw.replace(/\(.*?\)/g, "").trim();
  // "Mazda6", "Mazda CX-60" → "6", "CX-60"
  const mk = makeName.split(/[\s-]/)[0];
  if (mk && r.toLowerCase().startsWith(mk.toLowerCase()) && r.length > mk.length) r = r.slice(mk.length).replace(/^[\s-]+/, "");
  const alias = MODEL_ALIASES[slug(makeName)]?.[slug(r)];
  if (alias) return alias;
  if (/^bmw$/i.test(makeName)) {
    const m = r.match(/^(\d)\d{2}\s?[a-z]{0,3}$/i);
    if (m) return `${m[1]}. sērija`;
  }
  if (/^mercedes/i.test(makeName)) {
    const m = r.match(/^([A-Za-z]{1,3})[\s-]?\d{2,3}/);
    if (m) {
      const L = m[1].toUpperCase();
      if (L.length === 1) return `${L} klase`;
      if (L === "ML") return "M klase";
      return L; // CLS, GLE, GLC, CLA, SLK …
    }
  }
  return r;
}

export function matchModel(list: ModelRow[], makeId: number, raw: string, makeName = "") {
  const r = slug(normalizeModel(makeName, raw));
  if (!r) return null;
  const mine = list.filter((m) => m.makeId === makeId);
  return (
    mine.find((m) => slug(m.name) === r) ??
    mine.find((m) => slug(m.name).replace(/-/g, "") === r.replace(/-/g, "")) ??
    mine.find((m) => r.startsWith(slug(m.name)) && slug(m.name).length >= 2) ??
    // "21" → "21 Volga", ja tāds ir tikai viens
    (() => {
      const pre = mine.filter((m) => slug(m.name).startsWith(r + "-"));
      return pre.length === 1 ? pre[0] : null;
    })() ??
    null
  );
}

/**
 * Ja ss.com modelis ir "Citi", meklējam mūsu kataloga modeli sludinājuma teksta sākumā (piem. "Kia EV6 GT-Line…").
 * Tekstu izmantojam tikai atpazīšanai; to neglabājam un nerādām.
 */
export function modelFromText(list: ModelRow[], makeId: number, text?: string) {
  if (!text) return null;
  const words = ` ${slug(text.slice(0, 160)).replace(/-/g, " ")} `;
  const compact = words.replace(/\s+/g, "");
  const mine = list.filter((m) => m.makeId === makeId).sort((a, b) => b.name.length - a.name.length);
  for (const m of mine) {
    const spaced = slug(m.name).replace(/-/g, " ");
    if (spaced.length < 2) continue;
    if (words.includes(` ${spaced} `)) return m;
    const c = spaced.replace(/\s+/g, "");
    // "ID 4" un "ID.4" tekstā "id4": tikai, ja nosaukumā ir burti un cipari (citādi "golf" atrastos "golfklubā")
    if (c.length >= 3 && /\d/.test(c) && /[a-z]/.test(c) && new RegExp(`(^|\\s)${c.split("").join("\\s?")}(\\s|$)`).test(words)) return m;
  }
  return compact ? null : null;
}

/** Virsraksts ārējam transportam no faktiem, piem. "Kia EV6 2022", "BMW 3. sērija 2.0 dīzelis 2016". */
export function vehicleTitle(make: string, model: string, engineL: string | null, fuel: string | null, year: number | null) {
  return [make, model, engineL ? Number(engineL).toFixed(1) : "", fuel === "Dīzelis" ? "dīzelis" : fuel === "Hibrīds" ? "hibrīds" : "", year ?? ""]
    .filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

// ---------- viena ieraksta pārveide ----------
export type ImportRow = typeof listings.$inferInsert;
export type { Feed, PlaceRow, MakeRow, ModelRow };

/**
 * ss.com "Mājas, vasarnīcas" sadaļā ir gan privātmājas, gan vasarnīcas/dārza mājas. Atšķiram pēc sludinājuma
 * teksta sākuma saraksta rindā (tekstu neglabājam, tikai nosakām veidu).
 */
export function isSummerHouse(snippet?: string) {
  if (!snippet) return false;
  const s = snippet.toLowerCase();
  return /vasarn[iī]c|d[aā]rza\s*m[aā]j|d[aā]rzkop[iī]bas|d[aā]rzi[nņ][aā]\s*m[aā]j|br[iī]vdienu\s*m[aā]j|vasaras\s*m[aā]j|(^|[^а-яё])дач|садов\S*\s*(дом|участ)|дачн/.test(s);
}

/** Kempera veids pēc saraksta teksta sākuma (neglabājam) vai markas, kas ražo tikai dzīvojamās piekabes. */
const CARAVAN_ONLY = new Set(["Hobby", "Tabbert", "Fendt", "LMC", "Wilk", "Eriba", "Kabe", "Solifer", "Caravelair", "Sterckeman", "Cabby", "Nomad", "Swift", "Bailey", "Elddis"].map((m) => slug(m)));
export function camperBody(snippet: string | undefined, make: string): string | null {
  const s = (snippet ?? "").toLowerCase();
  if (/treiler|piekab|karavan|caravan|прицеп|караван|дача на колес/.test(s)) return "Treileris";
  if (/alkov|альков/.test(s)) return "Alkova";
  if (/daļēji integr|dalēji integr|teilintegr|semi.?integr|полуинтегр/.test(s)) return "Daļēji integrētais";
  if (/integr|интегр/.test(s)) return "Integrētais";
  if (/kemperfurg|campervan|camper van|кемпервэн|автодом на базе микроавтобус/.test(s)) return "Kemperfurgons";
  return CARAVAN_ONLY.has(slug(make)) ? "Treileris" : null;
}

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
    const modelRaw0 = feed.vehicleClass !== "moto" ? (f["Modelis"]?.[0] ?? f["Marka"]?.[1] ?? "") : (first(f, "Modelis") ?? "");
    const isOther = /^(citi|cits|cita|other|another)$/i.test(modelRaw0.trim()); // ss.com "Citi" = modelis nav viņu sarakstā
    // "Hobby Hobby", "Cabby Cabby 532": modeļa laukā atkārtota marka
    const makeHead = (first(f, "Marka") ?? "").trim();
    const modelRaw = isOther ? "" : feed.vehicleClass === "camper" && makeHead && slug(modelRaw0).startsWith(slug(makeHead)) ? modelRaw0.trim().slice(makeHead.length).trim() : modelRaw0;
    const make = findMake(ctx.makes, feed.vehicleClass, makeRaw);
    // ss.com "Kempingi" sadaļā ir arī piederumi (akumulatori, ledusskapji, invertori): ņemam tikai zināmas kemperu/bāzes markas vai dārgus
    if (feed.vehicleClass === "camper" && priced.price < (make ? 300 : 1000)) return null;
    // neatpazīts vai "Citi": mēģinām atrast modeli sludinājuma teksta sākumā (piem. "Tourneo" → "Tourneo Custom")
    const model = make ? (matchModel(ctx.models, make.id, modelRaw, make.name) ?? modelFromText(ctx.models, make.id, item.snippet)) : null;
    const year = int(first(f, "Gads"));
    const { engineL, fuel } = engine(first(f, "Tilpums"));
    const makeName = make?.name ?? (makeRaw ? makeRaw[0].toUpperCase() + makeRaw.slice(1) : "");
    const modelName = model?.name ?? modelRaw;
    const title = vehicleTitle(makeName, modelName, engineL, fuel, year);
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
      // virsbūve RSS nav norādīta: nosakām pēc modeļa (RAV4 → apvidus, Passat Variant → universāls), citādi nezināma
      body: feed.vehicleClass === "car" ? inferBody(modelName) ?? inferBody(modelRaw) : feed.vehicleClass === "camper" ? camperBody(item.snippet, makeName) : null,
    };
  }

  // nekustamais īpašums
  // kategorijas dziļums sludinājuma adresē: real-estate/flats = 2, real-estate/premises/garages = 3
  const place = ctx.findPlace(item.link, feed.url?.includes("/premises/") ? 3 : 2);
  const rooms = int(first(f, "Ist."));
  // zemei un mežam saraksta "m²"/"Platība" ir zemes platība; pārējiem — telpu platība
  const isLand = feed.propertyType === "Zeme" || feed.propertyType === "Mežs";
  const ptype: PropertyType = feed.propertyType === "Māja" && isSummerHouse(item.snippet) ? "Vasarnīca" : feed.propertyType;
  const areaRaw = first(f, "m²") ?? first(f, "Platība");
  const area = isLand ? null : int(areaRaw);
  const land = isLand ? parseLand(areaRaw ?? first(f, "ha")) : parseLand(first(f, "Zem. pl."));
  const floorRaw = first(f, "Stāvs")?.match(/^(-?\d+)\/(\d+)/);
  const where = place ? `, ${slug(place.name) === "centrs" ? place.region : place.name}` : "";
  const title =
    feed.propertyType === "Dzīvoklis" ? `${rooms ?? 1}-istabu dzīvoklis${area ? `, ${area} m²` : ""}${where}`
    : ptype === "Vasarnīca" ? `Vasarnīca${area ? ` ${area} m²` : ""}${land ? `, zeme ${landLabel(land)}` : ""}${where}`
    : feed.propertyType === "Māja" ? `Privātmāja${area ? ` ${area} m²` : ""}${land ? `, zeme ${landLabel(land)}` : ""}${where}`
    : feed.propertyType === "Zeme" ? `Zemes gabals${land ? ` ${landLabel(land)}` : ""}${where}`
    : feed.propertyType === "Mežs" ? `Meža īpašums${land ? ` ${landLabel(land)}` : ""}${where}`
    : `${feed.propertyType}${area ? ` ${area} m²` : ""}${where}`;
  // iela no saraksta ("Rīga<br>Gaigalas 17" vai RSS laukā "Iela"); ģeokodēšanai (src/lib/geocode.ts)
  const streetRaw = f["Rajons"]?.[1] ?? f["Pagasts"]?.[1] ?? f["Pilsēta"]?.[1] ?? first(f, "Iela");
  const street = streetRaw && /\p{L}{3,}/u.test(streetRaw) && !/(nov\.|pag\.)$/i.test(streetRaw) ? streetRaw.replace(/\s+/g, " ").trim().slice(0, 80) : null;
  return {
    ...base,
    title: title.slice(0, 120),
    address: street && place ? `${street}, ${slug(place.name) === "centrs" ? place.region : `${place.name}, ${place.region}`}` : null,
    geoPrecision: place ? "place" : null,
    propertyType: ptype,
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
export type ImportResult = { feeds: number; items: number; created: number; updated: number; skipped: number; hidden: number; duplicates: number; errors: string[] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function importSsRss(fetchXml: (url: string) => Promise<string> = defaultFetch): Promise<ImportResult> {
  const res: ImportResult = { feeds: 0, items: 0, created: 0, updated: 0, skipped: 0, hidden: 0, duplicates: 0, errors: [] };
  const [placeRows, makeRows, modelRows] = await Promise.all([
    db.select({ id: places.id, name: places.name, lat: places.lat, lon: places.lon, region: regions.name, kind: places.kind, parentId: places.parentId })
      .from(places).innerJoin(regions, eq(places.regionId, regions.id)).where(inArray(regions.country, ["LV", "LT"])),
    db.select({ id: makes.id, name: makes.name, vehicleClass: makes.vehicleClass }).from(makes),
    db.select({ id: models.id, makeId: models.makeId, name: models.name }).from(models),
  ]);
  const ctx = { findPlace: makePlaceFinder(placeRows as PlaceRow[]), makes: makeRows as MakeRow[], models: modelRows };

  const seen = new Set<string>();
  for (const feed of SS_FEEDS as readonly (Feed & { url: string })[]) {
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
          if (await linkDuplicate(ins.id).catch(() => null)) res.duplicates++;
        }
      } else {
        // atkārtoti RSS (pacelts vai mainīta cena): atjaunojam cenu un "redzēts" laiku
        await db
          .update(listings)
          .set({ price: row.price, updatedAt: new Date(), ...(existing.price !== row.price ? { firstPrice: sql`coalesce(${listings.firstPrice}, ${existing.price})` } : {}) })
          .where(eq(listings.id, existing.id));
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

