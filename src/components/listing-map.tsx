"use client";
// Sludinājuma atrašanās vieta kartē. Precīza adrese (ģeokodēta) → atzīme; aptuvena (tikai apkaime/pagasts) → aplis.
// Ielu skats (tikai precīzai adresei): Google Maps Embed API lapā, ja NEXT_PUBLIC_STREETVIEW_EMBED=on
// (Cloud konsolē jābūt ieslēgtam "Maps Embed API"), citādi saite uz Google Maps ielu skatu.
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/client";
import { GOOGLE_KEY } from "@/lib/google-tiles";
import { addGoogleLayers, STREETS_ATTR } from "./map-layers";

const SV_EMBED = process.env.NEXT_PUBLIC_STREETVIEW_EMBED === "on" && Boolean(GOOGLE_KEY);

export function ListingMap({ lat, lon, exact }: { lat: number; lon: number; exact: boolean }) {
  const { t, locale } = useT();
  const box = useRef<HTMLDivElement>(null);
  const [street, setStreet] = useState(false);

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

  const ll = `${lat.toFixed(5)},${lon.toFixed(5)}`;
  const gmaps = `https://www.google.com/maps/search/?api=1&query=${ll}`;
  const pano = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${ll}`;
  return (
    <section className="listing-map" id="karte">
      <div className="lmap-head">
        <h2>{t("Atrašanās vieta")}</h2>
        {exact && (
          <div className="lmap-switch" role="tablist">
            <button type="button" role="tab" aria-selected={!street} className={street ? "" : "on"} onClick={() => setStreet(false)}>🗺️ {t("Karte")}</button>
            {SV_EMBED ? (
              <button type="button" role="tab" aria-selected={street} className={street ? "on" : ""} onClick={() => setStreet(true)}>🚶 {t("Ielu skats")}</button>
            ) : (
              <a href={pano} rel="noopener noreferrer">🚶 {t("Ielu skats")} ↗</a>
            )}
          </div>
        )}
      </div>
      <div ref={box} className="map lmap" role="img" aria-label={t("Atrašanās vieta")} hidden={street} />
      {street && (
        <iframe
          className="lmap sv"
          title={t("Ielu skats")}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          src={`https://www.google.com/maps/embed/v1/streetview?key=${GOOGLE_KEY}&location=${ll}&fov=90&language=${locale}`}
        />
      )}
      <p className="fine">
        {exact ? t("Atzīme pēc sludinājumā norādītās adreses.") : t("Aptuvena vieta: sludinājumā nav precīzas adreses, rādām apkaimi vai pagastu.")}{" "}
        <a href={gmaps} rel="noopener noreferrer">{t("Atvērt Google Maps")} ↗</a>
      </p>
    </section>
  );
}
