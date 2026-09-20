"use server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { createAuditLog } from "@/server/audit";
import { z } from "zod";
import { revalidatePath } from "next/cache";

async function requireAdminUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) throw new Error("Unauthorized");
  return dbUser;
}

const productSchema = z.object({
  slug: z.string().min(1),
  type: z.string(),
  purchaseMode: z.string(),
  price: z.number().int().min(0),
  compareAtPrice: z.number().int().min(0).optional().nullable(),
  currency: z.string().default("TRY"),
  coverImageUrl: z.string().optional().nullable(),
  linkedCourseId: z.string().optional().nullable(),
  nameTr: z.string().min(1),
  nameEn: z.string().optional(),
  shortDescriptionTr: z.string().optional(),
  shortDescriptionEn: z.string().optional(),
  descriptionTr: z.string().optional(),
  descriptionEn: z.string().optional(),
});

export async function createProduct(data: unknown) {
  const admin = await requireAdminUser();
  const parsed = productSchema.parse(data);
  const product = await prisma.product.create({
    data: {
      slug: parsed.slug,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: parsed.type as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      purchaseMode: parsed.purchaseMode as any,
      price: parsed.price,
      compareAtPrice: parsed.compareAtPrice,
      currency: parsed.currency,
      coverImageUrl: parsed.coverImageUrl,
      linkedCourseId: parsed.linkedCourseId,
      translations: {
        create: [
          { locale: "tr", name: parsed.nameTr, shortDescription: parsed.shortDescriptionTr, description: parsed.descriptionTr },
          ...(parsed.nameEn ? [{ locale: "en", name: parsed.nameEn, shortDescription: parsed.shortDescriptionEn, description: parsed.descriptionEn }] : []),
        ],
      },
    },
  });
  await createAuditLog({ action: "PRODUCT_CREATED", actorId: admin.id, targetId: product.id, targetType: "Product" });
  revalidatePath("/[locale]/admin/products", "page");
  return product;
}

export async function updateProduct(id: string, data: unknown) {
  const admin = await requireAdminUser();
  const parsed = productSchema.partial().parse(data);
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        slug: parsed.slug,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: parsed.type as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        purchaseMode: parsed.purchaseMode as any,
        price: parsed.price,
        compareAtPrice: parsed.compareAtPrice,
        currency: parsed.currency,
        coverImageUrl: parsed.coverImageUrl,
        linkedCourseId: parsed.linkedCourseId,
      },
    });
    if (parsed.nameTr) {
      await tx.productTranslation.upsert({
        where: { productId_locale: { productId: id, locale: "tr" } },
        update: { name: parsed.nameTr, shortDescription: parsed.shortDescriptionTr, description: parsed.descriptionTr },
        create: { productId: id, locale: "tr", name: parsed.nameTr, shortDescription: parsed.shortDescriptionTr, description: parsed.descriptionTr },
      });
    }
    if (parsed.nameEn) {
      await tx.productTranslation.upsert({
        where: { productId_locale: { productId: id, locale: "en" } },
        update: { name: parsed.nameEn, shortDescription: parsed.shortDescriptionEn, description: parsed.descriptionEn },
        create: { productId: id, locale: "en", name: parsed.nameEn, shortDescription: parsed.shortDescriptionEn, description: parsed.descriptionEn },
      });
    }
  });
  await createAuditLog({ action: "PRODUCT_UPDATED", actorId: admin.id, targetId: id, targetType: "Product" });
  revalidatePath("/[locale]/admin/products", "page");
}

export async function publishProduct(id: string) {
  const admin = await requireAdminUser();
  await prisma.product.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  await createAuditLog({ action: "PRODUCT_PUBLISHED", actorId: admin.id, targetId: id, targetType: "Product" });
  revalidatePath("/[locale]/admin/products", "page");
}

export async function archiveProduct(id: string) {
  await requireAdminUser();
  await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
  revalidatePath("/[locale]/admin/products", "page");
}

export async function addProductGrant(productId: string, grantType: string, resourceId: string) {
  await requireAdminUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.productGrant.create({ data: { productId, grantType: grantType as any, resourceId } });
  revalidatePath(`/[locale]/admin/products/${productId}`, "page");
}

export async function removeProductGrant(grantId: string) {
  await requireAdminUser();
  await prisma.productGrant.delete({ where: { id: grantId } });
}

export async function addProductInclusion(productId: string, data: {
  type: string; titleTr: string; titleEn?: string; quantity?: number; durationMinutes?: number; position: number;
}) {
  await requireAdminUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.productInclusion.create({ data: { productId, type: data.type as any, titleTr: data.titleTr, titleEn: data.titleEn, quantity: data.quantity, durationMinutes: data.durationMinutes, position: data.position } });
}

export async function removeProductInclusion(id: string) {
  await requireAdminUser();
  await prisma.productInclusion.delete({ where: { id } });
}
