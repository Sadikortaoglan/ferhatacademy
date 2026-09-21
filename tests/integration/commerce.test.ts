import { describe, it, expect } from "vitest";
import { testPrisma } from "../helpers/prisma";
import {
  createTestUser,
  createTestAdmin,
  createTestCourse,
  createTestProduct,
  createTestOrder,
} from "../factories";
import { materializeProductGrants } from "@/server/commerce";

async function setupProductWithCourseGrant(adminId: string) {
  const course = await createTestCourse(testPrisma);
  const product = await createTestProduct(testPrisma);
  await testPrisma.productGrant.create({
    data: {
      productId: product.id,
      grantType: "COURSE_ACCESS",
      resourceId: course.id,
    },
  });
  return { course, product };
}

describe("materializeProductGrants", () => {
  it("creates an entitlement and marks order PAID on approval", async () => {
    const admin = await createTestAdmin(testPrisma);
    const user = await createTestUser(testPrisma);
    const { course, product } = await setupProductWithCourseGrant(admin.id);
    const order = await createTestOrder(testPrisma, user.id, product.id, "PENDING_PAYMENT");

    await materializeProductGrants(order.id, admin.id);

    const entitlements = await testPrisma.entitlement.findMany({
      where: { userId: user.id, resourceId: course.id },
    });
    expect(entitlements).toHaveLength(1);
    expect(entitlements[0].sourceType).toBe("ORDER");
    expect(entitlements[0].sourceReferenceId).toBe(order.id);

    const updatedOrder = await testPrisma.order.findUnique({ where: { id: order.id } });
    expect(updatedOrder?.status).toBe("PAID");
    expect(updatedOrder?.paidAt).not.toBeNull();
  });

  it("does NOT create duplicate entitlements when payment approval is retried (idempotency)", async () => {
    const admin = await createTestAdmin(testPrisma);
    const user = await createTestUser(testPrisma);
    const { product } = await setupProductWithCourseGrant(admin.id);
    const order = await createTestOrder(testPrisma, user.id, product.id, "PENDING_PAYMENT");

    // Call materializeProductGrants twice
    await materializeProductGrants(order.id, admin.id);
    // Second call: order is now PAID, so it should bail out early
    await materializeProductGrants(order.id, admin.id);

    const entitlements = await testPrisma.entitlement.findMany({
      where: { userId: user.id, sourceReferenceId: order.id },
    });
    expect(entitlements).toHaveLength(1);
  });

  it("records ENTITLEMENT_CREATED_FROM_ORDER and ORDER_MARKED_PAID audit logs", async () => {
    const admin = await createTestAdmin(testPrisma);
    const user = await createTestUser(testPrisma);
    const { product } = await setupProductWithCourseGrant(admin.id);
    const order = await createTestOrder(testPrisma, user.id, product.id, "PENDING_PAYMENT");

    await materializeProductGrants(order.id, admin.id);

    const entitlementLog = await testPrisma.auditLog.findFirst({
      where: { action: "ENTITLEMENT_CREATED_FROM_ORDER", actorId: admin.id },
    });
    expect(entitlementLog).not.toBeNull();

    const paidLog = await testPrisma.auditLog.findFirst({
      where: { action: "ORDER_MARKED_PAID", targetId: order.id },
    });
    expect(paidLog).not.toBeNull();
  });

  it("throws when order does not exist", async () => {
    const admin = await createTestAdmin(testPrisma);
    await expect(materializeProductGrants("nonexistent-order", admin.id)).rejects.toThrow("Order not found");
  });
});
