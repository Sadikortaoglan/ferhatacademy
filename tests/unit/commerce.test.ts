import { describe, it, expect } from "vitest";
import { formatOrderReference, formatPrice } from "@/server/commerce";

describe("formatOrderReference", () => {
  it("generates a reference matching FA-YYYY-XXXXXX pattern", () => {
    const ref = formatOrderReference();
    expect(ref).toMatch(/^FA-\d{4}-\d{6}$/);
  });

  it("uses the current year", () => {
    const ref = formatOrderReference();
    const year = new Date().getFullYear().toString();
    expect(ref.startsWith(`FA-${year}-`)).toBe(true);
  });

  it("generates unique references on successive calls", () => {
    const refs = new Set(Array.from({ length: 50 }, () => formatOrderReference()));
    // Very unlikely (but not impossible) to collide in 50 calls; expect near-uniqueness
    expect(refs.size).toBeGreaterThan(45);
  });
});

describe("formatPrice", () => {
  it("formats TRY in Turkish locale", () => {
    const result = formatPrice(29900, "TRY", "tr");
    expect(result).toContain("299");
    expect(result).toContain("₺");
  });

  it("formats USD in English locale", () => {
    const result = formatPrice(9900, "USD", "en");
    expect(result).toContain("99");
    expect(result).toContain("$");
  });

  it("formats zero correctly", () => {
    const result = formatPrice(0, "TRY", "tr");
    expect(result).toContain("0");
  });
});
