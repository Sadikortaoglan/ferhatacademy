"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function getActorId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN")) {
    throw new Error("Forbidden");
  }
  return actor.id;
}

export async function deactivateUser(userId: string, reason?: string) {
  const actorId = await getActorId();

  await prisma.user.update({
    where: { id: userId },
    data: {
      banned: true,
      banReason: reason ?? "Admin tarafından pasifleştirildi",
      banExpires: null,
    },
  });

  // Invalidate all active sessions for the banned user
  await prisma.session.deleteMany({ where: { userId } });

  await prisma.auditLog.create({
    data: {
      action: "USER_DEACTIVATED",
      actorId,
      targetId: userId,
      targetType: "USER",
      metadata: reason ? { reason } : {},
    },
  });

  revalidatePath("/", "layout");
}

export async function activateUser(userId: string) {
  const actorId = await getActorId();

  await prisma.user.update({
    where: { id: userId },
    data: {
      banned: false,
      banReason: null,
      banExpires: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "USER_ACTIVATED",
      actorId,
      targetId: userId,
      targetType: "USER",
    },
  });

  revalidatePath("/", "layout");
}
