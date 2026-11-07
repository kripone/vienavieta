import { getT } from "@/i18n/server";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db, schema } from "@/db";
import { SavedSearchRow, PriceDropToggle } from "@/components/saved-search-row";
import { MAX_SAVED_SEARCHES } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { toQuery } from "@/lib/search";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("Paziņojumi") };
}

export default async function NotificationsPage() {
  const { t } = await getT();
  const user = await requireUser("/pazinojumi");
  const rows = await db.select().from(schema.savedSearches).where(eq(schema.savedSearches.userId, user.id)).orderBy(desc(schema.savedSearches.createdAt));
  return (
    <main className="wrap narrow">
      <h1>{t("Paziņojumi")}</h1>
      <p className="lead">{t("Paziņojumus sūtām uz")} <b>{user.email}</b>.</p>

      <section className="panel stack">
        <h2>{t("Saglabātās meklēšanas")}</h2>
        {rows.length === 0 ? (
          <p className="fine">
            {t("Vēl nav saglabātu meklēšanu. Atver")} <a href="/">{t("meklēšanu")}</a>{t(", izvēlies filtrus un spied")} <b>{t("🔔 Saglabāt meklēšanu")}</b>{t(". Kad parādīsies jauni atbilstoši sludinājumi, atsūtīsim e-pastu.")}
          </p>
        ) : (
          <>
            {rows.map((r) => (
              <SavedSearchRow
                key={r.id}
                id={r.id}
                name={r.name}
                href={`/?${toQuery(r.filters)}`}
                frequency={r.frequency}
                notifyEmail={r.notifyEmail}
                checked={r.lastNotifiedAt ? timeAgo(r.lastNotifiedAt, t) : null}
              />
            ))}
            <p className="fine">Saglabātas {rows.length} no {MAX_SAVED_SEARCHES}.</p>
          </>
        )}
      </section>

      <section className="panel stack">
        <h2>{t("Favorīti")}</h2>
        <PriceDropToggle on={user.notifyPriceDrops} />
      </section>
    </main>
  );
}
