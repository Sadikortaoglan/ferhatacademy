import { describe, it, expect } from "vitest";
import { resolveProductCta, validateCtaConfig, type ProductCtaInput } from "@/server/product-cta";

function makeProduct(overrides: Partial<ProductCtaInput> = {}): ProductCtaInput {
  return {
    id: "prod_1",
    slug: "test-product",
    price: 2499900,
    currency: "TRY",
    purchaseMode: "DIRECT_PURCHASE",
    pricePresentation: "FIXED",
    ctaFlow: "DIRECT_PURCHASE",
    primaryCtaLabelTr: null,
    primaryCtaLabelEn: null,
    secondaryCtaLabelTr: null,
    secondaryCtaLabelEn: null,
    linkedCourseId: null,
    formTemplateId: null,
    pageProfileId: null,
    ...overrides,
  };
}

// ─── Price presentation ───────────────────────────────────────────────────────

describe("resolveProductCta — price presentation", () => {
  it("FIXED shows formatted price", () => {
    const r = resolveProductCta(makeProduct({ pricePresentation: "FIXED", price: 2499900 }), "NOT_LOGGED_IN", "tr");
    expect(r.priceLabel).toContain("24.999");
  });

  it("HIDDEN returns null priceLabel", () => {
    const r = resolveProductCta(makeProduct({ pricePresentation: "HIDDEN" }), "NOT_LOGGED_IN", "tr");
    expect(r.priceLabel).toBeNull();
  });

  it("FREE returns 'Ücretsiz' in tr", () => {
    const r = resolveProductCta(makeProduct({ pricePresentation: "FREE", price: 0, ctaFlow: "FREE_ENROLLMENT" }), "NOT_LOGGED_IN", "tr");
    expect(r.priceLabel).toBe("Ücretsiz");
  });

  it("FREE returns 'Free' in en", () => {
    const r = resolveProductCta(makeProduct({ pricePresentation: "FREE", price: 0, ctaFlow: "FREE_ENROLLMENT" }), "NOT_LOGGED_IN", "en");
    expect(r.priceLabel).toBe("Free");
  });

  it("FROM shows 'dan başlayan' in tr", () => {
    const r = resolveProductCta(makeProduct({ pricePresentation: "FROM", price: 500000 }), "NOT_LOGGED_IN", "tr");
    expect(r.priceLabel).toContain("başlayan");
  });
});

// ─── INFO_ONLY ────────────────────────────────────────────────────────────────

describe("resolveProductCta — INFO_ONLY", () => {
  const product = makeProduct({ ctaFlow: "INFO_ONLY", pricePresentation: "HIDDEN" });

  it("primary CTA href points to /randevu", () => {
    const r = resolveProductCta(product, "NOT_LOGGED_IN", "tr");
    expect(r.primaryCta?.href).toContain("/randevu");
  });

  it("default label is 'Ücretsiz Bilgi Al' in tr", () => {
    const r = resolveProductCta(product, "NOT_LOGGED_IN", "tr");
    expect(r.primaryCta?.label).toBe("Ücretsiz Bilgi Al");
  });

  it("custom TR label overrides default", () => {
    const r = resolveProductCta(
      makeProduct({ ctaFlow: "INFO_ONLY", pricePresentation: "HIDDEN", primaryCtaLabelTr: "Hemen Başvur" }),
      "NOT_LOGGED_IN",
      "tr"
    );
    expect(r.primaryCta?.label).toBe("Hemen Başvur");
  });

  it("price is null when HIDDEN", () => {
    const r = resolveProductCta(product, "NOT_LOGGED_IN", "tr");
    expect(r.priceLabel).toBeNull();
  });
});

// ─── APPLICATION ──────────────────────────────────────────────────────────────

describe("resolveProductCta — APPLICATION", () => {
  const product = makeProduct({
    ctaFlow: "APPLICATION",
    pricePresentation: "FIXED",
    formTemplateId: "tmpl_1",
    pageProfileId: "prof_1",
  });

  it("NOT_LOGGED_IN → href to /apply", () => {
    const r = resolveProductCta(product, "NOT_LOGGED_IN", "tr");
    expect(r.primaryCta?.href).toContain("/apply");
    expect(r.primaryCta?.label).toBe("Başvur");
  });

  it("APPLICATION_SUBMITTED → disabled", () => {
    const r = resolveProductCta(product, "APPLICATION_SUBMITTED", "tr");
    expect(r.primaryCta?.disabled).toBe(true);
    expect(r.primaryCta?.label).toContain("İnceleniyor");
  });
});

// ─── APPLICATION_THEN_PURCHASE ────────────────────────────────────────────────

describe("resolveProductCta — APPLICATION_THEN_PURCHASE", () => {
  const product = makeProduct({
    ctaFlow: "APPLICATION_THEN_PURCHASE",
    pricePresentation: "FIXED",
    formTemplateId: "tmpl_1",
    pageProfileId: "prof_1",
  });

  it("NO_APPLICATION → Başvur to /apply", () => {
    const r = resolveProductCta(product, "NO_APPLICATION", "tr");
    expect(r.primaryCta?.href).toContain("/apply");
  });

  it("APPLICATION_APPROVED → Ödemeye Geç to /checkout", () => {
    const r = resolveProductCta(product, "APPLICATION_APPROVED", "tr");
    expect(r.primaryCta?.href).toContain("/checkout");
    expect(r.primaryCta?.label).toContain("Ödeme");
  });

  it("APPLICATION_SUBMITTED → disabled", () => {
    const r = resolveProductCta(product, "APPLICATION_SUBMITTED", "tr");
    expect(r.primaryCta?.disabled).toBe(true);
  });
});

// ─── DIRECT_PURCHASE ──────────────────────────────────────────────────────────

describe("resolveProductCta — DIRECT_PURCHASE", () => {
  const product = makeProduct({ ctaFlow: "DIRECT_PURCHASE", pricePresentation: "FIXED", price: 499900 });

  it("NOT_LOGGED_IN → login redirect", () => {
    const r = resolveProductCta(product, "NOT_LOGGED_IN", "tr");
    expect(r.primaryCta?.href).toContain("/login");
  });

  it("CAN_PURCHASE → checkout href", () => {
    const r = resolveProductCta(product, "CAN_PURCHASE", "tr");
    expect(r.primaryCta?.href).toContain("/checkout");
    expect(r.primaryCta?.label).toBe("Satın Al");
  });
});

// ─── FREE_ENROLLMENT ──────────────────────────────────────────────────────────

describe("resolveProductCta — FREE_ENROLLMENT", () => {
  const product = makeProduct({ ctaFlow: "FREE_ENROLLMENT", pricePresentation: "FREE", price: 0 });

  it("CAN_PURCHASE → checkout href", () => {
    const r = resolveProductCta(product, "CAN_PURCHASE", "tr");
    expect(r.primaryCta?.href).toContain("/checkout");
    expect(r.primaryCta?.label).toBe("Ücretsiz Katıl");
  });
});

// ─── ENTITLED ─────────────────────────────────────────────────────────────────

describe("resolveProductCta — ENTITLED overrides all flows", () => {
  it("entitled user always gets 'Eğitime Git'", () => {
    for (const flow of ["INFO_ONLY", "APPLICATION", "DIRECT_PURCHASE", "APPLICATION_THEN_PURCHASE", "FREE_ENROLLMENT"] as const) {
      const r = resolveProductCta(makeProduct({ ctaFlow: flow }), "ENTITLED", "tr");
      expect(r.primaryCta?.label).toBe("Eğitime Git");
    }
  });
});

// ─── PAYMENT_PENDING ──────────────────────────────────────────────────────────

describe("resolveProductCta — PAYMENT_PENDING", () => {
  it("always disabled regardless of flow", () => {
    const r = resolveProductCta(makeProduct({ ctaFlow: "DIRECT_PURCHASE" }), "PAYMENT_PENDING", "tr");
    expect(r.primaryCta?.disabled).toBe(true);
    expect(r.primaryCta?.label).toContain("Bekleniyor");
  });
});

// ─── Secondary CTA ───────────────────────────────────────────────────────────

describe("resolveProductCta — secondary CTA", () => {
  it("secondaryCta present when secondaryCtaLabelTr is set", () => {
    const r = resolveProductCta(
      makeProduct({ ctaFlow: "APPLICATION", secondaryCtaLabelTr: "Ön Görüşme Al", formTemplateId: "t", pageProfileId: "p" }),
      "NOT_LOGGED_IN",
      "tr"
    );
    expect(r.secondaryCta?.label).toBe("Ön Görüşme Al");
    expect(r.secondaryCta?.href).toContain("/randevu");
  });

  it("no secondaryCta when label not set", () => {
    const r = resolveProductCta(makeProduct({ ctaFlow: "DIRECT_PURCHASE" }), "NOT_LOGGED_IN", "tr");
    expect(r.secondaryCta).toBeNull();
  });
});

// ─── Validation ──────────────────────────────────────────────────────────────

describe("validateCtaConfig", () => {
  it("DIRECT_PURCHASE with price=0 → error", () => {
    const v = validateCtaConfig(makeProduct({ ctaFlow: "DIRECT_PURCHASE", price: 0 }));
    expect(v.valid).toBe(false);
    expect(v.errors.length).toBeGreaterThan(0);
  });

  it("FREE_ENROLLMENT with price>0 → error", () => {
    const v = validateCtaConfig(makeProduct({ ctaFlow: "FREE_ENROLLMENT", price: 100 }));
    expect(v.valid).toBe(false);
  });

  it("APPLICATION without formTemplateId → warning (not error), still valid", () => {
    const v = validateCtaConfig(makeProduct({ ctaFlow: "APPLICATION", formTemplateId: null, pageProfileId: null }));
    expect(v.valid).toBe(true);
    expect(v.warnings.some((w) => w.includes("Form Şablonu"))).toBe(true);
  });

  it("APPLICATION with both IDs → valid with no warnings about template", () => {
    const v = validateCtaConfig(makeProduct({ ctaFlow: "APPLICATION", formTemplateId: "t", pageProfileId: "p" }));
    expect(v.valid).toBe(true);
    expect(v.warnings.some((w) => w.includes("Form Şablonu"))).toBe(false);
  });

  it("FIXED pricePresentation with price=0 → warning (not error)", () => {
    const v = validateCtaConfig(makeProduct({ pricePresentation: "FIXED", price: 0, ctaFlow: "FREE_ENROLLMENT" }));
    expect(v.warnings.some((w) => w.includes("FIXED"))).toBe(true);
  });

  it("FREE_ENROLLMENT with price=0 → valid", () => {
    const v = validateCtaConfig(makeProduct({ ctaFlow: "FREE_ENROLLMENT", pricePresentation: "FREE", price: 0 }));
    expect(v.valid).toBe(true);
    expect(v.errors).toHaveLength(0);
  });
});
