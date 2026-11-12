// autoplius.lt vieglajiem auto sarakstu ievākšana (lietotājs apstiprināja 2026-11-11, sk. CLAUDE.md).
// Parasto HTTP pieprasījumu bloķē Cloudflare, tāpēc lapas atver ar reālu pārlūku (Playwright, chromium).
// Lasa tikai saraksta kartītes: marka/modelis, gads, cena, virsbūve, degviela, ātrumkārba, tilpums/jauda,
// nobraukums, vieta un sīktēla adrese. Sludinājumu lapas neatveram, pārdevēju tekstus un bildes nekopējam
// (sīktēli tiek rādīti no autoplius servera ar avota norādi); virsrakstu veidojam paši.
// Nomas sludinājumi (cena "Parai/Mēnesī") tiek izlaisti — ņemam tikai pārdošanas sludinājumus.
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { AUTOPLIUS, AUTOPLIUS_LT, EXTERNAL_TTL_DAYS } from "../constants";
import { linkDuplicate } from "../dedupe";
import { inferBody } from "../illustrations";
import { findMake, matchModel, slug, vehicleTitle, type ImportRow, type MakeRow, type ModelRow, type PlaceRow } from "./ss-rss";
import { withCrawlLock } from "./crawl-lock";
import { loadCtx } from "./ss-pages";

const { listings, priceHistory, crawlState } = schema;

export type ApRow = {
  link: string;
  externalId: string;
  titleRaw: string;
  price: number;
  year: number | null;
  bodyRaw: string | null;
  fuelRaw: string | null;
  gearboxRaw: string | null;
  engineL: string | null;
  powerKw: number | null;
  mileageKm: number | null;
  city: string | null;
  thumb: string | null;
};

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
const text = (html: string) => decode(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** "Mehāniskā"/"Automātiskā" (lv) vai "Mechaninė"/"Automatinė" (lt) → mūsu katalogs. */
export function mapGearbox(v?: string | null) {
  const s = (v ?? "").toLowerCase();
  if (s.startsWith("meh") || s.startsWith("mec")) return "Manuāla";
  if (s.startsWith("aut")) return "Automāts";
  return null;
}

/** autoplius degvielas pieraksts (var būt vairākas ar " / "; lv un lt valodās) → mūsu katalogs. */
export function mapFuel(v?: string | null) {
  const s = (v ?? "").toLowerCase();
  if (!s) return null;
  if (s.includes("benz") && s.includes("elektr")) return "Hibrīds";
  if (s.startsWith("elektr")) return "Elektro";
  if (s.includes("dīzel") || s.includes("dzel") || s.includes("dyzel")) return "Dīzelis";
  if (s.includes("gāze") || s.includes("gaze") || s.includes("duj")) return "Benzīns/gāze";
  if (s.includes("benz")) return "Benzīns";
  return null;
}

const BODY_MAP: Record<string, string> = {
  // latviski
  sedans: "Sedans",
  limuzins: "Sedans",
  universalas: "Universāls",
  hecbeks: "Hečbeks",
  "visurgajejs-krosovers": "Apvidus",
  krosovers: "Apvidus",
  minivens: "Minivens",
  kupeja: "Kupeja",
  kupe: "Kupeja",
  "kabriolets-roadster": "Kabriolets",
  kabriolets: "Kabriolets",
  pikaps: "Pikaps",
  mikroautobuss: "Mikroautobuss",
  // lietuviski (lt.autoplius.lt)
  sedanas: "Sedans",
  limuzinas: "Sedans",
  hecbekas: "Hečbeks",
  visureigis: "Apvidus",
  "visureigis-krosoveris": "Apvidus",
  krosoveris: "Apvidus",
  minivenas: "Minivens",
  kabrioletas: "Kabriolets",
  "kabrioletas-roadsteris": "Kabriolets",
  pikapas: "Pikaps",
  mikroautobusas: "Mikroautobuss",
};

/** autoplius virsbūves nosaukums (saraksta kartītē zem virsraksta) → mūsu katalogs. */
export function mapBody(v?: string | null) {
  if (!v) return null;
  return BODY_MAP[slug(v)] ?? null;
}

/**
 * Izvelk saraksta kartītes no lapas HTML. Kartītes atdala pēc atverošajiem
 * <a class="announcement-item"> tagiem (iekšējo </a> ligzdošanas dēļ negriežam pēc aizverošā).
 */
export function parseListPage(html: string): { rows: ApRow[]; lastPage: number } {
  const opens = [...html.matchAll(/<a\b[^>]*class="announcement-item[^"]*"[^>]*>/g)];
  const rows: ApRow[] = [];
  for (let i = 0; i < opens.length; i++) {
    const tag = opens[i][0];
    const href = tag.match(/href="([^"]+)"/)?.[1] ?? "";
    if (!/autoplius\.lt\/(sludinajumi|skelbimai)\//.test(href)) continue;
    const externalId = href.match(/-(\d+)\.html/)?.[1];
    if (!externalId) continue;
    const body = html.slice(opens[i].index! + tag.length, opens[i + 1]?.index ?? html.length);

    // nomas sludinājumi (cena "Parai/Mēnesī") nav pārdošanas: izlaižam
    const pricing = body.match(/class="announcement-pricing-info">([\s\S]*?)<\/div>\s*<\/div>/)?.[1] ?? "";
    if (/rent-price/.test(pricing)) continue;
    const priceRaw = text(pricing.match(/<strong>([\s\S]*?)<\/strong>/)?.[1] ?? "");
    const price = Number(priceRaw.replace(/[^\d]/g, ""));
    if (!Number.isFinite(price) || price < 100 || price > 50_000_000) continue;

    const titleRaw = text(body.match(/class="announcement-title">([\s\S]*?)<\/div>/)?.[1] ?? "");
    if (!titleRaw) continue;

    // virsraksta parametri: izlaiduma gads ("2007-12") un virsbūve ("Universalas")
    const headParams = body.match(/class="announcement-title-parameters">([\s\S]*?)<\/div>\s*<\/div>/)?.[1] ?? "";
    const headSpans = [...headParams.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)].map((m) => text(m[1]));
    const year = Number(headSpans[0]?.match(/^(\d{4})/)?.[1] ?? href.match(/-((?:19|20)\d{2})-/)?.[1]) || null;
    const bodyRaw = headSpans[1] || null;

    // apakšējo parametru rinda: degviela, ātrumkārba, "2.0 l., 103 kW", "338 000 km", pilsēta (secība mainās)
    const paramsBlock = body.match(/class="announcement-parameters-block">([\s\S]*?)<\/div>\s*<\/div>/)?.[1] ?? "";
    const spans = [...paramsBlock.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)].map((m) => text(m[1])).filter(Boolean);
    const engineRaw = spans.find((s) => /kW/i.test(s)) ?? null;
    const mileageRaw = spans.find((s) => /km$/i.test(s)) ?? null;
    const gearboxRaw = spans.find((s) => /^(mehāniskā|automātiskā|mechaninė|automatinė)/i.test(s)) ?? null;
    const fuelRaw = spans.find((s) => s !== engineRaw && s !== mileageRaw && s !== gearboxRaw && /(benz|dīzel|dzel|dyzel|elektr|gāze|gaze|duj)/i.test(s)) ?? null;
    const used = new Set([engineRaw, mileageRaw, gearboxRaw, fuelRaw]);
    const city = [...spans].reverse().find((s) => !used.has(s))?.replace(/,\s*(Latvija|Lietuva|Igaunija)\s*$/i, "") ?? null;

    const em = engineRaw?.match(/([\d]+(?:\.\d+)?)\s*l\.,\s*(\d+)\s*kW/i);
    const engineL = em ? em[1] : null;
    const powerKw = Number(em?.[2] ?? engineRaw?.match(/(\d+)\s*kW/i)?.[1]) || null;
    const mileageKm = Number(mileageRaw?.replace(/[^\d]/g, "")) || null;

    // sīktēls: tikai no autoplius bilžu servera (rādām no turienes, neglabājam)
    const thumb = body.match(/<img[^>]*src="(https:\/\/autoplius-img\.[^"]+\.(?:jpg|jpeg|webp))"/)?.[1] ?? null;

    rows.push({ link: href, externalId, titleRaw, price, year: year && year > 1900 && year < 2100 ? year : null, bodyRaw, fuelRaw, gearboxRaw, engineL, powerKw, mileageKm, city, thumb });
  }
  const pages = [...html.matchAll(/[?&]page_nr=(\d+)/g)].map((m) => Number(m[1]));
  return { rows, lastPage: Math.max(1, ...pages) };
}

type Ctx = { makes: MakeRow[]; models: ModelRow[]; findCity: (t: string) => PlaceRow | null };

/** Saraksta kartīte → mūsu sludinājums (virsrakstu veidojam paši no faktiem, tāpat kā ss.com). */
export function mapRow(r: ApRow, ctx: Ctx, createdAt: Date): ImportRow | null {
  const titleSlug = slug(r.titleRaw);
  // marka: garākā kataloga marka, ar kuru sākas virsraksts ("Mercedes-Benz GLC300", "Land Rover Discovery")
  const cars = ctx.makes.filter((m) => m.vehicleClass === "car").sort((a, b) => slug(b.name).length - slug(a.name).length);
  let make = cars.find((m) => titleSlug === slug(m.name) || titleSlug.startsWith(`${slug(m.name)}-`)) ?? null;
  let modelRaw = make ? r.titleRaw.trim().slice(make.name.length).replace(/^[\s-]+/, "") : "";
  if (!make) {
    const firstWord = r.titleRaw.trim().split(/\s+/)[0] ?? "";
    make = findMake(ctx.makes, "car", firstWord);
    modelRaw = r.titleRaw.trim().slice(firstWord.length).trim();
  }
  const model = make ? matchModel(ctx.models, make.id, modelRaw, make.name) : null;
  const makeName = make?.name ?? r.titleRaw.trim().split(/\s+/)[0] ?? "";
  const modelName = model?.name ?? modelRaw;
  const fuel = mapFuel(r.fuelRaw);
  const title = vehicleTitle(makeName, modelName, r.engineL, fuel, r.year);
  if (!title) return null;
  const city = r.city ? ctx.findCity(r.city) : null;
  return {
    kind: "vehicle",
    status: "active",
    source: "autoplius.lt",
    externalUrl: r.link,
    externalId: r.externalId,
    externalThumbUrl: r.thumb,
    title: title.slice(0, 120),
    vehicleClass: "car",
    makeId: make?.id ?? null,
    modelId: model?.id ?? null,
    makeText: make ? null : makeName || null,
    modelText: model ? null : modelRaw || null,
    year: r.year,
    mileageKm: r.mileageKm,
    engineL: r.engineL,
    powerKw: r.powerKw,
    fuel,
    gearbox: mapGearbox(r.gearboxRaw),
    body: mapBody(r.bodyRaw) ?? inferBody(modelName) ?? inferBody(modelRaw),
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

/** Saglabā vienas lapas kartītes: jaunos ievieto, esošajiem atjauno cenu un "redzēts" laiku. */
async function saveRows(apRows: ApRow[], ctx: Ctx, res: CrawlResult, mode: "quick" | "full") {
  const now = new Date();
  // pilnajā kārtā atrastie ir vecāki sludinājumi: lai neaizsprosto "jaunākos", ienākšanas laiks diennakti agrāk
  const createdAt = mode === "full" ? new Date(now.getTime() - 86_400_000) : now;
  const mapped = apRows.map((r) => mapRow(r, ctx, createdAt)).filter((x): x is ImportRow => Boolean(x));
  const byId = new Map(mapped.map((m) => [m.externalId!, m]));
  if (!byId.size) return;
  const existing = await db
    .select({ id: listings.id, externalId: listings.externalId, price: listings.price, status: listings.status, thumb: listings.externalThumbUrl, makeId: listings.makeId, modelId: listings.modelId, placeId: listings.placeId })
    .from(listings)
    .where(and(eq(listings.source, "autoplius.lt"), inArray(listings.externalId, [...byId.keys()])));
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

/** Ievākšanas mērķis: viena valoda/plūsma ar savu crawl_state atslēgu un lapas adresi. */
export type ApTarget = { key: string; url: string; quickPages: number; maxPages: number; quickEveryMin: number; fullEveryHours: number };

/** Plūsmas, kuras ievācam: latviešu (lv.autoplius.lt) un lietuviešu (autoplius.lt). Sludinājumu ID ir kopīgi. */
export const AP_TARGETS: ApTarget[] = [AUTOPLIUS, AUTOPLIUS_LT];

const pageUrl = (t: ApTarget, n: number) => (n <= 1 ? t.url : `${t.url}?page_nr=${n}`);

/**
 * Viena kārta vienai plūsmai. "quick": pirmās target.quickPages lapas (jaunie un cenu maiņas).
 * "full": līdz target.maxPages lapām; beigās ilgi neredzētie tiek paslēpti (sk. EXTERNAL_TTL_DAYS).
 */
export async function crawlAutoplius(mode: "quick" | "full", target: ApTarget = AUTOPLIUS, fetchHtml: (url: string) => Promise<string> = browserFetch, delayMs = AUTOPLIUS.delayMs): Promise<CrawlResult> {
  const started = new Date();
  const res: CrawlResult = { mode, pages: 0, rows: 0, created: 0, updated: 0, priceChanged: 0, duplicates: 0, removed: 0, errors: [], ms: 0 };
  const fullCtx = await loadCtx();
  const ctx: Ctx = { makes: fullCtx.makes, models: fullCtx.models, findCity: fullCtx.findCity };
  let last: number = mode === "quick" ? target.quickPages : target.maxPages;
  let failsInRow = 0;
  for (let n = 1; n <= last; n++) {
    try {
      const { rows, lastPage } = parseListPage(await fetchHtml(pageUrl(target, n)));
      if (n === 1) last = Math.min(last, lastPage);
      res.pages++;
      res.rows += rows.length;
      await saveRows(rows, ctx, res, mode);
      failsInRow = 0;
      if (!rows.length) break;
    } catch (err) {
      res.errors.push(`lapa ${n}: ${err instanceof Error ? err.message : err}`);
      if (++failsInRow >= 3) break;
    }
    if (n < last) await sleep(delayMs);
  }

  if (mode === "full") {
    // pilnā kārta apklāj tikai AUTOPLIUS.maxPages jaunākās lapas (portālā ir desmitiem tūkstošu),
    // tāpēc neredzētos nedzēšam pēc vienas kārtas. Tā vietā paslēpjam tos, kas ilgāk par
    // EXTERNAL_TTL_DAYS nav redzēti nevienā kārtā — avotā izdzēstie vairs neparādās sarakstos.
    const cutoff = new Date(Date.now() - EXTERNAL_TTL_DAYS * 86_400_000);
    const stale = await db
      .update(listings)
      .set({ status: "hidden" })
      .where(and(eq(listings.source, "autoplius.lt"), eq(listings.kind, "vehicle"), eq(listings.vehicleClass, "car"), eq(listings.status, "active"), lt(listings.updatedAt, cutoff)))
      .returning({ id: listings.id });
    res.removed = stale.length;
  }
  res.ms = Date.now() - started.getTime();

  const set = mode === "full" ? { lastFullAt: started, lastResult: res as unknown as Record<string, unknown> } : { lastQuickAt: started };
  await db.insert(crawlState).values({ name: target.key, ...set }).onConflictDoUpdate({ target: crawlState.name, set });
  return res;
}

export function autopliusEnabled() {
  const v = process.env.AUTOPLIUS_CRAWL;
  return v === "on" || (process.env.NODE_ENV === "production" && v !== "off");
}

/**
 * Plānotāja solis: katrai plūsmai (LV un LT) izpilda ātro vai pilno kārtu, ja pienācis laiks.
 * Atgriež izpildīto kārtu rezultātus (ar plūsmas atslēgu) vai null, ja neviena kārta nav pienākusies.
 */
export async function tickAutoplius(): Promise<(CrawlResult & { key: string })[] | null> {
  const out: (CrawlResult & { key: string })[] = [];
  // pa vienam pārlūkam visiem crawleriem (512 MB instances) un pēc kārtas pārlūku aizveram
  await withCrawlLock(async () => {
    for (const target of AP_TARGETS) {
      const st = await db.query.crawlState.findFirst({ where: eq(crawlState.name, target.key) });
      const now = Date.now();
      const fullDue = !st?.lastFullAt || now - st.lastFullAt.getTime() > target.fullEveryHours * 3600_000;
      const quickDue = !st?.lastQuickAt || now - st.lastQuickAt.getTime() > target.quickEveryMin * 60_000;
      if (!fullDue && !quickDue) continue;
      try {
        out.push({ ...(await crawlAutoplius(fullDue ? "full" : "quick", target)), key: target.key });
      } finally {
        await closeBrowser().catch(() => {});
      }
    }
  });
  return out.length ? out : null;
}

// ---------- lapu ielāde ar reālu pārlūku (Playwright) ----------

let browserPromise: Promise<import("playwright").Browser> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const { chromium } = await import("playwright");
      // headless shell (vieglāks par pilno chromium: Render starter ir tikai 512 MB, pilnais deva OOM).
      // --disable-dev-shm-usage: konteineru /dev/shm ir mazs, citādi pārlūks krīt ar atmiņas kļūdām.
      return chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"] });
    })().catch((e) => {
      browserPromise = null;
      throw e;
    });
  }
  return browserPromise;
}

/** Aizver pārlūku un sesiju pēc kārtas — atmiņa (512 MB instances) netiek turēta starp kārtām. */
export async function closeBrowser() {
  const ctx = contextPromise;
  contextPromise = null;
  if (ctx) await ctx.then((c) => c.close()).catch(() => {});
  const br = browserPromise;
  browserPromise = null;
  if (br) await br.then((b) => b.close()).catch(() => {});
}

/** Atver lapu chromium pārlūkā (apiet Cloudflare pārbaudi) un atgriež HTML. Tikai autoplius.lt adreses. */
export async function browserFetch(url: string): Promise<string> {
  if (!/(^|\.)autoplius\.lt$/.test(new URL(url).host)) throw new Error(`Nav autoplius.lt adrese: ${url}`);
  // viena kopīga konteksta "sesija": kad Cloudflare pārbaude reiz izieta, cf_clearance sīkdatne
  // darbojas arī nākamajām lapām (citādi katra lapa no jauna dabūtu pārbaudi)
  const context = await getContext();
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    // Cloudflare pārbaudei ("Mazliet uzgaidiet…") ļaujam pabeigties: gaidām kartītes, vajadzības gadījumā pārlādējam
    for (let attempt = 1; ; attempt++) {
      try {
        await page.waitForSelector("a.announcement-item", { timeout: 40_000 });
        return await page.content();
      } catch (e) {
        const title = await page.title().catch(() => "");
        if (attempt >= 3 || !/uzgaidiet|just a moment|cloudflare|autoplius/i.test(title)) throw e;
        await page.reload({ waitUntil: "domcontentloaded", timeout: 45_000 });
      }
    }
  } finally {
    await page.close();
  }
}

let contextPromise: Promise<import("playwright").BrowserContext> | null = null;

async function getContext() {
  if (!contextPromise) {
    contextPromise = (async () => {
      const browser = await getBrowser();
      return browser.newContext({
        locale: "lv-LV",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      });
    })().catch((e) => {
      contextPromise = null;
      throw e;
    });
  }
  return contextPromise;
}
