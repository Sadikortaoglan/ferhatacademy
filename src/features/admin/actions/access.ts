"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { createAuditLog } from "@/server/audit";

async function requireAdminActor() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) {
    throw new Error("Unauthorized");
  }
  return dbUser;
}

const grantAccessSchema = z.object({
  userId: z.string().min(1),
  resourceType: z.enum(["COURSE", "LESSON"]),
  resourceId: z.string().min(1),
  sourceType: z.enum(["MANUAL", "ORDER", "MEMBERSHIP", "MENTORSHIP", "PROMOTION"]).default("MANUAL"),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  reason: z.string().optional(),
});

export async function grantAccess(data: unknown) {
  const actor = await requireAdminActor();
  const parsed = grantAccessSchema.parse(data);

  const entitlement = await prisma.entitlement.create({
    data: {
      userId: parsed.userId,
      resourceType: parsed.resourceType,
      resourceId: parsed.resourceId,
      sourceType: parsed.sourceType,
      createdById: actor.id,
      startsAt: parsed.startsAt ? new Date(parsed.startsAt) : null,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
    },
  });

  await createAuditLog({
    action: "ACCESS_GRANTED",
    actorId: actor.id,
    targetId: parsed.userId,
    targetType: "User",
    metadata: {
      entitlementId: entitlement.id,
      resourceType: parsed.resourceType,
      resourceId: parsed.resourceId,
      ...(parsed.reason ? { reason: parsed.reason } : {}),
    },
  });

  revalidatePath("/[locale]/admin/access", "page");
  revalidatePath("/[locale]/admin/users/[userId]", "page");
  return entitlement;
}

export async function revokeAccess(entitlementId: string) {
  const actor = await requireAdminActor();
  const entitlement = await prisma.entitlement.update({
    where: { id: entitlementId },
    data: { revokedAt: new Date() },
  });

  await createAuditLog({
    action: "ACCESS_REVOKED",
    actorId: actor.id,
    targetId: entitlement.userId,
    targetType: "User",
    metadata: { entitlementId },
  });

  revalidatePath("/[locale]/admin/access", "page");
  revalidatePath("/[locale]/admin/users/[userId]", "page");
}

export async function extendAccess(entitlementId: string, newExpiresAt: string) {
  const actor = await requireAdminActor();
  const entitlement = await prisma.entitlement.update({
    where: { id: entitlementId },
    data: { expiresAt: new Date(newExpiresAt) },
  });

  await createAuditLog({
    action: "ACCESS_EXTENDED",
    actorId: actor.id,
    targetId: entitlement.userId,
    targetType: "User",
    metadata: { entitlementId, newExpiresAt },
  });

  revalidatePath("/[locale]/admin/access", "page");
  revalidatePath("/[locale]/admin/users/[userId]", "page");
}
