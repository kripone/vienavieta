import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingForm, type FormValues } from "@/components/listing-form";
import { getListing, regionOptions } from "@/lib/listings";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Rediģēt sludinājumu" };

const str = (v: unknown) => (v == null ? "" : String(v));

export default async function EditPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const user = await requireUser(`/sludinajumi/${id}/rediget`);
  const data = await getListing(id);
  if (!data || data.l.userId !== user.id || data.l.status === "deleted") notFound();
  const l = data.l;
  const initial: Partial<FormValues> & { id: string } = {
    id: l.id,
    kind: l.kind,
    title: l.title,
    description: str(l.description),
    price: str(l.price),
    placeId: str(l.placeId),
    contactPhone: str(l.contactPhone),
    contactEmail: str(l.contactEmail),
    vehicleClass: str(l.vehicleClass) || "car",
    makeId: str(l.makeId),
    modelId: str(l.modelId),
    makeText: str(l.makeText),
    modelText: str(l.modelText),
    year: str(l.year),
    mileageKm: str(l.mileageKm),
    fuel: str(l.fuel),
    gearbox: str(l.gearbox),
    body: str(l.body),
    engineL: l.engineL ? String(Number(l.engineL)) : "",
    powerKw: str(l.powerKw),
    drive: str(l.drive),
    color: str(l.color),
    vin: str(l.vin),
    propertyType: str(l.propertyType) || "Dzīvoklis",
    deal: str(l.deal) || "sell",
    rooms: str(l.rooms),
    areaM2: l.areaM2 ? String(Number(l.areaM2)) : "",
    landM2: str(l.landM2),
    floor: str(l.floor),
    floors: str(l.floors),
    series: str(l.series),
    material: str(l.material),
    heating: str(l.heating),
    condition: str(l.condition),
    builtYear: str(l.builtYear),
    purpose: str(l.purpose),
  };
  return (
    <main className="wrap mid">
      <h1>Rediģēt sludinājumu</h1>
      <ListingForm regions={await regionOptions()} initial={initial} initialAmenities={l.amenities} initialPhotos={data.photos.map((p) => ({ id: p.id, thumbUrl: p.thumbUrl }))} />
    </main>
  );
}
