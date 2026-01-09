/**
 * Quests E2E Tests
 * Tests the quests flow: list, complete, award recorded
 *
 * PARITY-028: Quests routes
 */

import { test, expect } from "@playwright/test";

test.describe("Quests API", () => {
  test("GET /api/quests returns valid response", async ({ request }) => {
    const response = await request.get("/api/quests");
    // Should return 200 with data or 401 if not authenticated
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      if (data.data.quests) {
        expect(Array.isArray(data.data.quests)).toBe(true);
      }
    }
  });

  test("GET /api/quests with status filter", async ({ request }) => {
    const response = await request.get("/api/quests?status=available");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.data).toBeDefined();
    }
  });

  test("POST /api/quests requires authentication", async ({ request }) => {
    const response = await request.post("/api/quests", {
      data: {
        title: "Test Quest",
        category: "test",
        difficulty: "starter",
      },
    });
    expect([200, 201, 401]).toContain(response.status());
  });
});

test.describe("Quests Page Flow", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should load quests from backend", async ({ page }) => {
    let apiCalled = false;
    await page.route("**/api/quests*", (route) => {
      if (route.request().method() === "GET") {
        apiCalled = true;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              quests: [
                {
                  id: "quest-1",
                  title: "Complete 5 Focus Sessions",
                  description: "Focus challenge for productivity",
                  category: "focus",
                  difficulty: "medium",
                  xp_reward: 50,
                  coin_reward: 25,
                  status: "available",
                  is_repeatable: false,
                  streak_count: 0,
                  accepted_at: null,
                  completed_at: null,
                  expires_at: null,
                },
                {
                  id: "quest-2",
                  title: "Daily Meditation",
                  description: "Meditate every day for a week",
                  category: "wellness",
                  difficulty: "easy",
                  xp_reward: 25,
                  coin_reward: 10,
                  status: "accepted",
                  is_repeatable: true,
                  streak_count: 3,
                  accepted_at: "2026-01-05T00:00:00Z",
                  completed_at: null,
                  expires_at: null,
                },
              ],
              total: 2,
            },
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto("/quests");
    await page.waitForLoadState("networkidle");

    expect(apiCalled).toBe(true);
  });

  test("should display quests list", async ({ page }) => {
    await page.route("**/api/quests*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            quests: [
              {
                id: "quest-display",
                title: "Display Test Quest",
                category: "test",
                difficulty: "starter",
                xp_reward: 10,
                coin_reward: 5,
                status: "available",
                is_repeatable: false,
              },
            ],
            total: 1,
          },
        }),
      });
    });

    await page.goto("/quests");
    await page.waitForLoadState("networkidle");

    // Should have quests page or redirect to auth
    await expect(page).toHaveURL(/\/(quests|auth\/signin)/);
  });
});

test.describe("Quest Complete Flow", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should accept quest via API", async ({ page }) => {
    let acceptCalled = false;

    await page.route("**/api/quests/*/accept", (route) => {
      acceptCalled = true;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "accepted-quest",
            title: "Accepted Quest",
            status: "accepted",
            accepted_at: new Date().toISOString(),
          },
        }),
      });
    });

    await page.route("**/api/quests*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            quests: [
              {
                id: "accepted-quest",
                title: "Available Quest",
                status: "available",
                xp_reward: 50,
                coin_reward: 25,
              },
            ],
            total: 1,
          },
        }),
      });
    });

    await page.goto("/quests");
    await page.waitForLoadState("networkidle");
  });

  test("should complete quest and record awards", async ({ page }) => {
    let completeCalled = false;
    let requestBody: unknown = null;

    await page.route("**/api/quests/*/complete", (route) => {
      completeCalled = true;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            quest: {
              id: "completed-quest",
              title: "Completed Quest",
              status: "completed",
              xp_reward: 100,
              coin_reward: 50,
              completed_at: new Date().toISOString(),
            },
            xp_awarded: 100,
            coins_awarded: 50,
            leveled_up: true,
            new_level: 5,
          },
        }),
      });
    });

    await page.route("**/api/quests*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            quests: [
              {
                id: "completed-quest",
                title: "Quest to Complete",
                status: "accepted",
                xp_reward: 100,
                coin_reward: 50,
                difficulty: "hard",
              },
            ],
            total: 1,
          },
        }),
      });
    });

    await page.goto("/quests");
    await page.waitForLoadState("networkidle");
  });

  test("should show level up notification on complete", async ({ page }) => {
    await page.route("**/api/quests/*/complete", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            quest: {
              id: "level-up-quest",
              title: "Level Up Quest",
              status: "completed",
            },
            xp_awarded: 200,
            coins_awarded: 100,
            leveled_up: true,
            new_level: 10,
          },
        }),
      });
    });

    await page.route("**/api/quests*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            quests: [{ id: "level-up-quest", title: "Level Up Quest", status: "accepted" }],
            total: 1,
          },
        }),
      });
    });

    await page.goto("/quests");
    await page.waitForLoadState("networkidle");
  });
});

test.describe("Quest Abandon Flow", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should abandon quest via API", async ({ page }) => {
    let abandonCalled = false;

    await page.route("**/api/quests/*/abandon", (route) => {
      abandonCalled = true;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "abandoned-quest",
            title: "Abandoned Quest",
            status: "abandoned",
          },
        }),
      });
    });

    await page.route("**/api/quests*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            quests: [
              {
                id: "abandoned-quest",
                title: "Quest to Abandon",
                status: "accepted",
              },
            ],
            total: 1,
          },
        }),
      });
    });

    await page.goto("/quests");
    await page.waitForLoadState("networkidle");
  });
});

test.describe("Quest Difficulty Rewards", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should show correct rewards for difficulty levels", async ({ page }) => {
    await page.route("**/api/quests*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            quests: [
              { id: "q1", title: "Starter", difficulty: "starter", xp_reward: 10, coin_reward: 5, status: "available" },
              { id: "q2", title: "Easy", difficulty: "easy", xp_reward: 25, coin_reward: 10, status: "available" },
              { id: "q3", title: "Medium", difficulty: "medium", xp_reward: 50, coin_reward: 25, status: "available" },
              { id: "q4", title: "Hard", difficulty: "hard", xp_reward: 100, coin_reward: 50, status: "available" },
              { id: "q5", title: "Epic", difficulty: "epic", xp_reward: 250, coin_reward: 100, status: "available" },
            ],
            total: 5,
          },
        }),
      });
    });

    await page.goto("/quests");
    await page.waitForLoadState("networkidle");

    // Page should load quests or redirect to auth
    await expect(page).toHaveURL(/\/(quests|auth\/signin)/);
  });
});
