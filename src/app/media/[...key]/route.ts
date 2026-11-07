import { getObject } from "@/lib/storage";

export const runtime = "nodejs";

/** Bilžu izsniegšana no lokālās krātuves vai S3 (ja nav iestatīts MEDIA_PUBLIC_URL). */
export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  const k = key.join("/");
  if (!/^photos\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}(-t)?\.webp$/.test(k)) return new Response("Nav atrasts", { status: 404 });
  const body = await getObject(k);
  if (!body) return new Response("Nav atrasts", { status: 404 });
  return new Response(new Uint8Array(body), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
