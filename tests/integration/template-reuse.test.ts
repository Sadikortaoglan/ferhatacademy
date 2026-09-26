import { describe, it, expect } from "vitest";
import { testPrisma } from "../helpers/prisma";
import { createTestUser, createTestProduct } from "../factories";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createMentorshipTemplate() {
  const key = `mentorship_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return testPrisma.applicationFormTemplate.create({
    data: {
      key,
      type: "MENTORSHIP",
      nameTr: "Mentörlük Başvurusu",
      nameEn: "Mentorship Application",
      steps: {
        create: [
          { stableKey: "s1", position: 0, titleTr: "Kişisel", titleEn: "Personal", active: true },
          { stableKey: "s2", position: 1, titleTr: "Hedefler", titleEn: "Goals", active: true },
        ],
      },
      questions: {
        create: [
          {
            key: "experience",
            type: "SINGLE_SELECT",
            section: "CURRENT_SITUATION",
            labelTr: "Deneyim?",
            labelEn: "Experience?",
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
            labelTr: "Hedef?",
            labelEn: "Goal?",
            required: true,
            active: true,
            position: 1,
          },
          {
            key: "budget",
            type: "SINGLE_SELECT",
            section: "ADDITIONAL_INFO",
            labelTr: "Bütçe?",
            labelEn: "Budget?",
            required: false,
            active: true,
            position: 2,
          },
        ],
      },
    },
    include: {
      steps: true,
      questions: { include: { options: true } },
      products: true,
    },
  });
}

async function createProfile(key: string) {
  return testPrisma.applicationPageProfile.create({
    data: {
      key: `${key}_${Date.now()}`,
      headlineTr: "Test Başvurusu",
      headlineEn: "Test Application",
      ctaLabelTr: "Başvur",
      ctaLabelEn: "Apply",
    },
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Template Reuse — Multiple Products Sharing One Template", () => {
  it("one template can be assigned to multiple products", async () => {
    const template = await createMentorshipTemplate();
    const profileA = await createProfile("profile_a");
    const profileB = await createProfile("profile_b");

    const productA = await createTestProduct(testPrisma);
    const productB = await createTestProduct(testPrisma);

    // Assign same template to both products (different profiles)
    await testPrisma.product.update({
      where: { id: productA.id },
      data: { formTemplateId: template.id, pageProfileId: profileA.id },
    });
    await testPrisma.product.update({
      where: { id: productB.id },
      data: { formTemplateId: template.id, pageProfileId: profileB.id },
    });

    // Both products reference the same template
    const productsUsingTemplate = await testPrisma.product.findMany({
      where: { formTemplateId: template.id },
    });
    expect(productsUsingTemplate).toHaveLength(2);
    expect(productsUsingTemplate.map((p) => p.id)).toContain(productA.id);
    expect(productsUsingTemplate.map((p) => p.id)).toContain(productB.id);
  });

  it("different profiles can present the same template with different content", async () => {
    const template = await createMentorshipTemplate();
    const profileA = await createProfile("ecommerce");
    const profileB = await createProfile("growth");

    // Profile A — e-commerce headline
    await testPrisma.applicationPageProfile.update({
      where: { id: profileA.id },
      data: { headlineTr: "E-Ticaret Mentörlüğüne Başvur", motivationTr: "E-ticaret dünyasına gir" },
    });
    // Profile B — growth headline
    await testPrisma.applicationPageProfile.update({
      where: { id: profileB.id },
      data: { headlineTr: "Growth Mentörlüğüne Başvur", motivationTr: "Büyüme fırsatlarını keşfet" },
    });

    const productA = await createTestProduct(testPrisma);
    const productB = await createTestProduct(testPrisma);

    await testPrisma.product.update({
      where: { id: productA.id },
      data: { formTemplateId: template.id, pageProfileId: profileA.id },
    });
    await testPrisma.product.update({
      where: { id: productB.id },
      data: { formTemplateId: template.id, pageProfileId: profileB.id },
    });

    // Both use same template questions
    const templateWithQuestions = await testPrisma.applicationFormTemplate.findUnique({
      where: { id: template.id },
      include: { questions: true, products: true },
    });
    expect(templateWithQuestions?.questions).toHaveLength(3);
    expect(templateWithQuestions?.products).toHaveLength(2);

    // But different profiles (different marketing content)
    const pa = await testPrisma.applicationPageProfile.findUnique({ where: { id: profileA.id } });
    const pb = await testPrisma.applicationPageProfile.findUnique({ where: { id: profileB.id } });
    expect(pa?.headlineTr).not.toBe(pb?.headlineTr);
    expect(pa?.motivationTr).not.toBe(pb?.motivationTr);
  });

  it("template _count.products reflects actual usage", async () => {
    const template = await createMentorshipTemplate();

    const productA = await createTestProduct(testPrisma);
    const productB = await createTestProduct(testPrisma);
    const productC = await createTestProduct(testPrisma);

    await testPrisma.product.updateMany({
      where: { id: { in: [productA.id, productB.id, productC.id] } },
      data: { formTemplateId: template.id },
    });

    const withCount = await testPrisma.applicationFormTemplate.findUnique({
      where: { id: template.id },
      include: { _count: { select: { products: true } } },
    });
    expect(withCount?._count.products).toBe(3);
  });
});

describe("Configuration Completeness", () => {
  it("product with template + profile is considered complete", async () => {
    const template = await createMentorshipTemplate();
    const profile = await createProfile("complete_test");
    const product = await createTestProduct(testPrisma);

    await testPrisma.product.update({
      where: { id: product.id },
      data: { formTemplateId: template.id, pageProfileId: profile.id },
    });

    const resolved = await testPrisma.product.findUnique({
      where: { id: product.id },
      include: {
        formTemplate: { include: { _count: { select: { steps: true, questions: true } } } },
        pageProfile: true,
      },
    });

    expect(resolved?.formTemplate).not.toBeNull();
    expect(resolved?.pageProfile).not.toBeNull();
    expect(resolved?.formTemplate?._count.steps).toBe(2);
    expect(resolved?.formTemplate?._count.questions).toBe(3);
  });

  it("product without template is incomplete", async () => {
    const product = await createTestProduct(testPrisma);
    const resolved = await testPrisma.product.findUnique({
      where: { id: product.id },
      select: { formTemplateId: true, pageProfileId: true },
    });
    expect(resolved?.formTemplateId).toBeNull();
  });

  it("archived template is excluded from active template list", async () => {
    const template = await createMentorshipTemplate();
    await testPrisma.applicationFormTemplate.update({
      where: { id: template.id },
      data: { archived: true },
    });

    const activeTemplates = await testPrisma.applicationFormTemplate.findMany({
      where: { archived: false },
    });
    const ids = activeTemplates.map((t) => t.id);
    expect(ids).not.toContain(template.id);
  });
});

describe("Snapshot Safety — Template Changes Do Not Affect Old Submissions", () => {
  it("existing ApplicationResponse snapshot is preserved after template question rename", async () => {
    const template = await createMentorshipTemplate();
    const profile = await createProfile("snapshot_test");
    const user = await createTestUser(testPrisma);
    const product = await createTestProduct(testPrisma);

    await testPrisma.product.update({
      where: { id: product.id },
      data: { formTemplateId: template.id, pageProfileId: profile.id },
    });

    const question = template.questions[0];
    const originalLabel = question.labelTr;

    // Simulate a submitted application with snapshot
    const application = await testPrisma.application.create({
      data: {
        userId: user.id,
        productId: product.id,
        templateId: template.id,
      },
    });

    const snapshotJson = {
      questions: [{ key: question.key, labelTr: originalLabel, answer: "İleri" }],
    };
    await testPrisma.applicationResponse.create({
      data: {
        applicationId: application.id,
        templateId: template.id,
        responsesJson: { [question.key]: "İleri" },
        snapshotJson,
      },
    });

    // Now admin renames the question
    await testPrisma.applicationQuestion.update({
      where: { id: question.id },
      data: { labelTr: "Deneyim seviyeniz nedir? (güncel)" },
    });

    // Snapshot still has original label
    const response = await testPrisma.applicationResponse.findUnique({
      where: { applicationId: application.id },
    });
    const snap = response?.snapshotJson as typeof snapshotJson;
    expect(snap.questions[0].labelTr).toBe(originalLabel);
    expect(snap.questions[0].labelTr).not.toContain("güncel");
  });

  it("changing template on product does not rewrite old application snapshots", async () => {
    const templateOld = await createMentorshipTemplate();
    const templateNew = await createMentorshipTemplate();
    const profile = await createProfile("template_swap");
    const user = await createTestUser(testPrisma);
    const product = await createTestProduct(testPrisma);

    await testPrisma.product.update({
      where: { id: product.id },
      data: { formTemplateId: templateOld.id, pageProfileId: profile.id },
    });

    const application = await testPrisma.application.create({
      data: {
        userId: user.id,
        productId: product.id,
        templateId: templateOld.id,
      },
    });
    await testPrisma.applicationResponse.create({
      data: {
        applicationId: application.id,
        templateId: templateOld.id,
        responsesJson: { experience: "advanced" },
        snapshotJson: { templateKey: templateOld.key, answers: { experience: "advanced" } },
      },
    });

    // Admin swaps template on the product
    await testPrisma.product.update({
      where: { id: product.id },
      data: { formTemplateId: templateNew.id },
    });

    // Old application still has templateOld snapshot
    const oldResponse = await testPrisma.applicationResponse.findUnique({
      where: { applicationId: application.id },
    });
    expect(oldResponse?.templateId).toBe(templateOld.id);
    const snap = oldResponse?.snapshotJson as { templateKey: string };
    expect(snap.templateKey).toBe(templateOld.key);
  });
});
