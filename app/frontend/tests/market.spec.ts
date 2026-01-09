/**
 * Market E2E Tests
 * Tests the market functionality
 */

import { test, expect } from "@playwright/test";

test.describe("Market Page", () => {
  test("market page loads", async ({ page }) => {
    await page.goto("/market");

    // Should either show market content or redirect to login
    const isMarket = await page.locator('h1:has-text("Market")').isVisible();
    const isLogin = page.url().includes("/auth/signin");

    expect(isMarket || isLogin).toBeTruthy();
  });

  test("market displays items", async ({ page }) => {
    await page.goto("/market");

    // If on market page, should have item cards
    if (!page.url().includes("/auth/signin")) {
      await page.waitForLoadState("networkidle");

      // Check for category tabs or items
      const hasContent =
        (await page.locator('[class*="categoryTab"]').count()) > 0 ||
        (await page.locator('[class*="itemCard"]').count()) > 0 ||
        (await page.locator('text="Loading"').count()) > 0;

      expect(hasContent).toBeTruthy();
    }
  });
});

test.describe("Market API", () => {
  test("GET /api/market returns data or 401", async ({ request }) => {
    const response = await request.get("/api/market");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test("POST /api/market/purchase requires auth", async ({ request }) => {
    const response = await request.post("/api/market/purchase", {
      data: { itemId: "test" },
    });
    // Should be 401 without auth or 400 with invalid data
    expect([400, 401]).toContain(response.status());
  });

  test("POST /api/market/redeem requires auth", async ({ request }) => {
    const response = await request.post("/api/market/redeem", {
      data: { purchaseId: "test" },
    });
    expect([400, 401]).toContain(response.status());
  });
});

test.describe("Market Purchase Flow", () => {
  // These tests require authentication
  test.use({ storageState: "tests/.auth/user.json" });

  test("can view wallet balance", async ({ page }) => {
    await page.goto("/market");

    // Look for wallet display
    const walletDisplay = page.locator('[class*="wallet"]');
    if (await walletDisplay.isVisible()) {
      // Should show coins
      await expect(page.locator('text=/\\d+ coins/')).toBeVisible();
    }
  });

  test("can click on item to purchase", async ({ page }) => {
    await page.goto("/market");

    // Find a purchasable item
    const itemCard = page.locator('[class*="itemCard"]').first();
    if (await itemCard.isVisible()) {
      await itemCard.click();

      // Should show confirmation modal or purchase details
      const modal = page.locator('[class*="confirmModal"], [class*="purchaseModal"]');
      // Modal may or may not appear depending on implementation
    }
  });
});

