// SEO lapas: tīras adreses meklētājiem (/auto/bmw/3-serija, /ipasumi/dzivokli/riga, /ipasumi/dzivokli-ire/riga).
// Katra adrese = noteikti meklēšanas filtri + savs virsraksts, apraksts un iekšējās saites.
// Meklēšanas lapas ar ?parametriem netiek indeksētas (noindex, follow); indeksējam šīs lapas.
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { PROPERTY_PLURAL, PROPERTY_SLUG, PROPERTY_TYPES, VEHICLE_SLUG, type PropertyType, type VehicleClass } from "./constants";

const { makes, models, regions } = schema;

export const appBase = () => (process.env.APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");

/** "Mercedes-Benz" → "mercedes-benz", "3. sērija" → "3-serija", "Ādažu novads" → "adazu-novads" */
export function seoSlug(s: string) {
  return s
    .toLocaleLowerCase("lv")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Vietas forma latviski: Rīga → Rīgā, Daugavpils → Daugavpilī, Rēzekne → Rēzeknē, Ādažu novads → Ādažu novadā. */
export function locative(name: string): string | null {
  if (/ novads$/.test(name)) return name.replace(/ novads$/, " novadā");
  if (/pils$/.test(name)) return name.replace(/pils$/, "pilī");
  if (/a$/.test(name)) return name.replace(/a$/, "ā");
  if (/e$/.test(name)) return name.replace(/e$/, "ē");
  return null;
}

// ---------- katalogs (kešots) ----------
type Catalog = {
  makes: { id: number; name: string; vehicleClass: string; slug: string }[];
  models: { id: number; makeId: number; name: string; slug: string }[];
  regions: { id: number; name: string; slug: string }[];
};
let catalog: { at: number; v: Promise<Catalog> } | null = null;
export function getCatalog(): Promise<Catalog> {
  if (catalog && catalog.at > Date.now() - 30 * 60_000) return catalog.v;
  const v = (async () => {
    const [m, mo, r] = await Promise.all([
      db.select({ id: makes.id, name: makes.name, vehicleClass: makes.vehicleClass }).from(makes),
      db.select({ id: models.id, makeId: models.makeId, name: models.name }).from(models),
      db.select({ id: regions.id, name: regions.name }).from(regions).where(eq(regions.country, "LV")).orderBy(asc(regions.id)),
    ]);
    return {
      makes: m.map((x) => ({ ...x, vehicleClass: String(x.vehicleClass), slug: seoSlug(x.name) })),
      models: mo.map((x) => ({ ...x, slug: seoSlug(x.name) })),
      regions: r.map((x) => ({ ...x, slug: seoSlug(x.name) })),
    };
  })();
  catalog = { at: Date.now(), v };
  v.catch(() => (catalog = null));
  return v;
}

// ---------- adreses ----------
export const vehicleHref = (vc: VehicleClass, make?: string | null, model?: string | null) => {
  const root = VEHICLE_SLUG[vc];
  if (!root) return null;
  return `/${root}${make ? `/${seoSlug(make)}` : ""}${make && model ? `/${seoSlug(model)}` : ""}`;
};
export const propertyHref = (type?: PropertyType | null, deal?: string | null, region?: string | null) =>
  `/ipasumi${type ? `/${PROPERTY_SLUG[type]}${deal === "rent" ? "-ire" : ""}` : ""}${type && region ? `/${seoSlug(region)}` : ""}`;

export type Crumb = { name: string; href: string };
export type Landing = {
  raw: Record<string, string>;
  path: string;
  h1: string;
  title: string;
  /** apraksta sākums (skaitu un cenu pieliek lapa) */
  about: string;
  crumbs: Crumb[];
  /** kādas iekšējās saites rādīt: markas, modeļi vai reģioni */
  facet: "make" | "model" | "region" | "ptype" | null;
  /** pāreja uz īri/pirkšanu */
  dealSwitch?: { href: string; label: string };
};

const VC_TITLE: Record<string, { all: string; of: (m: string) => string }> = {
  car: { all: "Lietotas automašīnas pārdošanā", of: (m) => `${m} pārdošanā` },
  moto: { all: "Motocikli pārdošanā", of: (m) => `${m} motocikli pārdošanā` },
};

/** /auto, /auto/bmw, /auto/bmw/3-serija (un /moto/...) */
export async function resolveVehicle(vc: VehicleClass, parts: string[]): Promise<Landing | null> {
  const root = VEHICLE_SLUG[vc];
  const T = VC_TITLE[vc];
  if (!root || !T || parts.length > 2) return null;
  const cat = await getCatalog();
  const crumbs: Crumb[] = [{ name: vc === "car" ? "Auto" : "Moto", href: `/${root}` }];
  if (!parts.length) {
    return { raw: { cat: "vehicle", vc }, path: `/${root}`, h1: T.all, title: T.all, about: vc === "car" ? "Lietoti un jauni auto no ss.com, autoplius.lt un citiem portāliem vienā meklētājā." : "Motocikli no visiem portāliem vienā meklētājā.", crumbs, facet: "make" };
  }
  const make = cat.makes.find((m) => m.slug === parts[0] && m.vehicleClass === vc);
  if (!make) return null;
  crumbs.push({ name: make.name, href: `/${root}/${make.slug}` });
  if (parts.length === 1) {
    const h1 = T.of(make.name);
    return { raw: { cat: "vehicle", vc, make: String(make.id) }, path: `/${root}/${make.slug}`, h1, title: h1, about: `${make.name} sludinājumi no visiem portāliem vienā vietā.`, crumbs, facet: "model" };
  }
  const model = cat.models.find((m) => m.makeId === make.id && m.slug === parts[1]);
  if (!model) return null;
  const name = `${make.name} ${model.name}`;
  crumbs.push({ name: model.name, href: `/${root}/${make.slug}/${model.slug}` });
  const h1 = T.of(name);
  return { raw: { cat: "vehicle", vc, make: String(make.id), model: String(model.id) }, path: `/${root}/${make.slug}/${model.slug}`, h1, title: h1, about: `${name} sludinājumi no visiem portāliem vienā vietā.`, crumbs, facet: null };
}

const typeBySlug = new Map(PROPERTY_TYPES.map((t) => [PROPERTY_SLUG[t], t] as const));

/** /ipasumi, /ipasumi/dzivokli, /ipasumi/dzivokli/riga, /ipasumi/dzivokli-ire/riga */
export async function resolveProperty(parts: string[]): Promise<Landing | null> {
  if (parts.length > 2) return null;
  const crumbs: Crumb[] = [{ name: "Īpašumi", href: "/ipasumi" }];
  if (!parts.length) {
    return { raw: { cat: "property" }, path: "/ipasumi", h1: "Nekustamais īpašums", title: "Nekustamais īpašums – dzīvokļi, mājas, zeme", about: "Dzīvokļi, mājas, zeme un komercīpašumi no visiem portāliem vienā meklētājā.", crumbs, facet: "ptype" };
  }
  const rent = parts[0].endsWith("-ire");
  const type = typeBySlug.get(rent ? parts[0].slice(0, -4) : parts[0]);
  if (!type) return null;
  const deal = rent ? "rent" : "sell";
  const plural = PROPERTY_PLURAL[type];
  const what = `${plural} ${rent ? "īrei" : "pārdošanā"}`;
  const typePath = propertyHref(type, deal);
  crumbs.push({ name: plural, href: propertyHref(type, "sell") });
  if (rent) crumbs.push({ name: "Īre", href: typePath });
  const other = { href: propertyHref(type, rent ? "sell" : "rent", null), label: rent ? `${plural} pārdošanā` : `${plural} īrei` };
  if (parts.length === 1) {
    return { raw: { cat: "property", ptype: type, deal }, path: typePath, h1: what, title: what, about: `${what} no visiem portāliem vienā vietā.`, crumbs, facet: "region", dealSwitch: other };
  }
  const cat = await getCatalog();
  const region = cat.regions.find((r) => r.slug === parts[1]);
  if (!region) return null;
  const loc = locative(region.name);
  const h1 = loc ? `${what} ${loc}` : `${what}: ${region.name}`;
  const path = `${typePath}/${region.slug}`;
  crumbs.push({ name: region.name, href: path });
  return {
    raw: { cat: "property", ptype: type, deal, loc: `r:${region.id}` },
    path, h1, title: h1, about: `${what} – ${region.name}. Sludinājumi no visiem portāliem vienā vietā.`, crumbs, facet: null,
    dealSwitch: { href: `${propertyHref(type, rent ? "sell" : "rent")}/${region.slug}`, label: rent ? `${plural} pārdošanā ${loc ?? region.name}` : `${plural} īrei ${loc ?? region.name}` },
  };
}
