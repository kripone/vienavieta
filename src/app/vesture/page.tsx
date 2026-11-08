import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { langAlternates } from "@/lib/seo";
import { redirect } from "next/navigation";
import { findByUrl } from "@/lib/history";

export async function generateMetadata(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const { t, locale } = await getT();
  const filtered = Object.keys(await props.searchParams).length > 0;
  return { alternates: langAlternates("/vesture", locale), robots: filtered ? { index: false, follow: true } : undefined, title: t("Sludinājuma vēsture"), description: t("Ielīmē ss.com sludinājuma saiti un redzi, cik ilgi tas ir tirgū un kā mainījusies cena.") };
}
export const dynamic = "force-dynamic";

export default async function HistoryLookup(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { t } = await getT();
  const { u } = await props.searchParams;
  const url = (u ?? "").slice(0, 500);
  const id = url ? await findByUrl(url).catch(() => null) : null;
  if (id) redirect(`/sludinajumi/${id}#vesture`);
  return (
    <main className="wrap narrow">
      <h1>{t("Sludinājuma vēsture")}</h1>
      <p className="lead">{t("Ielīmē sludinājuma saiti no ss.com vai VienāVietā. Parādīsim, cik ilgi sludinājums ir tirgū, kāda bija sākuma cena un cik reizes tā mainīta.")}</p>
      <form className="lookup" action="/vesture">
        <input name="u" type="url" required defaultValue={url} placeholder={t("https://www.ss.com/msg/lv/transport/cars/…")} aria-label={t("Sludinājuma saite")} />
        <button className="btn primary">{t("Meklēt")}</button>
      </form>
      {url && <p className="alert">{t("Šo sludinājumu mūsu datos neatradām. Mēs redzam ss.com sludinājumus no 2026. gada novembra; jaunākie parādās 15 minūšu laikā.")}</p>}
    </main>
  );
}
