import { describe, it, expect } from "vitest";
import { testPrisma } from "../helpers/prisma";
import { createTestProduct } from "../factories";
import { resolveProductCta, validateCtaConfig } from "@/server/product-cta";
import { CtaFlow, PricePresentation } from "@prisma/client";

// ─── Persistence ─────────────────────────────────────────────────────────────

describe("Product pricePresentation + ctaFlow persistence", () => {
  it("saves HIDDEN + INFO_ONLY and reads them back", async () => {
    const product = await createTestProduct(testPrisma, { price: 0 });
    await testPrisma.product.update({
      where: { id: product.id },
      data: {
        pricePresentation: "HIDDEN",
        ctaFlow: "INFO_ONLY",
        primaryCtaLabelTr: "Ücretsiz Bilgi Al",
        primaryCtaLabelEn: "Get Free Info",
      },
    });
    const saved = await testPrisma.product.findUnique({ where: { id: product.id } });
    expect(saved?.pricePresentation).toBe("HIDDEN");
    expect(saved?.ctaFlow).toBe("INFO_ONLY");
    expect(saved?.primaryCtaLabelTr).toBe("Ücretsiz Bilgi Al");
  });

  it("saves FIXED + DIRECT_PURCHASE with price", async () => {
    const product = await createTestProduct(testPrisma, { price: 2499900 });
    await testPrisma.product.update({
      where: { id: product.id },
      data: { pricePresentation: "FIXED", ctaFlow: "DIRECT_PURCHASE" },
    });
    const saved = await testPrisma.product.findUnique({ where: { id: product.id } });
    expect(saved?.pricePresentation).toBe("FIXED");
    expect(saved?.price).toBe(2499900);
  });

  it("saves APPLICATION_THEN_PURCHASE", async () => {
    const product = await createTestProduct(testPrisma, { price: 1499900 });
    await testPrisma.product.update({
      where: { id: product.id },
      data: {
        pricePresentation: "FIXED",
        ctaFlow: "APPLICATION_THEN_PURCHASE",
        purchaseMode: "APPLICATION_REQUIRED_BEFORE_PURCHASE",
      },
    });
    const saved = await testPrisma.product.findUnique({ where: { id: product.id } });
    expect(saved?.ctaFlow).toBe("APPLICATION_THEN_PURCHASE");
    expect(saved?.purchaseMode).toBe("APPLICATION_REQUIRED_BEFORE_PURCHASE");
  });

  it("FREE + FREE_ENROLLMENT — price 0 stays 0", async () => {
    const product = await createTestProduct(testPrisma, { price: 0 });
    await testPrisma.product.update({
      where: { id: product.id },
      data: { pricePresentation: "FREE", ctaFlow: "FREE_ENROLLMENT", price: 0 },
    });
    const saved = await testPrisma.product.findUnique({ where: { id: product.id } });
    expect(saved?.pricePresentation).toBe("FREE");
    expect(saved?.price).toBe(0);
  });
});

// ─── Resolver against DB values ───────────────────────────────────────────────

describe("resolveProductCta with DB-sourced product", () => {
  it("HIDDEN price config resolves to null priceLabel", async () => {
    const product = await createTestProduct(testPrisma, { price: 2499900 });
    await testPrisma.product.update({
      where: { id: product.id },
      data: { pricePresentation: "HIDDEN" as PricePresentation, ctaFlow: "INFO_ONLY" as CtaFlow },
    });
    const saved = await testPrisma.product.findUniqueOrThrow({ where: { id: product.id } });
    const result = resolveProductCta(saved, "NOT_LOGGED_IN", "tr");
    expect(result.priceLabel).toBeNull();
    expect(result.primaryCta?.href).toContain("/randevu");
  });

  it("FIXED price config resolves to formatted price", async () => {
    const product = await createTestProduct(testPrisma, { price: 499900 });
    await testPrisma.product.update({
      where: { id: product.id },
      data: { pricePresentation: "FIXED" as PricePresentation, ctaFlow: "DIRECT_PURCHASE" as CtaFlow },
    });
    const saved = await testPrisma.product.findUniqueOrThrow({ where: { id: product.id } });
    const result = resolveProductCta(saved, "CAN_PURCHASE", "tr");
    expect(result.priceLabel).toContain("4.999");
    expect(result.primaryCta?.href).toContain("/checkout");
  });
});

// ─── Default field values for existing products ────────────────────────────────

describe("backward compatibility defaults", () => {
  it("new product has FIXED + DIRECT_PURCHASE by default", async () => {
    const product = await createTestProduct(testPrisma, { price: 10000 });
    expect(product.pricePresentation).toBe("FIXED");
    expect(product.ctaFlow).toBe("DIRECT_PURCHASE");
  });

  it("price=0 product factory test (FREE_ENROLLMENT after migration script)", async () => {
    // New products with price=0 still get FIXED default from schema
    // The migration script is a one-time operation; new products need explicit config
    const product = await createTestProduct(testPrisma, { price: 0 });
    const v = validateCtaConfig({ ...product, formTemplateId: null, pageProfileId: null, linkedCourseId: null });
    // FIXED + price=0 → warning (not error) for non-FREE_ENROLLMENT flow
    // DIRECT_PURCHASE + price=0 → error
    expect(v.errors.some((e) => e.includes("Direkt"))).toBe(true);
  });
});
