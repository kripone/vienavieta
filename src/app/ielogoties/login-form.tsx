"use client";
import { useT } from "@/i18n/client";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

type Social = { google: boolean; facebook: boolean; apple: boolean; telegram: boolean };
const SOCIAL_LABEL = { google: "Google", facebook: "Facebook", apple: "Apple" } as const;

/** Oficiālais Telegram Login Widget (poga nāk no telegram.org skripta). */
function TelegramLogin({ bot, next }: { bot: string; next: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", bot);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-radius", "8");
    s.setAttribute("data-userpic", "false");
    s.setAttribute("data-request-access", "write");
    s.setAttribute("data-auth-url", `${window.location.origin}/api/auth/telegram?next=${encodeURIComponent(next)}`);
    ref.current.innerHTML = "";
    ref.current.appendChild(s);
  }, [bot, next]);
  return <div ref={ref} className="tg-login" />;
}

export function LoginForm({ next, social, telegramBot }: { next: string; social: Social; telegramBot?: string }) {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(value)) {
      setState("error");
      setMessage(t("Ievadi derīgu e-pasta adresi."));
      return;
    }
    setState("sending");
    const { error } = await authClient.signIn.magicLink({
      email: value,
      callbackURL: next,
      newUserCallbackURL: `/profils?jauns=1`,
      errorCallbackURL: "/ielogoties",
    });
    if (error) {
      setState("error");
      setMessage(error.status === 429 ? t("Pārāk daudz mēģinājumu. Pagaidi minūti un mēģini vēlreiz.") : t("Neizdevās nosūtīt saiti. Mēģini vēlreiz."));
      return;
    }
    setState("sent");
  }

  const providers = (Object.keys(SOCIAL_LABEL) as (keyof typeof SOCIAL_LABEL)[]).filter((p) => social[p]);

  if (state === "sent") {
    return (
      <div className="panel">
        <h2>{t("Pārbaudi e-pastu")}</h2>
        <p>
          {t("Nosūtījām pieteikšanās saiti uz")} <b>{email.trim()}</b>. {t("Atver to šajā pašā ierīcē. Saite ir derīga 15 minūtes.")}
        </p>
        <button type="button" className="btn" onClick={() => setState("idle")}>
          {t("Izmantot citu e-pastu")}
        </button>
      </div>
    );
  }

  return (
    <div className="panel">
      {(providers.length > 0 || (social.telegram && telegramBot)) && (
        <>
          <div className="sso">
            {providers.map((p) => (
              <button key={p} type="button" className="btn" onClick={() => authClient.signIn.social({ provider: p, callbackURL: next, errorCallbackURL: "/ielogoties" })}>
                Turpināt ar {SOCIAL_LABEL[p]}
              </button>
            ))}
            {social.telegram && telegramBot && <TelegramLogin bot={telegramBot} next={next} />}
          </div>
          <div className="or">
            <span>{t("vai ar e-pastu")}</span>
          </div>
        </>
      )}
      <form onSubmit={onSubmit} noValidate className="stack">
        <label className="field">
          {t("E-pasts")}
          <input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("vards@epasts.lv")} required />
        </label>
        <button type="submit" className="btn primary" disabled={state === "sending"}>
          {state === "sending" ? t("Sūta…") : t("Sūtīt pieteikšanās saiti")}
        </button>
        {state === "error" && <p className="alert">{message}</p>}
        <p className="fine">{t("Parole nav vajadzīga: nosūtīsim saiti, ar kuru vari pieteikties. Ja konta vēl nav, tas tiks izveidots.")}</p>
      </form>
    </div>
  );
}
