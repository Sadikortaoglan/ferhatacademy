import { afterEach } from "vitest";
import { testPrisma } from "../helpers/prisma";

// Clean all tables between tests for isolation (FK-safe order: children before parents)
afterEach(async () => {
  const deletes = [
    () => testPrisma.auditLog.deleteMany(),
    () => testPrisma.adminNotification.deleteMany(),
    () => testPrisma.lessonProgress.deleteMany(),
    () => testPrisma.assignmentItem.deleteMany(),
    () => testPrisma.assignment.deleteMany(),
    () => testPrisma.entitlement.deleteMany(),
    () => testPrisma.payment.deleteMany(),
    () => testPrisma.orderItem.deleteMany(),
    () => testPrisma.order.deleteMany(),
    () => testPrisma.applicationResponse.deleteMany(),
    () => testPrisma.application.deleteMany(),
    () => testPrisma.applicationQuestionOption.deleteMany(),
    () => testPrisma.applicationQuestion.deleteMany(),
    () => testPrisma.applicationFormStep.deleteMany(),
    () => testPrisma.applicationFormTemplate.deleteMany(),
    () => testPrisma.applicationPageBlock.deleteMany(),
    () => testPrisma.applicationPageFaqItem.deleteMany(),
    () => testPrisma.applicationPageProcessStep.deleteMany(),
    () => testPrisma.applicationPageProfile.deleteMany(),
    () => testPrisma.siteAppearance.deleteMany(),
    () => testPrisma.productGrant.deleteMany(),
    () => testPrisma.productInclusion.deleteMany(),
    () => testPrisma.productTranslation.deleteMany(),
    () => testPrisma.product.deleteMany(),
    () => testPrisma.lessonTranslation.deleteMany(),
    () => testPrisma.lesson.deleteMany(),
    () => testPrisma.moduleTranslation.deleteMany(),
    () => testPrisma.module.deleteMany(),
    () => testPrisma.courseTranslation.deleteMany(),
    () => testPrisma.course.deleteMany(),
    () => testPrisma.pageAppearanceOverride.deleteMany(),
    () => testPrisma.navItem.deleteMany(),
    () => testPrisma.session.deleteMany(),
    () => testPrisma.account.deleteMany(),
    () => testPrisma.user.deleteMany(),
  ];

  for (const del of deletes) {
    await del().catch(() => {
      // Swallow errors — we run a second pass below to catch remaining
    });
  }
  // Second pass handles any records that blocked the first pass
  for (const del of deletes) {
    await del().catch(() => {});
  }
});
