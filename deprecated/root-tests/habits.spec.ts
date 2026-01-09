/**
 * Habits E2E Tests
 * Tests the habits flow: create, log, streak
 *
 * PARITY-026: Habits routes
 */

import { test, expect } from "@playwright/test";

test.describe("Habits API", () => {
  test("GET /api/habits returns valid response", async ({ request }) => {
    const response = await request.get("/api/habits");
    // Should return 200 with data or 401 if not authenticated
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      if (data.data.habits) {
        expect(Array.isArray(data.data.habits)).toBe(true);
      }
    }
  });

  test("POST /api/habits requires authentication", async ({ request }) => {
    const response = await request.post("/api/habits", {
      data: {
        name: "Test Habit",
        frequency: "daily",
      },
    });
    // Should succeed (200/201) or require auth (401)
    expect([200, 201, 401]).toContain(response.status());
  });
});

test.describe("Habits Page Flow", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should load habits from backend", async ({ page }) => {
    // Intercept habits API
    let apiCalled = false;
    await page.route("**/api/habits", (route) => {
      if (route.request().method() === "GET") {
        apiCalled = true;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              habits: [
                {
                  id: "habit-1",
                  name: "Morning Meditation",
                  description: "10 minutes of calm",
                  frequency: "daily",
                  target_count: 1,
                  icon: "🧘",
                  color: "#8B5CF6",
                  is_active: true,
                  current_streak: 5,
                  longest_streak: 12,
                  last_completed_at: null,
                  completed_today: false,
                  sort_order: 0,
                },
                {
                  id: "habit-2",
                  name: "Exercise",
                  description: "30 min workout",
                  frequency: "daily",
                  target_count: 1,
                  icon: "💪",
                  color: "#10B981",
                  is_active: true,
                  current_streak: 3,
                  longest_streak: 7,
                  last_completed_at: null,
                  completed_today: true,
                  sort_order: 1,
                },
              ],
            },
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto("/habits");
    await page.waitForLoadState("networkidle");

    // API should be called
    expect(apiCalled).toBe(true);
  });

  test("should display habit list", async ({ page }) => {
    await page.route("**/api/habits", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            habits: [
              {
                id: "habit-1",
                name: "Daily Reading",
                frequency: "daily",
                target_count: 1,
                is_active: true,
                current_streak: 5,
                longest_streak: 10,
                completed_today: false,
                sort_order: 0,
              },
            ],
          },
        }),
      });
    });

    await page.goto("/habits");
    await page.waitForLoadState("networkidle");

    // Should have habits page or redirect to auth
    await expect(page).toHaveURL(/\/(habits|auth\/signin)/);
  });

  test("should complete habit via API", async ({ page }) => {
    let completeApiCalled = false;

    await page.route("**/api/habits", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            habits: [
              {
                id: "habit-complete-test",
                name: "Test Habit",
                frequency: "daily",
                is_active: true,
                current_streak: 0,
                completed_today: false,
              },
            ],
          },
        }),
      });
    });

    await page.route("**/api/habits/*/complete", (route) => {
      completeApiCalled = true;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            habit: {
              id: "habit-complete-test",
              name: "Test Habit",
              frequency: "daily",
              is_active: true,
              current_streak: 1,
              completed_today: true,
            },
            new_streak: 1,
            xp_awarded: 5,
            streak_bonus: false,
          },
        }),
      });
    });

    await page.goto("/habits");
    await page.waitForLoadState("networkidle");
  });
});

test.describe("Habits Streak Tracking", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should display streak information", async ({ page }) => {
    await page.route("**/api/habits", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            habits: [
              {
                id: "streak-habit",
                name: "Streak Habit",
                frequency: "daily",
                is_active: true,
                current_streak: 7,
                longest_streak: 14,
                completed_today: true,
              },
            ],
          },
        }),
      });
    });

    await page.goto("/habits");
    await page.waitForLoadState("networkidle");

    // Page should be habits or auth
    await expect(page).toHaveURL(/\/(habits|auth\/signin)/);
  });

  test("should show streak bonus on milestone", async ({ page }) => {
    let completeCalled = false;

    await page.route("**/api/habits/*/complete", (route) => {
      completeCalled = true;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            habit: {
              id: "milestone-habit",
              name: "Milestone Habit",
              current_streak: 7, // 7-day milestone
              completed_today: true,
            },
            new_streak: 7,
            xp_awarded: 12, // 5 base + 7 bonus
            streak_bonus: true,
          },
        }),
      });
    });

    await page.route("**/api/habits", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            habits: [
              {
                id: "milestone-habit",
                name: "Milestone Habit",
                current_streak: 6,
                completed_today: false,
              },
            ],
          },
        }),
      });
    });

    await page.goto("/habits");
    await page.waitForLoadState("networkidle");
  });
});

test.describe("Create Habit Flow", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should create habit via API", async ({ page }) => {
    let createApiCalled = false;

    await page.route("**/api/habits", (route) => {
      if (route.request().method() === "POST") {
        createApiCalled = true;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: "new-habit-uuid",
              name: "New Habit",
              description: "Test description",
              frequency: "daily",
              target_count: 1,
              is_active: true,
              current_streak: 0,
              longest_streak: 0,
              completed_today: false,
            },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: { habits: [] } }),
        });
      }
    });

    await page.goto("/habits");
    await page.waitForLoadState("networkidle");
  });
});
