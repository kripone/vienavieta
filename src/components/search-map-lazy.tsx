"use client";
import { useT } from "@/i18n/client";
import dynamic from "next/dynamic";

function MapLoading() {
  const { t } = useT();
  return <div className="mapwrap"><div className="map loading">{t("Ielādē karti…")}</div></div>;
}

// Leaflet strādā tikai pārlūkā, tāpēc karti ielādējam bez servera renderēšanas
export const SearchMapLazy = dynamic(() => import("./search-map").then((m) => m.SearchMap), {
  ssr: false,
  loading: () => <MapLoading />,
});
