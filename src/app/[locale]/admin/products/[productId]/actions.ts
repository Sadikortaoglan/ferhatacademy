"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";
import { CtaFlow, PricePresentation, PurchaseMode } from "@prisma/client";

// ctaFlow → purchaseMode sync map
const CTA_TO_PURCHASE_MODE: Record<CtaFlow, PurchaseMode> = {
  INFO_ONLY:               "INVITE_ONLY",
  APPLICATION:             "APPLICATION_REQUIRED",
  DIRECT_PURCHASE:         "DIRECT_PURCHASE",
  APPLICATION_THEN_PURCHASE: "APPLICATION_REQUIRED_BEFORE_PURCHASE",
  FREE_ENROLLMENT:         "DIRECT_PURCHASE",
};

export async function updateProductSalesConfig(
  locale: string,
  productId: string,
  data: {
    pricePresentation: PricePresentation;
    ctaFlow: CtaFlow;
    price: number;
    primaryCtaLabelTr: string | null;
    primaryCtaLabelEn: string | null;
    secondaryCtaLabelTr: string | null;
    secondaryCtaLabelEn: string | null;
  }
) {
  await requireAdmin(locale);
  await prisma.product.update({
    where: { id: productId },
    data: {
      pricePresentation: data.pricePresentation,
      ctaFlow: data.ctaFlow,
      price: data.price,
      purchaseMode: CTA_TO_PURCHASE_MODE[data.ctaFlow],
      primaryCtaLabelTr: data.primaryCtaLabelTr,
      primaryCtaLabelEn: data.primaryCtaLabelEn,
      secondaryCtaLabelTr: data.secondaryCtaLabelTr,
      secondaryCtaLabelEn: data.secondaryCtaLabelEn,
    },
  });
  revalidatePath(`/${locale}/admin/products/${productId}`);
  revalidatePath(`/${locale}/products`);
  return { ok: true };
}

export async function updateProductApplicationConfig(
  locale: string,
  productId: string,
  data: { formTemplateId: string | null; pageProfileId: string | null }
) {
  await requireAdmin(locale);
  await prisma.product.update({
    where: { id: productId },
    data: {
      formTemplateId: data.formTemplateId || null,
      pageProfileId: data.pageProfileId || null,
    },
  });
  revalidatePath(`/${locale}/admin/products/${productId}`);
  return { ok: true };
}

export async function updateProductContent(
  locale: string,
  productId: string,
  data: {
    translations: {
      locale: string;
      name: string;
      shortDescription: string | null;
      description: string | null;
      seoTitle: string | null;
      seoDescription: string | null;
    }[];
    slug?: string;
    coverImageUrl?: string | null;
  }
) {
  await requireAdmin(locale);
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId }, select: { status: true } });

  // Slug safety: only allow slug update for DRAFT products
  const slugUpdate = data.slug?.trim() && product.status === "DRAFT" ? { slug: data.slug.trim() } : {};

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: { ...slugUpdate, coverImageUrl: data.coverImageUrl },
    });
    for (const t of data.translations) {
      if (!t.name.trim()) continue;
      await tx.productTranslation.upsert({
        where: { productId_locale: { productId, locale: t.locale } },
        update: {
          name: t.name.trim(),
          shortDescription: t.shortDescription?.trim() || null,
          description: t.description?.trim() || null,
          seoTitle: t.seoTitle?.trim() || null,
          seoDescription: t.seoDescription?.trim() || null,
        },
        create: {
          productId,
          locale: t.locale,
          name: t.name.trim(),
          shortDescription: t.shortDescription?.trim() || null,
          description: t.description?.trim() || null,
          seoTitle: t.seoTitle?.trim() || null,
          seoDescription: t.seoDescription?.trim() || null,
        },
      });
    }
  });

  revalidatePath(`/${locale}/admin/products/${productId}`);
  revalidatePath(`/${locale}/products`);
  return { ok: true as const };
}

export async function archiveProductById(locale: string, productId: string) {
  await requireAdmin(locale);
  await prisma.product.update({ where: { id: productId }, data: { status: "ARCHIVED" } });
  revalidatePath(`/${locale}/admin/products/${productId}`);
  revalidatePath(`/${locale}/admin/products`);
  return { ok: true as const };
}

export async function deleteProductById(locale: string, productId: string) {
  await requireAdmin(locale);

  try {
    await prisma.$transaction(async (tx) => {
      const [orderCount, applicationCount] = await Promise.all([
        tx.orderItem.count({ where: { productId } }),
        tx.application.count({ where: { productId } }),
      ]);
      if (orderCount > 0 || applicationCount > 0) {
        throw Object.assign(new Error("DEPENDENCY_EXISTS"), {
          orderCount,
          applicationCount,
        });
      }
      await tx.product.delete({ where: { id: productId } });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "DEPENDENCY_EXISTS") {
      const e = err as Error & { orderCount: number; applicationCount: number };
      return {
        ok: false as const,
        reason: `Bu ürün silinemez: ${e.orderCount} sipariş kalemi ve ${e.applicationCount} başvuru bağlı.`,
      };
    }
    throw err;
  }

  redirect(`/${locale}/admin/products`);
}
