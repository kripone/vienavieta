"use client";
import { useActionState, useState } from "react";
import { useT } from "@/i18n/client";
import { addFeed, deleteFeed, runNow, type FeedState } from "./actions";

export function AddFeedForm() {
  const { t } = useT();
  const [state, action, pending] = useActionState<FeedState, FormData>(addFeed, {});
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState("vehicle");
  return (
    <form action={action} className="panel stack">
      <label className="field">
        {t("Plūsmas saite (XML, CSV vai JSON)")}
        <input name="url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.tavssalons.lv/feed.xml" />
      </label>
      <label className="field">
        {t("Ko plūsma satur")}
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="vehicle">{t("Transportu")}</option>
          <option value="property">{t("Nekustamo īpašumu")}</option>
        </select>
      </label>
      <button className="btn primary" disabled={pending}>{pending ? t("Pievieno…") : t("Pievienot plūsmu")}</button>
      {state.error && <p className="err">{t(state.error)}</p>}
      {state.ok && <p className="ok">{t("Plūsma pievienota. Imports notiek fonā, pēc minūtes atjauno lapu.")}</p>}
    </form>
  );
}

export function FeedButtons({ id }: { id: number }) {
  const { t } = useT();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="row">
      <button type="button" className="btn small" disabled={busy} onClick={async () => { setBusy(true); await runNow(id); setBusy(false); }}>{t("Importēt tagad")}</button>
      {!confirm ? (
        <button type="button" className="btn small" onClick={() => setConfirm(true)}>{t("Dzēst")}</button>
      ) : (
        <>
          <span className="fine">{t("Dzēst plūsmu un tās sludinājumus?")}</span>
          <button type="button" className="btn small danger" disabled={busy} onClick={async () => { setBusy(true); await deleteFeed(id); }}>{t("Jā, dzēst")}</button>
          <button type="button" className="btn small" onClick={() => setConfirm(false)}>{t("Nē")}</button>
        </>
      )}
    </div>
  );
}
