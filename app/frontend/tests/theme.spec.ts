/**
 * Theme E2E Tests
 */

import { test, expect } from "@playwright/test";

test.describe("Theme System", () => {
  test("should have data-theme attribute on html", async ({ page }) => {
    await page.goto("/");

    const html = page.locator("html");
    const theme = await html.getAttribute("data-theme");

    // Theme should be set (light or dark)
    expect(theme).toMatch(/^(light|dark)$/);
  });

  test("should respect system preference for dark mode", async ({ page }) => {
    // Emulate dark mode preference
    await page.emulateMedia({ colorScheme: "dark" });

    await page.goto("/");

    const html = page.locator("html");
    const theme = await html.getAttribute("data-theme");

    expect(theme).toBe("dark");
  });

  test("should respect system preference for light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });

    await page.goto("/");

    const html = page.locator("html");
    const theme = await html.getAttribute("data-theme");

    expect(theme).toBe("light");
  });

  test("should apply dark class for dark theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });

    await page.goto("/");

    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);
  });

  test("should have CSS custom properties defined", async ({ page }) => {
    await page.goto("/");

    // Check that CSS custom properties are defined
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue(
        "--color-bg-primary"
      );
    });

    expect(bgColor).toBeTruthy();
    expect(bgColor.trim()).not.toBe("");
  });

  test("should have different colors for light and dark themes", async ({
    page,
  }) => {
    // Get light theme color
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");

    const lightBg = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue(
        "--color-bg-primary"
      );
    });

    // Get dark theme color
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");

    const darkBg = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue(
        "--color-bg-primary"
      );
    });

    // Colors should be different
    expect(lightBg.trim()).not.toBe(darkBg.trim());
  });
});

test.describe("Theme Persistence", () => {
  test("should persist theme choice in localStorage", async ({ page }) => {
    await page.goto("/");

    // Set theme via localStorage (simulating user choice)
    await page.evaluate(() => {
      localStorage.setItem("passion-os-theme", "dark");
    });

    // Reload page
    await page.reload();

    // Check theme is applied
    const html = page.locator("html");
    const theme = await html.getAttribute("data-theme");

    expect(theme).toBe("dark");
  });
});

