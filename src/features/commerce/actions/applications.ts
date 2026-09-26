"use server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { createAuditLog } from "@/server/audit";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  sendApplicationApprovedToApplicant,
  sendApplicationRejectedToApplicant,
  sendApplicationWaitlistedToApplicant,
} from "@/lib/email";

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

async function requireAdminUser() {
  const user = await getSessionUser();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) throw new Error("Unauthorized");
  return dbUser;
}

const applicationSchema = z.object({
  phone: z.string().optional(),
  currentExperience: z.string().optional(),
  currentSituation: z.string().optional(),
  goal: z.string().min(1),
  mainChallenge: z.string().optional(),
  whyInterested: z.string().min(1),
  preferredLanguage: z.string().optional(),
  optionalNote: z.string().optional(),
});

export async function submitApplication(productId: string, data: unknown) {
  const sessionUser = await getSessionUser();
  const parsed = applicationSchema.parse(data);

  const existing = await prisma.application.findUnique({ where: { userId_productId: { userId: sessionUser.id, productId } } });
  if (existing && !["REJECTED", "CANCELLED"].includes(existing.status)) {
    return existing;
  }

  const app = await prisma.application.create({
    data: { userId: sessionUser.id, productId, ...parsed },
  });
  await createAuditLog({ action: "APPLICATION_SUBMITTED", actorId: sessionUser.id, targetId: app.id, targetType: "Application" });
  revalidatePath("/[locale]/dashboard/applications", "page");
  return app;
}

export async function adminUpdateApplicationStatus(
  appId: string,
  status: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "WAITLISTED",
  note?: string
) {
  const admin = await requireAdminUser();
  await prisma.application.update({
    where: { id: appId },
    data: { status, internalAdminNote: note, reviewedAt: new Date(), reviewedById: admin.id },
  });

  const action =
    status === "APPROVED" ? "APPLICATION_APPROVED" as const :
    status === "REJECTED" ? "APPLICATION_REJECTED" as const :
    status === "WAITLISTED" ? "APPLICATION_WAITLISTED" as const :
    "APPLICATION_SUBMITTED" as const;

  await createAuditLog({ action, actorId: admin.id, targetId: appId, targetType: "Application" });
  revalidatePath("/[locale]/admin/applications", "page");

  if (["APPROVED", "REJECTED", "WAITLISTED"].includes(status)) {
    const app = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        user: true,
        product: { include: { translations: { take: 1 } } },
      },
    });
    if (app) {
      const productName =
        (app.product.translations as { locale: string; name: string }[])[0]?.name ?? app.product.slug;
      const opts = {
        to: app.user.email,
        name: app.user.name ?? app.user.email,
        productName,
        applicationId: appId,
      };
      if (status === "APPROVED") void sendApplicationApprovedToApplicant(opts).catch(() => {});
      else if (status === "REJECTED") void sendApplicationRejectedToApplicant(opts).catch(() => {});
      else if (status === "WAITLISTED") void sendApplicationWaitlistedToApplicant(opts).catch(() => {});
    }
  }
}
