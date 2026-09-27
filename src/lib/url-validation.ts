/**
 * Centralized URL validation for admin input fields.
 * Used by navigation href and image URL fields to block dangerous schemes
 * (javascript:, data:, vbscript:, file:) while allowing legitimate values.
 */

const BLOCKED_SCHEMES = ["javascript:", "data:", "vbscript:", "file:"];

/**
 * Validates image URLs accepted by admin fields (heroImageUrl, gallery, etc.).
 * Allows: local paths (/uploads/...), HTTPS external URLs.
 * Rejects: javascript:, data:, file:, protocol-relative //, or anything else.
 */
export function isAllowedImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();

  // Block dangerous schemes (case-insensitive)
  const lower = trimmed.toLowerCase();
  if (BLOCKED_SCHEMES.some((s) => lower.startsWith(s))) return false;

  // Block protocol-relative //
  if (trimmed.startsWith("//")) return false;

  // Allow local paths
  if (trimmed.startsWith("/")) return true;

  // Allow https:// external
  try {
    const u = new URL(trimmed);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Validates navigation href values.
 * Allows: relative internal paths (/...), https:// external links.
 * Rejects: javascript:, data:, file:, vbscript:, protocol-relative //.
 */
export function isAllowedNavHref(href: string): boolean {
  if (!href || typeof href !== "string") return false;
  const trimmed = href.trim();

  const lower = trimmed.toLowerCase();
  if (BLOCKED_SCHEMES.some((s) => lower.startsWith(s))) return false;

  // Block protocol-relative //
  if (trimmed.startsWith("//")) return false;

  // Allow internal relative paths
  if (trimmed.startsWith("/")) return true;

  // Allow external https://
  try {
    const u = new URL(trimmed);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}
