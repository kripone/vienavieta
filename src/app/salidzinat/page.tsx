import type { Metadata } from "next";
import { EvalBadge } from "@/components/eval-badge";
import { Ill } from "@/components/ill";
import { DEAL_LABEL, MAX_COMPARE, SOURCE_LABEL, VEHICLE_CLASS_LABEL, type VehicleClass } from "@/lib/constants";
import { formatNumber, formatPrice } from "@/lib/format";
import { listingIll } from "@/lib/illustrations";
import { landLabel } from "@/lib/listing-input";
import { getListing, locationLabel } from "@/lib/listings";
import { priceEvals } from "@/lib/price-eval";

export const metadata: Metadata = { title: "Salīdzināšana", robots: { index: false } };

type D = NonNullable<Awaited<ReturnType<typeof getListing>>>;
type Row = { label: string; value: (d: D) => React.ReactNode; best?: (d: D) => number | null; better?: "min" | "max" };

const n = (v: unknown) => (v == null || v === "" ? null : Number(v));
const area = (d: D) => n(d.l.areaM2);

export default async function ComparePage(props: { searchParams: Promise<{ ids?: string }> }) {
  const { ids = "" } = await props.searchParams;
  const list = [...new Set(ids.split(","))].filter((x) => /^[0-9a-f-]{36}$/.test(x)).slice(0, MAX_COMPARE);
  const found = (await Promise.all(list.map((id) => getListing(id)))).filter((d): d is D => Boolean(d && (d.l.status === "active" || d.l.status === "sold")));
  if (found.length < 2) {
    return (
      <main className="wrap">
        <h1>Salīdzināšana</h1>
        <div className="notice">Izvēlies vismaz divus sludinājumus ar pogu ⇄ Salīdzināt un spied "Salīdzināt" ekrāna apakšā.</div>
      </main>
    );
  }
  const kind = found[0].l.kind;
  const items = found.filter((d) => d.l.kind === kind);
  const evals = await priceEvals(items.map((d) => d.l.id)).catch(() => new Map());

  const common: Row[] = [
    { label: "Cena", value: (d) => <b>{formatPrice(d.l.price)}</b>, best: (d) => d.l.price, better: "min" },
    { label: "Cenas vērtējums", value: (d) => { const e = evals.get(d.l.id); return e ? <EvalBadge e={e} long /> : "—"; } },
  ];
  const vehicle: Row[] = [
    { label: "Veids", value: (d) => (d.l.vehicleClass ? VEHICLE_CLASS_LABEL[d.l.vehicleClass as VehicleClass] : "—") },
    { label: "Marka, modelis", value: (d) => [d.make ?? d.l.makeText, d.model ?? d.l.modelText].filter(Boolean).join(" ") || "—" },
    { label: "Gads", value: (d) => d.l.year ?? "—", best: (d) => d.l.year, better: "max" },
    { label: "Nobraukums", value: (d) => (d.l.mileageKm != null ? `${formatNumber(d.l.mileageKm)} km` : "—"), best: (d) => d.l.mileageKm, better: "min" },
    { label: "Degviela", value: (d) => d.l.fuel ?? "—" },
    { label: "Ātrumkārba", value: (d) => d.l.gearbox ?? "—" },
    { label: "Virsbūve", value: (d) => d.l.body ?? "—" },
    { label: "Tilpums", value: (d) => (d.l.engineL ? `${Number(d.l.engineL).toFixed(1)} L` : "—") },
    { label: "Jauda", value: (d) => (d.l.powerKw ? `${d.l.powerKw} kW` : "—"), best: (d) => d.l.powerKw, better: "max" },
    { label: "Piedziņa", value: (d) => d.l.drive ?? "—" },
    { label: "Krāsa", value: (d) => d.l.color ?? "—" },
  ];
  const property: Row[] = [
    { label: "Veids", value: (d) => d.l.propertyType ?? "—" },
    { label: "Darījums", value: (d) => (d.l.deal ? DEAL_LABEL[d.l.deal] : "—") },
    { label: "Platība", value: (d) => (area(d) ? `${area(d)} m²` : "—"), best: area, better: "max" },
    {
      label: "Cena par m²",
      value: (d) => (area(d) ? `${formatNumber(Math.round(d.l.price / area(d)!))} €` : "—"),
      best: (d) => (area(d) ? d.l.price / area(d)! : null),
      better: "min",
    },
    { label: "Istabas", value: (d) => d.l.rooms ?? "—", best: (d) => d.l.rooms, better: "max" },
    { label: "Stāvs", value: (d) => (d.l.floor != null ? `${d.l.floor}${d.l.floors ? "/" + d.l.floors : ""}` : "—") },
    { label: "Zeme", value: (d) => (d.l.landM2 ? landLabel(d.l.landM2) : "—"), best: (d) => d.l.landM2, better: "max" },
    { label: "Sērija", value: (d) => d.l.series ?? "—" },
    { label: "Stāvoklis", value: (d) => d.l.condition ?? "—" },
    { label: "Būvēts", value: (d) => d.l.builtYear ?? "—", best: (d) => d.l.builtYear, better: "max" },
  ];
  const rows: Row[] = [
    ...common,
    ...(kind === "vehicle" ? vehicle : property),
    { label: "Vieta", value: (d) => locationLabel(d.place, d.region, d.regionKind) || "—" },
    {
      label: "Avots",
      value: (d) =>
        d.l.source === "own" ? (
          "VienāVietā"
        ) : (
          <a href={d.l.externalUrl!} target="_blank" rel="nofollow noopener noreferrer">{SOURCE_LABEL[d.l.source] ?? d.l.source} ↗</a>
        ),
    },
  ];

  /** Labākā vērtība rindā (zaļi), ja vismaz divos ir dati. */
  const bestOf = (r: Row) => {
    if (!r.best) return null;
    const vals = items.map((d) => r.best!(d)).filter((v): v is number => v != null && Number.isFinite(v));
    if (vals.length < 2 || new Set(vals).size < 2) return null;
    return r.better === "min" ? Math.min(...vals) : Math.max(...vals);
  };

  return (
    <main className="wrap">
      <h1>Salīdzināšana</h1>
      <p className="lead">Zaļi iezīmēta labākā vērtība katrā rindā.</p>
      <div className="cmp-wrap">
        <table className="cmp">
          <thead>
            <tr>
              <th />
              {items.map((d) => (
                <td key={d.l.id}>
                  {d.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.photos[0].thumbUrl} alt="" />
                  ) : (
                    <Ill svg={listingIll(d.l)} />
                  )}
                  <a href={`/sludinajumi/${d.l.id}`} className="mod-title">{d.l.title}</a>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const best = bestOf(r);
              return (
                <tr key={r.label} className={best != null ? "best" : undefined}>
                  <th>{r.label}</th>
                  {items.map((d) => (
                    <td key={d.l.id} className={best != null && r.best!(d) === best ? "best" : undefined}>{r.value(d)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
