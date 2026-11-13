"use client";
import { useT } from "@/i18n/client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Supercluster from "supercluster";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GOOGLE_KEY } from "@/lib/google-tiles";
import { addGoogleLayers, STREETS_ATTR } from "./map-layers";

type Point = [string, number, number, 1 | 2, number, string];

const STREETS = process.env.NEXT_PUBLIC_MAP_TILES_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const SATELLITE = process.env.NEXT_PUBLIC_MAP_SATELLITE_URL || "";
const SATELLITE_ATTR = process.env.NEXT_PUBLIC_MAP_SATELLITE_ATTRIBUTION || "";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const fmt = new Intl.NumberFormat("lv-LV");
type Props = { id: string; kind: 1 | 2; price: number; title: string };
/** Skaits burbulī: 150, 2,5k, 12k. */
const short = (n: number) => (n < 1000 ? String(n) : n < 10000 ? `${(Math.floor(n / 100) / 10).toString().replace(".", ",")}k` : `${Math.floor(n / 1000)}k`);
const popupHtml = (p: Props) => `<a href="/sludinajumi/${p.id}" style="font-weight:700">${esc(p.title)}</a><br>${fmt.format(p.price)} €`;

/** Vienkāršo zīmēto līniju: atstāj punktus, kas ir vismaz `min` pikseļu attālumā. */
function simplify(pts: L.Point[], min = 8) {
  const out: L.Point[] = [];
  for (const p of pts) if (!out.length || out[out.length - 1].distanceTo(p) >= min) out.push(p);
  return out;
}

export function SearchMap({ query, zone }: { query: string; zone?: string }) {
  const { t } = useT();
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const zoneLayer = useRef<L.Polygon | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [full, setFull] = useState(false);

  // punktu rādiuss pēc tālummaiņas: tālu mazi (lai karte redzama), tuvu lielāki
  const radiusFor = (z: number) => (z >= 15 ? 7 : z >= 12 ? 5.5 : z >= 9 ? 4 : 3);

  // kartes izveide
  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, { center: [56.0, 24.0], zoom: 6, minZoom: 6, maxZoom: 18, zoomControl: true, worldCopyJump: false, renderer: L.canvas() });
    if (GOOGLE_KEY) addGoogleLayers(m);
    else {
      const streets = L.tileLayer(STREETS, { attribution: STREETS_ATTR, maxZoom: 19 }).addTo(m);
      if (SATELLITE) {
        const sat = L.tileLayer(SATELLITE, { attribution: SATELLITE_ATTR, maxZoom: 19 });
        L.control.layers({ "Karte": streets, "Satelīts": sat }, {}, { position: "topright" }).addTo(m);
      }
    }
    m.setMaxBounds([[53.3, 19.5], [58.8, 29.5]]); // Latvija un Lietuva
    markers.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // punkti: tuvu esošie apvienoti burbulī ar skaitu; tuvinot sadalās pa sludinājumiem
  const index = useRef<Supercluster<Props> | null>(null);
  const draw = useRef<() => void>(() => {});
  useEffect(() => {
    const m = map.current;
    if (!m || !markers.current) return;
    let alive = true;
    draw.current = () => {
      const g = markers.current, idx = index.current;
      if (!g || !idx) return;
      g.clearLayers();
      const b = m.getBounds().pad(0.2), z = Math.round(m.getZoom());
      for (const c of idx.getClusters([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], z)) {
        const [lon, lat] = c.geometry.coordinates;
        const cp = c.properties as Supercluster.ClusterProperties & Props;
        if (!cp.cluster) {
          L.circleMarker([lat, lon], { radius: radiusFor(z) + 1.5, weight: 1.5, color: "#fff", fillColor: cp.kind === 1 ? "#2f5fa8" : "#2f8a64", fillOpacity: 0.95 }).bindPopup(popupHtml(cp)).addTo(g);
          continue;
        }
        const n = cp.point_count, size = n < 10 ? 28 : n < 100 ? 34 : n < 1000 ? 40 : 48;
        const mk = L.marker([lat, lon], { icon: L.divIcon({ className: "mcluster", html: `<span style="width:${size}px;height:${size}px">${short(n)}</span>`, iconSize: [size, size] }), keyboard: false }).addTo(g);
        mk.on("click", () => {
          const to = idx.getClusterExpansionZoom(cp.cluster_id);
          if (to <= m.getMaxZoom() && z < m.getMaxZoom()) { m.setView([lat, lon], Math.max(to, z + 1)); return; }
          // vienā vietā vairāki sludinājumi: saraksts
          const leaves = idx.getLeaves(cp.cluster_id, 8);
          const more = n > leaves.length ? `<div style="margin-top:6px;color:#5d6475">${esc(t("un vēl {n}", { n: n - leaves.length }))}</div>` : "";
          L.popup({ maxHeight: 240 }).setLatLng([lat, lon]).setContent(leaves.map((l) => `<div style="margin-bottom:6px">${popupHtml(l.properties)}</div>`).join("") + more).openOn(m);
        });
      }
    };
    fetch(`/api/search/points?${query}`).then((r) => r.json()).then((pts: Point[]) => {
      if (!alive) return;
      setCount(pts.length);
      index.current = new Supercluster<Props>({ radius: 84, maxZoom: 18, minPoints: 2 }).load(
        pts.map(([id, lat, lon, kind, price, title]) => ({ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [lon, lat] }, properties: { id, kind, price, title } })));
      draw.current();
    }).catch(() => {});
    const redraw = () => draw.current();
    m.on("moveend", redraw);
    return () => { alive = false; m.off("moveend", redraw); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          {drawing ? t("Atcelt zīmēšanu") : `✎ ${t("Apvilkt zonu")}`}
        </button>
        {zone && <button type="button" className="btn small" onClick={clearZone}>{t("Notīrīt zonu")}</button>}
        <button type="button" className="btn small" onClick={() => setFull((f) => !f)}>{full ? `✕ ${t("Aizvērt")}` : `⤢ ${t("Lielā karte")}`}</button>
        {count != null && <span className="fine">{t("{n} kartē", { n: count })}</span>}
        {count === 0 && /(^|&)cat=vehicle(&|$)/.test(query) && (
          <span className="fine">{t("· ss.com auto sarakstā vieta nav norādīta, tāpēc tie kartē nav redzami")}</span>
        )}
      </div>
      {drawing && <div className="drawhint">{t("Velc ar peli vai pirkstu ap vajadzīgo vietu")}</div>}
      <div ref={box} className="map" role="application" aria-label={t("Sludinājumu karte")} />
    </div>
  );
}
