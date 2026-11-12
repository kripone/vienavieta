"use client";
// Dzīvokļu cenu karte: katra apkaime/pilsēta ir aplis, krāsa = €/m² mediāna (viena toņa skala, gaišs → tumšs).
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { useT } from "@/i18n/client";
import { PRICE_RAMP } from "@/lib/constants";
import { GOOGLE_KEY } from "@/lib/google-tiles";
import { addGoogleLayers, STREETS_ATTR } from "./map-layers";

export type MapPlace = { id: number; name: string; lat: number; lon: number; n: number; label: string; level: number; href: string };
const STREETS = process.env.NEXT_PUBLIC_MAP_TILES_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function PriceMap({ places, unit }: { places: MapPlace[]; unit: string }) {
  const { t } = useT();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!box.current) return;
    const m = L.map(box.current, { center: [56.955, 24.12], zoom: 11, minZoom: 7, maxZoom: 15 });
    if (GOOGLE_KEY) addGoogleLayers(m);
    else L.tileLayer(STREETS, { attribution: STREETS_ATTR, maxZoom: 19 }).addTo(m);
    m.setMaxBounds([[55.4, 20.5], [58.3, 28.6]]);
    const radius = (n: number, z: number) => Math.min(26, (z >= 11 ? 10 : z >= 9 ? 7 : 5) + Math.sqrt(n) * (z >= 11 ? 0.9 : 0.45));
    const group = L.layerGroup().addTo(m);
    // mazākie apļi virspusē, lai lielie tos neaizsedz
    for (const p of [...places].sort((a, b) => b.n - a.n)) {
      L.circleMarker([p.lat, p.lon], { radius: radius(p.n, m.getZoom()), weight: 2, color: "#fff", fillColor: PRICE_RAMP[p.level], fillOpacity: 0.92 })
        .bindTooltip(`<b>${esc(p.name)}</b><br>${esc(p.label)} ${esc(unit)}`, { direction: "top", className: "pmap-tip" })
        .bindPopup(`<b>${esc(p.name)}</b><br><span style="font-size:17px;font-weight:700">${esc(p.label)} ${esc(unit)}</span><br>${esc(t("{n} sludinājumi", { n: String(p.n) }))}<br><a href="${esc(p.href)}" style="font-weight:700">${esc(t("Skatīt sludinājumus"))} →</a>`)
        .addTo(group);
      (group.getLayers().at(-1) as L.CircleMarker & { _n: number })._n = p.n;
    }
    // tuvumā rāda cenu pie katra apļa
    const labels = L.layerGroup();
    for (const p of places) {
      L.marker([p.lat, p.lon], { interactive: false, icon: L.divIcon({ className: "pmap-label", html: `<span>${esc(p.label)}</span>`, iconSize: [0, 0] }) }).addTo(labels);
    }
    const sync = () => {
      const z = m.getZoom();
      group.eachLayer((l) => (l as L.CircleMarker & { _n: number }).setRadius(radius((l as L.CircleMarker & { _n: number })._n, z)));
      if (z >= 11) labels.addTo(m); else labels.remove();
    };
    m.on("zoomend", sync);
    sync();
    map.current = m;
    return () => { m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, unit]);

  return (
    <div className="mapwrap">
      <div className="pmap-views">
        <button type="button" className="btn small" onClick={() => map.current?.setView([56.955, 24.12], 11)}>{t("Rīga")}</button>
        <button type="button" className="btn small" onClick={() => map.current?.setView([56.9, 24.7], 7)}>{t("Visa Latvija")}</button>
      </div>
      <div ref={box} className="map pmap" />
    </div>
  );
}
