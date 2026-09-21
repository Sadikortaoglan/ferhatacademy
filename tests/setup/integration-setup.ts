import { afterEach } from "vitest";
import { testPrisma } from "../helpers/prisma";

// Clean all tables between tests for isolation
afterEach(async () => {
  await testPrisma.$transaction([
    testPrisma.auditLog.deleteMany(),
    testPrisma.lessonProgress.deleteMany(),
    testPrisma.assignmentItem.deleteMany(),
    testPrisma.assignment.deleteMany(),
    testPrisma.entitlement.deleteMany(),
    testPrisma.payment.deleteMany(),
    testPrisma.orderItem.deleteMany(),
    testPrisma.order.deleteMany(),
    testPrisma.application.deleteMany(),
    testPrisma.productGrant.deleteMany(),
    testPrisma.productInclusion.deleteMany(),
    testPrisma.productTranslation.deleteMany(),
    testPrisma.product.deleteMany(),
    testPrisma.lessonTranslation.deleteMany(),
    testPrisma.lesson.deleteMany(),
    testPrisma.moduleTranslation.deleteMany(),
    testPrisma.module.deleteMany(),
    testPrisma.courseTranslation.deleteMany(),
    testPrisma.course.deleteMany(),
    testPrisma.session.deleteMany(),
    testPrisma.account.deleteMany(),
    testPrisma.user.deleteMany(),
  ]);
});
