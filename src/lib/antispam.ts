// Antispam pārbaudes sludinājumiem. Tīras funkcijas, lai tās būtu viegli pārbaudīt.

const SPAM_WORDS = ["casino", "kazino", "crypto", "kripto", "bitcoin", "viagra", "ātrie kredīti", "peļņa bez riska", "whatsapp me", "telegram:", "investīcijas ar garantētu"];
const LINK_RE = /https?:\/\/|www\.|\b[a-z0-9-]+\.(ru|xyz|top|click|info|shop)\b/i;

/** Minimālais laiks (ms) no formas atvēršanas līdz iesniegšanai. Roboti iesniedz uzreiz. */
export const MIN_FILL_MS = 4000;

export type SpamInput = { title: string; description: string; contactPhone: string; contactEmail: string; honeypot: string; startedAt: number };

/** Atgriež kļūdas tekstu vai null, ja viss kārtībā. */
export function checkContent(i: SpamInput, now = Date.now()): string | null {
  if (i.honeypot) return "Sludinājumu neizdevās saglabāt.";
  if (!Number.isFinite(i.startedAt) || now - i.startedAt < MIN_FILL_MS) return "Pārbaudi ievadītos datus un mēģini vēlreiz.";
  const t = i.title.trim();
  if (LINK_RE.test(t)) return "Virsrakstā nedrīkst būt saites.";
  if (t.length >= 10 && t === t.toLocaleUpperCase("lv") && /\p{Lu}/u.test(t)) return "Neraksti virsrakstu tikai ar lielajiem burtiem.";
  if (/(.)\1{5,}/u.test(t)) return "Virsrakstā ir pārāk daudz atkārtotu simbolu.";
  const all = `${t} ${i.description} ${i.contactPhone} ${i.contactEmail}`.toLocaleLowerCase("lv");
  if (SPAM_WORDS.some((w) => all.includes(w))) return "Sludinājums izskatās pēc surogātpasta un netika saglabāts.";
  if ((i.description.match(/https?:\/\//g) ?? []).length > 2) return "Aprakstā ir pārāk daudz saišu.";
  return null;
}

export const normalizePhone = (v: string) => v.replace(/[\s()-]/g, "");
/** Latvijas (+371) un Lietuvas (+370 vai 8…) numuri, kā arī citi starptautiskie. */
export const isValidPhone = (v: string) => /^(\+371)?[2689]\d{7}$/.test(v) || /^(\+370|8)[3-9]\d{7}$/.test(v) || /^\+\d{8,15}$/.test(v);
export const isValidEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v);

export const normalizeTitle = (s: string) => s.toLocaleLowerCase("lv").replace(/[^\p{L}\p{N}]+/gu, "");
