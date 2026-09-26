import { THEME_CONFIGS, DEFAULT_THEME_ID, type ThemeConfig, type ThemeId } from "./themes";

export type ThemeOverrides = Partial<{
  colorPrimary: string;
  colorPrimaryForeground: string;
  colorAccent: string;
  colorAccentForeground: string;
  colorBackground: string;
  colorSurface: string;
  colorForeground: string;
  colorHeading: string;
  colorBody: string;
  colorMuted: string;
  colorMutedForeground: string;
  colorBorder: string;
  colorSuccess: string;
  colorWarning: string;
  colorDanger: string;
  colorHeroBg: string;
  colorHeroHeading: string;
  colorHeroBody: string;
  headerStyle: "global" | "light" | "dark" | "transparent";
  footerStyle: "global" | "light" | "dark";
  radiusPreset: "none" | "sm" | "md" | "lg" | "xl";
}>;

export type ResolvedTheme = ThemeConfig & {
  effectiveColors: Record<string, string>;
  globalOverrides: ThemeOverrides;
  pageOverrides: ThemeOverrides | null;
};

const HEX_RE = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;
const VALID_RADIUS = ["none", "sm", "md", "lg", "xl"];
const VALID_HEADER_STYLE = ["global", "light", "dark", "transparent"];
const VALID_FOOTER_STYLE = ["global", "light", "dark"];

export const ALLOWED_OVERRIDE_KEYS = new Set<keyof ThemeOverrides>([
  "colorPrimary", "colorPrimaryForeground", "colorAccent", "colorAccentForeground",
  "colorBackground", "colorSurface", "colorForeground", "colorHeading", "colorBody",
  "colorMuted", "colorMutedForeground", "colorBorder",
  "colorSuccess", "colorWarning", "colorDanger",
  "colorHeroBg", "colorHeroHeading", "colorHeroBody",
  "headerStyle", "footerStyle", "radiusPreset",
]);

export const GLOBAL_ONLY_KEYS = new Set<keyof ThemeOverrides>([
  "colorSuccess", "colorWarning", "colorDanger",
]);

export function validateOverrides(raw: unknown): ThemeOverrides {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: ThemeOverrides = {};
  const input = raw as Record<string, unknown>;
  for (const key of Object.keys(input)) {
    if (!ALLOWED_OVERRIDE_KEYS.has(key as keyof ThemeOverrides)) continue;
    const val = input[key];
    if (typeof val !== "string") continue;
    if (key === "radiusPreset") {
      if (VALID_RADIUS.includes(val)) (result as Record<string, string>)[key] = val;
    } else if (key === "headerStyle") {
      if (VALID_HEADER_STYLE.includes(val)) (result as Record<string, string>)[key] = val;
    } else if (key === "footerStyle") {
      if (VALID_FOOTER_STYLE.includes(val)) (result as Record<string, string>)[key] = val;
    } else {
      if (HEX_RE.test(val)) (result as Record<string, string>)[key] = val;
    }
  }
  return result;
}

export function resolveTheme(
  activeThemeId: string,
  globalOverrides: ThemeOverrides,
  pageOverrides: ThemeOverrides | null,
): ResolvedTheme {
  const themeId: ThemeId = (activeThemeId in THEME_CONFIGS ? activeThemeId : DEFAULT_THEME_ID) as ThemeId;
  const base = THEME_CONFIGS[themeId];
  const merged = { ...base } as ThemeConfig & Record<string, unknown>;

  for (const [k, v] of Object.entries(globalOverrides)) {
    if (ALLOWED_OVERRIDE_KEYS.has(k as keyof ThemeOverrides) && v !== undefined) {
      merged[k] = v;
    }
  }

  if (pageOverrides) {
    for (const [k, v] of Object.entries(pageOverrides)) {
      if (
        ALLOWED_OVERRIDE_KEYS.has(k as keyof ThemeOverrides) &&
        !GLOBAL_ONLY_KEYS.has(k as keyof ThemeOverrides) &&
        v !== undefined
      ) {
        merged[k] = v;
      }
    }
  }

  const RADIUS_MAP: Record<string, string> = {
    none: "0px", sm: "0.25rem", md: "0.5rem", lg: "0.75rem", xl: "1rem",
  };

  const r = (merged.radiusPreset as string) ?? base.radiusPreset;
  const effectiveColors: Record<string, string> = {
    "--color-primary": (merged.colorPrimary as string) ?? base.colorPrimary,
    "--color-primary-foreground": (merged.colorPrimaryForeground as string) ?? base.colorPrimaryForeground,
    "--color-accent": (merged.colorAccent as string) ?? base.colorAccent,
    "--color-accent-foreground": (merged.colorPrimaryForeground as string) ?? base.colorPrimaryForeground,
    "--color-background": (merged.colorBackground as string) ?? base.colorBackground,
    "--color-surface": (merged.colorSurface as string) ?? base.colorSurface,
    "--color-foreground": (merged.colorForeground as string) ?? base.colorForeground,
    "--color-muted": (merged.colorMuted as string) ?? base.colorMuted,
    "--color-muted-foreground": (merged.colorMutedForeground as string) ?? base.colorMutedForeground,
    "--color-border": (merged.colorBorder as string) ?? base.colorBorder,
    "--color-success": (merged.colorSuccess as string) ?? base.colorSuccess,
    "--color-warning": (merged.colorWarning as string) ?? base.colorWarning,
    "--color-danger": (merged.colorDanger as string) ?? base.colorDanger,
    "--color-dark-bg": base.colorDarkBg,
    "--color-dark-surface": base.colorDarkSurface,
    "--radius": RADIUS_MAP[r] ?? RADIUS_MAP[base.radiusPreset],
  };

  return {
    ...(merged as ThemeConfig),
    effectiveColors,
    globalOverrides,
    pageOverrides,
  };
}

export function buildCssVarsFromResolved(resolved: ResolvedTheme): string {
  const lines = [":root {"];
  for (const [prop, value] of Object.entries(resolved.effectiveColors)) {
    lines.push(`  ${prop}: ${value};`);
  }
  lines.push("}");
  return lines.join("\n");
}
