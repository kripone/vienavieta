"use client";
// Nosūta pārlūka kļūdas uz /api/errors (max 5 vienā lapas ielādē). Paplašinājumu un ārējo skriptu kļūdas izlaižam.
import { useEffect } from "react";

let sent = 0;
export function reportClientError(message: string, stack?: string, digest?: string) {
  if (sent >= 5 || !message) return;
  if (/ResizeObserver loop|^Script error\.?$|Load failed|NetworkError|Failed to fetch|AbortError/i.test(message)) return;
  sent++;
  const body = JSON.stringify({ message: message.slice(0, 1000), stack: stack?.slice(0, 4000), url: location.href.slice(0, 500), digest });
  try {
    if (!navigator.sendBeacon?.("/api/errors", new Blob([body], { type: "application/json" }))) {
      fetch("/api/errors", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  } catch {}
}

export function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (e.filename && !e.filename.startsWith(location.origin)) return; // paplašinājumi, ārējie skripti
      reportClientError(e.message, e.error?.stack);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      reportClientError(r instanceof Error ? r.message : String(r ?? ""), r instanceof Error ? r.stack : undefined);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
