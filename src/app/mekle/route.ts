// Brīvā teksta meklēšana: /mekle?q=… → saprot tekstu (src/lib/text-query.ts) un pāradresē uz "/" ar filtriem.
// tq = lietotāja teksts (rādām virs rezultātiem), tn = piezīmes, tu = nesaprastie vārdi.
import { NextResponse, type NextRequest } from "next/server";
import { parseTextQuery, textQueryCatalog } from "@/lib/text-query";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 200);
  const prefix = req.headers.get("x-url-locale") ? `/${req.headers.get("x-url-locale")}` : "";
  const base = process.env.APP_URL || req.nextUrl.origin;
  if (!q) return NextResponse.redirect(`${base}${prefix || "/"}`, 303);
  const p = new URLSearchParams();
  try {
    const r = parseTextQuery(q, await textQueryCatalog());
    for (const [k, v] of Object.entries(r.params)) p.set(k, v);
    if (r.notes.length) p.set("tn", r.notes.join(","));
    if (r.unknown.length) p.set("tu", r.unknown.slice(0, 6).join(" ").slice(0, 80));
    // neko nesapratām: parastā meklēšana pēc vārda virsrakstā
    if (!Object.keys(r.params).length) p.set("q", q.slice(0, 80));
  } catch (err) {
    console.error("Teksta meklēšana neizdevās:", err);
    p.set("q", q.slice(0, 80));
  }
  p.set("tq", q);
  return NextResponse.redirect(`${base}${prefix}/?${p}`, 303);
}
