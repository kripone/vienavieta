// Vienreizēji datu uzlabojumi ārējiem sludinājumiem (izpilda fona plānotājs; stāvoklis crawl_state).
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { inferBody } from "../illustrations";
import { findMake, matchModel, vehicleTitle } from "./ss-rss";

const { listings, models, makes, crawlState } = schema;
const BODY_KEY = "backfill:body:v3";
const MODEL_KEY = "backfill:makemodel:v1";

/**
 * Marka/modelis ss.com transportam, kas ievākts pirms aizstājvārdiem ("Mercedes" → Mercedes-Benz, BMW "320" → 3. sērija,
 * "E220" → E klase). "Citi" modeļi tiek atpazīti nākamajā pilnajā kārtā no sludinājuma teksta sākuma.
 */
export async function backfillMakeModel() {
  const done = await db.query.crawlState.findFirst({ where: eq(crawlState.name, MODEL_KEY) });
  if (done?.lastFullAt) return null;
  const [makeRows, modelRows] = await Promise.all([
    db.select({ id: makes.id, name: makes.name, vehicleClass: makes.vehicleClass }).from(makes),
    db.select({ id: models.id, makeId: models.makeId, name: models.name }).from(models),
  ]);
  const rows = await db
    .select({ id: listings.id, vc: listings.vehicleClass, makeId: listings.makeId, makeName: makes.name, makeText: listings.makeText, modelText: listings.modelText, engineL: listings.engineL, fuel: listings.fuel, year: listings.year })
    .from(listings)
    .leftJoin(makes, eq(listings.makeId, makes.id))
    .where(and(eq(listings.source, "ss.com"), eq(listings.kind, "vehicle"), or(isNull(listings.makeId), isNull(listings.modelId))));
  let updated = 0;
  for (const r of rows) {
    const make = r.makeId ? { id: r.makeId, name: r.makeName! } : r.makeText ? findMake(makeRows, r.vc!, r.makeText) : null;
    if (!make) continue;
    const model = r.modelText ? matchModel(modelRows, make.id, r.modelText, make.name) : null;
    if (!model && r.makeId) continue;
    await db
      .update(listings)
      .set({
        makeId: make.id, makeText: null,
        ...(model ? { modelId: model.id, modelText: null } : {}),
        title: vehicleTitle(make.name, model?.name ?? r.modelText ?? "", r.engineL, r.fuel, r.year),
        ...(model && r.vc === "car" ? { body: inferBody(model.name) } : {}),
      })
      .where(eq(listings.id, r.id));
    updated++;
  }
  const result = { checked: rows.length, updated };
  await db.insert(crawlState).values({ name: MODEL_KEY, lastFullAt: new Date(), lastResult: result }).onConflictDoUpdate({ target: crawlState.name, set: { lastFullAt: new Date(), lastResult: result } });
  return result;
}

/** Virsbūve ss.com auto, kam tā nav (noteikta pēc modeļa nosaukuma). Izpildās vienreiz. */
export async function backfillBodies() {
  const done = await db.query.crawlState.findFirst({ where: eq(crawlState.name, BODY_KEY) });
  if (done?.lastFullAt) return null;
  const rows = await db
    .select({ id: listings.id, model: models.name, modelText: listings.modelText })
    .from(listings)
    .leftJoin(models, eq(listings.modelId, models.id))
    .where(and(eq(listings.source, "ss.com"), eq(listings.vehicleClass, "car"), isNull(listings.body)));
  const byBody = new Map<string, string[]>();
  for (const r of rows) {
    const b = inferBody(r.model) ?? inferBody(r.modelText);
    if (b) byBody.set(b, [...(byBody.get(b) ?? []), r.id]);
  }
  let updated = 0;
  for (const [body, ids] of byBody) {
    for (let i = 0; i < ids.length; i += 1000) {
      await db.update(listings).set({ body }).where(inArray(listings.id, ids.slice(i, i + 1000)));
      updated += Math.min(1000, ids.length - i);
    }
  }
  const result = { checked: rows.length, updated };
  await db.insert(crawlState).values({ name: BODY_KEY, lastFullAt: new Date(), lastResult: result }).onConflictDoUpdate({ target: crawlState.name, set: { lastFullAt: new Date(), lastResult: result } });
  return result;
}
