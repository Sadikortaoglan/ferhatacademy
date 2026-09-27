import { describe, it, expect, beforeEach } from "vitest";
import { testPrisma } from "../helpers/prisma";
import type { HomepageConfigData } from "@/lib/homepage-types";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepage-types";

async function getConfig(): Promise<HomepageConfigData | null> {
  const row = await testPrisma.homepageConfig.findFirst({ orderBy: { createdAt: "asc" } });
  return row ? (row.config as unknown as HomepageConfigData) : null;
}

describe("HomepageConfig — DB contract", () => {
  beforeEach(async () => {
    await testPrisma.homepageConfig.deleteMany();
  });

  it("returns null when no config row exists", async () => {
    const config = await getConfig();
    expect(config).toBeNull();
  });

  it("stores and retrieves homepage config", async () => {
    await testPrisma.homepageConfig.create({
      data: { config: DEFAULT_HOMEPAGE_CONFIG as object },
    });
    const config = await getConfig();
    expect(config).not.toBeNull();
    expect(config!.hero.mode).toBe("STANDARD");
    expect(config!.sections.length).toBeGreaterThan(0);
  });

  it("hero mode can be updated to SLIDER", async () => {
    await testPrisma.homepageConfig.create({
      data: { config: DEFAULT_HOMEPAGE_CONFIG as object },
    });
    const row = await testPrisma.homepageConfig.findFirst({ orderBy: { createdAt: "asc" } });
    const updated: HomepageConfigData = {
      ...(row!.config as unknown as HomepageConfigData),
      hero: { mode: "SLIDER", slides: [] },
    };
    await testPrisma.homepageConfig.update({
      where: { id: row!.id },
      data: { config: updated as object },
    });
    const after = await getConfig();
    expect(after!.hero.mode).toBe("SLIDER");
  });

  it("section enabled state can be toggled", async () => {
    const config = { ...DEFAULT_HOMEPAGE_CONFIG };
    await testPrisma.homepageConfig.create({ data: { config: config as object } });

    const row = await testPrisma.homepageConfig.findFirst({ orderBy: { createdAt: "asc" } });
    const current = row!.config as unknown as HomepageConfigData;
    const updated: HomepageConfigData = {
      ...current,
      sections: current.sections.map((s, i) =>
        i === 0 ? { ...s, enabled: false } : s
      ),
    };
    await testPrisma.homepageConfig.update({
      where: { id: row!.id },
      data: { config: updated as object },
    });

    const after = await getConfig();
    expect(after!.sections[0].enabled).toBe(false);
  });

  it("section order is preserved", async () => {
    const sectionIds = DEFAULT_HOMEPAGE_CONFIG.sections.map((s) => s.id);
    await testPrisma.homepageConfig.create({
      data: { config: DEFAULT_HOMEPAGE_CONFIG as object },
    });
    const config = await getConfig();
    expect(config!.sections.map((s) => s.id)).toEqual(sectionIds);
  });

  it("config with all section types is valid JSON round-trip", async () => {
    const full: HomepageConfigData = {
      hero: { mode: "STATEMENT", sloganTr: "Test slogan", alignment: "left" },
      sections: [
        { type: "FEATURED_COURSES", id: "s1", enabled: true, mode: "AUTO" },
        { type: "CTA_BANNER", id: "s2", enabled: true, headlineTr: "Banner başlığı" },
        { type: "TEXT_IMAGE", id: "s3", enabled: false, headlineTr: "Metin", imagePosition: "right" },
        { type: "FINAL_CTA", id: "s4", enabled: true },
      ],
    };
    await testPrisma.homepageConfig.create({ data: { config: full as object } });
    const config = await getConfig();
    expect(config!.hero.mode).toBe("STATEMENT");
    expect(config!.sections).toHaveLength(4);
    expect(config!.sections[1].type).toBe("CTA_BANNER");
  });
});
