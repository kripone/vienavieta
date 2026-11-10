// City24 formāta JSON (sludinājumu masīvs, kā City24 eksportē) → plakans ieraksts salonu/aģentūru importam (dealer-feed.ts).
// Lieto tikai ar atļautu avotu: City24 partneru plūsma vai aģentūras pašas augšupielādēts fails (/importi).
// Ņemam tikai objekta faktus: cena, platība, istabas, stāvs, adrese/apkaime, koordinātas, galvenā bilde un saite.
// Brokera/biroja datus (vārds, tālrunis, e-pasts u.c.) un reklāmas tekstus (slogans) NEŅEMAM.
import { CITY24 } from "../constants";

type Flat = Record<string, string[]>;
type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => (v == null ? "" : typeof v === "string" || typeof v === "number" ? String(v).trim() : "");

/** Vai ieraksts izskatās pēc City24 sludinājuma (pietiek ar dažām tipiskām atslēgām). */
export function isCity24Item(o: unknown): boolean {
  if (!isObj(o)) return false;
  return "unit_type" in o && "transaction_type" in o && "property_size" in o && isObj(o.address);
}

/** "{fmt:em}" bildes adresē → konkrēts izmērs (CITY24.IMG_FMT). Tikai City24 attēlu serveris. */
export function city24Image(url: string): string | null {
  const u = url.replace("{fmt:em}", CITY24.IMG_FMT);
  return /^https:\/\/static\.img-city24\.lv\/object\/\d+\/[\w/.-]+\.(jpe?g|png|webp)$/i.test(u) ? u : null;
}

/**
 * Saite uz oriģinālu: plūsmas "url" (vai "link") vienmēr pirmā, ņemam tieši; citādi CITY24.LISTING_URL pēc friendly_id.
 * Saites pareizību pret City24 serveri nepārbaudām (tur Cloudflare), tikai sagatavojam no plūsmas datiem.
 */
export function city24Url(o: Obj): string | null {
  const own = str(o.url) || str(o.link);
  if (/^https?:\/\/\S+$/i.test(own)) return own;
  const id = str(o.friendly_id) || str(o.id);
  return /^\d+$/.test(id) ? CITY24.LISTING_URL.replace("{id}", id) : null;
}

// /transaction_types/1 = pārdod, /transaction_types/2 = izīrē; citus (piem. īstermiņa) nelasām.
const DEAL: Record<string, string> = { "1": "sell", "2": "rent" };

export function city24ToFlat(o: Obj): Flat {
  const f: Flat = {};
  const put = (k: string, v: unknown) => {
    const s = str(v);
    if (s) f[k] = [s];
  };
  const a = isObj(o.address) ? o.address : {};
  const attr = isObj(o.attributes) ? o.attributes : {};

  put("id", o.id);
  put("url", city24Url(o));
  put("kind", "property");
  put("propertytype", o.unit_type); // Apartment, House, Land, Commercial … → PTYPE dealer-feed.ts
  put("deal", DEAL[str(o.transaction_type).split("/").pop() ?? ""] ?? "");
  put("price", o.price);
  put("rooms", o.room_count);
  if (str(o.size_unit_id) === "" || str(o.size_unit_id) === "1") put("area", o.property_size); // 1 = m²
  if (str(o.lot_size_unit_id) === "" || str(o.lot_size_unit_id) === "1") put("land", o.lot_size);
  put("floor", attr.FLOOR);
  put("floors", attr.TOTAL_FLOORS);

  // vieta: Rīgā u.c. pilsētās apkaime, laukos pagasts/ciems, citādi pilsēta
  const city = str(a.city_name);
  const area = str(a.district_name) || str(a.village_name) || str(a.parish_name);
  const county = str(a.county_name);
  put("city", area || city || county);
  if (area && (city || county)) put("cityfallback", city || county); // apkaimi/pagastu meklē šajā pilsētā/novadā
  const street = str(a.street_name);
  const house = a.export_house_number === false ? "" : str(a.house_number);
  put("street", street ? `${street}${house ? ` ${house}` : ""}` : "");

  const lat = Number(o.latitude), lon = Number(o.longitude);
  if (lat > 55.5 && lat < 58.2 && lon > 20.8 && lon < 28.3) { put("lat", lat); put("lon", lon); } // tikai Latvijas robežās

  // viena bilde: galvenā (vai pirmā)
  const main = isObj(o.main_image) ? str(o.main_image.url) : "";
  const first = Array.isArray(o.images) ? str(o.images[0]) : "";
  const img = city24Image(main || first);
  if (img) f.image = [img];

  f.format = ["city24"];
  return f;
}
