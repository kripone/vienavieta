"use client";
import dynamic from "next/dynamic";

// Leaflet strādā tikai pārlūkā, tāpēc karti ielādējam bez servera renderēšanas
export const SearchMapLazy = dynamic(() => import("./search-map").then((m) => m.SearchMap), {
  ssr: false,
  loading: () => <div className="mapwrap"><div className="map loading">Ielādē karti…</div></div>,
});
