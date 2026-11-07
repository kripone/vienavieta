// ss.com transporta sarakstos nav pilsētas, ātrumkārbas, krāsas un aprīkojuma, tāpēc katra sludinājuma lapu
// atveram vienu reizi un nolasām TIKAI faktu laukus: Vieta, Ātrumkārba, Krāsa, Virsbūves tips, Vietu skaits,
// Tehniskā apskate un atzīmēto aprīkojumu. Pārdevēja tekstu, kontaktus un bildes neņemam.
// Lietotājs to apstiprināja 2026-11-07. Izslēdz ar SS_DETAILS=off.
import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { BODY_TYPES, COLORS, SS_DETAIL_DELAY_MS, SS_DETAIL_PER_MIN, SS_DETAILS_V2_AT } from "../constants";
import { defaultFetch, loadCtx } from "./ss-pages";

const { listings } = schema;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Nolasa "Vieta:" vērtību no sludinājuma lapas. */
export function parseLocation(html: string): string | null {
  const m = html.match(/class="ads_contacts_name"[^>]*>\s*Vieta:\s*<\/td>\s*<td[^>]*>([^<]{1,80})<\/td>/);
  return m ? m[1].replace(/&nbsp;/g, " ").trim() || null : null;
}

const decode = (s: string) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

/** Faktu lauki un aprīkojums no transporta sludinājuma lapas. */
export function parseAdDetails(html: string) {
  const opts: Record<string, string> = {};
  for (const m of html.matchAll(/class="ads_opt_name"[^>]*>\s*([^<:]{2,40}):?\s*<\/td>\s*<td[^>]*class="ads_opt"[^>]*>([\s\S]{0,200}?)<\/td>/g)) {
    opts[decode(m[1])] = decode(m[2].replace(/<[^>]+>/g, " "));
  }
  const gearRaw = opts["Ātrumkārba"] ?? "";
  const gearbox = /^autom/i.test(gearRaw) ? "Automāts" : /^manu/i.test(gearRaw) ? "Manuāla" : null;
  const colorRaw = (opts["Krāsa"] ?? "").split(" ")[0];
  const color = colorRaw ? ((COLORS as readonly string[]).find((c) => c.toLowerCase() === colorRaw.toLowerCase()) ?? "Cita") : null;
  const bodyRaw = opts["Virsbūves tips"] ?? "";
  const body = (BODY_TYPES.car as readonly string[]).find((b) => b.toLowerCase() === bodyRaw.toLowerCase()) ?? null;
  const seats = Number(opts["Vietu skaits"]) || null;
  const inspectionUntil = opts["Tehniskā apskate"]?.match(/^\d{2}\.\d{4}$/)?.[0] ?? null;
  // aprīkojums: grupas virsraksts (auto_c_head) un atzīmētie elementi (<b class="auto_c">); neatzīmētie ir parastā tekstā
  const features: string[] = [];
  const spec = html.match(/id="msg_div_spec"[\s\S]*?(?=<\/table><\/div>|$)/)?.[0] ?? "";
  let group = "";
  for (const m of spec.matchAll(/<div class="auto_c_head">([^<]+)<\/div>|<b class="auto_c">([^<]+)<\/b>/g)) {
    if (m[1]) group = decode(m[1]);
    else if (m[2] && group) features.push(`${group}|${decode(m[2])}`);
  }
  return { location: parseLocation(html), gearbox, color, body, seats: seats && seats < 60 ? seats : null, inspectionUntil, features: [...new Set(features)].slice(0, 150) };
}

export function detailsEnabled() {
  return process.env.SS_DETAILS !== "off";
}

/** Apstrādā nākamos vēl neatvērtos (vai pirms aprīkojuma nolasīšanas atvērtos) sludinājumus, jaunākos vispirms. */
export async function fillVehicleCities(limit = SS_DETAIL_PER_MIN, fetchHtml = defaultFetch, delayMs = SS_DETAIL_DELAY_MS) {
  const todo = await db
    .select({ id: listings.id, url: listings.externalUrl, placeId: listings.placeId, body: listings.body })
    .from(listings)
    .where(and(eq(listings.source, "ss.com"), eq(listings.kind, "vehicle"), eq(listings.status, "active"), or(isNull(listings.detailCheckedAt), lt(listings.detailCheckedAt, SS_DETAILS_V2_AT))))
    .orderBy(desc(listings.createdAt))
    .limit(limit);
  if (!todo.length) return null;
  const ctx = await loadCtx();
  const res = { checked: 0, found: 0, features: 0, gone: 0, errors: 0 };
  for (const [i, t] of todo.entries()) {
    if (i) await sleep(delayMs);
    if (!t.url?.startsWith("https://www.ss.com/msg/")) {
      await db.update(listings).set({ detailCheckedAt: new Date() }).where(eq(listings.id, t.id));
      continue;
    }
    try {
      const html = await fetchHtml(t.url);
      res.checked++;
      const d = parseAdDetails(html);
      const city = !t.placeId && d.location ? ctx.findCity(d.location) : null;
      if (city) res.found++;
      if (d.features.length) res.features++;
      await db
        .update(listings)
        .set({
          detailCheckedAt: new Date(),
          ...(city ? { placeId: city.id, lat: city.lat + (Math.random() - 0.5) * 0.01, lon: city.lon + (Math.random() - 0.5) * 0.02, geoPrecision: "place" } : {}),
          ...(d.gearbox ? { gearbox: d.gearbox } : {}),
          ...(d.color ? { color: d.color } : {}),
          ...(d.body ? { body: d.body } : {}), // ss.com norādītais virsbūves tips precīzāks par minējumu pēc modeļa
          ...(d.seats ? { seats: d.seats } : {}),
          ...(d.inspectionUntil ? { inspectionUntil: d.inspectionUntil } : {}),
          features: d.features,
        })
        .where(eq(listings.id, t.id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // 404 = sludinājums dzēsts; atzīmējam kā pārbaudītu, lai neatgrieztos
      if (/\b404\b/.test(msg)) {
        res.gone++;
        await db.update(listings).set({ detailCheckedAt: new Date() }).where(eq(listings.id, t.id));
      } else {
        res.errors++;
        if ((e as { retryAfter?: number }).retryAfter) break; // portāls lūdz pagaidīt
      }
    }
  }
  return res;
}
