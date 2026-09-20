import { prisma } from "@/lib/prisma";
import { createAuditLog } from "./audit";

export function formatOrderReference(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `FA-${year}-${rand}`;
}

export function formatPrice(amountMinor: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}

// Materialize ProductGrants into Entitlements after payment approval
// IDEMPOTENT: will not create duplicate entitlements
export async function materializeProductGrants(orderId: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { include: { grants: true } } } },
      },
    });
    if (!order) throw new Error("Order not found");
    if (order.status === "PAID") return;

    const now = new Date();
    const userId = order.userId;

    for (const item of order.items) {
      if (!item.product) continue;
      for (const grant of item.product.grants) {
        if (!grant.resourceId) continue;
        const resourceType = grant.grantType === "COURSE_ACCESS" ? "COURSE" as const : "LESSON" as const;
        const existing = await tx.entitlement.findFirst({
          where: {
            userId,
            resourceType,
            resourceId: grant.resourceId,
            sourceType: "ORDER",
            sourceReferenceId: orderId,
          },
        });
        if (existing) continue;

        await tx.entitlement.create({
          data: {
            userId,
            resourceType,
            resourceId: grant.resourceId,
            sourceType: "ORDER",
            sourceReferenceId: orderId,
            createdById: actorId,
          },
        });
        await createAuditLog({
          action: "ENTITLEMENT_CREATED_FROM_ORDER",
          actorId,
          targetId: userId,
          targetType: "User",
          metadata: { orderId, grantType: grant.grantType, resourceId: grant.resourceId },
        });
      }
    }

    await tx.order.update({ where: { id: orderId }, data: { status: "PAID", paidAt: now } });
    await createAuditLog({ action: "ORDER_MARKED_PAID", actorId, targetId: orderId, targetType: "Order" });
  });
}

export async function getProductAccessState(
  productId: string,
  userId: string | null
): Promise<"NOT_LOGGED_IN" | "NO_APPLICATION" | "APPLICATION_SUBMITTED" | "APPLICATION_APPROVED" | "PAYMENT_PENDING" | "ENTITLED" | "CAN_PURCHASE"> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { grants: true },
  });
  if (!product) return "NOT_LOGGED_IN";
  if (!userId) return "NOT_LOGGED_IN";

  const now = new Date();
  for (const grant of product.grants) {
    if (!grant.resourceId) continue;
    const resourceType = grant.grantType === "COURSE_ACCESS" ? "COURSE" as const : "LESSON" as const;
    const entitlement = await prisma.entitlement.findFirst({
      where: {
        userId,
        resourceType,
        resourceId: grant.resourceId,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
    if (entitlement) return "ENTITLED";
  }

  const pendingOrder = await prisma.order.findFirst({
    where: { userId, status: { in: ["PENDING_PAYMENT", "PAYMENT_REVIEW"] }, items: { some: { productId } } },
  });
  if (pendingOrder) return "PAYMENT_PENDING";

  if (product.purchaseMode === "APPLICATION_REQUIRED" || product.purchaseMode === "APPLICATION_REQUIRED_BEFORE_PURCHASE") {
    const application = await prisma.application.findUnique({ where: { userId_productId: { userId, productId } } });
    if (!application) return "NO_APPLICATION";
    if (application.status === "APPROVED") return "APPLICATION_APPROVED";
    return "APPLICATION_SUBMITTED";
  }

  return "CAN_PURCHASE";
}
