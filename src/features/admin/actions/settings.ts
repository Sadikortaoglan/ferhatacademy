"use server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { createAuditLog } from "@/server/audit";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const settingsSchema = z.object({
  academyName: z.string().min(1),
  supportEmail: z.string().email().optional().or(z.literal("")),
  defaultLocale: z.string().min(1),
  timezone: z.string().min(1),
  bankName: z.string().optional(),
  iban: z.string().optional(),
  accountHolder: z.string().optional(),
  paymentInstructions: z.string().optional(),
  instagramUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
});

export async function updateSiteSettings(data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (
    !dbUser ||
    (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)
  ) {
    throw new Error("Unauthorized");
  }

  const parsed = settingsSchema.parse(data);

  await Promise.all(
    Object.entries(parsed).map(([key, value]) => {
      const v = value ?? "";
      return prisma.siteSetting.upsert({
        where: { key },
        update: { value: v },
        create: { key, value: v },
      });
    })
  );

  await createAuditLog({
    action: "SETTINGS_UPDATED",
    actorId: dbUser.id,
    metadata: { keys: Object.keys(parsed).join(",") },
  });

  revalidatePath("/[locale]/admin/settings", "page");
}
