// IndexNow: paziņo Bing (un Yandex, Seznam u.c.), ka mūsu pašu sludinājums parādījies, mainījies vai noņemts,
// lai tie to pārrāpo uzreiz; reizi dienā arī visas sitemap lapas, kas vēl nav sūtītas (indexnow_sent) (Google IndexNow neizmanto; tam ir sitemap). Atslēga ir publiska pēc protokola:
// fails public/<INDEXNOW_KEY>.txt. Strādā tikai produkcijā (APP_URL ar https), izslēdz ar INDEXNOW=off.
import { lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { INDEXNOW_DAILY_MAX, INDEXNOW_RESEND_DAYS } from "./constants";
import { appBase } from "./seo";

export const INDEXNOW_KEY = "e7268b683942bdd67598b22936b3b0dc";

let queue = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

function enabled() {
  return process.env.INDEXNOW === "dry" || (process.env.INDEXNOW !== "off" && appBase().startsWith("https://"));
}

/** Pievieno adreses rindai; tās tiek nosūtītas kopā pēc 30 s (vienā pieprasījumā līdz 10 000 adresēm). */
export function indexNow(paths: string[]) {
  if (!enabled() || !paths.length) return;
  for (const p of paths) queue.add(`${appBase()}${p}`);
  if (!timer) timer = setTimeout(flush, 30_000);
}

/** Sludinājuma adreses visās valodās. */
export const listingPaths = (ids: string[]) => ids.flatMap((id) => ["", "/en", "/ru", "/lt"].map((l) => `${l}/sludinajumi/${id}`));

/** Nosūta līdz 10 000 adresēm; true, ja IndexNow pieņēma (200/202). */
async function post(urls: string[]): Promise<boolean> {
  // pārbaudei bez sūtīšanas: INDEXNOW=dry
  if (process.env.INDEXNOW === "dry") { console.log(`IndexNow (dry): ${urls.length} adreses, piem. ${urls.slice(0, 3).join(", ")}`); return true; }
  const host = new URL(appBase()).host;
  try {
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${appBase()}/${INDEXNOW_KEY}.txt`, urlList: urls }),
      signal: AbortSignal.timeout(30_000),
    });
    if (r.status >= 300) {
      console.error("IndexNow:", r.status, (await r.text()).slice(0, 200));
      return false;
    }
    console.log(`IndexNow: ${urls.length} adreses (${r.status})`);
    return true;
  } catch (e) {
    console.error("IndexNow neizdevās:", e instanceof Error ? e.message : e);
    return false;
  }
}

async function flush() {
  timer = null;
  const urls = [...queue].slice(0, 10_000);
  queue = new Set([...queue].slice(10_000));
  if (urls.length) await post(urls);
  if (queue.size && !timer) timer = setTimeout(flush, 30_000);
}

/**
 * Ikdienas kārta: visas sitemap adreses (SEO lapas, rīki, pašu sludinājumi, visās valodās), kuras vēl nav sūtītas
 * vai sūtītas pirms INDEXNOW_RESEND_DAYS, līdz INDEXNOW_DAILY_MAX dienā. Atgriež nosūtīto skaitu.
 */
export async function indexNowDaily(): Promise<number> {
  if (!enabled()) return 0;
  const { default: sitemap } = await import("@/app/sitemap");
  const all = [...new Set((await sitemap()).map((e) => e.url))];
  const since = new Date(Date.now() - INDEXNOW_RESEND_DAYS * 86400_000);
  const fresh = new Set(
    (await db.select({ url: schema.indexnowSent.url }).from(schema.indexnowSent).where(sql`${schema.indexnowSent.sentAt} >= ${since}`)).map((r) => r.url),
  );
  const todo = all.filter((u) => !fresh.has(u)).slice(0, INDEXNOW_DAILY_MAX);
  if (!todo.length) return 0;
  const ok = await post(todo);
  if (!ok) return 0;
  for (let i = 0; i < todo.length; i += 1000) {
    const chunk = todo.slice(i, i + 1000);
    await db.insert(schema.indexnowSent).values(chunk.map((url) => ({ url })))
      .onConflictDoUpdate({ target: schema.indexnowSent.url, set: { sentAt: sql`now()` } });
  }
  await db.delete(schema.indexnowSent).where(lt(schema.indexnowSent.sentAt, new Date(Date.now() - 365 * 86400_000)));
  console.log(`IndexNow ikdienas kārta: ${todo.length} adreses (${all.length} sitemap)`);
  return todo.length;
}

/** Fona plānotājs: pirmā kārta 15 min pēc starta, tad ik 24 h. */
export function startIndexNowDaily() {
  if (!enabled()) return;
  const run = () => indexNowDaily().catch((e) => console.error("IndexNow ikdienas kārta neizdevās:", e instanceof Error ? e.message : e));
  setTimeout(() => { run(); setInterval(run, 24 * 3600_000); }, 15 * 60_000);
}
