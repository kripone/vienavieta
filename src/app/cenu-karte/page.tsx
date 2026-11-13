// Dzīvokļu cenu karte pa apkaimēm (src/lib/price-map.ts).
import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { INTL_LOCALE } from "@/i18n/core";
import { formatNumber } from "@/lib/format";
import { langAlternates, regionName } from "@/lib/seo";
import { flatPriceMap, PRICE_MAP_MIN, type PriceMapDeal } from "@/lib/price-map";
import { PriceMapLazy } from "@/components/price-map-lazy";
import { PRICE_RAMP } from "@/lib/constants";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ d?: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { t, locale } = await getT();
  const rent = (await props.searchParams).d === "ire";
  return {
    title: rent ? t("Dzīvokļu īres cenu karte") : t("Dzīvokļu cenu karte"),
    description: t("Dzīvokļu cenas par kvadrātmetru Rīgas apkaimēs un Latvijas pilsētās: mediāna no aktīvajiem sludinājumiem."),
    alternates: langAlternates("/cenu-karte", locale),
    robots: rent ? { index: false, follow: true } : undefined,
  };
}

export default async function PriceMapPage(props: Props) {
  const { t, lp, locale } = await getT();
  const deal: PriceMapDeal = (await props.searchParams).d === "ire" ? "rent" : "sell";
  const { places, breaks, total } = await flatPriceMap(deal);
  const unit = deal === "sell" ? "€/m²" : t("€/m² mēnesī");
  const fmt = (v: number) => (deal === "sell" ? formatNumber(v) : v.toFixed(1).replace(".", ","));
  const href = (id: number) => lp(`/?cat=property&ptype=Dzīvoklis&deal=${deal}&loc=p:${id}`);
  const legend = breaks.length
    ? [`< ${fmt(breaks[0])}`, ...breaks.slice(0, -1).map((b, i) => `${fmt(b)}–${fmt(breaks[i + 1])}`), `≥ ${fmt(breaks.at(-1)!)}`]
    : [];
  // ja kvintiles sakrīt, pakāpju ir mazāk: krāsas izvēlamies vienmērīgi no skalas
  const color = (level: number) => (breaks.length ? Math.round((level / breaks.length) * 4) : 2);

  return (
    <main className="wrap pricemap">
      <h1>{deal === "sell" ? t("Dzīvokļu cenu karte") : t("Dzīvokļu īres cenu karte")}</h1>
      <p className="lead">
        {t("Cik maksā kvadrātmetrs katrā apkaimē un pilsētā: mediāna no {n} aktīvajiem sludinājumiem. Uzspied uz apļa, lai redzētu sludinājumus.", { n: formatNumber(total) })}
      </p>
      {places.length > 1 && (
        // datēts kopsavilkums citēšanai
        <p className="facts">
          <time dateTime={new Date().toISOString().slice(0, 10)}>{new Date().toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Riga" })}</time>
          {": "}
          {t("dārgākā vieta {a} ({x} {u}), lētākā {b} ({y} {u}); {n} vietas ar vismaz {k} sludinājumiem.", { a: places[0].name, x: fmt(places[0].median), b: places.at(-1)!.name, y: fmt(places.at(-1)!.median), u: unit, n: String(places.length), k: String(PRICE_MAP_MIN) })}{" "}
          <a href={lp("/dati")}>{t("Kā skaitām")}</a>
        </p>
      )}
      <nav className="seg pm-seg" aria-label={t("Darījums")}>
        <a href={lp("/cenu-karte")} aria-current={deal === "sell" ? "page" : undefined}>{t("Pārdošana")}</a>
        <a href={lp("/cenu-karte?d=ire")} aria-current={deal === "rent" ? "page" : undefined}>{t("Īre")}</a>
      </nav>

      {places.length === 0 ? <p className="muted">{t("Pagaidām nav pietiekami daudz datu.")}</p> : (
        <>
          <div className="pm-legend" aria-label={unit}>
            <span className="pm-unit">{unit}</span>
            {legend.map((l, i) => (
              <span key={l} className="pm-key"><i style={{ background: PRICE_RAMP[color(i)] }} />{l}</span>
            ))}
          </div>
          <PriceMapLazy unit={unit} places={places.map((p) => ({ id: p.id, name: p.name, lat: p.lat, lon: p.lon, n: p.n, label: fmt(p.median), level: color(p.level), href: href(p.id) }))} />
          <p className="fine">{t("Apļa lielums rāda sludinājumu skaitu. Vietas ar mazāk nekā {n} sludinājumiem nav parādītas. Tās ir piedāvājuma cenas, nevis darījumu cenas.", { n: String(PRICE_MAP_MIN) })}</p>

          <h2>{t("Visas vietas")}</h2>
          <div className="table-scroll">
            <table className="pm-table">
              <thead><tr><th>{t("Vieta")}</th><th>{unit}</th><th>{t("Sludinājumi")}</th></tr></thead>
              <tbody>
                {places.map((p) => (
                  <tr key={p.id}>
                    <td><i className="pm-dot" style={{ background: PRICE_RAMP[color(p.level)] }} /><a href={href(p.id)}>{p.name}</a>{p.region !== p.name && <small> · {regionName(p.region, locale)}</small>}</td>
                    <td>{fmt(p.median)}</td>
                    <td>{formatNumber(p.n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
