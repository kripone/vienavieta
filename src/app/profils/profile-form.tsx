"use client";
import { useActionState, useState } from "react";
import { updateProfile, type ProfileState } from "./actions";

type Props = { name: string; phone: string; sellerType: "private" | "dealer"; companyName: string };

export function ProfileForm(initial: Props) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  // Lauki ir kontrolēti, jo React pēc formas iesniegšanas atiestata nekontrolētos laukus
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [sellerType, setSellerType] = useState(initial.sellerType);
  const err = state.errors ?? {};

  return (
    <form action={action} className="stack" noValidate>
      <label className="field">
        Vārds vai vārds un uzvārds
        <input name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required aria-invalid={Boolean(err.name)} />
        {err.name && <span className="err">{err.name}</span>}
      </label>
      <label className="field">
        Tālrunis
        <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" placeholder="+371 20000000" aria-invalid={Boolean(err.phone)} />
        {err.phone && <span className="err">{err.phone}</span>}
        <span className="fine">Tālruni rādām tikai tad, ja pircējs spiež "Rādīt tālruni". Apstiprināšana ar SMS būs nākamajā solī.</span>
      </label>
      <fieldset className="field">
        <legend>Es esmu</legend>
        <div className="radios">
          <label>
            <input type="radio" name="sellerType" value="private" checked={sellerType === "private"} onChange={() => setSellerType("private")} /> Privātpersona
          </label>
          <label>
            <input type="radio" name="sellerType" value="dealer" checked={sellerType === "dealer"} onChange={() => setSellerType("dealer")} /> Auto salons vai nekustamo īpašumu aģentūra
          </label>
        </div>
      </fieldset>
      {sellerType === "dealer" && (
        <label className="field">
          Uzņēmuma nosaukums
          <input name="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoComplete="organization" aria-invalid={Boolean(err.companyName)} />
          {err.companyName && <span className="err">{err.companyName}</span>}
        </label>
      )}
      {sellerType === "private" && <input type="hidden" name="companyName" value="" />}
      <div className="row">
        <button type="submit" className="btn primary" disabled={pending}>
          {pending ? "Saglabā…" : "Saglabāt"}
        </button>
        {state.ok && !pending && <span className="ok">Saglabāts</span>}
        {err.form && <span className="err">{err.form}</span>}
      </div>
    </form>
  );
}
