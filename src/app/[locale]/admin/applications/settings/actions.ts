"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";

const NOTIFICATION_KEYS = [
  "notif_email_on_submitted",
  "notif_email_on_approved",
  "notif_email_on_rejected",
  "notif_email_on_waitlisted",
  "notif_admin_bell_on_submitted",
] as const;

type NotifKey = (typeof NOTIFICATION_KEYS)[number];

export async function getNotificationSettings() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: [...NOTIFICATION_KEYS] } },
  });
  const map: Record<string, boolean> = {};
  for (const key of NOTIFICATION_KEYS) {
    const row = rows.find((r) => r.key === key);
    map[key] = row ? row.value === "true" : true; // default on
  }
  return map as Record<NotifKey, boolean>;
}

export async function saveNotificationSettings(locale: string, data: Record<string, boolean>) {
  await requireAdmin(locale);
  await Promise.all(
    NOTIFICATION_KEYS.map((key) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(data[key] ?? true) },
        create: { key, value: String(data[key] ?? true) },
      })
    )
  );
  revalidatePath(`/${locale}/admin/applications/settings`);
  return { ok: true };
}
