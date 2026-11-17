/**
 * Klienta IP ātruma limitiem. Render priekšā ir Cloudflare, kas `cf-connecting-ip` vienmēr pārraksta ar īsto adresi.
 * `x-forwarded-for` Render tikai papildina, tāpēc tā kreiso vērtību klients var viltot (pārbaudīts 2026-11-17);
 * to lietojam tikai kā rezervi (lokāli, citā hostingā).
 */
export function clientIp(h: Headers, fallback = "?"): string {
  const cf = h.get("cf-connecting-ip")?.trim() || h.get("true-client-ip")?.trim();
  if (cf) return cf;
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || fallback;
}
