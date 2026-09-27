"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { canChangeUserRole } from "@/server/role-management";

async function getActor() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN")) {
    throw new Error("Forbidden");
  }
  return actor;
}

/** @deprecated use getActor() instead */
async function getActorId() {
  return (await getActor()).id;
}

export async function changeUserRole(
  targetUserId: string,
  newRole: Role,
): Promise<{ ok: boolean; error?: string }> {
  let actor: { id: string; role: Role };
  try {
    actor = await getActor();
  } catch {
    return { ok: false, error: "Yetersiz yetki." };
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true, name: true, email: true },
  });
  if (!target) return { ok: false, error: "Kullanıcı bulunamadı." };

  const check = canChangeUserRole(actor.role, target.role, newRole, actor.id, target.id);
  if (!check.allowed) return { ok: false, error: check.reason };

  // Last SUPER_ADMIN protection (server-side, DB authoritative)
  if (target.role === Role.SUPER_ADMIN && newRole !== Role.SUPER_ADMIN) {
    const superAdminCount = await prisma.user.count({ where: { role: Role.SUPER_ADMIN } });
    if (superAdminCount <= 1) {
      return {
        ok: false,
        error: "En az bir aktif Super Admin hesabı bulunmalıdır. Bu kullanıcının rolü değiştirilemez.",
      };
    }
  }

  const oldRole = target.role;

  await prisma.user.update({ where: { id: targetUserId }, data: { role: newRole } });

  // Invalidate all sessions so new role is immediately enforced
  await prisma.session.deleteMany({ where: { userId: targetUserId } });

  await prisma.auditLog.create({
    data: {
      action: "USER_ROLE_CHANGED",
      actorId: actor.id,
      targetId: targetUserId,
      targetType: "USER",
      metadata: { oldRole, newRole },
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
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
