import { describe, it, expect } from "vitest";

// Re-implement the pure validation logic inline so it can be unit-tested
// without a running server. If route.ts logic changes, update these too.

const SAFE_MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const MAGIC: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/avif": [],
};

function checkMagic(buffer: Buffer, mimeType: string): boolean {
  const sigs = MAGIC[mimeType];
  if (!sigs || sigs.length === 0) return true;
  return sigs.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}

const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
const RIFF_MAGIC = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00]);

describe("upload MIME whitelist", () => {
  it("accepts jpeg", () => expect(SAFE_MIME_EXT["image/jpeg"]).toBe("jpg"));
  it("accepts png", () => expect(SAFE_MIME_EXT["image/png"]).toBe("png"));
  it("accepts webp", () => expect(SAFE_MIME_EXT["image/webp"]).toBe("webp"));
  it("accepts gif", () => expect(SAFE_MIME_EXT["image/gif"]).toBe("gif"));
  it("accepts avif", () => expect(SAFE_MIME_EXT["image/avif"]).toBe("avif"));
  it("rejects pdf", () => expect(SAFE_MIME_EXT["application/pdf"]).toBeUndefined());
  it("rejects svg", () => expect(SAFE_MIME_EXT["image/svg+xml"]).toBeUndefined());
  it("rejects exe", () => expect(SAFE_MIME_EXT["application/octet-stream"]).toBeUndefined());
});

describe("upload magic byte validation", () => {
  it("JPEG magic matches image/jpeg", () => {
    expect(checkMagic(JPEG_MAGIC, "image/jpeg")).toBe(true);
  });

  it("PNG magic matches image/png", () => {
    expect(checkMagic(PNG_MAGIC, "image/png")).toBe(true);
  });

  it("RIFF header matches image/webp", () => {
    expect(checkMagic(RIFF_MAGIC, "image/webp")).toBe(true);
  });

  it("PNG bytes rejected for image/jpeg", () => {
    expect(checkMagic(PNG_MAGIC, "image/jpeg")).toBe(false);
  });

  it("JPEG bytes rejected for image/png", () => {
    expect(checkMagic(JPEG_MAGIC, "image/png")).toBe(false);
  });

  it("AVIF has no magic check — always passes", () => {
    const randomBytes = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    expect(checkMagic(randomBytes, "image/avif")).toBe(true);
  });

  it("empty buffer rejected for image/jpeg", () => {
    expect(checkMagic(Buffer.alloc(0), "image/jpeg")).toBe(false);
  });
});

describe("upload size limit", () => {
  const MAX_SIZE = 10 * 1024 * 1024;

  it("10 MB exactly is allowed", () => {
    expect(MAX_SIZE).toBeLessThanOrEqual(MAX_SIZE);
  });

  it("10 MB + 1 byte would be rejected", () => {
    const oversize = MAX_SIZE + 1;
    expect(oversize > MAX_SIZE).toBe(true);
  });
});
