"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";

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
