"use server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { createAuditLog } from "@/server/audit";
import { materializeProductGrants, formatOrderReference, formatPrice } from "@/server/commerce";
import { revalidatePath } from "next/cache";
import {
  sendPaymentReceivedToCustomer,
  sendPaymentNotificationToAdmin,
  sendPaymentApprovedToCustomer,
} from "@/lib/email";

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

async function requireAdminUser() {
  const user = await getSessionUser();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) throw new Error("Unauthorized");
  return dbUser;
}

export async function createOrder(productId: string, locale: string) {
  const sessionUser = await getSessionUser();
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { translations: true, grants: true },
  });
  if (!product || product.status !== "PUBLISHED") throw new Error("Product not available");

  if (product.purchaseMode === "APPLICATION_REQUIRED_BEFORE_PURCHASE") {
    const app = await prisma.application.findUnique({ where: { userId_productId: { userId: sessionUser.id, productId } } });
    if (!app || app.status !== "APPROVED") throw new Error("Application approval required");
  }

  const existing = await prisma.order.findFirst({
    where: { userId: sessionUser.id, status: { in: ["PENDING_PAYMENT", "PAYMENT_REVIEW"] }, items: { some: { productId } } },
  });
  if (existing) return existing;

  const translation = product.translations.find((t) => t.locale === locale) ?? product.translations[0];
  const reference = formatOrderReference();

  const order = await prisma.order.create({
    data: {
      reference,
      userId: sessionUser.id,
      status: "PENDING_PAYMENT",
      totalAmount: product.price,
      currency: product.currency,
      items: {
        create: [{
          productId: product.id,
          productNameSnapshot: translation?.name ?? product.slug,
          productTypeSnapshot: product.type,
          unitPrice: product.price,
          quantity: 1,
          currency: product.currency,
        }],
      },
    },
  });
  await createAuditLog({ action: "ORDER_CREATED", actorId: sessionUser.id, targetId: order.id, targetType: "Order" });
  return order;
}

export async function enrollFree(productId: string) {
  const sessionUser = await getSessionUser();
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { grants: true, translations: true } });
  if (!product || product.price !== 0) throw new Error("Not a free product");

  const translation = product.translations[0];
  const reference = formatOrderReference();

  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        reference,
        userId: sessionUser.id,
        status: "PAID",
        totalAmount: 0,
        currency: product.currency,
        paidAt: new Date(),
        items: {
          create: [{ productId, productNameSnapshot: translation?.name ?? "", productTypeSnapshot: product.type, unitPrice: 0, quantity: 1, currency: product.currency }],
        },
      },
    });
    await tx.payment.create({
      data: { orderId: o.id, method: "ADMIN_MANUAL", status: "APPROVED", amount: 0, currency: product.currency, approvedAt: new Date(), approvedById: sessionUser.id },
    });
    return o;
  });

  await materializeProductGrants(order.id, sessionUser.id);
  revalidatePath("/[locale]/dashboard/courses", "page");
  return order;
}

export async function reportPayment(orderId: string, data: { method: string; transferReference?: string; userNote?: string }) {
  const sessionUser = await getSessionUser();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== sessionUser.id) throw new Error("Order not found");

  const payment = await prisma.payment.create({
    data: {
      orderId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      method: data.method as any,
      status: "REPORTED",
      amount: order.totalAmount,
      currency: order.currency,
      transferReference: data.transferReference,
      userNote: data.userNote,
      reportedAt: new Date(),
    },
  });
  await prisma.order.update({ where: { id: orderId }, data: { status: "PAYMENT_REVIEW" } });
  await createAuditLog({ action: "PAYMENT_REPORTED", actorId: sessionUser.id, targetId: payment.id, targetType: "Payment" });
  revalidatePath("/[locale]/dashboard/purchases", "page");

  // Mail bildirimleri (hata olursa sessizce geç)
  try {
    const orderWithItems = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { take: 1 }, user: true },
    });
    if (orderWithItems) {
      const productName = orderWithItems.items[0]?.productNameSnapshot ?? "";
      const amountStr = formatPrice(orderWithItems.totalAmount, orderWithItems.currency, "tr");
      await Promise.all([
        sendPaymentReceivedToCustomer({
          to: orderWithItems.user.email,
          name: orderWithItems.user.name ?? "",
          orderReference: orderWithItems.reference,
          productName,
          amount: amountStr,
          locale: "tr",
        }),
        sendPaymentNotificationToAdmin({
          customerName: orderWithItems.user.name ?? "",
          customerEmail: orderWithItems.user.email,
          orderReference: orderWithItems.reference,
          productName,
          amount: amountStr,
        }),
      ]);
    }
  } catch {
    // Mail hatası işlemi engellemesin
  }
}

export async function adminApprovePayment(paymentId: string) {
  const admin = await requireAdminUser();
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error("Payment not found");
  if (payment.status === "APPROVED") return;

  await prisma.payment.update({ where: { id: paymentId }, data: { status: "APPROVED", approvedAt: new Date(), approvedById: admin.id } });
  await createAuditLog({ action: "PAYMENT_APPROVED", actorId: admin.id, targetId: paymentId, targetType: "Payment" });
  await materializeProductGrants(payment.orderId, admin.id);
  revalidatePath("/[locale]/admin/payments", "page");
  revalidatePath("/[locale]/admin/orders", "page");

  // Müşteriye onay maili (hata olursa sessizce geç)
  try {
    const order = await prisma.order.findUnique({
      where: { id: payment.orderId },
      include: { items: { take: 1 }, user: true },
    });
    if (order) {
      await sendPaymentApprovedToCustomer({
        to: order.user.email,
        name: order.user.name ?? "",
        orderReference: order.reference,
        productName: order.items[0]?.productNameSnapshot ?? "",
        locale: "tr",
      });
    }
  } catch {
    // Mail hatası işlemi engellemesin
  }
}

export async function adminRejectPayment(paymentId: string, note: string) {
  const admin = await requireAdminUser();
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error("Payment not found");
  await prisma.payment.update({ where: { id: paymentId }, data: { status: "REJECTED", adminNote: note, rejectedAt: new Date() } });
  await prisma.order.update({ where: { id: payment.orderId }, data: { status: "PENDING_PAYMENT" } });
  await createAuditLog({ action: "PAYMENT_REJECTED", actorId: admin.id, targetId: paymentId, targetType: "Payment" });
  revalidatePath("/[locale]/admin/payments", "page");
}

export async function adminRecordManualPayment(orderId: string, data: { method: string; amount: number; adminNote: string }) {
  const admin = await requireAdminUser();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  const payment = await prisma.payment.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { orderId, method: data.method as any, status: "APPROVED", amount: data.amount, currency: order.currency, adminNote: data.adminNote, approvedAt: new Date(), approvedById: admin.id },
  });
  await createAuditLog({ action: "PAYMENT_APPROVED", actorId: admin.id, targetId: payment.id, targetType: "Payment", metadata: { manual: true, note: data.adminNote } });
  await materializeProductGrants(orderId, admin.id);
  revalidatePath("/[locale]/admin/orders", "page");
}
