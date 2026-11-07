import { and, count, desc, eq, ilike, inArray, isNotNull, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { listings, reports, users } = schema;

/** Sludinājumi ar atvērtām sūdzībām: visvairāk sūdzību pirmie. */
export async function reportedListings() {
  const rows = await db
    .select({
      id: listings.id,
      title: listings.title,
      status: listings.status,
      price: listings.price,
      kind: listings.kind,
      ownerId: users.id,
      ownerEmail: users.email,
      ownerName: users.name,
      ownerBlocked: users.blockedAt,
      reports: count(reports.id),
      reasons: sql<string[]>`array_agg(${reports.reason}::text order by ${reports.createdAt} desc)`,
      notes: sql<(string | null)[]>`array_agg(${reports.note} order by ${reports.createdAt} desc)`,
      lastAt: sql<Date>`max(${reports.createdAt})`,
    })
    .from(reports)
    .innerJoin(listings, eq(reports.listingId, listings.id))
    .leftJoin(users, eq(listings.userId, users.id)) // ārējiem sludinājumiem autora nav
    .where(and(eq(reports.status, "open"), inArray(listings.status, ["active", "pending", "sold", "hidden"])))
    .groupBy(listings.id, users.id)
    .orderBy(desc(count(reports.id)), desc(sql`max(${reports.createdAt})`))
    .limit(100);
  return rows.map((r) => ({ ...r, lastAt: new Date(r.lastAt) }));
}

/** Paslēptie (moderatora vai sūdzību dēļ) sludinājumi. */
export async function hiddenListings() {
  return db
    .select({
      id: listings.id,
      title: listings.title,
      status: listings.status,
      price: listings.price,
      updatedAt: listings.updatedAt,
      ownerId: users.id,
      ownerEmail: users.email,
      ownerBlocked: users.blockedAt,
    })
    .from(listings)
    .leftJoin(users, eq(listings.userId, users.id))
    .where(inArray(listings.status, ["pending", "hidden"]))
    .orderBy(desc(listings.updatedAt))
    .limit(100);
}

/** Lietotāju meklēšana pēc e-pasta, vārda vai uzņēmuma; bez meklējuma: jaunākie un bloķētie. */
export async function findUsers(q?: string) {
  const like = q ? `%${q.replace(/[%_\\]/g, (m) => "\\" + m)}%` : null;
  // Pilni kolonnu nosaukumi: drizzle vienas tabulas vaicājumā tabulu prefiksus nomet, un "id" kļūst divdomīgs.
  const listingCount = sql<number>`(select count(*)::int from "listings" l where l."user_id" = "users"."id" and l."status" <> 'deleted')`;
  const reportCount = sql<number>`(select count(*)::int from "reports" r inner join "listings" l on l."id" = r."listing_id" where l."user_id" = "users"."id")`;
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      companyName: users.companyName,
      role: users.role,
      blockedAt: users.blockedAt,
      createdAt: users.createdAt,
      listingCount,
      reportCount,
    })
    .from(users)
    .where(like ? or(ilike(users.email, like), ilike(users.name, like), ilike(users.companyName, like)) : undefined)
    .orderBy(sql`${users.blockedAt} desc nulls last`, desc(users.createdAt))
    .limit(50);
}

export async function moderationCounts() {
  const [[open], [hidden], [blocked]] = await Promise.all([
    db.select({ n: sql<number>`count(distinct ${reports.listingId})::int` }).from(reports).where(eq(reports.status, "open")),
    db.select({ n: count() }).from(listings).where(inArray(listings.status, ["pending", "hidden"])),
    db.select({ n: count() }).from(users).where(isNotNull(users.blockedAt)),
  ]);
  return { open: open.n, hidden: hidden.n, blocked: blocked.n };
}
