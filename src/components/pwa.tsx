"use client";
// PWA: servisa darbinieka reģistrācija, instalēšana un push paziņojumi šajā ierīcē.
import { useEffect, useState, useSyncExternalStore } from "react";
import { useT } from "@/i18n/client";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// beforeinstallprompt notikumu glabājam, lai pogu varētu rādīt jebkurā lapā
let installEvent: InstallEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));

export const isIos = () => typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
export const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

/** Ieliek layout: reģistrē /sw.js un noķer instalēšanas piedāvājumu. */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onPrompt = (e: Event) => {
      e.preventDefault();
      installEvent = e as InstallEvent;
      emit();
    };
    const onInstalled = () => {
      installEvent = null;
      emit();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}

function useInstall() {
  const canPrompt = useSyncExternalStore(subscribe, () => installEvent !== null, () => false);
  const [env, setEnv] = useState<{ ios: boolean; standalone: boolean } | null>(null);
  useEffect(() => setEnv({ ios: isIos(), standalone: isStandalone() }), []);
  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => null);
    installEvent = null;
    emit();
  };
  return { canPrompt, ios: env?.ios ?? false, standalone: env?.standalone ?? false, ready: env !== null, install };
}

/** Instalēšanas poga (Android/datorā) vai norādes iPhone lietotājiem. */
export function InstallApp() {
  const { t } = useT();
  const { canPrompt, ios, standalone, ready, install } = useInstall();
  if (!ready) return null;
  if (standalone) return <p className="fine">✓ {t("Tu izmanto VienāVietā aplikāciju.")}</p>;
  if (canPrompt) return <button type="button" className="btn primary" onClick={install}>📲 {t("Instalēt aplikāciju")}</button>;
  if (ios) return <p className="fine">📲 {t("Lai instalētu iPhone: Safari spied „Kopīgot” (kvadrāts ar bultu) un izvēlies „Pievienot sākuma ekrānam”.")}</p>;
  return <p className="fine">📲 {t("Pārlūka izvēlnē izvēlies „Instalēt” vai „Pievienot sākuma ekrānam”.")}</p>;
}

/** Neliels aicinājums telefonā (vienreiz; aizveramais). */
export function InstallBanner() {
  const { t } = useT();
  const { canPrompt, ios, standalone, ready, install } = useInstall();
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem("pwa-banner") === "off"; } catch {}
    setHidden(dismissed || !window.matchMedia("(max-width: 700px)").matches);
  }, []);
  if (!ready || hidden || standalone || (!canPrompt && !ios)) return null;
  const close = () => {
    try { localStorage.setItem("pwa-banner", "off"); } catch {}
    setHidden(true);
  };
  return (
    <div className="pwa-banner" role="region" aria-label={t("Instalēt aplikāciju")}>
      <img src="/icons/icon-192.png" alt="" width={36} height={36} />
      <span>{t("Instalē VienāVietā telefonā un saņem paziņojumus par jauniem sludinājumiem.")}</span>
      {canPrompt ? (
        <button type="button" className="btn small primary" onClick={install}>{t("Instalēt")}</button>
      ) : (
        <a className="btn small primary" href="/pazinojumi#ierice">{t("Kā?")}</a>
      )}
      <button type="button" className="pwa-x" aria-label={t("Aizvērt")} onClick={close}>×</button>
    </div>
  );
}

function keyBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type PushState = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

/** Push paziņojumu ieslēgšana/izslēgšana šajā ierīcē. */
export function PushDevice({ publicKey }: { publicKey: string }) {
  const { t, locale } = useT();
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = (sub: PushSubscription) =>
    fetch("/api/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...sub.toJSON(), locale }) });

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setState(isIos() && !isStandalone() ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setState("on");
        save(sub).catch(() => {}); // sinhronizē ar serveri (arī valodu)
      } else setState("off");
    })().catch(() => setState("unsupported"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enable() {
    setBusy(true);
    setError("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
      const r = await save(sub);
      if (!r.ok) throw new Error(String(r.status));
      setState("on");
      location.reload(); // atjauno meklēšanu push atzīmes
    } catch {
      setError(t("Neizdevās ieslēgt paziņojumus. Mēģini vēlreiz."));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  if (!publicKey) return <p className="fine">{t("Paziņojumi telefonā pagaidām nav pieejami.")}</p>;
  if (state === "loading") return null;
  if (state === "unsupported") return <p className="fine">{t("Šis pārlūks paziņojumus neatbalsta.")}</p>;
  if (state === "ios-install") return <p className="fine">{t("iPhone paziņojumiem vispirms pievieno VienāVietā sākuma ekrānam (skat. augstāk) un atver to no ikonas.")}</p>;
  if (state === "denied") return <p className="fine">{t("Paziņojumi ir bloķēti pārlūka iestatījumos. Atļauj tos vietnei vienavieta.lv un pārlādē lapu.")}</p>;
  return (
    <div className="stack">
      {state === "on" ? (
        <>
          <p>✓ {t("Paziņojumi šajā ierīcē ir ieslēgti.")}</p>
          <div><button type="button" className="btn small" disabled={busy} onClick={disable}>{t("Izslēgt šajā ierīcē")}</button></div>
        </>
      ) : (
        <div><button type="button" className="btn primary" disabled={busy} onClick={enable}>🔔 {t("Ieslēgt paziņojumus šajā ierīcē")}</button></div>
      )}
      {error && <p className="err">{error}</p>}
    </div>
  );
}
