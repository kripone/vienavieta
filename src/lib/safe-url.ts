/** Saite tikai ar http(s) vai iekšējs ceļš "/…" (nevis javascript:, data: u.c. – XSS no plūsmām vai klienta ziņām). Citādi undefined. */
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) return url; // mūsu iekšējā saite
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? url : undefined;
  } catch {
    return undefined;
  }
}
