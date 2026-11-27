// „Aizpildi ar AI” sludinājuma pievienošanā: pārdevēja brīvais teksts → formas lauki, sakārtots apraksts un cenas ieteikums.
// Gemini tikai sakārto paša pārdevēja doto informāciju (neko neizdomā); marku/modeli/vietu sasaistām ar katalogu paši,
// cenu iesakām no mūsu tirgus datiem (valuation.ts), nevis no AI.
import {
  AMENITIES, BODY_TYPES, COLORS, CONDITIONS, DEALS, DRIVES, FUELS, GEARBOXES, HEATING, MATERIALS, PROPERTY_GROUPS, PURPOSES, SERIES,
  VEHICLE_CLASSES, type VehicleClass,
} from "@/lib/constants";
import { getCatalog } from "@/lib/seo";
import { findMake, matchModel } from "@/lib/importers/ss-rss";
import { regionOptions } from "@/lib/listings";
import { valueFlat, valueVehicle } from "@/lib/valuation";

export type AssistResult = {
  values: Record<string, string>;
  amenities: string[];
  price: { median: number; p25: number; p75: number; n: number; unit: "eur" | "sqm" } | null;
};

const PROPERTY_TYPES = Object.values(PROPERTY_GROUPS).flat() as string[];

function prompt(lang: string) {
  const bodies = VEHICLE_CLASSES.map((c) => `${c}: ${(BODY_TYPES[c] ?? []).join(", ")}`).join("; ");
  return `Tu palīdzi pārdevējam aizpildīt sludinājuma formu portālā VienāVietā. No pārdevēja teksta izvelc tikai to, kas tajā TIEŠĀM ir pateikts. Neizdomā faktus (nobraukumu, gadu, aprīkojumu, stāvokli, cenu), ja tie nav minēti — atstāj tukšu.
Atbildi TIKAI ar JSON šādā formā (visas vērtības teksts, nezināmās ""):
{"kind":"vehicle|property","vehicleClass":"${VEHICLE_CLASSES.join("|")}","make":"","model":"","year":"","mileageKm":"","fuel":"","gearbox":"","body":"","engineL":"","powerKw":"","drive":"","color":"",
"propertyType":"","deal":"","rooms":"","areaM2":"","landM2":"","floor":"","floors":"","series":"","material":"","heating":"","condition":"","builtYear":"","purpose":"","amenities":[],
"place":"","price":"","title":"","description":""}
Atļautās vērtības (precīzi šādā rakstībā): fuel: ${FUELS.join(", ")}; gearbox: ${GEARBOXES.join(", ")}; body pa transporta veidiem: ${bodies}; drive: ${DRIVES.join(", ")}; color: ${COLORS.join(", ")}; propertyType: ${PROPERTY_TYPES.join(", ")}; deal: ${DEALS.join(", ")} (sell=pārdod, rent=izīrē, day=uz dienu, buy=pērk); series: ${SERIES.join(", ")}; material: ${MATERIALS.join(", ")}; heating: ${HEATING.join(", ")}; condition: ${CONDITIONS.join(", ")}; purpose: ${PURPOSES.join(", ")}; amenities: ${AMENITIES.join(", ")}.
Skaitļi bez vienībām (mileageKm km, engineL litri ar punktu, powerKw kW — ja dota ZS, pārrēķini ×0,7355, areaM2 m², price eiro). place: pilsētas, novada vai Rīgas apkaimes nosaukums, kā minēts.
title: īss, konkrēts virsraksts (līdz 70 zīmēm), piem. "Volkswagen Golf 1.6 TDI, 2014, automāts".
description: sakārtots, pieklājīgs apraksts no pārdevēja teksta (2–6 īsi teikumi vai saraksts), tikai minētie fakti, bez reklāmas frāzēm un bez kontaktiem; valoda: ${lang === "lv" ? "latviešu" : lang === "ru" ? "krievu" : lang === "lt" ? "lietuviešu" : "angļu"}.`;
}

async function gemini(text: string, lang: string): Promise<Record<string, unknown>> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY nav iestatīta");
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: prompt(lang) }] },
      contents: [{ role: "user", parts: [{ text: text.slice(0, 2000) }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 900, responseMimeType: "application/json" },
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const out = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return JSON.parse(out) as Record<string, unknown>;
}

const str = (x: unknown) => (x == null ? "" : String(x).trim());
const numStr = (x: unknown, max: number) => {
  const n = Number(String(x ?? "").replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 && n <= max ? String(n) : "";
};
const pick = (x: unknown, list: readonly string[]) => {
  const s = str(x).toLowerCase();
  return list.find((o) => o.toLowerCase() === s) ?? "";
};
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

export async function assistListing(text: string, lang: string): Promise<AssistResult> {
  const g = await gemini(text, lang);
  const kind = str(g.kind) === "property" ? "property" : "vehicle";
  const v: Record<string, string> = { kind };
  v.title = str(g.title).slice(0, 90);
  v.description = str(g.description).slice(0, 4000);
  v.price = numStr(g.price, 50_000_000);

  // vieta: precīza sakritība ar mūsu vietu nosaukumiem
  const regions = await regionOptions({ withCity: true });
  const placeWant = norm(str(g.place));
  if (placeWant) {
    const all = regions.filter((r) => kind === "vehicle" || r.country === "LV").flatMap((r) => r.places.map((p) => ({ ...p, region: r.region })));
    const hit = all.find((p) => norm(p.name) === placeWant) ?? all.find((p) => norm(p.region) === placeWant && norm(p.name) === norm(p.region)) ?? all.find((p) => norm(p.region) === placeWant);
    if (hit) v.placeId = String(hit.id);
  }

  let price: AssistResult["price"] = null;
  if (kind === "vehicle") {
    const vc = (VEHICLE_CLASSES as readonly string[]).includes(str(g.vehicleClass)) ? (str(g.vehicleClass) as VehicleClass) : "car";
    v.vehicleClass = vc;
    v.year = numStr(g.year, new Date().getFullYear() + 1);
    v.mileageKm = numStr(g.mileageKm, 2_000_000);
    v.fuel = pick(g.fuel, FUELS);
    v.gearbox = pick(g.gearbox, GEARBOXES);
    v.body = pick(g.body, BODY_TYPES[vc] ?? []);
    v.engineL = numStr(g.engineL, 15);
    v.powerKw = numStr(g.powerKw, 2000);
    v.drive = pick(g.drive, DRIVES);
    v.color = pick(g.color, COLORS);
    const cat = await getCatalog();
    const make = str(g.make) ? findMake(cat.makes, vc, str(g.make)) : null;
    if (make) {
      v.makeId = String(make.id);
      const model = str(g.model) ? matchModel(cat.models, make.id, str(g.model), make.name) : null;
      if (model) v.modelId = String(model.id);
      else v.modelText = str(g.model).slice(0, 60);
      if (model && v.year) {
        const val = await valueVehicle(model.id, Number(v.year), v.mileageKm ? Number(v.mileageKm) : null).catch(() => null);
        if (val && val.n >= 5) price = { median: val.median, p25: val.p25, p75: val.p75, n: val.n, unit: "eur" };
      }
    } else if (str(g.make)) {
      v.makeText = str(g.make).slice(0, 40);
      v.modelText = str(g.model).slice(0, 60);
    }
  } else {
    const pt = PROPERTY_TYPES.find((x) => x.toLowerCase() === str(g.propertyType).toLowerCase());
    if (pt) v.propertyType = pt;
    v.deal = pick(g.deal, DEALS) || "sell";
    v.rooms = numStr(g.rooms, 50);
    v.areaM2 = numStr(g.areaM2, 100_000);
    v.landM2 = numStr(g.landM2, 100_000_000);
    v.floor = numStr(g.floor, 100);
    v.floors = numStr(g.floors, 100);
    v.builtYear = numStr(g.builtYear, new Date().getFullYear() + 3);
    v.series = pick(g.series, SERIES);
    v.material = pick(g.material, MATERIALS);
    v.heating = pick(g.heating, HEATING);
    v.condition = pick(g.condition, CONDITIONS);
    v.purpose = pick(g.purpose, PURPOSES);
    if (v.propertyType === "Dzīvoklis" && v.deal === "sell" && v.placeId && v.areaM2) {
      const val = await valueFlat(Number(v.placeId), Number(v.areaM2), v.rooms ? Number(v.rooms) : null).catch(() => null);
      if (val?.asking && val.asking.n >= 5) price = { median: val.asking.median, p25: val.asking.p25, p75: val.asking.p75, n: val.asking.n, unit: "sqm" };
    }
  }
  for (const k of Object.keys(v)) if (v[k] === "") delete v[k];
  const amenities = Array.isArray(g.amenities) ? (g.amenities as unknown[]).map((a) => pick(a, AMENITIES)).filter(Boolean) : [];
  return { values: v, amenities, price };
}
