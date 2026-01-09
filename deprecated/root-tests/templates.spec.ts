/**
 * Templates E2E Tests
 */

import { test, expect } from "@playwright/test";

test.describe("Templates Page", () => {
  test("should display templates page with categories", async ({ page }) => {
    await page.goto("/templates");

    // Check page title
    await expect(page).toHaveTitle(/Templates/);

    // Check heading
    await expect(
      page.getByRole("heading", { name: /Templates/i })
    ).toBeVisible();

    // Check for category cards
    await expect(page.getByText("Drum Patterns")).toBeVisible();
    await expect(page.getByText("Melodies")).toBeVisible();
    await expect(page.getByText("Chord Progressions")).toBeVisible();
  });

  test("should show template counts", async ({ page }) => {
    await page.goto("/templates");

    // Check for template counts
    await expect(page.getByText(/\d+ templates/)).toBeVisible();
  });

  test("should navigate to drum templates", async ({ page }) => {
    await page.goto("/templates");

    await page.getByText("Drum Patterns").click();

    await expect(page).toHaveURL(/\/templates\/drums/);
    await expect(
      page.getByRole("heading", { name: /Drum Patterns/i })
    ).toBeVisible();
  });

  test("should navigate to melody templates", async ({ page }) => {
    await page.goto("/templates");

    await page.getByText("Melodies").click();

    await expect(page).toHaveURL(/\/templates\/melody/);
    await expect(
      page.getByRole("heading", { name: /Melodies/i })
    ).toBeVisible();
  });

  test("should navigate to chord templates", async ({ page }) => {
    await page.goto("/templates");

    await page.getByText("Chord Progressions").click();

    await expect(page).toHaveURL(/\/templates\/chords/);
    await expect(
      page.getByRole("heading", { name: /Chord Progressions/i })
    ).toBeVisible();
  });
});

test.describe("Drum Templates Page", () => {
  test("should display drum templates", async ({ page }) => {
    await page.goto("/templates/drums");

    // Check for templates
    await expect(page.getByText("Basic Rock Beat")).toBeVisible();
    await expect(page.getByText("Funk Groove")).toBeVisible();
    await expect(page.getByText("Hip Hop Beat")).toBeVisible();
  });

  test("should show template metadata", async ({ page }) => {
    await page.goto("/templates/drums");

    // Check for BPM
    await expect(page.getByText(/\d+ BPM/)).toBeVisible();

    // Check for time signature
    await expect(page.getByText("4/4")).toBeVisible();

    // Check for difficulty badges
    await expect(page.getByText("beginner").first()).toBeVisible();
  });

  test("should show template tags", async ({ page }) => {
    await page.goto("/templates/drums");

    // Check for tags
    await expect(page.getByText("rock")).toBeVisible();
    await expect(page.getByText("funk")).toBeVisible();
  });

  test("should have back link to templates", async ({ page }) => {
    await page.goto("/templates/drums");

    const backLink = page.getByText(/Back to Templates/i);
    await expect(backLink).toBeVisible();

    await backLink.click();
    await expect(page).toHaveURL(/\/templates$/);
  });
});

test.describe("Chord Templates Page", () => {
  test("should display chord templates", async ({ page }) => {
    await page.goto("/templates/chords");

    await expect(page.getByText("Pop I-V-vi-IV")).toBeVisible();
    await expect(page.getByText("Jazz ii-V-I")).toBeVisible();
    await expect(page.getByText("Neo Soul")).toBeVisible();
  });

  test("should show difficulty levels", async ({ page }) => {
    await page.goto("/templates/chords");

    await expect(page.getByText("beginner").first()).toBeVisible();
    await expect(page.getByText("intermediate").first()).toBeVisible();
    await expect(page.getByText("advanced").first()).toBeVisible();
  });
});

