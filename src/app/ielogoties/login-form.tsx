"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type Social = { google: boolean; facebook: boolean; apple: boolean };
const SOCIAL_LABEL = { google: "Google", facebook: "Facebook", apple: "Apple" } as const;

export function LoginForm({ next, social }: { next: string; social: Social }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(value)) {
      setState("error");
      setMessage("Ievadi derīgu e-pasta adresi.");
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
      setMessage(error.status === 429 ? "Pārāk daudz mēģinājumu. Pagaidi minūti un mēģini vēlreiz." : "Neizdevās nosūtīt saiti. Mēģini vēlreiz.");
      return;
    }
    setState("sent");
  }

  const providers = (Object.keys(social) as (keyof Social)[]).filter((p) => social[p]);

  if (state === "sent") {
    return (
      <div className="panel">
        <h2>Pārbaudi e-pastu</h2>
        <p>
          Nosūtījām pieteikšanās saiti uz <b>{email.trim()}</b>. Atver to šajā pašā ierīcē. Saite ir derīga 15 minūtes.
        </p>
        <button type="button" className="btn" onClick={() => setState("idle")}>
          Izmantot citu e-pastu
        </button>
      </div>
    );
  }

  return (
    <div className="panel">
      {providers.length > 0 && (
        <>
          <div className="sso">
            {providers.map((p) => (
              <button key={p} type="button" className="btn" onClick={() => authClient.signIn.social({ provider: p, callbackURL: next, errorCallbackURL: "/ielogoties" })}>
                Turpināt ar {SOCIAL_LABEL[p]}
              </button>
            ))}
          </div>
          <div className="or">
            <span>vai ar e-pastu</span>
          </div>
        </>
      )}
      <form onSubmit={onSubmit} noValidate className="stack">
        <label className="field">
          E-pasts
          <input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vards@epasts.lv" required />
        </label>
        <button type="submit" className="btn primary" disabled={state === "sending"}>
          {state === "sending" ? "Sūta…" : "Sūtīt pieteikšanās saiti"}
        </button>
        {state === "error" && <p className="alert">{message}</p>}
        <p className="fine">Parole nav vajadzīga: nosūtīsim saiti, ar kuru vari pieteikties. Ja konta vēl nav, tas tiks izveidots.</p>
      </form>
    </div>
  );
}
