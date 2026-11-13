import type { MetadataRoute } from "next";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { PropertyType, VehicleClass } from "@/lib/constants";
import { appBase, langAlternates, propertyHref, RIGA_DISTRICT, vehicleHref } from "@/lib/seo";
import { REGION_GROUPS_LOC, SEO_COMBO_MIN, SEO_PRICE_STEPS, SEO_ROOMS } from "@/lib/constants";
import { bodySlug, fuelSlug, getCatalog, priceSlug, roomsSlug, seoSlug } from "@/lib/seo";
import { LOCALES } from "@/i18n/core";

export const dynamic = "force-dynamic";
let memo: { at: number; v: MetadataRoute.Sitemap } | null = null;
/** SEO lapa sitemap iekļauta tikai, ja tajā ir vismaz tik sludinājumu (tukšas lapas meklētājiem nevajag). */
const MIN = 3;

/** Galvenās lapas, SEO lapas (markas, modeļi, īpašumu veidi pa reģioniem) un pašu aktīvie sludinājumi. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (memo && memo.at > Date.now() - 3600_000) return memo.v;
  const b = appBase();
  const urls: { path: string; lastModified?: Date }[] = ["/", "/auto", "/moto", "/ipasumi", "/tirgus", "/cenu-kritumi", "/darijumi", "/novertejums", "/cenu-karte", "/dati", "/vesture", "/par-mums", "/noteikumi", "/privatums"].map((path) => ({ path }));
  const add = (path: string) => urls.push({ path });

  try {
    const { reportMonths } = await import("@/lib/report");
    for (const m of await reportMonths()) if (m.n >= 500) add(`/parskati/${m.ym}`);
  } catch {}
  try {
    // vienā vaicājumā: skaiti pa markām/modeļiem un īpašumu veidiem/reģioniem
    const veh = await db.execute<{ vc: string; make: string; model: string | null; n: number }>(sql`
      select l.vehicle_class as vc, mk.name as make, md.name as model, count(*)::int as n
      from listings l join makes mk on mk.id = l.make_id left join models md on md.id = l.model_id
      where l.status = 'active' and l.kind = 'vehicle' and l.vehicle_class in ('car', 'moto')
      group by 1, 2, 3`);
    const makeTotals = new Map<string, number>();
    for (const r of veh.rows) makeTotals.set(`${r.vc}|${r.make}`, (makeTotals.get(`${r.vc}|${r.make}`) ?? 0) + Number(r.n));
    for (const [k, n] of makeTotals) if (n >= MIN) { const [vc, make] = k.split("|"); add(vehicleHref(vc as VehicleClass, make)!); }
    for (const r of veh.rows) if (r.model && Number(r.n) >= MIN) add(vehicleHref(r.vc as VehicleClass, r.make, r.model)!);

    const prop = await db.execute<{ ptype: string; deal: string; region: string | null; n: number }>(sql`
      select l.property_type as ptype, l.deal, r.name as region, count(*)::int as n
      from listings l left join places p on p.id = l.place_id left join regions r on r.id = p.region_id and r.country = 'LV'
      where l.status = 'active' and l.kind = 'property' and l.deal in ('sell', 'rent') and l.property_type is not null
      group by 1, 2, 3`);
    const typeTotals = new Map<string, number>();
    for (const r of prop.rows) typeTotals.set(`${r.ptype}|${r.deal}`, (typeTotals.get(`${r.ptype}|${r.deal}`) ?? 0) + Number(r.n));
    for (const [k, n] of typeTotals) if (n >= MIN) { const [pt, deal] = k.split("|"); add(propertyHref(pt as PropertyType, deal)); }
    for (const r of prop.rows) if (r.region && Number(r.n) >= MIN) add(propertyHref(r.ptype as PropertyType, r.deal, r.region));
    // Rīgas rajons (Pierīgas novadi kopā)
    const district = new Map<string, number>();
    for (const r of prop.rows) if (r.region && REGION_GROUPS_LOC["g:pieriga"].includes(r.region)) district.set(`${r.ptype}|${r.deal}`, (district.get(`${r.ptype}|${r.deal}`) ?? 0) + Number(r.n));
    for (const [k, n] of district) if (n >= MIN) { const [pt, deal] = k.split("|"); add(`${propertyHref(pt as PropertyType, deal)}/${RIGA_DISTRICT.slug}`); }
  } catch (err) {
    console.error("Sitemap SEO lapas neizdevās:", err);
  }
  try {
    await comboPages(add);
  } catch (err) {
    console.error("Sitemap kombinētās SEO lapas neizdevās:", err);
  }

  const own = await db
    .select({ id: schema.listings.id, updatedAt: schema.listings.updatedAt })
    .from(schema.listings)
    .where(and(eq(schema.listings.source, "own"), eq(schema.listings.status, "active")))
    .orderBy(desc(schema.listings.updatedAt))
    .limit(10000)
    .catch(() => []);
  for (const l of own) urls.push({ path: `/sludinajumi/${l.id}`, lastModified: l.updatedAt });
  // katra lapa visās valodās ar hreflang norādēm
  const v: MetadataRoute.Sitemap = urls.flatMap(({ path, lastModified }) => {
    const alt = langAlternates(path, "lv").languages;
    const languages = Object.fromEntries(Object.entries(alt).filter(([k]) => k !== "x-default").map(([k, u]) => [k, `${b}${u}`]));
    return LOCALES.map((l) => ({ url: `${b}${langAlternates(path, l).canonical}`, lastModified, changeFrequency: "daily" as const, alternates: { languages } }));
  });
  if (urls.length > 11) memo = { at: Date.now(), v };
  return v;
}

/**
 * Kombinētās SEO lapas: auto pēc cenas/degvielas/virsbūves/pilsētas (visiem un markām), modeļi pēc degvielas,
 * dzīvokļi pēc istabām (visā Latvijā un pa reģioniem) un īpašumi pa valstspilsētu apkaimēm.
 * Visu auto līmenī pietiek ar 3 sludinājumiem, markas/modeļa kombinācijām vajag SEO_COMBO_MIN.
 */
async function comboPages(add: (path: string) => void) {
  const cat = await getCatalog();
  const regionSlug = new Map(cat.regions.map((r) => [r.id, r.slug]));
  const steps = sql.raw(`array[${SEO_PRICE_STEPS.join(",")}]`);
  const veh = await db.execute<{ vc: string; make: string | null; model: string | null; dim: string; val: string; n: number }>(sql`
    with v as (
      select l.vehicle_class vc, mk.name make, md.name model, l.fuel, l.body, l.price, p.region_id rid
      from listings l left join makes mk on mk.id = l.make_id left join models md on md.id = l.model_id
      left join places p on p.id = l.place_id
      where l.status = 'active' and l.kind = 'vehicle' and l.vehicle_class in ('car', 'moto'))
    select vc, null make, null model, 'fuel' dim, fuel val, count(*)::int n from v where fuel is not null and vc = 'car' group by 1, 5
    union all select vc, null, null, 'body', body, count(*)::int from v where body is not null group by 1, 5
    union all select vc, null, null, 'region', rid::text, count(*)::int from v where rid is not null group by 1, 5
    union all select vc, null, null, 'price', s::text, count(*)::int from v join unnest(${steps}) s on v.price > 0 and v.price <= s group by 1, 5
    union all select vc, make, null, 'fuel', fuel, count(*)::int from v where make is not null and fuel is not null and vc = 'car' group by 1, 2, 5
    union all select vc, make, null, 'body', body, count(*)::int from v where make is not null and body is not null group by 1, 2, 5
    union all select vc, make, null, 'region', rid::text, count(*)::int from v where make is not null and rid is not null group by 1, 2, 5
    union all select vc, make, null, 'price', s::text, count(*)::int from v join unnest(${steps}) s on v.price > 0 and v.price <= s where make is not null group by 1, 2, 5
    union all select vc, make, model, 'fuel', fuel, count(*)::int from v where model is not null and fuel is not null and vc = 'car' group by 1, 2, 3, 5`);
  // cenu sliekšņi: tikai tie, kas pievieno sludinājumus salīdzinājumā ar iepriekšējo (citādi lapas ir vienādas)
  const priceN = new Map<string, number>();
  for (const r of veh.rows) if (r.dim === "price") priceN.set(`${r.vc}|${r.make}|${r.val}`, Number(r.n));
  for (const r of veh.rows) {
    const min = r.make ? SEO_COMBO_MIN : 3;
    if (Number(r.n) < min) continue;
    if (r.dim === "price") {
      const i = SEO_PRICE_STEPS.indexOf(Number(r.val) as (typeof SEO_PRICE_STEPS)[number]);
      if (i > 0 && (priceN.get(`${r.vc}|${r.make}|${SEO_PRICE_STEPS[i - 1]}`) ?? 0) >= Number(r.n)) continue;
    }
    const slug = r.dim === "fuel" ? fuelSlug(r.val) : r.dim === "body" ? bodySlug(r.val) : r.dim === "price" ? priceSlug(Number(r.val)) : regionSlug.get(Number(r.val));
    const base = vehicleHref(r.vc as VehicleClass, r.make, r.model);
    if (slug && base) add(`${base}/${slug}`);
  }

  const rooms = sql.raw(`least(l.rooms, ${SEO_ROOMS[SEO_ROOMS.length - 1]})`);
  const prop = await db.execute<{ ptype: string; deal: string; rid: number | null; area: string | null; rooms: number | null; n: number }>(sql`
    select 'Dzīvoklis' ptype, l.deal, null::int rid, null area, ${rooms}::int rooms, count(*)::int n
      from listings l where l.status = 'active' and l.property_type = 'Dzīvoklis' and l.deal in ('sell', 'rent') and l.rooms >= 1 group by 2, 5
    union all select 'Dzīvoklis', l.deal, p.region_id, null, ${rooms}::int, count(*)::int
      from listings l join places p on p.id = l.place_id join regions r on r.id = p.region_id and r.country = 'LV'
      where l.status = 'active' and l.property_type = 'Dzīvoklis' and l.deal in ('sell', 'rent') and l.rooms >= 1 group by 2, 3, 5
    union all select l.property_type, l.deal, p.region_id, p.name, null, count(*)::int
      from listings l join places p on p.id = l.place_id join regions r on r.id = p.region_id and r.kind = 'city' and r.country = 'LV'
      where l.status = 'active' and l.kind = 'property' and l.deal in ('sell', 'rent') and l.property_type is not null and p.kind is null group by 1, 2, 3, 4`);
  for (const r of prop.rows) {
    if (Number(r.n) < 3) continue;
    const typePath = propertyHref(r.ptype as PropertyType, r.deal);
    const region = r.rid != null ? regionSlug.get(Number(r.rid)) : null;
    if (r.rid != null && !region) continue;
    if (r.rooms != null) add(`${typePath}${region ? `/${region}` : ""}/${roomsSlug(Number(r.rooms))}`);
    else if (r.area && region) add(`${typePath}/${region}/${seoSlug(r.area)}`);
  }
}
