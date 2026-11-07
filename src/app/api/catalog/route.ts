import { asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { VEHICLE_CLASSES, type VehicleClass } from "@/lib/constants";

/** Markas un modeļi vienam transporta veidam: /api/catalog?class=car */
export async function GET(req: Request) {
  const cls = new URL(req.url).searchParams.get("class") as VehicleClass;
  if (!VEHICLE_CLASSES.includes(cls)) return Response.json({ error: "Nezināms transporta veids" }, { status: 400 });
  const makes = await db.select().from(schema.makes).where(eq(schema.makes.vehicleClass, cls)).orderBy(asc(schema.makes.name));
  const models = makes.length
    ? await db.select({ id: schema.models.id, makeId: schema.models.makeId, name: schema.models.name }).from(schema.models).where(inArray(schema.models.makeId, makes.map((m) => m.id))).orderBy(asc(schema.models.name))
    : [];
  const byMake = new Map<number, { id: number; name: string }[]>();
  for (const m of models) (byMake.get(m.makeId) ?? byMake.set(m.makeId, []).get(m.makeId)!).push({ id: m.id, name: m.name });
  return Response.json(
    makes.map((m) => ({ id: m.id, name: m.name, popular: m.popular, models: byMake.get(m.id) ?? [] })),
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
