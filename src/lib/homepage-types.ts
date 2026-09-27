// Homepage configuration types — shared between admin and public rendering

export type HeroMode = "STANDARD" | "SLIDER" | "BANNER" | "STATEMENT";

export type CtaDestination =
  | "/courses"
  | "/products"
  | "/live"
  | "/about"
  | "/register"
  | "/randevu"
  | "/academy";

export interface CtaButton {
  label: string;
  destination: CtaDestination;
}

export interface HeroStandard {
  mode: "STANDARD";
  eyebrow?: string;
  headlineTr: string;
  headlineEn?: string;
  highlightedText?: string;
  descriptionTr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  primaryCta?: CtaButton;
  secondaryCta?: CtaButton;
  alignment?: "left" | "center";
}

export interface SlideItem {
  id: string;
  headlineTr: string;
  headlineEn?: string;
  descriptionTr?: string;
  imageUrl?: string;
  primaryCta?: CtaButton;
  secondaryCta?: CtaButton;
  enabled: boolean;
}

export interface HeroSlider {
  mode: "SLIDER";
  slides: SlideItem[];
  autoplay?: boolean;
  autoplayInterval?: 3000 | 4000 | 5000 | 6000;
}

export interface HeroBanner {
  mode: "BANNER";
  imageUrl?: string;
  headlineTr?: string;
  headlineEn?: string;
  descriptionTr?: string;
  primaryCta?: CtaButton;
  enabled: boolean;
}

export interface HeroStatement {
  mode: "STATEMENT";
  sloganTr: string;
  sloganEn?: string;
  subtextTr?: string;
  subtextEn?: string;
  backgroundImageUrl?: string;
  primaryCta?: CtaButton;
  alignment?: "left" | "center";
}

export type HeroConfig =
  | HeroStandard
  | HeroSlider
  | HeroBanner
  | HeroStatement;

// ── Section types ──────────────────────────────────────────────────────────

export type SectionType =
  | "FEATURED_COURSES"
  | "FEATURED_PRODUCTS"
  | "LEARNING_OPTIONS"
  | "LIVE_TRAINING"
  | "ABOUT"
  | "FREE_CONTENT"
  | "CTA_BANNER"
  | "TEXT_IMAGE"
  | "FINAL_CTA";

export type FeaturedMode = "AUTO" | "MANUAL";

export interface SectionFeaturedCourses {
  type: "FEATURED_COURSES";
  id: string;
  enabled: boolean;
  headlineTr?: string;
  headlineEn?: string;
  subtitleTr?: string;
  mode: FeaturedMode;
  manualIds?: string[];
}

export interface SectionFeaturedProducts {
  type: "FEATURED_PRODUCTS";
  id: string;
  enabled: boolean;
  headlineTr?: string;
  headlineEn?: string;
  subtitleTr?: string;
  mode: FeaturedMode;
  manualIds?: string[];
}

export interface SectionLearningOptions {
  type: "LEARNING_OPTIONS";
  id: string;
  enabled: boolean;
  headlineTr?: string;
  headlineEn?: string;
  subtitleTr?: string;
}

export interface SectionLiveTraining {
  type: "LIVE_TRAINING";
  id: string;
  enabled: boolean;
  headlineTr?: string;
  headlineEn?: string;
  subtitleTr?: string;
}

export interface SectionAbout {
  type: "ABOUT";
  id: string;
  enabled: boolean;
  headlineTr?: string;
  headlineEn?: string;
  bodyTr?: string;
  imageUrl?: string;
  ctaLabel?: string;
}

export interface SectionFreeContent {
  type: "FREE_CONTENT";
  id: string;
  enabled: boolean;
  headlineTr?: string;
  headlineEn?: string;
  subtitleTr?: string;
}

export interface SectionCtaBanner {
  type: "CTA_BANNER";
  id: string;
  enabled: boolean;
  headlineTr: string;
  headlineEn?: string;
  descriptionTr?: string;
  imageUrl?: string;
  primaryCta?: CtaButton;
}

export interface SectionTextImage {
  type: "TEXT_IMAGE";
  id: string;
  enabled: boolean;
  headlineTr: string;
  headlineEn?: string;
  descriptionTr?: string;
  imageUrl?: string;
  imagePosition?: "left" | "right";
  primaryCta?: CtaButton;
}

export interface SectionFinalCta {
  type: "FINAL_CTA";
  id: string;
  enabled: boolean;
  headlineTr?: string;
  headlineEn?: string;
  subtitleTr?: string;
  primaryCta?: CtaButton;
}

export type HomepageSection =
  | SectionFeaturedCourses
  | SectionFeaturedProducts
  | SectionLearningOptions
  | SectionLiveTraining
  | SectionAbout
  | SectionFreeContent
  | SectionCtaBanner
  | SectionTextImage
  | SectionFinalCta;

export interface HomepageConfigData {
  hero: HeroConfig;
  sections: HomepageSection[];
  isDraft?: boolean;
}

// Default config — mirrors the current hardcoded homepage
export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfigData = {
  hero: {
    mode: "STANDARD",
    eyebrow: "",
    headlineTr: "Dijital Pazarlamada\nGerçek Sonuçlar",
    headlineEn: "Real Results in\nDigital Marketing",
    highlightedText: "Gerçek Sonuçlar",
    descriptionTr: "Reklam, içerik ve strateji eğitimleriyle işini büyüt.",
    descriptionEn: "Grow your business with ad, content, and strategy training.",
    primaryCta: { label: "Kurslara Bak", destination: "/courses" },
    secondaryCta: { label: "Ücretsiz Kaydol", destination: "/register" },
    alignment: "left",
  },
  sections: [
    {
      type: "FEATURED_COURSES",
      id: "featured-courses",
      enabled: true,
      headlineTr: "Öne Çıkan Programlar",
      subtitleTr: "Kendi hızında veya canlı eğitimle öğren.",
      mode: "AUTO",
    },
    {
      type: "LEARNING_OPTIONS",
      id: "learning-options",
      enabled: true,
      headlineTr: "Nasıl Öğrenmek İstersin?",
      subtitleTr: "Her öğrenme stiline uygun format.",
    },
    {
      type: "LIVE_TRAINING",
      id: "live-training",
      enabled: true,
      headlineTr: "Canlı Eğitimler",
      subtitleTr: "Gerçek zamanlı öğrenme deneyimi.",
    },
    {
      type: "FREE_CONTENT",
      id: "free-content",
      enabled: true,
      headlineTr: "Ücretsiz İçerikler",
      subtitleTr: "Hemen başlamak için ücretsiz kaynaklar.",
    },
    {
      type: "ABOUT",
      id: "about",
      enabled: true,
      headlineTr: "Ferhat Hakkında",
      ctaLabel: "Daha Fazla →",
    },
    {
      type: "FINAL_CTA",
      id: "final-cta",
      enabled: true,
      headlineTr: "Öğrenmeye Bugün Başla",
      subtitleTr: "Binlerce öğrenciye katıl.",
      primaryCta: { label: "Ücretsiz Kaydol", destination: "/register" },
    },
  ],
};
