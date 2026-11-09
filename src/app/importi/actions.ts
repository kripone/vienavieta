"use server";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { DEALER_FEED } from "@/lib/constants";
import { checkFeedUrl, parseFeed, removeFeedListings, runFeed } from "@/lib/importers/dealer-feed";
import { isBusiness } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

const { dealerFeeds } = schema;
const g = globalThis as unknown as { feedRuns?: Set<number> };
const running = (g.feedRuns ??= new Set<number>());

export type FeedState = { ok?: boolean; error?: string };

async function dealer() {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesija beigusies. Ielogojies vēlreiz." } as const;
  if (!isBusiness(user.sellerType)) return { error: "Imports pieejams tikai saloniem un aģentūrām. Profilā norādi, ka esi salons vai aģentūra." } as const;
  return { user } as const;
}

/** Palaiž importu fonā (lai lapa negaida); rezultāts parādās pēc lapas atjaunošanas. */
function startRun(id: number) {
  if (running.has(id)) return;
  running.add(id);
  runFeed(id)
    .catch((e) => console.error("Salona plūsma:", e))
    .finally(() => {
      running.delete(id);
      revalidatePath("/importi");
    });
}

export async function addFeed(_prev: FeedState, form: FormData): Promise<FeedState> {
  const d = await dealer();
  if ("error" in d) return { error: d.error };
  const url = String(form.get("url") ?? "").trim().slice(0, 1000);
  const kind = form.get("kind") === "property" ? "property" : "vehicle";
  try {
    await checkFeedUrl(url);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Nederīga saite." };
  }
  const [{ n }] = await db.select({ n: count() }).from(dealerFeeds).where(eq(dealerFeeds.userId, d.user.id));
  if (n >= DEALER_FEED.MAX_FEEDS_PER_USER) return { error: `Var pievienot līdz ${DEALER_FEED.MAX_FEEDS_PER_USER} plūsmām.` };
  const [f] = await db.insert(dealerFeeds).values({ userId: d.user.id, url, kind }).returning({ id: dealerFeeds.id });
  startRun(f.id);
  revalidatePath("/importi");
  return { ok: true };
}

/** Augšupielādēts fails (XML, CSV vai JSON): importējam uzreiz; atjaunošanai augšupielādē jaunu failu ar to pašu nosaukumu. */
export async function uploadFeed(_prev: FeedState, form: FormData): Promise<FeedState> {
  const d = await dealer();
  if ("error" in d) return { error: d.error };
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { error: "Izvēlies failu." };
  if (file.size > DEALER_FEED.MAX_BYTES) return { error: "Fails ir par lielu." };
  const name = file.name.replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 100) || "fails";
  if (!/\.(xml|csv|json|txt)$/i.test(name)) return { error: "Atbalstīti faili: XML, CSV vai JSON." };
  const content = (await file.text()).replace(/^\uFEFF/, "");
  try {
    if (!parseFeed(content).length) return { error: "Failā neatradām nevienu sludinājumu. Pārbaudi formātu (skat. paraugu)." };
  } catch {
    return { error: "Failu neizdevās nolasīt. Pārbaudi formātu (skat. paraugu)." };
  }
  const kind = form.get("kind") === "property" ? "property" : "vehicle";
  const url = `file:${name}`;
  // tāds pats faila nosaukums = tā pati plūsma (atjauno sludinājumus, noņem trūkstošos)
  const [same] = await db.select({ id: dealerFeeds.id }).from(dealerFeeds).where(and(eq(dealerFeeds.userId, d.user.id), eq(dealerFeeds.url, url)));
  let id = same?.id;
  if (id) await db.update(dealerFeeds).set({ content, kind }).where(eq(dealerFeeds.id, id));
  else {
    const [{ n }] = await db.select({ n: count() }).from(dealerFeeds).where(eq(dealerFeeds.userId, d.user.id));
    if (n >= DEALER_FEED.MAX_FEEDS_PER_USER) return { error: `Var pievienot līdz ${DEALER_FEED.MAX_FEEDS_PER_USER} plūsmām vai failiem.` };
    [{ id }] = await db.insert(dealerFeeds).values({ userId: d.user.id, url, content, kind }).returning({ id: dealerFeeds.id });
  }
  startRun(id!);
  revalidatePath("/importi");
  return { ok: true };
}

export async function runNow(id: number) {
  const d = await dealer();
  if ("error" in d) return;
  const [f] = await db.select({ id: dealerFeeds.id }).from(dealerFeeds).where(and(eq(dealerFeeds.id, id), eq(dealerFeeds.userId, d.user.id)));
  if (f) startRun(f.id);
  revalidatePath("/importi");
}

export async function deleteFeed(id: number) {
  const d = await dealer();
  if ("error" in d) return;
  const [f] = await db.delete(dealerFeeds).where(and(eq(dealerFeeds.id, id), eq(dealerFeeds.userId, d.user.id))).returning({ id: dealerFeeds.id });
  if (f) await removeFeedListings(f.id);
  revalidatePath("/importi");
  revalidatePath("/mani-sludinajumi");
}

export async function isRunning(id: number) {
  return running.has(id);
}
