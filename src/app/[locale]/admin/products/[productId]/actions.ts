"use server";

import { revalidatePath } from "next/cache";
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
