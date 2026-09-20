export const siteConfig = {
  defaultLocale: "tr" as const,
  locales: ["tr", "en"] as const,
  name: "Ferhat Academy",
  description: "Bilingual digital academy platform",
};

export type Locale = (typeof siteConfig.locales)[number];
