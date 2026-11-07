import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { ModActions } from "@/components/mod-actions";
import { REPORT_REASONS } from "@/lib/constants";
import { formatPrice, plural, timeAgo } from "@/lib/format";
import { findUsers, hiddenListings, moderationCounts, reportedListings } from "@/lib/moderation";
import { isModerator, requireModerator } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("Moderācija"), robots: { index: false } };
}

type SP = { tab?: string; q?: string };
const TABS = [
  ["sudzibas", "Sūdzības"],
  ["paslepti", "Paslēptie"],
  ["lietotaji", "Lietotāji"],
] as const;
const STATUS: Record<string, string> = { active: "Aktīvs", pending: "Paslēpts pēc sūdzībām", hidden: "Paslēpis moderators", sold: "Pārdots" };
const reasonLabel = (r: string) => REPORT_REASONS[r as keyof typeof REPORT_REASONS] ?? r;

export default async function ModerationPage(props: { searchParams: Promise<SP> }) {
  const { t } = await getT();
  const sp = await props.searchParams;
  const tab = TABS.some(([t]) => t === sp.tab) ? sp.tab! : "sudzibas";
  await requireModerator(`/moderacija?tab=${tab}`);
  const counts = await moderationCounts();
  const badge: Record<string, number> = { sudzibas: counts.open, paslepti: counts.hidden, lietotaji: counts.blocked };

  return (
    <main className="wrap mod">
      <h1>{t("Moderācija")}</h1>
      <nav className="seg mod-tabs" aria-label={t("Sadaļas")}>
        {TABS.map(([t, label]) => (
          <a key={t} href={`/moderacija?tab=${t}`} aria-current={tab === t ? "page" : undefined}>
            {label} {badge[t] > 0 && <span className="badge">{badge[t]}</span>}
          </a>
        ))}
      </nav>
      {tab === "sudzibas" && <Reports />}
      {tab === "paslepti" && <Hidden />}
      {tab === "lietotaji" && <Users q={sp.q?.slice(0, 80)} />}
    </main>
  );
}

async function Reports() {
  const { t } = await getT();
  const rows = await reportedListings();
  if (!rows.length) return <div className="notice">{t("Jaunu sūdzību nav. 🎉")}</div>;
  return (
    <div className="stack">
      {rows.map((r) => {
        const tally = Object.entries(r.reasons.reduce<Record<string, number>>((a, x) => ((a[x] = (a[x] ?? 0) + 1), a), {}));
        return (
          <article key={r.id} className="panel mod-item">
            <div className="row between">
              <a href={`/sludinajumi/${r.id}`} className="mod-title">{r.title}</a>
              <b>{formatPrice(r.price)}</b>
            </div>
            <p className="meta">
              <span className={`mod-status s-${r.status}`}>{STATUS[r.status] ?? r.status}</span>
              <span>{plural(r.reports, "sūdzība", "sūdzības")} · pēdējā {timeAgo(r.lastAt)}</span>
              <span>{r.ownerEmail ? `Autors: ${r.ownerName || "—"} (${r.ownerEmail})${r.ownerBlocked ? " · bloķēts" : ""}` : "Bez autora konta"}</span>
            </p>
            <ul className="mod-reasons">
              {tally.map(([k, n]) => (
                <li key={k}>{reasonLabel(k)}{n > 1 ? ` ×${n}` : ""}</li>
              ))}
            </ul>
            {r.notes.filter(Boolean).length > 0 && (
              <ul className="mod-notes">
                {r.notes.filter(Boolean).slice(0, 5).map((n, i) => <li key={i}>“{n}”</li>)}
              </ul>
            )}
            <ModActions listingId={r.id} userId={r.ownerId ?? undefined} actions={!r.ownerId || r.ownerBlocked ? ["approve", "hide"] : ["approve", "hide", "block"]} />
          </article>
        );
      })}
    </div>
  );
}

async function Hidden() {
  const { t } = await getT();
  const rows = await hiddenListings();
  if (!rows.length) return <div className="notice">{t("Paslēptu sludinājumu nav.")}</div>;
  return (
    <div className="stack">
      {rows.map((r) => (
        <article key={r.id} className="panel mod-item">
          <div className="row between">
            <a href={`/sludinajumi/${r.id}`} className="mod-title">{r.title}</a>
            <b>{formatPrice(r.price)}</b>
          </div>
          <p className="meta">
            <span className={`mod-status s-${r.status}`}>{STATUS[r.status]}</span>
            <span>{timeAgo(r.updatedAt)}</span>
            <span>{r.ownerEmail ? `Autors: ${r.ownerEmail}${r.ownerBlocked ? " · bloķēts" : ""}` : "Bez autora konta"}</span>
          </p>
          <ModActions listingId={r.id} actions={r.status === "pending" ? ["approve", "hide"] : ["approve"]} />
        </article>
      ))}
    </div>
  );
}

async function Users({ q }: { q?: string }) {
  const { t } = await getT();
  const rows = await findUsers(q);
  return (
    <>
      <form className="row mod-search" action="/moderacija">
        <input type="hidden" name="tab" value="lietotaji" />
        <input type="search" name="q" defaultValue={q} placeholder={t("E-pasts, vārds vai uzņēmums")} aria-label={t("Meklēt lietotāju")} />
        <button className="btn" type="submit">{t("Meklēt")}</button>
      </form>
      {!rows.length ? (
        <div className="notice">{t("Neviens lietotājs neatbilst meklējumam.")}</div>
      ) : (
        <div className="stack">
          {rows.map((u) => (
            <article key={u.id} className="panel mod-item">
              <div className="row between">
                <b>{u.companyName || u.name || "Bez vārda"}</b>
                <span className="fine">{u.email}</span>
              </div>
              <p className="meta">
                {u.blockedAt && <span className="mod-status s-hidden">Bloķēts {timeAgo(u.blockedAt)}</span>}
                {isModerator(u) && <span className="mod-status s-active">{u.role === "user" ? "admin" : u.role}</span>}
                <span>Reģistrējies {timeAgo(u.createdAt)}</span>
                <span>{plural(u.listingCount, "sludinājums", "sludinājumi")}</span>
                {u.reportCount > 0 && <span>{plural(u.reportCount, "sūdzība", "sūdzības")} par viņa sludinājumiem</span>}
              </p>
              {!isModerator(u) && <ModActions userId={u.id} actions={u.blockedAt ? ["unblock"] : ["block"]} />}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
