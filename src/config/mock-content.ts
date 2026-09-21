// Development placeholder content — replace with real DB content in Phase 02
// These are used on public pages until the Academy domain is implemented.

export type ContentType =
  | "COURSE"
  | "LIVE_TRAINING"
  | "MENTORSHIP"
  | "MEMBERSHIP"
  | "DIGITAL_PRODUCT"
  | "SINGLE_VIDEO";

export type VisibilityType = "PUBLIC" | "REGISTERED" | "ENTITLED" | "PRIVATE";

export interface MockProgram {
  id: string;
  slug: string;
  type: ContentType;
  titleTr: string;
  titleEn: string;
  shortDescTr: string;
  shortDescEn: string;
  price: string | null; // null = free
  lessonCount?: number;
  durationLabel?: string;
  coverBg: string; // tailwind bg color class — replace with real image later
}

export interface MockFreeContent {
  id: string;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  visibility: VisibilityType;
  durationLabel: string;
  coverBg: string;
  href?: string;
}

export const mockPrograms: MockProgram[] = [
  {
    id: "mock-meta-ads",
    slug: "meta-ads-masterclass",
    type: "COURSE",
    titleTr: "Meta Ads Masterclass",
    titleEn: "Meta Ads Masterclass",
    shortDescTr:
      "Facebook ve Instagram reklamlarını sıfırdan öğren. Gerçek kampanya stratejileri ve optimizasyon teknikleri.",
    shortDescEn:
      "Learn Facebook and Instagram ads from scratch. Real campaign strategies and optimization techniques.",
    price: null,
    lessonCount: 24,
    durationLabel: "8 saat",
    coverBg: "bg-orange-900",
  },
  {
    id: "mock-ecommerce",
    slug: "ecommerce-stratejisi",
    type: "COURSE",
    titleTr: "E-Ticaret Stratejisi",
    titleEn: "E-Commerce Strategy",
    shortDescTr:
      "Online mağaza kurulumundan ürün lansmanına kadar e-ticarette başarının tüm adımları.",
    shortDescEn:
      "All steps to e-commerce success from store setup to product launch.",
    price: "₺1.490",
    lessonCount: 18,
    durationLabel: "6 saat",
    coverBg: "bg-slate-800",
  },
  {
    id: "mock-live-1on1",
    slug: "ozel-egitim",
    type: "LIVE_TRAINING",
    titleTr: "1:1 Özel Eğitim",
    titleEn: "1:1 Private Training",
    shortDescTr:
      "Ferhat ile birebir Zoom seansı. İşletmene özel strateji ve gerçek zamanlı geri bildirim.",
    shortDescEn:
      "One-on-one Zoom session with Ferhat. Strategy tailored to your business with real-time feedback.",
    price: "İletişime geç",
    coverBg: "bg-zinc-900",
  },
];

export const mockFreeContent: MockFreeContent[] = [
  {
    id: "mock-free-1",
    titleTr: "Meta Ads'e Giriş",
    titleEn: "Introduction to Meta Ads",
    descTr: "Reklam yöneticisini ilk kez açıyorsanız bu video sizin için.",
    descEn: "If you're opening Ads Manager for the first time, this video is for you.",
    visibility: "PUBLIC",
    durationLabel: "14 dk",
    coverBg: "bg-orange-800",
    href: "/courses/meta-reklamcilik-temelleri",
  },
  {
    id: "mock-free-2",
    titleTr: "Hedef Kitle Oluşturma",
    titleEn: "Audience Building",
    descTr: "Doğru kitleye ulaşmanın temel yöntemleri.",
    descEn: "Core methods for reaching the right audience.",
    visibility: "REGISTERED",
    durationLabel: "22 dk",
    coverBg: "bg-slate-700",
    href: "/courses/meta-reklamcilik-temelleri",
  },
  {
    id: "mock-free-3",
    titleTr: "Reklam Optimizasyonu",
    titleEn: "Ad Optimization",
    descTr: "Kampanya performansını artırmak için ileri teknikler.",
    descEn: "Advanced techniques to boost campaign performance.",
    visibility: "ENTITLED",
    durationLabel: "38 dk",
    coverBg: "bg-zinc-800",
    href: "/courses/meta-reklamcilik-temelleri",
  },
];
