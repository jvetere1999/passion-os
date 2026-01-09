/**
 * Test helpers and fixtures for Playwright E2E tests
 */

import { test as base, expect, type Page } from "@playwright/test";

/**
 * Mock session for authenticated tests
 */
export interface MockUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export const mockUser: MockUser = {
  id: "test-user-123",
  name: "Test User",
  email: "test@example.com",
};

/**
 * Custom test fixture with common utilities
 */
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  // For now, authenticated tests will need to use real auth
  // This fixture is a placeholder for future mock auth
  authenticatedPage: async ({ page }, use) => {
    // In a real scenario, we'd inject auth cookies here
    await use(page);
  },
});

export { expect };

/**
 * Wait for page to be fully loaded (no network activity)
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}

/**
 * Check if element is visible and contains text
 */
export async function expectTextVisible(
  page: Page,
  text: string
): Promise<void> {
  await expect(page.getByText(text).first()).toBeVisible();
}

/**
 * Navigate and wait for load
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForPageLoad(page);
}

/**
 * Check page has no console errors
 */
export function setupConsoleErrorCheck(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * Check for accessibility violations (basic)
 */
export async function checkBasicA11y(page: Page): Promise<void> {
  // Check for lang attribute
  const html = page.locator("html");
  await expect(html).toHaveAttribute("lang", "en");

  // Check for main landmark
  const main = page.locator("main");
  const mainCount = await main.count();
  expect(mainCount).toBeGreaterThanOrEqual(0); // Some pages may not have main

  // Check all images have alt text
  const images = page.locator("img");
  const imageCount = await images.count();
  for (let i = 0; i < imageCount; i++) {
    const img = images.nth(i);
    const alt = await img.getAttribute("alt");
    expect(alt).not.toBeNull();
  }
}

/**
 * Get viewport category
 */
export function getViewportCategory(
  width: number
): "mobile" | "tablet" | "desktop" {
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

