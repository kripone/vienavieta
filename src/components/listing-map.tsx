"use client";
// Sludinājuma atrašanās vieta kartē. Precīza adrese (ģeokodēta) → atzīme; aptuvena (tikai apkaime/pagasts) → aplis.
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { useT } from "@/i18n/client";
import { GOOGLE_KEY } from "@/lib/google-tiles";
import { addGoogleLayers, STREETS_ATTR } from "./map-layers";

export function ListingMap({ lat, lon, exact }: { lat: number; lon: number; exact: boolean }) {
  const { t } = useT();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!box.current) return;
    const m = L.map(box.current, { center: [lat, lon], zoom: exact ? 16 : 14, minZoom: 7, maxZoom: 19, scrollWheelZoom: false });
    if (GOOGLE_KEY) addGoogleLayers(m);
    else L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: STREETS_ATTR, maxZoom: 19 }).addTo(m);
    const color = getComputedStyle(document.documentElement).getPropertyValue("--home").trim() || "#2f8a64";
    if (exact) {
      L.circleMarker([lat, lon], { radius: 10, color: "#fff", weight: 3, fillColor: color, fillOpacity: 1 }).addTo(m);
    } else {
      const c = L.circle([lat, lon], { radius: 700, color, weight: 2, fillColor: color, fillOpacity: 0.15 }).addTo(m);
      m.fitBounds(c.getBounds(), { padding: [10, 10] });
    }
    return () => { m.remove(); };
  }, [lat, lon, exact]);

  const gmaps = `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(5)},${lon.toFixed(5)}`;
  return (
    <section className="listing-map" id="karte">
      <h2>{t("Atrašanās vieta")}</h2>
      <div ref={box} className="map lmap" role="img" aria-label={t("Atrašanās vieta")} />
      <p className="fine">
        {exact ? t("Atzīme pēc sludinājumā norādītās adreses.") : t("Aptuvena vieta: sludinājumā nav precīzas adreses, rādām apkaimi vai pagastu.")}{" "}
        <a href={gmaps} rel="noopener noreferrer">{t("Atvērt Google Maps")} ↗</a>
      </p>
    </section>
  );
}
