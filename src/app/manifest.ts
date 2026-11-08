import type { MetadataRoute } from "next";

// PWA: portālu var "instalēt" telefonā (sākuma ekrāns, pilnekrāns, push paziņojumi).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "VienāVietā – visi sludinājumi vienā meklētājā",
    short_name: "VienāVietā",
    description: "Auto, moto un nekustamā īpašuma sludinājumi no visiem portāliem vienā vietā.",
    lang: "lv",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3f4f7",
    theme_color: "#9e3039",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Favorīti", url: "/favoriti", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Paziņojumi", url: "/pazinojumi", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Pievienot sludinājumu", url: "/pievienot", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
