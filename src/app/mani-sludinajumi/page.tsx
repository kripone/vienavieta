import type { Metadata } from "next";
import { ListingCard } from "@/components/listing-card";
import { OwnerActions } from "@/components/owner-actions";
import { userListings } from "@/lib/listings";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mani sludinājumi" };

export default async function MyListingsPage() {
  const user = await requireUser("/mani-sludinajumi");
  const rows = await userListings(user.id);
  return (
    <main className="wrap">
      <div className="row between">
        <h1>Mani sludinājumi</h1>
        <a className="btn primary" href="/pievienot">+ Pievienot sludinājumu</a>
      </div>
      {rows.length === 0 ? (
        <div className="notice">Tev vēl nav sludinājumu.</div>
      ) : (
        <div className="list">
          {rows.map((l) => (
            <ListingCard key={l.id} l={l} showStatus actions={<OwnerActions id={l.id} status={l.status} compact />} />
          ))}
        </div>
      )}
    </main>
  );
}
