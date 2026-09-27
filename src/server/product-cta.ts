import { CtaFlow, PricePresentation, PurchaseMode } from "@prisma/client";
import { formatPrice } from "./commerce";

// Minimal product shape needed for CTA resolution (no DB calls here)
export interface ProductCtaInput {
  id: string;
  slug: string;
  price: number;
  currency: string;
  purchaseMode: PurchaseMode;
  pricePresentation: PricePresentation;
  ctaFlow: CtaFlow;
  primaryCtaLabelTr: string | null;
  primaryCtaLabelEn: string | null;
  secondaryCtaLabelTr: string | null;
  secondaryCtaLabelEn: string | null;
  linkedCourseId: string | null;
  formTemplateId: string | null;
  pageProfileId: string | null;
}

export type UserAccessState =
  | "NOT_LOGGED_IN"
  | "ENTITLED"
  | "PAYMENT_PENDING"
  | "APPLICATION_SUBMITTED"
  | "APPLICATION_APPROVED"
  | "NO_APPLICATION"
  | "CAN_PURCHASE";

export interface CtaButton {
  label: string;
  href?: string;
  disabled?: boolean;
  variant?: "default" | "outline";
}

export interface ResolvedProductCta {
  priceLabel: string | null;      // null → hide price area entirely
  primaryCta: CtaButton | null;
  secondaryCta: CtaButton | null;
  configError: string | null;     // shown in admin only
}

function defaultCtaLabel(
  flow: CtaFlow,
  locale: string,
  customTr: string | null,
  customEn: string | null,
): string {
  if (locale === "tr" && customTr) return customTr;
  if (locale !== "tr" && customEn) return customEn;
  const defaults: Record<CtaFlow, { tr: string; en: string }> = {
    INFO_ONLY:               { tr: "Ücretsiz Bilgi Al",    en: "Get Free Info" },
    APPLICATION:             { tr: "Başvur",               en: "Apply" },
    DIRECT_PURCHASE:         { tr: "Satın Al",             en: "Buy Now" },
    APPLICATION_THEN_PURCHASE: { tr: "Başvur",             en: "Apply" },
    FREE_ENROLLMENT:         { tr: "Ücretsiz Katıl",       en: "Enroll Free" },
  };
  return locale === "tr" ? defaults[flow].tr : defaults[flow].en;
}

export function resolveProductCta(
  product: ProductCtaInput,
  userState: UserAccessState,
  locale: string,
): ResolvedProductCta {
  // ── Price label ──────────────────────────────────────────────────────────
  let priceLabel: string | null = null;
  switch (product.pricePresentation) {
    case "FIXED":
      priceLabel = formatPrice(product.price, product.currency, locale);
      break;
    case "FROM":
      priceLabel = locale === "tr"
        ? `${formatPrice(product.price, product.currency, locale)}'dan başlayan`
        : `From ${formatPrice(product.price, product.currency, locale)}`;
      break;
    case "FREE":
      priceLabel = locale === "tr" ? "Ücretsiz" : "Free";
      break;
    case "HIDDEN":
      priceLabel = null;
      break;
  }

  // ── Already entitled ─────────────────────────────────────────────────────
  if (userState === "ENTITLED") {
    const href = product.linkedCourseId
      ? `/${locale}/dashboard/courses/${product.linkedCourseId}`
      : `/${locale}/dashboard`;
    return {
      priceLabel,
      primaryCta: { label: locale === "tr" ? "Eğitime Git" : "Open Course", href },
      secondaryCta: null,
      configError: null,
    };
  }

  // ── Payment waiting ───────────────────────────────────────────────────────
  if (userState === "PAYMENT_PENDING") {
    return {
      priceLabel,
      primaryCta: {
        label: locale === "tr" ? "Ödeme Onayı Bekleniyor" : "Payment Pending",
        disabled: true,
      },
      secondaryCta: null,
      configError: null,
    };
  }

  // ── Config validation ─────────────────────────────────────────────────────
  let configError: string | null = null;
  if (product.ctaFlow === "INFO_ONLY" && !product.formTemplateId && !product.pageProfileId) {
    configError = "INFO_ONLY: randevu veya başvuru hedefi tanımlı değil.";
  }
  if (
    (product.ctaFlow === "APPLICATION" || product.ctaFlow === "APPLICATION_THEN_PURCHASE") &&
    (!product.formTemplateId || !product.pageProfileId)
  ) {
    configError = "Başvuru akışı için Form Şablonu ve Sayfa Profili gereklidir.";
  }
  if (product.ctaFlow === "DIRECT_PURCHASE" && product.price <= 0) {
    configError = "DIRECT_PURCHASE: geçerli bir fiyat tanımlı değil.";
  }
  if (product.ctaFlow === "FREE_ENROLLMENT" && product.price > 0) {
    configError = "FREE_ENROLLMENT: fiyat 0 olmalıdır.";
  }

  // ── Flow-based CTA resolution ─────────────────────────────────────────────
  const primaryLabel = defaultCtaLabel(
    product.ctaFlow,
    locale,
    product.primaryCtaLabelTr,
    product.primaryCtaLabelEn,
  );

  const secondaryLabel =
    (locale === "tr" ? product.secondaryCtaLabelTr : product.secondaryCtaLabelEn) ?? null;

  let primaryCta: CtaButton | null = null;
  let secondaryCta: CtaButton | null = null;

  switch (product.ctaFlow) {
    case "INFO_ONLY": {
      primaryCta = {
        label: primaryLabel,
        href: `/${locale}/randevu?productId=${product.id}`,
      };
      break;
    }

    case "APPLICATION": {
      if (userState === "APPLICATION_SUBMITTED") {
        primaryCta = { label: locale === "tr" ? "Başvurun İnceleniyor" : "Application Under Review", disabled: true };
      } else {
        primaryCta = {
          label: userState === "NO_APPLICATION" ? primaryLabel : primaryLabel,
          href: `/${locale}/products/${product.slug}/apply`,
        };
      }
      break;
    }

    case "APPLICATION_THEN_PURCHASE": {
      if (userState === "APPLICATION_SUBMITTED") {
        primaryCta = { label: locale === "tr" ? "Başvurun İnceleniyor" : "Under Review", disabled: true };
      } else if (userState === "APPLICATION_APPROVED") {
        primaryCta = {
          label: locale === "tr" ? "Ödemeye Geç" : "Proceed to Payment",
          href: `/${locale}/checkout/${product.slug}`,
        };
      } else {
        primaryCta = {
          label: primaryLabel,
          href: `/${locale}/products/${product.slug}/apply`,
        };
      }
      break;
    }

    case "DIRECT_PURCHASE": {
      primaryCta = {
        label: primaryLabel,
        href: userState === "NOT_LOGGED_IN"
          ? `/${locale}/login?returnTo=/${locale}/products/${product.slug}`
          : `/${locale}/checkout/${product.slug}`,
      };
      break;
    }

    case "FREE_ENROLLMENT": {
      primaryCta = {
        label: primaryLabel,
        href: userState === "NOT_LOGGED_IN"
          ? `/${locale}/login?returnTo=/${locale}/products/${product.slug}`
          : `/${locale}/checkout/${product.slug}`,
      };
      break;
    }
  }

  // Secondary CTA: use admin-configured label if present
  if (secondaryLabel) {
    secondaryCta = {
      label: secondaryLabel,
      href: `/${locale}/randevu?productId=${product.id}`,
      variant: "outline",
    };
  }

  return { priceLabel, primaryCta, secondaryCta, configError };
}

// ── Validation helpers (for admin editor) ────────────────────────────────────

export interface CtaConfigValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCtaConfig(product: ProductCtaInput): CtaConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (product.ctaFlow === "DIRECT_PURCHASE" && product.price <= 0) {
    errors.push("Direkt Satın Al için fiyat 0'dan büyük olmalıdır.");
  }
  if (product.ctaFlow === "FREE_ENROLLMENT" && product.price > 0) {
    errors.push("Ücretsiz Katıl için fiyat 0 TL olmalıdır.");
  }
  if (
    (product.ctaFlow === "APPLICATION" || product.ctaFlow === "APPLICATION_THEN_PURCHASE") &&
    (!product.formTemplateId || !product.pageProfileId)
  ) {
    errors.push("Başvuru akışı için Form Şablonu ve Sayfa Profili seçilmelidir.");
  }
  if (product.ctaFlow === "INFO_ONLY") {
    warnings.push("Randevu akışı için Randevu Tipleri tanımlı olmalıdır.");
  }
  if (product.pricePresentation === "FREE" && product.ctaFlow !== "FREE_ENROLLMENT") {
    warnings.push("Fiyat gösterimi FREE ama akış FREE_ENROLLMENT değil.");
  }
  if (product.pricePresentation === "FIXED" && product.price <= 0) {
    warnings.push("Fiyat gösterimi FIXED ama fiyat 0 TL.");
  }

  return { valid: errors.length === 0, errors, warnings };
}
