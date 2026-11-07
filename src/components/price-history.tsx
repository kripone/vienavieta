import { formatPrice, plural } from "@/lib/format";
import type { HistoryPoint } from "@/lib/history";

const fmtDate = (d: Date) => d.toLocaleDateString("lv-LV", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Riga" });

/** Sludinājuma vēsture: kopsavilkums, pakāpju grafiks un izmaiņu saraksts. */
export function PriceHistory({ h, external }: { h: { points: HistoryPoint[]; first: number; changes: number; days: number; min: number; max: number }; external: boolean }) {
  const now = h.points[h.points.length - 1].price;
  const diff = now - h.first;
  const pct = h.first ? Math.round((diff / h.first) * 100) : 0;
  return (
    <section className="hist" id="vesture">
      <h2>Vēsture</h2>
      <div className="stat-row">
        <div className="stat"><b>{plural(h.days, "diena", "dienas")}</b><span>tirgū{external ? "*" : ""}</span></div>
        <div className="stat"><b>{formatPrice(h.first)}</b><span>sākuma cena</span></div>
        <div className="stat"><b>{h.changes}</b><span>cenas izmaiņas</span></div>
        <div className="stat">
          <b className={diff < 0 ? "down" : diff > 0 ? "up" : ""}>{diff === 0 ? "—" : `${diff < 0 ? "−" : "+"}${formatPrice(Math.abs(diff))}`}</b>
          <span>{diff === 0 ? "cena nav mainīta" : `${pct > 0 ? "+" : pct < 0 ? "−" : ""}${Math.abs(pct)}% no sākuma`}</span>
        </div>
      </div>
      {h.changes > 0 && <Steps points={h.points} min={h.min} max={h.max} />}
      {h.changes > 0 && (
        <ol className="hist-list">
          {[...h.points].reverse().map((p, i, arr) => {
            const prev = arr[i + 1];
            const d = prev ? p.price - prev.price : 0;
            return (
              <li key={i}>
                <span className="fine">{fmtDate(p.at)}</span> <b>{formatPrice(p.price)}</b>{" "}
                {prev ? <span className={d < 0 ? "down" : "up"}>{d < 0 ? "▼" : "▲"} {formatPrice(Math.abs(d))}</span> : <span className="fine">sākuma cena</span>}
              </li>
            );
          })}
        </ol>
      )}
      {external && <p className="fine">* Skaitīts no brīža, kad sludinājumu pirmo reizi redzējām portālā.</p>}
    </section>
  );
}

function Steps({ points, min, max }: { points: HistoryPoint[]; min: number; max: number }) {
  const W = 600, H = 140, P = 8;
  const t0 = points[0].at.getTime();
  const t1 = Math.max(Date.now(), t0 + 1);
  const pad = (max - min) * 0.15 || max * 0.05 || 1;
  const lo = min - pad, hi = max + pad;
  const x = (t: number) => P + ((t - t0) / (t1 - t0)) * (W - 2 * P);
  const y = (v: number) => P + (1 - (v - lo) / (hi - lo)) * (H - 2 * P);
  let d = `M${x(t0)},${y(points[0].price)}`;
  for (const p of points.slice(1)) d += ` H${x(p.at.getTime())} V${y(p.price)}`;
  d += ` H${x(t1)}`;
  return (
    <svg className="hist-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cena no ${formatPrice(points[0].price)} līdz ${formatPrice(points[points.length - 1].price)}`}>
      <path d={d} fill="none" stroke="var(--car)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => (
        <circle key={i} cx={x(p.at.getTime())} cy={y(p.price)} r="4" fill="var(--car)">
          <title>{`${fmtDate(p.at)}: ${formatPrice(p.price)}`}</title>
        </circle>
      ))}
    </svg>
  );
}
