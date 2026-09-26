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
  await page.goto("/tr/admin");
}

async function signInAsUser(page: import("@playwright/test").Page) {
  await page.goto("/tr/login");
  await page.getByLabel(/e-posta/i).fill(USER_EMAIL);
  await page.getByLabel(/şifre/i).fill(USER_PASSWORD);
  await page.getByRole("button", { name: /giriş yap/i }).click();
  await page.waitForURL(/\/(tr|en)\/dashboard/, { timeout: 10000 });
}

test.describe("Admin — Form Template Builder", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("template list page loads", async ({ page }) => {
    await page.goto("/tr/admin/applications/templates");
    await expect(page.locator("h1")).toContainText("Form Şablonları");
    // Either table rows or empty state must be visible
    await expect(page.locator("table tbody tr, p:has-text('şablon yok')").first()).toBeVisible({ timeout: 5000 });
  });

  test("new template page loads", async ({ page }) => {
    await page.goto("/tr/admin/applications/templates/new");
    await expect(page.locator("h1")).toContainText("Yeni Form Şablonu");
    await expect(page.getByRole("button", { name: /Şablon Oluştur/i })).toBeVisible();
  });

  test("can create a new template", async ({ page }) => {
    await page.goto("/tr/admin/applications/templates/new");
    const key = `e2e_${Date.now()}`;
    // Fill key field (first text input after the select)
    await page.locator("input[type='text']").nth(0).fill(key);
    await page.locator("input[type='text']").nth(1).fill("E2E Test Şablonu");
    await page.locator("input[type='text']").nth(2).fill("E2E Test Template");
    await page.getByRole("button", { name: /Şablon Oluştur/i }).click();
    // Redirects to editor
    await expect(page).toHaveURL(/\/templates\/[a-z0-9]+$/, { timeout: 8000 });
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("template editor loads for existing template", async ({ page }) => {
    // First create one, then visit it
    await page.goto("/tr/admin/applications/templates");
    const editLinks = page.locator("a:has-text('Düzenle')");
    const count = await editLinks.count();
    if (count > 0) {
      await editLinks.first().click();
      await expect(page).toHaveURL(/\/templates\/[a-z0-9]+$/);
      await expect(page.locator("button:has-text('+ Soru Ekle')")).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });
});

test.describe("Admin — Navigation Page", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("navigation page loads with nav editor", async ({ page }) => {
    await page.goto("/tr/admin/website/navigation");
    await expect(page.locator("h1")).toContainText("Navigasyon");
    await expect(page.locator("button:has-text('+ Menü Öğesi Ekle')")).toBeVisible({ timeout: 5000 });
  });

  test("can open add nav item form", async ({ page }) => {
    await page.goto("/tr/admin/website/navigation");
    await page.getByRole("button", { name: /Menü Öğesi Ekle/i }).click();
    await expect(page.locator("text=Yeni Menü Öğesi")).toBeVisible({ timeout: 3000 });
    await expect(page.locator("input[placeholder='Kurslar']")).toBeVisible();
  });
});

test.describe("Admin — Page Profile Editor", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("profiles list page loads", async ({ page }) => {
    await page.goto("/tr/admin/applications/profiles");
    await expect(page.locator("h1")).toContainText("Başvuru Sayfa Profilleri");
    await expect(page.locator("a:has-text('+ Yeni Profil')")).toBeVisible();
  });

  test("new profile page loads", async ({ page }) => {
    await page.goto("/tr/admin/applications/profiles/new");
    await expect(page.locator("h1")).toContainText("Yeni Sayfa Profili");
    await expect(page.getByRole("button", { name: /Profil Oluştur/i })).toBeVisible();
  });
});

test.describe("Admin — Applications List", () => {
  test("applications list page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/tr/admin/applications");
    await expect(page).toHaveURL(/\/tr\/admin\/applications/);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Apply Page — Auth guard", () => {
  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/tr/products/some-product/apply");
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

test.describe("Member Dashboard — Applications", () => {
  test("member can view applications page", async ({ page }) => {
    await signInAsUser(page);
    await page.goto("/tr/dashboard/applications");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
  });
});
