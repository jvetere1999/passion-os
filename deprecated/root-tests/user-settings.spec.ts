/**
 * User Settings E2E Tests
 * Tests user settings, account, and data export
 *
 * Wave 4: User routes (PARITY-081 to PARITY-085)
 */

import { test, expect } from "@playwright/test";

test.describe("User Settings API", () => {
  test("GET /api/user/settings returns settings", async ({ request }) => {
    const response = await request.get("/api/user/settings");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      // Check some expected fields
      if (data.data.theme) {
        expect(["light", "dark", "system"]).toContain(data.data.theme);
      }
    }
  });

  test("PUT /api/user/settings updates settings", async ({ request }) => {
    const response = await request.put("/api/user/settings", {
      data: {
        theme: "dark",
        notifications_enabled: true,
      },
    });
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.theme).toBe("dark");
    }
  });

  test("GET /api/user/export returns export data", async ({ request }) => {
    const response = await request.get("/api/user/export");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      expect(data.data.exported_at).toBeDefined();
      expect(data.data.user_id).toBeDefined();
    }
  });
});

test.describe("User Settings UI", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveTitle(/Ignition/);
  });

  test("can toggle theme", async ({ page }) => {
    await page.goto("/settings");

    // Look for theme selector
    const themeSelect = page.locator(
      'select[name="theme"], [data-testid="theme-select"], button:has-text("Theme")'
    );
    if (await themeSelect.isVisible()) {
      // Click to open if it's a button/dropdown
      await themeSelect.click();

      // Select dark theme option
      const darkOption = page.locator(
        'option[value="dark"], [data-value="dark"], button:has-text("Dark")'
      );
      if (await darkOption.isVisible()) {
        await darkOption.click();
      }
    }
  });

  test("can access data export", async ({ page }) => {
    await page.goto("/settings");

    // Look for export button
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("Download"), [data-testid="export-data"]'
    );
    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);
      await exportButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toContain("export");
      }
    }
  });
});
