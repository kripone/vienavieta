// AI meklēšanas palīgs (Gemini). Lietotāja brīvā teksta vaicājums → strukturēti filtri →
// mūsu pašu searchListings. Modelis nekad "neizdomā" sludinājumus: rezultāti nāk tikai no DB.
import { and, eq, ilike, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { parseSearch, searchListings, toQuery } from "./search";
import { recentDrops } from "./history";
import { marketTotals, propertyByRegion, segmentTrend, topMakes } from "./market";
import { dealsByAddress } from "./vzd";
import { TRIMS } from "./trims";

const TRIM_NAMES = [...new Set(Object.values(TRIMS).flatMap((l) => l.map((x) => x.name)))];

const { places, regions, makes, models } = schema;

export type ChatMsg = { role: "user" | "model"; text: string };

export type ChatResultItem = {
  id: string;
  title: string;
  price: number | null;
  place: string | null;
  url: string;
  ext: boolean;
  thumb: string | null;
  /** cenu kritumiem: iepriekšējā cena (rādam "bija X →"). */
  prevPrice?: number | null;
  /** īpašumiem: adrese (rādam saiti uz darījumu cenām šajā adresē). */
  address?: string | null;
};

export type AssistantAnswer = {
  reply: string;
  results: ChatResultItem[];
  total: number;
  moreUrl: string | null;
  /** "Cik vērts?" novērtējuma saite ar aizpildītiem datiem (ja lietotājs prasīja cenu savajam). */
  appraisalUrl: string | null;
};

/** Lietotāja saskarnes valoda: atbildes teksts tajā (filtru vērtības paliek latviski, kā sistēma tās gaida). */
const LANG_NAME: Record<string, string> = { lv: "latviešu", en: "angļu (English)", ru: "krievu (русский)", lt: "lietuviešu (lietuvių)" };
function langNote(lang: string) {
  if (lang === "lv" || !LANG_NAME[lang]) return "";
  return `\n\nLietotāja saskarnes valoda: ${LANG_NAME[lang]}. Lauku "reply" raksti šajā valodā (ja vien lietotājs nepārprotami raksta citā valodā). Filtru vērtības (fuel, body, city u.c.) joprojām latviski, kā norādīts augstāk.`;
}

const SYSTEM_PROMPT = `Tu esi sludinājumu portāla VienāVietā (vienavieta.lv) AI meklēšanas palīgs. Portālā ir auto, motociklu, kemperu un nekustamā īpašuma sludinājumi no Latvijas un Lietuvas avotiem (ss.com, autoplius.lt, city24.lv u.c.).

Tavi uzdevumi:
1) Saproti lietotāja vēlmi latviešu valodā (lietotājs var rakstīt arī angliski/krieviski — atbildi viņa valodā, bet pēc noklusējuma latviski).
2) Ja lietotājs meklē sludinājumu, aizpildi "search" filtrus. Ja tas ir vispārīgs jautājums vai saruna, search = null.
3) Esi īss, draudzīgs un konkrēts. Neizdomā sludinājumus — tev tie parādīs sistēma.

Atbildi TIKAI ar JSON objektu (bez markdown):
{"reply": "īsa atbilde lietotājam", "search": {…} vai null}

search lauki (visi neobligāti, liec tikai tos, ko lietotājs minēja):
- cat: "vehicle" | "property"
- vc: "car" | "moto" | "camper" | "van" | "truck" (auto veids)
- q: marka un/vai modelis vienu stringā, piem. "BMW X5", "Toyota Corolla" (neliec šeit pilsētu vai citus filtrus)
- city: pilsētas nosaukums latviski, piem. "Rīga", "Liepāja", "Jūrmala"
- country: "LV" | "LT" (tikai ja lietotājs skaidri saka "Lietuvā")
- pmin, pmax: cena EUR (skaitļi; "līdz 8000" → pmax 8000)
- ymin, ymax: izlaiduma gads
- kmmax: maksimālais nobraukums km
- fuel: "Benzīns" | "Dīzelis" | "Hibrīds" | "Elektro" | "Benzīns/gāze"
- gear: "Manuāla" | "Automāts"
- trim: komplektācija (tikai kopā ar marku), tieši viens no: ${TRIM_NAMES.join(", ")} ("m sport", "m paka" → "M Sport"; "amg pakete" → "AMG Line")
- body: virsbūves tips: "Sedans" | "Universāls" | "Hečbeks" | "Apvidus" | "Minivens" | "Kupeja" | "Kabriolets" | "Pikaps" | "Mikroautobuss" (vārdus "kombi/universālis/karavāns" tulko kā "Universāls", "suv/džips/krosovers" kā "Apvidus")
- ptype: "Dzīvoklis" | "Istaba" | "Māja" | "Vasarnīca" | "Lauku īpašums" | "Zeme" | "Mežs" | "Birojs" | "Tirdzniecības telpas" | "Noliktava" | "Ražošanas telpas" | "Garāža" | "Stāvvieta"
- deal: "sell" (pārdod) | "rent" (izīrē) — tikai īpašumiem
- radiusKm: attālums km no pilsētas, ja lietotājs saka "līdz X km", "tuvumā", "apkārtnē", "rajonā" (piem. "Rīgas rajonā" → city "Rīga", radiusKm 30; "līdz 20 km no Jelgavas" → city "Jelgava", radiusKm 20)
- rmin, rmax: istabu skaits
- amin, amax: platība m²
- amen: ērtību saraksts īpašumiem (tikai no šīm): "Balkons", "Terase", "Lifts", "Stāvvieta", "Mēbelēts", "Dzīvnieki atļauti", "Kamīns", "Pirts", "Signalizācija" (piem. "ar balkonu un liftu" → ["Balkons","Lifts"]; "ar garāžu/autostāvvietu" → ["Stāvvieta"])

- drops: ja lietotājs jautā par CENU KRITUMIEM ("kādi auto samazinājuši cenu", "cenu kritumi šodien", "atlaižu auto"), tad search = null un aizpildi drops:
  {"kind": "vehicle" | "property" | null, "days": 1 (šodien) | 7 (nedēļā) | 30 (mēnesī), "minPct": minimālais kritums % (piem. "vairāk kā 10%" → 10; ja nemin — 1)}
- market: ja lietotājs jautā par TIRGUS cenām vai tendencēm ("kāda ir tirgus cena BMW X5", "cik maksā dzīvokļi Rīgā par kvadrātmetru", "kas notiek auto tirgū", "vai auto cenas krīt"), tad search = null un aizpildi market:
  {"make": "BMW", "model": "X5" (ja minēts), "vc": "car"|"moto"|"camper" (noklus. car)} — auto jautājumiem;
  {"ptype": "Dzīvoklis"|"Māja"|"Zeme", "deal": "sell"|"rent", "city": "Rīga" (ja minēta)} — īpašuma jautājumiem;
  {} — vispārīgs jautājums par tirgu.
- deals: ja lietotājs jautā par REĀLIEM dzīvokļu PĀRDOŠANAS darījumiem konkrētā adresē ("par cik pārdoti dzīvokļi Kalna ielā 13", "darījumu cenas Brīvības ielā 100"), tad search = null un aizpildi deals:
  {"address": "Kalna iela 13, Rīga"}
- appraisal: ja lietotājs jautā, CIK VĒRTS ir viņa auto vai dzīvoklis (nevis meklē sludinājumus), tad search = null un aizpildi appraisal:
  {"veids":"car","make":"BMW","model":"X5","gads":2016,"km":180000} vai {"veids":"flat","city":"Rīga","platiba":50,"istabas":2,"adrese":"iela ja ir minēta"}
  Auto jautājumos bez gada/ modeļa pajautā pēc trūkstošā un appraisal neliec.

Piemēri:
"meklēju dīzeļa universāli līdz 8000 Rīgā" → {"reply":"Meklēju dīzeļa auto līdz 8000 € Rīgā…","search":{"cat":"vehicle","vc":"car","fuel":"Dīzelis","pmax":8000,"city":"Rīga"}}
"2 istabu dzīvoklis īrē Jūrmalā līdz 500" → {"reply":"Meklēju 2 istabu dzīvokli īrē Jūrmalā līdz 500 €…","search":{"cat":"property","ptype":"Dzīvoklis","deal":"rent","rmin":2,"rmax":2,"pmax":500,"city":"Jūrmala"}}
"atrod dzīvokli Rīgā ar balkonu un liftu" → {"reply":"Meklēju dzīvokli Rīgā ar balkonu un liftu…","search":{"cat":"property","ptype":"Dzīvoklis","city":"Rīga","amen":["Balkons","Lifts"]}}
"dzīvoklis Rīgā vai tuvākajā apkārtnē līdz 20 km" → {"reply":"Meklēju dzīvokli Rīgā un līdz 20 km apkārtnē…","search":{"cat":"property","ptype":"Dzīvoklis","city":"Rīga","radiusKm":20}}
"kādi auto šodien samazinājuši cenu vairāk kā 10%" → {"reply":"Meklēju auto, kuriem šodien cena kritusies vairāk nekā par 10%…","search":null,"drops":{"kind":"vehicle","days":1,"minPct":10}}
"kāda šobrīd ir BMW X5 tirgus cena?" → {"reply":"Paskatīšos, kādas ir BMW X5 cenas tirgū…","search":null,"market":{"make":"BMW","model":"X5","vc":"car"}}
"cik maksā dzīvokļi Rīgā par kvadrātmetru?" → {"reply":"Paskatīšos dzīvokļu cenas Rīgā…","search":null,"market":{"ptype":"Dzīvoklis","deal":"sell","city":"Rīga"}}
"par cik pārdeva dzīvokļus Kalna ielā 13, Rīgā?" → {"reply":"Meklēju darījumus Kalna ielā 13…","search":null,"deals":{"address":"Kalna iela 13, Rīga"}}
"paldies!" → {"reply":"Veselīti! Ja vajadzēs vēl ko atrast — raksti.","search":null}`;

type SearchFilters = {
  cat?: "vehicle" | "property";
  vc?: string;
  q?: string;
  city?: string;
  country?: "LV" | "LT";
  pmin?: number;
  pmax?: number;
  ymin?: number;
  ymax?: number;
  kmmax?: number;
  fuel?: string;
  gear?: string;
  trim?: string;
  body?: string;
  ptype?: string;
  deal?: string;
  rmin?: number;
  rmax?: number;
  amin?: number;
  amax?: number;
  radiusKm?: number;
  amen?: string[];
};

type DropsFilters = { kind?: "vehicle" | "property" | null; days?: number; minPct?: number };

type MarketFilters = { make?: string; model?: string; vc?: string; ptype?: string; deal?: string; city?: string };
type DealsFilters = { address?: string };

type AppraisalFilters = {
  veids?: "car" | "flat";
  make?: string;
  model?: string;
  gads?: number;
  km?: number;
  city?: string;
  platiba?: number;
  istabas?: number;
  adrese?: string;
};

const num = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : undefined;
};

/** Pilsētas nosaukums → meklēšanas loc + centra koordinātes: lielās pilsētas ir regions (r:<id>), mazās vietas — places (p:<id>). */
async function resolveCity(city: string): Promise<{ loc: string; lat: number | null; lon: number | null } | undefined> {
  const like = `%${city.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
  const regs = await db
    .select({ id: regions.id, name: regions.name, kind: regions.kind })
    .from(regions)
    .where(ilike(regions.name, like))
    .limit(10);
  const reg = regs.find((r) => r.name.toLowerCase() === city.toLowerCase()) ?? regs.find((r) => r.kind === "city");
  if (reg) {
    // reģionam koordinātu nav — centrs ir tā vietu viduspunkts
    const c = await db.select({ la: sql<number | null>`avg(${places.lat})`, lo: sql<number | null>`avg(${places.lon})` }).from(places).where(eq(places.regionId, reg.id));
    return { loc: `r:${reg.id}`, lat: c[0]?.la ?? null, lon: c[0]?.lo ?? null };
  }
  const rows = await db
    .select({ id: places.id, name: places.name, kind: places.kind, lat: places.lat, lon: places.lon })
    .from(places)
    .where(ilike(places.name, like))
    .limit(10);
  if (!rows.length) return undefined;
  const hit = rows.find((r) => r.name.toLowerCase() === city.toLowerCase()) ?? rows.find((r) => r.kind === "town") ?? rows[0];
  return { loc: `p:${hit.id}`, lat: hit.lat, lon: hit.lon };
}

/** Aplis ap punktu kā daudzstūris (tā pati formula, ko lieto /api/zone rādiusa meklēšanai). */
function circle(lat: number, lon: number, km: number, n = 40): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    out.push([lat + (km / 111.2) * Math.cos(a), lon + (km / (111.2 * Math.cos((lat * Math.PI) / 180))) * Math.sin(a)]);
  }
  return out;
}

/** Gemini REST izsaukums (bezmaksas AI Studio atslēga; atbildi prasām JSON). */
async function callGemini(history: ChatMsg[], userText: string, lang = "lv"): Promise<{ reply: string; search: SearchFilters | null; appraisal: AppraisalFilters | null; drops: DropsFilters | null; market: MarketFilters | null; deals: DealsFilters | null }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY nav iestatīta");
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const contents = [
    ...history.slice(-8).map((m) => ({ role: m.role, parts: [{ text: m.text.slice(0, 2000) }] })),
    { role: "user" as const, parts: [{ text: userText.slice(0, 1000) }] },
  ];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT + langNote(lang) }] },
      contents,
      generationConfig: { temperature: 0.3, maxOutputTokens: 600, responseMimeType: "application/json" },
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  try {
    const parsed = JSON.parse(text) as { reply?: string; search?: SearchFilters | null; appraisal?: AppraisalFilters | null; drops?: DropsFilters | null; market?: MarketFilters | null; deals?: DealsFilters | null };
    return {
      reply: String(parsed.reply ?? "").slice(0, 800) || "Atradu dažus variantus.",
      search: parsed.search ?? null,
      appraisal: parsed.appraisal ?? null, drops: parsed.drops ?? null,
      market: parsed.market ?? null, deals: parsed.deals ?? null,
    };
  } catch {
    // ja modelis neatgrieza JSON, visu tekstu rādām kā atbildi bez meklēšanas
    return { reply: text.slice(0, 800) || "Neizdevās saprast — pamēģini citādi.", search: null, appraisal: null, drops: null, market: null, deals: null };
  }
}

/** "Cik vērts?" saite: AI minētie nosaukumi → kataloga ID → /novertejums ar aizpildītiem laukiem. */
async function appraisalUrl(a: AppraisalFilters): Promise<string | null> {
  if (a.veids === "flat") {
    const area = num(a.platiba, 8, 1000);
    if (!area) return null;
    let vieta: number | undefined;
    if (a.city) {
      const like = `%${String(a.city).replace(/[%_\\]/g, (m) => "\\" + m)}%`;
      const rows = await db.select({ id: places.id, name: places.name, kind: places.kind }).from(places).where(ilike(places.name, like)).limit(10);
      const exact = rows.find((r) => r.name.toLowerCase() === String(a.city).toLowerCase());
      vieta = (exact ?? rows.find((r) => r.kind === "town") ?? rows[0])?.id;
    }
    if (!vieta) return "/novertejums?veids=dzivoklis";
    const p = new URLSearchParams({ veids: "dzivoklis", vieta: String(vieta), platiba: String(area) });
    const rooms = num(a.istabas, 1, 10);
    if (rooms) p.set("istabas", String(rooms));
    if (a.adrese) p.set("adrese", String(a.adrese).slice(0, 120));
    return `/novertejums?${p}`;
  }
  if (a.veids === "car") {
    const y = num(a.gads, 1950, new Date().getFullYear() + 1);
    if (!a.make || !a.model || !y) return "/novertejums";
    const like = (v: string) => `%${v.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
    const mk = await db.select({ id: makes.id, name: makes.name }).from(makes).where(ilike(makes.name, like(String(a.make).slice(0, 40)))).limit(5);
    const make = mk.find((m) => m.name.toLowerCase() === String(a.make).toLowerCase()) ?? mk[0];
    if (!make) return "/novertejums";
    const model = await findModel(make.id, String(a.model).slice(0, 60));
    if (!model) return "/novertejums";
    const p = new URLSearchParams({ make: String(make.id), model: String(model.id), gads: String(y) });
    const km = num(a.km, 0, 2_000_000);
    if (km != null) p.set("km", String(km));
    return `/novertejums?${p}`;
  }
  return null;
}

const eur = (n: number) => `${Math.round(n).toLocaleString("lv-LV")} €`;

/** Modeļu salīdzināšanai: "3 sērija" ≡ "3. sērija", "X 5" ≡ "X5". */
const normName = (s: string) => s.toLowerCase().replace(/[.\s\-]+/g, "");

/** Atrod modeli markai: precīzs/ilike, tad normalizēta salīdzināšana pār visiem markas modeļiem. */
async function findModel(makeId: number, q: string): Promise<{ id: number; name: string } | undefined> {
  const like = `%${q.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
  const md = await db.select({ id: models.id, name: models.name }).from(models).where(and(eq(models.makeId, makeId), ilike(models.name, like))).limit(5);
  const direct = md.find((m) => m.name.toLowerCase() === q.toLowerCase()) ?? md[0];
  if (direct) return direct;
  const all = await db.select({ id: models.id, name: models.name }).from(models).where(eq(models.makeId, makeId)).limit(400);
  const nq = normName(q);
  return all.find((m) => normName(m.name) === nq) ?? all.find((m) => normName(m.name).includes(nq) || (nq.length >= 2 && nq.includes(normName(m.name))));
}

/** Tirgus jautājumi: mediānas cenas un tendences no market_stats / aktīvajiem sludinājumiem. */
async function marketAnswer(m: MarketFilters): Promise<{ reply: string; moreUrl: string } | null> {
  // īpašumi: cena par m² pa reģioniem
  if (m.ptype && !m.make) {
    const ptype = String(m.ptype).slice(0, 40);
    const deal = m.deal === "rent" ? "rent" : "sell";
    const regs = await propertyByRegion(ptype, deal).catch(() => []);
    if (!regs.length) return null;
    const dar = deal === "rent" ? "īrē" : "pārdošanā";
    if (m.city) {
      const c = String(m.city).toLowerCase();
      const hit = regs.find((r) => r.region.toLowerCase().includes(c) || c.includes(r.region.toLowerCase()));
      if (hit) return { reply: `${ptype} ${dar} reģionā „${hit.region}”: mediāna ${eur(hit.median)}/m² (${hit.n} sludinājumi). Pilns tirgus pārskats zem pogas.`, moreUrl: "/tirgus" };
    }
    const top = regs.slice(0, 3).map((r) => `${r.region} ${eur(r.median)}/m²`).join(", ");
    return { reply: `${ptype} ${dar} mediāna par m² pa reģioniem: ${top}. Vairāk — tirgus pārskatā.`, moreUrl: "/tirgus" };
  }
  // auto konkrēts modelis: tirgus momentuzņēmumu vēsture
  if (m.make) {
    const like = (v: string) => `%${v.replace(/[%_\\]/g, (x) => "\\" + x)}%`;
    const mk = await db.select({ id: makes.id, name: makes.name }).from(makes).where(ilike(makes.name, like(String(m.make).slice(0, 40)))).limit(5);
    const make = mk.find((x) => x.name.toLowerCase() === String(m.make).toLowerCase()) ?? mk[0];
    if (!make) return null;
    const vc = ["car", "moto", "camper", "van", "truck"].includes(String(m.vc)) ? String(m.vc) : "car";
    if (m.model) {
      const model = await findModel(make.id, String(m.model).slice(0, 60));
      if (model) {
        const t = await segmentTrend(`${vc}:${make.id}:${model.id}`).catch(() => []);
        if (t.length) {
          const last = t[t.length - 1];
          const ref = t.find((x) => Date.parse(last.day) - Date.parse(x.day) >= 80 * 86_400_000) ?? t[0];
          let trendTxt = "";
          if (ref !== last && ref.median > 0) {
            const pct = Math.round(((last.median - ref.median) / ref.median) * 100);
            trendTxt = pct === 0 ? " Cenas pēdējos mēnešos stabilas." : ` Pēdējo mēnešu laikā mediāna ${pct > 0 ? "augusi" : "kritusies"} par ${Math.abs(pct)}%.`;
          }
          return { reply: `${make.name} ${model.name} tirgū pašlaik ~${last.n} sludinājumi. Mediānas cena ${eur(last.median)}, tipiskais diapazons ${eur(last.p25)}–${eur(last.p75)}.${trendTxt} Detalizēti grafiki — tirgus pārskatā.`, moreUrl: "/tirgus" };
        }
      }
    }
    // tikai marka: kopsavilkums no aktīvajiem sludinājumiem
    const r = await db.execute<{ n: string; median: number }>(sql`
      select count(*) n, percentile_cont(0.5) within group (order by l.price)::int median
      from listings l where l.status = 'active' and l.kind = 'vehicle' and l.vehicle_class = ${vc} and l.make_id = ${make.id} and l.price > 100`);
    const n = Number(r.rows[0]?.n ?? 0);
    if (n > 0) return { reply: `${make.name} tirgū pašlaik ${n} sludinājumi, mediānas cena ${eur(Number(r.rows[0].median))}. Populārāko modeļu cenas un grafiki — tirgus pārskatā.`, moreUrl: "/tirgus" };
    return null;
  }
  // vispārīgs tirgus jautājums
  const [tot, top] = await Promise.all([marketTotals().catch(() => null), topMakes("car", 5).catch(() => [])]);
  if (!tot) return null;
  const cars = tot.vehicle ? Number(tot.vehicle.own) + Number(tot.vehicle.ext) : 0;
  const props = tot.property ? Number(tot.property.own) + Number(tot.property.ext) : 0;
  const topTxt = top.slice(0, 3).map((x) => `${x.name} (${x.n} gab., mediāna ${eur(x.median)})`).join(", ");
  return { reply: `Pašlaik portālā ~${cars} transporta un ~${props} īpašumu sludinājumi. Populārākās auto markas: ${topTxt}. Pilns tirgus pārskats zem pogas.`, moreUrl: "/tirgus" };
}

/** Darījumu jautājumi: reālās dzīvokļu pārdošanas cenas adresē (VZD dati). */
async function dealsAnswer(d: DealsFilters): Promise<{ reply: string; moreUrl: string | null } | null> {
  const address = String(d.address ?? "").trim().slice(0, 120);
  if (address.length < 3) return null;
  const res = await dealsByAddress(address).catch(() => null);
  if (!res) return null;
  const moreUrl = `/darijumi?q=${encodeURIComponent(address)}`;
  if (!res.houses.length) {
    const sugg = res.suggestions.slice(0, 3).join("; ");
    return { reply: `Šai adresei darījumu nav atrasts.${sugg ? ` Varbūt domāji: ${sugg}?` : " Ieraksti ielu kopā ar mājas numuru, piem. „Brīvības iela 100, Rīga”."}`, moreUrl: sugg ? moreUrl : null };
  }
  const h = res.houses[0];
  const last = h.deals.slice(0, 3).map((x) => `${String(x.day).slice(0, 7)}: ${eur(Number(x.amount))} (${x.areaM2} m²${x.rooms ? `, ${x.rooms} ist.` : ""})`).join("; ");
  return {
    reply: `${h.address}: zemesgrāmatā reģistrēti ${h.deals.length} dzīvokļu darījumi kopš 2016. gada${h.median != null ? `, mediāna ${eur(h.median)}/m²` : ""}.${last ? ` Pēdējie: ${last}.` : ""} Viss saraksts zem pogas.`,
    moreUrl,
  };
}

/** AI filtri → meklēšanas URL parametri (kopīgs čatam un /mekle). */
async function filtersToRaw(f: SearchFilters): Promise<Record<string, string>> {
  const raw: Record<string, string> = {};
  if (f.cat === "vehicle" || f.cat === "property") raw.cat = f.cat;
  if (f.vc && ["car", "moto", "camper", "van", "truck"].includes(f.vc)) raw.vc = f.vc;
  if (f.q) raw.q = String(f.q).slice(0, 80);
  if (f.country === "LT" || f.country === "LV") raw.country = f.country;
  const loc = f.city ? await resolveCity(String(f.city).slice(0, 60)) : undefined;
  const radiusKm = num(f.radiusKm, 1, 100);
  if (loc && radiusKm && loc.lat != null && loc.lon != null) {
    raw.zone = circle(loc.lat, loc.lon, radiusKm).map(([a, b]) => `${a.toFixed(5)},${b.toFixed(5)}`).join(";");
    raw.zl = ["km", String(radiusKm), "0", `${String(f.city).slice(0, 40)} +${radiusKm} km`].join("|");
  } else if (loc) raw.loc = loc.loc;
  const ranges: [string, number | undefined][] = [
    ["pmin", num(f.pmin, 0, 50_000_000)],
    ["pmax", num(f.pmax, 0, 50_000_000)],
    ["ymin", num(f.ymin, 1900, 2100)],
    ["ymax", num(f.ymax, 1900, 2100)],
    ["kmmax", num(f.kmmax, 0, 9_999_999)],
    ["rmin", num(f.rmin, 0, 50)],
    ["rmax", num(f.rmax, 0, 50)],
    ["amin", num(f.amin, 0, 100_000)],
    ["amax", num(f.amax, 0, 100_000)],
  ];
  for (const [k, v] of ranges) if (v != null) raw[k] = String(v);
  if (f.fuel && ["Benzīns", "Dīzelis", "Hibrīds", "Elektro", "Benzīns/gāze"].includes(f.fuel)) raw.fuel = f.fuel;
  if (f.gear && ["Manuāla", "Automāts"].includes(f.gear)) raw.gear = f.gear;
  if (f.trim && TRIM_NAMES.includes(f.trim)) raw.trim = f.trim;
  if (f.body && ["Sedans", "Universāls", "Hečbeks", "Apvidus", "Minivens", "Kupeja", "Kabriolets", "Pikaps", "Mikroautobuss"].includes(f.body)) raw.body = f.body;
  if (f.ptype) raw.ptype = String(f.ptype);
  if (f.deal === "sell" || f.deal === "rent") raw.deal = f.deal;
  const AMEN_OK = ["Balkons", "Terase", "Lifts", "Stāvvieta", "Mēbelēts", "Dzīvnieki atļauti", "Kamīns", "Pirts", "Signalizācija"];
  const amen = Array.isArray(f.amen) ? f.amen.map((a) => String(a)).filter((a) => AMEN_OK.includes(a)).slice(0, 6) : [];
  if (amen.length) raw.amen = amen.join(",");
  return raw;
}

/** /mekle: brīvais teksts → AI filtri (vai pāradresācija uz kritumiem/tirgu/darījumiem/novērtējumu). null = pārslēgties uz lokālo parsētāju. */
export async function aiTextToQuery(text: string): Promise<{ params?: Record<string, string>; redirect?: string } | null> {
  const ai = await callGemini([], text);
  if (ai.drops) {
    const d = ai.drops;
    const days = d.days === 1 || d.days === 30 ? d.days : 7;
    const p = new URLSearchParams();
    if (d.kind === "vehicle") p.set("k", "auto");
    else if (d.kind === "property") p.set("k", "ipasumi");
    if (days !== 7) p.set("d", String(days));
    return { redirect: `/cenu-kritumi${p.size ? `?${p}` : ""}` };
  }
  if (ai.deals?.address) return { redirect: `/darijumi?q=${encodeURIComponent(String(ai.deals.address).slice(0, 120))}` };
  if (ai.market) return { redirect: "/tirgus" };
  if (ai.appraisal && !ai.search) {
    const u = await appraisalUrl(ai.appraisal).catch(() => null);
    if (u) return { redirect: u };
  }
  if (!ai.search) return null;
  return { params: await filtersToRaw(ai.search) };
}

/** Galvenā funkcija: vaicājums → AI filtri → DB rezultāti + saite uz pilnu meklējumu. */
export async function runAssistant(history: ChatMsg[], userText: string, lang = "lv"): Promise<AssistantAnswer> {
  const ai = await callGemini(history, userText, lang);
  const f = ai.search;
  if (!f && ai.drops) {
    const d = ai.drops;
    const days = d.days === 1 || d.days === 30 ? d.days : 7;
    const minPct = num(d.minPct, 1, 99) ?? 1;
    const kind = d.kind === "vehicle" || d.kind === "property" ? d.kind : undefined;
    const all = await recentDrops({ kind, days, limit: 60 }).catch(() => []);
    const rows = all.filter((r) => (r.prev - r.card.price) / r.prev >= minPct / 100);
    const results: ChatResultItem[] = rows.slice(0, 6).map((r) => {
      // saites ved uz mūsu sludinājuma lapu (nevis uzreiz uz avota portālu) — avota saite ir tur
      return { id: r.card.id, title: r.card.title, price: r.card.price, place: r.card.place ?? null, url: `/sludinajumi/${r.card.id}`, ext: false, thumb: r.card.externalThumbUrl ?? null, prevPrice: r.prev, address: r.card.address ?? null };
    });
    const p = new URLSearchParams();
    if (kind === "vehicle") p.set("k", "auto");
    else if (kind === "property") p.set("k", "ipasumi");
    if (days !== 7) p.set("d", String(days));
    return { reply: ai.reply, results, total: rows.length, moreUrl: `/cenu-kritumi${p.size ? `?${p}` : ""}`, appraisalUrl: null };
  }
  if (!f && ai.market) {
    const m = await marketAnswer(ai.market).catch(() => null);
    if (m) return { reply: m.reply, results: [], total: 0, moreUrl: m.moreUrl, appraisalUrl: null };
  }
  if (!f && ai.deals) {
    const d = await dealsAnswer(ai.deals).catch(() => null);
    if (d) return { reply: d.reply, results: [], total: 0, moreUrl: d.moreUrl, appraisalUrl: null };
  }
  if (!f) {
    const apUrl = ai.appraisal ? await appraisalUrl(ai.appraisal) : null;
    return { reply: ai.reply, results: [], total: 0, moreUrl: null, appraisalUrl: apUrl };
  }

  const raw = await filtersToRaw(f);

  const s = parseSearch(raw);
  const { rows, total } = await searchListings(s);
  const results: ChatResultItem[] = rows.slice(0, 6).map((r) => ({
    // saites ved uz mūsu sludinājuma lapu (nevis uzreiz uz avota portālu) — avota saite ir tur
    id: r.id,
    title: r.title,
    price: r.price,
    place: r.place ?? r.region ?? null,
    url: `/sludinajumi/${r.id}`,
    ext: false,
    thumb: r.externalThumbUrl,
    address: r.address ?? null,
  }));
  const qs = toQuery({ ...raw, cat: raw.cat, vc: raw.vc });
  // meklēšanas rezultāti dzīvo sākumlapā ("/" ar filtru parametriem); /mekle ir tikai teksta pāradresētājs
  return { reply: ai.reply, results, total, moreUrl: total > 0 ? `/${qs ? `?${qs}` : ""}` : null, appraisalUrl: null };
}
