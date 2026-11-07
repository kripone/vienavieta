"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveListing } from "@/app/sludinajumi/actions";
import {
  AMENITIES, BODY_TYPES, COLORS, CONDITIONS, DEAL_LABEL, DEALS, DRIVES, FUELS, GEARBOXES, HEATING, MATERIALS, MAX_PHOTOS,
  PROPERTY_FIELDS, PROPERTY_GROUPS, PURPOSES, SERIES, VEHICLE_CLASS_LABEL, VEHICLE_CLASSES, type PropertyType, type VehicleClass,
} from "@/lib/constants";

export type RegionOption = { region: string; kind: "city" | "municipality"; places: { id: number; name: string }[] };
export type PhotoItem = { id: string; thumbUrl: string };
type Make = { id: number; name: string; popular: boolean; models: { id: number; name: string }[] };

/** Formas vērtības ir teksts; serveris tās pārbauda un pārveido. */
export type FormValues = Record<string, string> & { kind: "vehicle" | "property" };

const blank: FormValues = {
  kind: "vehicle", vehicleClass: "car", makeId: "", modelId: "", makeText: "", modelText: "", year: "", mileageKm: "", fuel: "", gearbox: "",
  body: "", engineL: "", powerKw: "", drive: "", color: "", vin: "",
  propertyType: "Dzīvoklis", deal: "sell", rooms: "", areaM2: "", landM2: "", floor: "", floors: "", series: "", material: "", heating: "",
  condition: "", builtYear: "", purpose: "",
  title: "", description: "", price: "", placeId: "", contactPhone: "", contactEmail: "",
};

const PROPERTY_LABELS: Record<string, string> = {
  rooms: "Istabas", areaM2: "Platība, m²", landM2: "Zemes platība, m²", floor: "Stāvs", floors: "Stāvu skaits ēkā", series: "Sērija",
  material: "Mājas tips", heating: "Apkure", condition: "Stāvoklis", builtYear: "Būvniecības gads", purpose: "Lietošanas mērķis",
};
const PROPERTY_LISTS: Record<string, readonly string[]> = { series: SERIES, material: MATERIALS, heating: HEATING, condition: CONDITIONS, purpose: PURPOSES };

// Lapas ielādes laiks antispam pārbaudei. Moduļa līmenī, lai tas nemainītos, ja forma tiek pārzīmēta.
const pageLoadedAt = typeof window === "undefined" ? 0 : Date.now();

export function ListingForm(props: {
  regions: RegionOption[];
  initial?: Partial<FormValues> & { id?: string };
  initialAmenities?: string[];
  initialPhotos?: PhotoItem[];
  defaultPhone?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(props.initial?.id);
  const [v, setV] = useState<FormValues>({ ...blank, contactPhone: props.defaultPhone ?? "", ...(props.initial as FormValues) });
  const [amenities, setAmenities] = useState<string[]>(props.initialAmenities ?? []);
  const [photos, setPhotos] = useState<PhotoItem[]>(props.initialPhotos ?? []);
  const [uploading, setUploading] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [makes, setMakes] = useState<Make[]>([]);
  const honeypot = useRef<HTMLInputElement>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((p) => ({ ...p, [k]: e.target.value }));
  const vc = v.vehicleClass as VehicleClass;

  // katalogs izvēlētajam transporta veidam
  useEffect(() => {
    if (v.kind !== "vehicle") return;
    let alive = true;
    fetch(`/api/catalog?class=${vc}`).then((r) => r.json()).then((d: Make[]) => alive && setMakes(Array.isArray(d) ? d : [])).catch(() => alive && setMakes([]));
    return () => { alive = false; };
  }, [v.kind, vc]);

  const make = makes.find((m) => String(m.id) === v.makeId);
  const fields = PROPERTY_FIELDS[v.propertyType as PropertyType] ?? [];
  const sortedMakes = useMemo(() => ({ popular: makes.filter((m) => m.popular), all: makes }), [makes]);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    for (const [i, f] of list.entries()) {
      setUploading(`Augšupielādē bildi ${i + 1} no ${list.length}…`);
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch("/api/uploads", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErrors((e) => ({ ...e, photos: d.error ?? "Bildi neizdevās augšupielādēt." })); break; }
      setPhotos((p) => [...p, { id: d.id, thumbUrl: d.thumbUrl }]);
    }
    setUploading("");
  }
  const move = (i: number, d: -1 | 1) => setPhotos((p) => { const n = [...p]; const j = i + d; if (j < 0 || j >= n.length) return p; [n[i], n[j]] = [n[j], n[i]]; return n; });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const payload: Record<string, unknown> = { ...v, id: props.initial?.id, photoIds: photos.map((p) => p.id), honeypot: honeypot.current?.value ?? "", startedAt: pageLoadedAt };
    if (v.kind === "property") payload.amenities = fields.includes("amenities") ? amenities : [];
    const res = await saveListing(payload);
    setSaving(false);
    if (res.ok) { router.push(`/sludinajumi/${res.id}?saglabats=1`); router.refresh(); return; }
    setErrors(res.errors);
    requestAnimationFrame(() => document.querySelector(".err")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  const err = (k: string) => (errors[k] ? <span className="err">{errors[k]}</span> : null);
  const sel = ({ k, label, list, any = "— izvēlies —", required }: { k: string; label: string; list: readonly string[]; any?: string; required?: boolean }) => (
    <label className="field" key={k}>
      {label}{required && " *"}
      <select value={v[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])}>
        <option value="">{any}</option>
        {list.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {err(k)}
    </label>
  );
  const num = ({ k, label, required, step }: { k: string; label: string; required?: boolean; step?: string }) => (
    <label className="field" key={k}>
      {label}{required && " *"}
      <input inputMode={step ? "decimal" : "numeric"} type="number" step={step ?? "1"} value={v[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} />
      {err(k)}
    </label>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="stack lform">
      {!isEdit && (
        <div className="seg" role="group" aria-label="Kategorija">
          <button type="button" aria-pressed={v.kind === "vehicle"} onClick={() => setV((p) => ({ ...p, kind: "vehicle" }))}>Transports</button>
          <button type="button" aria-pressed={v.kind === "property"} onClick={() => setV((p) => ({ ...p, kind: "property" }))}>Nekustamais īpašums</button>
        </div>
      )}

      {v.kind === "vehicle" ? (
        <section className="panel grid2">
          <h2 className="full">Transportlīdzeklis</h2>
          <label className="field full">
            Transporta veids *
            <select value={v.vehicleClass} onChange={(e) => setV((p) => ({ ...p, vehicleClass: e.target.value, makeId: "", modelId: "", body: "" }))} disabled={isEdit}>
              {VEHICLE_CLASSES.map((c) => <option key={c} value={c}>{VEHICLE_CLASS_LABEL[c]}</option>)}
            </select>
          </label>
          <label className="field">
            Marka *
            <select value={v.makeId} onChange={(e) => setV((p) => ({ ...p, makeId: e.target.value, modelId: "" }))} aria-invalid={Boolean(errors.makeId)}>
              <option value="">{makes.length ? "— izvēlies —" : "Ielādē…"}</option>
              {sortedMakes.popular.length > 0 && <optgroup label="Populārākās">{sortedMakes.popular.map((m) => <option key={"p" + m.id} value={m.id}>{m.name}</option>)}</optgroup>}
              <optgroup label="Visas markas">{sortedMakes.all.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>
            </select>
            {err("makeId")}
          </label>
          <label className="field">
            Modelis *
            <select value={v.modelId} onChange={set("modelId")} disabled={!make} aria-invalid={Boolean(errors.modelId)}>
              <option value="">{make ? "— izvēlies —" : "Vispirms marka"}</option>
              {make?.models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {err("modelId")}
          </label>
          {!v.makeId && (
            <label className="field">
              Vai ieraksti marku
              <input value={v.makeText} onChange={set("makeText")} maxLength={40} />
            </label>
          )}
          {!v.modelId && (
            <label className="field">
              Vai ieraksti modeli
              <input value={v.modelText} onChange={set("modelText")} maxLength={60} />
            </label>
          )}
          {num({ k: "year", label: "Izlaiduma gads", required: true })}
          {num({ k: "mileageKm", label: "Nobraukums, km" })}
          {sel({ k: "fuel", label: "Degviela", list: FUELS, required: true })}
          {sel({ k: "gearbox", label: "Ātrumkārba", list: GEARBOXES, required: true })}
          {sel({ k: "body", label: "Virsbūve / tips", list: BODY_TYPES[vc] ?? [], required: true })}
          {num({ k: "engineL", label: "Motora tilpums, L", step: "0.1" })}
          {num({ k: "powerKw", label: "Jauda, kW" })}
          {sel({ k: "drive", label: "Piedziņa", list: DRIVES, any: "Nav norādīts" })}
          {sel({ k: "color", label: "Krāsa", list: COLORS, any: "Nav norādīts" })}
          <label className="field">
            VIN kods
            <input value={v.vin} onChange={set("vin")} maxLength={17} style={{ textTransform: "uppercase" }} aria-invalid={Boolean(errors.vin)} />
            {err("vin")}
            <span className="fine">Netiek rādīts publiski. Nākotnē izmantosim auto vēstures pārbaudei.</span>
          </label>
        </section>
      ) : (
        <section className="panel grid2">
          <h2 className="full">Īpašums</h2>
          <label className="field">
            Īpašuma veids *
            <select value={v.propertyType} onChange={set("propertyType")} disabled={isEdit}>
              {Object.entries(PROPERTY_GROUPS).map(([g, ts]) => (
                <optgroup key={g} label={g}>{ts.map((t) => <option key={t} value={t}>{t}</option>)}</optgroup>
              ))}
            </select>
          </label>
          <label className="field">
            Darījums *
            <select value={v.deal} onChange={set("deal")}>
              {DEALS.map((d) => <option key={d} value={d}>{DEAL_LABEL[d]}</option>)}
            </select>
          </label>
          {["rooms", "areaM2", "landM2", "floor", "floors", "builtYear"].filter((f) => fields.includes(f)).map((f) =>
            num({ k: f, label: PROPERTY_LABELS[f], step: f === "areaM2" ? "0.1" : undefined, required: (f === "areaM2" && v.propertyType !== "Garāža") || (f === "landM2" && !fields.includes("areaM2")) }),
          )}
          {["series", "material", "heating", "condition", "purpose"].filter((f) => fields.includes(f)).map((f) => sel({ k: f, label: PROPERTY_LABELS[f], list: PROPERTY_LISTS[f], any: "Nav norādīts" }))}
          {fields.includes("amenities") && (
            <fieldset className="field full">
              <legend>Ērtības</legend>
              <div className="checks">
                {AMENITIES.map((a) => (
                  <label key={a}>
                    <input type="checkbox" checked={amenities.includes(a)} onChange={(e) => setAmenities((p) => (e.target.checked ? [...p, a] : p.filter((x) => x !== a)))} /> {a}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </section>
      )}

      <section className="panel grid2">
        <h2 className="full">Cena un vieta</h2>
        <label className="field">
          Cena, € *{v.kind === "property" && v.deal === "rent" ? " mēnesī" : v.kind === "property" && v.deal === "day" ? " dienā" : ""}
          <input type="number" inputMode="numeric" min={1} value={v.price} onChange={set("price")} aria-invalid={Boolean(errors.price)} />
          {err("price")}
        </label>
        <label className="field">
          Vieta *
          <select value={v.placeId} onChange={set("placeId")} aria-invalid={Boolean(errors.placeId)}>
            <option value="">— izvēlies —</option>
            {props.regions.map((r) => (
              <optgroup key={r.region} label={r.region}>
                {r.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </optgroup>
            ))}
          </select>
          {err("placeId")}
        </label>
      </section>

      <section className="panel stack">
        <h2>Apraksts</h2>
        <label className="field">
          Virsraksts
          <input value={v.title} onChange={set("title")} maxLength={90} placeholder="Var atstāt tukšu: saliksim no ievadītajiem datiem" aria-invalid={Boolean(errors.title)} />
          {err("title")}
        </label>
        <label className="field">
          Apraksts
          <textarea rows={6} value={v.description} onChange={set("description")} maxLength={4000} placeholder="Stāvoklis, aprīkojums, remonti, kāpēc pārdod…" aria-invalid={Boolean(errors.description)} />
          <span className="fine">{v.description.length} / 4000</span>
          {err("description")}
        </label>
      </section>

      <section className="panel stack">
        <h2>Bildes</h2>
        <p className="fine">Līdz {MAX_PHOTOS} bildēm. Pirmā būs galvenā. Atrašanās vietas dati no bildēm tiek dzēsti automātiski.</p>
        <div className="photos">
          {photos.map((p, i) => (
            <div className="ph" key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbUrl} alt={`Bilde ${i + 1}`} />
              {i === 0 && <span className="cover">Galvenā</span>}
              <div className="ph-act">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Pārvietot pa kreisi">‹</button>
                <button type="button" onClick={() => setPhotos((x) => x.filter((y) => y.id !== p.id))} aria-label="Noņemt bildi">×</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label="Pārvietot pa labi">›</button>
              </div>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="ph-add">
              + Pievienot bildes
              <input type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            </label>
          )}
        </div>
        {uploading && <p className="fine">{uploading}</p>}
        {err("photos")}
      </section>

      <section className="panel grid2">
        <h2 className="full">Kontakti</h2>
        <label className="field">
          Tālrunis
          <input type="tel" inputMode="tel" value={v.contactPhone} onChange={set("contactPhone")} placeholder="+371 20000000" aria-invalid={Boolean(errors.contactPhone)} />
          {err("contactPhone")}
        </label>
        <label className="field">
          E-pasts
          <input type="email" value={v.contactEmail} onChange={set("contactEmail")} placeholder="pēc izvēles" aria-invalid={Boolean(errors.contactEmail)} />
          {err("contactEmail")}
        </label>
        <p className="fine full">Kontaktus pircējs redz tikai pēc pogas "Rādīt tālruni". Tā tos grūtāk savākt surogātpasta sūtītājiem.</p>
        {/* Slēpts lauks: cilvēki to neredz un neaizpilda, roboti bieži aizpilda */}
        <label className="hp" aria-hidden="true">
          Mājaslapa <input ref={honeypot} tabIndex={-1} autoComplete="off" name="website" />
        </label>
      </section>

      {errors.form && <p className="alert err-box">{errors.form}</p>}
      <div className="row">
        <button type="submit" className="btn primary" disabled={saving || Boolean(uploading)}>
          {saving ? "Saglabā…" : isEdit ? "Saglabāt izmaiņas" : "Publicēt sludinājumu"}
        </button>
        <button type="button" className="btn" onClick={() => router.back()}>Atcelt</button>
      </div>
    </form>
  );
}
