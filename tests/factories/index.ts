import { PrismaClient } from "@prisma/client";
import type { User, Course, Lesson, Module, Product } from "@prisma/client";

// All factories accept a prisma client so they work with any isolated test DB.

export async function createTestUser(
  prisma: PrismaClient,
  overrides: Partial<{
    email: string;
    name: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
    banned: boolean;
    password: string;
  }> = {}
): Promise<User> {
  const id = `user_${Math.random().toString(36).slice(2)}`;
  return prisma.user.create({
    data: {
      id,
      email: overrides.email ?? `${id}@test.com`,
      name: overrides.name ?? "Test User",
      emailVerified: true,
      role: overrides.role ?? "USER",
      banned: overrides.banned ?? false,
    },
  });
}

export async function createTestAdmin(prisma: PrismaClient, overrides: Partial<{ email: string; name: string }> = {}): Promise<User> {
  return createTestUser(prisma, { role: "ADMIN", name: "Test Admin", ...overrides });
}

export async function createTestCourse(
  prisma: PrismaClient,
  overrides: Partial<{ titleTr: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }> = {}
): Promise<Course> {
  const id = `course_${Math.random().toString(36).slice(2)}`;
  return prisma.course.create({
    data: {
      id,
      slug: id,
      status: overrides.status ?? "PUBLISHED",
      translations: {
        create: [
          { locale: "tr", title: overrides.titleTr ?? "Test Kursu" },
          { locale: "en", title: "Test Course" },
        ],
      },
    },
  });
}

export async function createTestModule(
  prisma: PrismaClient,
  courseId: string,
  position = 1
): Promise<Module> {
  const id = `module_${Math.random().toString(36).slice(2)}`;
  return prisma.module.create({
    data: {
      id,
      courseId,
      position,
      translations: { create: [{ locale: "tr", title: "Modül" }, { locale: "en", title: "Module" }] },
    },
  });
}

export async function createTestLesson(
  prisma: PrismaClient,
  moduleId: string,
  overrides: Partial<{
    visibility: "PUBLIC" | "REGISTERED" | "ENTITLED" | "PRIVATE";
    isPreview: boolean;
    position: number;
  }> = {}
): Promise<Lesson> {
  const id = `lesson_${Math.random().toString(36).slice(2)}`;
  return prisma.lesson.create({
    data: {
      id,
      moduleId,
      type: "VIDEO",
      position: overrides.position ?? 1,
      visibility: overrides.visibility ?? "ENTITLED",
      isPreview: overrides.isPreview ?? false,
      translations: { create: [{ locale: "tr", title: "Test Dersi" }, { locale: "en", title: "Test Lesson" }] },
    },
  });
}

export async function createTestEntitlement(
  prisma: PrismaClient,
  userId: string,
  courseId: string,
  adminId: string,
  overrides: Partial<{
    expiresAt: Date | null;
    revokedAt: Date | null;
    startsAt: Date | null;
    sourceType: "MANUAL" | "ORDER";
    sourceReferenceId: string;
  }> = {}
) {
  return prisma.entitlement.create({
    data: {
      userId,
      resourceType: "COURSE",
      resourceId: courseId,
      sourceType: overrides.sourceType ?? "MANUAL",
      sourceReferenceId: overrides.sourceReferenceId,
      createdById: adminId,
      expiresAt: overrides.expiresAt !== undefined ? overrides.expiresAt : null,
      revokedAt: overrides.revokedAt !== undefined ? overrides.revokedAt : null,
      startsAt: overrides.startsAt !== undefined ? overrides.startsAt : null,
    },
  });
}

export async function createTestProduct(
  prisma: PrismaClient,
  overrides: Partial<{
    price: number;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    purchaseMode: "DIRECT_PURCHASE" | "APPLICATION_REQUIRED";
  }> = {}
): Promise<Product> {
  const id = `product_${Math.random().toString(36).slice(2)}`;
  return prisma.product.create({
    data: {
      id,
      slug: id,
      type: "COURSE",
      status: overrides.status ?? "PUBLISHED",
      purchaseMode: overrides.purchaseMode ?? "DIRECT_PURCHASE",
      price: overrides.price ?? 10000,
      currency: "TRY",
      translations: {
        create: [
          { locale: "tr", name: "Test Ürün" },
          { locale: "en", name: "Test Product" },
        ],
      },
    },
  });
}

export async function createTestOrder(
  prisma: PrismaClient,
  userId: string,
  productId: string,
  status: "PENDING_PAYMENT" | "PAYMENT_REVIEW" | "PAID" = "PENDING_PAYMENT"
) {
  const ref = `FA-TEST-${Math.random().toString(36).slice(2).toUpperCase()}`;
  return prisma.order.create({
    data: {
      reference: ref,
      userId,
      status,
      totalAmount: 10000,
      currency: "TRY",
      items: {
        create: [{
          productId,
          productNameSnapshot: "Test Ürün",
          productTypeSnapshot: "COURSE",
          unitPrice: 10000,
          currency: "TRY",
        }],
      },
    },
  });
}
