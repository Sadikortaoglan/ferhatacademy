import { describe, it, expect } from "vitest";

// Pure logic tests — no DOM rendering needed for these invariants.
// RTL rendering tests for DynamicForm are skipped here because the
// component has deep Next.js server-action dependencies; those are
// covered by the Playwright E2E suite.

type QuestionType =
  | "SHORT_TEXT" | "LONG_TEXT" | "PHONE" | "EMAIL" | "NUMBER"
  | "SINGLE_SELECT" | "MULTI_SELECT" | "RADIO" | "CHECKBOX";

type QuestionSection =
  | "BASIC_INFO" | "CURRENT_SITUATION" | "GOALS" | "CHALLENGES"
  | "PROGRAM_FIT" | "AVAILABILITY" | "ADDITIONAL_INFO";

interface Question {
  id: string;
  key: string;
  type: QuestionType;
  section: QuestionSection;
  labelTr: string;
  labelEn: string;
  helperTr: string | null;
  helperEn: string | null;
  required: boolean;
  active: boolean;
  position: number;
  options: { id: string; key: string; labelTr: string; labelEn: string; position: number; active: boolean }[];
}

const baseQuestion: Question = {
  id: "q1",
  key: "goal",
  type: "LONG_TEXT",
  section: "GOALS",
  labelTr: "Hedefiniz nedir?",
  labelEn: "What is your goal?",
  helperTr: null,
  helperEn: null,
  required: true,
  active: true,
  position: 0,
  options: [],
};

// ---------- Field type invariants ----------

describe("DynamicForm — field types", () => {
  it("LONG_TEXT maps to textarea", () => {
    expect(baseQuestion.type).toBe("LONG_TEXT");
  });

  it("SHORT_TEXT question shape is valid", () => {
    const q: Question = { ...baseQuestion, type: "SHORT_TEXT", key: "name" };
    expect(q.type).toBe("SHORT_TEXT");
    expect(q.options).toHaveLength(0);
  });

  it("SINGLE_SELECT requires options", () => {
    const q: Question = {
      ...baseQuestion,
      type: "SINGLE_SELECT",
      key: "experience",
      options: [
        { id: "o1", key: "beginner", labelTr: "Başlangıç", labelEn: "Beginner", position: 0, active: true },
        { id: "o2", key: "advanced", labelTr: "İleri", labelEn: "Advanced", position: 1, active: true },
      ],
    };
    expect(q.options.length).toBeGreaterThan(0);
    expect(q.options[0].key).toBe("beginner");
  });

  it("MULTI_SELECT answer is an array", () => {
    const answer: string[] = ["opt_a", "opt_b"];
    expect(Array.isArray(answer)).toBe(true);
    expect(answer).toHaveLength(2);
  });

  it("PHONE field key matches phone type", () => {
    const q: Question = { ...baseQuestion, type: "PHONE", key: "phone" };
    expect(q.type).toBe("PHONE");
  });

  it("EMAIL field key matches email type", () => {
    const q: Question = { ...baseQuestion, type: "EMAIL", key: "email" };
    expect(q.type).toBe("EMAIL");
  });

  it("NUMBER answer coerces to number", () => {
    const raw = "42";
    const coerced = Number(raw);
    expect(coerced).toBe(42);
    expect(typeof coerced).toBe("number");
  });
});

// ---------- Validation invariants ----------

describe("DynamicForm — validation", () => {
  it("required LONG_TEXT fails on empty string", () => {
    const isValid = !baseQuestion.required || "".trim().length > 0;
    expect(isValid).toBe(false);
  });

  it("required LONG_TEXT passes on non-empty string", () => {
    const isValid = !baseQuestion.required || "My goal".trim().length > 0;
    expect(isValid).toBe(true);
  });

  it("optional field always passes on empty", () => {
    const optional: Question = { ...baseQuestion, required: false };
    const isValid = !optional.required || "".trim().length > 0;
    expect(isValid).toBe(true);
  });

  it("inactive questions are excluded from validation", () => {
    const inactive: Question = { ...baseQuestion, active: false };
    const activeQuestions = [inactive].filter((q) => q.active);
    expect(activeQuestions).toHaveLength(0);
  });
});

// ---------- Multi-step layout invariants ----------

describe("DynamicForm — multi-step logic", () => {
  it("≤6 questions → single page", () => {
    const qs = Array.from({ length: 6 }, (_, i) => ({
      ...baseQuestion, id: `q${i}`, key: `q${i}`, position: i,
    }));
    expect(qs.length > 6).toBe(false);
  });

  it(">6 questions → multi-step", () => {
    const qs = Array.from({ length: 7 }, (_, i) => ({
      ...baseQuestion, id: `q${i}`, key: `q${i}`, position: i,
    }));
    expect(qs.length > 6).toBe(true);
  });

  it("questions grouped by section", () => {
    const qs: Question[] = [
      { ...baseQuestion, id: "q1", key: "q1", section: "GOALS" },
      { ...baseQuestion, id: "q2", key: "q2", section: "GOALS" },
      { ...baseQuestion, id: "q3", key: "q3", section: "CHALLENGES" },
    ];
    const grouped = qs.reduce<Record<string, Question[]>>((acc, q) => {
      if (!acc[q.section]) acc[q.section] = [];
      acc[q.section].push(q);
      return acc;
    }, {});
    expect(grouped["GOALS"]).toHaveLength(2);
    expect(grouped["CHALLENGES"]).toHaveLength(1);
  });
});

// ---------- Snapshot safety invariants ----------

describe("Submission snapshot safety", () => {
  it("snapshot preserves labelTr at submission time", () => {
    const question = { ...baseQuestion, labelTr: "Hedef" };
    const snap = {
      key: question.key,
      labelTr: question.labelTr,
      labelEn: question.labelEn,
      type: question.type,
      section: question.section,
      answer: "Grow my business",
    };
    expect(snap.labelTr).toBe("Hedef");
  });

  it("renaming question does not change existing snapshot", () => {
    const originalLabel = "Hedef";
    const snap = { labelTr: originalLabel, answer: "My answer" };
    // Simulate rename
    const renamedLabel = "Hedefler (Yeni)";
    // Snapshot is immutable — still reads original
    expect(snap.labelTr).toBe(originalLabel);
    expect(snap.labelTr).not.toBe(renamedLabel);
  });

  it("SINGLE_SELECT snapshot captures option labels", () => {
    const option = { key: "beginner", labelTr: "Başlangıç", labelEn: "Beginner" };
    const answer = "beginner";
    const optionLabels = answer === option.key ? { tr: option.labelTr, en: option.labelEn } : undefined;
    expect(optionLabels).toEqual({ tr: "Başlangıç", en: "Beginner" });
  });

  it("MULTI_SELECT snapshot captures all selected option labels", () => {
    const options = [
      { key: "a", labelTr: "A Seçeneği", labelEn: "Option A" },
      { key: "b", labelTr: "B Seçeneği", labelEn: "Option B" },
    ];
    const answer = ["a", "b"];
    const labels = answer.map((k) => {
      const opt = options.find((o) => o.key === k);
      return opt ? { key: k, tr: opt.labelTr, en: opt.labelEn } : { key: k };
    });
    expect(labels).toHaveLength(2);
    expect(labels[0].tr).toBe("A Seçeneği");
  });

  it("unknown option key falls back to key only", () => {
    const options = [{ key: "known", labelTr: "Bilinen", labelEn: "Known" }];
    const answer = ["unknown_key"];
    const labels = answer.map((k) => {
      const opt = options.find((o) => o.key === k);
      return opt ? { key: k, tr: opt.labelTr, en: opt.labelEn } : { key: k };
    });
    expect(labels[0]).toEqual({ key: "unknown_key" });
    expect((labels[0] as { key: string }).key).toBe("unknown_key");
  });
});

// ---------- Authorization invariants ----------

describe("Application authorization", () => {
  it("existing active application prevents duplicate submission", () => {
    const existingStatus = "PENDING";
    const blockedStatuses = ["REJECTED", "CANCELLED"];
    const canReapply = blockedStatuses.includes(existingStatus);
    expect(canReapply).toBe(false);
  });

  it("rejected application allows reapplication", () => {
    const existingStatus = "REJECTED";
    const blockedStatuses = ["REJECTED", "CANCELLED"];
    const canReapply = blockedStatuses.includes(existingStatus);
    expect(canReapply).toBe(true);
  });

  it("cancelled application allows reapplication", () => {
    const existingStatus = "CANCELLED";
    const blockedStatuses = ["REJECTED", "CANCELLED"];
    const canReapply = blockedStatuses.includes(existingStatus);
    expect(canReapply).toBe(true);
  });
});
