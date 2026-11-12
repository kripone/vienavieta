"use client";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";

/** Saite ar pogu „Kopēt” (un „Dalīties” telefonā). */
export function CopyLink({ url, title }: { url: string; title: string }) {
  const { t } = useT();
  const [done, setDone] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare("share" in navigator), []);
  const copy = async () => { try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2000); } catch {} };
  const share = async () => { try { await navigator.share({ title, url }); } catch {} };
  return (
    <div className="copy-link">
      <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label={t("Saite")} />
      <button type="button" className="btn small primary" onClick={copy}>{done ? `✓ ${t("Nokopēts")}` : t("Kopēt")}</button>
      {canShare && <button type="button" className="btn small" onClick={share}>{t("Dalīties")}</button>}
    </div>
  );
}
