"use client";
import dynamic from "next/dynamic";

// Leaflet strādā tikai pārlūkā
export const PriceMapLazy = dynamic(() => import("./price-map").then((m) => m.PriceMap), {
  ssr: false,
  loading: () => <div className="mapwrap"><div className="map pmap loading" /></div>,
});
