// SEO lapas: tīras adreses meklētājiem (/auto/bmw/3-serija, /ipasumi/dzivokli/riga, /ipasumi/dzivokli-ire/riga).
// Katra adrese = noteikti meklēšanas filtri + savs virsraksts, apraksts un iekšējās saites.
// Meklēšanas lapas ar ?parametriem netiek indeksētas (noindex, follow); indeksējam šīs lapas.
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { PROPERTY_PLURAL, PROPERTY_SLUG, PROPERTY_TYPES, VEHICLE_SLUG, type PropertyType, type VehicleClass } from "./constants";
import { LOCALES, type Locale, type T } from "@/i18n/core";
import { trTitle } from "@/i18n/content";

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
  if (/ rajons$/.test(name)) return name.replace(/ rajons$/, " rajonā");
  if (/pils$/.test(name)) return name.replace(/pils$/, "pilī");
  if (/a$/.test(name)) return name.replace(/a$/, "ā");
  if (/e$/.test(name)) return name.replace(/e$/, "ē");
  return null;
}

/** Lielāko pilsētu nosaukumi un "kur" forma citās valodās; pārējiem rādām latvisko nosaukumu. */
const REGION_I18N: Record<string, Partial<Record<Exclude<Locale, "lv">, [string, string]>>> = {
  "Rīgas rajons": { en: ["Riga district", "in Riga district"], ru: ["Рижский район", "в Рижском районе"], lt: ["Rygos rajonas", "Rygos rajone"] },
  "Rīga": { en: ["Riga", "in Riga"], ru: ["Рига", "в Риге"], lt: ["Ryga", "Rygoje"] },
  "Jūrmala": { en: ["Jurmala", "in Jurmala"], ru: ["Юрмала", "в Юрмале"], lt: ["Jūrmala", "Jūrmaloje"] },
  "Daugavpils": { en: ["Daugavpils", "in Daugavpils"], ru: ["Даугавпилс", "в Даугавпилсе"], lt: ["Daugpilis", "Daugpilyje"] },
  "Jelgava": { en: ["Jelgava", "in Jelgava"], ru: ["Елгава", "в Елгаве"], lt: ["Jelgava", "Jelgavoje"] },
  "Liepāja": { en: ["Liepaja", "in Liepaja"], ru: ["Лиепая", "в Лиепае"], lt: ["Liepoja", "Liepojoje"] },
  "Rēzekne": { en: ["Rezekne", "in Rezekne"], ru: ["Резекне", "в Резекне"], lt: ["Rėzeknė", "Rėzeknėje"] },
  "Ventspils": { en: ["Ventspils", "in Ventspils"], ru: ["Вентспилс", "в Вентспилсе"], lt: ["Ventspilis", "Ventspilyje"] },
};
/** Reģiona nosaukums lietotāja valodā. */
export const regionName = (name: string, locale: Locale) => (locale === "lv" ? name : REGION_I18N[name]?.[locale]?.[0] ?? name);
/** "Dzīvokļi pārdošanā" + Rīga → "Dzīvokļi pārdošanā Rīgā" / "Apartments for sale in Riga" / "Квартиры на продажу в Риге". */
export function withPlace(what: string, region: string, locale: Locale) {
  if (locale === "lv") {
    const loc = locative(region);
    return loc ? `${what} ${loc}` : `${what}: ${region}`;
  }
  const f = REGION_I18N[region]?.[locale];
  return f ? `${what} ${f[1]}` : `${what}: ${region}`;
}

/** hreflang un canonical: lapa latviski bez prefiksa, citās valodās /en, /ru, /lt. */
export function langAlternates(path: string, locale: Locale) {
  const at = (l: Locale) => (l === "lv" ? path : path === "/" ? `/${l}` : `/${l}${path}`);
  return {
    canonical: at(locale),
    languages: { ...Object.fromEntries(LOCALES.map((l) => [l, at(l)])), "x-default": path } as Record<string, string>,
  };
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

type Tr = { t: T; locale: Locale };
export const RIGA_DISTRICT = { slug: "rigas-rajons", name: "Rīgas rajons" };

/** /auto, /auto/bmw, /auto/bmw/3-serija (un /moto/...) */
export async function resolveVehicle(vc: VehicleClass, parts: string[], { t, locale }: Tr): Promise<Landing | null> {
  const root = VEHICLE_SLUG[vc];
  if (!root || (vc !== "car" && vc !== "moto") || parts.length > 2) return null;
  const cat = await getCatalog();
  const crumbs: Crumb[] = [{ name: t(vc === "car" ? "Auto" : "Moto"), href: `/${root}` }];
  const of = (name: string) => (vc === "car" ? t("{name} pārdošanā", { name }) : t("{name} motocikli pārdošanā", { name }));
  const about = (name: string) => t("{name} sludinājumi no visiem portāliem vienā vietā.", { name });
  if (!parts.length) {
    const h1 = t(vc === "car" ? "Lietotas automašīnas pārdošanā" : "Motocikli pārdošanā");
    return { raw: { cat: "vehicle", vc }, path: `/${root}`, h1, title: h1, about: t(vc === "car" ? "Lietoti un jauni auto no ss.com, autoplius.lt un citiem portāliem vienā meklētājā." : "Motocikli no visiem portāliem vienā meklētājā."), crumbs, facet: "make" };
  }
  const make = cat.makes.find((m) => m.slug === parts[0] && m.vehicleClass === vc);
  if (!make) return null;
  crumbs.push({ name: make.name, href: `/${root}/${make.slug}` });
  if (parts.length === 1) {
    const h1 = of(make.name);
    return { raw: { cat: "vehicle", vc, make: String(make.id) }, path: `/${root}/${make.slug}`, h1, title: h1, about: about(make.name), crumbs, facet: "model" };
  }
  const model = cat.models.find((m) => m.makeId === make.id && m.slug === parts[1]);
  if (!model) return null;
  const modelName = trTitle(model.name, t);
  const name = `${make.name} ${modelName}`;
  crumbs.push({ name: modelName, href: `/${root}/${make.slug}/${model.slug}` });
  const h1 = of(name);
  return { raw: { cat: "vehicle", vc, make: String(make.id), model: String(model.id) }, path: `/${root}/${make.slug}/${model.slug}`, h1, title: h1, about: about(name), crumbs, facet: null };
}

const typeBySlug = new Map(PROPERTY_TYPES.map((t) => [PROPERTY_SLUG[t], t] as const));

/** /ipasumi, /ipasumi/dzivokli, /ipasumi/dzivokli/riga, /ipasumi/dzivokli-ire/riga */
export async function resolveProperty(parts: string[], { t, locale }: Tr): Promise<Landing | null> {
  if (parts.length > 2) return null;
  const crumbs: Crumb[] = [{ name: t("Īpašumi"), href: "/ipasumi" }];
  if (!parts.length) {
    return { raw: { cat: "property" }, path: "/ipasumi", h1: t("Nekustamais īpašums"), title: t("Nekustamais īpašums – dzīvokļi, mājas, zeme"), about: t("Dzīvokļi, mājas, zeme un komercīpašumi no visiem portāliem vienā meklētājā."), crumbs, facet: "ptype" };
  }
  const rent = parts[0].endsWith("-ire");
  const type = typeBySlug.get(rent ? parts[0].slice(0, -4) : parts[0]);
  if (!type) return null;
  const deal = rent ? "rent" : "sell";
  const plural = t(PROPERTY_PLURAL[type]);
  const whatOf = (r: boolean) => t(r ? "{what} īrei" : "{what} pārdošanā", { what: plural });
  const what = whatOf(rent);
  const typePath = propertyHref(type, deal);
  const about = (x: string) => t("{name} sludinājumi no visiem portāliem vienā vietā.", { name: x });
  crumbs.push({ name: plural, href: propertyHref(type, "sell") });
  if (rent) crumbs.push({ name: t("Īre"), href: typePath });
  if (parts.length === 1) {
    return { raw: { cat: "property", ptype: type, deal }, path: typePath, h1: what, title: what, about: about(what), crumbs, facet: "region", dealSwitch: { href: propertyHref(type, rent ? "sell" : "rent"), label: whatOf(!rent) } };
  }
  const cat = await getCatalog();
  // "Rīgas rajons" (Pierīgas novadi) kā ss.com
  const region = parts[1] === RIGA_DISTRICT.slug ? { id: 0, name: RIGA_DISTRICT.name, slug: RIGA_DISTRICT.slug } : cat.regions.find((r) => r.slug === parts[1]);
  if (!region) return null;
  const h1 = withPlace(what, region.name, locale);
  const path = `${typePath}/${region.slug}`;
  crumbs.push({ name: regionName(region.name, locale), href: path });
  return {
    raw: { cat: "property", ptype: type, deal, loc: region.id ? `r:${region.id}` : "g:pieriga" },
    path, h1, title: h1, about: about(h1), crumbs, facet: null,
    dealSwitch: { href: `${propertyHref(type, rent ? "sell" : "rent")}/${region.slug}`, label: withPlace(whatOf(!rent), region.name, locale) },
  };
}
