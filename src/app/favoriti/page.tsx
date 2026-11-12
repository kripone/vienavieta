import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { ListingCard } from "@/components/listing-card";
import { activeShare, favoriteListings, shareReactionRows } from "@/lib/favorites";
import { FavNote } from "@/components/fav-note";
import { CopyLink } from "@/components/copy-link";
import { appBase } from "@/lib/seo";
import { createShare, deleteReaction, revokeShare } from "./actions";
import { priceEvals } from "@/lib/price-eval";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("Favorīti") };
}

export default async function FavoritesPage() {
  const { t, tp } = await getT();
  const user = await requireUser("/favoriti");
  const rows = await favoriteListings(user.id);
  const evals = await priceEvals(rows.map((r) => r.id)).catch(() => new Map());
  const drops = rows.filter((r) => r.priceWhenSaved != null && r.priceWhenSaved > r.price).length;
  const share = await activeShare(user.id).catch(() => null);
  const reactions = share ? await shareReactionRows(share.id).catch(() => []) : [];
  return (
    <main className="wrap">
      <div className="row between">
        <h1>{t("Favorīti")}</h1>
        <a className="btn small" href="/pazinojumi">{t("🔔 Cenu krituma paziņojumi")}</a>
      </div>
      {rows.length === 0 ? (
        <div className="notice">
          {t("Tev vēl nav saglabātu sludinājumu. Spied sirsniņu pie sludinājuma, lai to saglabātu šeit.")}
        </div>
      ) : (
        <>
          <p className="lead">
            {tp(rows.length, "saglabāts sludinājums", "saglabāti sludinājumi")}{drops > 0 ? ` · ${t("{n} ar samazinātu cenu kopš saglabāšanas", { n: drops })}` : ""}
          </p>
          <section className="panel share-box">
            <h2>👨‍👩‍👧 {t("Kopīgo sarakstu ar ģimeni vai draugiem")}</h2>
            {share ? (
              <>
                <p className="fine">{t("Ikviens ar šo saiti redz tavus saglabātos sludinājumus (izņemot atmestos) un var atstāt „patīk / nepatīk” un komentāru. Tavas privātās piezīmes viņi neredz.")}</p>
                <CopyLink url={`${appBase()}/saraksts/${share.token}`} title={t("Mani saglabātie sludinājumi")} />
                <form action={revokeShare}><button className="btn small">{t("Atsaukt saiti")}</button></form>
              </>
            ) : (
              <>
                <p className="fine">{t("Izveido saiti, ko nosūtīt otram: viņš redzēs tavus saglabātos sludinājumus un varēs atstāt „patīk / nepatīk” un komentāru bez reģistrācijas. Tavas privātās piezīmes viņš neredzēs.")}</p>
                <form action={createShare}><button className="btn primary">{t("Izveidot kopīgošanas saiti")}</button></form>
              </>
            )}
          </section>
          <div className="list">
            {rows.map((l) => {
              const rs = reactions.filter((r) => r.listingId === l.id);
              return (
                <div key={l.id} className="fav-item">
                  <ListingCard l={l} showStatus oldPrice={l.priceWhenSaved} favorite={{ on: true, loggedIn: true }} evaluation={evals.get(l.id)} compare />
                  {rs.length > 0 && (
                    <ul className="share-list">
                      {rs.map((r) => (
                        <li key={r.id}>
                          <b>{r.name}</b> {r.vote === "like" ? "👍" : r.vote === "dislike" ? "👎" : ""} {r.comment && <span>{r.comment}</span>}
                          <form action={deleteReaction}><input type="hidden" name="id" value={r.id} /><button className="link-btn" title={t("Dzēst")} aria-label={t("Dzēst")}>×</button></form>
                        </li>
                      ))}
                    </ul>
                  )}
                  <FavNote listingId={l.id} note={l.note} stage={l.stage} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
