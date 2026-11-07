import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import catalog from "../../data/vehicle-catalog.json";
import locations from "../../data/locations.json";
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
  for (const r of locations as { name: string; kind: "city" | "municipality"; places: { name: string; lat: number; lon: number }[] }[]) {
    const [region] = await db
      .insert(schema.regions)
      .values({ name: r.name, kind: r.kind })
      .onConflictDoUpdate({ target: schema.regions.name, set: { kind: r.kind } })
      .returning({ id: schema.regions.id });
    await db
      .insert(schema.places)
      .values(r.places.map((p) => ({ regionId: region.id, name: p.name, lat: p.lat, lon: p.lon })))
      .onConflictDoNothing();
  }

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

/** Daži parauga sludinājumi izstrādei. Neizmantot produkcijā. */
export async function seedDemo(db: Db) {
  const allPlaces = await db.select().from(schema.places);
  const vw = await db.query.makes.findFirst({ where: (m, { and, eq }) => and(eq(m.vehicleClass, "car"), eq(m.name, "Volkswagen")) });
  const golf = vw ? await db.query.models.findFirst({ where: (m, { and, eq }) => and(eq(m.makeId, vw.id), eq(m.name, "Golf")) }) : undefined;
  const at = (name: string) => allPlaces.find((p) => p.name === name) ?? allPlaces[0];
  const teika = at("Teika"), ogre = at("Ogre"), majori = at("Majori");

  await db.insert(schema.listings).values([
    { kind: "vehicle", vehicleClass: "car", title: "Volkswagen Golf 2.0 TDI", price: 12900, makeId: vw?.id, modelId: golf?.id, year: 2017, mileageKm: 168000, fuel: "Dīzelis", gearbox: "Manuāla", body: "Hečbeks", engineL: "2.0", powerKw: 110, drive: "Priekšpiedziņa", color: "Pelēka", placeId: teika.id, lat: teika.lat, lon: teika.lon, contactPhone: "+37120000000" },
    { kind: "property", propertyType: "Dzīvoklis", deal: "sell", title: "2-istabu dzīvoklis, Brīvības iela", price: 98000, rooms: 2, areaM2: "54", floor: 3, floors: 5, series: "467. sērija", material: "Paneļu", heating: "Centrālā", condition: "Labs", builtYear: 1978, amenities: ["Balkons"], placeId: teika.id, lat: teika.lat, lon: teika.lon, contactPhone: "+37120000001" },
    { kind: "property", propertyType: "Māja", deal: "sell", title: "Privātmāja 160 m², zeme 1200 m²", price: 189000, rooms: 5, areaM2: "160", landM2: 1200, floors: 2, material: "Ķieģeļu", heating: "Siltumsūknis", condition: "Pēc kapitālā remonta", builtYear: 1998, amenities: ["Terase", "Pirts"], placeId: ogre.id, lat: ogre.lat, lon: ogre.lon, contactEmail: "pardod@example.lv" },
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
