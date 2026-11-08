import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import catalog from "../../data/vehicle-catalog.json";
import locations from "../../data/locations.json";
import placesLv from "../../data/places-lv.json";
import { eq, inArray, sql } from "drizzle-orm";
import * as schema from "./schema";
import type { VehicleClass } from "../lib/constants";

const POPULAR: Record<VehicleClass, string[]> = {
  car: ["Volkswagen", "BMW", "Audi", "Mercedes-Benz", "Toyota", "Škoda", "Volvo", "Ford", "Opel", "Renault", "Peugeot", "Nissan", "Kia", "Hyundai", "Tesla"],
  moto: ["Honda", "Yamaha", "BMW", "KTM", "Kawasaki", "Suzuki", "Harley-Davidson", "Ducati"],
  camper: ["Hymer", "Knaus", "Adria", "Dethleffs", "Bürstner", "Volkswagen"],
  van: ["Volkswagen", "Mercedes-Benz", "Ford", "Renault", "Peugeot", "Citroën", "Fiat", "Toyota"],
  truck: ["Volvo", "Scania", "Mercedes-Benz", "MAN", "DAF", "Iveco"],
};

type Db = NodePgDatabase<typeof schema>;

/** Vietas un katalogs. Droši palaist atkārtoti: esošie ieraksti netiek dublēti. */
export async function seedReference(db: Db) {
  for (const r of locations as { name: string; kind: "city" | "municipality"; country: "LV" | "LT"; places: { name: string; lat: number; lon: number }[] }[]) {
    const [region] = await db
      .insert(schema.regions)
      .values({ name: r.name, kind: r.kind, country: r.country })
      .onConflictDoUpdate({ target: schema.regions.name, set: { kind: r.kind, country: r.country } })
      .returning({ id: schema.regions.id });
    await db
      .insert(schema.places)
      .values(r.places.map((p) => ({ regionId: region.id, name: p.name, lat: p.lat, lon: p.lon })))
      .onConflictDoNothing();
  }

  await seedPlacesLv(db);

  for (const [vc, makes] of Object.entries(catalog as Record<VehicleClass, Record<string, string[]>>)) {
    const cls = vc as VehicleClass;
    for (const [makeName, modelNames] of Object.entries(makes)) {
      const [make] = await db
        .insert(schema.makes)
        .values({ vehicleClass: cls, name: makeName, popular: POPULAR[cls].includes(makeName) })
        .onConflictDoUpdate({
          target: [schema.makes.vehicleClass, schema.makes.name],
          set: { popular: POPULAR[cls].includes(makeName) },
        })
        .returning({ id: schema.makes.id });
      await db
        .insert(schema.models)
        .values(modelNames.map((name) => ({ makeId: make.id, name })))
        .onConflictDoNothing();
    }
  }
}

type Pt = { code: string; name: string; lat: number; lon: number };
type NovadsData = { region: string; towns: Pt[]; parishes: (Pt & { villages: Pt[] })[] };
/** Datu versija (VZD adrešu reģistra atvērtie dati); mainot data/places-lv.json, palielini. */
const PLACES_LV_VERSION = "seed:places-lv:2026-11-07";

/**
 * Latvijas pilsētas, pagasti un ciemi no VZD adrešu reģistra (data/places-lv.json, scripts/build-places.py).
 * Esošās vietas ar tādu pašu nosaukumu novadā tiek papildinātas (veids, kods, koordinātas), nevis dublētas.
 */
export async function seedPlacesLv(db: Db) {
  const done = await db.query.crawlState.findFirst({ where: eq(schema.crawlState.name, PLACES_LV_VERSION) });
  if (done) return;
  const t0 = Date.now();
  for (const n of placesLv as NovadsData[]) {
    const [region] = await db
      .insert(schema.regions)
      .values({ name: n.region, kind: "municipality", country: "LV" })
      .onConflictDoUpdate({ target: schema.regions.name, set: { kind: "municipality" } })
      .returning({ id: schema.regions.id });
    const used = new Set<string>();
    const upsert = async (rows: { name: string; lat: number; lon: number; kind: string; code: string; parentId?: number | null }[]) => {
      if (!rows.length) return [] as { id: number; code: string | null }[];
      return db
        .insert(schema.places)
        .values(rows.map((r) => ({ regionId: region.id, ...r })))
        .onConflictDoUpdate({
          target: [schema.places.regionId, schema.places.name],
          set: { kind: sql`excluded.kind`, code: sql`excluded.code`, parentId: sql`excluded.parent_id`, lat: sql`excluded.lat`, lon: sql`excluded.lon` },
        })
        .returning({ id: schema.places.id, code: schema.places.code });
    };
    const unique = (name: string, suffix: string) => {
      const n2 = used.has(name) ? `${name} (${suffix})` : name;
      used.add(n2);
      return n2;
    };
    await upsert(n.towns.map((t) => ({ name: unique(t.name, "pilsēta"), lat: t.lat, lon: t.lon, kind: "town", code: t.code })));
    const parishRows = await upsert(n.parishes.map((p) => ({ name: unique(p.name, "pagasts"), lat: p.lat, lon: p.lon, kind: "parish", code: p.code })));
    const parishId = new Map(parishRows.map((r) => [r.code, r.id]));
    const villages = n.parishes.flatMap((p) =>
      p.villages.map((v) => ({ name: unique(v.name, p.name.replace(/ pagasts$/, " pag.")), lat: v.lat, lon: v.lon, kind: "village", code: v.code, parentId: parishId.get(p.code) ?? null })),
    );
    for (let i = 0; i < villages.length; i += 500) await upsert(villages.slice(i, i + 500));
  }
  // Varakļānu novads 2025. gadā pievienots Madonas novadam: sludinājumus pārceļam uz jaunajām vietām
  const [old] = await db.select({ id: schema.regions.id }).from(schema.regions).where(eq(schema.regions.name, "Varakļānu novads"));
  if (old) {
    const [madona] = await db.select({ id: schema.regions.id }).from(schema.regions).where(eq(schema.regions.name, "Madonas novads"));
    const oldPlaces = await db.select({ id: schema.places.id, name: schema.places.name }).from(schema.places).where(eq(schema.places.regionId, old.id));
    for (const p of oldPlaces) {
      const [target] = await db.select({ id: schema.places.id }).from(schema.places).where(sql`${schema.places.regionId} = ${madona.id} and ${schema.places.name} = ${p.name}`);
      if (target) await db.update(schema.listings).set({ placeId: target.id }).where(eq(schema.listings.placeId, p.id));
    }
    const ids = oldPlaces.map((p) => p.id);
    const still = ids.length ? await db.select({ id: schema.listings.id }).from(schema.listings).where(inArray(schema.listings.placeId, ids)).limit(1) : [];
    if (!still.length) {
      if (ids.length) await db.delete(schema.places).where(inArray(schema.places.id, ids));
      await db.delete(schema.regions).where(eq(schema.regions.id, old.id));
    }
  }
  await db.insert(schema.crawlState).values({ name: PLACES_LV_VERSION, lastFullAt: new Date(), lastResult: { ms: Date.now() - t0 } }).onConflictDoNothing();
}

/** Daži parauga sludinājumi izstrādei. Neizmantot produkcijā. */
export async function seedDemo(db: Db) {
  const allPlaces = await db.select().from(schema.places);
  const vw = await db.query.makes.findFirst({ where: (m, { and, eq }) => and(eq(m.vehicleClass, "car"), eq(m.name, "Volkswagen")) });
  const golf = vw ? await db.query.models.findFirst({ where: (m, { and, eq }) => and(eq(m.makeId, vw.id), eq(m.name, "Golf")) }) : undefined;
  const at = (name: string) => allPlaces.find((p) => p.name === name) ?? allPlaces[0];
  const teika = at("Teika"), ogre = at("Ogre"), majori = at("Majori"), antakalnis = at("Antakalnis");
  const toyota = await db.query.makes.findFirst({ where: (m, { and, eq }) => and(eq(m.vehicleClass, "car"), eq(m.name, "Toyota")) });
  const rav4 = toyota ? await db.query.models.findFirst({ where: (m, { and, eq }) => and(eq(m.makeId, toyota.id), eq(m.name, "RAV4")) }) : undefined;

  await db.insert(schema.listings).values([
    { kind: "vehicle", vehicleClass: "car", title: "Volkswagen Golf 2.0 TDI", price: 12900, makeId: vw?.id, modelId: golf?.id, year: 2017, mileageKm: 168000, fuel: "Dīzelis", gearbox: "Manuāla", body: "Hečbeks", engineL: "2.0", powerKw: 110, drive: "Priekšpiedziņa", color: "Pelēka", placeId: teika.id, lat: teika.lat, lon: teika.lon, contactPhone: "+37120000000" },
    { kind: "property", propertyType: "Dzīvoklis", deal: "sell", title: "2-istabu dzīvoklis, Brīvības iela", price: 98000, rooms: 2, areaM2: "54", floor: 3, floors: 5, series: "467. sērija", material: "Paneļu", heating: "Centrālā", condition: "Labs", builtYear: 1978, amenities: ["Balkons"], placeId: teika.id, lat: teika.lat, lon: teika.lon, contactPhone: "+37120000001" },
    { kind: "property", propertyType: "Māja", deal: "sell", title: "Privātmāja 160 m², zeme 1200 m²", price: 189000, rooms: 5, areaM2: "160", landM2: 1200, floors: 2, material: "Ķieģeļu", heating: "Siltumsūknis", condition: "Pēc kapitālā remonta", builtYear: 1998, amenities: ["Terase", "Pirts"], placeId: ogre.id, lat: ogre.lat, lon: ogre.lon, contactEmail: "pardod@example.lv" },
    { kind: "vehicle", vehicleClass: "car", title: "Toyota RAV4 2.5 hibrīds", price: 24500, makeId: toyota?.id, modelId: rav4?.id, year: 2020, mileageKm: 92000, fuel: "Hibrīds", gearbox: "Automāts", body: "Apvidus", engineL: "2.5", powerKw: 160, drive: "Pilnpiedziņa", color: "Balta", placeId: antakalnis.id, lat: antakalnis.lat, lon: antakalnis.lon, contactPhone: "+37060000000" },
    { kind: "property", propertyType: "Dzīvoklis", deal: "day", title: "Dzīvoklis pie jūras, Majori", price: 85, rooms: 2, areaM2: "48", floor: 2, floors: 4, series: "Jaunais projekts", heating: "Gāzes", condition: "Jauns projekts", amenities: ["Balkons", "Mēbelēts"], placeId: majori.id, lat: majori.lat, lon: majori.lon, contactPhone: "+37120000002" },
  ]);
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  await seedReference(db);
  console.log("Vietas un transporta katalogs ielādēti.");
  if (process.argv.includes("--demo")) {
    await seedDemo(db);
    console.log("Parauga sludinājumi pievienoti.");
  }
  await pool.end();
}

if (process.argv[1] && /seed\.ts$/.test(process.argv[1])) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
