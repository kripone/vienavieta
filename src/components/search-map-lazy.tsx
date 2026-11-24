"use client";
import { useT } from "@/i18n/client";
import dynamic from "next/dynamic";
import { useEffect, useState, type ComponentProps } from "react";

function MapLoading() {
  const { t } = useT();
  return <div className="mapwrap"><div className="map loading">{t("Ielādē karti…")}</div></div>;
}

// Leaflet strādā tikai pārlūkā, tāpēc karti ielādējam bez servera renderēšanas
const SearchMap = dynamic(() => import("./search-map").then((m) => m.SearchMap), {
  ssr: false,
  loading: () => <MapLoading />,
});

const MOBILE = "(max-width: 560px)";

/**
 * Datorā karte ielādējas uzreiz. Telefonā tā aizņemtu pirmo ekrānu un būtu lēnākais elements (LCP),
 * tāpēc tur rādām pogu un karti ielādējam tikai pēc pieskāriena (vai uzreiz, ja meklēšanā ir zona).
 * Kurš variants redzams pirms JS, nosaka CSS (.map-gate), lai lapa nelēkā.
 */
export function SearchMapLazy(props: ComponentProps<typeof SearchMap>) {
  const { t } = useT();
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(!!props.zone);
  useEffect(() => {
    if (open || !window.matchMedia(MOBILE).matches) setShow(true);
  }, [open]);
  return (
    <div className={`map-gate${open ? " open" : ""}`}>
      {!open && (
        <button type="button" className="btn map-open" onClick={() => setOpen(true)}>
          🗺️ {t("Rādīt karti")}
        </button>
      )}
      <div className="map-slot">{show ? <SearchMap {...props} /> : <MapLoading />}</div>
    </div>
  );
}
