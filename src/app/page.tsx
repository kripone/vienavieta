import type { Metadata } from "next";
import { SearchView, type SP } from "@/components/search-view";
import { JsonLd } from "@/components/json-ld";
import { appBase } from "@/lib/seo";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

/** Sākumlapa bez filtriem tiek indeksēta; ar ?filtriem — nē (meklētājiem ir SEO lapas /auto, /ipasumi …). */
export async function generateMetadata(props: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await props.searchParams;
  const filtered = Object.values(sp).some((v) => v != null && v !== "");
  if (filtered) return { robots: { index: false, follow: true } };
  const { t } = await getT();
  return {
    title: { absolute: `VienāVietā – ${t("Visi Latvijas sludinājumi vienā meklētājā")}` },
    description: t("Auto, moto, dzīvokļi, mājas un zeme no ss.com, autoplius.lt un citiem portāliem vienā meklētājā. Cenu vēsture, cenu kritumi un reālās darījumu cenas."),
    alternates: { canonical: "/" },
  };
}

export default async function SearchPage(props: { searchParams: Promise<SP> }) {
  const raw = await props.searchParams;
  const home = !Object.values(raw).some((v) => v != null && v !== "");
  return (
    <>
      {home && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "WebSite", name: "VienāVietā", url: `${appBase()}/`, potentialAction: { "@type": "SearchAction", target: `${appBase()}/?q={search_term_string}`, "query-input": "required name=search_term_string" } },
            { "@type": "Organization", name: "VienāVietā", url: `${appBase()}/`, logo: `${appBase()}/icons/icon-512.png`, email: "info@vienavieta.lv" },
          ],
        }} />
      )}
      <SearchView raw={raw} />
    </>
  );
}
