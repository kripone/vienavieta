// Google Map Tiles API (2D flīzes) Leaflet kartei.
// Noteikumi: jārāda "Google Maps" atsauce un autortiesību teksts no viewport atbildes;
// flīzes nedrīkst glabāt vai iepriekš lejupielādēt. Sk. docs/MAPS.md.

export const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

export type GoogleMapType = "roadmap" | "satellite";
type Session = { session: string; expiry: number };

const API = "https://tile.googleapis.com";
const pending = new Map<GoogleMapType, Promise<string>>();

/** Sesijas marķieris derīgs ~2 nedēļas; glabājam pārlūkā, lai katrs skatījums neveidotu jaunu. */
export function googleSession(mapType: GoogleMapType): Promise<string> {
  const cacheKey = `gtiles:${mapType}`;
  try {
    const saved = JSON.parse(localStorage.getItem(cacheKey) || "null") as Session | null;
    if (saved && saved.expiry * 1000 > Date.now() + 3600_000) return Promise.resolve(saved.session);
  } catch {}
  if (!pending.has(mapType)) {
    pending.set(
      mapType,
      fetch(`${API}/v1/createSession?key=${GOOGLE_KEY}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mapType, language: "lv", region: "LV", scale: "scaleFactor2x", highDpi: true }),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`createSession ${r.status}`))))
        .then((s: Session) => {
          try { localStorage.setItem(cacheKey, JSON.stringify({ session: s.session, expiry: Number(s.expiry) })); } catch {}
          return s.session;
        })
        .finally(() => pending.delete(mapType)),
    );
  }
  return pending.get(mapType)!;
}

export const googleTileUrl = (session: string) => `${API}/v1/2dtiles/{z}/{x}/{y}?session=${session}&key=${GOOGLE_KEY}`;

/** Autortiesību teksts redzamajai kartes daļai (obligāts). */
export async function googleCopyright(session: string, zoom: number, b: { north: number; south: number; east: number; west: number }) {
  const q = new URLSearchParams({ session, key: GOOGLE_KEY, zoom: String(Math.round(zoom)), ...Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.toFixed(5)])) });
  const r = await fetch(`${API}/tile/v1/viewport?${q}`);
  if (!r.ok) return "";
  const j = (await r.json()) as { copyright?: string };
  return j.copyright ?? "";
}
