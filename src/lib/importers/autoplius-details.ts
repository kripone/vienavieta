// autoplius.lt sarakstu kartītēs nav aprīkojuma, krāsas un daļas fakto, tāpēc katru sludinājuma lapu
// atveram vienu reizi un nolasām TIKAI strukturētos laukus: parametru rindas (Ātrumkārba, Krāsa,
// Virsbūves tips, Tehniskā apskate) un aprīkojuma grupas (feature-row). Pārdevēja tekstu neņemam.
// Izslēdz ar AP_DETAILS=off.
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { chromium, type Browser } from "playwright";
import { db, schema } from "@/db";
import { BODY_TYPES } from "../constants";
import { mapBody } from "./autoplius-pages";

const { listings } = schema;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const AP_DETAILS_PER_TICK = 25;
const AP_DETAIL_DELAY_MS = 1500;

const decode = (s: string) =>
  s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/\s+/g, " ").trim();

/** Parametru rindas (label = value) un aprīkojuma grupas no autoplius sludinājuma lapas. */
export function parseApDetails(html: string) {
  const opts: Record<string, string> = {};
  const seg = html.match(/class="announcement-parameters-content"([\s\S]{0,30000})/)?.[1] ?? "";
  for (const m of seg.matchAll(/class="parameter-label"[^>]*>([\s\S]*?)<\/[\s\S]{0,400}?class="parameter-value[^"]*"[^>]*>([\s\S]*?)<\//g)) {
    const k = decode(m[1]);
    const v = decode(m[2]);
    if (k && v && !opts[k]) opts[k] = v;
  }
  // aprīkojums: feature-row = grupas virsraksts (feature-label) + elementi (feature-item)
  const features: string[] = [];
  for (const r of html.matchAll(/class="feature-row"([\s\S]*?)(?=class="feature-row"|$)/g)) {
    const group = decode(r[1].match(/class="feature-label"[^>]*>([\s\S]*?)<\//)?.[1] ?? "");
    if (!group) continue;
    for (const it of r[1].matchAll(/class="feature-item"[^>]*>([\s\S]*?)<\//g)) {
      const v = decode(it[1]);
      if (v) features.push(`${group}|${v}`);
    }
  }
  const gearRaw = opts["Ātrumkārba"] ?? opts["Pavarų dėžė"] ?? "";
  const gearbox = /autom/i.test(gearRaw) ? "Automāts" : /mehān|manu|mechan/i.test(gearRaw) ? "Manuāla" : null;
  // Krāsas: LV lapās lauks "Krāsa", LT lapās "Spalva"; vērtības nāk abās valodās jaukti
  // (piem., "Juoda / grafito" vai "Melna, metālika") — tāpēc kartējam pirmo vārdu uz mūsu katalogu.
  const colorRaw = (opts["Krāsa"] ?? opts["Spalva"] ?? "").split(/[\s/,]+/)[0]?.toLowerCase() ?? "";
  const color = colorRaw ? (AP_COLOR_MAP[colorRaw] ?? "Cita") : null;
  const bodyRaw = opts["Virsbūves tips"] ?? opts["Kėbulo tipas"] ?? "";
  const body = (BODY_TYPES.car as readonly string[]).find((b) => b.toLowerCase() === bodyRaw.toLowerCase()) ?? mapBody(bodyRaw);
  // tehniskā apskate: "09.2027" vai "2027-09" → glabājam vienotā formātā "09.2027"
  const inspRaw = opts["Tehniskā apskate"] ?? opts["Techninė apžiūra"] ?? "";
  const inspLv = inspRaw.match(/^(\d{2})\.(\d{4})$/);
  const inspIso = inspRaw.match(/^(\d{4})-(\d{2})$/);
  const inspectionUntil = inspLv ? inspLv[0] : inspIso ? `${inspIso[2]}.${inspIso[1]}` : null;
  // Galerijas bilžu adreses (rādām no grupas serveriem autoplius-img/skelbiu-img, neglabājam):
  // lielā versija ir data-big atribūtā; rezervē og:image metas.
  const IMG = String.raw`https:\/\/(?:autoplius|skelbiu)-img\.[^"]+\.(?:jpg|jpeg|webp)`;
  const photos: string[] = [];
  for (const m of html.matchAll(new RegExp(`data-big="(${IMG})"`, "g"))) photos.push(m[1]);
  if (!photos.length) for (const m of html.matchAll(new RegExp(`<meta property="og:image" content="(${IMG})"`, "g"))) photos.push(m[1]);
  return { gearbox, color, body, inspectionUntil, features: [...new Set(features)].slice(0, 150), photos: [...new Set(photos)].slice(0, 30) };
}

/** autoplius krāsu pieraksti (lv/lt, pirmais vārds, mazie burti) → mūsu katalogs. */
const AP_COLOR_MAP: Record<string, string> = {
  melna: "Melna", juoda: "Melna",
  balta: "Balta",
  "pelēka": "Pelēka", pilka: "Pelēka",
  sudraba: "Sudraba", "sidabrinė": "Sudraba", "sidabrinis": "Sudraba",
  zila: "Zila", "mėlyna": "Zila",
  sarkana: "Sarkana", raudona: "Sarkana",
  "zaļa": "Zaļa", "žalia": "Zaļa",
  "brūna": "Brūna", ruda: "Brūna",
};

// Detaļu lapām sarakstu kartīšu selektora nav — tāpēc atsevišķs pārlūks bez announcement-item gaidīšanas.
let browser: Browser | null = null;

async function fetchDetail(url: string): Promise<string> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless: true, timeout: 30_000, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"] });
  }
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: "lv-LV",
  });
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    // Sludinājums dzēsts (404/410) — tūlīt izmetam; nav jēga gaidīt selektoru vai mēģināt vēlreiz.
    if (resp && (resp.status() === 404 || resp.status() === 410)) throw new Error(`HTTP ${resp.status()}`);
    // Cloudflare pārbaudei ("Mazliet uzgaidiet…") ļaujam pabeigties: gaidām parametru/aprīkojuma bloku,
    // vajadzības gadījumā pārlādējam (tā pati loģika kā sarakstu lapu browserFetch).
    for (let attempt = 1; ; attempt++) {
      try {
        await page.waitForSelector(".announcement-parameters-content, .feature-row", { timeout: 30_000 });
        return await page.content();
      } catch (e) {
        const title = await page.title().catch(() => "");
        if (attempt >= 4 || !/uzgaidiet|just a moment|cloudflare|autoplius/i.test(title)) throw e;
        await sleep([10_000, 30_000, 60_000][attempt - 1] ?? 60_000);
        await page.reload({ waitUntil: "domcontentloaded", timeout: 45_000 });
      }
    }
  } finally {
    await ctx.close().catch(() => {});
  }
}

export async function closeApDetailsBrowser() {
  await browser?.close().catch(() => {});
  browser = null;
}

/** Apstrādā nākamos vēl neatvērtos autoplius sludinājumus, jaunākos vispirms. */
export async function fillAutopliusDetails(limit = AP_DETAILS_PER_TICK, fetchHtml = fetchDetail, delayMs = AP_DETAIL_DELAY_MS) {
  // Bezbilžu sludinājumi rindas sākumā (galerijas nolasīšana tiem dod arī pirmo bildi),
  // tad jaunākie vispirms.
  const todo = await db
    .select({ id: listings.id, url: listings.externalUrl, thumb: listings.externalThumbUrl })
    .from(listings)
    .where(and(eq(listings.source, "autoplius.lt"), eq(listings.status, "active"), isNull(listings.detailCheckedAt)))
    .orderBy(sql`${listings.externalThumbUrl} is null desc`, desc(listings.createdAt))
    .limit(limit);
  if (!todo.length) return null;
  const res = { checked: 0, features: 0, errors: 0, gone: 0 };
  let consecutiveErrors = 0;
  for (const [i, t] of todo.entries()) {
    if (i) await sleep(delayMs);
    if (!t.url || !t.url.includes("autoplius.lt")) {
      await db.update(listings).set({ detailCheckedAt: new Date() }).where(eq(listings.id, t.id));
      continue;
    }
    try {
      const html = await fetchHtml(t.url);
      res.checked++;
      consecutiveErrors = 0;
      const d = parseApDetails(html);
      if (d.features.length) res.features++;
      await db
        .update(listings)
        .set({
          detailCheckedAt: new Date(),
          ...(d.gearbox ? { gearbox: d.gearbox } : {}),
          ...(d.color ? { color: d.color } : {}),
          ...(d.body ? { body: d.body } : {}),
          ...(d.inspectionUntil ? { inspectionUntil: d.inspectionUntil } : {}),
          ...(d.photos.length ? { remotePhotos: d.photos } : {}),
          ...(!t.thumb && d.photos.length ? { externalThumbUrl: d.photos[0] } : {}),
          features: d.features,
        })
        .where(eq(listings.id, t.id));
    } catch (e) {
      // Dzēsts sludinājums (404/410): atzīmējam kā pārbaudītu un ejam tālāk —
      // citādi rindas galva ar mirušām lapām mūžīgi bloķē visu nolasīšanu.
      if (e instanceof Error && /^HTTP (404|410)$/.test(e.message)) {
        res.gone++;
        await db.update(listings).set({ detailCheckedAt: new Date() }).where(eq(listings.id, t.id));
        continue;
      }
      res.errors++;
      if (++consecutiveErrors >= 3) break; // iespējama Cloudflare/tilta problēma — pārtraucam kārtu
    }
  }
  return res;
}
