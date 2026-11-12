import type { MetadataRoute } from "next";

const base = () => (process.env.APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");

/** Meklētājiem: personīgās un tehniskās lapas neindeksē. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/ielogoties", "/profils", "/favoriti", "/saraksts/", "/pazinojumi", "/mani-sludinajumi", "/moderacija", "/importi", "/atrakstities", "/salidzinat", "/pievienot", "/*/rediget"] }],
    sitemap: `${base()}/sitemap.xml`,
  };
}
