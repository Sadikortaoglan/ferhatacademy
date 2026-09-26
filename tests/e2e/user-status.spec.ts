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

  test("deactivated user cannot log in", async ({ browser }) => {
    // Admin must use a SEPARATE browser context — shared context would reuse cookies
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto("/tr/login");
    await expect(adminPage).toHaveURL(/\/tr\/login/, { timeout: 5000 });
    await adminPage.getByLabel(/e-posta/i).fill(ADMIN_EMAIL);
    await adminPage.getByLabel(/şifre/i).fill(ADMIN_PASSWORD);
    await adminPage.getByRole("button", { name: /giriş yap/i }).click();
    await adminPage.waitForURL(/\/tr\/admin/, { timeout: 10000 });

    // Find the regular user and deactivate
    await adminPage.goto("/tr/admin/users");
    const detailLinks = adminPage.getByRole("link", { name: /detay|view/i });
    // Filter to find the test user — search if available
    const searchInput = adminPage.getByPlaceholder(/ara/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(USER_EMAIL);
      await adminPage.keyboard.press("Enter");
      await adminPage.waitForTimeout(500);
    }
    await detailLinks.first().click();
    await adminPage.waitForURL(/\/tr\/admin\/users\/.+/);

    // Deactivate — button text is "Hesabı Pasifleştir"
    const deactivateBtn = adminPage.getByRole("button", { name: /hesabı pasifleştir/i });
    const isAlreadyInactive = !(await deactivateBtn.isVisible());

    if (!isAlreadyInactive) {
      await deactivateBtn.click();
      // Confirm in dialog
      await adminPage.getByRole("button", { name: /hesabı pasifleştir/i }).last().click();
      await adminPage.waitForTimeout(1500);
    }

    // Now verify: a FRESH login attempt as the deactivated user must fail.
    // Use a separate context so there is no existing session for the user.
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    await userPage.goto("/tr/login");
    await userPage.getByLabel(/e-posta/i).fill(USER_EMAIL);
    await userPage.getByLabel(/şifre/i).fill(USER_PASSWORD);
    await userPage.getByRole("button", { name: /giriş yap/i }).click();
    // Should NOT redirect to dashboard — stays on login or shows banned message
    await userPage.waitForTimeout(2000);
    await expect(userPage).not.toHaveURL(/\/tr\/dashboard/, { timeout: 5000 });
    await userContext.close();

    // Re-activate the user so subsequent tests are not broken
    const reactivateBtn = adminPage.getByRole("button", { name: /hesabı aktifleştir/i });
    if (await reactivateBtn.isVisible()) {
      await reactivateBtn.click();
      await adminPage.getByRole("button", { name: /hesabı aktifleştir/i }).last().click();
      await adminPage.waitForTimeout(1000);
    }
    await adminContext.close();
  });
});
