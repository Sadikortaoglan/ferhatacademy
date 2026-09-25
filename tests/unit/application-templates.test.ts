import { describe, it, expect } from "vitest";
import { DEFAULT_TEMPLATES } from "@/lib/application-templates";

describe("DEFAULT_TEMPLATES", () => {
  it("has exactly 5 templates", () => {
    expect(DEFAULT_TEMPLATES).toHaveLength(5);
  });

  it("all templates have unique keys", () => {
    const keys = DEFAULT_TEMPLATES.map((t) => t.key);
    expect(new Set(keys).size).toBe(5);
  });

  it("all questions have unique keys within template", () => {
    for (const t of DEFAULT_TEMPLATES) {
      const qKeys = t.questions.map((q) => q.key);
      expect(new Set(qKeys).size).toBe(qKeys.length);
    }
  });

  it("each template has at least one required question", () => {
    for (const t of DEFAULT_TEMPLATES) {
      expect(t.questions.some((q) => q.required)).toBe(true);
    }
  });

  it("select/radio/checkbox questions have options", () => {
    for (const t of DEFAULT_TEMPLATES) {
      for (const q of t.questions) {
        if (["SINGLE_SELECT", "MULTI_SELECT", "RADIO", "CHECKBOX"].includes(q.type)) {
          expect(q.options?.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("mentorship template has phone question", () => {
    const m = DEFAULT_TEMPLATES.find((t) => t.key === "mentorship");
    expect(m?.questions.some((q) => q.type === "PHONE")).toBe(true);
  });

  it("cohort template has weekly_time question", () => {
    const c = DEFAULT_TEMPLATES.find((t) => t.key === "cohort_premium");
    expect(c?.questions.some((q) => q.key === "weekly_time")).toBe(true);
  });

  it("all templates have type set", () => {
    for (const t of DEFAULT_TEMPLATES) {
      expect(t.type).toBeTruthy();
    }
  });

  it("all question positions are non-negative", () => {
    for (const t of DEFAULT_TEMPLATES) {
      for (const q of t.questions) {
        expect(q.position).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("covers all 5 template types", () => {
    const types = new Set(DEFAULT_TEMPLATES.map((t) => t.type));
    expect(types.has("MENTORSHIP")).toBe(true);
    expect(types.has("LIVE_TRAINING")).toBe(true);
    expect(types.has("CONSULTATION")).toBe(true);
    expect(types.has("COHORT_PREMIUM_PROGRAM")).toBe(true);
    expect(types.has("GENERAL_CUSTOM")).toBe(true);
  });
});
