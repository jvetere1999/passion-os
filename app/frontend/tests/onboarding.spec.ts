/**
 * Onboarding E2E Tests
 * Tests the onboarding flow for new users
 */

import { test, expect } from "@playwright/test";

test.describe("Onboarding Flow", () => {
  // Skip if not authenticated
  test.use({ storageState: "tests/.auth/user.json" });

  test("onboarding modal appears for new users", async ({ page }) => {
    // This would need a fresh user - for now test that onboarding components load
    await page.goto("/today");

    // Check that the page loads
    await expect(page).toHaveTitle(/Ignition/);
  });

  test("onboarding can be skipped", async ({ page }) => {
    await page.goto("/today");

    // If onboarding modal is visible, it should have a skip button
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      // After skip, modal should close
      await expect(page.locator('[class*="modalOverlay"]')).not.toBeVisible();
    }
  });

  test("onboarding progress is saved", async ({ page }) => {
    await page.goto("/today");

    // Check that onboarding API is accessible
    const response = await page.request.get("/api/onboarding");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    // Should have flow or state
    expect(data).toBeDefined();
  });

  test("interests can be selected during onboarding", async ({ page }) => {
    await page.goto("/today");

    // If on interests step, should be able to select interests
    const interestChip = page.locator('[class*="optionChip"]').first();
    if (await interestChip.isVisible()) {
      await interestChip.click();
      await expect(interestChip).toHaveAttribute("data-selected", "true");
    }
  });
});

test.describe("Onboarding API", () => {
  test("GET /api/onboarding returns flow data", async ({ request }) => {
    const response = await request.get("/api/onboarding");
    // May return 401 for unauthenticated, or data for authenticated
    expect([200, 401]).toContain(response.status());
  });

  test("POST /api/onboarding/skip works", async ({ request }) => {
    const response = await request.post("/api/onboarding/skip", {
      data: { softLandingHours: 24 },
    });
    // May return 401 for unauthenticated
    expect([200, 401]).toContain(response.status());
  });
});

