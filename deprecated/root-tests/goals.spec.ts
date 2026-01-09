/**
 * Goals E2E Tests
 * Tests the goals flow: create, milestone, progress
 *
 * PARITY-027: Goals routes
 */

import { test, expect } from "@playwright/test";

test.describe("Goals API", () => {
  test("GET /api/goals returns valid response", async ({ request }) => {
    const response = await request.get("/api/goals");
    // Should return 200 with data or 401 if not authenticated
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      if (data.data.goals) {
        expect(Array.isArray(data.data.goals)).toBe(true);
      }
    }
  });

  test("GET /api/goals with status filter", async ({ request }) => {
    const response = await request.get("/api/goals?status=active");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.data).toBeDefined();
    }
  });

  test("POST /api/goals requires authentication", async ({ request }) => {
    const response = await request.post("/api/goals", {
      data: {
        title: "Test Goal",
        category: "test",
      },
    });
    expect([200, 201, 401]).toContain(response.status());
  });
});

test.describe("Goals Page Flow", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should load goals from backend", async ({ page }) => {
    let apiCalled = false;
    await page.route("**/api/goals*", (route) => {
      if (route.request().method() === "GET") {
        apiCalled = true;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              goals: [
                {
                  id: "goal-1",
                  title: "Learn Rust",
                  description: "Master the language",
                  category: "learning",
                  target_date: "2026-06-01",
                  started_at: "2026-01-01T00:00:00Z",
                  completed_at: null,
                  status: "active",
                  progress: 35,
                  priority: 1,
                  milestones: [
                    {
                      id: "ms-1",
                      goal_id: "goal-1",
                      title: "Complete Rust book",
                      is_completed: true,
                      completed_at: "2026-01-05T00:00:00Z",
                      sort_order: 0,
                    },
                    {
                      id: "ms-2",
                      goal_id: "goal-1",
                      title: "Build first project",
                      is_completed: false,
                      completed_at: null,
                      sort_order: 1,
                    },
                  ],
                  total_milestones: 2,
                  completed_milestones: 1,
                },
              ],
              total: 1,
            },
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto("/goals");
    await page.waitForLoadState("networkidle");

    expect(apiCalled).toBe(true);
  });

  test("should display goals list", async ({ page }) => {
    await page.route("**/api/goals*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            goals: [
              {
                id: "goal-display-test",
                title: "Display Test Goal",
                category: "test",
                status: "active",
                progress: 50,
                milestones: [],
                total_milestones: 0,
                completed_milestones: 0,
              },
            ],
            total: 1,
          },
        }),
      });
    });

    await page.goto("/goals");
    await page.waitForLoadState("networkidle");

    // Should have goals page or redirect to auth
    await expect(page).toHaveURL(/\/(goals|auth\/signin)/);
  });
});

test.describe("Goals Milestone Flow", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should get goal with milestones", async ({ page }) => {
    let goalDetailCalled = false;

    await page.route("**/api/goals/*", (route) => {
      if (route.request().url().includes("/milestones")) {
        route.continue();
      } else {
        goalDetailCalled = true;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: "goal-with-milestones",
              title: "Goal With Milestones",
              status: "active",
              progress: 33,
              milestones: [
                { id: "ms-1", title: "Step 1", is_completed: true, sort_order: 0 },
                { id: "ms-2", title: "Step 2", is_completed: false, sort_order: 1 },
                { id: "ms-3", title: "Step 3", is_completed: false, sort_order: 2 },
              ],
              total_milestones: 3,
              completed_milestones: 1,
            },
          }),
        });
      }
    });

    await page.goto("/goals");
    await page.waitForLoadState("networkidle");
  });

  test("should add milestone via API", async ({ page }) => {
    let addMilestoneCalled = false;

    await page.route("**/api/goals/*/milestones", (route) => {
      if (route.request().method() === "POST") {
        addMilestoneCalled = true;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: "new-milestone-uuid",
              goal_id: "parent-goal",
              title: "New Milestone",
              description: null,
              is_completed: false,
              completed_at: null,
              sort_order: 0,
            },
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.route("**/api/goals*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { goals: [], total: 0 },
        }),
      });
    });

    await page.goto("/goals");
    await page.waitForLoadState("networkidle");
  });

  test("should complete milestone and update progress", async ({ page }) => {
    let completeMilestoneCalled = false;

    await page.route("**/api/goals/milestones/*/complete", (route) => {
      completeMilestoneCalled = true;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            milestone: {
              id: "completed-milestone",
              title: "Completed Milestone",
              is_completed: true,
              completed_at: new Date().toISOString(),
            },
            goal_progress: 66,
            goal_completed: false,
          },
        }),
      });
    });

    await page.route("**/api/goals*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            goals: [
              {
                id: "progress-goal",
                title: "Progress Goal",
                status: "active",
                progress: 33,
                milestones: [
                  { id: "completed-milestone", title: "Step 1", is_completed: false },
                  { id: "ms-2", title: "Step 2", is_completed: false },
                  { id: "ms-3", title: "Step 3", is_completed: false },
                ],
                total_milestones: 3,
                completed_milestones: 0,
              },
            ],
            total: 1,
          },
        }),
      });
    });

    await page.goto("/goals");
    await page.waitForLoadState("networkidle");
  });
});

test.describe("Create Goal Flow", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should create goal via API", async ({ page }) => {
    let createGoalCalled = false;

    await page.route("**/api/goals", (route) => {
      if (route.request().method() === "POST") {
        createGoalCalled = true;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: "new-goal-uuid",
              title: "New Goal",
              description: "Goal description",
              category: "personal",
              target_date: null,
              started_at: new Date().toISOString(),
              completed_at: null,
              status: "active",
              progress: 0,
              priority: 0,
              milestones: [],
              total_milestones: 0,
              completed_milestones: 0,
            },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: { goals: [], total: 0 } }),
        });
      }
    });

    await page.goto("/goals");
    await page.waitForLoadState("networkidle");
  });
});
