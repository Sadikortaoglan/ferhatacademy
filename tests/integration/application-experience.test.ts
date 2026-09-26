import { describe, it, expect } from "vitest";
import { testPrisma } from "../helpers/prisma";
import { createTestUser, createTestAdmin, createTestProduct } from "../factories";

async function createTestTemplate(overrides: { key?: string } = {}) {
  const key = overrides.key ?? `test_template_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return testPrisma.applicationFormTemplate.create({
    data: {
      key,
      type: "GENERAL_CUSTOM",
      nameTr: "Test Şablonu",
      nameEn: "Test Template",
      questions: {
        create: [
          {
            key: "goal",
            type: "LONG_TEXT",
            section: "GOALS",
            labelTr: "Hedef",
            labelEn: "Goal",
            required: true,
            active: true,
            position: 0,
          },
          {
            key: "experience",
            type: "SINGLE_SELECT",
            section: "CURRENT_SITUATION",
            labelTr: "Deneyim",
            labelEn: "Experience",
            required: true,
            active: true,
            position: 1,
            options: {
              create: [
                { key: "beginner", labelTr: "Başlangıç", labelEn: "Beginner", position: 0, active: true },
                { key: "advanced", labelTr: "İleri", labelEn: "Advanced", position: 1, active: true },
              ],
            },
          },
          {
            key: "note",
            type: "LONG_TEXT",
            section: "ADDITIONAL_INFO",
            labelTr: "Not",
            labelEn: "Note",
            required: false,
            active: true,
            position: 2,
          },
        ],
      },
    },
    include: { questions: { include: { options: true } } },
  });
}

describe("Application Experience Integration Tests", () => {
  describe("ApplicationFormTemplate CRUD", () => {
    it("creates a template with questions and options", async () => {
      const template = await createTestTemplate();
      expect(template.questions).toHaveLength(3);
      const selectQ = template.questions.find((q) => q.key === "experience");
      expect(selectQ?.options).toHaveLength(2);
    });

    it("enforces unique key constraint", async () => {
      const key = `unique_test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await testPrisma.applicationFormTemplate.create({
        data: { key, type: "GENERAL_CUSTOM", nameTr: "T1", nameEn: "T1" },
      });
      await expect(
        testPrisma.applicationFormTemplate.create({
          data: { key, type: "GENERAL_CUSTOM", nameTr: "T2", nameEn: "T2" },
        })
      ).rejects.toThrow();
    });

    it("archiving a template does not delete it", async () => {
      const t = await testPrisma.applicationFormTemplate.create({
        data: {
          key: `archive_test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          type: "MENTORSHIP",
          nameTr: "T",
          nameEn: "T",
        },
      });
      await testPrisma.applicationFormTemplate.update({ where: { id: t.id }, data: { archived: true } });
      const found = await testPrisma.applicationFormTemplate.findUnique({ where: { id: t.id } });
      expect(found).not.toBeNull();
      expect(found?.archived).toBe(true);
    });

    it("cascade deletes questions when template is deleted", async () => {
      const t = await createTestTemplate();
      const qId = t.questions[0].id;
      await testPrisma.applicationFormTemplate.delete({ where: { id: t.id } });
      const q = await testPrisma.applicationQuestion.findUnique({ where: { id: qId } });
      expect(q).toBeNull();
    });
  });

  describe("Product → Template binding", () => {
    it("links a product to a form template", async () => {
      await createTestAdmin(testPrisma);
      const product = await createTestProduct(testPrisma);
      const template = await createTestTemplate();

      await testPrisma.product.update({
        where: { id: product.id },
        data: { formTemplateId: template.id },
      });

      const updated = await testPrisma.product.findUnique({
        where: { id: product.id },
        include: { formTemplate: true },
      });
      expect(updated?.formTemplate?.id).toBe(template.id);
    });

    it("links a product to a page profile", async () => {
      const product = await createTestProduct(testPrisma);
      const profile = await testPrisma.applicationPageProfile.create({
        data: {
          key: `profile_link_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          headlineTr: "Test",
          headlineEn: "Test",
          layout: "SPLIT",
        },
      });

      await testPrisma.product.update({
        where: { id: product.id },
        data: { pageProfileId: profile.id },
      });

      const updated = await testPrisma.product.findUnique({
        where: { id: product.id },
        include: { pageProfile: true },
      });
      expect(updated?.pageProfile?.id).toBe(profile.id);
    });
  });

  describe("ApplicationPageProfile CRUD", () => {
    it("creates a page profile with all fields", async () => {
      const key = `profile_crud_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const profile = await testPrisma.applicationPageProfile.create({
        data: {
          key,
          headlineTr: "Test Başlık",
          headlineEn: "Test Headline",
          subtitleTr: "Alt başlık",
          subtitleEn: "Subtitle",
          layout: "SPLIT",
          ctaLabelTr: "Başvur",
          ctaLabelEn: "Apply",
        },
      });
      expect(profile.key).toBe(key);
      expect(profile.layout).toBe("SPLIT");
      expect(profile.ctaLabelTr).toBe("Başvur");
    });

    it("adds FAQ items to a profile", async () => {
      const profile = await testPrisma.applicationPageProfile.create({
        data: {
          key: `faq_test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          headlineTr: "T",
          headlineEn: "T",
          layout: "SPLIT",
        },
      });
      await testPrisma.applicationPageFaqItem.create({
        data: {
          profileId: profile.id,
          questionTr: "Ücretli mi?",
          questionEn: "Is it paid?",
          answerTr: "Hayır",
          answerEn: "No",
          position: 0,
        },
      });
      const faqItems = await testPrisma.applicationPageFaqItem.findMany({
        where: { profileId: profile.id },
      });
      expect(faqItems).toHaveLength(1);
    });

    it("adds process steps to a profile", async () => {
      const profile = await testPrisma.applicationPageProfile.create({
        data: {
          key: `steps_test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          headlineTr: "T",
          headlineEn: "T",
          layout: "FORM_FIRST",
        },
      });
      await testPrisma.applicationPageProcessStep.createMany({
        data: [
          { profileId: profile.id, titleTr: "Adım 1", titleEn: "Step 1", position: 0 },
          { profileId: profile.id, titleTr: "Adım 2", titleEn: "Step 2", position: 1 },
        ],
      });
      const steps = await testPrisma.applicationPageProcessStep.findMany({
        where: { profileId: profile.id },
        orderBy: { position: "asc" },
      });
      expect(steps).toHaveLength(2);
      expect(steps[0].titleTr).toBe("Adım 1");
    });
  });

  describe("Application submission and snapshot safety", () => {
    it("creates application with response snapshot", async () => {
      const user = await createTestUser(testPrisma);
      const product = await createTestProduct(testPrisma);
      const template = await createTestTemplate();

      await testPrisma.product.update({
        where: { id: product.id },
        data: { formTemplateId: template.id },
      });

      const app = await testPrisma.application.create({
        data: {
          userId: user.id,
          productId: product.id,
          templateId: template.id,
          response: {
            create: {
              templateId: template.id,
              templateVersion: 1,
              responsesJson: { goal: "Grow my business", experience: "beginner" },
              snapshotJson: [
                {
                  key: "goal",
                  labelTr: "Hedef",
                  labelEn: "Goal",
                  type: "LONG_TEXT",
                  section: "GOALS",
                  answer: "Grow my business",
                },
                {
                  key: "experience",
                  labelTr: "Deneyim",
                  labelEn: "Experience",
                  type: "SINGLE_SELECT",
                  section: "CURRENT_SITUATION",
                  answer: "beginner",
                  optionLabels: { tr: "Başlangıç", en: "Beginner" },
                },
              ],
            },
          },
        },
        include: { response: true },
      });

      expect(app.templateId).toBe(template.id);
      expect(app.response).not.toBeNull();
      const snapshot = app.response!.snapshotJson as Array<Record<string, unknown>>;
      expect(snapshot).toHaveLength(2);
      expect(snapshot[0].labelTr).toBe("Hedef");
    });

    it("snapshot remains readable after template question is renamed", async () => {
      const user = await createTestUser(testPrisma);
      const product = await createTestProduct(testPrisma);
      const template = await createTestTemplate();
      await testPrisma.product.update({ where: { id: product.id }, data: { formTemplateId: template.id } });

      const originalLabel = "Hedef";
      const app = await testPrisma.application.create({
        data: {
          userId: user.id,
          productId: product.id,
          templateId: template.id,
          response: {
            create: {
              templateId: template.id,
              templateVersion: 1,
              responsesJson: { goal: "Test answer" },
              snapshotJson: [
                {
                  key: "goal",
                  labelTr: originalLabel,
                  labelEn: "Goal",
                  type: "LONG_TEXT",
                  section: "GOALS",
                  answer: "Test answer",
                },
              ],
            },
          },
        },
        include: { response: true },
      });

      // Rename the question in the template
      await testPrisma.applicationQuestion.updateMany({
        where: { templateId: template.id, key: "goal" },
        data: { labelTr: "RENAMED LABEL" },
      });

      // Snapshot should still have original label — it's immutable
      const response = await testPrisma.applicationResponse.findUnique({
        where: { applicationId: app.id },
      });
      const snapshot = response!.snapshotJson as Array<Record<string, unknown>>;
      expect(snapshot[0].labelTr).toBe(originalLabel);
      expect(snapshot[0].labelTr).not.toBe("RENAMED LABEL");
    });

    it("prevents duplicate active applications for same user/product", async () => {
      const user = await createTestUser(testPrisma);
      const product = await createTestProduct(testPrisma);

      await testPrisma.application.create({ data: { userId: user.id, productId: product.id } });

      await expect(
        testPrisma.application.create({ data: { userId: user.id, productId: product.id } })
      ).rejects.toThrow();
    });
  });

  describe("Authorization (data layer scoping)", () => {
    it("user cannot read another user's application via scoped query", async () => {
      const user1 = await createTestUser(testPrisma);
      const user2 = await createTestUser(testPrisma);
      const product = await createTestProduct(testPrisma);

      const app = await testPrisma.application.create({
        data: { userId: user1.id, productId: product.id },
      });

      const found = await testPrisma.application.findFirst({
        where: { id: app.id, userId: user2.id },
      });
      expect(found).toBeNull();
    });

    it("scoped query finds the correct user's application", async () => {
      const user1 = await createTestUser(testPrisma);
      const product = await createTestProduct(testPrisma);

      const app = await testPrisma.application.create({
        data: { userId: user1.id, productId: product.id },
      });

      const found = await testPrisma.application.findFirst({
        where: { id: app.id, userId: user1.id },
      });
      expect(found?.id).toBe(app.id);
    });
  });
});
