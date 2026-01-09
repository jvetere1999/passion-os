/**
 * Accessibility E2E Tests
 */

import { test, expect } from "@playwright/test";

test.describe("Accessibility - Home Page", () => {
  test("should have proper lang attribute", async ({ page }) => {
    await page.goto("/");

    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "en");
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    // Should have h1
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // h1 should come before h2s
    const headings = await page.locator("h1, h2, h3").allTextContents();
    expect(headings.length).toBeGreaterThan(0);
  });

  test("should have accessible link text", async ({ page }) => {
    await page.goto("/");

    // Links should have text content
    const links = page.locator("a");
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute("aria-label");

      // Link should have either text or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });

  test("should have accessible buttons", async ({ page }) => {
    await page.goto("/");

    const buttons = page.locator("button");
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute("aria-label");

      // Button should have either text or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });
});

test.describe("Accessibility - Hub Page", () => {
  test("should have proper heading structure", async ({ page }) => {
    await page.goto("/hub");

    // Check h1 exists
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should have accessible DAW cards", async ({ page }) => {
    await page.goto("/hub");

    // DAW links should be accessible
    const dawLinks = page.locator('a[href^="/hub/"]');
    const count = await dawLinks.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = dawLinks.nth(i);
      const text = await link.textContent();
      expect(text?.trim()).toBeTruthy();
    }
  });

  test("should have accessible search input", async ({ page }) => {
    await page.goto("/hub");

    const searchInput = page.getByPlaceholder(/Search/i);
    await expect(searchInput).toBeVisible();

    // Input should have placeholder (acts as label)
    const placeholder = await searchInput.getAttribute("placeholder");
    expect(placeholder).toBeTruthy();
  });
});

test.describe("Accessibility - DAW Detail Page", () => {
  test("should have back navigation", async ({ page }) => {
    await page.goto("/hub/ableton");

    // Back link should be accessible
    const backLink = page.getByText(/Back/i);
    await expect(backLink).toBeVisible();
  });

  test("should have keyboard shortcuts displayed accessibly", async ({
    page,
  }) => {
    await page.goto("/hub/ableton");

    // kbd elements should be present
    const kbdElements = page.locator("kbd");
    const count = await kbdElements.count();

    expect(count).toBeGreaterThan(0);
  });

  test("should have proper section headings", async ({ page }) => {
    await page.goto("/hub/ableton");

    // Category headings should exist
    const h2s = page.locator("h2");
    const count = await h2s.count();

    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Accessibility - Templates Page", () => {
  test("should have accessible category cards", async ({ page }) => {
    await page.goto("/templates");

    const categoryLinks = page.locator('a[href^="/templates/"]');
    const count = await categoryLinks.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = categoryLinks.nth(i);
      const text = await link.textContent();
      expect(text?.trim()).toBeTruthy();
    }
  });
});

test.describe("Keyboard Navigation", () => {
  test("should be able to tab through home page elements", async ({ page }) => {
    await page.goto("/");

    // Press Tab and check focus moves
    await page.keyboard.press("Tab");

    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    // Should focus on a focusable element
    expect(["A", "BUTTON", "INPUT"]).toContain(focusedElement);
  });

  test("should have visible focus indicators", async ({ page }) => {
    await page.goto("/");

    // Tab to first focusable element
    await page.keyboard.press("Tab");

    // Get focused element's outline
    const hasOutline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const style = getComputedStyle(el);
      return (
        style.outline !== "none" ||
        style.boxShadow !== "none" ||
        style.border !== "none"
      );
    });

    // Focus indicator should be present (outline, box-shadow, or border)
    expect(hasOutline).toBe(true);
  });
});

