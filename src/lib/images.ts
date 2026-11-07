import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"]);

export function isAcceptedType(type: string) {
  return ACCEPTED.has(type);
}

/**
 * Sagatavo augšupielādēto bildi: pagriež pēc EXIF, noņem visus metadatus (arī GPS atrašanās vietu),
 * samazina līdz 1600 px un izveido 480 px sīktēlu. Rezultāts ir WebP.
 */
export async function processImage(input: Buffer) {
  const base = sharp(input, { failOn: "error", limitInputPixels: 100_000_000 }).rotate();
  const meta = await base.metadata();
  if (!meta.width || !meta.height) throw new Error("Fails nav bilde");

  const full = await base.clone().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  const thumb = await base.clone().resize({ width: 480, height: 360, fit: "cover", position: "attention" }).webp({ quality: 74 }).toBuffer();
  return { full: full.data, width: full.info.width, height: full.info.height, thumb };
}
