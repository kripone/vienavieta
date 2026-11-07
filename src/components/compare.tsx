"use client";
import { useEffect, useState } from "react";
import { MAX_COMPARE } from "@/lib/constants";

// Salīdzināmie sludinājumi glabājas pārlūkā (tikai ērtībai; nekas netiek sūtīts uz serveri līdz salīdzināšanas lapai).
type Item = { id: string; kind: string };
const KEY = "vv-compare";
const EVENT = "vv-compare-change";

function read(): Item[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => x && typeof x.id === "string").slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}
function write(items: Item[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}
function useCompare() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return items;
}

/** Poga kartītē. Salīdzina tikai viena veida sludinājumus (transports ar transportu, īpašumi ar īpašumiem). */
export function CompareToggle({ id, kind }: { id: string; kind: string }) {
  const items = useCompare();
  const on = items.some((x) => x.id === id);
  function click() {
    const cur = read();
    if (on) return write(cur.filter((x) => x.id !== id));
    const same = cur.filter((x) => x.kind === kind); // cita veida sludinājumus aizstājam
    write([...same, { id, kind }].slice(-MAX_COMPARE));
  }
  return (
    <button type="button" className={`cmp-btn${on ? " on" : ""}`} aria-pressed={on} onClick={click} title={on ? "Noņemt no salīdzināšanas" : `Salīdzināt (līdz ${MAX_COMPARE})`}>
      ⇄<span className="hide-sm"> {on ? "Salīdzinu" : "Salīdzināt"}</span>
    </button>
  );
}

/** Josla ekrāna apakšā, kad izvēlēts vismaz viens sludinājums. */
export function CompareBar() {
  const items = useCompare();
  if (!items.length) return null;
  return (
    <div className="cmp-bar" role="region" aria-label="Salīdzināšana">
      <span>
        Salīdzināšanai: <b>{items.length}</b> no {MAX_COMPARE}
      </span>
      {items.length >= 2 ? (
        <a className="btn primary small" href={`/salidzinat?ids=${items.map((x) => x.id).join(",")}`}>Salīdzināt</a>
      ) : (
        <span className="fine">izvēlies vēl vismaz vienu</span>
      )}
      <button type="button" className="btn small" onClick={() => write([])}>Notīrīt</button>
    </div>
  );
}
