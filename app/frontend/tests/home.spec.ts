import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display the hero section", async ({ page }) => {
    await page.goto("/");

    // Check title
    await expect(page.locator("h1")).toContainText("Passion OS");

    // Check subtitle
    await expect(page.locator("text=Plan, focus, and create")).toBeVisible();

    // Check CTA buttons
    await expect(page.locator("text=Get Started")).toBeVisible();
    await expect(page.locator("text=Learn More")).toBeVisible();
  });

  test("should display feature cards", async ({ page }) => {
    await page.goto("/");

    // Check feature sections
    await expect(page.locator("text=Plan")).toBeVisible();
    await expect(page.locator("text=Focus")).toBeVisible();
    await expect(page.locator("text=Create")).toBeVisible();
  });

  test("should have correct page title", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Passion OS/);
  });

  test("should navigate to sign in", async ({ page }) => {
    await page.goto("/");

    await page.click("text=Get Started");

    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});

test.describe("Accessibility", () => {
  test("should have no major accessibility violations on home page", async ({
    page,
  }) => {
    await page.goto("/");

    // Check for basic accessibility
    // - All images should have alt text
    const images = page.locator("img");
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      await expect(img).toHaveAttribute("alt");
    }

    // - All links should be keyboard accessible
    const links = page.locator("a");
    const linkCount = await links.count();
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      await expect(link).toHaveAttribute("href");
    }
  });
});

test.describe("Responsive Design", () => {
  test("should render correctly on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=Get Started")).toBeVisible();
  });

  test("should render correctly on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=Get Started")).toBeVisible();
  });

  test("should render correctly on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=Get Started")).toBeVisible();
  });
});

