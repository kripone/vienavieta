"use client";
import { useT } from "@/i18n/client";
import { SERIES_DOC, seriesAnchor } from "@/content/series";
import { vcIcon } from "@/lib/illustrations";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AMENITIES, BODY_TYPES, COLORS, CONDITIONS, DEAL_LABEL, DEALS, DRIVES, FUELS, GEARBOXES, HEATING, MATERIALS, PROPERTY_FIELDS,
  PROPERTY_GROUPS, PURPOSES, SERIES, SERIES_GROUPS, SOURCE_LABEL, VEHICLE_CLASS_LABEL, VEHICLE_CLASSES, type PropertyType, type VehicleClass,
} from "@/lib/constants";
import type { RegionOption } from "./listing-form";
import { TRIMS } from "@/lib/trims";

type Make = { id: number; name: string; popular: boolean; models: { id: number; name: string }[]; trims?: string[] };
export type FilterValues = Record<string, string>;

const YEARS = Array.from({ length: new Date().getFullYear() + 1 - 1980 }, (_, i) => String(new Date().getFullYear() - i));
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

export function SearchFilters({ initial, regions, sources = [] }: { initial: FilterValues; regions: RegionOption[]; sources?: { source: string; n: number }[] }) {
  const { t, locale, lp } = useT();
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
      {t(label)}
      <select value={v[k] ?? ""} onChange={(e) => update({ [k]: e.target.value })}>
        <option value="">{t(any)}</option>
        {opts.map((o) => (typeof o === "string" ? <option key={o} value={o}>{t(o)}</option> : <option key={o[0]} value={o[0]}>{t(o[1])}</option>))}
      </select>
    </label>
  );
  const numIn = (k: string, label: string, ph?: string) => (
    <label className="field" key={k}>
      {t(label)}
      <input type="number" inputMode="numeric" min={0} value={v[k] ?? ""} placeholder={ph} onChange={(e) => update({ [k]: e.target.value }, 500)} />
    </label>
  );
  const check = (k: string, label: string) => (
    <label key={k}>
      <input type="checkbox" checked={v[k] === "1"} onChange={(e) => update({ [k]: e.target.checked ? "1" : "" })} /> {t(label)}
    </label>
  );

  const make = makes.find((m) => String(m.id) === v.make);
  const pkeys = propertyKeys(v.ptype ?? "");
  const amen = useMemo(() => (v.amen ? v.amen.split(",") : []), [v.amen]);
  // vieta: vairākas atķeksētas vērtības ("p:12,r:34,g:pieriga")
  const locSel = useMemo(() => (v.loc ? v.loc.split(",").filter(Boolean) : []), [v.loc]);
  const toggleLoc = (tok: string) => update({ loc: (locSel.includes(tok) ? locSel.filter((x) => x !== tok) : [...locSel, tok]).join(",") });
  // izvēlēto vietu nosaukumi pogas tekstam
  const locName = (tok: string): string => {
    if (tok === "g:pieriga") return t("Rīgas rajons (Pierīga)");
    const id = Number(tok.slice(2));
    if (tok[0] === "r") return regions.find((r) => r.regionId === id)?.region ?? tok;
    for (const r of regions) { const p = r.places.find((x) => x.id === id); if (p) return p.name; }
    return tok;
  };
  const locSummary = !locSel.length
    ? t(v.cat !== "vehicle" || v.country === "LV" ? "Visa Latvija" : v.country === "LT" ? "Visa Lietuva" : "Visas vietas")
    : locSel.slice(0, 2).map(locName).join(", ") + (locSel.length > 2 ? ` +${locSel.length - 2}` : "");
  const active = Object.entries(v).filter(([k, val]) => val && !["sort", "page", "cat", "vc"].includes(k)).length;

  return (
    <div className="filters">
      <div className="seg full" role="group" aria-label={t("Kategorija")}>
        {([["", "Visi"], ["vehicle", "Transports"], ["property", "Īpašumi"]] as const).map(([c, l]) => (
          <button key={c} type="button" aria-pressed={(v.cat ?? "") === c} onClick={() => update({ cat: c, vc: c === "vehicle" ? "car" : "", make: "", model: "", body: "", ptype: "", country: "", loc: "" })}>
            {t(l)}
          </button>
        ))}
      </div>

      {v.cat === "vehicle" && (
        <div className="vc-row" role="group" aria-label={t("Transporta veids")}>
          {VEHICLE_CLASSES.map((c) => (
            <button key={c} type="button" aria-pressed={vc === c} onClick={() => update({ vc: c, make: "", model: "", body: "" })}>
              <span dangerouslySetInnerHTML={{ __html: vcIcon(c) }} style={{ display: "contents" }} />
              <span>{t(VEHICLE_CLASS_LABEL[c])}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid2">
        {numIn("pmin", "Cena no, €")}
        {numIn("pmax", "Cena līdz, €")}
      </div>
      {v.cat === "vehicle" && <div className="seg seg-sm" role="group" aria-label={t("Valsts")}>
        {([["", "Latvija un Lietuva"], ["LV", "Latvija"], ["LT", "Lietuva"]] as const).map(([c, l]) => (
          <button key={c} type="button" aria-pressed={(v.country ?? "") === c} onClick={() => update({ country: c, loc: "" })}>
            {t(l)}
          </button>
        ))}
      </div>}
      <details className="more loc-more" open={locSel.length > 0}>
        <summary>
          <span className="loc-cap">{t("Vieta")}</span>
          <span className="loc-val">{locSummary}</span>
          <span className="loc-caret" aria-hidden>▾</span>
        </summary>
        <div className="checks src-chips loc-chips">
          <label className={!locSel.length ? "on" : "off"}>
            <input type="checkbox" checked={!locSel.length} onChange={() => update({ loc: "" })} /> {t(v.cat !== "vehicle" || v.country === "LV" ? "Visa Latvija" : v.country === "LT" ? "Visa Lietuva" : "Visas vietas")}
          </label>
          {(v.cat !== "vehicle" || v.country !== "LT") && (
            <label className={locSel.includes("g:pieriga") ? "on" : "off"}>
              <input type="checkbox" checked={locSel.includes("g:pieriga")} onChange={() => toggleLoc("g:pieriga")} /> {t("Rīgas rajons (Pierīga)")}
            </label>
          )}
          {regions.filter((r) => (v.cat === "vehicle" ? !v.country || r.country === v.country : r.country === "LV")).map((r) => (
            <div key={r.region} className="loc-group">
              <label className={locSel.includes(`r:${r.regionId}`) ? "on" : "off"}>
                <input type="checkbox" checked={locSel.includes(`r:${r.regionId}`)} onChange={() => toggleLoc(`r:${r.regionId}`)} /> <strong>{v.cat === "vehicle" && !v.country && r.country === "LT" ? `${t("Lietuva")} · ` : ""}{r.kind === "city" || r.country === "LT" ? t("Visa {r}", { r: r.region }) : t("Viss {r}", { r: r.region })}</strong>
              </label>
              {r.places.map((p) => (
                <label key={p.id} className={locSel.includes(`p:${p.id}`) ? "on" : "off"}>
                  <input type="checkbox" checked={locSel.includes(`p:${p.id}`)} onChange={() => toggleLoc(`p:${p.id}`)} /> {p.name}
                </label>
              ))}
            </div>
          ))}
        </div>
      </details>

      {v.cat === "vehicle" && (
        <>
          <div className="grid2">
            <label className="field">
              {t("Marka")}
              <select value={v.make ?? ""} onChange={(e) => update({ make: e.target.value, model: "", trim: "" })}>
                <option value="">{t("Visas markas")}</option>
                <optgroup label={t("Populārākās")}>{makes.filter((m) => m.popular).map((m) => <option key={"p" + m.id} value={m.id}>{m.name}</option>)}</optgroup>
                <optgroup label={t("Visas markas")}>{makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>
              </select>
            </label>
            <label className="field">
              {t("Modelis")}
              <select value={v.model ?? ""} disabled={!make} onChange={(e) => update({ model: e.target.value })}>
                <option value="">{make ? t("Visi modeļi") : t("Vispirms marka")}</option>
                {make?.models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
            {make && (make.trims ?? TRIMS[make.name]?.map((x) => x.name) ?? []).length > 0 && sel("trim", "Komplektācija", make.trims ?? TRIMS[make.name].map((x) => x.name), "Jebkura")}
            {sel("ymin", "Gads no", YEARS)}
            {sel("ymax", "Gads līdz", YEARS)}
            {sel("kmmax", "Nobraukums līdz", KM.map((k) => [k, `${Number(k).toLocaleString("lv-LV")} km`] as const), "Jebkāds")}
            {sel("fuel", "Degviela", FUELS, "Jebkura")}
            {sel("gear", "Ātrumkārba", GEARBOXES, "Jebkura")}
            {sel("body", "Virsbūve / tips", BODY_TYPES[vc], "Jebkura")}
          </div>
          <div className="checks">{check("el", "⚡ Tikai elektriskie")}</div>
          <details className="more" open={Boolean(v.drive || v.kwmin || v.ccmin || v.ccmax || v.color)}>
            <summary>{t("Vairāk filtru")}</summary>
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
              {t("Īpašuma veids")}
              <select value={v.ptype ?? ""} onChange={(e) => update({ ptype: e.target.value })}>
                <option value="">{t("Visi veidi")}</option>
                {Object.entries(PROPERTY_GROUPS).map(([g, ts]) => (
                  <optgroup key={g} label={t(g)}>
                    <option value={`g:${g}`}>{t("Visi: {g}", { g: t(g).toLocaleLowerCase() })}</option>
                    {ts.map((x) => <option key={x} value={x}>{t(x)}</option>)}
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
              <summary>{t("Vairāk filtru")}</summary>
              <div className="grid2">
                {pkeys.includes("series") && (
                  <label className="field" key="series">
                    {t("Sērija")}
                    <select value={v.series ?? ""} onChange={(e) => update({ series: e.target.value })}>
                      <option value="">{t("Jebkurš")}</option>
                      {(Object.keys(SERIES_GROUPS) as (keyof typeof SERIES_GROUPS)[]).map((g) => (
                        <optgroup key={g} label={SERIES_DOC[locale].groups[g]}>
                          {SERIES_GROUPS[g].map((o) => <option key={o} value={o}>{t(o)}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                )}
                {pkeys.includes("material") && sel("material", "Mājas tips", MATERIALS)}
                {pkeys.includes("heating") && sel("heating", "Apkure", HEATING, "Jebkura")}
                {pkeys.includes("condition") && sel("condition", "Stāvoklis", CONDITIONS)}
                {pkeys.includes("builtYear") && numIn("builtmin", "Būvēts no gada")}
                {pkeys.includes("series") && (
                  <p className="series-hint full">
                    {v.series && (SERIES as readonly string[]).includes(v.series)
                      ? <>{SERIES_DOC[locale].items[v.series as (typeof SERIES)[number]].era} · {SERIES_DOC[locale].items[v.series as (typeof SERIES)[number]].text} </>
                      : null}
                    <a href={lp(v.series ? `/serijas#${seriesAnchor(v.series)}` : "/serijas")} target="_blank" rel="noopener">{t("Kas ir sērijas?")}</a>
                  </p>
                )}
              </div>
            </details>
          )}
          {pkeys.includes("amenities") && (
            <details className="more src-more" open={amen.length > 0}>
              <summary>
                {t("Ērtības")}
                {amen.length > 0 ? <span className="fine"> ({amen.length})</span> : null}
              </summary>
              <div className="checks" style={{ marginTop: 10 }}>
                {AMENITIES.map((a) => (
                  <label key={a}>
                    <input type="checkbox" checked={amen.includes(a)} onChange={(e) => update({ amen: (e.target.checked ? [...amen, a] : amen.filter((x) => x !== a)).join(",") })} /> {t(a)}
                  </label>
                ))}
              </div>
            </details>
          )}
        </>
      )}

      <label className="field">
        {t("Pārdevējs")}
        <select value={v.seller ?? ""} onChange={(e) => update({ seller: e.target.value })}>
          <option value="">{t("Visi pārdevēji")}</option>
          <option value="private">{t("Privātpersonas")}</option>
          <option value="dealer">{t("Saloni un aģentūras")}</option>
          <option value="verified">{t("Tikai ar apstiprinātu identitāti")}</option>
        </select>
      </label>
      <details className="more src-more" open={Boolean(v.sources)}>
        <summary>
          {t("Avoti")}
          {v.sources ? <span className="fine"> ({v.sources.split(",").filter(Boolean).length})</span> : null}
        </summary>
        <SourceChips value={v.sources ?? ""} sources={sources} onChange={(sources) => update({ sources, src: "" })} />
      </details>

      {active > 0 && (
        <button type="button" className="btn small" onClick={() => update({ ...Object.fromEntries(Object.keys(v).map((k) => [k, ""])), cat: v.cat ?? "", vc: v.vc ?? "", sort: v.sort ?? "" })}>
          Notīrīt filtrus ({active})
        </button>
      )}
    </div>
  );
}

/**
 * Avotu ieslēgšanas/izslēgšanas čipi ar sludinājumu skaitiem.
 * Bez parametra (viss atzīmēts) = visi avoti; atzīmju kombinācija iet URL kā ?sources=a,b.
 */
function SourceChips({ value, sources, onChange }: { value: string; sources: { source: string; n: number }[]; onChange: (v: string) => void }) {
  const selected = value ? value.split(",").filter(Boolean) : [];
  // atlasītos rādām arī tad, ja tekošajos filtros tiem skaits ir 0
  const items = [...sources];
  for (const key of selected) if (!items.some((i) => i.source === key)) items.push({ source: key, n: 0 });
  if (!items.length) return null;
  const allOn = !selected.length;
  const isOn = (key: string) => allOn || selected.includes(key);
  const toggle = (key: string) => {
    const cur = allOn ? items.map((i) => i.source) : selected;
    const next = cur.includes(key) ? cur.filter((x) => x !== key) : [...cur, key];
    // visi ieslēgti vai visi izslēgti = bez filtra (visi avoti)
    onChange(next.length === 0 || next.length === items.length ? "" : next.join(","));
  };
  return (
    <div className="checks src-chips" role="group">
      {items.map((i) => (
        <label key={i.source} className={isOn(i.source) ? "on" : "off"}>
          <input type="checkbox" checked={isOn(i.source)} onChange={() => toggle(i.source)} /> {SOURCE_LABEL[i.source] ?? i.source} <span className="fine">{i.n}</span>
        </label>
      ))}
    </div>
  );
}
