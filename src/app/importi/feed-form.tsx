"use client";
import { useActionState, useState } from "react";
import { useT } from "@/i18n/client";
import { PARTNER_SOURCES } from "@/lib/constants";
import { addFeed, deleteFeed, runNow, uploadFeed, type FeedState } from "./actions";

function KindSelect({ kind, setKind }: { kind: string; setKind: (k: string) => void }) {
  const { t } = useT();
  return (
    <label className="field">
      {t("Ko satur")}
      <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
        <option value="vehicle">{t("Transportu")}</option>
        <option value="property">{t("Nekustamo īpašumu")}</option>
      </select>
    </label>
  );
}

/** Tikai administratoram: portāla partneru plūsma (sludinājumi ar portāla avotu, tikai fakti + sīktēls + saite). */
function SourceSelect() {
  const { t } = useT();
  return (
    <label className="field">
      {t("Avots")}
      <select name="source" defaultValue="">
        <option value="">{t("Mana salona vai aģentūras sludinājumi")}</option>
        {PARTNER_SOURCES.map((s) => (
          <option key={s} value={s}>{t("{s} partneru plūsma", { s })}</option>
        ))}
      </select>
    </label>
  );
}

/** Faila augšupielāde (XML, CSV, JSON). */
export function UploadForm({ defKind, admin }: { defKind: string; admin?: boolean }) {
  const { t } = useT();
  const [state, action, pending] = useActionState<FeedState, FormData>(uploadFeed, {});
  const [kind, setKind] = useState(defKind);
  return (
    <form action={action} className="panel stack">
      <h2>{t("Ielādēt failu")}</h2>
      <label className="field">
        {t("Fails (XML, CSV vai JSON)")}
        <input name="file" type="file" required accept=".xml,.csv,.json,.txt,text/xml,text/csv,application/json" />
      </label>
      <KindSelect kind={kind} setKind={setKind} />
      {admin && <SourceSelect />}
      <button className="btn primary" disabled={pending}>{pending ? t("Ielādē…") : t("Ielādēt sludinājumus")}</button>
      {state.error && <p className="err">{t(state.error)}</p>}
      {state.ok && <p className="ok">{t("Fails saņemts. Imports notiek fonā, pēc minūtes atjauno lapu.")}</p>}
    </form>
  );
}

export function AddFeedForm({ defKind, admin }: { defKind: string; admin?: boolean }) {
  const { t } = useT();
  const [state, action, pending] = useActionState<FeedState, FormData>(addFeed, {});
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState(defKind);
  return (
    <form action={action} className="panel stack">
      <h2>{t("Vai pievienot plūsmas saiti")}</h2>
      <label className="field">
        {t("Plūsmas saite (XML, CSV vai JSON)")}
        <input name="url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.tavssalons.lv/feed.xml" />
      </label>
      <KindSelect kind={kind} setKind={setKind} />
      {admin && <SourceSelect />}
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
