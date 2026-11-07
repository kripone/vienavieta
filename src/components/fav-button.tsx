"use client";
import { useT } from "@/i18n/client";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toggleFavorite } from "@/app/favoriti/actions";

/** Sirsniņa: pievienot / noņemt no favorītiem. Neielogotu lietotāju aizved uz pieteikšanos. */
export function FavButton({ id, on, loggedIn, big }: { id: string; on: boolean; loggedIn: boolean; big?: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const path = usePathname();
  const [fav, setFav] = useState(on);
  const [busy, setBusy] = useState(false);
  const label = fav ? t("Noņemt no favorītiem") : t("Pievienot favorītiem");

  async function click() {
    if (!loggedIn) {
      router.push(`/ielogoties?next=${encodeURIComponent(path)}`);
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

  return (
    <button type="button" className={`fav${fav ? " on" : ""}${big ? " big" : ""}`} aria-pressed={fav} aria-label={label} title={label} disabled={busy} onClick={click}>
      <svg viewBox="0 0 24 24" width={big ? 20 : 18} height={big ? 20 : 18} aria-hidden="true">
        <path d="M12 20.6s-7.6-4.6-9.4-9.3C1.4 8 3.5 4.6 6.9 4.6c2 0 3.5 1.1 4.3 2.4h1.6c.8-1.3 2.3-2.4 4.3-2.4 3.4 0 5.5 3.4 4.3 6.7-1.8 4.7-9.4 9.3-9.4 9.3z" />
      </svg>
      {big && <span>{fav ? t("Favorītos") : t("Saglabāt")}</span>}
    </button>
  );
}
