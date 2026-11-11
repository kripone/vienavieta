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
