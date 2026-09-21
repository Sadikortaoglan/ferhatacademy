import { test, expect } from "@playwright/test";

// Credentials from seed data (dev environment)
const ADMIN_EMAIL = "admin@ferhatacademy.com";
const ADMIN_PASSWORD = "Admin123!";
const USER_EMAIL = "user@ferhatacademy.com";
const USER_PASSWORD = "User123!";

test.describe("Authentication", () => {
  test("login page renders and has required fields", async ({ page }) => {
    await page.goto("/tr/login");
    await expect(page.getByLabel(/e-posta/i)).toBeVisible();
    await expect(page.getByLabel(/şifre/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /giriş yap/i })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/tr/login");
    await page.getByLabel(/e-posta/i).fill("wrong@test.com");
    await page.getByLabel(/şifre/i).fill("wrongpassword");
    await page.getByRole("button", { name: /giriş yap/i }).click();
    await expect(page.getByText(/geçersiz|hatalı|invalid/i)).toBeVisible({ timeout: 5000 });
  });

  test("admin can log in and reach admin panel", async ({ page }) => {
    await page.goto("/tr/login");
    await page.getByLabel(/e-posta/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/şifre/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /giriş yap/i }).click();
    await page.waitForURL(/\/(tr|en)\/(admin|dashboard)/, { timeout: 10000 });
    await page.goto("/tr/admin");
    await expect(page).toHaveURL(/\/tr\/admin/);
  });

  test("regular user is redirected away from admin panel", async ({ page }) => {
    await page.goto("/tr/login");
    await page.getByLabel(/e-posta/i).fill(USER_EMAIL);
    await page.getByLabel(/şifre/i).fill(USER_PASSWORD);
    await page.getByRole("button", { name: /giriş yap/i }).click();
    await page.waitForURL(/\/(tr|en)\/dashboard/, { timeout: 10000 });
    // Attempt admin access
    await page.goto("/tr/admin");
    await expect(page).not.toHaveURL(/\/tr\/admin$/);
  });

  test("unauthenticated user is redirected to login from protected pages", async ({ page }) => {
    await page.goto("/tr/dashboard");
    await expect(page).toHaveURL(/\/tr\/login/, { timeout: 5000 });
  });

  test("unauthenticated user cannot access admin routes", async ({ page }) => {
    await page.goto("/tr/admin");
    await expect(page).toHaveURL(/\/tr\/login/, { timeout: 5000 });
  });
});
