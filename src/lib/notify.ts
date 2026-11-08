// Paziņojumi e-pastā un push (telefonā/pārlūkā): jauni sludinājumi saglabātajām meklēšanām un cenu kritumi favorītos.
// Palaiž /api/cron/notify (GitHub Actions grafiks, sk. .github/workflows/notify.yml).
// Atkārtota palaišana ir droša: katra meklēšana tiek pārbaudīta ne biežāk kā tās biežums atļauj.
import { createHmac, timingSafeEqual } from "node:crypto";
import { and, asc, eq, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { MAX_EMAILS_PER_RUN } from "./constants";
import { escapeHtml, sendMail } from "./email";
import { formatPrice, plural } from "./format";
import { locationLabel } from "./listings";
import { newListingsSince, parseSearch, toQuery } from "./search";
import { pushToUser, type PushMessage } from "./push";
import { makeT, type Locale } from "@/i18n/core";
import { DICTS } from "@/i18n/dicts";
import { trTitle } from "@/i18n/content";

const { savedSearches, users, favorites, listings, places, regions } = schema;

const appUrl = () => (process.env.APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");

// ---------- atrakstīšanās saites ----------
export type UnsubKind = "s" | "p"; // s = saglabātā meklēšana (id), p = cenu kritumi (lietotāja id)

function sign(kind: UnsubKind, id: string) {
  const secret = process.env.BETTER_AUTH_SECRET || "dev";
  return createHmac("sha256", secret).update(`unsub:${kind}:${id}`).digest("base64url").slice(0, 24);
}

export function unsubscribeUrl(kind: UnsubKind, id: string) {
  return `${appUrl()}/atrakstities?k=${kind}&id=${encodeURIComponent(id)}&t=${sign(kind, id)}`;
}

export function verifyUnsubscribe(kind: string, id: string, token: string): kind is UnsubKind {
  if (kind !== "s" && kind !== "p") return false;
  const a = Buffer.from(sign(kind, id));
  const b = Buffer.from(String(token));
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------- e-pasta veidne ----------
type Item = { id: string; title: string; price: number; deal: string | null; place: string | null; region: string | null; regionKind: "city" | "municipality" | null; oldPrice?: number };

const unit = (deal: string | null) => (deal === "rent" ? " /mēn." : deal === "day" ? " /dienā" : "");

function itemsHtml(items: Item[]) {
  return items
    .map((l) => {
      const url = `${appUrl()}/sludinajumi/${l.id}`;
      const price = l.oldPrice != null
        ? `<s style="color:#5d6475;font-weight:400">${formatPrice(l.oldPrice)}</s> <b style="color:#2f8a64">${formatPrice(l.price)}${unit(l.deal)}</b>`
        : `<b>${formatPrice(l.price)}${unit(l.deal)}</b>`;
      return `<tr><td style="padding:8px 0;border-bottom:1px solid #e6e8ee">
        <a href="${escapeHtml(url)}" style="color:#9e3039;font-weight:700;text-decoration:none">${escapeHtml(l.title)}</a><br>
        <span style="font-size:14px">${price}</span>
        <span style="color:#5d6475;font-size:13px"> · ${escapeHtml(locationLabel(l.place, l.region, l.regionKind))}</span></td></tr>`;
    })
    .join("");
}

const itemsText = (items: Item[]) =>
  items.map((l) => `- ${l.title} — ${l.oldPrice != null ? `${formatPrice(l.oldPrice)} → ` : ""}${formatPrice(l.price)}${unit(l.deal)}\n  ${appUrl()}/sludinajumi/${l.id}`).join("\n");

function layout(intro: string, body: string, footer: string) {
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#181b24;max-width:600px">
    <p style="font-size:18px;font-weight:700;margin:0 0 12px">Vienā<span style="color:#9e3039">Vietā</span></p>
    <p>${intro}</p>${body}
    <p style="color:#5d6475;font-size:12px;margin-top:24px">${footer}</p></div>`;
}

// ---------- push teksti (ierīces valodā) ----------
function searchPush(locale: Locale, found: { s: typeof savedSearches.$inferSelect; rows: Item[]; total: number }[]): PushMessage {
  const { t, tp } = makeT(locale, DICTS[locale]);
  const total = found.reduce((a, f) => a + f.total, 0);
  const first = found[0];
  const item = first.rows[0];
  if (total === 1 && item) {
    return { title: t("Jauns sludinājums: {name}", { name: first.s.name }), body: `${trTitle(item.title, t)} — ${formatPrice(item.price)}`, url: `/sludinajumi/${item.id}`, tag: "search" };
  }
  return {
    title: tp(total, "jauns sludinājums", "jauni sludinājumi"),
    body: found.map((f) => `${f.s.name} (${f.total})`).join(" · ").slice(0, 180),
    url: found.length === 1 ? `/?${toQuery(first.s.filters)}` : "/pazinojumi",
    tag: "search",
  };
}

function dropPush(locale: Locale, items: Item[]): PushMessage {
  const { t } = makeT(locale, DICTS[locale]);
  const it = items[0];
  if (items.length === 1) {
    return { title: t("Cena samazināta"), body: `${trTitle(it.title, t)}: ${formatPrice(it.oldPrice ?? it.price)} → ${formatPrice(it.price)}`, url: `/sludinajumi/${it.id}`, tag: "drop" };
  }
  return { title: t("Favorītiem samazināta cena ({n})", { n: items.length }), body: items.slice(0, 3).map((i) => trTitle(i.title, t)).join(" · ").slice(0, 180), url: "/favoriti", tag: "drop" };
}

// ---------- darbs ----------
export type RunResult = { searchesChecked: number; searchEmails: number; priceEmails: number; pushes: number; errors: number };

export async function runNotifications(now = new Date()): Promise<RunResult> {
  const res: RunResult = { searchesChecked: 0, searchEmails: 0, priceEmails: 0, pushes: 0, errors: 0 };
  let budget = MAX_EMAILS_PER_RUN;

  // 1) saglabātās meklēšanas, kurām pienācis laiks (e-pasts vai push)
  const hourAgo = new Date(now.getTime() - 50 * 60_000);
  const dayAgo = new Date(now.getTime() - 23 * 3600_000);
  const due = await db
    .select({ s: savedSearches, email: users.email })
    .from(savedSearches)
    .innerJoin(users, eq(savedSearches.userId, users.id))
    .where(
      and(
        or(eq(savedSearches.notifyEmail, true), eq(savedSearches.notifyPush, true)),
        isNull(users.blockedAt),
        or(
          isNull(savedSearches.lastNotifiedAt),
          and(eq(savedSearches.frequency, "hourly"), lt(savedSearches.lastNotifiedAt, hourAgo)),
          lt(savedSearches.lastNotifiedAt, dayAgo),
        ),
      ),
    )
    .orderBy(asc(savedSearches.userId), sql`${savedSearches.lastNotifiedAt} asc nulls first`)
    .limit(1000);

  type Found = { s: typeof savedSearches.$inferSelect; rows: Item[]; total: number };
  const byUser = new Map<string, { email: string; found: Found[]; checked: string[] }>();
  for (const { s, email } of due) {
    res.searchesChecked++;
    const { rows, total } = await newListingsSince(parseSearch(s.filters), s.lastSeenAt, now, 10);
    const u = byUser.get(s.userId) ?? { email, found: [], checked: [] };
    if (total > 0) u.found.push({ s, rows, total });
    else u.checked.push(s.id);
    byUser.set(s.userId, u);
  }

  for (const [userId, u] of byUser) {
    // bez jaunumiem: tikai atzīmējam pārbaudi
    if (u.checked.length) await db.update(savedSearches).set({ lastSeenAt: now, lastNotifiedAt: now }).where(inArray(savedSearches.id, u.checked));
    if (!u.found.length) continue;
    const byEmail = u.found.filter((f) => f.s.notifyEmail);
    const byPush = u.found.filter((f) => f.s.notifyPush);
    if (byEmail.length && budget <= 0) continue; // e-pastu limits: nākamajā kārtā
    if (byEmail.length) {
      const totalNew = byEmail.reduce((a, f) => a + f.total, 0);
      const html = byEmail
        .map((f) => {
          const more = f.total > f.rows.length ? `<p style="margin:6px 0 0"><a href="${escapeHtml(`${appUrl()}/?${toQuery(f.s.filters)}`)}" style="color:#9e3039">Visi jaunie (${f.total}) →</a></p>` : "";
          return `<h3 style="font-size:16px;margin:20px 0 4px">${escapeHtml(f.s.name)}</h3>
          <table style="width:100%;border-collapse:collapse">${itemsHtml(f.rows)}</table>${more}
          <p style="font-size:12px;margin:4px 0 0"><a href="${escapeHtml(unsubscribeUrl("s", f.s.id))}" style="color:#5d6475">Vairs nesūtīt par šo meklēšanu</a></p>`;
        })
        .join("");
      const text = byEmail.map((f) => `${f.s.name} (${plural(f.total, "jauns", "jauni")})\n${itemsText(f.rows)}\nAtrakstīties: ${unsubscribeUrl("s", f.s.id)}`).join("\n\n");
      try {
        await sendMail({
          to: u.email,
          subject: totalNew === 1 ? `Jauns sludinājums: ${byEmail[0].rows[0]?.title ?? byEmail[0].s.name}` : `${plural(totalNew, "jauns sludinājums", "jauni sludinājumi")} tavām meklēšanām`,
          html: layout("Parādījušies jauni sludinājumi, kas atbilst tavām saglabātajām meklēšanām:", html, `Paziņojumus vari mainīt sadaļā <a href="${appUrl()}/pazinojumi" style="color:#5d6475">Paziņojumi</a>.`),
          text: `Jauni sludinājumi tavām meklēšanām:\n\n${text}\n\nPaziņojumu iestatījumi: ${appUrl()}/pazinojumi`,
        });
        budget--;
        res.searchEmails++;
      } catch (err) {
        res.errors++;
        console.error("Paziņojumu e-pasts neizdevās:", err instanceof Error ? err.message : err);
        continue; // mēģināsim nākamajā kārtā
      }
    }
    if (byPush.length) {
      try {
        res.pushes += await pushToUser(userId, (loc) => searchPush(loc, byPush));
      } catch (err) {
        res.errors++;
        console.error("Push neizdevās:", err instanceof Error ? err.message : err);
      }
    }
    await db.update(savedSearches).set({ lastSeenAt: now, lastNotifiedAt: now }).where(inArray(savedSearches.id, u.found.map((f) => f.s.id)));
  }

  // 2) cenu kritumi favorītos
  const drops = await db
    .select({
      userId: users.id, email: users.email, wantEmail: users.notifyPriceDrops, wantPush: users.pushPriceDrops,
      id: listings.id, title: listings.title, price: listings.price, deal: listings.deal,
      place: places.name, region: regions.name, regionKind: regions.kind,
      oldPrice: sql<number>`coalesce(${favorites.notifiedPrice}, ${favorites.priceAtSave})`,
    })
    .from(favorites)
    .innerJoin(users, eq(favorites.userId, users.id))
    .innerJoin(listings, eq(favorites.listingId, listings.id))
    .leftJoin(places, eq(listings.placeId, places.id))
    .leftJoin(regions, eq(places.regionId, regions.id))
    .where(
      and(
        eq(listings.status, "active"),
        or(eq(users.notifyPriceDrops, true), eq(users.pushPriceDrops, true)),
        isNull(users.blockedAt),
        isNotNull(favorites.priceAtSave),
        sql`${listings.price} < coalesce(${favorites.notifiedPrice}, ${favorites.priceAtSave})`,
      ),
    )
    .limit(2000);

  const perUser = new Map<string, { email: string; wantEmail: boolean; wantPush: boolean; items: Item[] }>();
  for (const d of drops) {
    const u = perUser.get(d.userId) ?? { email: d.email, wantEmail: d.wantEmail, wantPush: d.wantPush, items: [] };
    u.items.push(d);
    perUser.set(d.userId, u);
  }
  for (const [userId, u] of perUser) {
    if (u.wantEmail && budget <= 0) continue;
    let delivered = false;
    if (u.wantEmail) {
      try {
        await sendMail({
          to: u.email,
          subject: u.items.length === 1 ? `Cena samazināta: ${u.items[0].title}` : `${plural(u.items.length, "favorītam", "favorītiem")} samazināta cena`,
          html: layout(
            "Sludinājumiem, ko saglabāji favorītos, ir samazināta cena:",
            `<table style="width:100%;border-collapse:collapse">${itemsHtml(u.items)}</table>`,
            `<a href="${appUrl()}/favoriti" style="color:#5d6475">Mani favorīti</a> · <a href="${escapeHtml(unsubscribeUrl("p", userId))}" style="color:#5d6475">Vairs nesūtīt cenu kritumus</a>`,
          ),
          text: `Favorītiem samazināta cena:\n\n${itemsText(u.items)}\n\nAtrakstīties: ${unsubscribeUrl("p", userId)}`,
        });
        budget--;
        res.priceEmails++;
        delivered = true;
      } catch (err) {
        res.errors++;
        console.error("Cenu krituma e-pasts neizdevās:", err instanceof Error ? err.message : err);
        continue;
      }
    }
    if (u.wantPush) {
      try {
        const n = await pushToUser(userId, (loc) => dropPush(loc, u.items));
        res.pushes += n;
        if (n) delivered = true;
      } catch (err) {
        res.errors++;
        console.error("Push neizdevās:", err instanceof Error ? err.message : err);
      }
    }
    // atzīmējam arī tad, ja lietotājam nav neviena kanāla (lai nepārbaudītu katru reizi no jauna)
    if (delivered || !u.wantEmail) {
      for (const it of u.items) {
        await db.update(favorites).set({ notifiedPrice: it.price }).where(and(eq(favorites.userId, userId), eq(favorites.listingId, it.id)));
      }
    }
  }
  return res;
}
