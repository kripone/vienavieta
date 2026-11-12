import { getT } from "@/i18n/server";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db, schema } from "@/db";
import { SavedSearchRow, PriceDropToggle, PricePushToggle } from "@/components/saved-search-row";
import { TelegramConnect } from "@/components/telegram-connect";
import { InstallApp, PushDevice } from "@/components/pwa";
import { pushPublicKey, userHasPush } from "@/lib/push";
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
  const hasPush = await userHasPush(user.id);
  const rows = await db.select().from(schema.savedSearches).where(eq(schema.savedSearches.userId, user.id)).orderBy(desc(schema.savedSearches.createdAt));
  return (
    <main className="wrap narrow">
      <h1>{t("Paziņojumi")}</h1>
      <p className="lead">{t("Paziņojumus sūtām uz")} <b>{user.email}</b>.</p>

      <section className="panel stack" id="ierice">
        <h2>{t("Telefons un šī ierīce")}</h2>
        <p className="fine">{t("Instalē VienāVietā kā aplikāciju un saņem paziņojumus uzreiz telefonā, ne tikai e-pastā.")}</p>
        <InstallApp />
        <PushDevice publicKey={pushPublicKey()} />
      </section>

      <section className="panel stack" id="telegram">
        <h2>Telegram</h2>
        <p className="fine">{t("Pieslēdz mūsu botu un saņem jaunos sludinājumus un cenu kritumus Telegram čatā uzreiz.")}</p>
        <TelegramConnect chatId={user.telegramChatId} username={user.telegramUsername} priceDrops={user.telegramPriceDrops} />
      </section>

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
                notifyPush={r.notifyPush}
                notifyTelegram={r.notifyTelegram}
                hasPush={hasPush}
                hasTelegram={Boolean(user.telegramChatId)}
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
        {hasPush && <PricePushToggle on={user.pushPriceDrops} />}
      </section>
    </main>
  );
}
