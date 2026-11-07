import { getT } from "@/i18n/server";
// Vienkārši SVG/HTML grafiki tirgus lapai (servera komponentes, bez bibliotēkām).
// Viena sērija katrā grafikā (krāsa: --car transportam, --home īpašumiem); tīkls un asis fonā;
// katram elementam <title> paskaidrojums uzbraucot; zem grafika tabulas skats.
import { formatNumber } from "@/lib/format";

const W = 640;
const fmt = (v: number) => formatNumber(Math.round(v));

/** "Glīts" ass solis: 1, 2, 2.5, 5 × 10^k. */
function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0];
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)!;
  const ticks: number[] = [];
  for (let t = 0; t <= max + step * 0.001; t += step) ticks.push(t);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

async function TableView({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  const { t } = await getT();
  return (
    <details className="chart-table">
      <summary>{t("Tabulas skats")}</summary>
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead><tr>{head.map((h) => <th key={h}>{t(h)}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </details>
  );
}

/** Stabiņi (piem. mediānas cena pa gadiem). */
export async function ColumnChart({ title, data, unit = "€", color = "var(--car)", xLabel }: { title: string; data: { label: string; value: number; n?: number }[]; unit?: string; color?: string; xLabel?: string }) {
  const { t, tp } = await getT();
  if (!data.length) return null;
  const H = 240, padL = 56, padR = 12, padT = 16, padB = 34;
  const ticks = niceTicks(Math.max(...data.map((d) => d.value)));
  const top = ticks[ticks.length - 1];
  const iw = W - padL - padR, ih = H - padT - padB;
  const slot = iw / data.length;
  const bw = Math.max(4, Math.min(28, slot - 6));
  const y = (v: number) => padT + ih - (v / top) * ih;
  const every = Math.ceil(data.length / 14);
  const maxI = data.reduce((m, d, i) => (d.value > data[m].value ? i : m), 0);
  return (
    <figure className="chart">
      <figcaption>{t(title)}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="grid" />
            <text x={padL - 6} y={y(t) + 4} className="tick" textAnchor="end">{fmt(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + slot * i + (slot - bw) / 2;
          const h = Math.max(1, padT + ih - y(d.value));
          return (
            <g key={d.label} className="mark">
              <rect x={padL + slot * i} y={padT} width={slot} height={ih} className="hit"><title>{`${d.label}: ${fmt(d.value)} ${unit}${d.n ? ` (${tp(d.n, "sludinājums", "sludinājumi")})` : ""}`}</title></rect>
              <path d={`M${x},${padT + ih} V${padT + ih - h + 4} q0,-4 4,-4 h${bw - 8} q4,0 4,4 V${padT + ih} Z`} fill={color} pointerEvents="none" />
              {i % every === 0 && <text x={x + bw / 2} y={H - padB + 16} className="tick" textAnchor="middle">{d.label}</text>}
              {i === maxI && <text x={x + bw / 2} y={y(d.value) - 6} className="val" textAnchor="middle">{fmt(d.value)}</text>}
            </g>
          );
        })}
        {xLabel && <text x={W - padR} y={H - 2} className="tick" textAnchor="end">{xLabel}</text>}
      </svg>
      <TableView caption={title} head={[xLabel ? t(xLabel) : "", `${t("Mediāna")}, ${unit}`, "Sludinājumi"]} rows={data.map((d) => [d.label, fmt(d.value), d.n ?? ""])} />
    </figure>
  );
}

/** Horizontālas joslas (markas, reģioni) — HTML, lai garie nosaukumi būtu lasāmi telefonā. */
export async function BarList({ title, data, unit = "€", color = "var(--car)", valueLabel = "Mediāna", hrefFor }: { title: string; data: { label: string; value: number; n: number; key?: string | number }[]; unit?: string; color?: string; valueLabel?: string; hrefFor?: (d: { label: string; key?: string | number }) => string }) {
  const { t, tp } = await getT();
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value));
  return (
    <figure className="chart">
      <figcaption>{t(title)}</figcaption>
      <ul className="barlist">
        {data.map((d) => (
          <li key={d.label} title={`${d.label}: ${t(valueLabel).toLowerCase()} ${fmt(d.value)} ${unit}, ${tp(d.n, "sludinājums", "sludinājumi")}`}>
            <span className="bl-label">{hrefFor ? <a href={hrefFor(d)}>{d.label}</a> : d.label}</span>
            <span className="bl-track"><span className="bl-bar" style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, background: color }} /></span>
            <span className="bl-val">{fmt(d.value)} {unit}<small> · {fmt(d.n)}</small></span>
          </li>
        ))}
      </ul>
      <TableView caption={title} head={["", `${t(valueLabel)}, ${unit}`, "Sludinājumi"]} rows={data.map((d) => [d.label, fmt(d.value), d.n])} />
    </figure>
  );
}

/** Punkti: cena pret nobraukumu. Katrs punkts ved uz sludinājumu. */
export async function ScatterChart({ title, points, color = "var(--car)" }: { title: string; points: { id: string; price: number; km: number; year: number | null }[]; color?: string }) {
  const { t } = await getT();
  if (points.length < 5) return null;
  const H = 280, padL = 56, padR = 16, padT = 14, padB = 34;
  const xt = niceTicks(Math.max(...points.map((p) => p.km)));
  const yt = niceTicks(Math.max(...points.map((p) => p.price)));
  const iw = W - padL - padR, ih = H - padT - padB;
  const x = (v: number) => padL + (v / xt[xt.length - 1]) * iw;
  const y = (v: number) => padT + ih - (v / yt[yt.length - 1]) * ih;
  return (
    <figure className="chart">
      <figcaption>{t(title)}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        {yt.map((t) => (
          <g key={`y${t}`}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="grid" />
            <text x={padL - 6} y={y(t) + 4} className="tick" textAnchor="end">{fmt(t)}</text>
          </g>
        ))}
        {xt.map((t) => <text key={`x${t}`} x={x(t)} y={H - padB + 16} className="tick" textAnchor="middle">{fmt(t / 1000)}</text>)}
        <text x={W - padR} y={H - 2} className="tick" textAnchor="end">{t("tūkst. km")}</text>
        {points.map((p) => (
          <a key={p.id} href={`/sludinajumi/${p.id}`}>
            <circle cx={x(p.km)} cy={y(p.price)} r={4.5} fill={color} className="dot">
              <title>{`${fmt(p.price)} € · ${fmt(p.km)} km${p.year ? ` · ${p.year}` : ""}`}</title>
            </circle>
          </a>
        ))}
      </svg>
    </figure>
  );
}

/** Mediāna laikā ar 25.–75. procentiles joslu. */
export async function TrendChart({ title, points, unit = "€", color = "var(--car)" }: { title: string; points: { day: string; median: number; p25: number; p75: number; n: number }[]; unit?: string; color?: string }) {
  const { t, tp } = await getT();
  if (points.length < 2) {
    return (
      <figure className="chart">
        <figcaption>{t(title)}</figcaption>
        <p className="fine">
          {t("Cenu dinamika veidojas: tirgus momentuzņēmumu saglabājam katru dienu.")}{points[0] ? ` (${points[0].day}: ${t("mediāna")} ${fmt(points[0].median)} ${unit})` : ""} {t("Grafiks parādīsies pēc otrās dienas.")}
        </p>
      </figure>
    );
  }
  const H = 220, padL = 56, padR = 16, padT = 14, padB = 30;
  const lo = Math.min(...points.map((p) => p.p25)), hi = Math.max(...points.map((p) => p.p75));
  const yt = niceTicks(hi);
  const ymin = Math.max(0, yt.find((t, i) => yt[i + 1] > lo) ?? 0);
  const ymax = yt[yt.length - 1];
  const iw = W - padL - padR, ih = H - padT - padB;
  const x = (i: number) => padL + (i / (points.length - 1)) * iw;
  const y = (v: number) => padT + ih - ((v - ymin) / (ymax - ymin || 1)) * ih;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.median)}`).join(" ");
  const band = `${points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.p75)}`).join(" ")} ${[...points].reverse().map((p, j) => `L${x(points.length - 1 - j)},${y(p.p25)}`).join(" ")} Z`;
  const every = Math.ceil(points.length / 8);
  const last = points[points.length - 1];
  return (
    <figure className="chart">
      <figcaption>{t(title)}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        {yt.filter((t) => t >= ymin).map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="grid" />
            <text x={padL - 6} y={y(t) + 4} className="tick" textAnchor="end">{fmt(t)}</text>
          </g>
        ))}
        <path d={band} fill={color} opacity={0.14} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={p.day}>
            <rect x={x(i) - iw / points.length / 2} y={padT} width={iw / points.length} height={ih} className="hit"><title>{`${p.day}: ${t("mediāna")} ${fmt(p.median)} ${unit} (25–75 %: ${fmt(p.p25)}–${fmt(p.p75)}), ${tp(p.n, "sludinājums", "sludinājumi")}`}</title></rect>
            {i % every === 0 && <text x={x(i)} y={H - 8} className="tick" textAnchor="middle">{p.day.slice(5)}</text>}
          </g>
        ))}
        <circle cx={x(points.length - 1)} cy={y(last.median)} r={4} fill={color} stroke="var(--surface)" strokeWidth={2} />
        <text x={x(points.length - 1) - 6} y={y(last.median) - 8} className="val" textAnchor="end">{fmt(last.median)}</text>
      </svg>
      <TableView caption={title} head={["Diena", `${t("Mediāna")}, ${unit}`, "25 %", "75 %", "Sludinājumi"]} rows={points.map((p) => [p.day, fmt(p.median), fmt(p.p25), fmt(p.p75), p.n])} />
    </figure>
  );
}
