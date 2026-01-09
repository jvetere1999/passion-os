/**
 * Hub (Shortcuts) E2E Tests
 */

import { test, expect } from "@playwright/test";

test.describe("Hub Page", () => {
  test("should display hub page with DAW list", async ({ page }) => {
    await page.goto("/hub");

    // Check page title
    await expect(page).toHaveTitle(/Shortcuts Hub/);

    // Check heading
    await expect(
      page.getByRole("heading", { name: /Shortcuts Hub/i })
    ).toBeVisible();

    // Check for DAW cards
    await expect(page.getByText("Ableton Live")).toBeVisible();
    await expect(page.getByText("Logic Pro")).toBeVisible();
    await expect(page.getByText("FL Studio")).toBeVisible();
  });

  test("should have search input", async ({ page }) => {
    await page.goto("/hub");

    // Check for search
    await expect(
      page.getByPlaceholder(/Search shortcuts/i)
    ).toBeVisible();
  });

  test("should display quick tips section", async ({ page }) => {
    await page.goto("/hub");

    // Check for tips
    await expect(page.getByText(/Quick Tips/i)).toBeVisible();
    await expect(page.getByText(/Learn incrementally/i)).toBeVisible();
  });

  test("should navigate to DAW detail page", async ({ page }) => {
    await page.goto("/hub");

    // Click on Ableton
    await page.getByText("Ableton Live").click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/hub\/ableton/);

    // Check for shortcuts
    await expect(page.getByText(/Play \/ Stop/i)).toBeVisible();
  });
});

test.describe("DAW Detail Page", () => {
  test("should display Ableton shortcuts", async ({ page }) => {
    await page.goto("/hub/ableton");

    // Check page title
    await expect(page).toHaveTitle(/Ableton Live/);

    // Check heading
    await expect(
      page.getByRole("heading", { name: /Ableton Live/i })
    ).toBeVisible();

    // Check for category sections
    await expect(page.getByText("Transport")).toBeVisible();
    await expect(page.getByText("Editing")).toBeVisible();
  });

  test("should display keyboard shortcuts with keys", async ({ page }) => {
    await page.goto("/hub/ableton");

    // Check for kbd elements
    const kbdElements = page.locator("kbd");
    await expect(kbdElements.first()).toBeVisible();

    // Check for specific shortcut
    await expect(page.getByText("Space")).toBeVisible();
  });

  test("should have back link to hub", async ({ page }) => {
    await page.goto("/hub/ableton");

    // Check for back link
    const backLink = page.getByText(/Back to Hub/i);
    await expect(backLink).toBeVisible();

    // Click and verify navigation
    await backLink.click();
    await expect(page).toHaveURL(/\/hub$/);
  });

  test("should display FL Studio shortcuts", async ({ page }) => {
    await page.goto("/hub/flstudio");

    await expect(
      page.getByRole("heading", { name: /FL Studio/i })
    ).toBeVisible();

    // Check for FL-specific shortcuts
    await expect(page.getByText("Playlist")).toBeVisible();
  });

  test("should show 404 for invalid DAW", async ({ page }) => {
    const response = await page.goto("/hub/invalid-daw");

    // Should return 404
    expect(response?.status()).toBe(404);
  });
});

