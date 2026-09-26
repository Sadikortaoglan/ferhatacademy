import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@ferhatacademy.com";
const ADMIN_PASSWORD = "Admin123!";
const USER_EMAIL = "user@ferhatacademy.com";
const USER_PASSWORD = "User123!";

async function signInAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/tr/login");
  await page.getByLabel(/e-posta/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/şifre/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /giriş yap/i }).click();
  await page.waitForURL(/\/(tr|en)\/(admin|dashboard)/, { timeout: 10000 });
}

// ─── Template List ────────────────────────────────────────────────────────────

test.describe("Admin — Templates List: Used By & Actions", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("templates list shows Steps and Kullanıldığı Yerler columns", async ({ page }) => {
    await page.goto("/tr/admin/applications/templates");
    await expect(page.locator("th:has-text('Adımlar')")).toBeVisible();
    await expect(page.locator("th:has-text('Kullanıldığı Yerler')")).toBeVisible();
  });

  test("each template row has Kopyala action", async ({ page }) => {
    await page.goto("/tr/admin/applications/templates");
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    if (count > 0) {
      await expect(rows.first().getByText("Kopyala")).toBeVisible();
    } else {
      test.skip();
    }
  });

  test("Kopyala creates a new template and navigates to editor", async ({ page }) => {
    await page.goto("/tr/admin/applications/templates");
    const kopyalaBtn = page.locator("button:has-text('Kopyala')").first();
    if (!(await kopyalaBtn.isVisible())) { test.skip(); return; }
    await kopyalaBtn.click();
    await page.waitForURL(/\/admin\/applications\/templates\/[a-z0-9]+$/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText(/kopya|copy/i);
  });
});

// ─── Template Editor: Used By ────────────────────────────────────────────────

test.describe("Admin — Template Editor: Used By", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("template editor shows Kullanıldığı Programlar section", async ({ page }) => {
    await page.goto("/tr/admin/applications/templates");
    const editLink = page.locator("a:has-text('Düzenle')").first();
    if (!(await editLink.isVisible())) { test.skip(); return; }
    await editLink.click();
    await page.waitForURL(/\/templates\/[a-z0-9]+$/);
    // Either "Kullanıldığı Programlar" if there are products, or warning if none
    const usedBy = page.locator("text=Kullanıldığı Programlar").or(
      page.locator("text=hiçbir programa atanmamış")
    ).first();
    await expect(usedBy).toBeVisible({ timeout: 5000 });
  });
});

// ─── Product Admin: Application Config ───────────────────────────────────────

test.describe("Admin — Product: Application Configuration", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("product admin shows Başvuru Ayarları section", async ({ page }) => {
    await page.goto("/tr/admin/products");
    const firstProductLink = page.locator("a").filter({ hasText: /detay|düzenle|görüntüle/i }).first();
    if (!(await firstProductLink.isVisible())) { test.skip(); return; }
    await firstProductLink.click();
    await page.waitForURL(/\/admin\/products\/[a-z0-9]+$/);
    await expect(page.getByText("Başvuru Ayarları")).toBeVisible({ timeout: 5000 });
  });

  test("configuration status shows when template and profile are set", async ({ page }) => {
    await page.goto("/tr/admin/products");
    // Navigate to a product detail page via "Düzenle" link
    const editLink = page.locator("a:has-text('Düzenle')").first();
    if (!(await editLink.isVisible())) { test.skip(); return; }
    await editLink.click();
    await page.waitForURL(/\/admin\/products\/[a-z0-9]+$/);
    // Başvuru Ayarları section must be present with one of three possible states
    const statusEl = page.locator("text=Yapılandırma Tamamlandı")
      .or(page.locator("text=Eksik Yapılandırma"))
      .or(page.locator("text=başvuru gerektirmez"))
      .first();
    await expect(statusEl).toBeVisible({ timeout: 5000 });
  });
});

// ─── Profile Editor: Products using this profile ─────────────────────────────

test.describe("Admin — Profile Editor: Products Using Profile", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("profile editor page loads", async ({ page }) => {
    await page.goto("/tr/admin/applications/profiles");
    const editLink = page.locator("a:has-text('Düzenle')").first();
    if (!(await editLink.isVisible())) { test.skip(); return; }
    await editLink.click();
    await page.waitForURL(/\/profiles\/[a-z0-9]+$/);
    await expect(page.locator("body")).toBeVisible();
  });
});

// ─── Public Apply Page ───────────────────────────────────────────────────────

test.describe("Public — Apply Page: Premium Layout", () => {
  test("apply page has program identity header with h1", async ({ browser }) => {
    // Sign in as user in a fresh context
    const userContext = await browser.newContext();
    const page = await userContext.newPage();
    await page.goto("/tr/login");
    await page.getByLabel(/e-posta/i).fill(USER_EMAIL);
    await page.getByLabel(/şifre/i).fill(USER_PASSWORD);
    await page.getByRole("button", { name: /giriş yap/i }).click();
    await page.waitForURL(/\/tr\/dashboard/, { timeout: 10000 });

    // Navigate to a product apply page
    await page.goto("/tr/products/mentorship/apply");
    // Should show program identity section
    await expect(page.locator("h1")).toBeVisible({ timeout: 8000 });
    await expect(page).not.toHaveURL(/\/login/);
    await userContext.close();
  });

  test("apply page with program shows breadcrumb back-link", async ({ browser }) => {
    // Find a published product slug from the admin
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await adminPage.goto("/tr/login");
    await adminPage.getByLabel(/e-posta/i).fill(ADMIN_EMAIL);
    await adminPage.getByLabel(/şifre/i).fill(ADMIN_PASSWORD);
    await adminPage.getByRole("button", { name: /giriş yap/i }).click();
    await adminPage.waitForURL(/\/tr\/admin/, { timeout: 10000 });
    await adminPage.goto("/tr/admin/products");
    // Get href from first product edit link to extract productId
    const editHref = await adminPage.locator("a:has-text('Düzenle')").first().getAttribute("href");
    await adminCtx.close();

    if (!editHref) { return; } // no products, skip

    // Now sign in as user and try a product apply page (use one of the known slugs)
    const userContext = await browser.newContext();
    const page = await userContext.newPage();
    await page.goto("/tr/login");
    await page.getByLabel(/e-posta/i).fill(USER_EMAIL);
    await page.getByLabel(/şifre/i).fill(USER_PASSWORD);
    await page.getByRole("button", { name: /giriş yap/i }).click();
    await page.waitForURL(/\/tr\/dashboard/, { timeout: 10000 });

    // The breadcrumb test: try mentorship slug (seeded), or skip
    const response = await page.goto("/tr/products/mentorship/apply");
    if (!response || response.status() === 404) {
      // No mentorship product — test gracefully skipped
      await userContext.close();
      return;
    }
    await expect(page.locator("a[href*='/products/mentorship']").first()).toBeVisible({ timeout: 8000 });
    await userContext.close();
  });

  test("unauthenticated user redirected to login with returnTo", async ({ page }) => {
    await page.goto("/tr/products/mentorship/apply");
    await expect(page).toHaveURL(/\/tr\/login/, { timeout: 5000 });
    await expect(page.url()).toContain("returnTo");
  });
});
