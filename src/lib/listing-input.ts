import { z } from "zod";
import {
  AMENITIES, BODY_TYPES, COLORS, CONDITIONS, DEALS, DRIVES, FUELS, GEARBOXES, HEATING, MATERIALS, MAX_PHOTOS,
  PROPERTY_FIELDS, PROPERTY_TYPES, PURPOSES, SERIES, VEHICLE_CLASSES, type PropertyType, type VehicleClass,
} from "./constants";

// Tukšs teksts → undefined; skaitļi no formas var nākt kā teksts
const opt = <T extends z.ZodTypeAny>(s: T) => z.preprocess((v) => (v === "" || v === null ? undefined : v), s.optional());
const int = (min: number, max: number, msg: string) => z.coerce.number({ message: msg }).int(msg).min(min, msg).max(max, msg);
const num = (min: number, max: number, msg: string) => z.coerce.number({ message: msg }).min(min, msg).max(max, msg);
const oneOf = <T extends readonly string[]>(list: T, msg: string) => z.enum(list as unknown as [string, ...string[]], { message: msg });

const year = new Date().getFullYear() + 1;

const common = {
  id: opt(z.string().uuid()),
  title: z.string().trim().max(90, "Virsraksts ir pārāk garš (līdz 90 zīmēm).").default(""),
  description: z.string().trim().max(4000, "Apraksts ir pārāk garš (līdz 4000 zīmēm).").default(""),
  price: int(1, 50_000_000, "Norādi cenu eiro (veselu skaitli)."),
  placeId: int(1, 1_000_000, "Izvēlies vietu."),
  contactPhone: z.string().trim().max(30).default(""),
  contactEmail: z.string().trim().max(120).default(""),
  photoIds: z.array(z.string().uuid()).max(MAX_PHOTOS, `Ne vairāk kā ${MAX_PHOTOS} bildes.`).default([]),
  honeypot: z.string().default(""),
  startedAt: z.coerce.number().default(0),
};

export const VehicleInput = z
  .object({
    ...common,
    kind: z.literal("vehicle"),
    vehicleClass: oneOf(VEHICLE_CLASSES, "Izvēlies transporta veidu."),
    makeId: opt(int(1, 1_000_000, "Izvēlies marku.")),
    modelId: opt(int(1, 10_000_000, "Izvēlies modeli.")),
    makeText: z.string().trim().max(40).default(""),
    modelText: z.string().trim().max(60).default(""),
    year: int(1900, year, `Gadam jābūt no 1900 līdz ${year}.`),
    mileageKm: opt(int(0, 5_000_000, "Nobraukumam jābūt skaitlim kilometros.")),
    fuel: oneOf(FUELS, "Izvēlies degvielu."),
    gearbox: oneOf(GEARBOXES, "Izvēlies ātrumkārbu."),
    body: z.string().trim().min(1, "Izvēlies virsbūvi vai tipu."),
    engineL: opt(num(0.05, 30, "Tilpumam jābūt litros, piem. 2.0.")),
    powerKw: opt(int(1, 2000, "Jaudai jābūt kilovatos.")),
    drive: opt(oneOf(DRIVES, "Izvēlies piedziņu.")),
    color: opt(oneOf(COLORS, "Izvēlies krāsu.")),
    vin: opt(z.string().trim().toUpperCase().regex(/^[A-HJ-NPR-Z0-9]{17}$/, "VIN kodam jābūt 17 zīmēm (bez I, O, Q).")),
  })
  .superRefine((v, ctx) => {
    if (!BODY_TYPES[v.vehicleClass as VehicleClass].includes(v.body)) ctx.addIssue({ code: "custom", path: ["body"], message: "Izvēlies virsbūvi vai tipu." });
    if (!v.makeId && v.makeText.length < 2) ctx.addIssue({ code: "custom", path: ["makeId"], message: "Izvēlies marku vai ieraksti to." });
    if (!v.modelId && v.modelText.length < 1) ctx.addIssue({ code: "custom", path: ["modelId"], message: "Izvēlies modeli vai ieraksti to." });
  });

export const PropertyInput = z
  .object({
    ...common,
    kind: z.literal("property"),
    propertyType: oneOf(PROPERTY_TYPES, "Izvēlies īpašuma veidu."),
    deal: oneOf(DEALS, "Izvēlies darījuma veidu."),
    rooms: opt(int(0, 50, "Istabu skaitam jābūt no 0 līdz 50.")),
    areaM2: opt(num(1, 1_000_000, "Platībai jābūt kvadrātmetros.")),
    landM2: opt(int(1, 1_000_000_000, "Zemes platībai jābūt kvadrātmetros.")),
    floor: opt(int(-5, 100, "Stāvam jābūt skaitlim.")),
    floors: opt(int(1, 100, "Stāvu skaitam jābūt skaitlim.")),
    series: opt(oneOf(SERIES, "Izvēlies sēriju.")),
    material: opt(oneOf(MATERIALS, "Izvēlies mājas tipu.")),
    heating: opt(oneOf(HEATING, "Izvēlies apkuri.")),
    condition: opt(oneOf(CONDITIONS, "Izvēlies stāvokli.")),
    builtYear: opt(int(1500, year, "Būvniecības gads nav derīgs.")),
    purpose: opt(oneOf(PURPOSES, "Izvēlies lietošanas mērķi.")),
    amenities: z.array(oneOf(AMENITIES, "Nederīga ērtība.")).max(AMENITIES.length).default([]),
  })
  .superRefine((v, ctx) => {
    const f = PROPERTY_FIELDS[v.propertyType as PropertyType];
    if (f.includes("areaM2") && v.areaM2 == null && v.propertyType !== "Garāža") ctx.addIssue({ code: "custom", path: ["areaM2"], message: "Norādi platību." });
    if (f.includes("landM2") && !f.includes("areaM2") && v.landM2 == null) ctx.addIssue({ code: "custom", path: ["landM2"], message: "Norādi zemes platību." });
    if (v.floor != null && v.floors != null && v.floor > v.floors) ctx.addIssue({ code: "custom", path: ["floor"], message: "Stāvs nevar būt augstāks par stāvu skaitu ēkā." });
  });

export const ListingInput = z.discriminatedUnion("kind", [VehicleInput, PropertyInput]);
export type ListingInputT = z.infer<typeof ListingInput>;
export type VehicleInputT = z.infer<typeof VehicleInput>;
export type PropertyInputT = z.infer<typeof PropertyInput>;

/** Atstāj tikai tos īpašuma laukus, kas attiecas uz izvēlēto veidu. */
export function pickPropertyFields(v: PropertyInputT) {
  const f = PROPERTY_FIELDS[v.propertyType as PropertyType];
  const on = (k: string) => f.includes(k);
  return {
    rooms: on("rooms") ? (v.rooms ?? null) : null,
    areaM2: on("areaM2") && v.areaM2 != null ? String(v.areaM2) : null,
    landM2: on("landM2") ? (v.landM2 ?? null) : null,
    floor: on("floor") ? (v.floor ?? null) : null,
    floors: on("floors") ? (v.floors ?? null) : null,
    series: on("series") ? (v.series ?? null) : null,
    material: on("material") ? (v.material ?? null) : null,
    heating: on("heating") ? (v.heating ?? null) : null,
    condition: on("condition") ? (v.condition ?? null) : null,
    builtYear: on("builtYear") ? (v.builtYear ?? null) : null,
    purpose: on("purpose") ? (v.purpose ?? null) : null,
    amenities: on("amenities") ? v.amenities : [],
  };
}

export const landLabel = (m2: number) => (m2 >= 10_000 ? `${(m2 / 10_000).toFixed(m2 >= 100_000 ? 0 : 1)} ha` : `${new Intl.NumberFormat("lv-LV").format(m2)} m²`);

/** Virsraksts, ja lietotājs to neieraksta. */
export function autoTitle(v: ListingInputT, names: { make?: string; model?: string }) {
  if (v.kind === "vehicle") {
    return [names.make ?? v.makeText, names.model ?? v.modelText, v.engineL ? Number(v.engineL).toFixed(1) : "", v.fuel === "Dīzelis" ? "dīzelis" : v.fuel === "Elektro" ? "elektro" : "", String(v.year)]
      .filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }
  const p = pickPropertyFields(v);
  const a = p.areaM2 ? `${p.areaM2} m²` : "";
  switch (v.propertyType) {
    case "Dzīvoklis": return `${p.rooms ?? 1}-istabu dzīvoklis${a ? ", " + a : ""}`;
    case "Istaba": return `Istaba${a ? " " + a : ""} dzīvoklī`;
    case "Māja": return `Privātmāja${a ? " " + a : ""}${p.landM2 ? ", zeme " + landLabel(p.landM2) : ""}`;
    case "Vasarnīca": return `Vasarnīca${a ? " " + a : ""}${p.landM2 ? ", zeme " + landLabel(p.landM2) : ""}`;
    case "Lauku īpašums": return `Lauku īpašums${p.landM2 ? " " + landLabel(p.landM2) : ""}`;
    case "Zeme": return `Zemes gabals${p.landM2 ? " " + landLabel(p.landM2) : ""}${p.purpose ? ", " + p.purpose.toLocaleLowerCase("lv") : ""}`;
    case "Mežs": return `Meža īpašums${p.landM2 ? " " + landLabel(p.landM2) : ""}`;
    default: return `${v.propertyType}${a ? " " + a : ""}`;
  }
}
