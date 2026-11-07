import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { UnsubscribeForm } from "@/components/unsubscribe-form";
import { verifyUnsubscribe } from "@/lib/notify";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("Atrakstīties"), robots: { index: false } };
}

type SP = { k?: string; id?: string; t?: string };

/** Atrakstīšanās no e-pasta saites. Darbība notiek tikai pēc pogas nospiešanas (pasta programmas saites atver pašas). */
export default async function UnsubscribePage(props: { searchParams: Promise<SP> }) {
  const { k = "", id = "", t: tok = "" } = await props.searchParams;
  const valid = verifyUnsubscribe(k, id, tok);
  const { t } = await getT();
  return (
    <main className="wrap narrow">
      <h1>{t("Atrakstīties")}</h1>
      {!valid ? (
        <div className="notice">{t("Saite nav derīga. Paziņojumus vari mainīt sadaļā")} <a href="/pazinojumi">{t("Paziņojumi")}</a>.</div>
      ) : (
        <div className="panel stack">
          <p>{k === "s" ? t("Vairs nesūtīt e-pastus par šo saglabāto meklēšanu?") : t("Vairs nesūtīt e-pastus par cenu kritumiem favorītos?")}</p>
          <UnsubscribeForm k={k} id={id} t={tok} />
        </div>
      )}
    </main>
  );
}
