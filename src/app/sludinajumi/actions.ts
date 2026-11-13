"use server";
import { and, count, eq, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { indexNow, listingPaths } from "@/lib/indexnow";
import { db, schema } from "@/db";
import { checkContent, isValidEmail, isValidPhone, normalizePhone, normalizeTitle } from "@/lib/antispam";
import { DAILY_LISTING_LIMIT } from "@/lib/constants";
import { linkDuplicate } from "@/lib/dedupe";
import { autoTitle, ListingInput, pickPropertyFields } from "@/lib/listing-input";
import { getCurrentUser } from "@/lib/session";
import { deleteObject } from "@/lib/storage";

const { listings, listingPhotos, makes, models, places, priceHistory } = schema;

export type SaveResult = { ok: true; id: string } | { ok: false; errors: Record<string, string> };

const fail = (field: string, message: string): SaveResult => ({ ok: false, errors: { [field]: message } });

export async function saveListing(raw: unknown): Promise<SaveResult> {
  const user = await getCurrentUser();
  if (!user) return fail("form", "Sesija beigusies. Ielogojies vēlreiz.");
  if (!user.name) return fail("form", "Vispirms profilā norādi savu vārdu.");

  const parsed = ListingInput.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0] ?? "form")] ??= i.message;
    return { ok: false, errors };
  }
  const v = parsed.data;
  const isEdit = Boolean(v.id);

  // esošais sludinājums (rediģēšanai)
  const existing = v.id ? await db.query.listings.findFirst({ where: eq(listings.id, v.id) }) : undefined;
  if (v.id && (!existing || existing.userId !== user.id || existing.status === "deleted")) return fail("form", "Sludinājums nav atrasts.");
  if (existing && existing.kind !== v.kind) return fail("form", "Sludinājuma kategoriju mainīt nevar.");

  // kontakti
  const phone = normalizePhone(v.contactPhone || user.phone || "");
  const email = v.contactEmail.trim();
  if (phone && !isValidPhone(phone)) return fail("contactPhone", "Ievadi derīgu tālruni, piem. +371 20000000.");
  if (email && !isValidEmail(email)) return fail("contactEmail", "Ievadi derīgu e-pastu.");
  if (!phone && !email) return fail("contactPhone", "Norādi tālruni vai e-pastu, lai pircēji var sazināties.");

  // vieta
  const place = await db.query.places.findFirst({ where: eq(places.id, v.placeId) });
  if (!place) return fail("placeId", "Izvēlies vietu no saraksta.");
  if (v.kind === "property") {
    // Nekustamais īpašums pagaidām tikai Latvijā.
    const region = await db.query.regions.findFirst({ where: eq(schema.regions.id, place.regionId) });
    if (region?.country !== "LV") return fail("placeId", "Nekustamo īpašumu var ievietot tikai Latvijā.");
  }

  // marka un modelis
  let makeName: string | undefined, modelName: string | undefined;
  if (v.kind === "vehicle") {
    if (v.makeId) {
      const m = await db.query.makes.findFirst({ where: and(eq(makes.id, v.makeId), eq(makes.vehicleClass, v.vehicleClass as never)) });
      if (!m) return fail("makeId", "Izvēlies marku no saraksta.");
      makeName = m.name;
      if (v.modelId) {
        const md = await db.query.models.findFirst({ where: and(eq(models.id, v.modelId), eq(models.makeId, m.id)) });
        if (!md) return fail("modelId", "Izvēlies modeli no saraksta.");
        modelName = md.name;
      }
    }
  }

  const title = v.title || autoTitle(v, { make: makeName, model: modelName });
  if (title.length < 4) return fail("title", "Ieraksti virsrakstu (vismaz 4 zīmes).");

  // antispam
  const spam = checkContent({ title, description: v.description, contactPhone: phone, contactEmail: email, honeypot: v.honeypot, startedAt: isEdit ? 0 : v.startedAt }, isEdit ? Number.MAX_SAFE_INTEGER : Date.now());
  if (spam) return fail("form", spam);
  if (!isEdit) {
    const [{ n }] = await db.select({ n: count() }).from(listings).where(and(eq(listings.userId, user.id), gt(listings.createdAt, new Date(Date.now() - 86_400_000))));
    if (n >= DAILY_LISTING_LIMIT) return fail("form", `Diennaktī var ievietot līdz ${DAILY_LISTING_LIMIT} sludinājumiem. Mēģini rīt.`);
  }
  const mine = await db
    .select({ id: listings.id, title: listings.title, price: listings.price })
    .from(listings)
    .where(and(eq(listings.userId, user.id), inArray(listings.status, ["active", "pending", "hidden"]), v.id ? ne(listings.id, v.id) : undefined));
  if (mine.some((m) => normalizeTitle(m.title) === normalizeTitle(title) && m.price === v.price)) return fail("form", "Tev jau ir tieši tāds pats sludinājums.");

  // bildes: tikai paša lietotāja, vēl nepiesaistītas vai šim sludinājumam piesaistītas
  const photoRows = v.photoIds.length
    ? await db
        .select()
        .from(listingPhotos)
        .where(and(inArray(listingPhotos.id, v.photoIds), eq(listingPhotos.userId, user.id), v.id ? or(isNull(listingPhotos.listingId), eq(listingPhotos.listingId, v.id)) : isNull(listingPhotos.listingId)))
    : [];
  if (photoRows.length !== v.photoIds.length) return fail("photos", "Dažas bildes vairs nav pieejamas. Pievieno tās vēlreiz.");

  const base = {
    title,
    description: v.description || null,
    price: v.price,
    placeId: place.id,
    // koordinātas ar nelielu nobīdi, lai kartē neatklātu precīzu adresi
    lat: existing?.placeId === place.id && existing.lat != null ? existing.lat : place.lat + (Math.random() - 0.5) * 0.006,
    lon: existing?.placeId === place.id && existing.lon != null ? existing.lon : place.lon + (Math.random() - 0.5) * 0.012,
    contactPhone: phone || null,
    contactEmail: email || null,
    updatedAt: new Date(),
  };
  const specific =
    v.kind === "vehicle"
      ? {
          vehicleClass: v.vehicleClass as never,
          makeId: v.makeId ?? null,
          modelId: v.modelId ?? null,
          makeText: v.makeId ? null : v.makeText || null,
          modelText: v.modelId ? null : v.modelText || null,
          year: v.year,
          mileageKm: v.mileageKm ?? null,
          fuel: v.fuel,
          gearbox: v.gearbox,
          body: v.body,
          engineL: v.engineL != null ? String(v.engineL) : null,
          powerKw: v.powerKw ?? null,
          drive: v.drive ?? null,
          color: v.color ?? null,
          vin: v.vin ?? null,
        }
      : { propertyType: v.propertyType, deal: v.deal as never, ...pickPropertyFields(v) };

  let removedKeys: string[] = [];
  const id = await db.transaction(async (tx) => {
    let listingId: string;
    if (existing) {
      listingId = existing.id;
      if (existing.price !== v.price) {
        // price_history glabā cenu no katra izmaiņas brīža; ja vēstures vēl nav, vispirms sākuma cena
        const [had] = await tx.select({ id: priceHistory.id }).from(priceHistory).where(eq(priceHistory.listingId, listingId)).limit(1);
        if (!had) await tx.insert(priceHistory).values({ listingId, price: existing.price, changedAt: existing.createdAt });
        await tx.insert(priceHistory).values({ listingId, price: v.price });
      }
      const firstPrice = existing.price !== v.price ? { firstPrice: sql`coalesce(${listings.firstPrice}, ${existing.price})` } : {};
      await tx.update(listings).set({ ...base, ...specific, ...firstPrice }).where(eq(listings.id, listingId));
      const old = await tx.select().from(listingPhotos).where(eq(listingPhotos.listingId, listingId));
      const gone = old.filter((p) => !v.photoIds.includes(p.id));
      if (gone.length) {
        await tx.delete(listingPhotos).where(inArray(listingPhotos.id, gone.map((p) => p.id)));
        removedKeys = gone.flatMap((p) => [p.storageKey, p.thumbKey]);
      }
    } else {
      const [row] = await tx.insert(listings).values({ kind: v.kind, userId: user.id, source: "own", ...base, ...specific }).returning({ id: listings.id });
      listingId = row.id;
    }
    for (const [position, pid] of v.photoIds.entries()) {
      await tx.update(listingPhotos).set({ listingId, position }).where(eq(listingPhotos.id, pid));
    }
    return listingId;
  });

  for (const k of removedKeys) await deleteObject(k).catch(() => {});
  revalidatePath("/");
  revalidatePath(`/sludinajumi/${id}`);
  revalidatePath("/mani-sludinajumi");
  indexNow(listingPaths([id]));
  return { ok: true, id };
}

/** Sludinājuma dzēšana (paliek datubāzē ar statusu "deleted", bildes tiek izdzēstas). */
export async function deleteListing(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Ielogojies vēlreiz." };
  const l = await db.query.listings.findFirst({ where: eq(listings.id, id) });
  if (!l || l.userId !== user.id) return { ok: false, error: "Sludinājums nav atrasts." };
  const photos = await db.select().from(listingPhotos).where(eq(listingPhotos.listingId, id));
  await db.transaction(async (tx) => {
    await tx.update(listings).set({ status: "deleted", updatedAt: new Date() }).where(eq(listings.id, id));
    await tx.delete(listingPhotos).where(eq(listingPhotos.listingId, id));
  });
  for (const p of photos) {
    await deleteObject(p.storageKey).catch(() => {});
    await deleteObject(p.thumbKey).catch(() => {});
  }
  revalidatePath("/");
  revalidatePath("/mani-sludinajumi");
  indexNow(listingPaths([id]));
  return { ok: true };
}

/** Atzīmēt kā pārdotu vai atjaunot. */
export async function setSold(id: string, sold: boolean): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await db.update(listings).set({ status: sold ? "sold" : "active", updatedAt: new Date() }).where(and(eq(listings.id, id), eq(listings.userId, user.id), inArray(listings.status, ["active", "sold"])));
  revalidatePath("/");
  revalidatePath(`/sludinajumi/${id}`);
  revalidatePath("/mani-sludinajumi");
  indexNow(listingPaths([id]));
  return { ok: true };
}
