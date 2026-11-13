// SEO lapas: tīras adreses meklētājiem (/auto/bmw/3-serija, /ipasumi/dzivokli/riga, /ipasumi/dzivokli-ire/riga).
// Katra adrese = noteikti meklēšanas filtri + savs virsraksts, apraksts un iekšējās saites.
// Meklēšanas lapas ar ?parametriem netiek indeksētas (noindex, follow); indeksējam šīs lapas.
import { and, asc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { BODY_TYPES, FUELS, PROPERTY_PLURAL, PROPERTY_SLUG, PROPERTY_TYPES, SEO_BODY_ROOT, SEO_FUEL_ROOT, SEO_PRICE_STEPS, SEO_ROOMS, VEHICLE_SLUG, type PropertyType, type VehicleClass } from "./constants";
import { formatPrice } from "./format";
import { LOCALES, type Locale, type T } from "@/i18n/core";
import { trTitle } from "@/i18n/content";

const { makes, models, regions, places } = schema;

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

/** Apkaimes forma latviski: Purvciems → Purvciemā, Centrs → Centrā, Pļavnieki → Pļavniekos, Šampēteris → Šampēterī, Teika → Teikā. */
export function areaLocative(name: string): string | null {
  if (/[^aeiouāēīū]is$/.test(name)) return name.replace(/is$/, "ī");
  if (/s$/.test(name) && !/[aeiouāēīū]s$/.test(name)) return name.replace(/s$/, "ā");
  if (/i$/.test(name)) return name.replace(/i$/, "os");
  return locative(name);
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
  /** valstspilsētu apkaimes (vietas bez veida pilsētas reģionā) */
  areas: { id: number; regionId: number; name: string; slug: string }[];
};
let catalog: { at: number; v: Promise<Catalog> } | null = null;
export function getCatalog(): Promise<Catalog> {
  if (catalog && catalog.at > Date.now() - 30 * 60_000) return catalog.v;
  const v = (async () => {
    const [m, mo, r, a] = await Promise.all([
      db.select({ id: makes.id, name: makes.name, vehicleClass: makes.vehicleClass }).from(makes),
      db.select({ id: models.id, makeId: models.makeId, name: models.name }).from(models),
      db.select({ id: regions.id, name: regions.name }).from(regions).where(eq(regions.country, "LV")).orderBy(asc(regions.id)),
      db.select({ id: places.id, regionId: places.regionId, name: places.name }).from(places).innerJoin(regions, eq(regions.id, places.regionId))
        .where(and(isNull(places.kind), eq(regions.kind, "city"), eq(regions.country, "LV"))),
    ]);
    return {
      makes: m.map((x) => ({ ...x, vehicleClass: String(x.vehicleClass), slug: seoSlug(x.name) })),
      models: mo.map((x) => ({ ...x, slug: seoSlug(x.name) })),
      regions: r.map((x) => ({ ...x, slug: seoSlug(x.name) })),
      areas: a.map((x) => ({ ...x, slug: seoSlug(x.name) })),
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
  /** papildu saišu grupas (cenas, degviela, virsbūve, pilsētas, istabas, apkaimes): no kuras lapas tās veidot */
  more?:
    | { kind: "vehicle"; vc: VehicleClass; base: string; level: "root" | "make" | "model"; raw: Record<string, string>; current?: string }
    | { kind: "property"; type: PropertyType; deal: string; base: string; regionId?: number; raw: Record<string, string>; current?: string };
};

// ---------- kombinētie filtri adresē ----------
export const priceSlug = (n: number) => `lidz-${n}`;
export const roomsSlug = (n: number) => (n === 1 ? "1-istabas" : `${n}-istabu`);
export const fuelSlug = (f: string) => seoSlug(f);
export const bodySlug = (b: string) => seoSlug(b);
/** Istabu filtrs: pēdējais solis nozīmē „un vairāk”. */
export const roomsRaw = (n: number): Record<string, string> => (n >= SEO_ROOMS[SEO_ROOMS.length - 1] ? { rmin: String(n) } : { rmin: String(n), rmax: String(n) });
export function roomsLabel(n: number, t: T) {
  return n === 1 ? t("1 istabas") : n >= SEO_ROOMS[SEO_ROOMS.length - 1] ? t("{n}+ istabu", { n }) : t("{n} istabu", { n });
}

type Tr = { t: T; locale: Locale };
export const RIGA_DISTRICT = { slug: "rigas-rajons", name: "Rīgas rajons" };

type VehicleFacet =
  | { kind: "price"; value: number; slug: string }
  | { kind: "fuel"; value: string; slug: string }
  | { kind: "body"; value: string; slug: string }
  | { kind: "region"; value: { id: number; name: string }; slug: string };

/** Pēdējā adreses daļa transporta lapā: lidz-5000, dizelis, universals, riga. */
function vehicleFacet(vc: VehicleClass, part: string, cat: Catalog): VehicleFacet | null {
  const pm = /^lidz-(\d+)$/.exec(part);
  if (pm && (SEO_PRICE_STEPS as readonly number[]).includes(Number(pm[1]))) return { kind: "price", value: Number(pm[1]), slug: part };
  const fuel = vc === "car" ? FUELS.find((f) => fuelSlug(f) === part) : undefined;
  if (fuel) return { kind: "fuel", value: fuel, slug: part };
  const body = BODY_TYPES[vc].find((b) => bodySlug(b) === part);
  if (body) return { kind: "body", value: body, slug: part };
  const region = cat.regions.find((r) => r.slug === part);
  if (region) return { kind: "region", value: region, slug: part };
  return null;
}

/** /auto, /auto/bmw, /auto/bmw/3-serija (un /moto/...), un katrā līmenī viens papildu filtrs: /auto/lidz-5000, /auto/bmw/dizelis, /auto/riga */
export async function resolveVehicle(vc: VehicleClass, parts: string[], { t, locale }: Tr): Promise<Landing | null> {
  const root = VEHICLE_SLUG[vc];
  if (!root || (vc !== "car" && vc !== "moto") || parts.length > 3) return null;
  const cat = await getCatalog();
  const crumbs: Crumb[] = [{ name: t(vc === "car" ? "Auto" : "Moto"), href: `/${root}` }];
  const of = (name: string) => (vc === "car" ? t("{name} pārdošanā", { name }) : t("{name} motocikli pārdošanā", { name }));
  const about = (name: string) => t("{name} sludinājumi no visiem portāliem vienā vietā.", { name });

  // marka un modelis (ja ir), pārējais — filtrs
  let i = 0;
  const make = parts[i] ? cat.makes.find((m) => m.slug === parts[i] && m.vehicleClass === vc) : undefined;
  if (make) i++;
  const model = make && parts[i] ? cat.models.find((m) => m.makeId === make.id && m.slug === parts[i]) : undefined;
  if (model) i++;
  const rest = parts.slice(i);
  if (rest.length > 1) return null;
  const facet = rest.length ? vehicleFacet(vc, rest[0], cat) : null;
  if (rest.length && !facet) return null;

  const raw: Record<string, string> = { cat: "vehicle", vc };
  let base = `/${root}`;
  let name: string | null = null;
  let level: "root" | "make" | "model" = "root";
  if (make) {
    raw.make = String(make.id);
    base += `/${make.slug}`;
    crumbs.push({ name: make.name, href: base });
    name = make.name;
    level = "make";
  }
  if (make && model) {
    const modelName = trTitle(model.name, t);
    raw.model = String(model.id);
    base += `/${model.slug}`;
    crumbs.push({ name: modelName, href: base });
    name = `${make.name} ${modelName}`;
    level = "model";
  }
  const baseH1 = name ? of(name) : t(vc === "car" ? "Lietotas automašīnas pārdošanā" : "Motocikli pārdošanā");
  const more = { kind: "vehicle" as const, vc, base, level, raw: { ...raw }, current: facet?.slug };
  if (!facet) {
    if (!make) return { raw, path: base, h1: baseH1, title: baseH1, about: t(vc === "car" ? "Lietoti un jauni auto no ss.com, autoplius.lt un citiem portāliem vienā meklētājā." : "Motocikli no visiem portāliem vienā meklētājā."), crumbs, facet: "make", more };
    return { raw, path: base, h1: baseH1, title: baseH1, about: about(name!), crumbs, facet: model ? null : "model", more };
  }

  let h1: string;
  let crumb: string;
  if (facet.kind === "price") {
    raw.pmax = String(facet.value);
    crumb = t("līdz {p}", { p: formatPrice(facet.value) });
    h1 = `${baseH1} ${crumb}`;
  } else if (facet.kind === "region") {
    raw.loc = `r:${facet.value.id}`;
    crumb = regionName(facet.value.name, locale);
    h1 = withPlace(baseH1, facet.value.name, locale);
  } else {
    raw[facet.kind] = facet.value;
    crumb = t(facet.value);
    const word = t(facet.value).toLocaleLowerCase(locale);
    if (vc === "moto") h1 = t("{name} motocikli pārdošanā", { name: name ? `${name} ${t(facet.value)}` : t(facet.value) });
    else if (!name) h1 = t("{what} pārdošanā", { what: t((facet.kind === "fuel" ? SEO_FUEL_ROOT : SEO_BODY_ROOT)[facet.value]) });
    else h1 = of(`${name} ${word}`);
  }
  const path = `${base}/${facet.slug}`;
  crumbs.push({ name: crumb, href: path });
  return { raw, path, h1, title: h1, about: about(h1), crumbs, facet: null, more };
}

const typeBySlug = new Map(PROPERTY_TYPES.map((t) => [PROPERTY_SLUG[t], t] as const));
const roomsBySlug = new Map(SEO_ROOMS.map((n) => [roomsSlug(n), n] as const));

/**
 * /ipasumi, /ipasumi/dzivokli, /ipasumi/dzivokli/riga, /ipasumi/dzivokli-ire/riga,
 * istabas: /ipasumi/dzivokli/3-istabu, /ipasumi/dzivokli/riga/3-istabu; apkaimes: /ipasumi/dzivokli/riga/purvciems
 */
export async function resolveProperty(parts: string[], { t, locale }: Tr): Promise<Landing | null> {
  if (parts.length > 3) return null;
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
  const flats = type === "Dzīvoklis";
  const roomsWhat = (n: number) => t(rent ? "{r} dzīvokļi īrei" : "{r} dzīvokļi pārdošanā", { r: roomsLabel(n, t) });
  crumbs.push({ name: plural, href: propertyHref(type, "sell") });
  if (rent) crumbs.push({ name: t("Īre"), href: typePath });
  const raw: Record<string, string> = { cat: "property", ptype: type, deal };
  if (parts.length === 1) {
    return { raw, path: typePath, h1: what, title: what, about: about(what), crumbs, facet: "region", dealSwitch: { href: propertyHref(type, rent ? "sell" : "rent"), label: whatOf(!rent) }, more: { kind: "property", type, deal, base: typePath, raw: { ...raw } } };
  }

  // /ipasumi/dzivokli/3-istabu (bez vietas)
  const rooms1 = flats ? roomsBySlug.get(parts[1]) : undefined;
  if (rooms1 != null) {
    if (parts.length > 2) return null;
    const h1 = roomsWhat(rooms1);
    const path = `${typePath}/${parts[1]}`;
    crumbs.push({ name: roomsLabel(rooms1, t), href: path });
    return { raw: { ...raw, ...roomsRaw(rooms1) }, path, h1, title: h1, about: about(h1), crumbs, facet: "region", more: { kind: "property", type, deal, base: typePath, raw: { ...raw }, current: parts[1] } };
  }

  const cat = await getCatalog();
  // "Rīgas rajons" (Pierīgas novadi) kā ss.com
  const region = parts[1] === RIGA_DISTRICT.slug ? { id: 0, name: RIGA_DISTRICT.name, slug: RIGA_DISTRICT.slug } : cat.regions.find((r) => r.slug === parts[1]);
  if (!region) return null;
  const regionPath = `${typePath}/${region.slug}`;
  const regionRaw = { ...raw, loc: region.id ? `r:${region.id}` : "g:pieriga" };
  crumbs.push({ name: regionName(region.name, locale), href: regionPath });
  const more = { kind: "property" as const, type, deal, base: regionPath, regionId: region.id || undefined, raw: { ...regionRaw }, current: parts[2] };
  const switchTo = (sub = "") => ({ href: `${propertyHref(type, rent ? "sell" : "rent")}/${region.slug}${sub}`, label: withPlace(whatOf(!rent), region.name, locale) });
  if (parts.length === 2) {
    const h1 = withPlace(what, region.name, locale);
    return { raw: regionRaw, path: regionPath, h1, title: h1, about: about(h1), crumbs, facet: null, dealSwitch: switchTo(), more };
  }

  // /ipasumi/dzivokli/riga/3-istabu
  const rooms = flats ? roomsBySlug.get(parts[2]) : undefined;
  if (rooms != null) {
    const h1 = withPlace(roomsWhat(rooms), region.name, locale);
    const path = `${regionPath}/${parts[2]}`;
    crumbs.push({ name: roomsLabel(rooms, t), href: path });
    return { raw: { ...regionRaw, ...roomsRaw(rooms) }, path, h1, title: h1, about: about(h1), crumbs, facet: null, more };
  }
  // /ipasumi/dzivokli/riga/purvciems
  const area = region.id ? cat.areas.find((a) => a.regionId === region.id && a.slug === parts[2]) : undefined;
  if (!area) return null;
  const loc = locale === "lv" ? areaLocative(area.name) : null;
  const h1 = loc ? `${what} ${loc}` : `${what}: ${area.name}, ${regionName(region.name, locale)}`;
  const path = `${regionPath}/${area.slug}`;
  crumbs.push({ name: area.name, href: path });
  return { raw: { ...raw, loc: `p:${area.id}` }, path, h1, title: locale === "lv" ? `${h1}, ${region.name}` : h1, about: about(h1), crumbs, facet: null, dealSwitch: switchTo(`/${area.slug}`), more };
}
