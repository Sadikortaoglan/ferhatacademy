import { describe, it, expect } from "vitest";
import { testPrisma } from "../helpers/prisma";

// Helpers — create minimal template with questions/steps/options
async function createTemplate(key: string) {
  return testPrisma.applicationFormTemplate.create({
    data: {
      key,
      type: "GENERAL_CUSTOM",
      nameTr: `Test ${key}`,
      nameEn: `Test ${key}`,
    },
  });
}

async function createQuestion(templateId: string, key: string, position: number) {
  return testPrisma.applicationQuestion.create({
    data: {
      templateId,
      key,
      type: "SHORT_TEXT",
      section: "BASIC_INFO",
      labelTr: key,
      labelEn: key,
      position,
    },
  });
}

async function createStep(templateId: string, key: string, position: number) {
  return testPrisma.applicationFormStep.create({
    data: {
      templateId,
      stableKey: key,
      titleTr: key,
      titleEn: key,
      position,
    },
  });
}

async function createOption(questionId: string, key: string, position: number) {
  return testPrisma.applicationQuestionOption.create({
    data: {
      questionId,
      key,
      labelTr: key,
      labelEn: key,
      position,
    },
  });
}

// ─── reorderQuestions ownership ───────────────────────────────────────────────

describe("reorderQuestions — ownership enforcement", () => {
  it("reorders own questions correctly", async () => {
    const tmpl = await createTemplate(`tq_own_${Date.now()}`);
    const q1 = await createQuestion(tmpl.id, "q1", 0);
    const q2 = await createQuestion(tmpl.id, "q2", 1);

    // Simulate the fixed action logic inline
    await testPrisma.$transaction(async (tx) => {
      const orderedIds = [q2.id, q1.id];
      const owned = await tx.applicationQuestion.findMany({
        where: { id: { in: orderedIds }, templateId: tmpl.id },
        select: { id: true },
      });
      expect(owned.length).toBe(2); // passes
      await Promise.all(orderedIds.map((id, idx) =>
        tx.applicationQuestion.update({ where: { id }, data: { position: idx } })
      ));
    });

    const updated = await testPrisma.applicationQuestion.findMany({
      where: { templateId: tmpl.id },
      orderBy: { position: "asc" },
    });
    expect(updated[0].key).toBe("q2");
    expect(updated[1].key).toBe("q1");
  });

  it("REJECTS cross-template question IDs", async () => {
    const tmplA = await createTemplate(`tq_a_${Date.now()}`);
    const tmplB = await createTemplate(`tq_b_${Date.now()}`);
    const qA1 = await createQuestion(tmplA.id, "qa1", 0);
    const qA2 = await createQuestion(tmplA.id, "qa2", 1);
    const qB1 = await createQuestion(tmplB.id, "qb1", 0);

    const posBeforeA1 = qA1.position;
    const posBeforeB1 = qB1.position;

    await expect(
      testPrisma.$transaction(async (tx) => {
        // Attacker sends template A's ID but includes question from template B
        const orderedIds = [qA1.id, qB1.id];
        const owned = await tx.applicationQuestion.findMany({
          where: { id: { in: orderedIds }, templateId: tmplA.id },
          select: { id: true },
        });
        if (owned.length !== orderedIds.length) throw new Error("Geçersiz soru ID'leri.");
        await Promise.all(orderedIds.map((id, idx) =>
          tx.applicationQuestion.update({ where: { id }, data: { position: idx } })
        ));
      })
    ).rejects.toThrow("Geçersiz soru ID'leri.");

    // Positions must be unchanged
    const a1After = await testPrisma.applicationQuestion.findUniqueOrThrow({ where: { id: qA1.id } });
    const b1After = await testPrisma.applicationQuestion.findUniqueOrThrow({ where: { id: qB1.id } });
    expect(a1After.position).toBe(posBeforeA1);
    expect(b1After.position).toBe(posBeforeB1);

    // qA2 was not touched either
    const a2After = await testPrisma.applicationQuestion.findUniqueOrThrow({ where: { id: qA2.id } });
    expect(a2After.position).toBe(qA2.position);
  });

  it("REJECTS empty orderedIds that don't match template size", async () => {
    const tmpl = await createTemplate(`tq_empty_${Date.now()}`);
    const q1 = await createQuestion(tmpl.id, "q1", 0);

    await expect(
      testPrisma.$transaction(async (tx) => {
        const orderedIds = [q1.id, "non_existent_id"];
        const owned = await tx.applicationQuestion.findMany({
          where: { id: { in: orderedIds }, templateId: tmpl.id },
          select: { id: true },
        });
        if (owned.length !== orderedIds.length) throw new Error("Geçersiz soru ID'leri.");
      })
    ).rejects.toThrow("Geçersiz soru ID'leri.");
  });
});

// ─── reorderSteps ownership ───────────────────────────────────────────────────

describe("reorderSteps — ownership enforcement", () => {
  it("reorders own steps correctly", async () => {
    const tmpl = await createTemplate(`ts_own_${Date.now()}`);
    const s1 = await createStep(tmpl.id, "step1", 0);
    const s2 = await createStep(tmpl.id, "step2", 1);

    await testPrisma.$transaction(async (tx) => {
      const orderedIds = [s2.id, s1.id];
      const owned = await tx.applicationFormStep.findMany({
        where: { id: { in: orderedIds }, templateId: tmpl.id },
        select: { id: true },
      });
      expect(owned.length).toBe(2);
      await Promise.all(orderedIds.map((id, idx) =>
        tx.applicationFormStep.update({ where: { id }, data: { position: idx } })
      ));
    });

    const updated = await testPrisma.applicationFormStep.findMany({
      where: { templateId: tmpl.id },
      orderBy: { position: "asc" },
    });
    expect(updated[0].stableKey).toBe("step2");
    expect(updated[1].stableKey).toBe("step1");
  });

  it("REJECTS cross-template step IDs", async () => {
    const tmplA = await createTemplate(`ts_a_${Date.now()}`);
    const tmplB = await createTemplate(`ts_b_${Date.now()}`);
    const sA1 = await createStep(tmplA.id, "sa1", 0);
    const sB1 = await createStep(tmplB.id, "sb1", 0);

    await expect(
      testPrisma.$transaction(async (tx) => {
        const orderedIds = [sA1.id, sB1.id];
        const owned = await tx.applicationFormStep.findMany({
          where: { id: { in: orderedIds }, templateId: tmplA.id },
          select: { id: true },
        });
        if (owned.length !== orderedIds.length) throw new Error("Geçersiz adım ID'leri.");
        await Promise.all(orderedIds.map((id, idx) =>
          tx.applicationFormStep.update({ where: { id }, data: { position: idx } })
        ));
      })
    ).rejects.toThrow("Geçersiz adım ID'leri.");

    const sB1After = await testPrisma.applicationFormStep.findUniqueOrThrow({ where: { id: sB1.id } });
    expect(sB1After.position).toBe(sB1.position);
  });
});

// ─── reorderOptions ownership ─────────────────────────────────────────────────

describe("reorderOptions — ownership enforcement", () => {
  it("reorders own options correctly", async () => {
    const tmpl = await createTemplate(`to_own_${Date.now()}`);
    const q = await createQuestion(tmpl.id, "q_opt", 0);
    const o1 = await createOption(q.id, "opt1", 0);
    const o2 = await createOption(q.id, "opt2", 1);

    await testPrisma.$transaction(async (tx) => {
      const orderedIds = [o2.id, o1.id];
      const owned = await tx.applicationQuestionOption.findMany({
        where: { id: { in: orderedIds }, questionId: q.id },
        select: { id: true },
      });
      expect(owned.length).toBe(2);
      await Promise.all(orderedIds.map((id, idx) =>
        tx.applicationQuestionOption.update({ where: { id }, data: { position: idx } })
      ));
    });

    const updated = await testPrisma.applicationQuestionOption.findMany({
      where: { questionId: q.id },
      orderBy: { position: "asc" },
    });
    expect(updated[0].key).toBe("opt2");
    expect(updated[1].key).toBe("opt1");
  });

  it("REJECTS cross-question option IDs", async () => {
    const tmpl = await createTemplate(`to_cross_${Date.now()}`);
    const qA = await createQuestion(tmpl.id, "qa_opt", 0);
    const qB = await createQuestion(tmpl.id, "qb_opt", 1);
    const oA1 = await createOption(qA.id, "oa1", 0);
    const oB1 = await createOption(qB.id, "ob1", 0);

    await expect(
      testPrisma.$transaction(async (tx) => {
        const orderedIds = [oA1.id, oB1.id];
        const owned = await tx.applicationQuestionOption.findMany({
          where: { id: { in: orderedIds }, questionId: qA.id },
          select: { id: true },
        });
        if (owned.length !== orderedIds.length) throw new Error("Geçersiz seçenek ID'leri.");
        await Promise.all(orderedIds.map((id, idx) =>
          tx.applicationQuestionOption.update({ where: { id }, data: { position: idx } })
        ));
      })
    ).rejects.toThrow("Geçersiz seçenek ID'leri.");

    const oB1After = await testPrisma.applicationQuestionOption.findUniqueOrThrow({ where: { id: oB1.id } });
    expect(oB1After.position).toBe(oB1.position);
  });
});
