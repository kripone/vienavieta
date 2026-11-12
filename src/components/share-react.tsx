"use client";
// Kopīgotā saraksta skatītājs: patīk / nepatīk un komentārs pie sludinājuma (vārds un atslēga glabājas pārlūkā).
import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";
import { SHARE_COMMENT_MAX } from "@/lib/constants";
import type { Reaction } from "@/lib/favorites";

function visitor() {
  let key = "", name = "";
  try {
    key = localStorage.getItem("share-key") ?? "";
    name = localStorage.getItem("share-name") ?? "";
    if (!key) { key = Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 32); localStorage.setItem("share-key", key); }
  } catch { key = key || Math.random().toString(36).slice(2).padEnd(16, "x") + Date.now().toString(36); }
  return { key, name };
}

export function ShareReact({ token, listingId, initial }: { token: string; listingId: string; initial: Reaction[] }) {
  const { t } = useT();
  const [list, setList] = useState(initial);
  const [me, setMe] = useState({ key: "", name: "" });
  const [vote, setVote] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [state, setState] = useState("");
  useEffect(() => { setMe(visitor()); }, []);

  async function send(nextVote: string | null, nextComment: string) {
    const name = me.name.trim();
    if (!name) return setState(t("Vispirms ieraksti savu vārdu."));
    try { localStorage.setItem("share-name", name); } catch {}
    setState(t("Saglabā…"));
    const r = await fetch(`/api/share/${token}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ listingId, key: me.key, name, vote: nextVote, comment: nextComment }) }).catch(() => null);
    if (!r?.ok) return setState(t("Neizdevās saglabāt"));
    const saved = (await r.json().catch(() => ({}))) as { id?: string };
    setVote(nextVote);
    const mine: Reaction | null = nextVote || nextComment.trim() ? { id: "me", listingId, name, vote: nextVote, comment: nextComment.trim() || null, at: new Date().toISOString(), mine: true } : null;
    setList((l) => [...l.filter((x) => x.id !== "me" && x.id !== saved.id), ...(mine ? [mine] : [])]);
    setState(`✓ ${t("Saglabāts")}`);
  }
  const likes = list.filter((x) => x.vote === "like").length, dislikes = list.filter((x) => x.vote === "dislike").length;
  return (
    <div className="share-react">
      {list.length > 0 && (
        <ul className="share-list">
          {list.map((r) => (
            <li key={r.id}><b>{r.name}</b> {r.vote === "like" ? "👍" : r.vote === "dislike" ? "👎" : ""} {r.comment && <span>{r.comment}</span>}</li>
          ))}
        </ul>
      )}
      <div className="share-form">
        <input className="share-name" value={me.name} maxLength={40} placeholder={t("Tavs vārds")} aria-label={t("Tavs vārds")} onChange={(e) => setMe({ ...me, name: e.target.value })} />
        <button type="button" className={`btn small${vote === "like" ? " on" : ""}`} aria-pressed={vote === "like"} onClick={() => send(vote === "like" ? null : "like", comment)}>👍 {t("Patīk")}{likes ? ` · ${likes}` : ""}</button>
        <button type="button" className={`btn small${vote === "dislike" ? " on" : ""}`} aria-pressed={vote === "dislike"} onClick={() => send(vote === "dislike" ? null : "dislike", comment)}>👎 {t("Nepatīk")}{dislikes ? ` · ${dislikes}` : ""}</button>
        <input className="share-comment" value={comment} maxLength={SHARE_COMMENT_MAX} placeholder={t("Komentārs (nav obligāts)")} aria-label={t("Komentārs")} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(vote, comment); }} />
        <button type="button" className="btn small primary" onClick={() => send(vote, comment)}>{t("Sūtīt")}</button>
      </div>
      {state && <span className="fine" aria-live="polite">{state}</span>}
    </div>
  );
}
