// finder.porsche.com (Porsche Center Riga Airport) lietoto auto ievākšana (lietotājs apstiprināja 2026-11-12).
// Parasto HTTP pieprasījumu bloķē Vercel bot aizsardzība (429 checkpoint), tāpēc lapas atver ar reālu
// pārlūku (Playwright, chromium), tāpat kā autoplius.lt un city24.lv importētāji. Skrien lokāli (stundu
// uzdevums), serverī PORSCHE_CRAWL=off nav vajadzīgs — serverī šis netiek izsaukts.
// Dati nāk no lapas JSON-LD (schema.org ItemList → Car): marka/modelis, gads, cena, nobraukums, degviela,
// jauda, ātrumkārba, virsbūve, krāsa, piedziņa, sīktēls un dīlera adrese. Sludinājumu lapas neatveram;
// bildes rādām no Porsche servera ar avota norādi. Virsrakstu veidojam paši no faktiem, tāpat kā ss.com.
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { EXTERNAL_TTL_DAYS, PORSCHE } from "../constants";
import { linkDuplicate } from "../dedupe";
import { inferBody } from "../illustrations";
import { findMake, matchModel, slug, vehicleTitle, type ImportRow, type MakeRow, type ModelRow, type PlaceRow } from "./ss-rss";
import { withCrawlLock } from "./crawl-lock";
import { loadCtx } from "./ss-pages";

const { listings, priceHistory, crawlState } = schema;

export type PfRow = {
  link: string;
  externalId: string;
  name: string; // "Taycan Turbo"
  price: number;
  year: number | null;
  mileageKm: number | null;
  fuelRaw: string | null; // "ELECTRIC", "PETROL", "HYBRID" …
  powerKw: number | null;
  gearboxRaw: string | null; // "Automātiskā", "Manuālā"
  bodyRaw: string | null; // "Sedans", "SUV" …
  driveRaw: string | null; // schema.org DriveWheelConfiguration URL
  colorRaw: string | null; // "Neptune Blue, Zila"
  thumb: string | null;
  city: string | null; // dīlera pilsēta ("Riga")
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Porsche fuelType → mūsu katalogs. */
function mapPfFuel(v?: string | null) {
  const s = (v ?? "").toUpperCase();
  if (s.includes("HYBRID")) return "Hibrīds";
  if (s === "ELECTRIC") return "Elektro";
  if (s === "DIESEL") return "Dīzelis";
  if (s === "PETROL" || s === "GASOLINE") return "Benzīns";
  return null;
}

/** Porsche bodyType (lv labels vai kodolapraksti) → mūsu katalogs. */
function mapPfBody(v?: string | null) {
  const s = slug(v ?? "");
  if (!s) return null;
  if (/suv|apvid|crossover|krosover/.test(s)) return "Apvidus";
  if (/sedan|limuzin/.test(s)) return "Sedans";
  if (/universal|turismo|sport-turismo|cross-turismo/.test(s)) return "Universāls";
  if (/hecbek|hatch/.test(s)) return "Hečbeks";
  if (/kupe|coupe/.test(s)) return "Kupeja";
  if (/kabriolet|cabrio|convertible|roadster|targa|spyder/.test(s)) return "Kabriolets";
  if (/miniven/.test(s)) return "Minivens";
  return null;
}

/** schema.org DriveWheelConfiguration URL → mūsu katalogs. */
function mapPfDrive(v?: string | null) {
  const s = (v ?? "").toLowerCase();
  if (s.includes("allwheel")) return "Pilnpiedziņa";
  if (s.includes("rearwheel")) return "Aizmugures";
  if (s.includes("frontwheel")) return "Priekšpiedziņa";
  return null;
}

/** "Neptune Blue, Zila" → mūsu COLORS (ņemot latvisko daļu aiz komata). */
function mapPfColor(v?: string | null) {
  const s = slug((v ?? "").split(",").pop() ?? "");
  if (!s) return null;
  if (s.includes("meln")) return "Melna";
  if (s.includes("balt")) return "Balta";
  if (s.includes("pelek")) return "Pelēka";
  if (s.includes("sudrab")) return "Sudraba";
  if (s.includes("zil")) return "Zila";
  if (s.includes("sarkan")) return "Sarkana";
  if (s.includes("zal")) return "Zaļa";
  if (s.includes("brun")) return "Brūna";
  return "Cita";
}

type JsonLd = Record<string, any>;

/** Atrod schema.org ItemList ar auto elementiem JSON-LD blokos (var būt tieši vai @graph iekšpusē). */
function findItemList(blocks: JsonLd[]): JsonLd | null {
  for (const b of blocks) {
    const candidates = Array.isArray(b?.["@graph"]) ? b["@graph"] : [b];
    for (const c of candidates) {
      const items = c?.itemListElement;
      if (Array.isArray(items) && items.length) return c;
    }
  }
  return null;
}

/**
 * Izvelk auto rindas no lapas JSON-LD (schema.org Car). Lapas bez sludinājumiem → 0 rindas.
 */
export function parseListPage(html: string): PfRow[] {
  const blocks: JsonLd[] = [];
  for (const m of html.matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      blocks.push(JSON.parse(m[1].trim()));
    } catch {
      // bojāts JSON-LD — izlaižam
    }
  }
  const list = findItemList(blocks);
  if (!list) return [];
  const rows: PfRow[] = [];
  const seen = new Set<string>();
  for (const el of list.itemListElement) {
    const car: JsonLd = el?.item ?? {};
    const url: string = car.url ?? car["@id"]?.replace(/#car$/, "") ?? "";
    const externalId = url.match(/-([A-Z0-9]{5,8})$/)?.[1] ?? "";
    if (!url || !externalId || seen.has(externalId)) continue;
    const price = Number(car.offers?.price);
    if (!Number.isFinite(price) || price < 1000 || price > 5_000_000) continue; // pārdošanas cena obligāta
    seen.add(externalId);
    rows.push({
      link: url,
      externalId,
      name: String(car.vehicleConfiguration ?? car.name ?? "").trim(),
      price,
      year: Number(String(car.modelDate ?? car.vehicleModelDate ?? "").slice(0, 4)) || null,
      mileageKm: Number(car.mileageFromOdometer?.value) || null,
      fuelRaw: car.vehicleEngine?.fuelType ?? null,
      powerKw: Number(car.vehicleEngine?.enginePower?.value) || null,
      gearboxRaw: car.vehicleTransmission ?? null,
      bodyRaw: car.bodyType ?? null,
      driveRaw: car.driveWheelConfiguration ?? null,
      colorRaw: car.color ?? null,
      thumb: car.image ?? null,
      city: car.offers?.seller?.address?.addressLocality ?? null,
    });
  }
  return rows;
}

type Ctx = { makes: MakeRow[]; models: ModelRow[]; findCity: (t: string) => PlaceRow | null };

/** JSON-LD Car → mūsu sludinājums (marka vienmēr Porsche; virsrakstu veidojam paši no faktiem). */
export function mapRow(r: PfRow, ctx: Ctx, createdAt: Date): ImportRow | null {
  const make = findMake(ctx.makes, "car", "Porsche");
  const model = make ? matchModel(ctx.models, make.id, r.name, make.name) : null;
  const modelName = model?.name ?? r.name;
  const fuel = mapPfFuel(r.fuelRaw);
  const title = vehicleTitle(make?.name ?? "Porsche", modelName, null, fuel, r.year);
  if (!title) return null;
  const city = r.city ? ctx.findCity(r.city) : null;
  return {
    kind: "vehicle",
    status: "active",
    source: "finder.porsche.com",
    externalUrl: r.link,
    externalId: r.externalId,
    externalThumbUrl: r.thumb,
    title: title.slice(0, 120),
    vehicleClass: "car",
    makeId: make?.id ?? null,
    modelId: model?.id ?? null,
    makeText: make ? null : "Porsche",
    modelText: model ? null : r.name || null,
    year: r.year,
    mileageKm: r.mileageKm,
    powerKw: r.powerKw,
    fuel,
    gearbox: r.gearboxRaw?.toLowerCase().startsWith("man") ? "Manuāla" : r.gearboxRaw ? "Automāts" : null,
    body: mapPfBody(r.bodyRaw) ?? inferBody(modelName),
    drive: mapPfDrive(r.driveRaw),
    color: mapPfColor(r.colorRaw),
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

/** Saglabā vienas lapas rindas: jaunos ievieto, esošajiem atjauno cenu un "redzēts" laiku. */
async function saveRows(rows: PfRow[], ctx: Ctx, res: CrawlResult, mode: "quick" | "full") {
  const now = new Date();
  const createdAt = mode === "full" ? new Date(now.getTime() - 86_400_000) : now;
  const mapped = rows.map((r) => mapRow(r, ctx, createdAt)).filter((x): x is ImportRow => Boolean(x));
  const byId = new Map(mapped.map((m) => [m.externalId!, m]));
  if (!byId.size) return;
  const existing = await db
    .select({ id: listings.id, externalId: listings.externalId, price: listings.price, status: listings.status, thumb: listings.externalThumbUrl })
    .from(listings)
    .where(and(eq(listings.source, "finder.porsche.com"), inArray(listings.externalId, [...byId.keys()])));
  const seen = new Set<string>();
  const touch: string[] = [];
  for (const e of existing) {
    seen.add(e.externalId!);
    const row = byId.get(e.externalId!)!;
    if (e.status === "hidden") continue; // paslēpis moderators: neaiztiekam
    if (e.price !== row.price || e.status === "deleted" || e.thumb !== row.externalThumbUrl) {
      await db
        .update(listings)
        .set({
          price: row.price,
          status: "active",
          externalThumbUrl: row.externalThumbUrl,
          updatedAt: now,
          ...(e.price !== row.price ? { firstPrice: sql`coalesce(${listings.firstPrice}, ${e.price})` } : {}),
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

const pageUrl = (n: number) => (n <= 1 ? PORSCHE.url : `${PORSCHE.url}&page=${n}`);

/**
 * Viena kārta. "quick": pirmās PORSCHE.quickPages lapas; "full": līdz PORSCHE.maxPages,
 * apstājas pie tukšas lapas; beigās ilgi neredzētie tiek paslēpti (EXTERNAL_TTL_DAYS).
 */
export async function crawlPorsche(mode: "quick" | "full", fetchHtml: (url: string) => Promise<string> = browserFetch, delayMs = PORSCHE.delayMs): Promise<CrawlResult> {
  const started = new Date();
  const res: CrawlResult = { mode, pages: 0, rows: 0, created: 0, updated: 0, priceChanged: 0, duplicates: 0, removed: 0, errors: [], ms: 0 };
  const fullCtx = await loadCtx();
  const ctx: Ctx = { makes: fullCtx.makes, models: fullCtx.models, findCity: fullCtx.findCity };
  const last = mode === "quick" ? PORSCHE.quickPages : PORSCHE.maxPages;
  let failsInRow = 0;
  for (let n = 1; n <= last; n++) {
    try {
      const rows = parseListPage(await fetchHtml(pageUrl(n)));
      res.pages++;
      res.rows += rows.length;
      await saveRows(rows, ctx, res, mode);
      failsInRow = 0;
      if (!rows.length) break; // lapas beigas
    } catch (err) {
      res.errors.push(`lapa ${n}: ${err instanceof Error ? err.message : err}`);
      if (++failsInRow >= 3) break;
    }
    if (n < last) await sleep(delayMs);
  }

  if (mode === "full") {
    const cutoff = new Date(Date.now() - EXTERNAL_TTL_DAYS * 86_400_000);
    const stale = await db
      .update(listings)
      .set({ status: "hidden" })
      .where(and(eq(listings.source, "finder.porsche.com"), eq(listings.status, "active"), lt(listings.updatedAt, cutoff)))
      .returning({ id: listings.id });
    res.removed = stale.length;
  }
  res.ms = Date.now() - started.getTime();

  const set = mode === "full" ? { lastFullAt: started, lastResult: res as unknown as Record<string, unknown> } : { lastQuickAt: started };
  await db.insert(crawlState).values({ name: PORSCHE.key, ...set }).onConflictDoUpdate({ target: crawlState.name, set });
  return res;
}

/** Plānotāja solis: ātrā vai pilnā kārta, ja pienācis laiks (null, ja nav pienākusies). */
export async function tickPorsche(): Promise<CrawlResult | null> {
  const st = await db.query.crawlState.findFirst({ where: eq(crawlState.name, PORSCHE.key) });
  const now = Date.now();
  const fullDue = !st?.lastFullAt || now - st.lastFullAt.getTime() > PORSCHE.fullEveryHours * 3600_000;
  const quickDue = !st?.lastQuickAt || now - st.lastQuickAt.getTime() > PORSCHE.quickEveryMin * 60_000;
  if (!fullDue && !quickDue) return null;
  // pa vienam pārlūkam visiem crawleriem un pēc kārtas pārlūku aizveram
  return withCrawlLock(async () => {
    try {
      return await crawlPorsche(fullDue ? "full" : "quick");
    } finally {
      await closeBrowser().catch(() => {});
    }
  });
}

// ---------- lapu ielāde ar reālu pārlūku (Playwright) ----------

let browserPromise: Promise<import("playwright").Browser> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const { chromium } = await import("playwright");
      return chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"] });
    })().catch((e) => {
      browserPromise = null;
      throw e;
    });
  }
  return browserPromise;
}

/** Aizver pārlūku un sesiju pēc kārtas. */
export async function closeBrowser() {
  const ctx = contextPromise;
  contextPromise = null;
  if (ctx) await ctx.then((c) => c.close()).catch(() => {});
  const br = browserPromise;
  browserPromise = null;
  if (br) await br.then((b) => b.close()).catch(() => {});
}

/** Atver lapu chromium pārlūkā (apiet Vercel bot pārbaudi) un atgriež HTML. Tikai finder.porsche.com adreses. */
export async function browserFetch(url: string): Promise<string> {
  if (new URL(url).host !== "finder.porsche.com") throw new Error(`Nav finder.porsche.com adrese: ${url}`);
  const context = await getContext();
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    // Vercel pārbaudei ļaujam pabeigties: gaidām auto saites, vajadzības gadījumā pārlādējam.
    // Ja virsraksts ir parastā meklēšanas lapa, bet saišu nav — tā ir tukšā rezultātu lapa
    // (lapošana aiz pēdējās), atgriežam saturu; parsētājs atradīs 0 rindu un kārta apstāsies.
    for (let attempt = 1; ; attempt++) {
      try {
        await page.waitForSelector("a[href*='/details/']", { timeout: 40_000 });
        return await page.content();
      } catch (e) {
        // virsraksts var būt tukšs, kamēr lapa vēl ielādējas — mazliet pagaidām pirms sprieduma
        await page.waitForTimeout(3000);
        const title = await page.title().catch(() => "");
        if (/vercel|security|checkpoint/i.test(title) || !title) {
          if (attempt >= 3) {
            if (/porsche/i.test(title)) return await page.content(); // tukša rezultātu lapa pēc atkārtojumiem
            throw e;
          }
          await page.reload({ waitUntil: "domcontentloaded", timeout: 45_000 });
          continue;
        }
        if (/porsche/i.test(title)) return await page.content(); // tukša rezultātu lapa
        throw e;
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
