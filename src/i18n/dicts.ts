import type { Dict, Locale } from "./core";
import { en } from "./en";
import { lt } from "./lt";
import { ru } from "./ru";

export const DICTS: Record<Locale, Dict> = { lv: {}, en, ru, lt };
