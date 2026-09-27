import { describe, it, expect } from "vitest";
import { isAllowedImageUrl, isAllowedNavHref } from "@/lib/url-validation";

// ─── isAllowedImageUrl ────────────────────────────────────────────────────────

describe("isAllowedImageUrl — valid inputs", () => {
  it("accepts local upload path", () => {
    expect(isAllowedImageUrl("/uploads/example.webp")).toBe(true);
  });

  it("accepts root-relative path", () => {
    expect(isAllowedImageUrl("/images/hero.jpg")).toBe(true);
  });

  it("accepts https external URL", () => {
    expect(isAllowedImageUrl("https://example.com/image.jpg")).toBe(true);
  });

  it("accepts http external URL", () => {
    expect(isAllowedImageUrl("http://example.com/image.jpg")).toBe(true);
  });
});

describe("isAllowedImageUrl — blocked inputs", () => {
  it("rejects javascript: scheme", () => {
    expect(isAllowedImageUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects javascript: case-insensitive", () => {
    expect(isAllowedImageUrl("JavaScript:alert(1)")).toBe(false);
  });

  it("rejects data: URI", () => {
    expect(isAllowedImageUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects file: scheme", () => {
    expect(isAllowedImageUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejects vbscript: scheme", () => {
    expect(isAllowedImageUrl("vbscript:msgbox(1)")).toBe(false);
  });

  it("rejects protocol-relative URL", () => {
    expect(isAllowedImageUrl("//evil.example.com/image.jpg")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isAllowedImageUrl("")).toBe(false);
  });

  it("rejects malformed URL (not starting with / or valid scheme)", () => {
    expect(isAllowedImageUrl("notavalidurl")).toBe(false);
  });
});

// ─── isAllowedNavHref ─────────────────────────────────────────────────────────

describe("isAllowedNavHref — valid inputs", () => {
  it("accepts /courses", () => {
    expect(isAllowedNavHref("/courses")).toBe(true);
  });

  it("accepts /products", () => {
    expect(isAllowedNavHref("/products")).toBe(true);
  });

  it("accepts /about", () => {
    expect(isAllowedNavHref("/about")).toBe(true);
  });

  it("accepts / root", () => {
    expect(isAllowedNavHref("/")).toBe(true);
  });

  it("accepts https:// external URL", () => {
    expect(isAllowedNavHref("https://example.com")).toBe(true);
  });

  it("accepts https:// with path", () => {
    expect(isAllowedNavHref("https://example.com/some/path")).toBe(true);
  });
});

describe("isAllowedNavHref — blocked inputs", () => {
  it("rejects javascript:alert(1)", () => {
    expect(isAllowedNavHref("javascript:alert(1)")).toBe(false);
  });

  it("rejects JavaScript: (case-insensitive)", () => {
    expect(isAllowedNavHref("JavaScript:alert(1)")).toBe(false);
  });

  it("rejects data:text/html,...", () => {
    expect(isAllowedNavHref("data:text/html,<script>x</script>")).toBe(false);
  });

  it("rejects file:///etc/passwd", () => {
    expect(isAllowedNavHref("file:///etc/passwd")).toBe(false);
  });

  it("rejects vbscript:", () => {
    expect(isAllowedNavHref("vbscript:msgbox(1)")).toBe(false);
  });

  it("rejects protocol-relative //evil.example.com", () => {
    expect(isAllowedNavHref("//evil.example.com")).toBe(false);
  });

  it("rejects http:// (only https allowed for nav external)", () => {
    expect(isAllowedNavHref("http://example.com")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isAllowedNavHref("")).toBe(false);
  });

  it("rejects plain text without scheme", () => {
    expect(isAllowedNavHref("notavalidurl")).toBe(false);
  });
});
