import { parseSearch, searchCount } from "@/lib/search";

/** Sludinājumu skaits ar meklēšanas filtriem (arī `zone`), bez koordinātām – kartes piemēra zonai. */
export async function GET(req: Request) {
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const total = await searchCount(parseSearch(sp));
  return Response.json({ total }, { headers: { "Cache-Control": "public, max-age=300" } });
}
