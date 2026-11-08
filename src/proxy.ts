// Vecā Render adrese (*.onrender.com) un www pāradresē uz galveno domēnu (CANONICAL_HOST, piem. vienavieta.lv).
// /api/health un /api/cron atstājam, lai Render pārbaudes un plānotie darbi strādā arī pa veco adresi.
import { NextResponse, type NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const canonical = process.env.CANONICAL_HOST;
  if (!canonical) return NextResponse.next();
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(":")[0].toLowerCase();
  if (!host || host === canonical) return NextResponse.next();
  if (!host.endsWith(".onrender.com") && host !== `www.${canonical}`) return NextResponse.next();
  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith("/api/health") || pathname.startsWith("/api/cron")) return NextResponse.next();
  return NextResponse.redirect(`https://${canonical}${pathname}${search}`, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
