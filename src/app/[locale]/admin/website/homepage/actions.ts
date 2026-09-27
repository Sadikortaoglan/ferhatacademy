"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";
import { HOMEPAGE_TAG } from "@/server/homepage";
import { type HomepageConfigData, DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepage-types";

export async function getHomepageAdminConfig(): Promise<HomepageConfigData> {
  await requireAdmin("tr");
  const row = await prisma.homepageConfig.findFirst({ orderBy: { createdAt: "asc" } });
  if (!row) return DEFAULT_HOMEPAGE_CONFIG;
  return row.config as unknown as HomepageConfigData;
}

export async function saveHomepageConfig(config: HomepageConfigData) {
  await requireAdmin("tr");

  // Basic validation
  if (!config.hero?.mode) throw new Error("Geçersiz hero config");
  if (!Array.isArray(config.sections)) throw new Error("Geçersiz sections");

  const existing = await prisma.homepageConfig.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) {
    await prisma.homepageConfig.update({
      where: { id: existing.id },
      data: { config: config as object },
    });
  } else {
    await prisma.homepageConfig.create({ data: { config: config as object } });
  }

  updateTag(HOMEPAGE_TAG);
  revalidatePath("/", "page");
  revalidatePath("/tr", "page");
  revalidatePath("/en", "page");
  return { ok: true };
}
