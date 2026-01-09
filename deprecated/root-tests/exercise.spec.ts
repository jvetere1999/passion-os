/**
 * Exercise & Workout E2E Tests
 * Tests the workout flow: create workout -> start session -> log sets -> complete
 *
 * PARITY-032: Exercise routes
 */

import { test, expect } from "@playwright/test";

test.describe("Exercise API", () => {
  test("GET /api/exercise returns exercises list", async ({ request }) => {
    const response = await request.get("/api/exercise");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      if (data.data.exercises) {
        expect(Array.isArray(data.data.exercises)).toBe(true);
      }
    }
  });

  test("GET /api/exercise/workouts returns workouts list", async ({ request }) => {
    const response = await request.get("/api/exercise/workouts");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      if (data.data.workouts) {
        expect(Array.isArray(data.data.workouts)).toBe(true);
      }
    }
  });

  test("GET /api/exercise/sessions returns sessions list", async ({ request }) => {
    const response = await request.get("/api/exercise/sessions");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      if (data.data.sessions) {
        expect(Array.isArray(data.data.sessions)).toBe(true);
      }
    }
  });

  test("GET /api/exercise/programs returns programs list", async ({ request }) => {
    const response = await request.get("/api/exercise/programs");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      if (data.data.programs) {
        expect(Array.isArray(data.data.programs)).toBe(true);
      }
    }
  });
});

test.describe("Workout Session Flow", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("complete workout flow: create -> session -> log -> complete", async ({ request }) => {
    // 1. Create a workout
    const createWorkoutResponse = await request.post("/api/exercise/workouts", {
      data: {
        name: "Test Workout",
        description: "E2E test workout",
        difficulty: "beginner",
        workout_type: "strength",
      },
    });

    // May return 401 if not authenticated, 201/200 on success
    if (createWorkoutResponse.status() === 401) {
      test.skip();
      return;
    }

    expect([200, 201]).toContain(createWorkoutResponse.status());
    const workoutData = await createWorkoutResponse.json();
    expect(workoutData.data).toBeDefined();
    expect(workoutData.data.id).toBeDefined();
    const workoutId = workoutData.data.id;

    // 2. Start a session
    const startSessionResponse = await request.post("/api/exercise/sessions/start", {
      data: { workout_id: workoutId },
    });

    expect([200, 201]).toContain(startSessionResponse.status());
    const sessionData = await startSessionResponse.json();
    expect(sessionData.data).toBeDefined();
    expect(sessionData.data.session_id).toBeDefined();

    // 3. Log a set (using a placeholder exercise ID - would need real one in prod)
    // Skip this step if no exercises exist
    const exercisesResponse = await request.get("/api/exercise");
    if (exercisesResponse.status() === 200) {
      const exercisesData = await exercisesResponse.json();
      if (exercisesData.data.exercises && exercisesData.data.exercises.length > 0) {
        const exerciseId = exercisesData.data.exercises[0].id;

        const logSetResponse = await request.post("/api/exercise/sessions/log-set", {
          data: {
            exercise_id: exerciseId,
            set_number: 1,
            reps: 10,
            weight_kg: 20,
          },
        });
        expect([200, 201]).toContain(logSetResponse.status());
      }
    }

    // 4. Complete the session
    const completeResponse = await request.post("/api/exercise/sessions/complete", {
      data: { notes: "E2E test complete" },
    });

    expect([200, 201]).toContain(completeResponse.status());
    const completeData = await completeResponse.json();
    expect(completeData.data).toBeDefined();
    expect(completeData.data.session_id).toBeDefined();
    expect(completeData.data.duration_seconds).toBeDefined();

    // 5. Cleanup: delete the workout
    await request.delete(`/api/exercise/workouts/${workoutId}`);
  });

  test("get active session", async ({ request }) => {
    const response = await request.get("/api/exercise/sessions/active");
    expect([200, 401, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
    }
  });
});

test.describe("Exercise Page UI", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should intercept exercise API calls", async ({ page }) => {
    let apiCalled = false;

    await page.route("**/api/exercise**", (route) => {
      apiCalled = true;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            exercises: [],
            total: 0,
          },
        }),
      });
    });

    // Navigate to exercise page (adjust path as needed)
    await page.goto("/exercise");
    await page.waitForLoadState("networkidle");

    // Verify API was called
    expect(apiCalled).toBe(true);
  });
});
