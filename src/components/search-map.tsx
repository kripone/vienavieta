"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Point = [string, number, number, 1 | 2, number, string];

const STREETS = process.env.NEXT_PUBLIC_MAP_TILES_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const STREETS_ATTR = process.env.NEXT_PUBLIC_MAP_TILES_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const SATELLITE = process.env.NEXT_PUBLIC_MAP_SATELLITE_URL || "";
const SATELLITE_ATTR = process.env.NEXT_PUBLIC_MAP_SATELLITE_ATTRIBUTION || "";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const fmt = new Intl.NumberFormat("lv-LV");

/** Vienkāršo zīmēto līniju: atstāj punktus, kas ir vismaz `min` pikseļu attālumā. */
function simplify(pts: L.Point[], min = 8) {
  const out: L.Point[] = [];
  for (const p of pts) if (!out.length || out[out.length - 1].distanceTo(p) >= min) out.push(p);
  return out;
}

export function SearchMap({ query, zone }: { query: string; zone?: string }) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const zoneLayer = useRef<L.Polygon | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [full, setFull] = useState(false);

  // kartes izveide
  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, { center: [56.95, 24.6], zoom: 7, minZoom: 6, maxZoom: 18, zoomControl: true, worldCopyJump: false });
    const streets = L.tileLayer(STREETS, { attribution: STREETS_ATTR, maxZoom: 19 }).addTo(m);
    if (SATELLITE) {
      const sat = L.tileLayer(SATELLITE, { attribution: SATELLITE_ATTR, maxZoom: 19 });
      L.control.layers({ "Karte": streets, "Satelīts": sat }, {}, { position: "topright" }).addTo(m);
    }
    m.setMaxBounds([[54.8, 19.5], [58.8, 29.5]]);
    markers.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  // punkti
  useEffect(() => {
    const m = map.current;
    if (!m || !markers.current) return;
    let alive = true;
    fetch(`/api/search/points?${query}`).then((r) => r.json()).then((pts: Point[]) => {
      if (!alive || !markers.current) return;
      markers.current.clearLayers();
      setCount(pts.length);
      for (const [id, lat, lon, kind, price, title] of pts) {
        L.circleMarker([lat, lon], { radius: 7, weight: 2, color: "#fff", fillColor: kind === 1 ? "#2f5fa8" : "#2f8a64", fillOpacity: 0.9 })
          .bindPopup(`<a href="/sludinajumi/${id}" style="font-weight:700">${esc(title)}</a><br>${fmt.format(price)} €`)
          .addTo(markers.current);
      }
    }).catch(() => {});
    return () => { alive = false; };
  }, [query]);

  // zona no URL
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    zoneLayer.current?.remove();
    zoneLayer.current = null;
    const pts = zone ? zone.split(";").map((p) => p.split(",").map(Number) as [number, number]) : [];
    if (pts.length >= 3) {
      zoneLayer.current = L.polygon(pts, { color: "#9e3039", weight: 2.5, dashArray: "7 5", fillOpacity: 0.12 }).addTo(m);
      m.fitBounds(zoneLayer.current.getBounds(), { padding: [20, 20] });
    }
  }, [zone]);

  useEffect(() => { setTimeout(() => map.current?.invalidateSize(), 50); }, [full]);

  // zonas zīmēšana ar peli vai pirkstu
  useEffect(() => {
    const m = map.current;
    if (!m || !drawing) return;
    const el = m.getContainer();
    m.dragging.disable();
    m.scrollWheelZoom.disable();
    let pts: L.Point[] = [];
    let line: L.Polyline | null = null;
    const pos = (e: PointerEvent) => m.mouseEventToContainerPoint(e as unknown as MouseEvent);
    const down = (e: PointerEvent) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      pts = [pos(e)];
      line = L.polyline([], { color: "#9e3039", weight: 2.5 }).addTo(m);
    };
    const move = (e: PointerEvent) => {
      if (!line) return;
      pts.push(pos(e));
      line.addLatLng(m.containerPointToLatLng(pts[pts.length - 1]));
    };
    const up = () => {
      if (!line) return;
      line.remove();
      line = null;
      const s = simplify(pts);
      setDrawing(false);
      if (s.length < 3) return;
      let ll = s.map((p) => m.containerPointToLatLng(p));
      while (ll.length > 60) ll = ll.filter((_, i) => i % 2 === 0);
      const z = ll.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join(";");
      const params = new URLSearchParams(query);
      params.set("zone", z);
      params.delete("page");
      router.push(`/?${params}`, { scroll: false });
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.style.cursor = "crosshair";
    el.style.touchAction = "none";
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.style.cursor = "";
      el.style.touchAction = "";
      m.dragging.enable();
      m.scrollWheelZoom.enable();
    };
  }, [drawing, query, router]);

  function clearZone() {
    const params = new URLSearchParams(query);
    params.delete("zone");
    params.delete("page");
    router.push(params.toString() ? `/?${params}` : "/", { scroll: false });
  }

  return (
    <div className={`mapwrap${full ? " full" : ""}`}>
      <div className="maptools">
        <button type="button" className={`btn small${drawing ? " primary" : ""}`} onClick={() => setDrawing((d) => !d)}>
          {drawing ? "Atcelt zīmēšanu" : "✎ Apvilkt zonu"}
        </button>
        {zone && <button type="button" className="btn small" onClick={clearZone}>Notīrīt zonu</button>}
        <button type="button" className="btn small" onClick={() => setFull((f) => !f)}>{full ? "✕ Aizvērt" : "⤢ Lielā karte"}</button>
        {count != null && <span className="fine">{count} kartē</span>}
      </div>
      {drawing && <div className="drawhint">Velc ar peli vai pirkstu ap vajadzīgo vietu</div>}
      <div ref={box} className="map" role="application" aria-label="Sludinājumu karte" />
    </div>
  );
}
