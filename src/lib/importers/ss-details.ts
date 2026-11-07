// ss.com transporta sarakstos pilsētas nav, tāpēc katra sludinājuma lapu atveram vienu reizi
// un nolasām TIKAI lauku "Vieta" (piem. "Rīga", "Ogre un raj."). Neko citu no lapas neņemam un neglabājam.
// Lietotājs to apstiprināja 2026-11-07. Izslēdz ar SS_DETAILS=off.
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { SS_DETAIL_DELAY_MS, SS_DETAIL_PER_MIN } from "../constants";
import { defaultFetch, loadCtx } from "./ss-pages";

const { listings } = schema;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Nolasa "Vieta:" vērtību no sludinājuma lapas. */
export function parseLocation(html: string): string | null {
  const m = html.match(/class="ads_contacts_name"[^>]*>\s*Vieta:\s*<\/td>\s*<td[^>]*>([^<]{1,80})<\/td>/);
  return m ? m[1].replace(/&nbsp;/g, " ").trim() || null : null;
}

export function detailsEnabled() {
  return process.env.SS_DETAILS !== "off";
}

/** Apstrādā nākamos sludinājumus bez pilsētas (jaunākos vispirms). */
export async function fillVehicleCities(limit = SS_DETAIL_PER_MIN, fetchHtml = defaultFetch, delayMs = SS_DETAIL_DELAY_MS) {
  const todo = await db
    .select({ id: listings.id, url: listings.externalUrl })
    .from(listings)
    .where(and(eq(listings.source, "ss.com"), eq(listings.kind, "vehicle"), eq(listings.status, "active"), isNull(listings.placeId), isNull(listings.detailCheckedAt)))
    .orderBy(desc(listings.createdAt))
    .limit(limit);
  if (!todo.length) return null;
  const ctx = await loadCtx();
  const res = { checked: 0, found: 0, gone: 0, errors: 0 };
  for (const [i, t] of todo.entries()) {
    if (i) await sleep(delayMs);
    if (!t.url?.startsWith("https://www.ss.com/msg/")) {
      await db.update(listings).set({ detailCheckedAt: new Date() }).where(eq(listings.id, t.id));
      continue;
    }
    try {
      const html = await fetchHtml(t.url);
      res.checked++;
      const loc = parseLocation(html);
      const city = loc ? ctx.findCity(loc) : null;
      if (city) res.found++;
      await db
        .update(listings)
        .set({
          detailCheckedAt: new Date(),
          ...(city ? { placeId: city.id, lat: city.lat + (Math.random() - 0.5) * 0.01, lon: city.lon + (Math.random() - 0.5) * 0.02, geoPrecision: "place" } : {}),
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
