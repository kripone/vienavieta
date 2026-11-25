// Auto komplektācijas (aprīkojuma līmeņi) pa markām: nosaukums un kā to atpazīt portāla virsrakstā
// vai sludinājuma teksta sākumā (lietotājs apstiprināja 2026-11-25: nolasām tikai komplektācijas nosaukumu
// kā faktu, tekstu neglabājam). Secība svarīga: specifiskākais pirmais ("GT Line S" pirms "GT Line").
// Apraksti (kas ietilpst) 4 valodās: src/content/trims.ts.

type Trim = { name: string; re: RegExp };

const B = "(?<![\\p{L}\\p{N}])"; // vārda sākums (arī pēc "-", "/")
const E = "(?![\\p{L}\\p{N}])"; // vārda beigas
const r = (src: string) => new RegExp(`${B}(?:${src})${E}`, "iu");

export const TRIMS: Record<string, Trim[]> = {
  BMW: [
    { name: "M Sport", re: r("m[\\s-]?(?:sport\\w*|pak\\w*|pac\\w*)|m[\\s-]?spor") },
    { name: "Luxury Line", re: r("luxury[\\s-]?line") },
    { name: "Sport Line", re: r("sport[\\s-]?line") },
    { name: "Modern Line", re: r("modern[\\s-]?line") },
    { name: "xLine", re: r("x[\\s-]?line") },
  ],
  "Mercedes-Benz": [
    { name: "AMG Line", re: r("amg[\\s-]?(?:line|pak\\w*|pac\\w*|stil\\w*|styl\\w*|sport\\w*)") },
    { name: "Avantgarde", re: r("avantgard\\w*") },
    { name: "Elegance", re: r("elegance") },
    { name: "Exclusive", re: r("exclusive") },
  ],
  Audi: [
    { name: "S line", re: r("s[\\s-]?line") },
  ],
  Volkswagen: [
    { name: "R-Line", re: r("r[\\s-]?line") },
    { name: "Highline", re: r("high[\\s-]?line") },
    { name: "Comfortline", re: r("comfort[\\s-]?line") },
    { name: "Trendline", re: r("trend[\\s-]?line") },
  ],
  Škoda: [
    { name: "Laurin & Klement", re: r("l\\s?&\\s?k|laurin(?:\\s?&\\s?|\\s+)klement") },
    { name: "Sportline", re: r("sport[\\s-]?line") },
    { name: "Scout", re: r("scout") },
    { name: "RS", re: r("v?rs") },
    { name: "Ambition", re: r("ambition") },
  ],
  Kia: [
    { name: "GT Line S", re: r("gt[\\s-]?line[\\s-]?s") },
    { name: "GT Line", re: r("gt[\\s-]?line") },
  ],
  Volvo: [
    { name: "R-Design", re: r("r[\\s-]?design") },
    { name: "Inscription", re: r("inscription") },
    { name: "Summum", re: r("summum") },
    { name: "Momentum", re: r("momentum") },
    { name: "Kinetic", re: r("kinetic") },
  ],
  Toyota: [
    { name: "GR Sport", re: r("gr[\\s-]?sport") },
    { name: "Executive", re: r("executive") },
    { name: "Prestige", re: r("prestige") },
    { name: "Luna", re: r("luna") },
    { name: "Sol", re: r("sol") },
  ],
  Ford: [
    { name: "ST-Line", re: r("st[\\s-]?line") },
    { name: "Vignale", re: r("vignale") },
    { name: "Titanium", re: new RegExp(`${B}titanium${E}(?!\\s*(?:grey|gray|pelēk|сер))`, "iu") },
    { name: "Ghia", re: r("ghia") },
  ],
  Peugeot: [
    { name: "GT Line", re: r("gt[\\s-]?line") },
    { name: "Allure", re: r("allure") },
  ],
  Opel: [
    { name: "OPC Line", re: r("opc[\\s-]?line") },
    { name: "GS Line", re: r("gs[\\s-]?line") },
    { name: "Cosmo", re: r("cosmo") },
  ],
  Hyundai: [{ name: "N Line", re: r("n[\\s-]?line") }],
  Nissan: [
    { name: "Tekna", re: r("tekna") },
    { name: "N-Connecta", re: r("n[\\s-]?connecta") },
    { name: "Acenta", re: r("acenta") },
  ],
  Lexus: [{ name: "F Sport", re: r("f[\\s-]?sport") }],
  Renault: [
    { name: "RS Line", re: r("r\\.?s\\.?[\\s-]?line") },
    { name: "Initiale Paris", re: r("initiale") },
  ],
  Seat: [{ name: "FR", re: r("fr") }],
  "Land Rover": [
    { name: "R-Dynamic", re: r("r[\\s-]?dynamic") },
    { name: "HSE", re: r("hse") },
  ],
};

// --- jaunas komplektācijas, kuru nav katalogā (src/lib/trims-db.ts tās saglabā un aktivizē) ---

/** Aktīvās automātiski atrastās komplektācijas pa markām (ielādē trims-db.ts no tabulas trim_names). */
const DYNAMIC = new Map<string, Trim[]>();
/** Regex no nosaukuma: "Black Line" → black[\s-]?line */
const nameRe = (name: string) => r(name.toLowerCase().split(/[\s-]+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s-]?"));
export function setDynamicTrims(rows: { make: string; name: string }[]) {
  DYNAMIC.clear();
  for (const x of rows) {
    if (TRIMS[x.make]?.some((t) => t.name === x.name)) continue;
    (DYNAMIC.get(x.make) ?? DYNAMIC.set(x.make, []).get(x.make)!).push({ name: x.name, re: nameRe(x.name) });
  }
}

// Kandidāti: "<vārds> Line" ("Black Line", "Design Line") un "<saīsinājums> Sport" ("GR Sport").
// Skaitām dažādus tekstus (lai viens sludinājums, ko redzam katrā kārtā, nepiepūš skaitu).
const LINE_RE = /(?<![\p{L}\p{N}])([\p{L}]{2,12}|[A-Z0-9]{1,4})[\s-]line(?![\p{L}\p{N}])/giu;
const SPORT_RE = /(?<![\p{L}\p{N}])([A-Z]{1,3})[\s-]?Sport(?![\p{L}\p{N}])/gu;
const STOP = new Set(["on", "off", "online", "time", "head", "main", "first", "base", "full", "new", "top", "hot", "the", "all", "no", "dead", "fine", "bottom", "pipe", "fuel", "air", "oil", "hard", "soft", "spare", "dash", "roof", "side", "door", "waist", "belt", "gas", "finish", "tan", "brake", "service", "life", "product", "model", "and", "with", "un", "ar", "ir", "su"]);
const CANDIDATES = new Map<string, { make: string; name: string; texts: Set<string> }>();
const cap = (w: string) => (/^[A-Z0-9]{1,4}$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
function collect(make: string, text: string) {
  const found: string[] = [];
  for (const m of text.matchAll(LINE_RE)) if (!STOP.has(m[1].toLowerCase())) found.push(`${cap(m[1])} Line`);
  for (const m of text.matchAll(SPORT_RE)) found.push(`${m[1]} Sport`);
  for (const name of found) {
    const key = `${make}|${name}`;
    const c = CANDIDATES.get(key) ?? CANDIDATES.set(key, { make, name, texts: new Set() }).get(key)!;
    if (c.texts.size < 50) c.texts.add(text.slice(0, 120));
  }
  if (CANDIDATES.size > 5000) CANDIDATES.clear();
}
/** Savāktie kandidāti ar dažādo tekstu skaitu (trims-db.ts saglabā lielāko skaitu datubāzē). */
export function trimCandidates(): { make: string; name: string; n: number }[] {
  return [...CANDIDATES.values()].map((c) => ({ make: c.make, name: c.name, n: c.texts.size }));
}

/** Komplektācija no portāla virsraksta / teksta sākuma (katalogs, tad automātiski atrastās) vai null. */
export function detectTrim(make: string | null | undefined, ...texts: (string | null | undefined)[]): string | null {
  if (!make) return null;
  const text = texts.filter(Boolean).join(" ").slice(0, 400);
  if (!text) return null;
  const hit = TRIMS[make]?.find((t) => t.re.test(text)) ?? DYNAMIC.get(make)?.find((t) => t.re.test(text));
  if (hit) return hit.name;
  collect(make, text);
  return null;
}

/** Visas zināmās komplektācijas markai: katalogs + aktīvās automātiski atrastās. */
export const trimNamesFor = (make: string) => [...(TRIMS[make] ?? []).map((t) => t.name), ...(DYNAMIC.get(make) ?? []).map((t) => t.name)];

/** Visu marku zināmās komplektācijas (pārdevēja formas pārbaudei). */
export const allTrimNames = () => new Set([...Object.values(TRIMS).flat(), ...[...DYNAMIC.values()].flat()].map((t) => t.name));
