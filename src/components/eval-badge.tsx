import { formatPrice } from "@/lib/format";
import type { PriceEval } from "@/lib/price-eval";

/** "Laba cena / Tirgus cena / Virs tirgus" ar paskaidrojumu. */
export function EvalBadge({ e, long }: { e: PriceEval; long?: boolean }) {
  const pct = Math.round((e.ratio - 1) * 100);
  const diff = pct === 0 ? "kā mediāna" : pct < 0 ? `${-pct} % zem mediānas` : `${pct} % virs mediānas`;
  const basis = `${e.n} līdzīgi sludinājumi, mediāna ${formatPrice(e.median)}${e.perM2 ? "/m²" : ""}`;
  if (!long) return <span className={`eb ${e.cls}`} title={`${diff}; ${basis}`}>{e.label}</span>;
  return (
    <div className="eval-long">
      <span className={`eb ${e.cls}`}>{e.label}</span> <span>{diff}</span>
      <div className="fine">Salīdzināts ar {basis}.</div>
    </div>
  );
}
