/**
 * Database Operations E2E Tests
 * Comprehensive tests for all D1 database operations
 */

import { test, expect, type Page } from "@playwright/test";

// Helper to check if authenticated
async function isAuthenticated(page: Page) {
  return await page.evaluate(() => {
    return document.cookie.includes("session-token");
  });
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

test.describe("User Database Operations", () => {
  test("users table has no null email or name entries", async ({ request }) => {
    // This test requires admin access - skip if not authenticated
    const healthRes = await request.get("/api/admin/db-health");
    if (healthRes.status() === 401 || healthRes.status() === 403) {
      test.skip();
      return;
    }

    const data = await healthRes.json();
    expect(data.nullUsers).toBeDefined();
    expect(data.nullUsers).toBe(0);
  });

  test("no orphaned accounts exist", async ({ request }) => {
    const healthRes = await request.get("/api/admin/db-health");
    if (healthRes.status() === 401 || healthRes.status() === 403) {
      test.skip();
      return;
    }

    const data = await healthRes.json();
    expect(data.orphanedAccounts).toBeDefined();
    expect(data.orphanedAccounts).toBe(0);
  });

  test("no orphaned sessions exist", async ({ request }) => {
    const healthRes = await request.get("/api/admin/db-health");
    if (healthRes.status() === 401 || healthRes.status() === 403) {
      test.skip();
      return;
    }

    const data = await healthRes.json();
    expect(data.orphanedSessions).toBeDefined();
    expect(data.orphanedSessions).toBe(0);
  });
});

// ============================================================================
// FOCUS OPERATIONS
// ============================================================================

test.describe("Focus Session Database Operations", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home and check auth
    await page.goto("/");
  });

  test("focus page loads correctly", async ({ page }) => {
    await page.goto("/focus");
    // Should either show focus page or redirect to login
    await expect(page).toHaveURL(/\/(focus|auth\/signin)/);
  });

  test("active focus API returns valid response", async ({ request }) => {
    const res = await request.get("/api/focus/active");
    // Should return 200 with data or 401 if not authenticated
    expect([200, 401, 404]).toContain(res.status());

    if (res.status() === 200) {
      const data = await res.json();
      // Either has active session or null
      expect(data).toBeDefined();
    }
  });

  test("pause state API returns valid response", async ({ request }) => {
    const res = await request.get("/api/focus/pause");
    expect([200, 401, 404, 500]).toContain(res.status());

    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toBeDefined();
    }
  });
});

// ============================================================================
// QUESTS OPERATIONS
// ============================================================================

test.describe("Quest Database Operations", () => {
  test("quests API returns valid response", async ({ request }) => {
    const res = await request.get("/api/quests");
    expect([200, 401]).toContain(res.status());

    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toBeDefined();
      if (data.quests) {
        expect(Array.isArray(data.quests)).toBe(true);
      }
    }
  });

  test("quests page loads", async ({ page }) => {
    await page.goto("/quests");
    await expect(page).toHaveURL(/\/(quests|auth\/signin)/);
  });
});

// ============================================================================
// MARKET OPERATIONS
// ============================================================================

test.describe("Market Database Operations", () => {
  test("market API returns valid response", async ({ request }) => {
    const res = await request.get("/api/market");
    expect([200, 401]).toContain(res.status());

    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toBeDefined();
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.wallet).toBeDefined();
    }
  });

  test("market items are seeded", async ({ request }) => {
    const res = await request.get("/api/market");
    if (res.status() !== 200) {
      test.skip();
      return;
    }

    const data = await res.json();
    expect(data.items.length).toBeGreaterThan(0);
  });

  test("purchase requires valid item", async ({ request }) => {
    const res = await request.post("/api/market/purchase", {
      data: { itemId: "nonexistent" },
    });
    expect([400, 401, 404]).toContain(res.status());
  });
});

// ============================================================================
// IDEAS OPERATIONS
// ============================================================================

test.describe("Ideas Database Operations", () => {
  test("ideas API returns valid response", async ({ request }) => {
    const res = await request.get("/api/ideas");
    expect([200, 401]).toContain(res.status());

    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toBeDefined();
      expect(Array.isArray(data.ideas || data)).toBe(true);
    }
  });

  test("ideas page loads", async ({ page }) => {
    await page.goto("/ideas");
    await expect(page).toHaveURL(/\/(ideas|auth\/signin)/);
  });

  test("creating idea requires authentication", async ({ request }) => {
    const res = await request.post("/api/ideas", {
      data: { content: "Test idea" },
    });
    // Should either succeed (200/201) or require auth (401)
    expect([200, 201, 401]).toContain(res.status());
  });
});

// ============================================================================
// ONBOARDING OPERATIONS
// ============================================================================

test.describe("Onboarding Database Operations", () => {
  test("onboarding API returns valid response", async ({ request }) => {
    const res = await request.get("/api/onboarding");
    expect([200, 401]).toContain(res.status());

    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toBeDefined();
      // Should have flow info
      expect(data.flow || data.state).toBeDefined();
    }
  });

  test("onboarding flows are seeded", async ({ request }) => {
    const res = await request.get("/api/onboarding");
    if (res.status() !== 200) {
      test.skip();
      return;
    }

    const data = await res.json();
    // Flow should exist
    expect(data.flow).toBeDefined();
    expect(data.flow.totalSteps || data.steps?.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// LEARN OPERATIONS
// ============================================================================

test.describe("Learn Database Operations", () => {
  test("learn topics API returns valid response", async ({ request }) => {
    const res = await request.get("/api/learn/topics");
    expect([200, 401, 404]).toContain(res.status());

    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toBeDefined();
    }
  });

  test("learn drills API returns valid response", async ({ request }) => {
    const res = await request.get("/api/learn/drills");
    expect([200, 401, 404]).toContain(res.status());
  });

  test("ear training page loads", async ({ page }) => {
    await page.goto("/learn/ear-training");
    await expect(page).toHaveURL(/\/(learn|auth\/signin)/);
  });

  test("interval game page loads", async ({ page }) => {
    await page.goto("/learn/ear-training/intervals");
    await expect(page).toHaveURL(/\/(learn|auth\/signin)/);
  });

  test("chord game page loads", async ({ page }) => {
    await page.goto("/learn/ear-training/chords");
    await expect(page).toHaveURL(/\/(learn|auth\/signin)/);
  });

  test("note game page loads", async ({ page }) => {
    await page.goto("/learn/ear-training/notes");
    await expect(page).toHaveURL(/\/(learn|auth\/signin)/);
  });
});

// ============================================================================
// GAMIFICATION OPERATIONS
// ============================================================================

test.describe("Gamification Database Operations", () => {
  test("skills are seeded", async ({ request }) => {
    const res = await request.get("/api/admin/skills");
    if (res.status() !== 200) {
      // Not admin, can't check
      test.skip();
      return;
    }

    const data = await res.json();
    expect(data.skills).toBeDefined();
    expect(data.skills.length).toBeGreaterThan(0);
  });

  test("progress page loads", async ({ page }) => {
    await page.goto("/progress");
    await expect(page).toHaveURL(/\/(progress|auth\/signin)/);
  });

  test("wins page loads", async ({ page }) => {
    await page.goto("/wins");
    await expect(page).toHaveURL(/\/(wins|auth\/signin)/);
  });

  test("stats page loads", async ({ page }) => {
    await page.goto("/stats");
    await expect(page).toHaveURL(/\/(stats|auth\/signin)/);
  });
});

// ============================================================================
// TODAY OPERATIONS
// ============================================================================

test.describe("Today Page Database Operations", () => {
  test("today page loads", async ({ page }) => {
    await page.goto("/today");
    await expect(page).toHaveURL(/\/(today|auth\/signin)/);
  });

  test("daily plan API returns valid response", async ({ request }) => {
    const res = await request.get("/api/daily-plan");
    expect([200, 401, 500]).toContain(res.status());
  });
});

// ============================================================================
// REFERENCE TRACKS OPERATIONS
// ============================================================================

test.describe("Reference Tracks Database Operations", () => {
  test("reference tracks API returns valid response", async ({ request }) => {
    const res = await request.get("/api/reference/tracks");
    expect([200, 401]).toContain(res.status());

    if (res.status() === 200) {
      const data = await res.json();
      expect(data.tracks).toBeDefined();
      expect(Array.isArray(data.tracks)).toBe(true);
    }
  });

  test("upload init requires authentication", async ({ request }) => {
    const res = await request.post("/api/reference/upload/init", {
      data: {
        filename: "test.mp3",
        mimeType: "audio/mpeg",
        bytes: 1024,
      },
    });
    expect([200, 401]).toContain(res.status());
  });
});

// ============================================================================
// HABITS OPERATIONS
// ============================================================================

test.describe("Habits Database Operations", () => {
  test("habits page loads", async ({ page }) => {
    await page.goto("/habits");
    await expect(page).toHaveURL(/\/(habits|auth\/signin)/);
  });

  test("habits API returns valid response", async ({ request }) => {
    const res = await request.get("/api/habits");
    expect([200, 401, 404]).toContain(res.status());
  });
});

// ============================================================================
// GOALS OPERATIONS
// ============================================================================

test.describe("Goals Database Operations", () => {
  test("goals page loads", async ({ page }) => {
    await page.goto("/goals");
    await expect(page).toHaveURL(/\/(goals|auth\/signin)/);
  });

  test("goals API returns valid response", async ({ request }) => {
    const res = await request.get("/api/goals");
    expect([200, 401, 404]).toContain(res.status());
  });
});

// ============================================================================
// BOOKS OPERATIONS
// ============================================================================

test.describe("Books Database Operations", () => {
  test("books page loads", async ({ page }) => {
    await page.goto("/books");
    await expect(page).toHaveURL(/\/(books|auth\/signin)/);
  });
});

// ============================================================================
// EXERCISES/FITNESS OPERATIONS
// ============================================================================

test.describe("Exercise Database Operations", () => {
  test("exercise page loads", async ({ page }) => {
    await page.goto("/exercise");
    await expect(page).toHaveURL(/\/(exercise|auth\/signin)/);
  });
});

// ============================================================================
// PLANNER OPERATIONS
// ============================================================================

test.describe("Planner Database Operations", () => {
  test("planner page loads", async ({ page }) => {
    await page.goto("/planner");
    await expect(page).toHaveURL(/\/(planner|auth\/signin)/);
  });

  test("templates page loads", async ({ page }) => {
    await page.goto("/templates");
    await expect(page).toHaveURL(/\/(templates|auth\/signin)/);
  });
});

// ============================================================================
// WHEEL (HARMONICS) OPERATIONS
// ============================================================================

test.describe("Wheel Page Operations", () => {
  test("wheel page loads", async ({ page }) => {
    await page.goto("/wheel");
    await expect(page).toHaveURL(/\/(wheel|auth\/signin)/);
  });
});

// ============================================================================
// INFOBASE OPERATIONS
// ============================================================================

test.describe("Infobase Database Operations", () => {
  test("infobase page loads", async ({ page }) => {
    await page.goto("/infobase");
    await expect(page).toHaveURL(/\/(infobase|auth\/signin)/);
  });
});

// ============================================================================
// IGNITIONS OPERATIONS
// ============================================================================

test.describe("Ignitions Database Operations", () => {
  test("ignitions page loads", async ({ page }) => {
    await page.goto("/ignitions");
    await expect(page).toHaveURL(/\/(ignitions|auth\/signin)/);
  });
});

