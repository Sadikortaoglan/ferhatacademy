"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";
import { z } from "zod";

const profileSchema = z.object({
  key: z.string().min(1).max(80).regex(/^[a-z0-9_-]+$/),
  headlineTr: z.string().min(1),
  headlineEn: z.string().min(1),
  subtitleTr: z.string().optional(),
  subtitleEn: z.string().optional(),
  motivationTr: z.string().optional(),
  motivationEn: z.string().optional(),
  programVisualUrl: z.string().url().optional().or(z.literal("")),
  ctaLabelTr: z.string().default("Başvur"),
  ctaLabelEn: z.string().default("Apply"),
  layout: z.enum(["SPLIT", "FORM_FIRST", "EDITORIAL"]).default("SPLIT"),
});

export async function createProfile(locale: string, data: unknown) {
  await requireAdmin(locale);
  const parsed = profileSchema.parse(data);
  const existing = await prisma.applicationPageProfile.findUnique({ where: { key: parsed.key } });
  if (existing) throw new Error("Bu key zaten kullanılıyor");
  const profile = await prisma.applicationPageProfile.create({
    data: {
      ...parsed,
      programVisualUrl: parsed.programVisualUrl || null,
    },
  });
  revalidatePath(`/${locale}/admin/applications/profiles`);
  return profile;
}

export async function updateProfile(locale: string, id: string, data: unknown) {
  await requireAdmin(locale);
  const parsed = profileSchema.partial().parse(data);
  const profile = await prisma.applicationPageProfile.update({
    where: { id },
    data: {
      ...parsed,
      programVisualUrl: parsed.programVisualUrl === "" ? null : parsed.programVisualUrl,
    },
  });
  revalidatePath(`/${locale}/admin/applications/profiles/${id}`);
  return profile;
}

export async function addFaqItem(
  locale: string,
  profileId: string,
  data: { questionTr: string; questionEn: string; answerTr: string; answerEn: string }
) {
  await requireAdmin(locale);
  const maxPos = await prisma.applicationPageFaqItem.aggregate({
    where: { profileId },
    _max: { position: true },
  });
  const item = await prisma.applicationPageFaqItem.create({
    data: { ...data, profileId, position: (maxPos._max.position ?? -1) + 1 },
  });
  revalidatePath(`/${locale}/admin/applications/profiles/${profileId}`);
  return item;
}

export async function updateFaqItem(
  locale: string,
  itemId: string,
  data: Partial<{ questionTr: string; questionEn: string; answerTr: string; answerEn: string; enabled: boolean }>
) {
  await requireAdmin(locale);
  return prisma.applicationPageFaqItem.update({ where: { id: itemId }, data });
}

export async function deleteFaqItem(locale: string, itemId: string) {
  await requireAdmin(locale);
  await prisma.applicationPageFaqItem.delete({ where: { id: itemId } });
  return { ok: true };
}

export async function addProcessStep(
  locale: string,
  profileId: string,
  data: { titleTr: string; titleEn: string; descTr?: string; descEn?: string }
) {
  await requireAdmin(locale);
  const maxPos = await prisma.applicationPageProcessStep.aggregate({
    where: { profileId },
    _max: { position: true },
  });
  const step = await prisma.applicationPageProcessStep.create({
    data: { ...data, profileId, position: (maxPos._max.position ?? -1) + 1 },
  });
  revalidatePath(`/${locale}/admin/applications/profiles/${profileId}`);
  return step;
}

export async function updateProcessStep(
  locale: string,
  stepId: string,
  data: Partial<{ titleTr: string; titleEn: string; descTr: string; descEn: string }>
) {
  await requireAdmin(locale);
  return prisma.applicationPageProcessStep.update({ where: { id: stepId }, data });
}

export async function deleteProcessStep(locale: string, stepId: string) {
  await requireAdmin(locale);
  await prisma.applicationPageProcessStep.delete({ where: { id: stepId } });
  return { ok: true };
}
