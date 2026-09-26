import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@ferhatacademy.com";
const ADMIN_PASSWORD = "Admin123!";

async function signInAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/tr/login");
  await page.getByLabel(/e-posta/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/şifre/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /giriş yap/i }).click();
  await page.waitForURL(/\/(tr|en)\/(admin|dashboard)/, { timeout: 10000 });
  await page.goto("/tr/admin");
}

// Always navigates to the template editor page (not just the list).
async function getOrCreateTemplate(page: import("@playwright/test").Page): Promise<string> {
  await page.goto("/tr/admin/applications/templates");
  const editLinks = page.locator("a:has-text('Düzenle')");
  const count = await editLinks.count();
  if (count > 0) {
    const href = await editLinks.first().getAttribute("href");
    await page.goto(href!);
    await page.waitForURL(/\/templates\/[a-z0-9]+$/, { timeout: 8000 });
    return page.url().split("/").pop() ?? "";
  }
  // No templates — create one
  await page.goto("/tr/admin/applications/templates/new");
  const key = `e2e_funnel_${Date.now()}`;
  await page.locator("input[type='text']").nth(0).fill(key);
  await page.locator("input[type='text']").nth(1).fill("Funnel E2E Şablonu");
  await page.locator("input[type='text']").nth(2).fill("Funnel E2E Template");
  await page.getByRole("button", { name: /Şablon Oluştur/i }).click();
  await page.waitForURL(/\/templates\/[a-z0-9]+$/, { timeout: 8000 });
  return page.url().split("/").pop() ?? "";
}

// ─── Step Management UI ──────────────────────────────────────────────────────

test.describe("Admin — Template Editor: Step Management", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("Steps tab is visible in template editor", async ({ page }) => {
    await getOrCreateTemplate(page);
    // Tab labels are "Adımlar (N)" — getByRole button with partial name match
    await expect(page.getByRole("button", { name: /adımlar/i })).toBeVisible({ timeout: 5000 });
  });

  test("can switch to Steps tab", async ({ page }) => {
    await getOrCreateTemplate(page);
    await page.getByRole("button", { name: /adımlar/i }).click();
    // After clicking the tab, the always-visible "Yeni Adım Ekle" section appears
    await expect(page.getByText("Yeni Adım Ekle")).toBeVisible({ timeout: 5000 });
  });

  test("can add a new step", async ({ page }) => {
    await getOrCreateTemplate(page);
    await page.getByRole("button", { name: /adımlar/i }).click();
    // The add form is always rendered; inputs use placeholder "Başlık (TR)"
    const titleInput = page.locator("input[placeholder='Başlık (TR)']");
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill("E2E Test Adımı");
    // Submit button is "+ Adım Ekle"
    await page.getByRole("button", { name: /\+ adım ekle/i }).click();
    // New step should appear in the list
    await expect(page.getByText("E2E Test Adımı")).toBeVisible({ timeout: 8000 });
  });
});

// ─── Conditional Logic Builder UI ────────────────────────────────────────────

test.describe("Admin — Template Editor: Conditional Logic", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("question editor shows condition section", async ({ page }) => {
    await getOrCreateTemplate(page);
    // Questions tab is default; look for edit buttons
    const editBtns = page.locator("button:has-text('Düzenle'), button[aria-label*='düzenle']");
    if ((await editBtns.count()) > 0) {
      await editBtns.first().click();
      // Editor should have a Koşul / Condition builder section
      await expect(
        page.locator("text=Koşul, text=Condition").first()
      ).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });
});

// ─── Form Preview Tab ─────────────────────────────────────────────────────────

test.describe("Admin — Template Editor: Form Preview", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("Preview tab is visible in template editor", async ({ page }) => {
    await getOrCreateTemplate(page);
    // Tab label is exactly "Önizleme"
    await expect(page.getByRole("button", { name: "Önizleme" })).toBeVisible({ timeout: 5000 });
  });

  test("can switch to Preview tab and see preview UI", async ({ page }) => {
    await getOrCreateTemplate(page);
    await page.getByRole("button", { name: "Önizleme" }).click();
    // Preview renders "Form Önizlemesi" heading
    await expect(page.getByText("Form Önizlemesi")).toBeVisible({ timeout: 5000 });
  });
});

// ─── Notification Settings Page ───────────────────────────────────────────────

test.describe("Admin — Application Notification Settings", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("notification settings page loads", async ({ page }) => {
    await page.goto("/tr/admin/applications/settings");
    await expect(page.locator("h1")).toContainText(/bildirim|ayar|notification/i);
  });

  test("settings page has toggle switches", async ({ page }) => {
    await page.goto("/tr/admin/applications/settings");
    const toggles = page.locator("button[role='switch'], input[type='checkbox']");
    await expect(toggles.first()).toBeVisible({ timeout: 5000 });
  });

  test("settings sidebar link exists", async ({ page }) => {
    await page.goto("/tr/admin/applications");
    const settingsLink = page.locator("a[href*='/admin/applications/settings']");
    await expect(settingsLink).toBeVisible({ timeout: 5000 });
  });
});

// ─── UTM capture on apply page ────────────────────────────────────────────────

test.describe("Apply Page — UTM capture", () => {
  test("apply page with UTM params does not crash", async ({ page }) => {
    await page.goto("/tr/products/mentorship/apply?utm_source=instagram&utm_medium=story&utm_campaign=test");
    await expect(page).not.toHaveURL(/500|error/i);
    await expect(page.locator("body")).toBeVisible();
  });
});

// ─── Admin Sidebar ─────────────────────────────────────────────────────────────

test.describe("Admin Sidebar — Application settings link", () => {
  test("sidebar contains Başvuru Bildirimleri link", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/tr/admin/applications");
    const link = page.locator(
      "a:has-text('Başvuru Bildirimleri'), a:has-text('Application Notifications')"
    ).first();
    await expect(link).toBeVisible({ timeout: 5000 });
  });
});
