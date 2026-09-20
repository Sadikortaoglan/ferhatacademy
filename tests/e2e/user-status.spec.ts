import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = "admin@ferhatacademy.com";
const ADMIN_PASSWORD = "Admin123!";
const USER_EMAIL = "user@ferhatacademy.com";
const USER_PASSWORD = "User123!";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/tr/login");
  await page.getByLabel(/e-posta/i).fill(email);
  await page.getByLabel(/şifre/i).fill(password);
  await page.getByRole("button", { name: /giriş yap/i }).click();
  await page.waitForURL(/\/(tr|en)\/(admin|dashboard)/, { timeout: 10000 });
}

test.describe("User Status — deactivate / reactivate", () => {
  test("admin can see user status controls on user detail page", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/tr/admin/users");
    // Click into the first listed user's detail
    const firstDetailLink = page.getByRole("link", { name: /detay|view/i }).first();
    await firstDetailLink.click();
    await expect(page).toHaveURL(/\/tr\/admin\/users\/.+/);
    // Status section should be visible
    await expect(page.getByText(/hesap durumu|account status/i)).toBeVisible();
  });

  test("deactivated user cannot access the member dashboard", async ({ page, context }) => {
    // Login as user first to get a session
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await expect(page).toHaveURL(/\/tr\/dashboard/);

    // Login as admin in a second tab and deactivate the user
    const adminPage = await context.newPage();
    await adminPage.goto("/tr/login");
    await adminPage.getByLabel(/e-posta/i).fill(ADMIN_EMAIL);
    await adminPage.getByLabel(/şifre/i).fill(ADMIN_PASSWORD);
    await adminPage.getByRole("button", { name: /giriş yap/i }).click();
    await adminPage.waitForURL(/\/tr\/admin/, { timeout: 10000 });

    // Find the regular user and deactivate
    await adminPage.goto("/tr/admin/users");
    await adminPage.getByPlaceholder(/ara/i).fill(USER_EMAIL);
    await adminPage.keyboard.press("Enter");
    await adminPage.getByRole("link", { name: /detay|view/i }).first().click();
    await adminPage.waitForURL(/\/tr\/admin\/users\/.+/);

    const deactivateBtn = adminPage.getByRole("button", { name: /pasifleştir/i });
    if (await deactivateBtn.isVisible()) {
      await deactivateBtn.click();
      // Confirm dialog
      const confirmBtn = adminPage.getByRole("button", { name: /pasifleştir/i }).last();
      await confirmBtn.click();
      await adminPage.waitForTimeout(1000);
    }

    // Now try to navigate in the user page — session should be invalidated
    await page.goto("/tr/dashboard");
    // Should redirect to login since session was deleted
    await expect(page).toHaveURL(/\/tr\/login/, { timeout: 8000 });

    // Re-activate the user so other tests aren't broken
    const reactivateBtn = adminPage.getByRole("button", { name: /aktifleştir/i });
    if (await reactivateBtn.isVisible()) {
      await reactivateBtn.click();
      await adminPage.getByRole("button", { name: /aktifleştir/i }).last().click();
    }
    await adminPage.close();
  });
});
