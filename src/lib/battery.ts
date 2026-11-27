// Elektroauto / plug-in hibrīda akumulatora ietilpība (kWh) no portāla virsraksta vai saraksta teksta sākuma
// (lietotājs apstiprināja 2026-11-26: nolasām tikai skaitli kā faktu, tekstu neglabājam – tāpat kā komplektācijas).
// Patēriņu ("16,5 kWh/100 km") neņemam; neticamas vērtības izlaižam.

const RE = /(?<![\d.,])(\d{1,3}(?:[.,]\d{1,2})?)\s?(?:kw\s?h|kwh|квт\s?[·.\-]?\s?ч)(?!\s*\/\s*100|\s*(?:uz|per|на)\s*100)/giu;
const RANGE: Record<string, [number, number]> = { Elektro: [15, 220], Hibrīds: [4, 40] };

/** kWh (vesels skaitlis) vai null. Tikai elektroauto un hibrīdiem. */
export function detectBatteryKwh(fuel: string | null | undefined, ...texts: (string | null | undefined)[]): number | null {
  const range = fuel ? RANGE[fuel] : undefined;
  if (!range) return null;
  const text = texts.filter(Boolean).join(" ").slice(0, 400);
  for (const m of text.matchAll(RE)) {
    const v = Number(m[1].replace(",", "."));
    if (v >= range[0] && v <= range[1]) return Math.round(v);
  }
  return null;
}
