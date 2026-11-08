// 1) Vecā Render adrese (*.onrender.com) un www pāradresē uz galveno domēnu (CANONICAL_HOST, piem. vienavieta.lv).
//    /api/health un /api/cron atstājam, lai Render pārbaudes un plānotie darbi strādā arī pa veco adresi.
// 2) Valodu adreses: /en/…, /ru/…, /lt/… → tā pati lapa bez prefiksa ar galveni x-url-locale (sk. src/i18n/server.ts).
//    Latviešu valodai prefiksa nav.
import { NextResponse, type NextRequest } from "next/server";

const URL_LOCALES = ["en", "ru", "lt"];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const canonical = process.env.CANONICAL_HOST;
  if (canonical) {
    const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(":")[0].toLowerCase();
    if (host && host !== canonical && (host.endsWith(".onrender.com") || host === `www.${canonical}`) && !pathname.startsWith("/api/health") && !pathname.startsWith("/api/cron")) {
      return NextResponse.redirect(`https://${canonical}${pathname}${search}`, 308);
    }
  }
  const m = pathname.match(/^\/(en|ru|lt)(\/.*)?$/);
  if (m && URL_LOCALES.includes(m[1])) {
    const rest = m[2] || "/";
    // /en/ → /en (bez slīpsvītras beigās)
    if (rest === "/" && pathname.endsWith("/")) return NextResponse.redirect(new URL(`/${m[1]}${search}`, req.url), 308);
    // tehniskās adreses ar prefiksu nav vajadzīgas
    if (/^\/(api|_next)\//.test(rest)) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = rest;
    const headers = new Headers(req.headers);
    headers.set("x-url-locale", m[1]);
    const res = NextResponse.rewrite(url, { request: { headers } });
    // atceramies valodu arī lapām bez prefiksa (filtri, pieteikšanās u.c.)
    if (req.cookies.get("lang")?.value !== m[1]) res.cookies.set("lang", m[1], { path: "/", maxAge: 31536000, sameSite: "lax" });
    return res;
  }
  // neviens nedrīkst pats uzstādīt šo galveni
  if (req.headers.has("x-url-locale")) {
    const headers = new Headers(req.headers);
    headers.delete("x-url-locale");
    return NextResponse.next({ request: { headers } });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|og.png).*)"],
};
