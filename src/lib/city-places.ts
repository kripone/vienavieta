// Pilsētu apkaimes pēc koordinātām un „tikai pilsēta” bez apkaimes (lietotājs 2026-11-27).
// Noteikums: apkaimes nosaukums ir tikai tad, ja sludinājuma koordinātas ir šīs apkaimes oficiālajās robežās
// (Rīgai – data/riga-apkaimes.json, 58 apkaimes). Ja koordinātu nav vai tās ārpus visām robežām – tikai pilsēta
// (vieta ar kind = "city"), nekad „Centrs” kā rezerve. Citu pilsētu apkaimēm robežu nav: tur paliek portāla
// norādītā apkaime, bet „tikai pilsēta” vairs netiek pārvērsta par „Centrs”.
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import apkaimes from "../../data/riga-apkaimes.json";
import { loadCtx } from "./importers/ss-pages";

const { listings, places, regions } = schema;

type Area = { name: string; lat: number; lon: number; rings: [number, number][][] };
const AREAS = apkaimes as Area[];

function inRing(lon: number, lat: number, ring: [number, number][]) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Rīgas apkaime, kuras robežās ir punkts (null – ārpus Rīgas apkaimēm). */
export function rigaArea(lat: number, lon: number): string | null {
  for (const a of AREAS) if (a.rings.some((r) => inRing(lon, lat, r))) return a.name;
  return null;
}

/** Katrai valstspilsētai vieta „tikai pilsēta” (kind = "city"); Rīgai arī visas 58 apkaimes. Droši palaist atkārtoti. */
export async function ensureCityPlaces() {
  const cities = await db.select({ id: regions.id, name: regions.name }).from(regions).where(eq(regions.kind, "city"));
  for (const c of cities) {
    const [avg] = await db.select({ lat: sql<number>`avg(${places.lat})::float8`, lon: sql<number>`avg(${places.lon})::float8` }).from(places).where(eq(places.regionId, c.id));
    if (avg?.lat == null) continue;
    await db.insert(places).values({ regionId: c.id, name: c.name, kind: "city", lat: avg.lat, lon: avg.lon }).onConflictDoNothing();
    if (c.name === "Rīga") {
      await db.insert(places).values(AREAS.map((a) => ({ regionId: c.id, name: a.name, lat: a.lat, lon: a.lon }))).onConflictDoNothing();
    }
  }
}

/**
 * Sakārto vietas:
 * 1) Rīgā ar precīzām (ielas) koordinātām – apkaime pēc robežām; ārpus robežām – „Rīga”.
 * 2) Valstspilsētās „Centrs” bez precīzām koordinātām, kas bija tikai rezerve „pilsēta bez apkaimes”
 *    (transports, saloni, portāli bez apkaimes; ss.com bez /centre/ adresē) – „tikai pilsēta”.
 */
export async function fixCityPlaces() {
  await ensureCityPlaces();
  const cityRows = await db
    .select({ id: places.id, name: places.name, kind: places.kind, regionId: places.regionId, region: regions.name })
    .from(places).innerJoin(regions, eq(places.regionId, regions.id))
    .where(eq(regions.kind, "city"));
  const cityPlace = new Map(cityRows.filter((p) => p.kind === "city").map((p) => [p.regionId, p]));
  const rigaId = cityRows.find((p) => p.region === "Rīga")?.regionId;
  const rigaByName = new Map(cityRows.filter((p) => p.regionId === rigaId && p.kind !== "city").map((p) => [p.name, p]));
  const nameById = new Map(cityRows.map((p) => [p.id, p.name]));
  let moved = 0;

  /** Pārvieto sludinājumus uz `to` (pa 500); ģenerētā virsraksta beigās vecās vietas nosaukumu aizstāj ar jauno. */
  const move = async (ids: { id: string; title: string; from: number }[], to: { id: number; name: string }) => {
    const byFrom = new Map<number, string[]>();
    for (const r of ids) byFrom.set(r.from, [...(byFrom.get(r.from) ?? []), r.id]);
    for (const [from, list] of byFrom) {
      const old = nameById.get(from) ?? "";
      for (let i = 0; i < list.length; i += 500) {
        const chunk = list.slice(i, i + 500);
        await db.update(listings).set({
          placeId: to.id,
          // skaitļi kā int (parametru tipu Postgres pats nenosaka: „-$3” neder)
          title: old ? sql`case when right(${listings.title}, ${old.length + 2}::int) = ${`, ${old}`}::text then left(${listings.title}, ${-old.length}::int) || ${to.name}::text else ${listings.title} end` : sql`${listings.title}`,
        }).where(inArray(listings.id, chunk));
        moved += chunk.length;
      }
    }
  };

  // 1) Rīga: precīzas koordinātas → apkaime pēc robežām
  if (rigaId) {
    const rigaPlaceIds = cityRows.filter((p) => p.regionId === rigaId).map((p) => p.id);
    const rows = await db
      .select({ id: listings.id, title: listings.title, placeId: listings.placeId, lat: listings.lat, lon: listings.lon })
      .from(listings)
      .where(and(inArray(listings.placeId, rigaPlaceIds), eq(listings.geoPrecision, "street"), sql`${listings.status} <> 'deleted'`, sql`${listings.lat} is not null`));
    const groups = new Map<number, { id: string; title: string; from: number }[]>();
    for (const r of rows) {
      const name = rigaArea(r.lat!, r.lon!);
      const target = name ? rigaByName.get(name) : cityPlace.get(rigaId);
      if (!target || target.id === r.placeId) continue;
      groups.set(target.id, [...(groups.get(target.id) ?? []), { id: r.id, title: r.title, from: r.placeId! }]);
    }
    for (const [to, ids] of groups) await move(ids, { id: to, name: nameById.get(to)! });
  }

  // 2) „Centrs” kā rezerve bez precīzām koordinātām → tikai pilsēta
  const centres = cityRows.filter((p) => p.name === "Centrs" || p.name === "Centras");
  for (const c of centres) {
    const city = cityPlace.get(c.regionId);
    if (!city) continue;
    const rows = await db
      .select({ id: listings.id, title: listings.title })
      .from(listings)
      .where(and(
        eq(listings.placeId, c.id),
        sql`${listings.status} <> 'deleted'`,
        sql`coalesce(${listings.geoPrecision}, '') <> 'street'`,
        sql`${listings.source} <> 'own'`, // pašu sludinājumos vietu izvēlējies pārdevējs
        // ss.com īpašumi ar apkaimi adresē (…/riga/centre/…) ir īsta „Centrs” norāde
        sql`not (${listings.source} = 'ss.com' and ${listings.kind} = 'property' and ${listings.externalUrl} like '%/centre/%')`,
      ));
    await move(rows.map((r) => ({ ...r, from: c.id })), city);
  }
  // 3) ss.com īpašumi valstspilsētās bez precīzām koordinātām: apkaime no ss.com adreses pēc jaunajiem aizstājvārdiem
  //    (…/riga/mezhciems/… → Mežciems); nezināma apkaime (…/jurmala/valteri/…, …/riga/other/…) → tikai pilsēta
  const ctx = await loadCtx();
  const cityRegionIds = [...new Set(cityRows.map((p) => p.regionId))];
  const ssRows = await db
    .select({ id: listings.id, title: listings.title, placeId: listings.placeId, url: listings.externalUrl })
    .from(listings).innerJoin(places, eq(listings.placeId, places.id))
    .where(and(eq(listings.source, "ss.com"), eq(listings.kind, "property"), sql`${listings.status} <> 'deleted'`,
      sql`coalesce(${listings.geoPrecision}, '') <> 'street'`, inArray(places.regionId, cityRegionIds), sql`${listings.externalUrl} is not null`));
  const regionOf = new Map(cityRows.map((p) => [p.id, p.regionId]));
  const ssMoves = new Map<number, { id: string; title: string; from: number }[]>();
  for (const r of ssRows) {
    let found: { id: number; name: string } | null = null;
    try { found = ctx.findPlace(r.url!, r.url!.includes("/premises/") ? 3 : 2); } catch { continue; }
    const region = regionOf.get(r.placeId!);
    const target = found && regionOf.get(found.id) === region ? found : region != null ? cityPlace.get(region) ?? null : null;
    if (!target || target.id === r.placeId) continue;
    ssMoves.set(target.id, [...(ssMoves.get(target.id) ?? []), { id: r.id, title: r.title, from: r.placeId! }]);
  }
  for (const [to, list] of ssMoves) await move(list, { id: to, name: nameById.get(to)! });
  return { moved };
}
