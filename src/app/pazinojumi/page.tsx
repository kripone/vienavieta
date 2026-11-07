import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db, schema } from "@/db";
import { SavedSearchRow, PriceDropToggle } from "@/components/saved-search-row";
import { MAX_SAVED_SEARCHES } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { toQuery } from "@/lib/search";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Paziņojumi" };

export default async function NotificationsPage() {
  const user = await requireUser("/pazinojumi");
  const rows = await db.select().from(schema.savedSearches).where(eq(schema.savedSearches.userId, user.id)).orderBy(desc(schema.savedSearches.createdAt));
  return (
    <main className="wrap narrow">
      <h1>Paziņojumi</h1>
      <p className="lead">Paziņojumus sūtām uz <b>{user.email}</b>.</p>

      <section className="panel stack">
        <h2>Saglabātās meklēšanas</h2>
        {rows.length === 0 ? (
          <p className="fine">
            Vēl nav saglabātu meklēšanu. Atver <a href="/">meklēšanu</a>, izvēlies filtrus un spied <b>🔔 Saglabāt meklēšanu</b>. Kad parādīsies jauni atbilstoši sludinājumi, atsūtīsim e-pastu.
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
                checked={r.lastNotifiedAt ? timeAgo(r.lastNotifiedAt) : null}
              />
            ))}
            <p className="fine">Saglabātas {rows.length} no {MAX_SAVED_SEARCHES}.</p>
          </>
        )}
      </section>

      <section className="panel stack">
        <h2>Favorīti</h2>
        <PriceDropToggle on={user.notifyPriceDrops} />
      </section>
    </main>
  );
}
