// Dublikāti starp portāliem: tas pats auto vai īpašums VienāVietā un ss.com (vēlāk arī citos avotos).
// Grupas atslēga glabājas listings.group_key; meklēšanā rāda vienu kartīti (savējo pirmo) ar saitēm uz pārējām.
import { and, eq, gte, inArray, isNotNull, isNull, lte, ne, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { listings } = schema;

type Row = typeof listings.$inferSelect;

/** Cenas pielaide: ±3 % (cenas mēdz nedaudz atšķirties portālos). */
const priceRange = (p: number) => [Math.floor(p * 0.97), Math.ceil(p * 1.03)] as const;

/** Atrod tā paša objekta sludinājumu citā avotā; null, ja nav vai dati par maz drošai atbilstībai. */
export async function findDuplicate(l: Row): Promise<Row | null> {
  const [pmin, pmax] = priceRange(l.price);
  const base = [
    eq(listings.status, "active"),
    eq(listings.kind, l.kind),
    ne(listings.source, l.source),
    ne(listings.id, l.id),
    gte(listings.price, pmin),
    lte(listings.price, pmax),
  ];
  let extra;
  if (l.kind === "vehicle") {
    if (!l.year || !(l.makeId || l.makeText)) return null; // par maz datu
    const engineNum = l.engineL && /^\d+(\.\d+)?$/.test(l.engineL) ? Number(l.engineL) : null;
    // "Benzīns" un "Benzīns/gāze" uzskatāmi par saderīgiem (viens portāls gāzi norāda, otrs nē)
    const fuelGroup = l.fuel === "Benzīns" || l.fuel === "Benzīns/gāze" ? ["Benzīns", "Benzīns/gāze"] : l.fuel ? [l.fuel] : null;
    extra = [
      eq(listings.vehicleClass, l.vehicleClass!),
      // gads: līdzīgs (±1), jo pārdevēji portālos mēdz norādīt gadu ar nobīdi
      gte(listings.year, l.year - 1),
      lte(listings.year, l.year + 1),
      l.makeId ? eq(listings.makeId, l.makeId) : sql`lower(${listings.makeText}) = lower(${l.makeText})`,
      l.modelId ? or(eq(listings.modelId, l.modelId), sql`${listings.modelId} is null`) : undefined,
      l.mileageKm != null
        ? or(sql`${listings.mileageKm} is null`, and(gte(listings.mileageKm, Math.floor(l.mileageKm * 0.97) - 1000), lte(listings.mileageKm, Math.ceil(l.mileageKm * 1.03) + 1000)))
        : undefined,
      // atrašanās vieta: ja zināma abiem, tai jāsakrīt — cita pilsēta nozīmē, ka tā drīzāk nav tas pats auto
      l.placeId ? or(isNull(listings.placeId), eq(listings.placeId, l.placeId)) : undefined,
      // krāsa: ja zināma abiem (autoplius saraksta kartītēs krāsas nav, ss.com detaļās ir), tai jāsakrīt
      l.color ? or(isNull(listings.color), eq(listings.color, l.color)) : undefined,
      // dzinēja tilpums: ja zināms abiem, jāsakrīt ±0.1 l (2.0 pret 3.0 nav tas pats auto)
      engineNum != null ? or(isNull(listings.engineL), sql`abs((${listings.engineL})::numeric - ${engineNum}) <= 0.1`) : undefined,
      // degviela: ja zināma abiem, jāsakrīt (dīzelis pret benzīnu nav tas pats auto)
      fuelGroup ? or(isNull(listings.fuel), inArray(listings.fuel, fuelGroup)) : undefined,
    ];
  } else {
    if (!l.placeId || !(l.rooms || l.areaM2 || l.landM2)) return null;
    const area = l.areaM2 ? Number(l.areaM2) : null;
    extra = [
      eq(listings.propertyType, l.propertyType!),
      l.deal ? eq(listings.deal, l.deal) : undefined,
      eq(listings.placeId, l.placeId),
      l.rooms ? eq(listings.rooms, l.rooms) : undefined,
      area ? and(isNotNull(listings.areaM2), sql`abs(${listings.areaM2} - ${area}) <= 2`) : undefined,
      l.landM2 ? sql`abs(coalesce(${listings.landM2}, 0) - ${l.landM2}) <= ${Math.max(20, l.landM2 * 0.03)}` : undefined,
    ];
  }
  const [hit] = await db.select().from(listings).where(and(...base, ...extra)).limit(1);
  return hit ?? null;
}

/** Ja sludinājumam ir dublikāts citā avotā, abiem piešķir vienu grupu. Atgriež grupas atslēgu vai null. */
export async function linkDuplicate(id: string): Promise<string | null> {
  const l = await db.query.listings.findFirst({ where: eq(listings.id, id) });
  if (!l || l.status !== "active") return null;
  const dup = await findDuplicate(l);
  if (!dup) return null;
  const key = dup.groupKey ?? l.groupKey ?? dup.id;
  await db.update(listings).set({ groupKey: key }).where(inArray(listings.id, [l.id, dup.id]));
  return key;
}

export type AlsoAt = { id: string; source: string; url: string; price: number };

/** Pārējās vietas, kur publicēts tas pats objekts (kartītei "Arī: …"). */
export async function alsoAt(rows: { id: string; groupKey: string | null }[]): Promise<Map<string, AlsoAt[]>> {
  const keys = [...new Set(rows.map((r) => r.groupKey).filter(Boolean))] as string[];
  const out = new Map<string, AlsoAt[]>();
  if (!keys.length) return out;
  const members = await db
    .select({ id: listings.id, groupKey: listings.groupKey, source: listings.source, externalUrl: listings.externalUrl, price: listings.price })
    .from(listings)
    .where(and(inArray(listings.groupKey, keys), eq(listings.status, "active")));
  for (const r of rows) {
    if (!r.groupKey) continue;
    const others = members
      .filter((m) => m.groupKey === r.groupKey && m.id !== r.id)
      .map((m) => ({ id: m.id, source: m.source, url: m.source === "own" ? `/sludinajumi/${m.id}` : m.externalUrl ?? "", price: m.price }))
      .filter((m) => m.url);
    if (others.length) out.set(r.id, others);
  }
  return out;
}

/**
 * Meklēšanas nosacījums: no grupas rāda tikai vienu sludinājumu — savējo, ja tāds ir, citādi agrāko ārējo.
 * Pilni kolonnu nosaukumi, lai apakšvaicājums nesajauktu tabulas.
 */
export const groupPrimaryOnly = sql`not exists (
  select 1 from "listings" l2
  where l2."group_key" = "listings"."group_key" and "listings"."group_key" is not null
    and l2."status" = 'active' and l2."id" <> "listings"."id"
    and (
      (l2."source" = 'own' and "listings"."source" <> 'own')
      or (l2."source" <> 'own' and "listings"."source" <> 'own' and l2."created_at" < "listings"."created_at")
    )
)`;
