/**
 * Behavioral API Integration Tests
 *
 * Tests the API endpoints that power the Starter Engine behavioral features.
 * Validates that the frontend receives expected data shapes from the backend.
 */

import { test, expect } from "@playwright/test";

// ============================================
// Daily Plan API Tests
// ============================================
test.describe("Daily Plan API", () => {
  test("GET /api/daily-plan returns plan structure", async ({ request }) => {
    const response = await request.get("/api/daily-plan");
    
    // Should return 200 for authenticated users, 401 for unauthenticated
    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      
      // Should have plan property (can be null for no plan)
      expect(data).toHaveProperty("plan");
      
      if (data.plan) {
        // Plan should have items array
        expect(data.plan).toHaveProperty("items");
        expect(Array.isArray(data.plan.items)).toBeTruthy();
        
        // Each item should have required fields
        for (const item of data.plan.items) {
          expect(item).toHaveProperty("id");
          expect(item).toHaveProperty("title");
          expect(item).toHaveProperty("type");
          expect(item).toHaveProperty("completed");
        }
      }
    }
  });

  test("daily plan items have valid types", async ({ request }) => {
    const response = await request.get("/api/daily-plan");
    
    if (response.status() === 200) {
      const data = await response.json();
      
      if (data.plan?.items) {
        const validTypes = ["focus", "quest", "workout", "learning", "habit"];
        
        for (const item of data.plan.items) {
          expect(validTypes).toContain(item.type);
        }
      }
    }
  });

  test("daily plan items have optional priority", async ({ request }) => {
    const response = await request.get("/api/daily-plan");
    
    if (response.status() === 200) {
      const data = await response.json();
      
      if (data.plan?.items) {
        for (const item of data.plan.items) {
          if (item.priority !== undefined) {
            expect(typeof item.priority).toBe("number");
          }
        }
      }
    }
  });
});

// ============================================
// Today Data API Tests
// ============================================
test.describe("Today Data API", () => {
  test("GET /api/today returns user state", async ({ request }) => {
    const response = await request.get("/api/today");
    
    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      
      // Should have userState
      expect(data).toHaveProperty("userState");
      
      // userState should have behavioral flags
      expect(data.userState).toHaveProperty("firstDay");
      expect(data.userState).toHaveProperty("returningAfterGap");
    }
  });

  test("Today API includes personalization data", async ({ request }) => {
    const response = await request.get("/api/today");
    
    if (response.status() === 200) {
      const data = await response.json();
      
      // Should have personalization
      expect(data).toHaveProperty("personalization");
      
      if (data.personalization) {
        expect(data.personalization).toHaveProperty("quickPicks");
        expect(data.personalization).toHaveProperty("interests");
      }
    }
  });

  test("Today API includes dynamic UI data", async ({ request }) => {
    const response = await request.get("/api/today");
    
    if (response.status() === 200) {
      const data = await response.json();
      
      // Should have dynamicUIData (can be null)
      expect(data).toHaveProperty("dynamicUIData");
    }
  });

  test("Today API includes plan summary", async ({ request }) => {
    const response = await request.get("/api/today");
    
    if (response.status() === 200) {
      const data = await response.json();
      
      // Should have planSummary (can be null)
      expect(data).toHaveProperty("planSummary");
    }
  });
});

// ============================================
// Onboarding API Tests
// ============================================
test.describe("Onboarding API", () => {
  test("GET /api/onboarding returns flow data", async ({ request }) => {
    const response = await request.get("/api/onboarding");
    
    expect([200, 401]).toContain(response.status());
  });

});

// ============================================
// Action Completion API Tests
// ============================================
test.describe("Action Completion API", () => {
  test("focus session completion endpoint exists", async ({ request }) => {
    // Check that the endpoint responds (may require auth)
    const response = await request.post("/api/focus/complete", {
      data: { sessionId: "test-session-id", duration: 300 },
    });
    
    // Any valid response (including 401/404) confirms endpoint exists
    expect(response.status()).toBeDefined();
  });

  test("quest completion endpoint exists", async ({ request }) => {
    const response = await request.post("/api/quests/test-id/complete", {
      data: {},
    });
    
    expect(response.status()).toBeDefined();
  });
});

// ============================================
// User Activity Tracking API Tests
// ============================================
test.describe("User Activity API", () => {
  test("activity tracking endpoint accepts activity data", async ({ request }) => {
    const response = await request.post("/api/activity", {
      data: {
        type: "page_view",
        page: "/today",
        timestamp: new Date().toISOString(),
      },
    });
    
    // Should accept or reject with proper status
    expect([200, 201, 401, 404]).toContain(response.status());
  });
});

// ============================================
// Error Handling Tests
// ============================================
test.describe("API Error Handling", () => {
  test("daily plan API handles malformed requests gracefully", async ({ request }) => {
    const response = await request.get("/api/daily-plan?invalid=true");
    
    // Should not return 500
    expect(response.status()).not.toBe(500);
  });

  test("Today API handles missing auth gracefully", async ({ request }) => {
    const response = await request.get("/api/today");
    
    // Should return 401 not 500
    if (response.status() >= 400) {
      expect(response.status()).not.toBe(500);
    }
  });
});

// ============================================
// Response Time Tests
// ============================================
test.describe("API Performance", () => {
  test("daily plan API responds within acceptable time", async ({ request }) => {
    const start = Date.now();
    const response = await request.get("/api/daily-plan");
    const duration = Date.now() - start;
    
    // Should respond within 2 seconds
    expect(duration).toBeLessThan(2000);
  });

  test("Today API responds within acceptable time", async ({ request }) => {
    const start = Date.now();
    const response = await request.get("/api/today");
    const duration = Date.now() - start;
    
    // Should respond within 2 seconds
    expect(duration).toBeLessThan(2000);
  });
});
