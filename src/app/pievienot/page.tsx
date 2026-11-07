import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { ListingForm } from "@/components/listing-form";
import { regionOptions } from "@/lib/listings";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("Pievienot sludinājumu") };
}

export default async function AddPage() {
  const { t } = await getT();
  const user = await requireUser("/pievienot");
  if (!user.name) {
    return (
      <main className="wrap narrow">
        <h1>{t("Pievienot sludinājumu")}</h1>
        <p className="alert">
          {t("Pirms pirmā sludinājuma")} <a href="/profils">{t("aizpildi profilu")}</a>{t(": vārdu un, ja vēlies, tālruni.")}
        </p>
      </main>
    );
  }
  return (
    <main className="wrap mid">
      <h1>{t("Pievienot sludinājumu")}</h1>
      <p className="lead">{t("Lauki ar * ir obligāti. Pārējie palīdz pircējiem tevi atrast filtros.")}</p>
      <ListingForm regions={await regionOptions()} defaultPhone={user.phone ?? ""} />
    </main>
  );
}
