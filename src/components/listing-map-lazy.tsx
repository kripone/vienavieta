"use client";
import dynamic from "next/dynamic";

// Leaflet strādā tikai pārlūkā
export const ListingMapLazy = dynamic(() => import("./listing-map").then((m) => m.ListingMap), {
  ssr: false,
  loading: () => <div className="map lmap loading" />,
});
