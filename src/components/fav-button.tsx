"use client";
import { useT } from "@/i18n/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toggleFavorite } from "@/app/favoriti/actions";

/** Sirsniņa: pievienot / noņemt no favorītiem. Neielogotam parāda, ko favorīti dod (piezīme, statuss, kalendārs), un piedāvā ielogoties. */
export function FavButton({ id, on, loggedIn, big }: { id: string; on: boolean; loggedIn: boolean; big?: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const path = usePathname();
  const [fav, setFav] = useState(on);
  const [busy, setBusy] = useState(false);
  const label = fav ? t("Noņemt no favorītiem") : t("Pievienot favorītiem");
  const dlg = useRef<HTMLDialogElement>(null);
  const [ask, setAsk] = useState(false);
  useEffect(() => { if (ask) dlg.current?.showModal(); }, [ask]);
  const loginHref = `/ielogoties?next=${encodeURIComponent(path)}`;

  async function click(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!loggedIn) {
      setAsk(true);
      return;
    }
    setBusy(true);
    setFav(!fav); // uzreiz parāda izmaiņu
    const r = await toggleFavorite(id);
    setBusy(false);
    if (r.ok) setFav(r.on);
    else if (r.login) router.push(`/ielogoties?next=${encodeURIComponent(path)}`);
    else setFav(fav);
  }

  // dialogs ir ārpus pogas (portāla notikumi React kokā citādi „uzburbuļotu” uz pogas klikšķi)
  return (
    <>
    <button type="button" className={`fav${fav ? " on" : ""}${big ? " big" : ""}`} aria-pressed={fav} aria-label={label} title={label} disabled={busy} onClick={click}>
      <svg viewBox="0 0 24 24" width={big ? 20 : 18} height={big ? 20 : 18} aria-hidden="true">
        <path d="M12 20.6s-7.6-4.6-9.4-9.3C1.4 8 3.5 4.6 6.9 4.6c2 0 3.5 1.1 4.3 2.4h1.6c.8-1.3 2.3-2.4 4.3-2.4 3.4 0 5.5 3.4 4.3 6.7-1.8 4.7-9.4 9.3-9.4 9.3z" />
      </svg>
      {big && <span>{fav ? t("Favorītos") : t("Saglabāt")}</span>}
    </button>
      {ask && typeof document !== "undefined" && createPortal(
        <dialog ref={dlg} className="fav-ask" onClose={() => setAsk(false)} onClick={(e) => { if (e.target === dlg.current) dlg.current?.close(); }}>
          <p className="fav-ask-h">♡ {t("Saglabā favorītos")}</p>
          <p>{t("Favorītos vari pierakstīt piezīmi, atzīmēt statusu un ielikt tikšanos kalendārā. Saņemsi ziņu, ja cena kritīsies.")}</p>
          <div className="row">
            <a className="btn primary" href={loginHref}>{t("Ielogoties")}</a>
            <button type="button" className="btn" onClick={() => dlg.current?.close()}>{t("Vēlāk")}</button>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  );
}
