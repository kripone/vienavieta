import type { Metadata } from "next";
import { UnsubscribeForm } from "@/components/unsubscribe-form";
import { verifyUnsubscribe } from "@/lib/notify";

export const metadata: Metadata = { title: "Atrakstīties", robots: { index: false } };

type SP = { k?: string; id?: string; t?: string };

/** Atrakstīšanās no e-pasta saites. Darbība notiek tikai pēc pogas nospiešanas (pasta programmas saites atver pašas). */
export default async function UnsubscribePage(props: { searchParams: Promise<SP> }) {
  const { k = "", id = "", t = "" } = await props.searchParams;
  const valid = verifyUnsubscribe(k, id, t);
  return (
    <main className="wrap narrow">
      <h1>Atrakstīties</h1>
      {!valid ? (
        <div className="notice">Saite nav derīga. Paziņojumus vari mainīt sadaļā <a href="/pazinojumi">Paziņojumi</a>.</div>
      ) : (
        <div className="panel stack">
          <p>{k === "s" ? "Vairs nesūtīt e-pastus par šo saglabāto meklēšanu?" : "Vairs nesūtīt e-pastus par cenu kritumiem favorītos?"}</p>
          <UnsubscribeForm k={k} id={id} t={t} />
        </div>
      )}
    </main>
  );
}
