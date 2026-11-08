// Push abonementa saglabāšana (POST) un dzēšana (DELETE) pašreizējai ierīcei.
import { and, asc, eq, notInArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { asLocale, pushEnabled, validEndpoint } from "@/lib/push";
import { getCurrentUser } from "@/lib/session";

const { pushSubscriptions } = schema;
const MAX_DEVICES = 10;

type Body = { endpoint?: string; keys?: { p256dh?: string; auth?: string }; locale?: string };

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "login" }, { status: 401 });
  if (!pushEnabled()) return Response.json({ error: "disabled" }, { status: 503 });
  const b = (await req.json().catch(() => ({}))) as Body;
  const endpoint = String(b.endpoint ?? "");
  const p256dh = String(b.keys?.p256dh ?? "");
  const auth = String(b.keys?.auth ?? "");
  if (!validEndpoint(endpoint) || !/^[A-Za-z0-9_-]{40,200}$/.test(p256dh) || !/^[A-Za-z0-9_-]{10,100}$/.test(auth)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const first = !(await db.select({ id: pushSubscriptions.id }).from(pushSubscriptions).where(eq(pushSubscriptions.userId, user.id)).limit(1)).length;
  const values = { userId: user.id, endpoint, p256dh, auth, locale: asLocale(b.locale), userAgent: (req.headers.get("user-agent") ?? "").slice(0, 300) };
  await db.insert(pushSubscriptions).values(values).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: values });
  // pirmā ierīce: ieslēdzam push visām saglabātajām meklēšanām (katru var izslēgt atsevišķi)
  if (first) await db.update(schema.savedSearches).set({ notifyPush: true }).where(eq(schema.savedSearches.userId, user.id));
  // ne vairāk par MAX_DEVICES ierīcēm: vecākās izmetam
  const keep = await db.select({ id: pushSubscriptions.id }).from(pushSubscriptions).where(eq(pushSubscriptions.userId, user.id)).orderBy(asc(pushSubscriptions.createdAt));
  if (keep.length > MAX_DEVICES) {
    const ids = keep.slice(-MAX_DEVICES).map((k) => k.id);
    await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.userId, user.id), notInArray(pushSubscriptions.id, ids)));
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "login" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Body;
  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, String(b.endpoint ?? ""))));
  return Response.json({ ok: true });
}
