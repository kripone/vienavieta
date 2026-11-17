"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { isValidPhone } from "@/lib/antispam";
import { isBusiness } from "@/lib/constants";
import { escapeHtml, sendMail } from "@/lib/email";
import { getCurrentUser } from "@/lib/session";

const ProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Vārdam jābūt vismaz 2 burtiem.").max(80, "Vārds ir pārāk garš."),
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s-]/g, ""))
      .refine((v) => v === "" || isValidPhone(v), "Ievadi derīgu tālruni, piem. +371 20000000 vai +370 60000000."),
    sellerType: z.enum(["private", "dealer", "agency"]),
    companyName: z.string().trim().max(100, "Nosaukums ir pārāk garš."),
  })
  .refine((v) => v.sellerType === "private" || v.companyName.length >= 2, {
    message: "Saloniem un aģentūrām jānorāda uzņēmuma nosaukums.",
    path: ["companyName"],
  });

export type ProfileState = { ok?: boolean; errors?: Record<string, string> };

export async function updateProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: "Sesija beigusies. Ielogojies vēlreiz." } };

  const parsed = ProfileSchema.safeParse({
    name: form.get("name") ?? "",
    phone: form.get("phone") ?? "",
    sellerType: form.get("sellerType") ?? "private",
    companyName: form.get("companyName") ?? "",
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { errors };
  }

  const v = parsed.data;
  const phoneChanged = (v.phone || null) !== user.phone;
  const companyName = v.sellerType !== "private" ? v.companyName : null;
  // uzņēmuma statusu apstiprina moderators; mainot veidu vai nosaukumu, apstiprinājums jāsaņem no jauna
  const businessChanged = v.sellerType !== user.sellerType || companyName !== user.companyName;
  await db
    .update(schema.users)
    .set({
      name: v.name,
      phone: v.phone || null,
      // mainot tālruni, apstiprinājums jāveic no jauna
      ...(phoneChanged && { phoneVerifiedAt: null }),
      sellerType: v.sellerType,
      companyName,
      ...(businessChanged && { businessVerifiedAt: null }),
    })
    .where(eq(schema.users.id, user.id));

  if (isBusiness(v.sellerType) && businessChanged) await notifyModerators(user.email, v.sellerType, v.companyName);

  revalidatePath("/profils");
  return { ok: true };
}

/** Paziņo administratoriem (ADMIN_EMAILS), ka uzņēmuma statuss gaida apstiprinājumu. Kļūda netraucē saglabāšanu. */
async function notifyModerators(email: string, sellerType: string, company: string) {
  const to = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  if (!to.length) return;
  const base = process.env.APP_URL ?? "https://vienavieta.lv";
  const kind = sellerType === "agency" ? "Nekustamo īpašumu aģentūra" : "Auto salons";
  const url = `${base}/moderacija?tab=uznemumi`;
  const text = `${kind}: ${company}\nLietotājs: ${email}\n\nApstiprini vai noraidi: ${url}`;
  const html = `<p>${escapeHtml(kind)}: <b>${escapeHtml(company)}</b><br>Lietotājs: ${escapeHtml(email)}</p><p><a href="${escapeHtml(url)}">Apstiprināt vai noraidīt</a></p>`;
  await Promise.all(
    to.map((addr) => sendMail({ to: addr, subject: `Uzņēmums gaida apstiprinājumu: ${company.replace(/[\r\n]+/g, " ")}`, text, html }).catch((e) => console.error("Moderatoru paziņojums:", e))),
  );
}
