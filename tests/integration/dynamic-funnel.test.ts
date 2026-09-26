import { describe, it, expect } from "vitest";
import { testPrisma } from "../helpers/prisma";
import { createTestUser, createTestProduct } from "../factories";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createTemplateWithSteps() {
  const key = `funnel_test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return testPrisma.applicationFormTemplate.create({
    data: {
      key,
      type: "GENERAL_CUSTOM",
      nameTr: "Dinamik Funnel Şablonu",
      nameEn: "Dynamic Funnel Template",
      steps: {
        create: [
          { stableKey: "step_a", position: 0, titleTr: "Temel Bilgiler", titleEn: "Basic Info", active: true },
          { stableKey: "step_b", position: 1, titleTr: "Hedefler", titleEn: "Goals", active: true },
        ],
      },
      questions: {
        create: [
          {
            key: "experience",
            type: "SINGLE_SELECT",
            section: "CURRENT_SITUATION",
            labelTr: "Deneyim seviyeniz?",
            labelEn: "Your experience level?",
            required: true,
            active: true,
            position: 0,
            options: {
              create: [
                { key: "beginner", labelTr: "Başlangıç", labelEn: "Beginner", position: 0, active: true },
                { key: "advanced", labelTr: "İleri", labelEn: "Advanced", position: 1, active: true },
              ],
            },
          },
          {
            key: "goal",
            type: "LONG_TEXT",
            section: "GOALS",
            labelTr: "Hedefiniz nedir?",
            labelEn: "What is your goal?",
            required: true,
            active: true,
            position: 1,
          },
          {
            key: "advanced_note",
            type: "LONG_TEXT",
            section: "ADDITIONAL_INFO",
            labelTr: "İleri seviye notu",
            labelEn: "Advanced note",
            required: false,
            active: true,
            position: 2,
            conditionJson: {
              logic: "AND",
              rules: [{ field: "experience", operator: "EQUALS", value: "advanced" }],
            },
          },
        ],
      },
    },
    include: {
      steps: { orderBy: { position: "asc" } },
      questions: { include: { options: true }, orderBy: { position: "asc" } },
    },
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Dynamic Application Funnel Integration Tests", () => {
  describe("ApplicationFormTemplate with Steps", () => {
    it("creates a template with steps", async () => {
      const template = await createTemplateWithSteps();
      expect(template.steps).toHaveLength(2);
      expect(template.steps[0].titleTr).toBe("Temel Bilgiler");
      expect(template.steps[1].titleTr).toBe("Hedefler");
    });

    it("creates questions with conditionJson", async () => {
      const template = await createTemplateWithSteps();
      const conditional = template.questions.find((q) => q.key === "advanced_note");
      expect(conditional).toBeDefined();
      expect(conditional!.conditionJson).not.toBeNull();
      const cond = conditional!.conditionJson as { logic: string; rules: { field: string; operator: string; value: string }[] };
      expect(cond.logic).toBe("AND");
      expect(cond.rules).toHaveLength(1);
      expect(cond.rules[0].field).toBe("experience");
      expect(cond.rules[0].operator).toBe("EQUALS");
      expect(cond.rules[0].value).toBe("advanced");
    });

    it("assigns questions to steps", async () => {
      const template = await createTemplateWithSteps();
      const step = template.steps[0];
      const question = template.questions[0];

      await testPrisma.applicationQuestion.update({
        where: { id: question.id },
        data: { stepId: step.id },
      });

      const updated = await testPrisma.applicationQuestion.findUnique({ where: { id: question.id } });
      expect(updated!.stepId).toBe(step.id);
    });

    it("reorders steps", async () => {
      const template = await createTemplateWithSteps();
      const [stepA, stepB] = template.steps;

      await testPrisma.applicationFormStep.update({ where: { id: stepA.id }, data: { position: 1 } });
      await testPrisma.applicationFormStep.update({ where: { id: stepB.id }, data: { position: 0 } });

      const updated = await testPrisma.applicationFormStep.findMany({
        where: { templateId: template.id },
        orderBy: { position: "asc" },
      });
      expect(updated[0].id).toBe(stepB.id);
      expect(updated[1].id).toBe(stepA.id);
    });

    it("deletes step and unlinks questions", async () => {
      const template = await createTemplateWithSteps();
      const step = template.steps[0];
      const question = template.questions[0];

      // Assign question to step
      await testPrisma.applicationQuestion.update({ where: { id: question.id }, data: { stepId: step.id } });
      // Unlink all questions from step before deleting it
      await testPrisma.applicationQuestion.updateMany({ where: { stepId: step.id }, data: { stepId: null } });
      await testPrisma.applicationFormStep.delete({ where: { id: step.id } });

      const updatedQ = await testPrisma.applicationQuestion.findUnique({ where: { id: question.id } });
      expect(updatedQ).not.toBeNull();
      expect(updatedQ!.stepId).toBeNull();
    });
  });

  describe("Application with UTM data", () => {
    it("stores UTM attribution on application", async () => {
      const user = await createTestUser(testPrisma);
      const product = await createTestProduct(testPrisma);

      const app = await testPrisma.application.create({
        data: {
          userId: user.id,
          productId: product.id,
          utmSource: "instagram",
          utmMedium: "story",
          utmCampaign: "mentorship_2026",
          utmContent: "cta_button",
          landingPath: "/tr/products/mentorship",
          referrer: "https://instagram.com",
        },
      });

      expect(app.utmSource).toBe("instagram");
      expect(app.utmMedium).toBe("story");
      expect(app.utmCampaign).toBe("mentorship_2026");
      expect(app.landingPath).toBe("/tr/products/mentorship");
      expect(app.referrer).toBe("https://instagram.com");
    });

    it("works without UTM data (nullable fields)", async () => {
      const user = await createTestUser(testPrisma);
      const product = await createTestProduct(testPrisma);

      const app = await testPrisma.application.create({
        data: { userId: user.id, productId: product.id },
      });

      expect(app.utmSource).toBeNull();
      expect(app.utmMedium).toBeNull();
      expect(app.landingPath).toBeNull();
    });
  });

  describe("AdminNotification", () => {
    it("creates admin notifications", async () => {
      const admin = await createTestUser(testPrisma, { role: "ADMIN" });
      const user = await createTestUser(testPrisma);
      const product = await createTestProduct(testPrisma);

      const app = await testPrisma.application.create({
        data: { userId: user.id, productId: product.id },
      });

      const notif = await testPrisma.adminNotification.create({
        data: {
          recipientUserId: admin.id,
          type: "APPLICATION_SUBMITTED",
          title: "Yeni başvuru",
          message: `${user.name} başvurdu`,
          entityType: "Application",
          entityId: app.id,
        },
      });

      expect(notif.id).toBeTruthy();
      expect(notif.readAt).toBeNull();
      expect(notif.type).toBe("APPLICATION_SUBMITTED");
    });

    it("marks notification as read", async () => {
      const admin = await createTestUser(testPrisma, { role: "ADMIN" });

      const notif = await testPrisma.adminNotification.create({
        data: {
          recipientUserId: admin.id,
          type: "APPLICATION_SUBMITTED",
          title: "Test",
          message: "Test message",
        },
      });

      const updated = await testPrisma.adminNotification.update({
        where: { id: notif.id },
        data: { readAt: new Date() },
      });

      expect(updated.readAt).not.toBeNull();
    });

    it("counts unread notifications per user", async () => {
      const admin = await createTestUser(testPrisma, { role: "ADMIN" });

      await testPrisma.adminNotification.createMany({
        data: [
          { recipientUserId: admin.id, type: "APPLICATION_SUBMITTED", title: "A", message: "msg" },
          { recipientUserId: admin.id, type: "APPLICATION_SUBMITTED", title: "B", message: "msg" },
          { recipientUserId: admin.id, type: "APPLICATION_SUBMITTED", title: "C", message: "msg", readAt: new Date() },
        ],
      });

      const unread = await testPrisma.adminNotification.count({
        where: { recipientUserId: admin.id, readAt: null },
      });

      expect(unread).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Conditional logic - conditionJson schema", () => {
    it("stores and retrieves complex condition", async () => {
      const template = await createTemplateWithSteps();
      const q = template.questions[0];
      const complexCondition = {
        logic: "OR",
        rules: [
          { field: "experience", operator: "EQUALS", value: "advanced" },
          { field: "goal", operator: "CONTAINS", value: "freelance" },
        ],
      };

      const updated = await testPrisma.applicationQuestion.update({
        where: { id: q.id },
        data: { conditionJson: complexCondition },
      });

      const cond = updated.conditionJson as typeof complexCondition;
      expect(cond.logic).toBe("OR");
      expect(cond.rules).toHaveLength(2);
    });

    it("clears conditionJson (sets to DbNull)", async () => {
      const template = await createTemplateWithSteps();
      const q = template.questions.find((q) => q.key === "advanced_note")!;

      // Use Prisma.DbNull equivalent via $executeRaw for nullable JSON
      await testPrisma.$executeRaw`
        UPDATE application_questions SET "conditionJson" = NULL WHERE id = ${q.id}
      `;

      const cleared = await testPrisma.applicationQuestion.findUnique({ where: { id: q.id } });
      expect(cleared!.conditionJson).toBeNull();
    });
  });
});
