"use client";
// Kopīgie kartes slāņi (meklēšanas karte un sludinājuma karte).
import L from "leaflet";
import { googleCopyright, googleSession, googleTileUrl, type GoogleMapType } from "@/lib/google-tiles";

export const STREETS_ATTR = process.env.NEXT_PUBLIC_MAP_TILES_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export /**
 * Google ielu karte un satelīts. Ja Google nav pieejams (atslēga, kvota), pārslēdzas uz OpenStreetMap.
 * Atsauce "Google Maps" + autortiesības no viewport atbildes tiek atjaunotas pēc katras kustības.
 */
function addGoogleLayers(m: L.Map) {
  m.attributionControl.setPrefix('<span aria-label="Google Maps" style="font-weight:700">Google Maps</span>');
  const layers: Partial<Record<GoogleMapType, { layer: L.TileLayer; session: string }>> = {};
  let active: GoogleMapType = "roadmap";
  let lastCopyright = "";

  const refreshCopyright = () => {
    const cur = layers[active];
    if (!cur) return;
    const b = m.getBounds();
    googleCopyright(cur.session, m.getZoom(), { north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() })
      .then((text) => {
        if (lastCopyright) m.attributionControl.removeAttribution(lastCopyright);
        lastCopyright = text ? esc(text) : "";
        if (lastCopyright) m.attributionControl.addAttribution(lastCopyright);
      })
      .catch(() => {});
  };

  Promise.all((["roadmap", "satellite"] as const).map((t) => googleSession(t).then((session) => [t, session] as const)))
    .then((sessions) => {
      for (const [t, session] of sessions) layers[t] = { session, layer: L.tileLayer(googleTileUrl(session), { maxZoom: 20, tileSize: 256 }) };
      layers.roadmap!.layer.addTo(m);
      L.control.layers({ "Karte": layers.roadmap!.layer, "Satelīts": layers.satellite!.layer }, {}, { position: "topright" }).addTo(m);
      m.on("baselayerchange", (e: L.LayersControlEvent) => { active = e.name === "Satelīts" ? "satellite" : "roadmap"; refreshCopyright(); });
      let t: ReturnType<typeof setTimeout> | undefined;
      m.on("moveend", () => { clearTimeout(t); t = setTimeout(refreshCopyright, 400); });
      refreshCopyright();
    })
    .catch(() => {
      // rezerve: OpenStreetMap
      m.attributionControl.setPrefix(false);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: STREETS_ATTR, maxZoom: 19 }).addTo(m);
    });
}
