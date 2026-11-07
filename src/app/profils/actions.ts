"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { isValidPhone } from "@/lib/antispam";
import { getCurrentUser } from "@/lib/session";

const ProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Vārdam jābūt vismaz 2 burtiem.").max(80, "Vārds ir pārāk garš."),
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s-]/g, ""))
      .refine((v) => v === "" || isValidPhone(v), "Ievadi derīgu tālruni, piem. +371 20000000 vai +370 60000000."),
    sellerType: z.enum(["private", "dealer"]),
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
  await db
    .update(schema.users)
    .set({
      name: v.name,
      phone: v.phone || null,
      // mainot tālruni, apstiprinājums jāveic no jauna
      ...(phoneChanged && { phoneVerifiedAt: null }),
      sellerType: v.sellerType,
      companyName: v.sellerType === "dealer" ? v.companyName : null,
    })
    .where(eq(schema.users.id, user.id));

  revalidatePath("/profils");
  return { ok: true };
}
