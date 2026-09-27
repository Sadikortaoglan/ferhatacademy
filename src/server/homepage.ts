import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { type HomepageConfigData, DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepage-types";

export const HOMEPAGE_TAG = "homepage-config";

export const getHomepageConfig = unstable_cache(
  async (): Promise<HomepageConfigData> => {
    try {
      const row = await prisma.homepageConfig.findFirst({ orderBy: { createdAt: "asc" } });
      if (!row) return DEFAULT_HOMEPAGE_CONFIG;
      return row.config as unknown as HomepageConfigData;
    } catch {
      return DEFAULT_HOMEPAGE_CONFIG;
    }
  },
  ["homepage-config"],
  { tags: [HOMEPAGE_TAG], revalidate: 300 }
);
