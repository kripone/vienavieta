// Vienreizēji datu uzlabojumi ārējiem sludinājumiem (izpilda fona plānotājs; stāvoklis crawl_state).
import { and, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { inferBody } from "../illustrations";
import { findMake, matchModel, vehicleTitle } from "./ss-rss";

const { listings, models, makes, crawlState } = schema;
const BODY_KEY = "backfill:body:v3";
const MODEL_KEY = "backfill:makemodel:v2"; // v2: modeļu aizstājvārdi (Allroad, Mazda6, T5, "21" → 21 Volga)
const RECRAWL_KEY = "recrawl:models:v1";

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
        ...(model && r.vc === "car" && inferBody(model.name) ? { body: inferBody(model.name) } : {}),
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

/**
 * Vienreiz: pārsāk auto un moto pilno kārtu uzreiz (nevis pēc diennakts), lai "Citi" modeļi tiktu atpazīti
 * no sludinājuma teksta sākuma ar jaunāko loģiku.
 */
export async function forceModelRecrawl() {
  const done = await db.query.crawlState.findFirst({ where: eq(crawlState.name, RECRAWL_KEY) });
  if (done?.lastFullAt) return false;
  await db.update(crawlState).set({ lastFullAt: null }).where(inArray(crawlState.name, ["ss2:cars", "ss2:moto"]));
  await db.insert(crawlState).values({ name: RECRAWL_KEY, lastFullAt: new Date() }).onConflictDoUpdate({ target: crawlState.name, set: { lastFullAt: new Date() } });
  return true;
}

/** ss.com moto modeļa pieraksts → kataloga nosaukums: "Cb600F hornet" → "CB600F Hornet", "Mt-125" → "MT-125". */
export function cleanMotoModel(raw: string) {
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t || t.length > 30 || /[а-яё]/i.test(t) || !/[a-z0-9]/i.test(t)) return null;
  return t
    .split(" ")
    .map((w) => (/\d/.test(w) || w.replace(/[^a-z]/gi, "").length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

/**
 * Moto modeļu katalogs ir īss, bet ss.com modeļu ir ļoti daudz. Neatpazītajiem izveidojam kataloga modeli
 * (ja tāda vēl nav), lai darbotos filtrs pēc modeļa un virsraksts būtu vienots. Katrā plānotāja solī līdz 300.
 */
export async function ensureMotoModels() {
  const rows = await db
    .select({ id: listings.id, makeId: listings.makeId, makeName: makes.name, modelText: listings.modelText, engineL: listings.engineL, fuel: listings.fuel, year: listings.year })
    .from(listings)
    .innerJoin(makes, eq(listings.makeId, makes.id))
    .where(and(eq(listings.source, "ss.com"), eq(listings.vehicleClass, "moto"), isNull(listings.modelId), isNotNull(listings.modelText)))
    .limit(300);
  if (!rows.length) return null;
  const modelRows = await db.select({ id: models.id, makeId: models.makeId, name: models.name }).from(models).where(inArray(models.makeId, [...new Set(rows.map((r) => r.makeId!))]));
  let created = 0, linked = 0;
  for (const r of rows) {
    let model = matchModel(modelRows, r.makeId!, r.modelText!, r.makeName);
    if (!model) {
      const name = cleanMotoModel(r.modelText!);
      if (!name) {
        await db.update(listings).set({ modelText: null }).where(eq(listings.id, r.id)); // neder (piem. kirilicā): tikai marka
        continue;
      }
      const [ins] = await db.insert(models).values({ makeId: r.makeId!, name }).onConflictDoNothing().returning({ id: models.id, makeId: models.makeId, name: models.name });
      model = ins ?? (await db.query.models.findFirst({ where: and(eq(models.makeId, r.makeId!), eq(models.name, name)) })) ?? null;
      if (!model) continue;
      if (ins) { modelRows.push(ins); created++; }
    }
    await db
      .update(listings)
      .set({ modelId: model.id, modelText: null, title: vehicleTitle(r.makeName, model.name, r.engineL, r.fuel, r.year) })
      .where(eq(listings.id, r.id));
    linked++;
  }
  return { checked: rows.length, created, linked };
}
