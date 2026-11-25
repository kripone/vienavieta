// „Īsumā” sludinājuma lapā: 1–3 teikumi no mūsu pašu datiem (parametri, cenas salīdzinājums, VZD darījumi).
// Bez AI un bez pārdevēja teksta (citu portālu aprakstus neņemam), tāpēc nekad neko neizdomā.
import type { T, TP } from "@/i18n/core";
import { trTitle } from "@/i18n/content";
import { formatNumber, formatPrice } from "./format";
import type { PriceEval } from "./price-eval";
import { landLabel } from "./listing-input";

type L = {
  kind: string;
  year: number | null;
  engineL: string | null;
  fuel: string | null;
  gearbox: string | null;
  powerKw: number | null;
  mileageKm: number | null;
  body: string | null;
  makeText: string | null;
  modelText: string | null;
  propertyType: string | null;
  areaM2: string | null;
  rooms: number | null;
  floor: number | null;
  floors: number | null;
  series: string | null;
  builtYear: number | null;
  landM2: number | null;
  deal: string | null;
};

// "Dīzelis" → "dīzelis", bet saīsinājumus ("SUV", "CNG") atstājam
const lower = (s: string) => (/^\p{Lu}{2}/u.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

export function listingSummary(
  l: L,
  names: { make: string | null; model: string | null; place?: string | null },
  ev: PriceEval | null | undefined,
  vzd: { median: number | null; medianN: number } | null | undefined,
  t: T,
  tp: TP,
): string[] {
  const out: string[] = [];
  if (l.kind === "vehicle") {
    const name = [names.make ?? l.makeText, names.model ? trTitle(names.model, t) : l.modelText].filter(Boolean).join(" ");
    if (!name) return out;
    const engine = l.engineL ? `${Number(l.engineL).toFixed(1)} L${l.fuel ? ` ${lower(t(l.fuel))}` : ""}` : l.fuel ? lower(t(l.fuel)) : null;
    const specs = [
      engine,
      l.powerKw ? `${l.powerKw} kW` : null,
      l.gearbox ? lower(t(l.gearbox)) : null,
      l.body ? lower(t(l.body)) : null,
      l.mileageKm != null ? t("nobraukums {km} km", { km: formatNumber(l.mileageKm) }) : null,
    ].filter(Boolean);
    out.push(`${l.year ? t("{year}. gada {name}", { year: l.year, name }) : name}${specs.length ? `, ${specs.join(", ")}` : ""}.`);
  } else if (l.kind === "property" && l.propertyType) {
    const parts = [
      l.areaM2 ? `${Number(l.areaM2)} m²` : null,
      l.rooms ? tp(l.rooms, "istaba", "istabas") : null,
      l.floor != null && l.floors ? t("{f}. stāvs no {n}", { f: l.floor, n: l.floors }) : null,
      l.series ? t("sērija: {s}", { s: t(l.series) }) : null,
      l.builtYear ? t("būvēta {y}. gadā", { y: l.builtYear }) : null,
      l.landM2 ? t("zeme {x}", { x: landLabel(l.landM2) }) : null,
    ].filter(Boolean);
    out.push(`${t(l.propertyType)}${parts.length ? `, ${parts.join(", ")}` : ""}.`);
  }
  if (ev && ev.median > 0) {
    const m = ev.perM2 ? `${formatNumber(ev.median)} €/m²` : formatPrice(ev.median);
    const pct = Math.round((1 - ev.ratio) * 100);
    // īpašumiem salīdzinām €/m² ar visu reģionu (price-eval.ts), auto – ar to pašu modeli ±gadi
    out.push(
      ev.perM2 && ev.scope === "place" && names.place
        ? Math.abs(pct) < 3
          ? t("Cena par m² atbilst vietas „{w}” mediānai ({m}, {n}).", { w: names.place, m, n: tp(ev.n, "sludinājums", "sludinājumi") })
          : t(pct > 0 ? "Cena par m² ir par {p}% zemāka nekā mediāna vietā „{w}” ({m}, {n})." : "Cena par m² ir par {p}% augstāka nekā mediāna vietā „{w}” ({m}, {n}).", { p: Math.abs(pct), w: names.place, m, n: tp(ev.n, "sludinājums", "sludinājumi") })
      : ev.perM2
        ? Math.abs(pct) < 3
          ? t("Cena par m² atbilst reģiona mediānai ({m}, {n}).", { m, n: tp(ev.n, "sludinājums", "sludinājumi") })
          : t(pct > 0 ? "Cena par m² ir par {p}% zemāka nekā reģiona mediāna ({m}, {n})." : "Cena par m² ir par {p}% augstāka nekā reģiona mediāna ({m}, {n}).", { p: Math.abs(pct), m, n: tp(ev.n, "sludinājums", "sludinājumi") })
        : Math.abs(pct) < 3
          ? t("Cena atbilst tirgum: līdzīgu sludinājumu mediāna ir {m} (salīdzināti {n}).", { m, n: ev.n })
          : pct > 0
            ? t("Cena ir par {p}% zemāka nekā līdzīgiem sludinājumiem (mediāna {m}, salīdzināti {n}).", { p: pct, m, n: ev.n })
            : t("Cena ir par {p}% augstāka nekā līdzīgiem sludinājumiem (mediāna {m}, salīdzināti {n}).", { p: -pct, m, n: ev.n }),
    );
  }
  if (vzd?.median && vzd.medianN > 0) {
    out.push(t("Reālie darījumi šajā mājā (VZD): vidēji {m} €/m², {n}.", { m: formatNumber(Math.round(vzd.median)), n: tp(vzd.medianN, "darījums", "darījumi") }));
  }
  return out;
}
