// Neticamas vērtības (avota drukas kļūdas: 2026. g. auto ar 82 779 km, 2008. g. X5 ar 32 000 km).
// Datus nelabojam (tie ir avota fakti), bet šādus sludinājumus neizmantojam cenu salīdzinājumā un novērtējumā,
// un tiem pašiem nedodam „Laba cena / Virs tirgus” spriedumu.
import { sql } from "drizzle-orm";

/** SQL nosacījums: auto nobraukums atbilst vecumam. `a` – tabulas aizstājvārds vaicājumā (piem. "l", "x"). */
export function plausibleVehicle(a: string) {
  const age = `greatest(1, extract(year from now())::int - ${a}.year)`;
  return sql.raw(`not (${a}.mileage_km is not null and ${a}.year is not null and (
    ${a}.mileage_km > ${age} * 80000
    or (${a}.year > 1995 and extract(year from now())::int - ${a}.year >= 10 and ${a}.mileage_km < ${age} * 2500)
  ))`);
}
