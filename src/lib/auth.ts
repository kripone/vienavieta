import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { magicLinkEmail, sendMail } from "./email";

/** Kuri sociālie tīkli ir iestatīti (.env). Neiestatītie netiek rādīti pieteikšanās lapā. */
export const enabledSocial = {
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  facebook: Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
  apple: Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
  telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME),
};

export const auth = betterAuth({
  appName: "VienāVietā",
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: schema.users, session: schema.sessions, account: schema.accounts, verification: schema.verifications },
  }),
  user: {
    additionalFields: {
      // input: false nozīmē, ka lietotājs pats šīs vērtības nevar iestatīt caur pieteikšanās API
      role: { type: "string", input: false, defaultValue: "user" },
      sellerType: { type: "string", input: false, defaultValue: "private" },
      companyName: { type: "string", input: false, required: false },
      phone: { type: "string", input: false, required: false },
      blockedAt: { type: "date", input: false, required: false },
      locale: { type: "string", input: false, defaultValue: "lv" },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 dienas
    updateAge: 60 * 60 * 24, // atjauno reizi dienā
  },
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google", "apple", "facebook"] },
  },
  socialProviders: {
    ...(enabledSocial.google && {
      google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! },
    }),
    ...(enabledSocial.facebook && {
      facebook: { clientId: process.env.FACEBOOK_CLIENT_ID!, clientSecret: process.env.FACEBOOK_CLIENT_SECRET! },
    }),
    ...(enabledSocial.apple && {
      apple: { clientId: process.env.APPLE_CLIENT_ID!, clientSecret: process.env.APPLE_CLIENT_SECRET! },
    }),
  },
  // Render (un citi starpniekserveri) klienta IP nodod x-forwarded-for galvenē.
  advanced: { ipAddress: { ipAddressHeaders: ["x-forwarded-for"] } },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: { "/sign-in/magic-link": { window: 60, max: 3 } },
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      async sendMagicLink({ email, url }) {
        const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email.toLowerCase()) });
        if (existing?.blockedAt) return; // bloķētiem lietotājiem saiti nesūtām
        await sendMail({ to: email, ...magicLinkEmail(url) });
      },
    }),
    nextCookies(), // jābūt pēdējam: ļauj iestatīt sīkdatnes no servera darbībām
  ],
});

export type SessionUser = typeof auth.$Infer.Session.user;
