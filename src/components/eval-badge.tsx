import { formatPrice } from "@/lib/format";
import type { PriceEval } from "@/lib/price-eval";
import { getT } from "@/i18n/server";

/** "Laba cena / Tirgus cena / Virs tirgus" ar paskaidrojumu. */
export async function EvalBadge({ e, long }: { e: PriceEval; long?: boolean }) {
  const { t } = await getT();
  const pct = Math.round((e.ratio - 1) * 100);
  const diff = pct === 0 ? t("kā mediāna") : pct < 0 ? t("{p} % zem mediānas", { p: -pct }) : t("{p} % virs mediānas", { p: pct });
  const basis = t("{n} līdzīgi sludinājumi, mediāna {m}", { n: e.n, m: `${formatPrice(e.median)}${e.perM2 ? "/m²" : ""}` });
  if (!long) return <span className={`eb ${e.cls}`} title={`${diff}; ${basis}`}>{t(e.label)}</span>;
  return (
    <div className="eval-long">
      <span className={`eb ${e.cls}`}>{t(e.label)}</span> <span>{diff}</span>
      <div className="fine">{t("Salīdzināts ar {b}.", { b: basis })}</div>
    </div>
  );
}
