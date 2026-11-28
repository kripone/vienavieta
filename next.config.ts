import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg un playwright ir Node.js bibliotēkas, tās nevajag iekļaut klienta kodā (playwright — autoplius.lt ievākšanai)
  serverExternalPackages: ["pg", "playwright", "playwright-core"],
  poweredByHeader: false,
  // importa faili līdz 15 MB (DEALER_FEED.MAX_BYTES)
  experimental: { serverActions: { bodySizeLimit: "16mb" }, proxyClientMaxBodySize: "16mb" },
  // biežas kļūdainas adreses → pareizā lapa
  async redirects() {
    return ["", "/en", "/ru", "/lt"].flatMap((p) => [
      { source: `${p}/kritumi`, destination: `${p}/cenu-kritumi`, permanent: true },
      { source: `${p}/cenu-kritums`, destination: `${p}/cenu-kritumi`, permanent: true },
    ]);
  },
  async headers() {
    return [
      {
        // drošības galvenes visām lapām (audits 2026-11-28). Pilnu skriptu CSP nelikām: Google kartes, Telegram,
        // Cloudflare analītika un portālu bildes prasītu precīzu sarakstu; šeit tikai tas, kas neko nesalauž.
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // mikrofons – AI čata balss ievadei, atrašanās vieta – „tuvumā”; pārējais izslēgts
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(self), payment=(), usb=(), interest-cohort=()" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
      {
        // servisa darbiniekam vienmēr jābūt svaigam
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
