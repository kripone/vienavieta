import type { Metadata } from "next";
import { ListingForm } from "@/components/listing-form";
import { regionOptions } from "@/lib/listings";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Pievienot sludinājumu" };

export default async function AddPage() {
  const user = await requireUser("/pievienot");
  if (!user.name) {
    return (
      <main className="wrap narrow">
        <h1>Pievienot sludinājumu</h1>
        <p className="alert">
          Pirms pirmā sludinājuma <a href="/profils">aizpildi profilu</a>: vārdu un, ja vēlies, tālruni.
        </p>
      </main>
    );
  }
  return (
    <main className="wrap mid">
      <h1>Pievienot sludinājumu</h1>
      <p className="lead">Lauki ar * ir obligāti. Pārējie palīdz pircējiem tevi atrast filtros.</p>
      <ListingForm regions={await regionOptions()} defaultPhone={user.phone ?? ""} />
    </main>
  );
}
