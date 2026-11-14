// autoplius.lt sarakstu kartītēs nav aprīkojuma, krāsas un daļas fakto, tāpēc katru sludinājuma lapu
// atveram vienu reizi un nolasām TIKAI strukturētos laukus: parametru rindas (Ātrumkārba, Krāsa,
// Virsbūves tips, Tehniskā apskate) un aprīkojuma grupas (feature-row). Pārdevēja tekstu neņemam.
// Izslēdz ar AP_DETAILS=off.
import { and, desc, eq, isNull } from "drizzle-orm";
import { chromium, type Browser } from "playwright";
import { db, schema } from "@/db";
import { BODY_TYPES, COLORS } from "../constants";

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
  const gearRaw = opts["Ātrumkārba"] ?? "";
  const gearbox = /autom/i.test(gearRaw) ? "Automāts" : /mehān|manu/i.test(gearRaw) ? "Manuāla" : null;
  const colorRaw = (opts["Krāsa"] ?? "").split(/[\s/]/)[0];
  const color = colorRaw ? ((COLORS as readonly string[]).find((c) => c.toLowerCase() === colorRaw.toLowerCase()) ?? "Cita") : null;
  const bodyRaw = opts["Virsbūves tips"] ?? "";
  const body = (BODY_TYPES.car as readonly string[]).find((b) => b.toLowerCase() === bodyRaw.toLowerCase()) ?? null;
  const inspectionUntil = opts["Tehniskā apskate"]?.match(/^\d{2}\.\d{4}$/)?.[0] ?? null;
  return { gearbox, color, body, inspectionUntil, features: [...new Set(features)].slice(0, 150) };
}

// Detaļu lapām sarakstu kartīšu selektora nav — tāpēc atsevišķs pārlūks bez announcement-item gaidīšanas.
let browser: Browser | null = null;

async function fetchDetail(url: string): Promise<string> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"] });
  }
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: "lv-LV",
  });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(1500);
    return await page.content();
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
  const todo = await db
    .select({ id: listings.id, url: listings.externalUrl })
    .from(listings)
    .where(and(eq(listings.source, "autoplius.lt"), eq(listings.status, "active"), isNull(listings.detailCheckedAt)))
    .orderBy(desc(listings.createdAt))
    .limit(limit);
  if (!todo.length) return null;
  const res = { checked: 0, features: 0, errors: 0 };
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
          features: d.features,
        })
        .where(eq(listings.id, t.id));
    } catch {
      res.errors++;
      if (++consecutiveErrors >= 3) break; // iespējama Cloudflare/tilta problēma — pārtraucam kārtu
    }
  }
  return res;
}
