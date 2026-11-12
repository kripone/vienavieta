// city24.lv nekustamo īpašumu sarakstu ievākšana (lietotājs apstiprināja 2026-11-11, sk. CLAUDE.md).
// Parasto HTTP pieprasījumu bloķē Cloudflare, tāpēc lapas atver ar reālu pārlūku (Playwright, chromium),
// tāpat kā autoplius.lt importētājs (autoplius-pages.ts).
// Lasa tikai galvenā saraksta kartītes (object--list object--result): cena, platība, istabas, stāvs,
// zeme, iela, pilsēta/apkaime, sīktēla adrese un saite. Sludinājumu lapas neatveram, aģentūru/brokeru
// datus, reklāmas tekstus un bildes nekopējam (sīktēli tiek rādīti no city24 servera ar avota norādi);
// virsrakstu veidojam paši no faktiem, tāpat kā ss.com.
// Sadaļu karuselis (object--grid) un jaunie projekti (object--np) netiek lasīti — tikai galvenais saraksts.
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { CITY24_CRAWL, CITY24_SECTIONS, EXTERNAL_TTL_DAYS, type PropertyType } from "../constants";
import { linkDuplicate } from "../dedupe";
import { landLabel } from "../listing-input";
import { city24Image } from "./city24-format";
import { withCrawlLock } from "./crawl-lock";
import { parseLand, slug, type ImportRow, type PlaceRow } from "./ss-rss";
import { loadCtx } from "./ss-pages";

const { listings, priceHistory, crawlState } = schema;

export type City24Section = (typeof CITY24_SECTIONS)[number];

export type C24Row = {
  link: string;
  externalId: string;
  price: number;
  rooms: number | null;
  areaM2: number | null;
  landM2: number | null;
  floor: number | null;
  floors: number | null;
  street: string | null;
  areaRaw: string | null;
  thumb: string | null;
};

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
const text = (html: string) => decode(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Izvelk galvenā saraksta kartītes no lapas HTML. Kartītes atdala pēc atverošajiem
 * <div class="object object--list object--result …"> tagiem. Ņemam tikai tās, kuru saites
 * tips sakrīt ar sadaļu (lapā ir arī citu sadaļu karuseļi); dublikātus (slick kloni) izlaižam.
 */
export function parseListPage(html: string, section: City24Section): { rows: C24Row[]; lastPage: number } {
  const opens = [...html.matchAll(/<div class="object object--list object--result[^"]*"[^>]*>/g)];
  const rows: C24Row[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < opens.length; i++) {
    const body = html.slice(opens[i].index!, opens[i + 1]?.index ?? html.length);

    const href = body.match(/<a class="object__image" href="([^"]+)"/)?.[1] ?? "";
    if (!href.startsWith(`/real-estate/${section.typeSlug}/`)) continue;
    const externalId = href.match(/\/(\d+)(?:\?[^"]*)?$/)?.[1];
    if (!externalId || seen.has(externalId)) continue;
    seen.add(externalId);

    // cena: "94 500 €" (pārdošana) vai "750 €" (īre, mēnesī); bez cenas kartīti izlaižam.
    // VIP kartītēs pirms cenas var būt ievietots <div class="label">Jauna cena</div>, tāpēc lasām līdz €/m² blokam
    const priceRaw = text(
      body.match(/class="object-price__main-price">([\s\S]*?)<div class="object-price__m2-price/)?.[1] ?? body.match(/class="object-price__main-price">([\s\S]*?)<\/div>/)?.[1] ?? "",
    );
    const price = Number(priceRaw.replace(/[^\d]/g, ""));
    if (!Number.isFinite(price) || price < 30 || price > 50_000_000) continue;

    // adrese: iela (ar numuru) un pilsēta/apkaime/pagasts
    const streetRaw = text(body.match(/class="h3 object__address">([\s\S]*?)<\/div>/)?.[1] ?? "").replace(/,\s*$/, "");
    const areaRaw = text(body.match(/class="object__area">([\s\S]*?)<\/div>/)?.[1] ?? "") || null;
    const street = streetRaw && /\p{L}{3,}/u.test(streetRaw) ? streetRaw.slice(0, 80) : null;

    // parametru rinda: dzīvoklim "71.74 m²", "3 ist.", "1/4 st."; mājai "169 m²", "803 m²" (zeme), "6 ist.", "1 st."; zemei "2765 m²" vai "27.6 ha"
    const featuresBlock = body.match(/class="object__main-features">([\s\S]*?)<\/ul>/)?.[1] ?? "";
    const lis = [...featuresBlock.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => text(m[1])).filter(Boolean);
    const sizes = lis.filter((s) => /^[\d\s.,]+\s*(m²|ha)$/.test(s));
    const rooms = Number(lis.find((s) => /^\d+\s*ist\.$/.test(s))?.match(/^(\d+)/)?.[1]) || null;
    const floorRaw = lis.find((s) => /^\d+\/\d+\s*st\.$/.test(s))?.match(/^(\d+)\/(\d+)/);
    const floorsOnly = lis.find((s) => /^\d+\s*st\.$/.test(s))?.match(/^(\d+)/);

    let areaM2: number | null = null;
    let landM2: number | null = null;
    if (section.propertyType === "Zeme") {
      landM2 = parseLand(sizes[0]);
    } else {
      const a = sizes[0] ? Number(sizes[0].replace(/[^\d.,]/g, "").replace(",", ".")) : null;
      areaM2 = a && Number.isFinite(a) && a > 0 ? Math.round(a * 100) / 100 : null;
      if (section.propertyType === "Māja") landM2 = parseLand(sizes[1]);
    }

    // sīktēls: tikai no city24 bilžu servera (rādām no turienes, neglabājam); kartītē karuselī pirmā bilde var būt placeholder
    const thumbRaw = body.match(/<img[^>]*src="(https:\/\/static\.img-city24\.lv\/[^"]+\.(?:jpe?g|png|webp))"/)?.[1] ?? null;
    const thumb = thumbRaw ? city24Image(thumbRaw) : null;

    rows.push({
      link: `https://www.city24.lv${href.replace(/\?[^"]*$/, "")}`,
      externalId,
      price,
      rooms: rooms && rooms > 0 && rooms < 50 ? rooms : null,
      areaM2,
      landM2,
      floor: floorRaw ? Number(floorRaw[1]) : null,
      floors: floorRaw ? Number(floorRaw[2]) : floorsOnly ? Number(floorsOnly[1]) : null,
      street,
      areaRaw,
      thumb,
    });
  }
  const pages = [...html.matchAll(/\/pg=(\d+)/g)].map((m) => Number(m[1]));
  return { rows, lastPage: Math.max(1, ...pages) };
}

type Ctx = { findCity: (t: string) => PlaceRow | null };

/** "Ropažu nov., Garkalnes pag." → pilsētas/pagasta vieta: mēģina katru adreses daļu no konkrētākās. */
function findArea(ctx: Ctx, areaRaw: string | null): PlaceRow | null {
  if (!areaRaw) return null;
  const parts = areaRaw.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of [...parts].reverse()) {
    const cleaned = part.replace(/\s+(nov|pag|pils)\.?$/i, "");
    const found = ctx.findCity(part) ?? (cleaned !== part ? ctx.findCity(cleaned) : null);
    if (found) return found;
  }
  return null;
}

/** Saraksta kartīte → mūsu sludinājums (virsrakstu veidojam paši no faktiem, tāpat kā ss.com). */
export function mapRow(r: C24Row, section: City24Section, ctx: Ctx, createdAt: Date): ImportRow | null {
  const place = findArea(ctx, r.areaRaw);
  const where = place ? `, ${slug(place.name) === "centrs" ? place.region : place.name}` : "";
  const ptype: PropertyType = section.propertyType;
  const area = r.areaM2 ? (Number.isInteger(r.areaM2) ? String(r.areaM2) : r.areaM2.toFixed(2).replace(/0$/, "")) : "";
  const title =
    ptype === "Dzīvoklis"
      ? `${r.rooms ?? 1}-istabu dzīvoklis${area ? `, ${area} m²` : ""}${where}`
      : ptype === "Māja"
        ? `Privātmāja${area ? ` ${area} m²` : ""}${r.landM2 ? `, zeme ${landLabel(r.landM2)}` : ""}${where}`
        : `Zemes gabals${r.landM2 ? ` ${landLabel(r.landM2)}` : ""}${where}`;
  return {
    kind: "property",
    status: "active",
    source: "city24.lv",
    externalUrl: r.link,
    externalId: r.externalId,
    externalThumbUrl: r.thumb,
    title: title.slice(0, 120),
    address: r.street && place ? `${r.street}, ${slug(place.name) === "centrs" ? place.region : `${place.name}, ${place.region}`}` : null,
    geoPrecision: place ? "place" : null,
    propertyType: ptype,
    deal: section.deal,
    rooms: ptype === "Zeme" ? null : r.rooms,
    areaM2: r.areaM2 ? String(r.areaM2) : null,
    landM2: r.landM2,
    floor: ptype === "Dzīvoklis" ? r.floor : null,
    floors: r.floors,
    placeId: place?.id ?? null,
    lat: place ? place.lat + (Math.random() - 0.5) * 0.006 : null,
    lon: place ? place.lon + (Math.random() - 0.5) * 0.012 : null,
    price: r.price,
    createdAt,
    updatedAt: new Date(),
  };
}

export type CrawlResult = { mode: "quick" | "full"; pages: number; rows: number; created: number; updated: number; priceChanged: number; duplicates: number; removed: number; errors: string[]; ms: number };

/** Saglabā vienas lapas kartītes: jaunos ievieto, esošajiem atjauno cenu un "redzēts" laiku. */
async function saveRows(c24Rows: C24Row[], section: City24Section, ctx: Ctx, res: CrawlResult, mode: "quick" | "full") {
  const now = new Date();
  // pilnajā kārtā atrastie ir vecāki sludinājumi: lai neaizsprosto "jaunākos", ienākšanas laiks diennakti agrāk
  const createdAt = mode === "full" ? new Date(now.getTime() - 86_400_000) : now;
  const mapped = c24Rows.map((r) => mapRow(r, section, ctx, createdAt)).filter((x): x is ImportRow => Boolean(x));
  const byId = new Map(mapped.map((m) => [m.externalId!, m]));
  if (!byId.size) return;
  const existing = await db
    .select({ id: listings.id, externalId: listings.externalId, price: listings.price, status: listings.status, thumb: listings.externalThumbUrl, placeId: listings.placeId })
    .from(listings)
    .where(and(eq(listings.source, "city24.lv"), inArray(listings.externalId, [...byId.keys()])));
  const seen = new Set<string>();
  const touch: string[] = [];
  for (const e of existing) {
    seen.add(e.externalId!);
    const row = byId.get(e.externalId!)!;
    if (e.status === "hidden") continue; // paslēpis moderators: neaiztiekam
    const newPlace = row.placeId && !e.placeId;
    if (e.price !== row.price || e.status === "deleted" || e.thumb !== row.externalThumbUrl || newPlace) {
      await db
        .update(listings)
        .set({
          price: row.price,
          status: "active",
          externalThumbUrl: row.externalThumbUrl,
          updatedAt: now,
          ...(e.price !== row.price ? { firstPrice: sql`coalesce(${listings.firstPrice}, ${e.price})` } : {}),
          ...(newPlace ? { placeId: row.placeId, lat: row.lat, lon: row.lon, geoPrecision: "place" } : {}),
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

const pageUrl = (section: City24Section, n: number) => (n <= 1 ? section.url : `${section.url}/pg=${n}`);

/**
 * Vienas sadaļas kārta. "quick": pirmās CITY24_CRAWL.quickPages lapas (jaunie un cenu maiņas).
 * "full": līdz CITY24_CRAWL.maxPages lapām; izdzēstos paslēpj pēc EXTERNAL_TTL_DAYS (sk. autoplius-pages.ts).
 */
export async function crawlCity24Section(section: City24Section, mode: "quick" | "full", fetchHtml?: (url: string) => Promise<string>, delayMs = CITY24_CRAWL.delayMs): Promise<CrawlResult> {
  // Lapas sākumkarte var būt no citas sadaļas (SSR saturs), tāpēc gaidām tieši šīs sadaļas kartītes.
  // Galvenais saraksts ielādējas ar JS: līdz tam redzami skeleta aizpildītāji (object--loading) un
  // karuseļu kartītes (object--grid) ar šīs pašas sadaļas saitēm — gaidām ielādētu saraksta kartīti
  // (bez object--loading klases), citādi dabūtu skeleta HTML un 0 rindu (2026-11-12 city24 izmaiņas).
  fetchHtml ??= (url) => browserFetch(url, `div.object--result:not(.object--loading) a.object__image[href*="/real-estate/${section.typeSlug}/"]`);
  const started = new Date();
  const res: CrawlResult = { mode, pages: 0, rows: 0, created: 0, updated: 0, priceChanged: 0, duplicates: 0, removed: 0, errors: [], ms: 0 };
  const fullCtx = await loadCtx();
  const ctx: Ctx = { findCity: fullCtx.findCity };
  let last: number = mode === "quick" ? CITY24_CRAWL.quickPages : CITY24_CRAWL.maxPages;
  let failsInRow = 0;
  for (let n = 1; n <= last; n++) {
    try {
      const { rows, lastPage } = parseListPage(await fetchHtml(pageUrl(section, n)), section);
      if (n === 1) last = Math.min(last, lastPage);
      res.pages++;
      res.rows += rows.length;
      await saveRows(rows, section, ctx, res, mode);
      failsInRow = 0;
      if (!rows.length) break;
    } catch (err) {
      res.errors.push(`lapa ${n}: ${err instanceof Error ? err.message : err}`);
      if (++failsInRow >= 3) break;
    }
    if (n < last) await sleep(delayMs);
  }

  if (mode === "full") {
    // neredzētos nedzēšam pēc vienas kārtas: paslēpjam tikai tos, kas ilgāk par EXTERNAL_TTL_DAYS
    // nav redzēti nevienā kārtā — avotā izdzēstie vairs neparādās sarakstos (tāpat kā autoplius.lt)
    const cutoff = new Date(Date.now() - EXTERNAL_TTL_DAYS * 86_400_000);
    const stale = await db
      .update(listings)
      .set({ status: "hidden" })
      .where(and(eq(listings.source, "city24.lv"), eq(listings.propertyType, section.propertyType), eq(listings.deal, section.deal), eq(listings.status, "active"), lt(listings.updatedAt, cutoff)))
      .returning({ id: listings.id });
    res.removed = stale.length;
  }
  res.ms = Date.now() - started.getTime();

  const set = mode === "full" ? { lastFullAt: started, lastResult: res as unknown as Record<string, unknown> } : { lastQuickAt: started };
  await db.insert(crawlState).values({ name: section.key, ...set }).onConflictDoUpdate({ target: crawlState.name, set });
  return res;
}

export function city24Enabled() {
  const v = process.env.CITY24_CRAWL;
  return v === "on" || (process.env.NODE_ENV === "production" && v !== "off");
}

/** Plānotāja solis: pa vienai sadaļai izpilda ātro vai pilno kārtu, ja pienācis laiks; citādi null. */
export async function tickCity24(): Promise<(CrawlResult & { section: string }) | null> {
  const state = new Map((await db.select().from(crawlState)).map((s) => [s.name, s]));
  const now = Date.now();
  for (const section of CITY24_SECTIONS) {
    const st = state.get(section.key);
    const fullDue = !st?.lastFullAt || now - st.lastFullAt.getTime() > CITY24_CRAWL.fullEveryHours * 3600_000;
    const quickDue = !st?.lastQuickAt || now - st.lastQuickAt.getTime() > CITY24_CRAWL.quickEveryMin * 60_000;
    if (!fullDue && !quickDue) continue;
    // pa vienam pārlūkam visiem crawleriem (512 MB instances) un pēc kārtas pārlūku aizveram
    const r = await withCrawlLock(async () => {
      try {
        return await crawlCity24Section(section, fullDue ? "full" : "quick");
      } finally {
        await closeBrowser().catch(() => {});
      }
    });
    return { ...r, section: section.key };
  }
  return null;
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

/** Atver lapu chromium pārlūkā (apiet Cloudflare pārbaudi) un atgriež HTML. Tikai city24.lv adreses. */
export async function browserFetch(url: string, waitSelector = "a.object__image"): Promise<string> {
  if (!/(^|\.)city24\.lv$/.test(new URL(url).host)) throw new Error(`Nav city24.lv adrese: ${url}`);
  // viena kopīga konteksta "sesija": kad Cloudflare pārbaude reiz izieta, cf_clearance sīkdatne
  // darbojas arī nākamajām lapām (citādi katra lapa no jauna dabūtu pārbaudi)
  const context = await getContext();
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    // Cloudflare pārbaudei ("Mazliet uzgaidiet…") ļaujam pabeigties: gaidām kartītes, vajadzības gadījumā pārlādējam
    for (let attempt = 1; ; attempt++) {
      try {
        await page.waitForSelector(waitSelector, { timeout: 40_000 });
        return await page.content();
      } catch (e) {
        const title = await page.title().catch(() => "");
        if (attempt >= 3 || !/uzgaidiet|just a moment|cloudflare|city24/i.test(title)) throw e;
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
