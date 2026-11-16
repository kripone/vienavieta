/**
 * ss.com bilžu izmēri: sarakstā dod 174px (.t.jpg), bet tas pats attēls ir
 * pieejams arī 800px platumā (.800.jpg) — pietiek nomainīt paplašinājumu,
 * sludinājuma lapu atvērt nav vajadzības (pārbaudīts 2026-11-16).
 * Bildes rādām tieši no ss.com servera; neglabājam un nelejupielādējam.
 */
export function ssBigThumb(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https:\/\/i\.ss\.com\/.+\.t\.jpg$/.test(url)) return url.replace(/\.t\.jpg$/, ".800.jpg");
  return null;
}
