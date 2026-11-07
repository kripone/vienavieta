// VZD NĪTIS darījumi ar dzīvokļiem no Latvijas Atvērto datu portāla (CC BY 4.0).
// Datu kopa "Darījumi ar telpu grupām": darījumu CSV (~140 MB) + būvju koordinātu CSV.
// Failu nosaukumi mainās katru mēnesi, tāpēc saites ņemam no CKAN API (package_show).
// Atjauno reizi mēnesī (pēc 10. datuma VZD publicē jaunus datus); stāvoklis crawl_state "vzd:tg".
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { houseKey, houseTail } from "../vzd-key";

const { vzdDeals, crawlState } = schema;
const API = "https://data.gov.lv/dati/api/3/action/package_show?id=darijumi-ar-telpu-grupam";
const STATE = "vzd:tg";
const UA = "VienaVietaBot/1.0 (+https://vienavieta-omew.onrender.com)";

/** Viena CSV rinda ar pēdiņām ("a","b ""c""",""). Datu kopā rindās nav pārnesumu. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  const n = line.length;
  while (i <= n) {
    if (line[i] === '"') {
      let v = "";
      i++;
      for (;;) {
        const j = line.indexOf('"', i);
        if (j < 0) { v += line.slice(i); i = n; break; }
        v += line.slice(i, j);
        if (line[j + 1] === '"') { v += '"'; i = j + 2; } else { i = j + 1; break; }
      }
      out.push(v);
      i++; // komats
    } else {
      const j = line.indexOf(",", i);
      if (j < 0) { out.push(line.slice(i)); break; }
      out.push(line.slice(i, j));
      i = j + 1;
    }
  }
  return out;
}

async function* csvRows(url: string) {
  const r = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(15 * 60_000) });
  if (!r.ok || !r.body) throw new Error(`VZD ${r.status} ${url}`);
  const rl = createInterface({ input: Readable.fromWeb(r.body as never), crlfDelay: Infinity });
  let head: string[] | null = null;
  for await (const raw of rl) {
    const line = raw.replace(/^﻿/, "");
    if (!line) continue;
    const cells = parseCsvLine(line);
    if (!head) { head = cells; continue; }
    yield Object.fromEntries(head.map((h, i) => [h.trim(), cells[i] ?? ""])) as Record<string, string>;
  }
}

const num = (s: string) => {
  const v = Number(String(s).replace(",", "."));
  return Number.isFinite(v) ? v : null;
};
const int = (s: string) => {
  const v = num(s);
  return v == null ? null : Math.round(v);
};

type Deal = typeof vzdDeals.$inferInsert;

/** Viena darījuma rinda → mūsu ieraksts (vai null, ja nav vesels dzīvoklis). */
export function mapDeal(r: Record<string, string>, coords?: [number, number]): Deal | null {
  if (r.ObjType !== "Dz") return null;
  if (r.FlatCount !== "1" || r.PregShareParts !== r.PregNrOfShares) return null; // tikai vesels dzīvoklis
  const amount = int(r.DeaAmount);
  const area = num(r.FlatTotalArea) ?? num(r.PregTotalArea);
  const id = int(r.DeaId);
  if (!id || !amount || amount < 500 || !area || area < 8 || area > 1000 || !/^\d{4}-\d{2}-\d{2}$/.test(r.DeaDate)) return null;
  const parts = r.Std.split(",").map((s) => s.trim());
  const address = [parts[0].replace(/\s+-\s*\S+\s*$/, ""), ...parts.slice(1).filter((p) => !/^LV-\d{4}$/.test(p))].join(", ");
  const key = houseKey(r.Std);
  if (!key) return null;
  return {
    dealId: id,
    day: r.DeaDate,
    amount,
    areaM2: String(Math.round(area * 10) / 10),
    rooms: int(r.PreCount) || null,
    floor: int(r.PregFloorMin),
    floors: int(r.BuiGroundFloor),
    builtYear: int(r.BuiExploitYear),
    material: r.MaterialKind ? r.MaterialKind.replace(/^\d+\s*-\s*/, "").slice(0, 80) : null,
    address,
    houseKey: key,
    houseTail: houseTail(r.Std),
    city: r.ArCity || r.ArParish || null,
    buildingCadNr: r.BuiCadNr || null,
    lat: coords?.[0] ?? null,
    lon: coords?.[1] ?? null,
  };
}

async function resources() {
  const r = await fetch(API, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(30_000) });
  if (!r.ok) throw new Error(`VZD API ${r.status}`);
  const j = (await r.json()) as { result: { metadata_modified: string; resources: { format: string; url: string }[] } };
  const csv = j.result.resources.filter((x) => x.format?.toUpperCase() === "CSV");
  const deals = csv.find((x) => /darijumi/i.test(x.url))?.url;
  const coords = csv.find((x) => /koordinat/i.test(x.url))?.url;
  if (!deals) throw new Error("VZD: darījumu CSV nav atrasts");
  return { modified: j.result.metadata_modified, deals, coords };
}

/** Ielādē darījumus, ja VZD datu kopa mainījusies kopš pēdējās reizes. Atgriež null, ja nav ko darīt. */
export async function importVzdIfChanged(force = false) {
  const [st] = await db.select().from(crawlState).where(sql`${crawlState.name} = ${STATE}`);
  // VZD maina datus reizi mēnesī; API pārbaudām ne biežāk kā reizi 12 stundās
  if (!force && st?.lastQuickAt && Date.now() - st.lastQuickAt.getTime() < 12 * 3600_000) return null;
  const res = await resources();
  const prev = (st?.lastResult as { modified?: string } | null)?.modified;
  const now = new Date();
  if (!force && prev === res.modified) {
    await db.insert(crawlState).values({ name: STATE, lastQuickAt: now }).onConflictDoUpdate({ target: crawlState.name, set: { lastQuickAt: now } });
    return null;
  }
  const t0 = Date.now();
  // būvju koordinātas pēc darījuma ID
  const coords = new Map<number, [number, number]>();
  if (res.coords) {
    for await (const c of csvRows(res.coords)) {
      const id = Number(c.DeaId);
      const lat = Number(c.DdN), lon = Number(c.DdE);
      if (id && lat > 55 && lat < 58.2 && lon > 20.8 && lon < 28.5 && !coords.has(id)) coords.set(id, [lat, lon]);
    }
  }
  const seen = new Map<number, number>(); // DeaId → rindu skaits (vairāki dzīvokļi vienā darījumā izmetam)
  let batch: Deal[] = [];
  let saved = 0, rows = 0;
  const flush = async () => {
    if (!batch.length) return;
    await db
      .insert(vzdDeals)
      .values(batch)
      .onConflictDoUpdate({
        target: vzdDeals.dealId,
        set: { amount: sql`excluded.amount`, areaM2: sql`excluded.area_m2`, lat: sql`excluded.lat`, lon: sql`excluded.lon`, rooms: sql`excluded.rooms`, floor: sql`excluded.floor`, houseKey: sql`excluded.house_key`, houseTail: sql`excluded.house_tail` },
      });
    saved += batch.length;
    batch = [];
  };
  for await (const r of csvRows(res.deals)) {
    rows++;
    const id = Number(r.DeaId);
    seen.set(id, (seen.get(id) ?? 0) + 1);
    if (seen.get(id)! > 1) continue;
    const d = mapDeal(r, coords.get(id));
    if (!d) continue;
    batch.push(d);
    if (batch.length >= 1000) await flush();
  }
  await flush();
  coords.clear();
  // darījumi ar vairākām telpu grupām (vairāki dzīvokļi par kopsummu) nav salīdzināmi
  const multi = [...seen].filter(([, c]) => c > 1).map(([id]) => id);
  for (let i = 0; i < multi.length; i += 5000) {
    await db.execute(sql`delete from vzd_deals where deal_id in (${sql.join(multi.slice(i, i + 5000).map((x) => sql`${x}`), sql`, `)})`);
  }
  const result = { modified: res.modified, rows, saved, multi: multi.length, ms: Date.now() - t0 };
  await db
    .insert(crawlState)
    .values({ name: STATE, lastFullAt: now, lastQuickAt: now, lastResult: result })
    .onConflictDoUpdate({ target: crawlState.name, set: { lastFullAt: now, lastQuickAt: now, lastResult: result } });
  return result;
}
