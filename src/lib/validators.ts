/**
 * Central phone and email validators / normalizers.
 *
 * Architecture note:
 * - These helpers run on both client and server.
 * - Server-side usage is authoritative; client-side is UX only.
 * - phoneValid / emailValid mean "format is plausible", NOT "ownership verified".
 * - Future OTP/verification fields: phoneVerifiedAt, emailVerifiedAt (not this file).
 */

import {
  parsePhoneNumberWithError,
  isValidPhoneNumber,
  isPossiblePhoneNumber,
  ParseError,
} from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

// ─── Phone ────────────────────────────────────────────────────────────────────

const DEFAULT_COUNTRY: CountryCode = "TR";

export type PhoneValidationResult =
  | { valid: true; e164: string; formatted: string }
  | { valid: false; error: "INVALID" | "NOT_A_NUMBER" | "TOO_SHORT" | "TOO_LONG" | "UNKNOWN" };

/**
 * Parse and validate a phone number.
 * Defaults to TR country code if no country prefix is supplied.
 * Returns E.164 (e.g. +905321234567) on success.
 */
export function validatePhone(
  raw: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY,
): PhoneValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, error: "NOT_A_NUMBER" };

  try {
    const parsed = parsePhoneNumberWithError(trimmed, defaultCountry);

    if (!isValidPhoneNumber(trimmed, defaultCountry)) {
      return { valid: false, error: "INVALID" };
    }
    if (!isPossiblePhoneNumber(trimmed, defaultCountry)) {
      return { valid: false, error: "INVALID" };
    }

    return {
      valid: true,
      e164: parsed.format("E.164"),
      formatted: parsed.formatInternational(),
    };
  } catch (err) {
    if (err instanceof ParseError) {
      const type = err.message as string;
      if (type === "NOT_A_NUMBER") return { valid: false, error: "NOT_A_NUMBER" };
      if (type === "TOO_SHORT") return { valid: false, error: "TOO_SHORT" };
      if (type === "TOO_LONG") return { valid: false, error: "TOO_LONG" };
      return { valid: false, error: "INVALID" };
    }
    return { valid: false, error: "UNKNOWN" };
  }
}

/** Convenience: normalize to E.164 or return null if invalid. */
export function normalizePhone(raw: string, defaultCountry: CountryCode = DEFAULT_COUNTRY): string | null {
  const result = validatePhone(raw, defaultCountry);
  return result.valid ? result.e164 : null;
}

/** Localized error message for an invalid phone. */
export function phoneErrorMessage(locale: "tr" | "en" = "tr"): string {
  return locale === "tr"
    ? "Geçerli bir telefon numarası girin."
    : "Please enter a valid phone number.";
}

// ─── Email ────────────────────────────────────────────────────────────────────

// Common typo suggestions (domain → correct domain)
const DOMAIN_TYPOS: Record<string, string> = {
  "gamil.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.om": "gmail.com",
  "hotmal.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "outlok.com": "outlook.com",
  "outloook.com": "outlook.com",
  "iclud.com": "icloud.com",
};

const MAX_EMAIL_LENGTH = 254; // RFC 5321

export type EmailValidationResult =
  | { valid: true; normalized: string; typoSuggestion?: string }
  | { valid: false; error: "EMPTY" | "TOO_LONG" | "INVALID_FORMAT" | "INVALID_DOMAIN" };

/**
 * Validate and normalize an email address.
 * - Trims whitespace
 * - Lowercases the domain part only (local-part case is preserved per RFC)
 * - Rejects control characters / spaces in the address
 * - Rejects domains without a dot
 * - Provides optional typo suggestion (non-blocking)
 *
 * Note: local-part is NOT forced to lowercase because Better Auth stores
 * emails as-entered in some flows. We only lowercase the domain.
 */
export function validateEmail(raw: string): EmailValidationResult {
  const trimmed = raw.trim();

  if (!trimmed) return { valid: false, error: "EMPTY" };
  if (trimmed.length > MAX_EMAIL_LENGTH) return { valid: false, error: "TOO_LONG" };

  // Reject whitespace or control chars inside the value
  if (/\s/.test(trimmed) || /[\x00-\x1F\x7F]/.test(trimmed)) {
    return { valid: false, error: "INVALID_FORMAT" };
  }

  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex < 1 || atIndex === trimmed.length - 1) {
    return { valid: false, error: "INVALID_FORMAT" };
  }

  const local = trimmed.slice(0, atIndex);
  const domainRaw = trimmed.slice(atIndex + 1);

  // Local-part basic sanity (no consecutive dots, not starting/ending with dot)
  if (!local || local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return { valid: false, error: "INVALID_FORMAT" };
  }

  // Domain must have at least one dot and valid TLD
  const domain = domainRaw.toLowerCase();
  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) {
    return { valid: false, error: "INVALID_DOMAIN" };
  }

  // Domain segments must be alphanumeric/hyphen and TLD ≥ 2 chars
  const segments = domain.split(".");
  const tld = segments[segments.length - 1];
  if (tld.length < 2 || !/^[a-z0-9-]+$/.test(tld)) {
    return { valid: false, error: "INVALID_DOMAIN" };
  }
  for (const seg of segments) {
    if (!seg || seg.startsWith("-") || seg.endsWith("-") || !/^[a-z0-9-]+$/.test(seg)) {
      return { valid: false, error: "INVALID_DOMAIN" };
    }
  }

  const normalized = `${local}@${domain}`;
  const typoSuggestion = DOMAIN_TYPOS[domain]
    ? `${local}@${DOMAIN_TYPOS[domain]}`
    : undefined;

  return { valid: true, normalized, typoSuggestion };
}

/** Convenience: return normalized email or null. */
export function normalizeEmail(raw: string): string | null {
  const result = validateEmail(raw);
  return result.valid ? result.normalized : null;
}

/** Localized error message for an invalid email. */
export function emailErrorMessage(locale: "tr" | "en" = "tr"): string {
  return locale === "tr"
    ? "Geçerli bir e-posta adresi girin."
    : "Please enter a valid email address.";
}

// ─── Zod helpers (server-side schemas) ────────────────────────────────────────

import { z } from "zod";

/** Zod schema for phone — parses to E.164 string. */
export function zPhone(locale: "tr" | "en" = "tr", defaultCountry: CountryCode = DEFAULT_COUNTRY) {
  return z.string().superRefine((val, ctx) => {
    const result = validatePhone(val, defaultCountry);
    if (!result.valid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: phoneErrorMessage(locale) });
    }
  }).transform((val) => {
    const r = validatePhone(val, defaultCountry);
    return r.valid ? r.e164 : val;
  });
}

/** Zod schema for email — parses to normalized string. */
export function zEmail(locale: "tr" | "en" = "tr") {
  return z.string().superRefine((val, ctx) => {
    const result = validateEmail(val);
    if (!result.valid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: emailErrorMessage(locale) });
    }
  }).transform((val) => {
    const r = validateEmail(val);
    return r.valid ? r.normalized : val;
  });
}
