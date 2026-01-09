/**
 * Next Action Resolver Tests
 */

import { describe, it, expect } from "vitest";
import {
  resolveNextAction,
  resolveStarterAction,
  type ResolverState,
  type DailyPlan,
  type PlanItem,
} from "../resolveNextAction";

// Helper to create a plan item
function createPlanItem(overrides: Partial<PlanItem> = {}): PlanItem {
  return {
    id: "item-1",
    type: "focus",
    title: "Test Task",
    actionUrl: "/focus",
    completed: false,
    priority: 1,
    ...overrides,
  };
}

// Helper to create a daily plan
function createPlan(items: PlanItem[] = []): DailyPlan {
  const validItems = items.filter((i) => i != null);
  const completedCount = validItems.filter((i) => i.completed).length;
  return {
    id: "plan-1",
    date: "2026-01-04",
    items,
    completedCount,
    totalCount: items.length,
  };
}

describe("resolveNextAction", () => {
  describe("No plan scenarios", () => {
    it("returns Focus fallback when plan is null", () => {
      const state: ResolverState = { plan: null };
      const result = resolveNextAction(state);

      expect(result.href).toBe("/focus");
      expect(result.label).toBe("Start Focus");
      expect(result.reason).toBe("no_plan_fallback");
      expect(result.type).toBe("focus");
    });

    it("returns Focus fallback when plan is undefined", () => {
      const state: ResolverState = { plan: null };
      const result = resolveNextAction(state);

      expect(result.href).toBe("/focus");
      expect(result.reason).toBe("no_plan_fallback");
    });

    it("returns Quests fallback when already on Focus", () => {
      const state: ResolverState = { plan: null, currentRoute: "/focus" };
      const result = resolveNextAction(state);

      expect(result.href).toBe("/quests");
      expect(result.label).toBe("One small quest");
      expect(result.reason).toBe("no_plan_fallback");
      expect(result.type).toBe("quest");
    });

    it("returns Learn fallback when on Focus and Quests", () => {
      const state: ResolverState = { plan: null, currentRoute: "/quests" };
      const result = resolveNextAction(state);

      expect(result.href).toBe("/focus");
      expect(result.label).toBe("Start Focus");
    });
  });

  describe("Plan exists - all complete", () => {
    it("returns Focus fallback when all items complete", () => {
      const plan = createPlan([
        createPlanItem({ id: "1", completed: true }),
        createPlanItem({ id: "2", completed: true }),
      ]);
      const state: ResolverState = { plan };
      const result = resolveNextAction(state);

      expect(result.href).toBe("/focus");
      expect(result.label).toBe("Start Focus");
      // Both complete plan and no plan use the same fallback mechanism
      expect(result.reason).toBe("no_plan_fallback");
    });
  });

  describe("Plan exists - incomplete items", () => {
    it("returns first incomplete item by priority", () => {
      const plan = createPlan([
        createPlanItem({ id: "1", priority: 3, completed: false, title: "Low Priority", actionUrl: "/quests/low" }),
        createPlanItem({ id: "2", priority: 1, completed: false, title: "High Priority", actionUrl: "/quests/high" }),
        createPlanItem({ id: "3", priority: 2, completed: false, title: "Med Priority", actionUrl: "/quests/med" }),
      ]);
      const state: ResolverState = { plan };
      const result = resolveNextAction(state);

      expect(result.href).toBe("/quests/high");
      expect(result.label).toBe("Continue: High Priority");
      expect(result.reason).toBe("plan_incomplete_item");
      expect(result.entityId).toBe("2");
    });

    it("skips completed items", () => {
      const plan = createPlan([
        createPlanItem({ id: "1", priority: 1, completed: true, title: "Done", actionUrl: "/quests/done" }),
        createPlanItem({ id: "2", priority: 2, completed: false, title: "Todo", actionUrl: "/quests/todo" }),
      ]);
      const state: ResolverState = { plan };
      const result = resolveNextAction(state);

      expect(result.href).toBe("/quests/todo");
      expect(result.label).toBe("Continue: Todo");
      expect(result.entityId).toBe("2");
    });

    it("handles items with same priority (array order)", () => {
      const plan = createPlan([
        createPlanItem({ id: "1", priority: 1, completed: false, title: "First", actionUrl: "/first" }),
        createPlanItem({ id: "2", priority: 1, completed: false, title: "Second", actionUrl: "/second" }),
      ]);
      const state: ResolverState = { plan };
      const result = resolveNextAction(state);

      // Should return first in array order when priority is equal
      expect(result.href).toBe("/first");
      expect(result.label).toBe("Continue: First");
    });

    it("includes item title in label", () => {
      const plan = createPlan([
        createPlanItem({ title: "Review code changes", actionUrl: "/quests/review" }),
      ]);
      const state: ResolverState = { plan };
      const result = resolveNextAction(state);

      expect(result.label).toBe("Continue: Review code changes");
      expect(result.itemTitle).toBe("Review code changes");
    });

    it("preserves item type for icon selection", () => {
      const plan = createPlan([
        createPlanItem({ type: "workout", actionUrl: "/exercise" }),
      ]);
      const state: ResolverState = { plan };
      const result = resolveNextAction(state);

      expect(result.type).toBe("workout");
    });
  });

  describe("Missing fields fallback", () => {
    it("handles missing priority (defaults to 999)", () => {
      const plan = createPlan([
        { id: "1", type: "focus", title: "No Priority", actionUrl: "/a", completed: false } as PlanItem,
        createPlanItem({ id: "2", priority: 1, title: "Has Priority", actionUrl: "/b" }),
      ]);
      const state: ResolverState = { plan };
      const result = resolveNextAction(state);

      // Item with explicit priority should come first
      expect(result.href).toBe("/b");
    });

    it("handles missing title", () => {
      const plan = createPlan([
        { id: "1", type: "focus", actionUrl: "/focus", completed: false, priority: 1 } as PlanItem,
      ]);
      const state: ResolverState = { plan };
      const result = resolveNextAction(state);

      expect(result.label).toBe("Continue: Task");
    });

    it("skips items with empty actionUrl", () => {
      const plan = createPlan([
        createPlanItem({ id: "1", priority: 1, actionUrl: "", title: "Bad Item" }),
        createPlanItem({ id: "2", priority: 2, actionUrl: "/valid", title: "Good Item" }),
      ]);
      const state: ResolverState = { plan };
      const result = resolveNextAction(state);

      expect(result.href).toBe("/valid");
      expect(result.label).toBe("Continue: Good Item");
    });

    it("handles empty items array", () => {
      const plan = createPlan([]);
      const state: ResolverState = { plan };
      const result = resolveNextAction(state);

      expect(result.href).toBe("/focus");
      expect(result.reason).toBe("no_plan_fallback");
    });

    it("handles null items array", () => {
      const plan = { id: "1", date: "2026-01-04", items: null as unknown as PlanItem[], completedCount: 0, totalCount: 0 };
      const state: ResolverState = { plan };
      const result = resolveNextAction(state);

      expect(result.href).toBe("/focus");
      expect(result.reason).toBe("no_plan_fallback");
    });

    it("handles undefined items in array", () => {
      const plan = createPlan([
        undefined as unknown as PlanItem,
        createPlanItem({ id: "2", actionUrl: "/valid", title: "Valid" }),
      ]);
      const state: ResolverState = { plan };
      const result = resolveNextAction(state);

      expect(result.href).toBe("/valid");
    });
  });

  describe("Noop detection", () => {
    it("returns noop reason when already on target route", () => {
      const plan = createPlan([
        createPlanItem({ actionUrl: "/focus" }),
      ]);
      const state: ResolverState = { plan, currentRoute: "/focus" };
      const result = resolveNextAction(state);

      expect(result.href).toBe("/focus");
      expect(result.reason).toBe("noop");
    });

    it("returns noop for plan complete fallback", () => {
      const plan = createPlan([
        createPlanItem({ completed: true }),
      ]);
      const state: ResolverState = { plan, currentRoute: "/focus" };
      const result = resolveNextAction(state);

      expect(result.reason).toBe("noop");
    });
  });
});

describe("resolveStarterAction", () => {
  it("returns Focus for null plan", () => {
    const result = resolveStarterAction(null);

    expect(result.href).toBe("/focus");
    expect(result.label).toBe("Start Focus");
  });

  it("returns first incomplete item", () => {
    const plan = createPlan([
      createPlanItem({ title: "My Task", actionUrl: "/quests/my-task" }),
    ]);
    const result = resolveStarterAction(plan);

    expect(result.href).toBe("/quests/my-task");
    expect(result.label).toBe("Continue: My Task");
  });

  it("never returns noop (no currentRoute check)", () => {
    const result = resolveStarterAction(null);
    expect(result.reason).not.toBe("noop");
  });
});

