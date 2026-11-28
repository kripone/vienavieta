import { parseSearch, searchCount } from "@/lib/search";
import { clientIp, overLimit } from "@/lib/client-ip";

/** Sludinājumu skaits ar meklēšanas filtriem (arī `zone`), bez koordinātām – kartes piemēra zonai. */
export async function GET(req: Request) {
  if (overLimit("search-count", clientIp(req.headers), 60, 60_000)) return Response.json({ error: "limit" }, { status: 429 });
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const total = await searchCount(parseSearch(sp));
  return Response.json({ total }, { headers: { "Cache-Control": "public, max-age=300" } });
}
