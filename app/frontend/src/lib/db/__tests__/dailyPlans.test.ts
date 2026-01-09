/**
 * Daily Plans Repository Tests
 */

import { describe, it, expect, vi } from "vitest";
import {
  getDailyPlanSummary,
  isFirstDay,
  hasFocusActive,
  hasActiveStreak,
  getTodayServerState,
  getDynamicUIData,
} from "../repositories/dailyPlans";

// Mock D1Database
function createMockDb(mockResults: Record<string, unknown>) {
  return {
    prepare: vi.fn((sql: string) => ({
      bind: vi.fn(() => ({
        first: vi.fn(async () => mockResults[sql] ?? null),
        all: vi.fn(async () => ({ results: mockResults[sql] ?? [] })),
      })),
    })),
  } as unknown as import("@cloudflare/workers-types").D1Database;
}

describe("getDailyPlanSummary", () => {
  const userId = "test-user-123";

  it("returns empty summary when no plan exists", async () => {
    const db = createMockDb({});
    const result = await getDailyPlanSummary(db, userId);

    expect(result.planExists).toBe(false);
    expect(result.hasIncompletePlanItems).toBe(false);
    expect(result.nextIncompleteItem).toBeNull();
    expect(result.totalCount).toBe(0);
    expect(result.completedCount).toBe(0);
  });

  it("returns plan summary when plan exists with incomplete items", async () => {
    const items = [
      { id: "item1", title: "Focus", priority: 0, actionUrl: "/focus", type: "focus", completed: false },
      { id: "item2", title: "Quest", priority: 1, actionUrl: "/quests", type: "quest", completed: true },
      { id: "item3", title: "Workout", priority: 2, actionUrl: "/exercise", type: "workout", completed: false },
    ];

    const db = createMockDb({
      [`SELECT id, items, completed_count, total_count 
         FROM daily_plans 
         WHERE user_id = ? AND plan_date = ?`]: {
        id: "plan-123",
        items: JSON.stringify(items),
        completed_count: 1,
        total_count: 3,
      },
    });

    const result = await getDailyPlanSummary(db, userId);

    expect(result.planExists).toBe(true);
    expect(result.hasIncompletePlanItems).toBe(true);
    expect(result.nextIncompleteItem).toEqual({
      id: "item1",
      title: "Focus",
      priority: 0,
      actionUrl: "/focus",
      type: "focus",
    });
    expect(result.totalCount).toBe(3);
    expect(result.completedCount).toBe(1);
  });

  it("returns plan summary with no incomplete items when all complete", async () => {
    const items = [
      { id: "item1", title: "Focus", priority: 0, actionUrl: "/focus", type: "focus", completed: true },
      { id: "item2", title: "Quest", priority: 1, actionUrl: "/quests", type: "quest", completed: true },
    ];

    const db = createMockDb({
      [`SELECT id, items, completed_count, total_count 
         FROM daily_plans 
         WHERE user_id = ? AND plan_date = ?`]: {
        id: "plan-123",
        items: JSON.stringify(items),
        completed_count: 2,
        total_count: 2,
      },
    });

    const result = await getDailyPlanSummary(db, userId);

    expect(result.planExists).toBe(true);
    expect(result.hasIncompletePlanItems).toBe(false);
    expect(result.nextIncompleteItem).toBeNull();
  });

  it("sorts incomplete items by priority", async () => {
    const items = [
      { id: "item1", title: "Low priority", priority: 5, actionUrl: "/a", type: "focus", completed: false },
      { id: "item2", title: "High priority", priority: 1, actionUrl: "/b", type: "quest", completed: false },
      { id: "item3", title: "Medium priority", priority: 3, actionUrl: "/c", type: "workout", completed: false },
    ];

    const db = createMockDb({
      [`SELECT id, items, completed_count, total_count 
         FROM daily_plans 
         WHERE user_id = ? AND plan_date = ?`]: {
        id: "plan-123",
        items: JSON.stringify(items),
        completed_count: 0,
        total_count: 3,
      },
    });

    const result = await getDailyPlanSummary(db, userId);

    expect(result.nextIncompleteItem?.id).toBe("item2");
    expect(result.nextIncompleteItem?.title).toBe("High priority");
  });
});

describe("isFirstDay", () => {
  const userId = "test-user-123";

  it("returns true when no activity events exist", async () => {
    const db = createMockDb({});
    const result = await isFirstDay(db, userId);
    expect(result).toBe(true);
  });

  it("returns false when activity events exist", async () => {
    const db = createMockDb({
      [`SELECT 1 FROM activity_events WHERE user_id = ? LIMIT 1`]: { 1: 1 },
    });
    const result = await isFirstDay(db, userId);
    expect(result).toBe(false);
  });
});

describe("hasFocusActive", () => {
  const userId = "test-user-123";

  it("returns false when no active focus session", async () => {
    const db = createMockDb({});
    const result = await hasFocusActive(db, userId);
    expect(result).toBe(false);
  });

  it("returns true when active focus session exists", async () => {
    const db = createMockDb({
      [`SELECT id, expires_at 
         FROM focus_sessions 
         WHERE user_id = ? AND status = 'active' 
         LIMIT 1`]: { id: "session-123", expires_at: null },
    });
    const result = await hasFocusActive(db, userId);
    expect(result).toBe(true);
  });

  it("returns false when focus session is expired", async () => {
    const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    const db = createMockDb({
      [`SELECT id, expires_at 
         FROM focus_sessions 
         WHERE user_id = ? AND status = 'active' 
         LIMIT 1`]: { id: "session-123", expires_at: pastDate },
    });
    const result = await hasFocusActive(db, userId);
    expect(result).toBe(false);
  });

  it("returns true when focus session is not yet expired", async () => {
    const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
    const db = createMockDb({
      [`SELECT id, expires_at 
         FROM focus_sessions 
         WHERE user_id = ? AND status = 'active' 
         LIMIT 1`]: { id: "session-123", expires_at: futureDate },
    });
    const result = await hasFocusActive(db, userId);
    expect(result).toBe(true);
  });
});

describe("hasActiveStreak", () => {
  const userId = "test-user-123";

  it("returns false when no streaks exist", async () => {
    const db = createMockDb({});
    const result = await hasActiveStreak(db, userId);
    expect(result).toBe(false);
  });

  it("returns true when streak exists with recent activity", async () => {
    const recentDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    const db = createMockDb({
      [`SELECT current_streak, last_activity_date 
         FROM user_streaks 
         WHERE user_id = ? AND current_streak >= 1 
         ORDER BY current_streak DESC 
         LIMIT 1`]: { current_streak: 5, last_activity_date: recentDate },
    });
    const result = await hasActiveStreak(db, userId);
    expect(result).toBe(true);
  });

  it("returns false when streak exists but last activity too old", async () => {
    const oldDate = new Date(Date.now() - 48 * 3600000).toISOString(); // 48 hours ago
    const db = createMockDb({
      [`SELECT current_streak, last_activity_date 
         FROM user_streaks 
         WHERE user_id = ? AND current_streak >= 1 
         ORDER BY current_streak DESC 
         LIMIT 1`]: { current_streak: 5, last_activity_date: oldDate },
    });
    const result = await hasActiveStreak(db, userId);
    expect(result).toBe(false);
  });

  it("returns true when streak exists with null last_activity_date", async () => {
    const db = createMockDb({
      [`SELECT current_streak, last_activity_date 
         FROM user_streaks 
         WHERE user_id = ? AND current_streak >= 1 
         ORDER BY current_streak DESC 
         LIMIT 1`]: { current_streak: 3, last_activity_date: null },
    });
    const result = await hasActiveStreak(db, userId);
    expect(result).toBe(true);
  });
});

describe("getTodayServerState", () => {
  const userId = "test-user-123";

  it("returns complete state with all fields populated", async () => {
    // This test uses a simplified mock that returns different results per query
    let callCount = 0;
    const mockDb = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(async () => {
            callCount++;
            if (callCount === 1) {
              // getDailyPlanSummary
              return {
                id: "plan-123",
                items: JSON.stringify([
                  { id: "item1", title: "Focus", priority: 0, actionUrl: "/focus", type: "focus", completed: false },
                ]),
                completed_count: 0,
                total_count: 1,
              };
            }
            if (callCount === 2) {
              // isFirstDay - has activity
              return { 1: 1 };
            }
            if (callCount === 3) {
              // hasFocusActive - no active session
              return null;
            }
            if (callCount === 4) {
              // hasActiveStreak - has streak
              return { current_streak: 5, last_activity_date: new Date().toISOString() };
            }
            return null;
          }),
        })),
      })),
    } as unknown as import("@cloudflare/workers-types").D1Database;

    const result = await getTodayServerState(mockDb, userId, false);

    expect(result.planExists).toBe(true);
    expect(result.hasIncompletePlanItems).toBe(true);
    expect(result.returningAfterGap).toBe(false);
    expect(result.firstDay).toBe(false);
    expect(result.focusActive).toBe(false);
    expect(result.activeStreak).toBe(true);
  });
});

// Dynamic UI Data Tests
describe("getDynamicUIData", () => {
  const userId = "test-user-123";

  it("returns empty data when no activity exists", async () => {
    const db = createMockDb({});
    const result = await getDynamicUIData(db, userId);

    expect(result.quickPicks).toEqual([]);
    expect(result.resumeLast).toBeNull();
    expect(result.interestPrimer).toBeNull();
  });

  it("returns quick picks from activity events", async () => {
    // Create a more sophisticated mock that handles different queries
    let queryCount = 0;
    const mockDb = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(async () => {
            queryCount++;
            // getInterestPrimer queries (queries 4 and 5)
            if (queryCount === 4) return { count: 2 }; // learn count
            if (queryCount === 5) return { count: 5 }; // focus count
            return null;
          }),
          all: vi.fn(async () => {
            queryCount++;
            // getQuickPicks query (query 1)
            if (queryCount === 1) {
              return {
                results: [
                  { event_type: "focus_complete", count: 15 },
                  { event_type: "workout_complete", count: 8 },
                  { event_type: "quest_complete", count: 2 }, // below threshold
                ],
              };
            }
            return { results: [] };
          }),
        })),
      })),
    } as unknown as import("@cloudflare/workers-types").D1Database;

    const result = await getDynamicUIData(mockDb, userId);

    expect(result.quickPicks.length).toBe(2);
    expect(result.quickPicks[0].module).toBe("focus");
    expect(result.quickPicks[0].count).toBe(15);
    expect(result.quickPicks[1].module).toBe("exercise");
    expect(result.quickPicks[1].count).toBe(8);
  });

  it("returns resume last from recent activity", async () => {
    const recentTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    let queryCount = 0;
    const mockDb = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(async () => {
            queryCount++;
            // getResumeLast query (query 2)
            if (queryCount === 2) {
              return { event_type: "focus_complete", created_at: recentTime };
            }
            // getInterestPrimer queries
            if (queryCount === 3) return { count: 0 };
            if (queryCount === 4) return { count: 0 };
            return null;
          }),
          all: vi.fn(async () => {
            queryCount++;
            // getQuickPicks returns nothing
            return { results: [] };
          }),
        })),
      })),
    } as unknown as import("@cloudflare/workers-types").D1Database;

    const result = await getDynamicUIData(mockDb, userId);

    expect(result.resumeLast).not.toBeNull();
    expect(result.resumeLast?.module).toBe("focus");
    expect(result.resumeLast?.route).toBe("/focus");
    expect(result.resumeLast?.label).toBe("Focus");
  });

  it("returns learn interest primer for active learners", async () => {
    let queryCount = 0;
    const mockDb = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(async () => {
            queryCount++;
            // getInterestPrimer - learn count (query 3)
            if (queryCount === 3) return { count: 10 }; // high learn activity
            if (queryCount === 4) return { count: 0 };
            return null;
          }),
          all: vi.fn(async () => {
            queryCount++;
            return { results: [] };
          }),
        })),
      })),
    } as unknown as import("@cloudflare/workers-types").D1Database;

    const result = await getDynamicUIData(mockDb, userId);

    expect(result.interestPrimer).not.toBeNull();
    expect(result.interestPrimer?.type).toBe("learn");
    expect(result.interestPrimer?.route).toBe("/learn");
  });

  it("returns hub interest primer for focus-heavy users", async () => {
    let queryCount = 0;
    const mockDb = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(async () => {
            queryCount++;
            // getInterestPrimer - learn count (query 3)
            if (queryCount === 3) return { count: 1 }; // low learn activity
            // focus count (query 4)
            if (queryCount === 4) return { count: 15 }; // high focus activity
            return null;
          }),
          all: vi.fn(async () => {
            queryCount++;
            return { results: [] };
          }),
        })),
      })),
    } as unknown as import("@cloudflare/workers-types").D1Database;

    const result = await getDynamicUIData(mockDb, userId);

    expect(result.interestPrimer).not.toBeNull();
    expect(result.interestPrimer?.type).toBe("hub");
    expect(result.interestPrimer?.route).toBe("/hub");
  });

  it("handles errors gracefully and returns empty data", async () => {
    const mockDb = {
      prepare: vi.fn(() => {
        throw new Error("Database error");
      }),
    } as unknown as import("@cloudflare/workers-types").D1Database;

    const result = await getDynamicUIData(mockDb, userId);

    expect(result.quickPicks).toEqual([]);
    expect(result.resumeLast).toBeNull();
    expect(result.interestPrimer).toBeNull();
  });
});

