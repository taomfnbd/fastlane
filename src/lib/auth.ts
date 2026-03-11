import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await sendNotificationEmail(
        user.email,
        "Reinitialiser votre mot de passe",
        "Cliquez sur le lien ci-dessous pour reinitialiser votre mot de passe. Ce lien expire dans 1 heure.",
        url,
      );
    },
    resetPasswordTokenExpiresIn: 3600,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendNotificationEmail(
        user.email,
        "Verifiez votre adresse email",
        "Cliquez sur le lien ci-dessous pour verifier votre adresse email.",
        url,
      );
    },
    sendOnSignUp: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  advanced: {
    cookiePrefix: "fastlane",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "CLIENT_MEMBER",
        input: false,
      },
      companyId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
