import { and, count, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { MAX_PHOTOS } from "@/lib/constants";
import { isAcceptedType, MAX_UPLOAD_BYTES, processImage } from "@/lib/images";
import { getCurrentUser } from "@/lib/session";
import { mediaUrl, putObject } from "@/lib/storage";

export const runtime = "nodejs";

/** Augšupielādē vienu bildi. Atgriež tās ID, ko pēc tam piesaista sludinājumam. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Ielogojies, lai augšupielādētu bildes." }, { status: 401 });

  // Pret ļaunprātīgu izmantošanu: ne vairāk kā 100 nepiesaistītu bilžu stundā vienam lietotājam
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.listingPhotos)
    .where(and(eq(schema.listingPhotos.userId, user.id), isNull(schema.listingPhotos.listingId), gt(schema.listingPhotos.createdAt, new Date(Date.now() - 3_600_000))));
  if (n >= MAX_PHOTOS * 8) return Response.json({ error: "Pārāk daudz augšupielāžu. Mēģini vēlāk." }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Fails nav pievienots." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "Bilde ir lielāka par 15 MB." }, { status: 413 });
  if (file.type && !isAcceptedType(file.type)) return Response.json({ error: "Izmanto JPG, PNG, WebP vai HEIC bildes." }, { status: 415 });

  let img;
  try {
    img = await processImage(Buffer.from(await file.arrayBuffer()));
  } catch {
    return Response.json({ error: "Šo failu neizdevās nolasīt kā bildi." }, { status: 415 });
  }

  const id = crypto.randomUUID();
  const day = new Date().toISOString().slice(0, 10);
  const storageKey = `photos/${day}/${id}.webp`;
  const thumbKey = `photos/${day}/${id}-t.webp`;
  await putObject(storageKey, img.full, "image/webp");
  await putObject(thumbKey, img.thumb, "image/webp");
  await db.insert(schema.listingPhotos).values({ id, userId: user.id, storageKey, thumbKey, width: img.width, height: img.height });

  return Response.json({ id, url: mediaUrl(storageKey), thumbUrl: mediaUrl(thumbKey) });
}
