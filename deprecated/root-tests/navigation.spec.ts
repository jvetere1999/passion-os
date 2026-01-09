/**
 * Navigation E2E Tests
 */

import { test, expect } from "@playwright/test";

test.describe("Main Navigation", () => {
  test("should display header on all pages", async ({ page }) => {
    await page.goto("/");

    // Check for header
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Check for brand
    await expect(page.getByText("Passion OS")).toBeVisible();
  });

  test("should navigate from home to about", async ({ page }) => {
    await page.goto("/");

    await page.getByText("Learn More").click();

    await expect(page).toHaveURL(/\/about/);
  });

  test("should navigate from home to sign-in", async ({ page }) => {
    await page.goto("/");

    await page.getByText("Get Started").click();

    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});

test.describe("Public Routes Accessibility", () => {
  test("should access hub without auth", async ({ page }) => {
    await page.goto("/hub");

    // Should not redirect
    await expect(page).toHaveURL(/\/hub$/);
    await expect(page.getByText("Shortcuts Hub")).toBeVisible();
  });

  test("should access templates without auth", async ({ page }) => {
    await page.goto("/templates");

    await expect(page).toHaveURL(/\/templates$/);
    await expect(page.getByText("Templates")).toBeVisible();
  });

  test("should access about without auth", async ({ page }) => {
    await page.goto("/about");

    await expect(page).toHaveURL(/\/about$/);
  });
});

test.describe("404 Handling", () => {
  test("should show 404 for non-existent routes", async ({ page }) => {
    const response = await page.goto("/non-existent-page");

    expect(response?.status()).toBe(404);
  });
});

test.describe("Responsive Navigation", () => {
  test("should show mobile menu button on small screens", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/hub");

    // Menu button should be visible on mobile
    const menuButton = page.getByRole("button", { name: /menu/i });
    await expect(menuButton).toBeVisible();
  });

  test("should hide sidebar on mobile by default", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/hub");

    // Sidebar should not be visible by default on mobile
    const sidebar = page.locator("aside");

    // Check if sidebar is off-screen (transformed)
    const box = await sidebar.boundingBox();
    if (box) {
      // If sidebar exists, it should be off-screen (x < 0)
      expect(box.x).toBeLessThan(0);
    }
  });

  test("should show sidebar on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto("/hub");

    // Sidebar should be visible on desktop
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
  });
});

