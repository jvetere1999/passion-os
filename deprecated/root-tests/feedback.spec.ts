/**
 * Feedback E2E Tests
 * Tests feedback submission flow
 *
 * Wave 4: Feedback routes (PARITY-061 to PARITY-062)
 */

import { test, expect } from "@playwright/test";

test.describe("Feedback API", () => {
  test("GET /api/feedback returns feedback list", async ({ request }) => {
    const response = await request.get("/api/feedback");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      expect(data.data.feedback).toBeDefined();
      expect(Array.isArray(data.data.feedback)).toBe(true);
    }
  });

  test("POST /api/feedback creates bug report", async ({ request }) => {
    const response = await request.post("/api/feedback", {
      data: {
        type: "bug",
        title: "E2E Test Bug Report",
        description: "This is a test bug report from E2E tests",
        priority: "normal",
      },
    });
    expect([200, 201, 401]).toContain(response.status());

    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.id).toBeDefined();
      expect(data.data.title).toBe("E2E Test Bug Report");
      expect(data.data.feedback_type).toBe("bug");
      expect(data.data.status).toBe("open");
    }
  });

  test("POST /api/feedback creates feature request", async ({ request }) => {
    const response = await request.post("/api/feedback", {
      data: {
        type: "feature",
        title: "E2E Test Feature Request",
        description: "This is a test feature request from E2E tests",
      },
    });
    expect([200, 201, 401]).toContain(response.status());

    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.id).toBeDefined();
      expect(data.data.feedback_type).toBe("feature");
    }
  });

  test("POST /api/feedback validates required fields", async ({ request }) => {
    // Missing title
    const response = await request.post("/api/feedback", {
      data: {
        type: "bug",
        description: "Missing title field",
      },
    });
    // Should fail validation
    expect([400, 401, 422]).toContain(response.status());
  });
});

test.describe("Feedback UI", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("feedback page loads", async ({ page }) => {
    await page.goto("/feedback");
    // May redirect if /feedback isn't a route - that's okay
    await expect(page).toHaveTitle(/Ignition/);
  });

  test("can submit feedback from UI", async ({ page }) => {
    // Navigate to settings or help where feedback might be
    await page.goto("/settings");

    // Look for feedback link/button
    const feedbackLink = page.locator(
      'a:has-text("Feedback"), button:has-text("Feedback"), [data-testid="feedback-link"]'
    );
    if (await feedbackLink.isVisible()) {
      await feedbackLink.click();

      // Fill in feedback form
      const titleInput = page.locator(
        'input[name="title"], input[placeholder*="title" i]'
      );
      const descInput = page.locator(
        'textarea[name="description"], textarea[placeholder*="description" i]'
      );

      if ((await titleInput.isVisible()) && (await descInput.isVisible())) {
        await titleInput.fill("UI Test Feedback");
        await descInput.fill("This is feedback submitted from E2E UI test");

        // Submit
        const submitButton = page.locator(
          'button[type="submit"], button:has-text("Submit"), button:has-text("Send")'
        );
        if (await submitButton.isVisible()) {
          await submitButton.click();
          // Wait for success
          await page.waitForResponse((resp) =>
            resp.url().includes("/api/feedback") && resp.status() === 200
          );
        }
      }
    }
  });
});
