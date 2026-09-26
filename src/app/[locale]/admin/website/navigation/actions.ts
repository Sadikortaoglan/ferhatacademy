"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";
import { z } from "zod";

const navItemSchema = z.object({
  key: z.string().min(1).max(60).regex(/^[a-z0-9_-]+$/),
  labelTr: z.string().min(1),
  labelEn: z.string().min(1),
  href: z.string().min(1),
  position: z.number().int().default(0),
  enabled: z.boolean().default(true),
  showInNavbar: z.boolean().default(true),
  showInFooter: z.boolean().default(false),
  openInNewTab: z.boolean().default(false),
  icon: z.string().optional(),
});

export async function listNavItems(locale: string) {
  await requireAdmin(locale);
  return prisma.navItem.findMany({ orderBy: { position: "asc" } });
}

export async function createNavItem(locale: string, data: unknown) {
  await requireAdmin(locale);
  const parsed = navItemSchema.parse(data);
  const existing = await prisma.navItem.findUnique({ where: { key: parsed.key } });
  if (existing) throw new Error("Bu key zaten kullanılıyor");
  const item = await prisma.navItem.create({ data: parsed });
  revalidatePath(`/${locale}/admin/website/navigation`);
  revalidatePath("/", "layout");
  return item;
}

export async function updateNavItem(locale: string, id: string, data: unknown) {
  await requireAdmin(locale);
  const parsed = navItemSchema.partial().parse(data);
  const item = await prisma.navItem.update({ where: { id }, data: parsed });
  revalidatePath(`/${locale}/admin/website/navigation`);
  revalidatePath("/", "layout");
  return item;
}

export async function deleteNavItem(locale: string, id: string) {
  await requireAdmin(locale);
  await prisma.navItem.delete({ where: { id } });
  revalidatePath(`/${locale}/admin/website/navigation`);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function reorderNavItems(locale: string, orderedIds: string[]) {
  await requireAdmin(locale);
  await Promise.all(
    orderedIds.map((id, idx) =>
      prisma.navItem.update({ where: { id }, data: { position: idx } })
    )
  );
  revalidatePath(`/${locale}/admin/website/navigation`);
  revalidatePath("/", "layout");
  return { ok: true };
}
