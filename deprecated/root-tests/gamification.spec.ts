/**
 * Gamification E2E Tests
 * Tests the progress/gamification UI is backend-driven
 */

import { test, expect } from "@playwright/test";

test.describe("Gamification Progress Page", () => {
  // Use authenticated user
  test.use({ storageState: "tests/.auth/user.json" });

  test("should display gamification summary from backend", async ({ page }) => {
    await page.goto("/progress");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check that stats grid is rendered
    const statsGrid = page.locator('[data-testid="stats-grid"]');
    await expect(statsGrid).toBeVisible();

    // Check XP stat is visible
    const xpStat = page.locator('[data-testid="stat-xp"]');
    await expect(xpStat).toBeVisible();

    // Check coins stat is visible
    const coinsStat = page.locator('[data-testid="stat-coins"]');
    await expect(coinsStat).toBeVisible();

    // Check streak stat is visible
    const streakStat = page.locator('[data-testid="stat-streak"]');
    await expect(streakStat).toBeVisible();

    // Check achievements stat is visible
    const achievementsStat = page.locator('[data-testid="stat-achievements"]');
    await expect(achievementsStat).toBeVisible();
  });

  test("should display level and XP progress", async ({ page }) => {
    await page.goto("/progress");
    await page.waitForLoadState("networkidle");

    // Check level section exists
    const levelSection = page.locator('[data-testid="level-section"]');
    await expect(levelSection).toBeVisible();

    // Check XP progress bar exists
    const xpProgressBar = page.locator('[data-testid="xp-progress-bar"]');
    await expect(xpProgressBar).toBeVisible();
  });

  test("should fetch data from backend API", async ({ page }) => {
    // Intercept the gamification API call
    let apiCalled = false;
    await page.route("**/gamification/summary", (route) => {
      apiCalled = true;
      // Return mock data
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            total_xp: 1500,
            current_level: 5,
            xp_to_next_level: 760,
            xp_progress_percent: 45,
            coins: 250,
            total_skill_stars: 42,
            achievement_count: 8,
            current_streak: 3,
            longest_streak: 7,
          },
        }),
      });
    });

    await page.goto("/progress");
    await page.waitForLoadState("networkidle");

    // Verify API was called
    expect(apiCalled).toBe(true);

    // Verify data is displayed
    const totalXp = page.locator('[data-testid="total-xp"]');
    await expect(totalXp).toContainText("1,500");

    const coins = page.locator('[data-testid="total-coins"]');
    await expect(coins).toContainText("250");

    const streak = page.locator('[data-testid="current-streak"]');
    await expect(streak).toContainText("3");

    const achievements = page.locator('[data-testid="achievement-count"]');
    await expect(achievements).toContainText("8");
  });
});

test.describe("Gamification Teaser on Today Page", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should fetch achievement teaser from backend", async ({ page }) => {
    // Intercept teaser API
    let teaserApiCalled = false;
    await page.route("**/gamification/teaser", (route) => {
      teaserApiCalled = true;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          teaser: {
            achievement: {
              id: "test-uuid",
              key: "streak_7",
              name: "Week Warrior",
              description: "Maintain a 7-day streak",
              category: "streak",
              icon: null,
              trigger_type: "streak",
              trigger_config: { days: 7 },
              reward_coins: 50,
              reward_xp: 200,
              is_hidden: false,
              sort_order: 10,
              created_at: "2026-01-01T00:00:00Z",
            },
            progress: 3,
            progress_max: 7,
            progress_label: "3/7 day streak",
          },
        }),
      });
    });

    await page.goto("/today");
    await page.waitForLoadState("networkidle");

    // API should be called
    expect(teaserApiCalled).toBe(true);
  });
});

test.describe("Gamification API", () => {
  test("GET /gamification/summary returns gamification data", async ({ request }) => {
    const response = await request.get("/gamification/summary");

    // Should return 200 with data or 401 if not authenticated
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      expect(data.data.current_level).toBeDefined();
      expect(data.data.total_xp).toBeDefined();
      expect(data.data.coins).toBeDefined();
    }
  });

  test("GET /gamification/teaser returns teaser or null", async ({ request }) => {
    const response = await request.get("/gamification/teaser");

    // Should return 200 with teaser or 401 if not authenticated
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      // teaser can be null if no achievements to show
      expect(data.teaser === null || typeof data.teaser === "object").toBe(true);
    }
  });
});

test.describe("No localStorage Usage", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("progress page should not store gamification data in localStorage", async ({ page }) => {
    await page.goto("/progress");
    await page.waitForLoadState("networkidle");

    // Check localStorage doesn't have gamification keys
    const hasGamificationInLocalStorage = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.some(
        (key) =>
          key.includes("gamification") ||
          key.includes("wallet") ||
          key.includes("xp") ||
          key.includes("coins")
      );
    });

    expect(hasGamificationInLocalStorage).toBe(false);
  });
});

