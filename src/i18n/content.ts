// Ģenerēto virsrakstu tulkošana (virsrakstus veidojam paši latviski, sk. ss-rss.ts un listing-input.ts autoTitle).
// Lietotāju pašu rakstītos virsrakstus netulkojam: tie paliek, kā ievadīti.
import type { T } from "./core";

const PATTERNS: [RegExp, (t: T, m: RegExpMatchArray) => string][] = [
  [/^(\d+)-istabu dzīvoklis/, (t, m) => t("{n}-istabu dzīvoklis", { n: m[1] })],
  [/^Istaba(?= |$)/, (t) => t("Istaba")],
  [/ dzīvoklī$/, (t) => " " + t("dzīvoklī")],
  [/^Privātmāja/, (t) => t("Privātmāja")],
  [/^Vasarnīca/, (t) => t("Vasarnīca")],
  [/^Lauku īpašums/, (t) => t("Lauku īpašums")],
  [/^Zemes gabals/, (t) => t("Zemes gabals")],
  [/^Meža īpašums/, (t) => t("Meža īpašums")],
  [/^(Birojs|Tirdzniecības telpas|Noliktava|Garāža|Stāvvieta|Ražošanas telpas|Komercēka)(?= |,|$)/, (t, m) => t(m[1])],
  [/, zeme /, (t) => `, ${t("zeme")} `],
  [/ dīzelis(?= |$)/, (t) => " " + t("dīzelis")],
  [/ hibrīds(?= |$)/, (t) => " " + t("hibrīds")],
  [/ elektro(?= |$)/, (t) => " " + t("elektro")],
  [/(\d)\. sērija/, (t, m) => `${m[1]} ${t("sērija")}`],
  [/ klase(?= |$)/, (t) => " " + t("klase")],
];

/** "3-istabu dzīvoklis, 79 m², Rīga" → "3-room apartment, 79 m², Rīga" */
export function trTitle(title: string, t: T) {
  if (t("Meklēt") === "Meklēt") return title; // latviešu valoda
  let s = title;
  for (const [re, fn] of PATTERNS) s = s.replace(re, (...a) => fn(t, a as unknown as RegExpMatchArray));
  return s;
}
