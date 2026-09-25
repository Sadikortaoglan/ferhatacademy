import { describe, it, expect } from "vitest";
import { THEME_CONFIGS, DEFAULT_THEME_ID, type ThemeId } from "@/lib/themes";
import { resolveTheme, buildCssVarsFromResolved } from "@/lib/theme-resolver";
import { DEFAULTS, buildCssVars } from "@/server/appearance";

const THEME_IDS: ThemeId[] = ["signature", "academy", "editorial"];

describe("THEME_CONFIGS", () => {
  it("defines all three themes", () => {
    expect(THEME_CONFIGS.signature).toBeDefined();
    expect(THEME_CONFIGS.academy).toBeDefined();
    expect(THEME_CONFIGS.editorial).toBeDefined();
  });

  it("default theme is signature", () => {
    expect(DEFAULT_THEME_ID).toBe("signature");
  });

  it("all themes have valid hex colors", () => {
    const HEX = /^#[0-9a-f]{6}$/i;
    for (const id of THEME_IDS) {
      const t = THEME_CONFIGS[id];
      expect(HEX.test(t.colorPrimary), `${id}.colorPrimary`).toBe(true);
      expect(HEX.test(t.colorBackground), `${id}.colorBackground`).toBe(true);
      expect(HEX.test(t.colorForeground), `${id}.colorForeground`).toBe(true);
      expect(HEX.test(t.colorDarkBg), `${id}.colorDarkBg`).toBe(true);
    }
  });

  it("themes are visually distinct — different backgrounds", () => {
    const bgs = THEME_IDS.map((id) => THEME_CONFIGS[id].colorBackground);
    const unique = new Set(bgs);
    expect(unique.size).toBe(3);
  });

  it("themes have distinct primaries", () => {
    const primaries = THEME_IDS.map((id) => THEME_CONFIGS[id].colorPrimary);
    const unique = new Set(primaries);
    expect(unique.size).toBe(3);
  });

  it("all themes have radius presets", () => {
    const valid = ["none", "sm", "md", "lg", "xl"];
    for (const id of THEME_IDS) {
      expect(valid).toContain(THEME_CONFIGS[id].radiusPreset);
    }
  });

  it("signature has dark background", () => {
    expect(THEME_CONFIGS.signature.colorBackground).toMatch(/^#0/i);
  });

  it("academy has light background", () => {
    expect(THEME_CONFIGS.academy.colorBackground).toMatch(/^#f/i);
  });

  it("editorial has cream background", () => {
    expect(THEME_CONFIGS.editorial.colorBackground).toMatch(/^#f/i);
    expect(THEME_CONFIGS.editorial.colorBackground).not.toBe(THEME_CONFIGS.academy.colorBackground);
  });
});

describe("resolveTheme", () => {
  it("resolves base theme with no overrides", () => {
    const r = resolveTheme("signature", {}, null);
    expect(r.colorPrimary).toBe(THEME_CONFIGS.signature.colorPrimary);
  });

  it("applies global color override", () => {
    const r = resolveTheme("signature", { colorPrimary: "#3b82f6" }, null);
    expect(r.colorPrimary).toBe("#3b82f6");
  });

  it("page override takes precedence over global", () => {
    const r = resolveTheme("signature", { colorPrimary: "#3b82f6" }, { colorPrimary: "#ff0000" });
    expect(r.colorPrimary).toBe("#ff0000");
  });

  it("global-only keys are not applied as page overrides", () => {
    const r = resolveTheme("signature", {}, { colorSuccess: "#00ff00" } as Record<string, string>);
    expect(r.colorSuccess).toBe(THEME_CONFIGS.signature.colorSuccess);
  });

  it("falls back to default theme for unknown themeId", () => {
    const r = resolveTheme("unknown-theme", {}, null);
    expect(r.id).toBe(DEFAULT_THEME_ID);
  });
});

describe("buildCssVarsFromResolved / buildCssVars", () => {
  it("generates :root block", () => {
    const css = buildCssVars(DEFAULTS);
    expect(css).toContain(":root {");
    expect(css).toContain("}");
  });

  it("includes all semantic color vars", () => {
    const css = buildCssVars(DEFAULTS);
    expect(css).toContain("--color-primary:");
    expect(css).toContain("--color-background:");
    expect(css).toContain("--color-foreground:");
    expect(css).toContain("--color-dark-bg:");
    expect(css).toContain("--radius:");
  });

  it("includes custom primary when overridden", () => {
    const resolved = resolveTheme("signature", { colorPrimary: "#3b82f6" }, null);
    const css = buildCssVarsFromResolved(resolved);
    expect(css).toContain("--color-primary: #3b82f6");
  });

  it("maps radius none to 0px", () => {
    const resolved = resolveTheme("signature", { radiusPreset: "none" }, null);
    const css = buildCssVarsFromResolved(resolved);
    expect(css).toContain("--radius: 0px");
  });

  it("maps radius xl to 1rem", () => {
    const resolved = resolveTheme("signature", { radiusPreset: "xl" }, null);
    const css = buildCssVarsFromResolved(resolved);
    expect(css).toContain("--radius: 1rem");
  });

  it("sets dark-bg from the active theme", () => {
    const resolved = resolveTheme("academy", {}, null);
    const css = buildCssVarsFromResolved(resolved);
    expect(css).toContain(`--color-dark-bg: ${THEME_CONFIGS.academy.colorDarkBg}`);
  });
});
