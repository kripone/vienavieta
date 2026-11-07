import type { MetadataRoute } from "next";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const revalidate = 3600;
const base = () => (process.env.APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");

/** Galvenās lapas un pašu (ne ārējo portālu) aktīvie sludinājumi. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const b = base();
  const pages = ["", "/?cat=vehicle", "/?cat=property", "/tirgus", "/cenu-kritumi", "/darijumi", "/vesture", "/par-mums", "/noteikumi", "/privatums"].map((p) => ({ url: `${b}${p}`, changeFrequency: "daily" as const }));
  const own = await db
    .select({ id: schema.listings.id, updatedAt: schema.listings.updatedAt })
    .from(schema.listings)
    .where(and(eq(schema.listings.source, "own"), eq(schema.listings.status, "active")))
    .orderBy(desc(schema.listings.updatedAt))
    .limit(10000)
    .catch(() => []);
  return [...pages, ...own.map((l) => ({ url: `${b}/sludinajumi/${l.id}`, lastModified: l.updatedAt }))];
}
