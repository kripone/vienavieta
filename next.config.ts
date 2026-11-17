import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg un playwright ir Node.js bibliotēkas, tās nevajag iekļaut klienta kodā (playwright — autoplius.lt ievākšanai)
  serverExternalPackages: ["pg", "playwright", "playwright-core"],
  poweredByHeader: false,
  // importa faili līdz 15 MB (DEALER_FEED.MAX_BYTES)
  experimental: { serverActions: { bodySizeLimit: "16mb" }, proxyClientMaxBodySize: "16mb" },
  async headers() {
    return [
      {
        // pamata drošības galvenes visām lapām (CSP apzināti nav: ārējie skripti/kartes/sīktēli to padara riskantu)
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
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
