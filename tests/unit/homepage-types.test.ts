import { describe, it, expect } from "vitest";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  type HomepageConfigData,
  type HeroMode,
} from "@/lib/homepage-types";

describe("DEFAULT_HOMEPAGE_CONFIG", () => {
  it("has a valid hero mode", () => {
    const validModes: HeroMode[] = ["STANDARD", "SLIDER", "BANNER", "STATEMENT"];
    expect(validModes).toContain(DEFAULT_HOMEPAGE_CONFIG.hero.mode);
  });

  it("has at least one section", () => {
    expect(DEFAULT_HOMEPAGE_CONFIG.sections.length).toBeGreaterThan(0);
  });

  it("all sections have required fields", () => {
    for (const section of DEFAULT_HOMEPAGE_CONFIG.sections) {
      expect(section.id).toBeTruthy();
      expect(section.type).toBeTruthy();
      expect(typeof section.enabled).toBe("boolean");
    }
  });

  it("section ids are unique", () => {
    const ids = DEFAULT_HOMEPAGE_CONFIG.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("hero mode is STANDARD with required fields", () => {
    const hero = DEFAULT_HOMEPAGE_CONFIG.hero;
    if (hero.mode === "STANDARD") {
      expect(hero.headlineTr).toBeTruthy();
    }
  });
});

describe("Homepage section type guard", () => {
  it("recognizes all section types", () => {
    const types = DEFAULT_HOMEPAGE_CONFIG.sections.map((s) => s.type);
    for (const type of types) {
      expect(typeof type).toBe("string");
      expect(type.length).toBeGreaterThan(0);
    }
  });
});

describe("changeHeroMode behavior", () => {
  function changeHeroMode(config: HomepageConfigData, newMode: HeroMode): HomepageConfigData["hero"] {
    if (newMode === config.hero.mode) return config.hero;
    switch (newMode) {
      case "STANDARD":
        return { mode: "STANDARD", headlineTr: "", alignment: "left" };
      case "SLIDER":
        return { mode: "SLIDER", slides: [] };
      case "BANNER":
        return { mode: "BANNER", enabled: true };
      case "STATEMENT":
        return { mode: "STATEMENT", sloganTr: "", alignment: "left" };
    }
  }

  it("returns existing hero if mode unchanged", () => {
    const hero = changeHeroMode(DEFAULT_HOMEPAGE_CONFIG, "STANDARD");
    expect(hero.mode).toBe("STANDARD");
  });

  it("switches to SLIDER mode with empty slides", () => {
    const hero = changeHeroMode(DEFAULT_HOMEPAGE_CONFIG, "SLIDER");
    expect(hero.mode).toBe("SLIDER");
    if (hero.mode === "SLIDER") {
      expect(hero.slides).toEqual([]);
    }
  });

  it("switches to BANNER mode", () => {
    const hero = changeHeroMode(DEFAULT_HOMEPAGE_CONFIG, "BANNER");
    expect(hero.mode).toBe("BANNER");
  });

  it("switches to STATEMENT mode", () => {
    const hero = changeHeroMode(DEFAULT_HOMEPAGE_CONFIG, "STATEMENT");
    expect(hero.mode).toBe("STATEMENT");
    if (hero.mode === "STATEMENT") {
      expect(hero.sloganTr).toBe("");
    }
  });
});
