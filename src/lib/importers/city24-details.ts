// city24.lv sarakstu kartītēs ir tikai pamatparametri; ērtības (apkure, materiāls, celšanas gads,
// balkons, autostāvvieta u.tml.) ir sludinājuma lapas "full-specs" tabulās. Katru lapu atveram vienu
// reizi un nolasām TIKAI strukturētos laukus. Pārdevēja tekstu un kontaktus neņemam.
// Izslēdz ar C24_DETAILS=off.
import { and, desc, eq, isNull } from "drizzle-orm";
import { chromium, type Browser } from "playwright";
import { db, schema } from "@/db";
import { AMENITIES } from "../constants";

const { listings } = schema;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const C24_DETAILS_PER_TICK = 25;
const C24_DETAIL_DELAY_MS = 1500;

const decode = (s: string) =>
  s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/\s+/g, " ").trim();

/** Atslēgvārdi, pēc kuriem city24 tekstus pārvēršam kanoniskajās ērtībās (AMENITIES). */
const AMENITY_KEYS: [string, RegExp][] = [
  ["Balkons", /balkon/i],
  ["Terase", /teras/i],
  ["Lifts", /lifts/i],
  ["Stāvvieta", /stāvvieta|garāža|pagrabstāv/i],
  ["Mēbelēts", /mēbel/i],
  ["Dzīvnieki atļauti", /dzīvniek/i],
  ["Kamīns", /kamīn/i],
  ["Pirts", /pirts|sauna/i],
  ["Signalizācija", /signaliz/i],
];

/** full-specs tabulas (Raksturojums/Ērtības/Vispārīgi) no city24 sludinājuma lapas. */
export function parseC24Details(html: string) {
  const opts: Record<string, string> = {};
  for (const t of html.matchAll(/<table class="full-specs">([\s\S]*?)<\/table>/g)) {
    const title = decode(t[1].match(/full-specs__title">([\s\S]*?)<\/div>/)?.[1] ?? "");
    if (title === "Cena") continue;
    for (const r of t[1].matchAll(/<tr><td>([\s\S]*?)<\/td><td class="td--strong">([\s\S]*?)<\/td><\/tr>/g)) {
      const k = decode(r[1]);
      const v = decode(r[2]);
      if (k && v && !opts[k]) opts[k] = v;
    }
  }
  const material = (opts["Mājas tips"] ?? "").slice(0, 40) || null;
  const heating = (opts["Apkure"] ?? "").slice(0, 60) || null;
  const condition = (opts["Īpašuma stāvoklis"] ?? "").slice(0, 40) || null;
  const series = (opts["Mājas sērija"] ?? "").slice(0, 40) || null;
  const purpose = (opts["Izmantošanas mērķis"] ?? opts["Pielietošanas mērķis"] ?? "").slice(0, 60) || null;
  const builtYear = /^\d{4}$/.test(opts["Celšanas gads"] ?? "") ? Number(opts["Celšanas gads"]) : null;
  // ērtības: skenējam visu lauku tekstu (virsraksts + vērtība)
  const all = Object.entries(opts).map(([k, v]) => `${k} ${v}`);
  const amenities = AMENITY_KEYS.filter(([name, re]) => all.some((s) => re.test(s))).map(([name]) => (AMENITIES as readonly string[]).includes(name) ? name : name);
  return { material, heating, condition, series, purpose, builtYear, amenities: [...new Set(amenities)] };
}

// Detaļu lapām sarakstu kartīšu selektora nav — atsevišķs pārlūks.
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

export async function closeC24DetailsBrowser() {
  await browser?.close().catch(() => {});
  browser = null;
}

/** Apstrādā nākamos vēl neatvērtos city24 sludinājumus, jaunākos vispirms. */
export async function fillCity24Details(limit = C24_DETAILS_PER_TICK, fetchHtml = fetchDetail, delayMs = C24_DETAIL_DELAY_MS) {
  const todo = await db
    .select({ id: listings.id, url: listings.externalUrl })
    .from(listings)
    .where(and(eq(listings.source, "city24.lv"), eq(listings.status, "active"), isNull(listings.detailCheckedAt)))
    .orderBy(desc(listings.createdAt))
    .limit(limit);
  if (!todo.length) return null;
  const res = { checked: 0, filled: 0, errors: 0 };
  let consecutiveErrors = 0;
  for (const [i, t] of todo.entries()) {
    if (i) await sleep(delayMs);
    if (!t.url || !t.url.includes("city24.lv")) {
      await db.update(listings).set({ detailCheckedAt: new Date() }).where(eq(listings.id, t.id));
      continue;
    }
    try {
      const html = await fetchHtml(t.url);
      res.checked++;
      consecutiveErrors = 0;
      const d = parseC24Details(html);
      if (d.material || d.heating || d.builtYear || d.amenities.length) res.filled++;
      await db
        .update(listings)
        .set({
          detailCheckedAt: new Date(),
          ...(d.material ? { material: d.material } : {}),
          ...(d.heating ? { heating: d.heating } : {}),
          ...(d.condition ? { condition: d.condition } : {}),
          ...(d.series ? { series: d.series } : {}),
          ...(d.purpose ? { purpose: d.purpose } : {}),
          ...(d.builtYear ? { builtYear: d.builtYear } : {}),
          amenities: d.amenities,
        })
        .where(eq(listings.id, t.id));
    } catch {
      res.errors++;
      if (++consecutiveErrors >= 3) break;
    }
  }
  return res;
}
