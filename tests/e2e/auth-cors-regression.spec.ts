import { test, expect } from "@playwright/test";

/**
 * Regression tests for the www.ferhatacademy.com CORS bug.
 *
 * Root cause: auth-client was using an absolute NEXT_PUBLIC_APP_URL
 * (https://ferhatacademy.com) while the page was served from
 * https://www.ferhatacademy.com — different origins → Chrome CORS block.
 *
 * Fix: auth-client now uses window.location.origin (same-origin relative).
 * Nginx redirects www → non-www before the request reaches the app.
 */

test.describe("Auth CORS regression — same-origin requests", () => {
  test("sign-in API requests are same-origin (no cross-origin auth call)", async ({ page }) => {
    const crossOriginAuthRequests: string[] = [];

    page.on("request", (req) => {
      const url = req.url();
      const pageOrigin = new URL(page.url() || "http://localhost:3000").origin;
      if (url.includes("/api/auth/") && !url.startsWith(pageOrigin)) {
        crossOriginAuthRequests.push(url);
      }
    });

    await page.goto("/tr/login");

    // Trigger a sign-in attempt (will fail with wrong creds, but request is sent)
    await page.getByLabel(/e-posta/i).fill("test@example.com");
    await page.getByLabel(/şifre/i).fill("wrongpassword");
    await page.getByRole("button", { name: /giriş yap/i }).click();

    // Wait for auth request to complete
    await page.waitForTimeout(2000);

    expect(crossOriginAuthRequests).toHaveLength(0);
  });

  test("login page does not set auth baseURL to a different origin", async ({ page }) => {
    // Intercept the sign-in request and verify it goes to the same host as the page
    const authRequestOrigins: string[] = [];

    page.on("request", (req) => {
      if (req.url().includes("/api/auth/sign-in")) {
        authRequestOrigins.push(new URL(req.url()).origin);
      }
    });

    await page.goto("/tr/login");
    const pageOrigin = new URL(page.url()).origin;

    await page.getByLabel(/e-posta/i).fill("check@example.com");
    await page.getByLabel(/şifre/i).fill("checkpass");
    await page.getByRole("button", { name: /giriş yap/i }).click();
    await page.waitForTimeout(2000);

    for (const origin of authRequestOrigins) {
      expect(origin).toBe(pageOrigin);
    }
  });

  test("login page loads without CORS errors in console", async ({ page }) => {
    const corsErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error" && msg.text().toLowerCase().includes("cors")) {
        corsErrors.push(msg.text());
      }
    });

    await page.goto("/tr/login");
    await page.waitForLoadState("networkidle");

    expect(corsErrors).toHaveLength(0);
  });
});
