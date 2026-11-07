import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { findByUrl } from "@/lib/history";

export const metadata: Metadata = { title: "Sludinājuma vēsture", description: "Ielīmē ss.com sludinājuma saiti un redzi, cik ilgi tas ir tirgū un kā mainījusies cena." };
export const dynamic = "force-dynamic";

export default async function HistoryLookup(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { u } = await props.searchParams;
  const url = (u ?? "").slice(0, 500);
  const id = url ? await findByUrl(url).catch(() => null) : null;
  if (id) redirect(`/sludinajumi/${id}#vesture`);
  return (
    <main className="wrap narrow">
      <h1>Sludinājuma vēsture</h1>
      <p className="lead">Ielīmē sludinājuma saiti no ss.com vai VienāVietā. Parādīsim, cik ilgi sludinājums ir tirgū, kāda bija sākuma cena un cik reizes tā mainīta.</p>
      <form className="lookup" action="/vesture">
        <input name="u" type="url" required defaultValue={url} placeholder="https://www.ss.com/msg/lv/transport/cars/…" aria-label="Sludinājuma saite" />
        <button className="btn primary">Meklēt</button>
      </form>
      {url && <p className="alert">Šo sludinājumu mūsu datos neatradām. Mēs redzam ss.com sludinājumus no 2026. gada novembra; jaunākie parādās 15 minūšu laikā.</p>}
    </main>
  );
}
