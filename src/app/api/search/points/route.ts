import { parseSearch, searchPoints } from "@/lib/search";

/** Kartes punkti meklēšanai ar tiem pašiem filtriem kā sarakstā. */
export async function GET(req: Request) {
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const pts = await searchPoints(parseSearch(sp));
  return Response.json(
    pts.map((p) => [p.id, Math.round(p.lat! * 1e5) / 1e5, Math.round(p.lon! * 1e5) / 1e5, p.kind === "vehicle" ? 1 : 2, p.price, p.title]),
    { headers: { "Cache-Control": "public, max-age=30" } },
  );
}
