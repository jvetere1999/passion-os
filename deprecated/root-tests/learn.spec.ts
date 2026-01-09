/**
 * Learn E2E Tests
 * Tests the learning flow: browse topics -> lessons -> drills
 *
 * PARITY-037: Learn routes
 */

import { test, expect } from "@playwright/test";

test.describe("Learn API", () => {
  test("GET /api/learn returns overview", async ({ request }) => {
    const response = await request.get("/api/learn");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      if (data.data.progress) {
        expect(data.data.progress.lessons_completed).toBeDefined();
      }
      if (data.data.topics) {
        expect(Array.isArray(data.data.topics)).toBe(true);
      }
    }
  });

  test("GET /api/learn/topics returns topics list", async ({ request }) => {
    const response = await request.get("/api/learn/topics");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      if (data.data.topics) {
        expect(Array.isArray(data.data.topics)).toBe(true);
      }
    }
  });

  test("GET /api/learn/progress returns progress summary", async ({ request }) => {
    const response = await request.get("/api/learn/progress");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      expect(data.data.lessons_completed).toBeDefined();
      expect(data.data.total_lessons).toBeDefined();
    }
  });

  test("GET /api/learn/review returns review items", async ({ request }) => {
    const response = await request.get("/api/learn/review");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      expect(data.data.total_due).toBeDefined();
      if (data.data.lessons_due) {
        expect(Array.isArray(data.data.lessons_due)).toBe(true);
      }
    }
  });
});

test.describe("Lesson Flow", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("lesson flow: browse topics -> get lessons -> start -> complete", async ({ request }) => {
    // 1. Get topics
    const topicsResponse = await request.get("/api/learn/topics");

    if (topicsResponse.status() === 401) {
      test.skip();
      return;
    }

    expect(topicsResponse.status()).toBe(200);
    const topicsData = await topicsResponse.json();

    // Skip if no topics
    if (!topicsData.data.topics || topicsData.data.topics.length === 0) {
      test.skip();
      return;
    }

    const topicId = topicsData.data.topics[0].id;

    // 2. Get lessons for topic
    const lessonsResponse = await request.get(`/api/learn/topics/${topicId}/lessons`);
    expect(lessonsResponse.status()).toBe(200);
    const lessonsData = await lessonsResponse.json();

    // Skip if no lessons
    if (!lessonsData.data.lessons || lessonsData.data.lessons.length === 0) {
      test.skip();
      return;
    }

    const lessonId = lessonsData.data.lessons[0].id;

    // 3. Get lesson content
    const lessonResponse = await request.get(`/api/learn/lessons/${lessonId}`);
    expect(lessonResponse.status()).toBe(200);
    const lessonData = await lessonResponse.json();
    expect(lessonData.data.id).toBe(lessonId);
    expect(lessonData.data.title).toBeDefined();

    // 4. Start lesson
    const startResponse = await request.post(`/api/learn/lessons/${lessonId}/start`);
    expect([200, 201]).toContain(startResponse.status());
    const startData = await startResponse.json();
    expect(startData.data.status).toBe("in_progress");

    // 5. Complete lesson
    const completeResponse = await request.post(`/api/learn/lessons/${lessonId}/complete`, {
      data: { quiz_score: 85 },
    });
    expect([200, 201]).toContain(completeResponse.status());
    const completeData = await completeResponse.json();
    expect(completeData.data.lesson_id).toBe(lessonId);
    expect(completeData.data.xp_awarded).toBeGreaterThanOrEqual(0);
  });

  test("drill submission flow", async ({ request }) => {
    // 1. Get topics
    const topicsResponse = await request.get("/api/learn/topics");

    if (topicsResponse.status() === 401) {
      test.skip();
      return;
    }

    const topicsData = await topicsResponse.json();
    if (!topicsData.data.topics || topicsData.data.topics.length === 0) {
      test.skip();
      return;
    }

    const topicId = topicsData.data.topics[0].id;

    // 2. Get drills for topic
    const drillsResponse = await request.get(`/api/learn/topics/${topicId}/drills`);
    expect(drillsResponse.status()).toBe(200);
    const drillsData = await drillsResponse.json();

    if (!drillsData.data.drills || drillsData.data.drills.length === 0) {
      test.skip();
      return;
    }

    const drillId = drillsData.data.drills[0].id;

    // 3. Submit drill result
    const submitResponse = await request.post(`/api/learn/drills/${drillId}/submit`, {
      data: {
        score: 90,
        correct_count: 9,
        total_count: 10,
        time_seconds: 120,
      },
    });

    expect([200, 201]).toContain(submitResponse.status());
    const submitData = await submitResponse.json();
    expect(submitData.data.drill_id).toBe(drillId);
    expect(submitData.data.score).toBe(90);
    expect(submitData.data.xp_awarded).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Learn Page UI", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should intercept learn API calls", async ({ page }) => {
    let apiCalled = false;

    await page.route("**/api/learn**", (route) => {
      apiCalled = true;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            progress: {
              topics_started: 0,
              lessons_completed: 0,
              total_lessons: 0,
              drills_practiced: 0,
              total_xp_earned: 0,
              current_streak_days: 0,
            },
            review_count: 0,
            topics: [],
          },
        }),
      });
    });

    // Navigate to learn page
    await page.goto("/learn");
    await page.waitForLoadState("networkidle");

    expect(apiCalled).toBe(true);
  });
});
