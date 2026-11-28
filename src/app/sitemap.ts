import type { MetadataRoute } from "next";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { PropertyType, VehicleClass } from "@/lib/constants";
import { appBase, langAlternates, propertyHref, RIGA_DISTRICT, vehicleHref } from "@/lib/seo";
import { REGION_GROUPS_LOC, SEO_COMBO_MIN, SEO_FACET_SAME, SEO_INDEX_MIN, SEO_PRICE_STEPS, SEO_ROOMS } from "@/lib/constants";
import { bodySlug, fuelSlug, getCatalog, priceSlug, roomsSlug, seoSlug } from "@/lib/seo";
import { LOCALES } from "@/i18n/core";
import { soft } from "@/lib/errors";

export const dynamic = "force-dynamic";
let memo: { at: number; v: MetadataRoute.Sitemap } | null = null;
/** SEO lapa sitemap iekļauta tikai, ja tajā ir vismaz tik sludinājumu (tukšas lapas meklētājiem nevajag). */
const MIN = SEO_INDEX_MIN;

/**
 * Galvenās lapas, SEO lapas (markas, modeļi, īpašumu veidi pa reģioniem) un pašu aktīvie sludinājumi.
 * lastmod: SEO lapām – jaunākā tajā esošā sludinājuma pievienošanas laiks, pašu sludinājumiem – pēdējās izmaiņas laiks.
 * Citu portālu sludinājumi sitemap nav apzināti: to lapas ir noindex (saturs pieder avotam), rangā kategoriju lapas.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (memo && memo.at > Date.now() - 3600_000) return memo.v;
  const b = appBase();
  const urls: { path: string; lastModified?: Date }[] = ["/darijumi", "/novertejums", "/cenu-karte", "/serijas", "/dati", "/vesture", "/par-mums", "/noteikumi", "/privatums"].map((path) => ({ path }));
  const add = (path: string, lm?: Date | string | null) => urls.push({ path, lastModified: lm ? new Date(lm) : undefined });
  // sludinājumu sarakstu lapas: jaunākā sludinājuma laiks pa kategorijām
  const latest = await db.execute<{ kind: string; vc: string | null; lm: string }>(sql`
    select kind, vehicle_class vc, max(created_at) lm from listings where status = 'active' group by 1, 2`).catch(soft("sitemap", { rows: [] }));
  const lmOf = (f: (r: { kind: string; vc: string | null }) => boolean) => latest.rows.filter(f).map((r) => r.lm).sort().pop() ?? null;
  const all = lmOf(() => true);
  for (const path of ["/", "/tirgus", "/cenu-kritumi"]) add(path, all);
  add("/auto", lmOf((r) => r.vc === "car"));
  add("/moto", lmOf((r) => r.vc === "moto"));
  add("/ipasumi", lmOf((r) => r.kind === "property"));
  /** vecāklapu sludinājumu skaits filtru lapām (SEO_FACET_SAME) */
  const parents = new Map<string, number>();

  try {
    const { reportMonths } = await import("@/lib/report");
    for (const m of await reportMonths()) if (m.n >= 500) add(`/parskati/${m.ym}`);
  } catch {}
  try {
    // vienā vaicājumā: skaiti pa markām/modeļiem un īpašumu veidiem/reģioniem
    const veh = await db.execute<{ vc: string; make: string; model: string | null; n: number; lm: string }>(sql`
      select l.vehicle_class as vc, mk.name as make, md.name as model, count(*)::int as n, max(l.created_at) as lm
      from listings l join makes mk on mk.id = l.make_id left join models md on md.id = l.model_id
      where l.status = 'active' and l.kind = 'vehicle' and l.vehicle_class in ('car', 'moto')
      group by 1, 2, 3`);
    const makeTotals = new Map<string, { n: number; lm: string }>();
    for (const r of veh.rows) {
      const k = `${r.vc}|${r.make}`, o = makeTotals.get(k);
      makeTotals.set(k, { n: (o?.n ?? 0) + Number(r.n), lm: o && o.lm > r.lm ? o.lm : r.lm });
      parents.set(`v|${r.vc}||`, (parents.get(`v|${r.vc}||`) ?? 0) + Number(r.n));
      if (r.model) parents.set(`v|${r.vc}|${r.make}|${r.model}`, Number(r.n));
    }
    for (const [k, { n }] of makeTotals) parents.set(`v|${k}|`, n);
    for (const [k, { n, lm }] of makeTotals) if (n >= MIN) { const [vc, make] = k.split("|"); add(vehicleHref(vc as VehicleClass, make)!, lm); }
    for (const r of veh.rows) if (r.model && Number(r.n) >= MIN) add(vehicleHref(r.vc as VehicleClass, r.make, r.model)!, r.lm);

    const prop = await db.execute<{ ptype: string; deal: string; region: string | null; rid: number | null; n: number; lm: string }>(sql`
      select l.property_type as ptype, l.deal, r.name as region, r.id as rid, count(*)::int as n, max(l.created_at) as lm
      from listings l left join places p on p.id = l.place_id left join regions r on r.id = p.region_id and r.country = 'LV'
      where l.status = 'active' and l.kind = 'property' and l.deal in ('sell', 'rent') and l.property_type is not null
      group by 1, 2, 3, 4`);
    const typeTotals = new Map<string, { n: number; lm: string }>();
    for (const r of prop.rows) {
      const k = `${r.ptype}|${r.deal}`, o = typeTotals.get(k);
      typeTotals.set(k, { n: (o?.n ?? 0) + Number(r.n), lm: o && o.lm > r.lm ? o.lm : r.lm });
      if (r.rid != null) parents.set(`p|${k}|${r.rid}`, Number(r.n));
    }
    for (const [k, { n }] of typeTotals) parents.set(`p|${k}|`, n);
    for (const [k, { n, lm }] of typeTotals) if (n >= MIN) { const [pt, deal] = k.split("|"); add(propertyHref(pt as PropertyType, deal), lm); }
    for (const r of prop.rows) if (r.region && Number(r.n) >= MIN) add(propertyHref(r.ptype as PropertyType, r.deal, r.region), r.lm);
    // Rīgas rajons (Pierīgas novadi kopā)
    const district = new Map<string, { n: number; lm: string }>();
    for (const r of prop.rows) if (r.region && REGION_GROUPS_LOC["g:pieriga"].includes(r.region)) {
      const k = `${r.ptype}|${r.deal}`, o = district.get(k);
      district.set(k, { n: (o?.n ?? 0) + Number(r.n), lm: o && o.lm > r.lm ? o.lm : r.lm });
    }
    for (const [k, { n, lm }] of district) if (n >= MIN) { const [pt, deal] = k.split("|"); add(`${propertyHref(pt as PropertyType, deal)}/${RIGA_DISTRICT.slug}`, lm); }
  } catch (err) {
    console.error("Sitemap SEO lapas neizdevās:", err);
  }
  try {
    await comboPages(add, parents);
  } catch (err) {
    console.error("Sitemap kombinētās SEO lapas neizdevās:", err);
  }

  const own = await db
    .select({ id: schema.listings.id, updatedAt: schema.listings.updatedAt })
    .from(schema.listings)
    .where(and(eq(schema.listings.source, "own"), eq(schema.listings.status, "active")))
    .orderBy(desc(schema.listings.updatedAt))
    .limit(10000)
    .catch(soft("sitemap", []));
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
 * Visu auto līmenī pietiek ar SEO_INDEX_MIN sludinājumiem, markas/modeļa kombinācijām vajag SEO_COMBO_MIN.
 */
async function comboPages(add: (path: string, lm?: string | null) => void, parents: Map<string, number>) {
  /** filtra lapa gandrīz sakrīt ar vecāklapu → tai canonical uz vecāklapu (landing-page.tsx), sitemap neliekam */
  const same = (n: number, parentKey: string) => { const p = parents.get(parentKey); return p != null && n >= p * SEO_FACET_SAME; };
  const cat = await getCatalog();
  const regionSlug = new Map(cat.regions.map((r) => [r.id, r.slug]));
  const steps = sql.raw(`array[${SEO_PRICE_STEPS.join(",")}]`);
  const veh = await db.execute<{ vc: string; make: string | null; model: string | null; dim: string; val: string; n: number; lm: string }>(sql`
    with v as (
      select l.vehicle_class vc, mk.name make, md.name model, l.fuel, l.body, l.price, p.region_id rid, l.created_at
      from listings l left join makes mk on mk.id = l.make_id left join models md on md.id = l.model_id
      left join places p on p.id = l.place_id
      where l.status = 'active' and l.kind = 'vehicle' and l.vehicle_class in ('car', 'moto'))
    select vc, null make, null model, 'fuel' dim, fuel val, count(*)::int n, max(created_at) lm from v where fuel is not null and vc = 'car' group by 1, 5
    union all select vc, null, null, 'body', body, count(*)::int, max(created_at) from v where body is not null group by 1, 5
    union all select vc, null, null, 'region', rid::text, count(*)::int, max(created_at) from v where rid is not null group by 1, 5
    union all select vc, null, null, 'price', s::text, count(*)::int, max(created_at) from v join unnest(${steps}) s on v.price > 0 and v.price <= s group by 1, 5
    union all select vc, make, null, 'fuel', fuel, count(*)::int, max(created_at) from v where make is not null and fuel is not null and vc = 'car' group by 1, 2, 5
    union all select vc, make, null, 'body', body, count(*)::int, max(created_at) from v where make is not null and body is not null group by 1, 2, 5
    union all select vc, make, null, 'region', rid::text, count(*)::int, max(created_at) from v where make is not null and rid is not null group by 1, 2, 5
    union all select vc, make, null, 'price', s::text, count(*)::int, max(created_at) from v join unnest(${steps}) s on v.price > 0 and v.price <= s where make is not null group by 1, 2, 5
    union all select vc, make, model, 'fuel', fuel, count(*)::int, max(created_at) from v where model is not null and fuel is not null and vc = 'car' group by 1, 2, 3, 5`);
  // cenu sliekšņi: tikai tie, kas pievieno sludinājumus salīdzinājumā ar iepriekšējo (citādi lapas ir vienādas)
  const priceN = new Map<string, number>();
  for (const r of veh.rows) if (r.dim === "price") priceN.set(`${r.vc}|${r.make}|${r.val}`, Number(r.n));
  for (const r of veh.rows) {
    const min = r.make ? SEO_COMBO_MIN : SEO_INDEX_MIN;
    if (Number(r.n) < min) continue;
    if (r.dim === "price") {
      const i = SEO_PRICE_STEPS.indexOf(Number(r.val) as (typeof SEO_PRICE_STEPS)[number]);
      if (i > 0 && (priceN.get(`${r.vc}|${r.make}|${SEO_PRICE_STEPS[i - 1]}`) ?? 0) >= Number(r.n)) continue;
    }
    const slug = r.dim === "fuel" ? fuelSlug(r.val) : r.dim === "body" ? bodySlug(r.val) : r.dim === "price" ? priceSlug(Number(r.val)) : regionSlug.get(Number(r.val));
    if (same(Number(r.n), `v|${r.vc}|${r.make ?? ""}|${r.model ?? ""}`)) continue;
    const base = vehicleHref(r.vc as VehicleClass, r.make, r.model);
    if (slug && base) add(`${base}/${slug}`, r.lm);
  }

  const rooms = sql.raw(`least(l.rooms, ${SEO_ROOMS[SEO_ROOMS.length - 1]})`);
  const prop = await db.execute<{ ptype: string; deal: string; rid: number | null; area: string | null; rooms: number | null; n: number; lm: string }>(sql`
    select 'Dzīvoklis' ptype, l.deal, null::int rid, null area, ${rooms}::int rooms, count(*)::int n, max(l.created_at) lm
      from listings l where l.status = 'active' and l.property_type = 'Dzīvoklis' and l.deal in ('sell', 'rent') and l.rooms >= 1 group by 2, 5
    union all select 'Dzīvoklis', l.deal, p.region_id, null, ${rooms}::int, count(*)::int, max(l.created_at)
      from listings l join places p on p.id = l.place_id join regions r on r.id = p.region_id and r.country = 'LV'
      where l.status = 'active' and l.property_type = 'Dzīvoklis' and l.deal in ('sell', 'rent') and l.rooms >= 1 group by 2, 3, 5
    union all select l.property_type, l.deal, p.region_id, p.name, null, count(*)::int, max(l.created_at)
      from listings l join places p on p.id = l.place_id join regions r on r.id = p.region_id and r.kind = 'city' and r.country = 'LV'
      where l.status = 'active' and l.kind = 'property' and l.deal in ('sell', 'rent') and l.property_type is not null and p.kind is null group by 1, 2, 3, 4`);
  for (const r of prop.rows) {
    if (Number(r.n) < SEO_INDEX_MIN) continue;
    const typePath = propertyHref(r.ptype as PropertyType, r.deal);
    const region = r.rid != null ? regionSlug.get(Number(r.rid)) : null;
    if (r.rid != null && !region) continue;
    if (same(Number(r.n), `p|${r.ptype}|${r.deal}|${r.rid ?? ""}`)) continue;
    if (r.rooms != null) add(`${typePath}${region ? `/${region}` : ""}/${roomsSlug(Number(r.rooms))}`, r.lm);
    else if (r.area && region) add(`${typePath}/${region}/${seoSlug(r.area)}`, r.lm);
  }
}
