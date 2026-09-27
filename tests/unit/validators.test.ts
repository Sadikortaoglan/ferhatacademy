import { describe, it, expect } from "vitest";
import {
  validatePhone,
  validateEmail,
  normalizePhone,
  normalizeEmail,
} from "@/lib/validators";

// ─── Phone ────────────────────────────────────────────────────────────────────

describe("validatePhone — valid Turkish numbers", () => {
  const VALID = [
    "05321234567",
    "5321234567",
    "+905321234567",
    "+90 532 123 45 67",
    "90 532 123 45 67",
    "0532 123 45 67",
    "0 532 123 45 67",
  ];

  for (const num of VALID) {
    it(`accepts "${num}"`, () => {
      const r = validatePhone(num);
      expect(r.valid).toBe(true);
      if (r.valid) {
        expect(r.e164).toBe("+905321234567");
      }
    });
  }
});

describe("validatePhone — invalid numbers", () => {
  const INVALID = [
    "123",
    "111111111",
    "abc",
    "0000000000",
    "+1",          // too short
    "not-a-number",
    "",
    "   ",
  ];

  for (const num of INVALID) {
    it(`rejects "${num}"`, () => {
      const r = validatePhone(num);
      expect(r.valid).toBe(false);
    });
  }
});

describe("normalizePhone", () => {
  it("returns E.164 for valid input", () => {
    expect(normalizePhone("05321234567")).toBe("+905321234567");
  });
  it("returns null for invalid input", () => {
    expect(normalizePhone("abc")).toBeNull();
  });
});

// ─── Email ────────────────────────────────────────────────────────────────────

describe("validateEmail — valid addresses", () => {
  const VALID = [
    "user@example.com",
    "name.surname+tag@example.com",
    "User@Example.COM",     // domain lowercased, local preserved
    "a@b.co",
    "test.user@sub.domain.org",
  ];

  for (const addr of VALID) {
    it(`accepts "${addr}"`, () => {
      const r = validateEmail(addr);
      expect(r.valid).toBe(true);
    });
  }

  it("lowercases domain, preserves local-part", () => {
    const r = validateEmail("User@Example.COM");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.normalized).toBe("User@example.com");
  });
});

describe("validateEmail — invalid addresses", () => {
  const INVALID = [
    "abc",
    "abc@",
    "@example.com",
    "a b@example.com",
    "user@",
    "user@.com",
    "user@com",           // no dot in domain
    "user@exam ple.com",
    "  ",
    "",
    "a".repeat(255) + "@b.com",  // too long
    "user@-bad.com",      // domain starts with hyphen
    "user@bad-.com",      // domain ends with hyphen
  ];

  for (const addr of INVALID) {
    it(`rejects "${addr}"`, () => {
      const r = validateEmail(addr);
      expect(r.valid).toBe(false);
    });
  }
});

describe("validateEmail — typo suggestions", () => {
  it("suggests gmail.com for gamil.com", () => {
    const r = validateEmail("test@gamil.com");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.typoSuggestion).toBe("test@gmail.com");
  });

  it("suggests hotmail.com for hotmal.com", () => {
    const r = validateEmail("me@hotmal.com");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.typoSuggestion).toBe("me@hotmail.com");
  });

  it("returns no suggestion for correct domain", () => {
    const r = validateEmail("me@gmail.com");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.typoSuggestion).toBeUndefined();
  });
});

describe("normalizeEmail", () => {
  it("returns normalized for valid", () => {
    expect(normalizeEmail("  USER@EXAMPLE.COM  ")).toBe("USER@example.com");
  });
  it("returns null for invalid", () => {
    expect(normalizeEmail("not-an-email")).toBeNull();
  });
});
