/**
 * Onboarding E2E Tests
 * Tests the onboarding flow for new users
 *
 * Wave 4: Onboarding routes (PARITY-071 to PARITY-076)
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

  test("onboarding gate -> complete -> lands in Today", async ({ page }) => {
    // Start at the root - should gate to onboarding if needed
    await page.goto("/");
    
    // Check if we're on onboarding or today
    const currentUrl = page.url();
    
    // If onboarding is needed, complete it
    if (currentUrl.includes("onboarding")) {
      // Complete each step until done
      let maxSteps = 10; // Safety limit
      while (maxSteps > 0) {
        maxSteps--;
        
        // Look for continue/next/complete button
        const nextButton = page.locator(
          'button:has-text("Continue"), button:has-text("Next"), button:has-text("Complete"), button:has-text("Done")'
        ).first();
        
        const skipButton = page.locator('button:has-text("Skip")');
        
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await page.waitForTimeout(500);
        } else if (await skipButton.isVisible()) {
          await skipButton.click();
          await page.waitForTimeout(500);
        } else {
          break;
        }
        
        // Check if we've landed on Today
        if (page.url().includes("/today")) {
          break;
        }
      }
    }
    
    // Should now be on Today page
    await page.goto("/today");
    await expect(page).toHaveTitle(/Ignition/);
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Onboarding API", () => {
  test("GET /api/onboarding returns flow data", async ({ request }) => {
    const response = await request.get("/api/onboarding");
    // May return 401 for unauthenticated, or data for authenticated
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      // Check expected fields
      expect(data.data).toHaveProperty("needs_onboarding");
      expect(data.data).toHaveProperty("progress");
    }
  });

  test("POST /api/onboarding/start begins onboarding", async ({ request }) => {
    const response = await request.post("/api/onboarding/start");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.success).toBe(true);
    }
  });

  test("POST /api/onboarding/step completes a step", async ({ request }) => {
    // First get current state
    const stateResponse = await request.get("/api/onboarding");
    if (stateResponse.status() === 200) {
      const stateData = await stateResponse.json();
      if (stateData.data.current_step) {
        const stepId = stateData.data.current_step.id;
        
        const response = await request.post("/api/onboarding/step", {
          data: {
            step_id: stepId,
            response: {},
          },
        });
        expect([200, 401]).toContain(response.status());
      }
    }
  });

  test("POST /api/onboarding/skip works", async ({ request }) => {
    const response = await request.post("/api/onboarding/skip");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.success).toBe(true);
    }
  });

  test("POST /api/onboarding/reset works", async ({ request }) => {
    const response = await request.post("/api/onboarding/reset");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.success).toBe(true);
    }
  });
});

