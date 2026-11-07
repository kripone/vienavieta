import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg ir Node.js bibliotēka, to nevajag iekļaut klienta kodā
  serverExternalPackages: ["pg"],
  poweredByHeader: false,
};

export default nextConfig;
