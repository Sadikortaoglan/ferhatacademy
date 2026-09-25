"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";
import { THEME_CONFIGS, DEFAULT_THEME_ID, type ThemeId } from "@/lib/themes";
import { validateOverrides, GLOBAL_ONLY_KEYS, type ThemeOverrides } from "@/lib/theme-resolver";

const PAGE_KEYS = [
  "HOME", "ACADEMY", "COURSES", "COURSE_DETAIL", "LIVE_TRAINING",
  "PRODUCTS", "PRODUCT_DETAIL", "ABOUT", "LOGIN", "REGISTER",
] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export async function getFullAppearanceState() {
  await requireAdmin("tr");
  const [siteRow, pageRows] = await Promise.all([
    prisma.siteAppearance.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.pageAppearanceOverride.findMany(),
  ]);
  return {
    activeTheme: siteRow?.activeTheme ?? DEFAULT_THEME_ID,
    globalOverrides: (siteRow?.globalOverrides ?? {}) as ThemeOverrides,
    pageOverrides: Object.fromEntries(
      pageRows.map((r) => [r.pageKey, r.overrides as ThemeOverrides])
    ),
  };
}

export async function saveGlobalAppearance(activeTheme: string, globalOverrides: ThemeOverrides) {
  await requireAdmin("tr");
  if (!(activeTheme in THEME_CONFIGS)) throw new Error("Invalid theme");
  const safeOverrides = validateOverrides(globalOverrides);
  const existing = await prisma.siteAppearance.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) {
    await prisma.siteAppearance.update({
      where: { id: existing.id },
      data: { activeTheme, globalOverrides: safeOverrides as object },
    });
  } else {
    await prisma.siteAppearance.create({ data: { activeTheme, globalOverrides: safeOverrides as object } });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function savePageOverride(pageKey: string, overrides: ThemeOverrides) {
  await requireAdmin("tr");
  if (!(PAGE_KEYS as readonly string[]).includes(pageKey)) throw new Error("Invalid page key");
  const safeOverrides = validateOverrides(overrides);
  for (const k of GLOBAL_ONLY_KEYS) {
    delete (safeOverrides as Record<string, unknown>)[k];
  }
  await prisma.pageAppearanceOverride.upsert({
    where: { pageKey },
    create: { pageKey, overrides: safeOverrides as object },
    update: { overrides: safeOverrides as object },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deletePageOverride(pageKey: string) {
  await requireAdmin("tr");
  if (!(PAGE_KEYS as readonly string[]).includes(pageKey)) throw new Error("Invalid page key");
  await prisma.pageAppearanceOverride.deleteMany({ where: { pageKey } });
  revalidatePath("/", "layout");
  return { ok: true };
}

const VALID_THEMES = ["signature", "academy", "editorial"] as const;

export async function getAppearance() {
  await requireAdmin("tr");
  return prisma.siteAppearance.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function activateTheme(themeId: ThemeId) {
  await requireAdmin("tr");
  if (!(themeId in THEME_CONFIGS)) themeId = DEFAULT_THEME_ID;
  const existing = await prisma.siteAppearance.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) {
    await prisma.siteAppearance.update({
      where: { id: existing.id },
      data: { activeTheme: themeId, globalOverrides: {} },
    });
  } else {
    await prisma.siteAppearance.create({ data: { activeTheme: themeId, globalOverrides: {} } });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveGlobalOverrides(overrides: ThemeOverrides) {
  await requireAdmin("tr");
  const safe = validateOverrides(overrides);
  const existing = await prisma.siteAppearance.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) {
    const merged = { ...(existing.globalOverrides as Record<string, unknown>), ...safe };
    await prisma.siteAppearance.update({ where: { id: existing.id }, data: { globalOverrides: merged } });
  } else {
    await prisma.siteAppearance.create({ data: { activeTheme: DEFAULT_THEME_ID, globalOverrides: safe } });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function savePageOverrides(pageKey: string, overrides: ThemeOverrides) {
  await requireAdmin("tr");
  const safe = validateOverrides(overrides);
  await prisma.pageAppearanceOverride.upsert({
    where: { pageKey },
    update: { overrides: safe },
    create: { pageKey, overrides: safe },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resetPageOverrides(pageKey: string) {
  await requireAdmin("tr");
  await prisma.pageAppearanceOverride.deleteMany({ where: { pageKey } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resetToThemeDefaults(themeId?: string) {
  await requireAdmin("tr");
  const id = (VALID_THEMES as readonly string[]).includes(themeId ?? "") ? (themeId as ThemeId) : DEFAULT_THEME_ID;
  return activateTheme(id);
}

// Legacy alias kept for compatibility with theme-selector.tsx
export { activateTheme as saveColorOverrides };
