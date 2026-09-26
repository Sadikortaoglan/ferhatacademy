import { describe, it, expect } from "vitest";
import {
  evaluateCondition,
  evaluateRule,
  filterVisibleQuestions,
  cleanHiddenAnswers,
} from "@/lib/conditional-logic";

describe("evaluateCondition", () => {
  it("filled — returns true when answer is non-empty string", () => {
    expect(evaluateCondition({ questionKey: "goal", operator: "filled" }, { goal: "something" })).toBe(true);
  });

  it("filled — returns false when answer is empty string", () => {
    expect(evaluateCondition({ questionKey: "goal", operator: "filled" }, { goal: "" })).toBe(false);
  });

  it("filled — returns false when answer is missing", () => {
    expect(evaluateCondition({ questionKey: "goal", operator: "filled" }, {})).toBe(false);
  });

  it("filled — returns true for non-empty array", () => {
    expect(evaluateCondition({ questionKey: "topics", operator: "filled" }, { topics: ["a"] })).toBe(true);
  });

  it("empty — returns true when answer is undefined", () => {
    expect(evaluateCondition({ questionKey: "note", operator: "empty" }, {})).toBe(true);
  });

  it("empty — returns false when answer exists", () => {
    expect(evaluateCondition({ questionKey: "note", operator: "empty" }, { note: "text" })).toBe(false);
  });

  it("eq — matches string answer", () => {
    expect(evaluateCondition({ questionKey: "level", operator: "eq", value: "advanced" }, { level: "advanced" })).toBe(true);
  });

  it("eq — returns false for non-matching", () => {
    expect(evaluateCondition({ questionKey: "level", operator: "eq", value: "advanced" }, { level: "beginner" })).toBe(false);
  });

  it("eq — matches if answer array includes value", () => {
    expect(evaluateCondition({ questionKey: "topics", operator: "eq", value: "marketing" }, { topics: ["marketing", "sales"] })).toBe(true);
  });

  it("neq — returns true when value does not match", () => {
    expect(evaluateCondition({ questionKey: "level", operator: "neq", value: "advanced" }, { level: "beginner" })).toBe(true);
  });

  it("neq — returns false when value matches", () => {
    expect(evaluateCondition({ questionKey: "level", operator: "neq", value: "advanced" }, { level: "advanced" })).toBe(false);
  });

  it("contains — matches substring", () => {
    expect(evaluateCondition({ questionKey: "bio", operator: "contains", value: "developer" }, { bio: "I am a developer" })).toBe(true);
  });

  it("not_contains — true when value absent", () => {
    expect(evaluateCondition({ questionKey: "bio", operator: "not_contains", value: "manager" }, { bio: "I am a developer" })).toBe(true);
  });
});

describe("evaluateRule", () => {
  it("anyOf — true if any condition matches", () => {
    const rule = { anyOf: [{ questionKey: "level", operator: "eq" as const, value: "advanced" }] };
    expect(evaluateRule(rule, { level: "advanced" })).toBe(true);
  });

  it("anyOf — false if no condition matches", () => {
    const rule = { anyOf: [{ questionKey: "level", operator: "eq" as const, value: "advanced" }] };
    expect(evaluateRule(rule, { level: "beginner" })).toBe(false);
  });

  it("allOf — true if all conditions match", () => {
    const rule = {
      allOf: [
        { questionKey: "level", operator: "eq" as const, value: "advanced" },
        { questionKey: "goal", operator: "filled" as const },
      ],
    };
    expect(evaluateRule(rule, { level: "advanced", goal: "my goal" })).toBe(true);
  });

  it("allOf — false if one condition fails", () => {
    const rule = {
      allOf: [
        { questionKey: "level", operator: "eq" as const, value: "advanced" },
        { questionKey: "goal", operator: "filled" as const },
      ],
    };
    expect(evaluateRule(rule, { level: "advanced", goal: "" })).toBe(false);
  });

  it("no conditions — always shows question", () => {
    expect(evaluateRule({}, { anything: "yes" })).toBe(true);
  });
});

describe("filterVisibleQuestions", () => {
  const questions = [
    { key: "level", conditionalRule: undefined },
    { key: "advanced_goal", conditionalRule: { anyOf: [{ questionKey: "level", operator: "eq", value: "advanced" }] } },
    { key: "beginner_help", conditionalRule: { anyOf: [{ questionKey: "level", operator: "eq", value: "beginner" }] } },
  ];

  it("shows unconditional questions always", () => {
    const visible = filterVisibleQuestions(questions, {});
    expect(visible.find((q) => q.key === "level")).toBeTruthy();
  });

  it("hides question when condition not met", () => {
    const visible = filterVisibleQuestions(questions, { level: "beginner" });
    expect(visible.find((q) => q.key === "advanced_goal")).toBeUndefined();
    expect(visible.find((q) => q.key === "beginner_help")).toBeTruthy();
  });

  it("shows question when condition met", () => {
    const visible = filterVisibleQuestions(questions, { level: "advanced" });
    expect(visible.find((q) => q.key === "advanced_goal")).toBeTruthy();
    expect(visible.find((q) => q.key === "beginner_help")).toBeUndefined();
  });

  it("shows question with malformed rule (fail-open)", () => {
    const qs = [{ key: "q1", conditionalRule: "not a valid rule object" }];
    expect(filterVisibleQuestions(qs, {})).toHaveLength(1);
  });
});

describe("cleanHiddenAnswers", () => {
  it("removes answers for hidden questions", () => {
    const questions = [
      { key: "level" },
      { key: "advanced_topic", conditionalRule: { anyOf: [{ questionKey: "level", operator: "eq", value: "advanced" }] } },
    ];
    const answers = { level: "beginner", advanced_topic: "something" };
    const cleaned = cleanHiddenAnswers(answers, questions);
    expect(cleaned.level).toBe("beginner");
    expect(cleaned.advanced_topic).toBeUndefined();
  });

  it("preserves answers for visible questions", () => {
    const questions = [
      { key: "level" },
      { key: "goal", conditionalRule: { anyOf: [{ questionKey: "level", operator: "filled" }] } },
    ];
    const answers = { level: "advanced", goal: "grow my business" };
    const cleaned = cleanHiddenAnswers(answers, questions);
    expect(cleaned.goal).toBe("grow my business");
  });
});
