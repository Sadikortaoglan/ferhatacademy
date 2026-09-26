import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { Resend } from "resend";
import { prisma } from "./prisma";

const FROM = process.env.EMAIL_FROM ?? "Ferhat Academy <noreply@ferhatacademy.com>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async sendResetPassword({ user, url }) {
      const key = process.env.RESEND_API_KEY;
      if (!key) return;
      const resend = new Resend(key);
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: "Şifrenizi sıfırlayın — Ferhat Academy",
        template: {
          id: "reset-password",
          variables: {
            name: user.name ?? user.email,
            url,
          },
        },
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [
    admin({
      defaultRole: "USER",
      bannedUserMessage: "Hesabınız şu anda aktif değil. Destek ekibiyle iletişime geçebilirsiniz.",
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});

export type Session = typeof auth.$Infer.Session;
