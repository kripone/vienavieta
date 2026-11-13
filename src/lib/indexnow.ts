// IndexNow: paziņo Bing (un Yandex, Seznam u.c.), ka mūsu pašu sludinājums parādījies, mainījies vai noņemts,
// lai tie to pārrāpo uzreiz (Google IndexNow neizmanto; tam ir sitemap). Atslēga ir publiska pēc protokola:
// fails public/<INDEXNOW_KEY>.txt. Strādā tikai produkcijā (APP_URL ar https), izslēdz ar INDEXNOW=off.
import { appBase } from "./seo";

export const INDEXNOW_KEY = "e7268b683942bdd67598b22936b3b0dc";

let queue = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

function enabled() {
  return process.env.INDEXNOW !== "off" && appBase().startsWith("https://");
}

/** Pievieno adreses rindai; tās tiek nosūtītas kopā pēc 30 s (vienā pieprasījumā līdz 10 000 adresēm). */
export function indexNow(paths: string[]) {
  if (!enabled() || !paths.length) return;
  for (const p of paths) queue.add(`${appBase()}${p}`);
  if (!timer) timer = setTimeout(flush, 30_000);
}

/** Sludinājuma adreses visās valodās. */
export const listingPaths = (ids: string[]) => ids.flatMap((id) => ["", "/en", "/ru", "/lt"].map((l) => `${l}/sludinajumi/${id}`));

async function flush() {
  timer = null;
  const urls = [...queue].slice(0, 10_000);
  queue = new Set([...queue].slice(10_000));
  if (!urls.length) return;
  const host = new URL(appBase()).host;
  try {
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${appBase()}/${INDEXNOW_KEY}.txt`, urlList: urls }),
      signal: AbortSignal.timeout(15_000),
    });
    if (r.status >= 300) console.error("IndexNow:", r.status, (await r.text()).slice(0, 200));
    else console.log(`IndexNow: ${urls.length} adreses (${r.status})`);
  } catch (e) {
    console.error("IndexNow neizdevās:", e instanceof Error ? e.message : e);
  }
  if (queue.size && !timer) timer = setTimeout(flush, 30_000);
}
