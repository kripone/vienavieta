// Klienta IP un vienkārši pieprasījumu limiti (atmiņā, vienai servera instancei).
// Drošības audits 2026-11-28: X-Forwarded-For pirmo vērtību klients var viltot (Render to tikai papildina),
// tāpēc limiti, kas balstījās uz to, bija apejami. CF-Connecting-IP iestata Cloudflare (Render priekšā)
// un klienta sūtītu vērtību tas noraida/pārraksta, tāpēc to ņemam vispirms.

type HeaderLike = { get(name: string): string | null };

/** Klienta IP: CF-Connecting-IP → True-Client-IP → X-Forwarded-For (tikai izstrādē, bez Cloudflare). */
export function clientIp(h: HeaderLike): string {
  const cf = h.get("cf-connecting-ip") ?? h.get("true-client-ip");
  if (cf) return cf.trim();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
}

const buckets = new Map<string, Map<string, { n: number; at: number }>>();

/**
 * true, ja limits pārsniegts: ne vairāk kā `max` pieprasījumu `windowMs` laikā vienam atslēgas (IP / lietotāja) ierakstam.
 * `name` – limita nosaukums (katram maršrutam savs skaitītājs).
 */
export function overLimit(name: string, key: string, max: number, windowMs: number): boolean {
  let b = buckets.get(name);
  if (!b) buckets.set(name, (b = new Map()));
  const now = Date.now();
  const h = b.get(key);
  if (!h || now - h.at > windowMs) {
    b.set(key, { n: 1, at: now });
    if (b.size > 20_000) b.delete(b.keys().next().value!);
    return false;
  }
  return ++h.n > max;
}
