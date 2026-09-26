"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getUnreadCount(): Promise<number> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) return 0;
  return prisma.adminNotification.count({
    where: { recipientUserId: session.user.id, readAt: null },
  });
}

export async function getRecentNotifications(limit = 10) {
  const user = await requireAdmin();
  return prisma.adminNotification.findMany({
    where: { recipientUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getNotificationPage(page = 1, filter: "unread" | "all" = "all") {
  const user = await requireAdmin();
  const perPage = 20;
  const where = {
    recipientUserId: user.id,
    ...(filter === "unread" ? { readAt: null } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.adminNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.adminNotification.count({ where }),
  ]);
  return { items, total, page, perPage };
}

export async function markNotificationRead(id: string) {
  const user = await requireAdmin();
  await prisma.adminNotification.updateMany({
    where: { id, recipientUserId: user.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/[locale]/admin/notifications", "page");
}

export async function markAllRead() {
  const user = await requireAdmin();
  await prisma.adminNotification.updateMany({
    where: { recipientUserId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/[locale]/admin/notifications", "page");
}
