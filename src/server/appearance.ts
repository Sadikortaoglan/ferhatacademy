import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  resolveTheme,
  validateOverrides,
  buildCssVarsFromResolved,
  type ThemeOverrides,
  type ResolvedTheme,
} from "@/lib/theme-resolver";
import { THEME_CONFIGS, DEFAULT_THEME_ID, type ThemeId } from "@/lib/themes";

export type { ResolvedTheme, ThemeOverrides };

export const SITE_APPEARANCE_TAG = "site-appearance";

export type AppearanceConfig = {
  themePreset: string;
  resolved: ResolvedTheme;
};

export const DEFAULTS: AppearanceConfig = {
  themePreset: DEFAULT_THEME_ID,
  resolved: resolveTheme(DEFAULT_THEME_ID, {}, null),
};

// Cached across requests — revalidated on-demand when admin saves appearance.
// revalidate: 300 is a safety net; primary invalidation is via revalidateTag.
export const getSiteAppearance = unstable_cache(
  async (): Promise<AppearanceConfig> => {
    try {
      const row = await prisma.siteAppearance.findFirst({ orderBy: { createdAt: "asc" } });
      if (!row) return DEFAULTS;
      const globalOverrides = validateOverrides(row.globalOverrides);
      const resolved = resolveTheme(row.activeTheme, globalOverrides, null);
      return { themePreset: row.activeTheme, resolved };
    } catch {
      return DEFAULTS;
    }
  },
  [SITE_APPEARANCE_TAG],
  { tags: [SITE_APPEARANCE_TAG], revalidate: 300 },
);

export async function getSiteAppearanceForPage(pageKey: string): Promise<AppearanceConfig> {
  try {
    const [siteRow, pageRow] = await Promise.all([
      prisma.siteAppearance.findFirst({ orderBy: { createdAt: "asc" } }),
      prisma.pageAppearanceOverride.findUnique({ where: { pageKey } }),
    ]);
    const activeTheme = siteRow?.activeTheme ?? DEFAULT_THEME_ID;
    const globalOverrides = validateOverrides(siteRow?.globalOverrides ?? {});
    const pageOverrides = pageRow ? validateOverrides(pageRow.overrides) : null;
    const resolved = resolveTheme(activeTheme, globalOverrides, pageOverrides);
    return { themePreset: activeTheme, resolved };
  } catch {
    return DEFAULTS;
  }
}

export function getThemeId(cfg: AppearanceConfig): ThemeId {
  return (cfg.themePreset in THEME_CONFIGS ? cfg.themePreset : DEFAULT_THEME_ID) as ThemeId;
}

export function buildCssVars(cfg: AppearanceConfig): string {
  return buildCssVarsFromResolved(cfg.resolved);
}
