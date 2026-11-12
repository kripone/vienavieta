import type { MetadataRoute } from "next";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { PropertyType, VehicleClass } from "@/lib/constants";
import { appBase, langAlternates, propertyHref, RIGA_DISTRICT, vehicleHref } from "@/lib/seo";
import { REGION_GROUPS_LOC } from "@/lib/constants";
import { LOCALES } from "@/i18n/core";

export const dynamic = "force-dynamic";
let memo: { at: number; v: MetadataRoute.Sitemap } | null = null;
/** SEO lapa sitemap iekļauta tikai, ja tajā ir vismaz tik sludinājumu (tukšas lapas meklētājiem nevajag). */
const MIN = 3;

/** Galvenās lapas, SEO lapas (markas, modeļi, īpašumu veidi pa reģioniem) un pašu aktīvie sludinājumi. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (memo && memo.at > Date.now() - 3600_000) return memo.v;
  const b = appBase();
  const urls: { path: string; lastModified?: Date }[] = ["/", "/auto", "/moto", "/ipasumi", "/tirgus", "/cenu-kritumi", "/darijumi", "/novertejums", "/cenu-karte", "/vesture", "/par-mums", "/noteikumi", "/privatums"].map((path) => ({ path }));
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
