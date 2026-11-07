import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Failu krātuve bildēm (STORAGE_DRIVER):
 * - "s3": S3 saderīga krātuve (Cloudflare R2, Backblaze B2, AWS S3); noklusējums, ja iestatīts S3_BUCKET.
 * - "db": PostgreSQL tabula media_objects. Testa versijām bez ārējas krātuves; lieliem apjomiem neder.
 * - "local": mape data/uploads (izstrādei); noklusējums citādi.
 */
const LOCAL_DIR = path.join(process.cwd(), "data", "uploads");
const driver = (process.env.STORAGE_DRIVER || (process.env.S3_BUCKET ? "s3" : "local")) as "s3" | "db" | "local";
const useS3 = driver === "s3";
const useDb = driver === "db";

const s3 = useS3
  ? new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" },
    })
  : null;

const KEY_RE = /^[a-z0-9][a-z0-9/_.-]{0,200}$/i;
function checkKey(key: string) {
  if (!KEY_RE.test(key) || key.includes("..")) throw new Error("Nederīga faila atslēga");
  return key;
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  checkKey(key);
  if (s3) {
    await s3.send(
      new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: body, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }),
    );
    return;
  }
  if (useDb) {
    await db.insert(schema.mediaObjects).values({ key, contentType, data: body }).onConflictDoUpdate({ target: schema.mediaObjects.key, set: { contentType, data: body } });
    return;
  }
  const file = path.join(LOCAL_DIR, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

export async function getObject(key: string): Promise<Buffer | null> {
  checkKey(key);
  try {
    if (s3) {
      const r = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
      return r.Body ? Buffer.from(await r.Body.transformToByteArray()) : null;
    }
    if (useDb) {
      const row = await db.query.mediaObjects.findFirst({ where: eq(schema.mediaObjects.key, key) });
      return row ? Buffer.from(row.data) : null;
    }
    return await readFile(path.join(LOCAL_DIR, key));
  } catch {
    return null;
  }
}

export async function deleteObject(key: string) {
  checkKey(key);
  if (s3) {
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    return;
  }
  if (useDb) {
    await db.delete(schema.mediaObjects).where(eq(schema.mediaObjects.key, key));
    return;
  }
  await rm(path.join(LOCAL_DIR, key), { force: true });
}

/** Publiskā adrese bildei. Ar MEDIA_PUBLIC_URL (piem. R2 publiskais domēns) bildes nāk tieši no krātuves. */
export function mediaUrl(key: string) {
  const base = process.env.MEDIA_PUBLIC_URL?.replace(/\/$/, "");
  return base ? `${base}/${key}` : `/media/${key}`;
}
