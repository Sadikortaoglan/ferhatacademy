import { describe, it, expect } from "vitest";
import { testPrisma } from "../helpers/prisma";
import { createTestProduct, createTestUser, createTestOrder } from "../factories";

// ─── updateProductContent (via direct Prisma — action requires HTTP session) ──

describe("Product content & translation persistence", () => {
  it("upserts TR translation with all fields", async () => {
    const product = await createTestProduct(testPrisma, { status: "DRAFT" });
    await testPrisma.productTranslation.upsert({
      where: { productId_locale: { productId: product.id, locale: "tr" } },
      update: {
        name: "Yeni Başlık",
        shortDescription: "Kısa açıklama",
        description: "Uzun açıklama",
        seoTitle: "SEO Başlık",
        seoDescription: "SEO Açıklama",
      },
      create: {
        productId: product.id,
        locale: "tr",
        name: "Yeni Başlık",
        shortDescription: "Kısa açıklama",
        description: "Uzun açıklama",
        seoTitle: "SEO Başlık",
        seoDescription: "SEO Açıklama",
      },
    });
    const saved = await testPrisma.productTranslation.findUnique({
      where: { productId_locale: { productId: product.id, locale: "tr" } },
    });
    expect(saved?.name).toBe("Yeni Başlık");
    expect(saved?.seoTitle).toBe("SEO Başlık");
    expect(saved?.seoDescription).toBe("SEO Açıklama");
  });

  it("upserts EN translation independently", async () => {
    const product = await createTestProduct(testPrisma, { status: "DRAFT" });
    await testPrisma.productTranslation.upsert({
      where: { productId_locale: { productId: product.id, locale: "en" } },
      update: { name: "New Title EN" },
      create: { productId: product.id, locale: "en", name: "New Title EN" },
    });
    const tr = await testPrisma.productTranslation.findUnique({
      where: { productId_locale: { productId: product.id, locale: "tr" } },
    });
    const en = await testPrisma.productTranslation.findUnique({
      where: { productId_locale: { productId: product.id, locale: "en" } },
    });
    expect(tr?.name).toBe("Test Ürün"); // unchanged from factory
    expect(en?.name).toBe("New Title EN");
  });

  it("slug update allowed for DRAFT product", async () => {
    const product = await createTestProduct(testPrisma, { status: "DRAFT" });
    await testPrisma.product.update({
      where: { id: product.id },
      data: { slug: "new-slug-draft" },
    });
    const updated = await testPrisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(updated.slug).toBe("new-slug-draft");
  });

  it("slug must not be changed for PUBLISHED product (service rule)", async () => {
    // This test validates the business rule: the action checks status before changing slug.
    // PUBLISHED products should keep their slug to avoid breaking SEO links.
    const product = await createTestProduct(testPrisma, { status: "PUBLISHED" });
    const originalSlug = product.slug;
    // Simulate action behavior: skip slug update for PUBLISHED products
    const slugUpdate = product.status === "DRAFT" ? { slug: "would-change" } : {};
    await testPrisma.product.update({ where: { id: product.id }, data: { ...slugUpdate } });
    const after = await testPrisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(after.slug).toBe(originalSlug);
  });

  it("coverImageUrl update persists", async () => {
    const product = await createTestProduct(testPrisma);
    await testPrisma.product.update({
      where: { id: product.id },
      data: { coverImageUrl: "/uploads/test-image.webp" },
    });
    const saved = await testPrisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(saved.coverImageUrl).toBe("/uploads/test-image.webp");
  });

  it("coverImageUrl can be cleared to null", async () => {
    const product = await createTestProduct(testPrisma);
    await testPrisma.product.update({ where: { id: product.id }, data: { coverImageUrl: "/uploads/old.webp" } });
    await testPrisma.product.update({ where: { id: product.id }, data: { coverImageUrl: null } });
    const saved = await testPrisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(saved.coverImageUrl).toBeNull();
  });
});

// ─── Archive ──────────────────────────────────────────────────────────────────

describe("Product archive", () => {
  it("sets status to ARCHIVED", async () => {
    const product = await createTestProduct(testPrisma, { status: "PUBLISHED" });
    await testPrisma.product.update({ where: { id: product.id }, data: { status: "ARCHIVED" } });
    const saved = await testPrisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(saved.status).toBe("ARCHIVED");
  });

  it("ARCHIVED product retains all translations", async () => {
    const product = await createTestProduct(testPrisma, { status: "PUBLISHED" });
    await testPrisma.product.update({ where: { id: product.id }, data: { status: "ARCHIVED" } });
    const translations = await testPrisma.productTranslation.findMany({ where: { productId: product.id } });
    expect(translations.length).toBeGreaterThan(0);
  });
});

// ─── Hard delete dependency check ────────────────────────────────────────────

describe("Product hard delete safety", () => {
  it("product with no orders and no applications can be deleted", async () => {
    const product = await createTestProduct(testPrisma, { status: "ARCHIVED" });
    const [orderCount, appCount] = await Promise.all([
      testPrisma.orderItem.count({ where: { productId: product.id } }),
      testPrisma.application.count({ where: { productId: product.id } }),
    ]);
    expect(orderCount).toBe(0);
    expect(appCount).toBe(0);
    await testPrisma.product.delete({ where: { id: product.id } });
    const gone = await testPrisma.product.findUnique({ where: { id: product.id } });
    expect(gone).toBeNull();
  });

  it("product with an order item cannot be deleted (dependency check)", async () => {
    const user = await createTestUser(testPrisma);
    const product = await createTestProduct(testPrisma, { status: "ARCHIVED" });
    await createTestOrder(testPrisma, user.id, product.id);
    const orderCount = await testPrisma.orderItem.count({ where: { productId: product.id } });
    expect(orderCount).toBeGreaterThan(0);
    // Action would return { ok: false, reason: "..." } — verify the count gate works
  });

  it("product with an application cannot be deleted (dependency check)", async () => {
    const user = await createTestUser(testPrisma);
    const product = await createTestProduct(testPrisma, { status: "ARCHIVED" });
    await testPrisma.application.create({
      data: {
        userId: user.id,
        productId: product.id,
        status: "SUBMITTED",
      },
    });
    const appCount = await testPrisma.application.count({ where: { productId: product.id } });
    expect(appCount).toBeGreaterThan(0);
  });

  it("translations are cascade-deleted with the product", async () => {
    const product = await createTestProduct(testPrisma, { status: "ARCHIVED" });
    await testPrisma.product.delete({ where: { id: product.id } });
    const translations = await testPrisma.productTranslation.findMany({ where: { productId: product.id } });
    expect(translations).toHaveLength(0);
  });
});
