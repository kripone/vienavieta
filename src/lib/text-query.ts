// Brīvā teksta meklēšana ("ekonomisks dīzeļa universālis līdz 6000 eiro ar automātu", "3 istabu dzīvoklis Rīgas centrā"):
// teikumu pārvērš par parastajiem meklēšanas filtriem (src/lib/search.ts). Bez ārējiem AI pakalpojumiem: vārdu saknes
// latviski, krieviski un angliski + mūsu marku/modeļu un vietu katalogs. Ko nesaprot vai nevar pārbaudīt, atgriež `notes`.
import { matchModel } from "./importers/ss-rss";

export type TqCatalog = {
  makes: { id: number; name: string; vehicleClass: string }[];
  models: { id: number; makeId: number; name: string }[];
  regions: { id: number; name: string }[];
  /** pilsētas un valstspilsētu apkaimes (bez pagastiem un ciemiem) */
  places: { id: number; name: string; regionId: number }[];
};
export type TqResult = { params: Record<string, string>; notes: string[]; unknown: string[] };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ё/g, "е");
/** Vārda sakne locījumu salīdzināšanai: "riga" → "rig", "centrs" → "centr", "purvciems" → "purvciem". */
const stem = (w: string) => w.replace(/(as|es|is|us|s|a|e|i|u)$/, "");

const MAKE_ALIASES: Record<string, string> = {
  vw: "volkswagen", folksvagen: "volkswagen", фольксваген: "volkswagen", mercedes: "mercedes-benz", mersedes: "mercedes-benz", merc: "mercedes-benz", мерседес: "mercedes-benz",
  бмв: "bmw", ауди: "audi", тойота: "toyota", вольво: "volvo", опель: "opel", форд: "ford", шкода: "skoda", skoda: "skoda", рено: "renault", пежо: "peugeot",
  ниссан: "nissan", хонда: "honda", мазда: "mazda", киа: "kia", хендай: "hyundai", тесла: "tesla", ситроен: "citroen", citroen: "citroen",
};
const PLACE_ALIASES: Record<string, string> = { рига: "riga", риге: "riga", риги: "riga", юрмала: "jurmala", юрмале: "jurmala", центр: "centrs", центре: "centrs", лиепая: "liepaja", даугавпилс: "daugavpils", елгава: "jelgava" };

// JS \b strādā tikai ar latīņu burtiem; šis variants der arī kirilicai.
const B = String.raw`(?:(?<=[\p{L}\p{N}])(?![\p{L}\p{N}])|(?<![\p{L}\p{N}])(?=[\p{L}\p{N}]))`;
const rx = (re: RegExp | string, flags = "") => new RegExp((typeof re === "string" ? re : re.source).replace(/\\b/g, B), flags + "u");

type Rule = [RegExp, Record<string, string>, ("vehicle" | "property")?];
// Pārbauda pret tekstu bez garumzīmēm. Kārtība ir svarīga tikai tur, kur viens vārds ietver otru.
const RULES: Rule[] = [
  // degviela
  [/\b(dizel|dizal|diesel|tdi|дизел)/, { fuel: "Dīzelis" }, "vehicle"],
  [/\b(benzin|petrol|бензин)/, { fuel: "Benzīns" }, "vehicle"],
  [/\b(elektr|electric|электр)/, { fuel: "Elektro" }, "vehicle"],
  [/\b(hibrid|hybrid|гибрид)/, { fuel: "Hibrīds" }, "vehicle"],
  [/\b(gaze|gazes|lpg|газ)\b/, { fuel: "Benzīns/gāze" }, "vehicle"],
  // ātrumkārba
  [/\b(automat|автомат)/, { gear: "Automāts" }, "vehicle"],
  [/\b(manual|mehanik|rokas karb|механик|ручн)/, { gear: "Manuāla" }, "vehicle"],
  // virsbūve
  [/\b(universal|estate|wagon|kombi|универсал)/, { body: "Universāls" }, "vehicle"],
  [/\b(sedan|седан)/, { body: "Sedans" }, "vehicle"],
  [/\b(hecbek|hatchback|хэтчбек|хетчбек)/, { body: "Hečbeks" }, "vehicle"],
  [/\b(apvidus|dzip|suv|krosover|crossover|внедорожник|джип|кроссовер)/, { body: "Apvidus" }, "vehicle"],
  [/\b(miniven|minivan|минивэн|минивен)/, { body: "Minivens" }, "vehicle"],
  [/\b(kupej|coupe|купе)/, { body: "Kupeja" }, "vehicle"],
  [/\b(kabrio|cabrio|кабрио)/, { body: "Kabriolets" }, "vehicle"],
  [/\b(pikap|pickup|пикап)/, { body: "Pikaps" }, "vehicle"],
  [/\b(mikroautobus|микроавтобус)/, { body: "Mikroautobuss" }, "vehicle"],
  // piedziņa
  [/\b(4x4|pilnpiedzin|awd|quattro|xdrive|4matic|полный привод|полнопривод)/, { drive: "Pilnpiedziņa" }, "vehicle"],
  // krāsa
  [/\b(meln|black|черн)/, { color: "Melna" }, "vehicle"],
  [/\b(balt[sau]|white|бел)/, { color: "Balta" }, "vehicle"],
  [/\b(pelek|grey|gray|сер[ыао])/, { color: "Pelēka" }, "vehicle"],
  [/\b(sudrab|silver|серебр)/, { color: "Sudraba" }, "vehicle"],
  [/\b(zil[sau]|blue|син)/, { color: "Zila" }, "vehicle"],
  [/\b(sarkan|red\b|красн)/, { color: "Sarkana" }, "vehicle"],
  // transporta veids
  [/\b(motocikl|moto\b|мотоцикл)/, { vc: "moto" }, "vehicle"],
  [/\b(kemper|camper|кемпер|автодом)/, { vc: "camper" }, "vehicle"],
  [/\b(auto|masin|automasin|car\b|машин|авто)/, {}, "vehicle"],
  // īpašuma veids
  [/\b(dzivokl|apartment|flat\b|квартир)/, { ptype: "Dzīvoklis" }, "property"],
  [/\b(studij|studio|студи)/, { ptype: "Dzīvoklis", rmax: "1" }, "property"],
  [/\b(vasarnic|darza maj|дач)/, { ptype: "Vasarnīca" }, "property"],
  [/\b(privatmaj|maj[aues]|house|дом\b|дома\b)/, { ptype: "Māja" }, "property"],
  [/\b(zemes gabal|zemi|zeme\b|land\b|участок|земл)/, { ptype: "Zeme" }, "property"],
  [/\b(mez[su]|forest|лес\b)/, { ptype: "Mežs" }, "property"],
  [/\b(biroj|office|офис)/, { ptype: "Birojs" }, "property"],
  [/\b(garaz|garage|гараж)/, { ptype: "Garāža" }, "property"],
  [/\b(istabu? (ire|izire)|istabu izire|комнат[ау] (в аренду|снять))/, { ptype: "Istaba" }, "property"],
  // darījums
  [/\b(ire|ires|iret|izire|izire|rent|аренд|сниму|снять|сдаю|сдается)/, { deal: "rent" }, "property"],
  [/\b(pardod|pirkt|perk|buy|sale|продаж|куплю|купить)/, { deal: "sell" }],
  // sērija
  [/\b(jaun(ais|a|aja|u)? projekt|новостройк|new build)/, { series: "Jaunais projekts" }, "property"],
  [/\b(hruscov|хрущ)/, { series: "Hruščova laika" }, "property"],
  [/\b(stalin|сталин)/, { series: "Staļina laika" }, "property"],
  [/\b(pirmskara|довоен)/, { series: "Pirmskara" }, "property"],
  [/\b(lietuvies|литовск)/, { series: "Lietuviešu" }, "property"],
  [/\b(renovet|реновир)/, { series: "Renovēta ēka" }, "property"],
];
const ROOM_WORDS: [RegExp, number][] = [[/\b(vienistab|однокомн)\S*/, 1], [/\b(divistab|двухкомн|двушк)\S*/, 2], [/\b(tris ?istab|tristab|трехкомн|трешк)\S*/, 3], [/\b(cetristab|четырехкомн)\S*/, 4]];
/** Ērtības, ko citu portālu sludinājumos nevaram pārbaudīt (aprakstus neņemam): tikai paziņojam. */
const UNCHECKED: [RegExp, string][] = [[/\b(balkon|балкон)/, "balkons"], [/\b(lift|лифт)/, "lifts"], [/\b(teras|террас)/, "terase"], [/\b(stavviet|parking|парков)/, "stāvvieta"], [/\b(mebel|furnished|мебел)/, "mēbeles"], [/\b(remont|ремонт)/, "remonts"]];

const num = (s: string, k?: string) => Math.round(Number(s.replace(/[\s.](?=\d{3}\b)/g, "").replace(",", ".")) * (k ? 1000 : 1));
const NUM = String.raw`(\d{1,3}(?:[ .]\d{3})+|\d+(?:[.,]\d+)?)\s*(k\b|tk\b|tukst\w*|тыс\w*)?`;
const UPTO = String.raw`(?:lidz|ne vairak ka|ne dargak(?: par| ka)?|zem|max|up to|under|below|до|не дороже|не более)`;
const FROM = String.raw`(?:no|sakot no|vismaz|virs|from|over|above|от|не менее)`;
const EUR = String.raw`(?:eur\w*|eiro|€|евро)`;

export function parseTextQuery(text: string, cat: TqCatalog): TqResult {
  let s = ` ${norm(text).replace(/[,;!?"„“”()]+/g, " ").replace(/\s+/g, " ").trim()} `;
  const p: Record<string, string> = {};
  const notes: string[] = [];
  let kind: "vehicle" | "property" | undefined;
  const take = (re: RegExp, fn: (m: RegExpMatchArray) => void) => {
    const m = s.match(rx(re));
    if (m) { fn(m); s = s.replace(m[0], " "); }
    return Boolean(m);
  };

  // --- skaitļi ar mērvienību (pirms cenas, lai "līdz 200000 km" nekļūst par cenu)
  take(new RegExp(`${UPTO}?\\s*${NUM}\\s*(?:km|tkm|км)\\b`), (m) => { p.kmmax = String(num(m[1], m[2] || (/tkm/.test(m[0]) ? "k" : ""))); kind = "vehicle"; });
  take(new RegExp(`(${UPTO}|${FROM})?\\s*${NUM}\\s*(?:m2|m²|kv\\.? ?m\\w*|kvadr\\w*|кв\\.? ?м\\w*|м2)`), (m) => {
    const a = num(m[2]);
    if (m[1] && rx(UPTO).test(m[1])) p.amax = String(a);
    else if (m[1]) p.amin = String(a);
    else { p.amin = String(Math.floor(a * 0.85)); p.amax = String(Math.ceil(a * 1.15)); }
    kind ??= "property";
  });
  take(/\b(\d{1,2})\s*-?\s*(?:ist\w*|istab\w*|rooms?|bedrooms?|комн\w*|к\b)/, (m) => { p.rmin = p.rmax = m[1]; kind ??= "property"; });
  for (const [re, n] of ROOM_WORDS) take(re, () => { p.rmin = p.rmax = String(n); kind ??= "property"; });
  take(/\b(\d{1,2})\.?\s*(?:stav\w*|floor|этаж\w*)/, (m) => { p.fmin = p.fmax = m[1]; kind ??= "property"; });
  // --- gads: "no 2015", "2015+", "pēc 2015", "2015. g."
  take(new RegExp(`(?:${FROM}|pec|jaunaks par|после)\\s*((?:19[89]|20[0-3])\\d)\\b(?!\\s*${EUR})|\\b((?:19[89]|20[0-3])\\d)\\s*\\+`), (m) => { p.ymin = m[1] ?? m[2]; kind = "vehicle"; });
  take(new RegExp(`${UPTO}\\s*((?:19[89]|20[0-3])\\d)\\s*\\.?\\s*(?:g\\b|gad\\w*|год\\w*)`), (m) => { p.ymax = m[1]; kind = "vehicle"; });
  // --- cena: "līdz 6000 eiro", "no 50k", "50000-80000 €", "6000 eur"
  take(new RegExp(`${NUM}\\s*(?:-|–|lidz|до|to)\\s*${NUM}\\s*${EUR}`), (m) => { p.pmin = String(num(m[1], m[2] || m[4])); p.pmax = String(num(m[3], m[4])); });
  take(new RegExp(`${UPTO}\\s*${NUM}\\s*${EUR}?`), (m) => { p.pmax = String(num(m[1], m[2])); });
  take(new RegExp(`${FROM}\\s*${NUM}\\s*${EUR}`), (m) => { p.pmin = String(num(m[1], m[2])); });
  if (!p.pmax) take(new RegExp(`\\b${NUM}\\s*${EUR}`), (m) => { p.pmax = String(num(m[1], m[2])); });
  take(/\b((?:19[89]|20[0-3])\d)\b/, (m) => { p.ymin ??= m[1]; p.ymax ??= m[1]; kind = "vehicle"; });

  // --- vārdi
  for (const [re, set, k] of RULES) {
    if (!rx(re).test(s)) continue;
    for (const [key, val] of Object.entries(set)) p[key] ??= val;
    if (k) kind ??= k;
    s = s.replace(rx(re.source + String.raw`\S*`, "g"), " ");
  }
  if (rx(/\b(ekonomisk|taupig|economical|экономич)/).test(s)) {
    s = s.replace(rx(/\b(ekonomisk|taupig|economical|экономич)\S*/, "g"), " ");
    p.ccmax ??= "2";
    kind ??= "vehicle";
    notes.push("economy");
  }
  for (const [re, name] of UNCHECKED) if (rx(re).test(s)) { notes.push(`unchecked:${name}`); s = s.replace(rx(re.source + String.raw`\S*`, "g"), " "); kind ??= "property"; }

  // --- marka un modelis
  let words = s.trim().split(" ").filter(Boolean);
  const vc = p.vc ?? "car";
  const makeByKey = new Map(cat.makes.filter((m) => m.vehicleClass === vc).map((m) => [norm(m.name), m]));
  for (let i = 0; i < words.length && !p.make; i++) {
    for (const len of [2, 1]) {
      const raw = words.slice(i, i + len).join(" ");
      const key = MAKE_ALIASES[raw] ?? raw;
      const mk = makeByKey.get(key) ?? makeByKey.get(key.replace(/ /g, "-"));
      if (!mk || (len === 2 && words.length < i + 2)) continue;
      p.make = String(mk.id);
      kind = "vehicle";
      // modelis: nākamie 1–2 vārdi ("golf", "3 serija", "320", "e220")
      const rest = words.slice(i + len);
      let used = 0;
      for (const n of [2, 1]) {
        if (rest.length < n) continue;
        const md = matchModel(cat.models, mk.id, rest.slice(0, n).join(" "), mk.name);
        if (md) { p.model = String(md.id); used = n; break; }
      }
      words.splice(i, len + used);
      break;
    }
  }
  if (!p.make && kind !== "property") {
    // modelis bez markas ("passat", "octavia"): tikai, ja nosaukums ir vismaz 4 burti un viennozīmīgs
    const carMakes = new Set(cat.makes.filter((m) => m.vehicleClass === vc).map((m) => m.id));
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (w.length < 4 || /^\d+$/.test(w)) continue;
      const hits = cat.models.filter((m) => carMakes.has(m.makeId) && norm(m.name) === w);
      if (hits.length === 1) { p.make = String(hits[0].makeId); p.model = String(hits[0].id); kind = "vehicle"; words.splice(i, 1); break; }
    }
  }

  // --- vieta: pilsēta/novads un apkaime ("Rīgas centrā", "Purvciemā", "Jūrmalā")
  words = words.map((w) => PLACE_ALIASES[w] ?? w);
  const like = (name: string, w: string) => {
    const n = norm(name);
    if (n.includes(" ")) return false;
    const st = stem(n);
    return w === n || (st.length >= 3 && w.startsWith(st) && w.length - st.length <= (st.length >= 4 ? 3 : 2));
  };
  if (/\b(pierig|rigas rajon)/.test(words.join(" "))) { p.loc = "g:pieriga"; words = words.filter((w) => !/^(pierig|rigas|rajon)/.test(w)); }
  if (!p.loc) {
    let region: TqCatalog["regions"][number] | undefined;
    let ri = -1;
    words.forEach((w, i) => { if (!region) { const r = cat.regions.find((x) => like(x.name, w)); if (r) { region = r; ri = i; } } });
    let place: TqCatalog["places"][number] | undefined;
    let pi = -1;
    const riga = cat.regions.find((r) => norm(r.name) === "riga");
    words.forEach((w, i) => {
      if (place || i === ri) return;
      const hits = cat.places.filter((x) => like(x.name, w) && norm(x.name) !== norm(region?.name ?? ""));
      const hit = (region && hits.find((x) => x.regionId === region!.id)) || (!region && (hits.find((x) => x.regionId === riga?.id) || (hits.length === 1 ? hits[0] : undefined)));
      if (hit) { place = hit; pi = i; }
    });
    if (place) p.loc = `p:${place.id}`;
    else if (region) p.loc = `r:${region.id}`;
    words = words.filter((_, i) => i !== ri && i !== pi);
  }

  // --- kopsavilkums
  if (kind === "vehicle") { p.cat = "vehicle"; p.vc ??= "car"; }
  else if (kind === "property") {
    p.cat = "property";
    if (!p.deal && p.pmax && (p.ptype === "Dzīvoklis" || p.ptype === "Māja" || p.ptype === "Istaba")) p.deal = Number(p.pmax) <= 3000 ? "rent" : "sell";
  }
  // transporta filtri bez jēgas īpašumiem un otrādi
  if (p.cat !== "vehicle") for (const k of ["fuel", "gear", "body", "drive", "color", "ccmax", "kmmax", "ymin", "ymax", "vc", "make", "model"]) delete p[k];
  if (p.cat !== "property") for (const k of ["ptype", "rmin", "rmax", "amin", "amax", "fmin", "fmax", "series"]) delete p[k];
  if (p.cat !== "property" && p.deal) delete p.deal;
  if (p.body && p.vc && p.vc !== "car") delete p.body;

  const STOP = new Set(["ar", "un", "vai", "bez", "pie", "uz", "no", "lidz", "par", "ka", "es", "meklej", "mekleju", "gribu", "velos", "vajag", "labu", "labs", "laba", "karbu", "karba", "atrumkarbu", "atrumkarba", "ipasums", "sludinajums", "cena", "cenu", "gada", "gads", "g", "eur", "eiro", "with", "and", "the", "a", "in", "for", "i", "want", "looking", "gearbox", "с", "и", "в", "на", "до", "от", "ищу", "хочу", "коробкой", "коробка", "rajona", "rajons", "pilseta", "latvija", "latvijas"]);
  const unknown = words.filter((w) => !STOP.has(w) && w.length > 1);
  return { params: p, notes, unknown };
}

// ---------- katalogs no datubāzes (kešots 10 min) ----------
let cache: { at: number; cat: TqCatalog } | null = null;
export async function textQueryCatalog(): Promise<TqCatalog> {
  if (cache && Date.now() - cache.at < 600_000) return cache.cat;
  const { db, schema } = await import("@/db");
  const { sql } = await import("drizzle-orm");
  const [makes, models, regions, places] = await Promise.all([
    db.select({ id: schema.makes.id, name: schema.makes.name, vehicleClass: schema.makes.vehicleClass }).from(schema.makes),
    db.select({ id: schema.models.id, makeId: schema.models.makeId, name: schema.models.name }).from(schema.models),
    db.select({ id: schema.regions.id, name: schema.regions.name }).from(schema.regions).where(sql`${schema.regions.country} = 'LV'`),
    db.select({ id: schema.places.id, name: schema.places.name, regionId: schema.places.regionId }).from(schema.places)
      .innerJoin(schema.regions, sql`${schema.regions.id} = ${schema.places.regionId} and ${schema.regions.country} = 'LV'`)
      .where(sql`coalesce(${schema.places.kind}, '') not in ('village', 'parish')`),
  ]);
  // "Ogres novads" → meklējam pēc "Ogres"; pilsētas vārds ir arī vietu sarakstā
  const cat = { makes, models, regions: regions.map((r) => ({ ...r, name: r.name.replace(/ novads$/, "") })), places };
  cache = { at: Date.now(), cat };
  return cat;
}
