/**
 * Daily Plan E2E Tests
 * Tests daily plan generation and management
 *
 * Wave 4: Daily Plan routes (PARITY-055 to PARITY-058)
 */

import { test, expect } from "@playwright/test";

test.describe("Daily Plan API", () => {
  test("GET /api/daily-plan returns plan or null", async ({ request }) => {
    const response = await request.get("/api/daily-plan");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      // Plan may be null if not generated yet
      if (data.plan) {
        expect(data.plan.id).toBeDefined();
        expect(data.plan.date).toBeDefined();
        expect(data.plan.items).toBeDefined();
        expect(Array.isArray(data.plan.items)).toBe(true);
      }
    }
  });

  test("GET /api/daily-plan with date filter", async ({ request }) => {
    const today = new Date().toISOString().split("T")[0];
    const response = await request.get(`/api/daily-plan?date=${today}`);
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test("POST /api/daily-plan with generate action", async ({ request }) => {
    const today = new Date().toISOString().split("T")[0];
    const response = await request.post("/api/daily-plan", {
      data: {
        action: "generate",
        date: today,
      },
    });
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      // May or may not have plan based on existing data
      if (data.plan) {
        expect(data.plan.date).toBe(today);
      }
    }
  });

  test("POST /api/daily-plan with complete_item action", async ({ request }) => {
    // First generate a plan
    const today = new Date().toISOString().split("T")[0];
    await request.post("/api/daily-plan", {
      data: {
        action: "generate",
        date: today,
      },
    });

    // Get the plan
    const getResponse = await request.get(`/api/daily-plan?date=${today}`);
    if (getResponse.status() === 200) {
      const getData = await getResponse.json();
      if (getData.plan && getData.plan.items.length > 0) {
        const itemId = getData.plan.items[0].id;

        // Complete the item
        const completeResponse = await request.post("/api/daily-plan", {
          data: {
            action: "complete_item",
            date: today,
            item_id: itemId,
            completed: true,
          },
        });
        expect([200, 401]).toContain(completeResponse.status());
      }
    }
  });
});

test.describe("Daily Plan UI", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("today page loads with daily plan section", async ({ page }) => {
    await page.goto("/today");
    await expect(page).toHaveTitle(/Ignition/);

    // The today page should have some content
    await expect(page.locator("main")).toBeVisible();
  });

  test("can interact with plan items", async ({ page }) => {
    await page.goto("/today");

    // Look for plan items or generate button
    const planItem = page.locator('[data-testid="plan-item"], .plan-item').first();
    const generateButton = page.locator(
      'button:has-text("Generate Plan"), button:has-text("Plan My Day")'
    );

    if (await generateButton.isVisible()) {
      await generateButton.click();
      // Wait for plan to load
      await page.waitForTimeout(1000);
    }

    if (await planItem.isVisible()) {
      // Check checkbox or complete button
      const checkbox = planItem.locator('input[type="checkbox"]');
      if (await checkbox.isVisible()) {
        const wasChecked = await checkbox.isChecked();
        await checkbox.click();
        // State should toggle
        expect(await checkbox.isChecked()).not.toBe(wasChecked);
      }
    }
  });
});
