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

/** Komplektācija no portāla virsraksta / teksta sākuma (pirmā atrastā pēc TRIMS secības) vai null. */
export function detectTrim(make: string | null | undefined, ...texts: (string | null | undefined)[]): string | null {
  const list = make ? TRIMS[make] : undefined;
  if (!list) return null;
  const text = texts.filter(Boolean).join(" ").slice(0, 400);
  if (!text) return null;
  return list.find((t) => t.re.test(text))?.name ?? null;
}

/** Derīga komplektācija šai markai (filtram un pārdevēja formai). */
export const isTrim = (make: string | null | undefined, v: string | null | undefined) => Boolean(make && v && TRIMS[make]?.some((t) => t.name === v));
