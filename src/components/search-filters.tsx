"use client";
import { vcIcon } from "@/lib/illustrations";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AMENITIES, BODY_TYPES, COLORS, CONDITIONS, DEAL_LABEL, DEALS, DRIVES, FUELS, GEARBOXES, HEATING, MATERIALS, PROPERTY_FIELDS,
  PROPERTY_GROUPS, PURPOSES, SERIES, VEHICLE_CLASS_LABEL, VEHICLE_CLASSES, type PropertyType, type VehicleClass,
} from "@/lib/constants";
import type { RegionOption } from "./listing-form";

type Make = { id: number; name: string; popular: boolean; models: { id: number; name: string }[] };
export type FilterValues = Record<string, string>;

const YEARS = Array.from({ length: new Date().getFullYear() + 2 - 1980 }, (_, i) => String(new Date().getFullYear() + 1 - i));
const KM = ["25000", "50000", "100000", "150000", "200000", "250000", "300000"];
const KW = [["55", "75 ZS"], ["75", "102 ZS"], ["100", "136 ZS"], ["130", "177 ZS"], ["160", "218 ZS"], ["200", "272 ZS"], ["250", "340 ZS"]];

/** Kuri īpašuma lauki rādāmi filtros izvēlētajam veidam vai grupai. */
function propertyKeys(ptype: string): readonly string[] {
  if (!ptype) return ["rooms", "areaM2"];
  if (ptype.startsWith("g:")) {
    const g = ptype.slice(2) as keyof typeof PROPERTY_GROUPS;
    return g === "Dzīvojamais" ? ["rooms", "areaM2", "landM2", "heating", "condition", "amenities"] : g === "Zeme un mežs" ? ["landM2"] : ["areaM2", "heating", "condition"];
  }
  return PROPERTY_FIELDS[ptype as PropertyType] ?? [];
}

export function SearchFilters({ initial, regions }: { initial: FilterValues; regions: RegionOption[] }) {
  const router = useRouter();
  const [v, setV] = useState<FilterValues>(initial);
  const [makes, setMakes] = useState<Make[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ja URL mainās (atpakaļ poga, saite), atjauno filtrus
  const initialKey = JSON.stringify(initial);
  useEffect(() => setV(initial), [initialKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const vc = (v.vc || "car") as VehicleClass;
  useEffect(() => {
    if (v.cat !== "vehicle") return;
    let alive = true;
    fetch(`/api/catalog?class=${vc}`).then((r) => r.json()).then((d) => alive && setMakes(Array.isArray(d) ? d : [])).catch(() => {});
    return () => { alive = false; };
  }, [v.cat, vc]);

  function push(next: FilterValues, delay = 0) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const p = new URLSearchParams();
      for (const [k, val] of Object.entries(next)) if (val && k !== "page") p.set(k, val);
      router.push(p.toString() ? `/?${p}` : "/", { scroll: false });
    }, delay);
  }
  function update(patch: FilterValues, delay = 0) {
    const next = { ...v, ...patch };
    setV(next);
    push(next, delay);
  }

  const sel = (k: string, label: string, opts: readonly (string | readonly [string, string])[], any = "Jebkurš") => (
    <label className="field" key={k}>
      {label}
      <select value={v[k] ?? ""} onChange={(e) => update({ [k]: e.target.value })}>
        <option value="">{any}</option>
        {opts.map((o) => (typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o[0]} value={o[0]}>{o[1]}</option>))}
      </select>
    </label>
  );
  const numIn = (k: string, label: string, ph?: string) => (
    <label className="field" key={k}>
      {label}
      <input type="number" inputMode="numeric" min={0} value={v[k] ?? ""} placeholder={ph} onChange={(e) => update({ [k]: e.target.value }, 500)} />
    </label>
  );
  const check = (k: string, label: string) => (
    <label key={k}>
      <input type="checkbox" checked={v[k] === "1"} onChange={(e) => update({ [k]: e.target.checked ? "1" : "" })} /> {label}
    </label>
  );

  const make = makes.find((m) => String(m.id) === v.make);
  const pkeys = propertyKeys(v.ptype ?? "");
  const amen = useMemo(() => (v.amen ? v.amen.split(",") : []), [v.amen]);
  const active = Object.entries(v).filter(([k, val]) => val && !["sort", "page", "cat", "vc"].includes(k)).length;

  return (
    <div className="filters">
      <div className="seg full" role="group" aria-label="Kategorija">
        {([["", "Visi"], ["vehicle", "Transports"], ["property", "Īpašumi"]] as const).map(([c, l]) => (
          <button key={c} type="button" aria-pressed={(v.cat ?? "") === c} onClick={() => update({ cat: c, vc: c === "vehicle" ? "car" : "", make: "", model: "", body: "", ptype: "", country: "", loc: "" })}>
            {l}
          </button>
        ))}
      </div>

      {v.cat === "vehicle" && (
        <div className="vc-row" role="group" aria-label="Transporta veids">
          {VEHICLE_CLASSES.map((c) => (
            <button key={c} type="button" aria-pressed={vc === c} onClick={() => update({ vc: c, make: "", model: "", body: "" })}>
              <span dangerouslySetInnerHTML={{ __html: vcIcon(c) }} style={{ display: "contents" }} />
              <span>{VEHICLE_CLASS_LABEL[c]}</span>
            </button>
          ))}
        </div>
      )}

      <label className="field">
        Meklēt
        <input type="search" value={v.q ?? ""} placeholder="piem. Golf, 2 istabas, Teika" onChange={(e) => update({ q: e.target.value }, 500)} />
      </label>
      <div className="grid2">
        {numIn("pmin", "Cena no, €")}
        {numIn("pmax", "Cena līdz, €")}
      </div>
      {v.cat === "vehicle" && <div className="seg seg-sm" role="group" aria-label="Valsts">
        {([["", "Latvija un Lietuva"], ["LV", "Latvija"], ["LT", "Lietuva"]] as const).map(([c, l]) => (
          <button key={c} type="button" aria-pressed={(v.country ?? "") === c} onClick={() => update({ country: c, loc: "" })}>
            {l}
          </button>
        ))}
      </div>}
      <label className="field">
        Vieta
        <select value={v.loc ?? ""} onChange={(e) => update({ loc: e.target.value })}>
          <option value="">{v.cat !== "vehicle" || v.country === "LV" ? "Visa Latvija" : v.country === "LT" ? "Visa Lietuva" : "Visas vietas"}</option>
          {regions.filter((r) => (v.cat === "vehicle" ? !v.country || r.country === v.country : r.country === "LV")).map((r) => (
            <optgroup key={r.region} label={v.cat === "vehicle" && !v.country && r.country === "LT" ? `Lietuva · ${r.region}` : r.region}>
              <option value={`r:${r.regionId}`}>{r.country === "LT" && r.kind !== "city" ? `Visa ${r.region}` : r.kind === "city" ? `Visa ${r.region}` : `Viss ${r.region}`}</option>
              {r.places.map((p) => <option key={p.id} value={`p:${p.id}`}>{p.name}</option>)}
            </optgroup>
          ))}
        </select>
      </label>

      {v.cat === "vehicle" && (
        <>
          <div className="grid2">
            <label className="field">
              Marka
              <select value={v.make ?? ""} onChange={(e) => update({ make: e.target.value, model: "" })}>
                <option value="">Visas markas</option>
                <optgroup label="Populārākās">{makes.filter((m) => m.popular).map((m) => <option key={"p" + m.id} value={m.id}>{m.name}</option>)}</optgroup>
                <optgroup label="Visas markas">{makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>
              </select>
            </label>
            <label className="field">
              Modelis
              <select value={v.model ?? ""} disabled={!make} onChange={(e) => update({ model: e.target.value })}>
                <option value="">{make ? "Visi modeļi" : "Vispirms marka"}</option>
                {make?.models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
            {sel("ymin", "Gads no", YEARS)}
            {sel("ymax", "Gads līdz", YEARS)}
            {sel("kmmax", "Nobraukums līdz", KM.map((k) => [k, `${Number(k).toLocaleString("lv-LV")} km`] as const), "Jebkāds")}
            {sel("fuel", "Degviela", FUELS, "Jebkura")}
            {sel("gear", "Ātrumkārba", GEARBOXES, "Jebkura")}
            {sel("body", "Virsbūve / tips", BODY_TYPES[vc], "Jebkura")}
          </div>
          <div className="checks">{check("el", "⚡ Tikai elektriskie")}</div>
          <details className="more" open={Boolean(v.drive || v.kwmin || v.ccmin || v.ccmax || v.color)}>
            <summary>Vairāk filtru</summary>
            <div className="grid2">
              {sel("drive", "Piedziņa", DRIVES, "Jebkura")}
              {sel("kwmin", "Jauda no", KW.map(([k, z]) => [k, `${k} kW (${z})`] as const), "Jebkura")}
              {sel("ccmin", "Tilpums no, L", ["1.0", "1.4", "1.6", "2.0", "2.5", "3.0", "4.0"], "Jebkāds")}
              {sel("ccmax", "Tilpums līdz, L", ["1.2", "1.6", "2.0", "2.5", "3.0", "4.0"], "Jebkāds")}
              {sel("color", "Krāsa", COLORS, "Jebkura")}
            </div>
          </details>
        </>
      )}

      {v.cat === "property" && (
        <>
          <div className="grid2">
            <label className="field full">
              Īpašuma veids
              <select value={v.ptype ?? ""} onChange={(e) => update({ ptype: e.target.value })}>
                <option value="">Visi veidi</option>
                {Object.entries(PROPERTY_GROUPS).map(([g, ts]) => (
                  <optgroup key={g} label={g}>
                    <option value={`g:${g}`}>Visi: {g.toLocaleLowerCase("lv")}</option>
                    {ts.map((t) => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            {sel("deal", "Darījums", DEALS.map((d) => [d, DEAL_LABEL[d]] as const), "Visi")}
            {pkeys.includes("areaM2") && numIn("sqmmax", "Cena par m² līdz, €")}
            {pkeys.includes("rooms") && sel("rmin", "Istabas no", ["1", "2", "3", "4", "5", "6"])}
            {pkeys.includes("rooms") && sel("rmax", "Istabas līdz", ["1", "2", "3", "4", "5", "6"])}
            {pkeys.includes("areaM2") && numIn("amin", "Platība no, m²")}
            {pkeys.includes("areaM2") && numIn("amax", "Platība līdz, m²")}
            {pkeys.includes("floor") && numIn("fmin", "Stāvs no")}
            {pkeys.includes("floor") && numIn("fmax", "Stāvs līdz")}
            {pkeys.includes("landM2") && numIn("lmin", "Zeme no, m²")}
            {pkeys.includes("landM2") && numIn("lmax", "Zeme līdz, m²")}
            {pkeys.includes("purpose") && sel("purpose", "Lietošanas mērķis", PURPOSES)}
          </div>
          {pkeys.includes("floor") && <div className="checks">{check("notfirst", "Ne pirmais stāvs")}{check("notlast", "Ne pēdējais stāvs")}</div>}
          {(pkeys.some((k) => ["series", "material", "heating", "condition", "builtYear", "amenities"].includes(k))) && (
            <details className="more" open={Boolean(v.series || v.material || v.heating || v.condition || v.builtmin || v.amen)}>
              <summary>Vairāk filtru</summary>
              <div className="grid2">
                {pkeys.includes("series") && sel("series", "Sērija", SERIES)}
                {pkeys.includes("material") && sel("material", "Mājas tips", MATERIALS)}
                {pkeys.includes("heating") && sel("heating", "Apkure", HEATING, "Jebkura")}
                {pkeys.includes("condition") && sel("condition", "Stāvoklis", CONDITIONS)}
                {pkeys.includes("builtYear") && numIn("builtmin", "Būvēts no gada")}
              </div>
              {pkeys.includes("amenities") && (
                <div className="checks" style={{ marginTop: 10 }}>
                  {AMENITIES.map((a) => (
                    <label key={a}>
                      <input type="checkbox" checked={amen.includes(a)} onChange={(e) => update({ amen: (e.target.checked ? [...amen, a] : amen.filter((x) => x !== a)).join(",") })} /> {a}
                    </label>
                  ))}
                </div>
              )}
            </details>
          )}
        </>
      )}

      <label className="field">
        Pārdevējs
        <select value={v.seller ?? ""} onChange={(e) => update({ seller: e.target.value })}>
          <option value="">Visi pārdevēji</option>
          <option value="private">Privātpersonas</option>
          <option value="dealer">Saloni un aģentūras</option>
          <option value="verified">Tikai ar apstiprinātu identitāti</option>
        </select>
      </label>
      <label className="field">
        Avots
        <select value={v.src ?? ""} onChange={(e) => update({ src: e.target.value })}>
          <option value="">Visi sludinājumi</option>
          <option value="own">Tikai VienāVietā</option>
          <option value="ext">No citiem portāliem (ss.com)</option>
        </select>
      </label>

      {active > 0 && (
        <button type="button" className="btn small" onClick={() => update({ ...Object.fromEntries(Object.keys(v).map((k) => [k, ""])), cat: v.cat ?? "", vc: v.vc ?? "", sort: v.sort ?? "" })}>
          Notīrīt filtrus ({active})
        </button>
      )}
    </div>
  );
}
