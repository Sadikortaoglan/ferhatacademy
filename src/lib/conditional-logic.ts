export type ConditionOperator = "eq" | "neq" | "contains" | "not_contains" | "filled" | "empty";

export type QuestionCondition = {
  questionKey: string;
  operator: ConditionOperator;
  value?: string | string[];
};

export type ConditionalRule = {
  anyOf?: QuestionCondition[];
  allOf?: QuestionCondition[];
};

export function evaluateCondition(
  condition: QuestionCondition,
  answers: Record<string, unknown>
): boolean {
  const answer = answers[condition.questionKey];
  switch (condition.operator) {
    case "filled":
      if (Array.isArray(answer)) return answer.length > 0;
      return answer !== undefined && answer !== null && answer !== "";
    case "empty":
      if (Array.isArray(answer)) return answer.length === 0;
      return answer === undefined || answer === null || answer === "";
    case "eq":
      if (Array.isArray(answer)) return answer.includes(condition.value as string);
      return String(answer ?? "") === String(condition.value ?? "");
    case "neq":
      if (Array.isArray(answer)) return !answer.includes(condition.value as string);
      return String(answer ?? "") !== String(condition.value ?? "");
    case "contains":
      if (Array.isArray(answer)) {
        const vals = Array.isArray(condition.value) ? condition.value : [condition.value as string];
        return vals.some((v) => answer.includes(v));
      }
      return String(answer ?? "").toLowerCase().includes(String(condition.value ?? "").toLowerCase());
    case "not_contains":
      if (Array.isArray(answer)) {
        const vals = Array.isArray(condition.value) ? condition.value : [condition.value as string];
        return !vals.some((v) => answer.includes(v));
      }
      return !String(answer ?? "").toLowerCase().includes(String(condition.value ?? "").toLowerCase());
    default:
      return true;
  }
}

export function evaluateRule(
  rule: ConditionalRule,
  answers: Record<string, unknown>
): boolean {
  if (rule.anyOf && rule.anyOf.length > 0) {
    return rule.anyOf.some((c) => evaluateCondition(c, answers));
  }
  if (rule.allOf && rule.allOf.length > 0) {
    return rule.allOf.every((c) => evaluateCondition(c, answers));
  }
  return true;
}

export function filterVisibleQuestions<T extends { key: string; conditionalRule?: unknown }>(
  questions: T[],
  answers: Record<string, unknown>
): T[] {
  return questions.filter((q) => {
    if (!q.conditionalRule) return true;
    try {
      return evaluateRule(q.conditionalRule as ConditionalRule, answers);
    } catch {
      return true;
    }
  });
}

export function cleanHiddenAnswers(
  answers: Record<string, unknown>,
  allQuestions: { key: string; conditionalRule?: unknown }[]
): Record<string, unknown> {
  const visible = filterVisibleQuestions(allQuestions, answers);
  const visibleKeys = new Set(visible.map((q) => q.key));
  const cleaned: Record<string, unknown> = {};
  for (const key of Object.keys(answers)) {
    if (visibleKeys.has(key)) cleaned[key] = answers[key];
  }
  return cleaned;
}
