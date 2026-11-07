// Mājas atslēga VZD darījumu sasaistei ar sludinājumu adresi: ielas nosaukums bez tipa + mājas numurs.
// "Kalna iela 13A - 52, Rīga, LV-1003" → "kalna-13a"; ss.com "Kalna 13a, Centrs, Rīga" → "kalna-13a".
import { slug } from "@/lib/importers/ss-rss";

const STREET_TYPES = /(^|\s)(iela|ielā|gatve|gt\.?|prospekts|pr\.?|prosp\.?|bulvāris|bulv\.?|šoseja|šos\.?|laukums|aleja|dambis|krastmala|līnija|šķērslīnija|ceļš)(?=\s|$)/gi;

// ss.com reizēm raksta kirilicas burtus (piem. "2а"): pārvēršam latīņu līdziniekos
const CYR: Record<string, string> = { "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "к": "k", "о": "o", "р": "r", "с": "s", "А": "A", "Б": "B", "В": "V", "Е": "E", "К": "K", "О": "O", "С": "S" };

export function houseKey(address: string): string | null {
  const first = address.split(",")[0].replace(/[а-яА-Я]/g, (c) => CYR[c] ?? "").replace(/\s+-\s*\S+\s*$/, ""); // bez dzīvokļa numura
  if (!/\d/.test(first)) return null; // bez mājas numura nav ar ko salīdzināt
  const k = slug(first.replace(STREET_TYPES, " "));
  return k || null;
}

/**
 * Īsā atslēga: ielas nosaukuma pēdējais vārds + mājas numurs. ss.com bieži raksta ielu saīsināti
 * ("Lejiņa 5" pret VZD "Paula Lejiņa iela 5", "Valdemāra 38" pret "Krišjāņa Valdemāra iela 38").
 */
export function houseTail(address: string): string | null {
  const key = houseKey(address);
  if (!key) return null;
  const m = key.match(/^(.*?)-?(\d+[a-z]?(?:-k-?\d+)?(?:-\d+)?)$/);
  if (!m || !m[1]) return null;
  const last = m[1].split("-").filter((w) => !/^\d+$/.test(w)).at(-1);
  return last && last.length >= 3 ? `${last}-${m[2]}` : null;
}
