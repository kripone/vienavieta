// AI meklēšanas palīgs (Gemini). Lietotāja brīvā teksta vaicājums → strukturēti filtri →
// mūsu pašu searchListings. Modelis nekad "neizdomā" sludinājumus: rezultāti nāk tikai no DB.
import { and, eq, ilike } from "drizzle-orm";
import { db, schema } from "@/db";
import { parseSearch, searchListings, toQuery } from "./search";

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
};

export type AssistantAnswer = {
  reply: string;
  results: ChatResultItem[];
  total: number;
  moreUrl: string | null;
  /** "Cik vērts?" novērtējuma saite ar aizpildītiem datiem (ja lietotājs prasīja cenu savajam). */
  appraisalUrl: string | null;
};

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
- body: virsbūves tips: "Sedans" | "Universāls" | "Hečbeks" | "Apvidus" | "Minivens" | "Kupeja" | "Kabriolets" | "Pikaps" | "Mikroautobuss" (vārdus "kombi/universālis/karavāns" tulko kā "Universāls", "suv/džips/krosovers" kā "Apvidus")
- ptype: "Dzīvoklis" | "Istaba" | "Māja" | "Vasarnīca" | "Lauku īpašums" | "Zeme" | "Mežs" | "Birojs" | "Tirdzniecības telpas" | "Noliktava" | "Ražošanas telpas" | "Garāža" | "Stāvvieta"
- deal: "sell" (pārdod) | "rent" (izīrē) — tikai īpašumiem
- rmin, rmax: istabu skaits
- amin, amax: platība m²

- appraisal: ja lietotājs jautā, CIK VĒRTS ir viņa auto vai dzīvoklis (nevis meklē sludinājumus), tad search = null un aizpildi appraisal:
  {"veids":"car","make":"BMW","model":"X5","gads":2016,"km":180000} vai {"veids":"flat","city":"Rīga","platiba":50,"istabas":2,"adrese":"iela ja ir minēta"}
  Auto jautājumos bez gada/ modeļa pajautā pēc trūkstošā un appraisal neliec.

Piemēri:
"meklēju dīzeļa universāli līdz 8000 Rīgā" → {"reply":"Meklēju dīzeļa auto līdz 8000 € Rīgā…","search":{"cat":"vehicle","vc":"car","fuel":"Dīzelis","pmax":8000,"city":"Rīga"}}
"2 istabu dzīvoklis īrē Jūrmalā līdz 500" → {"reply":"Meklēju 2 istabu dzīvokli īrē Jūrmalā līdz 500 €…","search":{"cat":"property","ptype":"Dzīvoklis","deal":"rent","rmin":2,"rmax":2,"pmax":500,"city":"Jūrmala"}}
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
  body?: string;
  ptype?: string;
  deal?: string;
  rmin?: number;
  rmax?: number;
  amin?: number;
  amax?: number;
};

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

/** Pilsētas nosaukums → meklēšanas loc: lielās pilsētas ir regions (r:<id>), mazās vietas — places (p:<id>). */
async function resolveCity(city: string): Promise<string | undefined> {
  const like = `%${city.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
  const regs = await db
    .select({ id: regions.id, name: regions.name, kind: regions.kind })
    .from(regions)
    .where(ilike(regions.name, like))
    .limit(10);
  const regExact = regs.find((r) => r.name.toLowerCase() === city.toLowerCase());
  const regCity = regs.find((r) => r.kind === "city");
  if (regExact ?? regCity) return `r:${(regExact ?? regCity)!.id}`;
  const rows = await db
    .select({ id: places.id, name: places.name, kind: places.kind })
    .from(places)
    .where(ilike(places.name, like))
    .limit(10);
  if (!rows.length) return undefined;
  const exact = rows.find((r) => r.name.toLowerCase() === city.toLowerCase());
  const town = rows.find((r) => r.kind === "town");
  return `p:${(exact ?? town ?? rows[0]).id}`;
}

/** Gemini REST izsaukums (bezmaksas AI Studio atslēga; atbildi prasām JSON). */
async function callGemini(history: ChatMsg[], userText: string): Promise<{ reply: string; search: SearchFilters | null; appraisal: AppraisalFilters | null }> {
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
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
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
    const parsed = JSON.parse(text) as { reply?: string; search?: SearchFilters | null; appraisal?: AppraisalFilters | null };
    return {
      reply: String(parsed.reply ?? "").slice(0, 800) || "Atradu dažus variantus.",
      search: parsed.search ?? null,
      appraisal: parsed.appraisal ?? null,
    };
  } catch {
    // ja modelis neatgrieza JSON, visu tekstu rādām kā atbildi bez meklēšanas
    return { reply: text.slice(0, 800) || "Neizdevās saprast — pamēģini citādi.", search: null, appraisal: null };
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
    const md = await db
      .select({ id: models.id, name: models.name })
      .from(models)
      .where(and(eq(models.makeId, make.id), ilike(models.name, like(String(a.model).slice(0, 60)))))
      .limit(5);
    const model = md.find((m) => m.name.toLowerCase() === String(a.model).toLowerCase()) ?? md[0];
    if (!model) return "/novertejums";
    const p = new URLSearchParams({ make: String(make.id), model: String(model.id), gads: String(y) });
    const km = num(a.km, 0, 2_000_000);
    if (km != null) p.set("km", String(km));
    return `/novertejums?${p}`;
  }
  return null;
}

/** Galvenā funkcija: vaicājums → AI filtri → DB rezultāti + saite uz pilnu meklējumu. */
export async function runAssistant(history: ChatMsg[], userText: string): Promise<AssistantAnswer> {
  const ai = await callGemini(history, userText);
  const f = ai.search;
  if (!f) {
    const apUrl = ai.appraisal ? await appraisalUrl(ai.appraisal) : null;
    return { reply: ai.reply, results: [], total: 0, moreUrl: null, appraisalUrl: apUrl };
  }

  const raw: Record<string, string> = {};
  if (f.cat === "vehicle" || f.cat === "property") raw.cat = f.cat;
  if (f.vc && ["car", "moto", "camper", "van", "truck"].includes(f.vc)) raw.vc = f.vc;
  if (f.q) raw.q = String(f.q).slice(0, 80);
  if (f.country === "LT" || f.country === "LV") raw.country = f.country;
  const loc = f.city ? await resolveCity(String(f.city).slice(0, 60)) : undefined;
  if (loc) raw.loc = loc;
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
  if (f.body && ["Sedans", "Universāls", "Hečbeks", "Apvidus", "Minivens", "Kupeja", "Kabriolets", "Pikaps", "Mikroautobuss"].includes(f.body)) raw.body = f.body;
  if (f.ptype) raw.ptype = String(f.ptype);
  if (f.deal === "sell" || f.deal === "rent") raw.deal = f.deal;

  const s = parseSearch(raw);
  const { rows, total } = await searchListings(s);
  const results: ChatResultItem[] = rows.slice(0, 6).map((r) => {
    const ext = r.source !== "own" && r.externalUrl ? true : false;
    return {
      id: r.id,
      title: r.title,
      price: r.price,
      place: r.place ?? r.region ?? null,
      url: ext ? r.externalUrl! : `/sludinajumi/${r.id}`,
      ext,
      thumb: r.externalThumbUrl,
    };
  });
  const qs = toQuery({ ...raw, cat: raw.cat, vc: raw.vc });
  // meklēšanas rezultāti dzīvo sākumlapā ("/" ar filtru parametriem); /mekle ir tikai teksta pāradresētājs
  return { reply: ai.reply, results, total, moreUrl: total > 0 ? `/${qs ? `?${qs}` : ""}` : null, appraisalUrl: null };
}
