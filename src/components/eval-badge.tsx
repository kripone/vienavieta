import { formatNumber, formatPrice } from "@/lib/format";

// mazas €/m² vērtības (zeme, īre) ar decimāldaļām, lai „mediāna 0 €/m²” neparādās
const money = (e: PriceEval) => (e.perM2 && e.median < 100 ? `${formatNumber(e.median, 2)} €/m²` : `${formatPrice(e.median)}${e.perM2 ? "/m²" : ""}`);
import type { PriceEval } from "@/lib/price-eval";
import { getT } from "@/i18n/server";

/** "Laba cena / Tirgus cena / Virs tirgus" ar paskaidrojumu. */
export async function EvalBadge({ e, long }: { e: PriceEval; long?: boolean }) {
  const { t } = await getT();
  const pct = Math.round((e.ratio - 1) * 100);
  const diff = pct === 0 ? t("kā mediāna") : pct < 0 ? t("{p} % zem mediānas", { p: -pct }) : t("{p} % virs mediānas", { p: pct });
  const basis = t("{n} līdzīgi sludinājumi, mediāna {m}", { n: e.n, m: money(e) });
  if (!long) return <span className={`eb ${e.cls}`} title={`${diff}; ${basis}`}>{t(e.label)}</span>;
  // Skala: mediāna vienmēr pa vidu; attiecība 0,5–1,5 kartējas uz 0–100 %
  const pos = Math.min(96, Math.max(4, Math.round((e.ratio - 0.5) * 100)));
  return (
    <div className="pv">
      <div className="pv-top">
        <span className="pv-title">{t("Cena pret tirgu")}</span>
        <span className={`pv-badge ${e.cls}`}>{t(e.label)} · {diff}</span>
      </div>
      <div className="pv-track" role="img" aria-label={`${t(e.label)}: ${diff}. ${basis}`}>
        <span className="pv-median">
          <i>{t("mediāna {m}", { m: money(e) })}</i>
        </span>
        <span className="pv-dot" style={{ left: `${pos}%` }} />
      </div>
      <div className="pv-scale"><span>{t("lētāk")}</span><span>{t("dārgāk")}</span></div>
      <div className="pv-note">
        {e.scope === "place" ? t("Salīdzināts ar {n} sludinājumiem tajā pašā vietā (€/m²).", { n: e.n }) : e.scope === "region" ? t("Salīdzināts ar {n} sludinājumiem reģionā (€/m²).", { n: e.n }) : t("Salīdzināts ar {n} līdzīgiem sludinājumiem.", { n: e.n })}
      </div>
    </div>
  );
}
