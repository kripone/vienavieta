// Kopīgots favorītu saraksts (saite no /favoriti). Publiski pieejams tikai ar saiti; meklētājiem slēgts.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { ListingCard } from "@/components/listing-card";
import { ShareReact } from "@/components/share-react";
import { sharedList, shareReactionRows } from "@/lib/favorites";
import { priceEvals } from "@/lib/price-eval";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ token: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("Kopīgots sludinājumu saraksts"), robots: { index: false, follow: false } };
}

export default async function SharedListPage(props: Props) {
  const { token } = await props.params;
  const { t, tp } = await getT();
  const list = await sharedList(token);
  if (!list) notFound();
  const [reactions, evals] = await Promise.all([
    shareReactionRows(list.share.id).catch(() => []),
    priceEvals(list.rows.map((r) => r.id)).catch(() => new Map()),
  ]);
  const owner = list.share.owner.trim().split(" ")[0];
  return (
    <main className="wrap">
      <h1>{owner ? t("{name} saglabātie sludinājumi", { name: owner }) : t("Kopīgots sludinājumu saraksts")}</h1>
      <p className="lead">{t("Apskati sludinājumus un pasaki savu viedokli: ieraksti vārdu, spied „patīk” vai „nepatīk” un, ja gribi, pieliec komentāru. Reģistrēties nevajag.")}</p>
      {list.rows.length === 0 ? (
        <div className="notice">{t("Sarakstā pašlaik nav sludinājumu.")}</div>
      ) : (
        <>
          <p className="fine">{tp(list.rows.length, "sludinājums", "sludinājumi")}</p>
          <div className="list">
            {list.rows.map((l) => (
              <div key={l.id} className="fav-item">
                <ListingCard l={l} showStatus evaluation={evals.get(l.id)} />
                <ShareReact token={token} listingId={l.id} initial={reactions.filter((r) => r.listingId === l.id)} />
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
