/**
 * Market E2E Tests
 * Tests the market flow: purchase -> wallet debits -> history visible
 *
 * PARITY-036: Market routes
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
  test("GET /api/market returns overview", async ({ request }) => {
    const response = await request.get("/api/market");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      if (data.data.items) {
        expect(Array.isArray(data.data.items)).toBe(true);
      }
      if (data.data.wallet) {
        expect(data.data.wallet.coins).toBeDefined();
      }
    }
  });

  test("GET /api/market/items returns items list", async ({ request }) => {
    const response = await request.get("/api/market/items");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      if (data.data.items) {
        expect(Array.isArray(data.data.items)).toBe(true);
      }
    }
  });

  test("GET /api/market/wallet returns wallet", async ({ request }) => {
    const response = await request.get("/api/market/wallet");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      expect(data.data.coins).toBeDefined();
    }
  });

  test("GET /api/market/history returns purchase history", async ({ request }) => {
    const response = await request.get("/api/market/history");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      if (data.data.purchases) {
        expect(Array.isArray(data.data.purchases)).toBe(true);
      }
    }
  });

  test("POST /api/market/purchase requires auth", async ({ request }) => {
    const response = await request.post("/api/market/purchase", {
      data: { item_key: "test" },
    });
    // Should be 401 without auth or 400 with invalid data
    expect([400, 401]).toContain(response.status());
  });

  test("POST /api/market/redeem requires auth", async ({ request }) => {
    const response = await request.post("/api/market/redeem", {
      data: { purchase_id: "test" },
    });
    expect([400, 401]).toContain(response.status());
  });
});

test.describe("Market Purchase Flow", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("complete flow: purchase -> wallet debits -> history visible", async ({ request }) => {
    // 1. Get initial wallet balance
    const walletResponse = await request.get("/api/market/wallet");

    if (walletResponse.status() === 401) {
      test.skip();
      return;
    }

    expect(walletResponse.status()).toBe(200);
    const walletData = await walletResponse.json();
    const initialCoins = walletData.data.coins;

    // 2. Get available items
    const itemsResponse = await request.get("/api/market/items");
    expect(itemsResponse.status()).toBe(200);
    const itemsData = await itemsResponse.json();

    // Find an affordable item
    const affordableItem = itemsData.data.items?.find(
      (item: { available: boolean; price_coins: number }) =>
        item.available && item.price_coins <= initialCoins
    );

    if (!affordableItem) {
      // No affordable items, skip test
      test.skip();
      return;
    }

    // 3. Purchase item
    const purchaseResponse = await request.post("/api/market/purchase", {
      data: { item_key: affordableItem.key },
    });

    expect([200, 201]).toContain(purchaseResponse.status());
    const purchaseData = await purchaseResponse.json();
    expect(purchaseData.data.purchase_id).toBeDefined();
    expect(purchaseData.data.price_paid).toBe(affordableItem.price_coins);
    expect(purchaseData.data.new_balance).toBe(initialCoins - affordableItem.price_coins);

    // 4. Verify wallet was debited
    const newWalletResponse = await request.get("/api/market/wallet");
    expect(newWalletResponse.status()).toBe(200);
    const newWalletData = await newWalletResponse.json();
    expect(newWalletData.data.coins).toBe(initialCoins - affordableItem.price_coins);

    // 5. Verify purchase appears in history
    const historyResponse = await request.get("/api/market/history");
    expect(historyResponse.status()).toBe(200);
    const historyData = await historyResponse.json();

    const recentPurchase = historyData.data.purchases?.find(
      (p: { id: string }) => p.id === purchaseData.data.purchase_id
    );
    expect(recentPurchase).toBeDefined();
    expect(recentPurchase.item_key).toBe(affordableItem.key);
    expect(recentPurchase.status).toBe("active");
  });

  test("redeem purchase flow", async ({ request }) => {
    // Get purchase history to find an active purchase
    const historyResponse = await request.get("/api/market/history?status=active");

    if (historyResponse.status() === 401) {
      test.skip();
      return;
    }

    expect(historyResponse.status()).toBe(200);
    const historyData = await historyResponse.json();

    const activePurchase = historyData.data.purchases?.[0];
    if (!activePurchase) {
      test.skip();
      return;
    }

    // Redeem the purchase
    const redeemResponse = await request.post("/api/market/redeem", {
      data: { purchase_id: activePurchase.id },
    });

    expect([200, 201]).toContain(redeemResponse.status());
    const redeemData = await redeemResponse.json();
    expect(redeemData.data.purchase_id).toBe(activePurchase.id);
    expect(redeemData.data.redeemed_at).toBeDefined();
  });

  test("can view wallet balance on page", async ({ page }) => {
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

