// Mini analītika virs meklēšanas rezultātiem: skaits, cenas mediāna, cenu sadalījuma grafiks (lēti / vidēji / dārgi)
// un cenu samazinājumi pēdējās 30 dienās. Dati: priceInsights (src/lib/search.ts).
import { getT } from "@/i18n/server";
import { formatNumber, formatPrice } from "@/lib/format";
import type { PriceInsights as Data } from "@/lib/search";

export async function PriceInsights({ d, flat, rent }: { d: Data; flat: Record<string, string>; rent?: boolean }) {
  const { t, tp } = await getT();
  const max = Math.max(...d.bins.map((b) => b[2]), 1);
  const href = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(Object.entries(flat).filter(([k]) => k !== "page"));
    for (const [k, v] of Object.entries(patch)) v == null ? p.delete(k) : p.set(k, v);
    return `/?${p}`;
  };
  const cls = (from: number, to: number) => ((from + to) / 2 < d.cheapMax ? "cheap" : (from + to) / 2 > d.dearMin ? "dear" : "mid");
  const unit = rent ? ` ${t("€/mēn.")}` : " €";
  const money = (v: number) => (rent ? `${formatNumber(v)}${unit}` : formatPrice(v));
  return (
    <section className="insights" aria-label={t("Cenu kopsavilkums")}>
      <p className="ins-lead">
        {t("Atrasti")} <b>{tp(d.n, "sludinājums", "sludinājumi")}</b>. {t("Tipiskā cena šiem parametriem (mediāna):")} <b className="ins-price">{money(d.median)}</b>
        <span className="fine"> · {t("lielākā daļa: {a} – {b}", { a: money(d.p25), b: money(d.p75) })}</span>
      </p>
      {d.drops > 0 && (
        <p className="ins-drop">▼ {t("Pēdējās 30 dienās cena samazināta {n} sludinājumiem", { n: formatNumber(d.drops) })}{d.dropPct != null ? ` (${t("vidēji −{p}%", { p: String(d.dropPct).replace(".", ",") })})` : ""}. <a href={href({ sort: "drop" })}>{t("Rādīt tos")} →</a></p>
      )}
      <div className="ins-chart" role="img" aria-label={t("Cenu sadalījums")}>
        {d.bins.map(([from, to, c], i) => (
          <span key={i} className={`ins-bar ${cls(from, to)}`} style={{ height: `${Math.max(c ? 6 : 2, (c / max) * 100)}%` }} title={`${formatNumber(from)}–${formatNumber(to)}${unit}: ${c}`} />
        ))}
      </div>
      <div className="ins-axis"><span>{money(d.lo)}</span><span>{t("mediāna")} {money(d.median)}</span><span>{money(d.hi)}</span></div>
      <div className="ins-legend">
        <a className="cheap" href={href({ pmax: String(d.cheapMax), pmin: null })}><b>{formatNumber(d.cheap)}</b> {t("lēti")}<small>{t("zem {p}", { p: money(d.cheapMax) })}</small></a>
        <a className="mid" href={href({ pmin: String(d.cheapMax), pmax: String(d.dearMin) })}><b>{formatNumber(d.mid)}</b> {t("vidēji")}<small>{money(d.cheapMax)} – {money(d.dearMin)}</small></a>
        <a className="dear" href={href({ pmin: String(d.dearMin), pmax: null })}><b>{formatNumber(d.dear)}</b> {t("dārgi")}<small>{t("virs {p}", { p: money(d.dearMin) })}</small></a>
      </div>
    </section>
  );
}
