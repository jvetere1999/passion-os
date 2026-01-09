/**
 * Safety Nets Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isValidActionRoute,
  validateResolverOutput,
  validateDailyPlan,
  isValidPlanItem,
  getValidPlanItems,
  validateVisibility,
  safeSessionStorageGet,
  safeSessionStorageSet,
  withFallback,
  withFallbackAsync,
  FALLBACK_ACTION,
} from "../safetyNets";
import type { ResolvedAction, DailyPlan, PlanItem } from "../resolveNextAction";
import type { TodayVisibility } from "../todayVisibility";

describe("isValidActionRoute", () => {
  it("returns true for valid routes", () => {
    expect(isValidActionRoute("/focus")).toBe(true);
    expect(isValidActionRoute("/quests")).toBe(true);
    expect(isValidActionRoute("/quests/abc-123")).toBe(true);
    expect(isValidActionRoute("/exercise")).toBe(true);
    expect(isValidActionRoute("/learn")).toBe(true);
    expect(isValidActionRoute("/habits")).toBe(true);
  });

  it("returns false for null/undefined", () => {
    expect(isValidActionRoute(null)).toBe(false);
    expect(isValidActionRoute(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidActionRoute("")).toBe(false);
  });

  it("returns false for routes not starting with /", () => {
    expect(isValidActionRoute("focus")).toBe(false);
    expect(isValidActionRoute("http://example.com")).toBe(false);
  });

  it("returns false for dangerous patterns", () => {
    expect(isValidActionRoute("javascript:alert(1)")).toBe(false);
    expect(isValidActionRoute("data:text/html,<script>")).toBe(false);
  });
});

describe("validateResolverOutput", () => {
  it("returns fallback for null", () => {
    const result = validateResolverOutput(null);
    expect(result).toEqual(FALLBACK_ACTION);
  });

  it("returns fallback for undefined", () => {
    const result = validateResolverOutput(undefined);
    expect(result).toEqual(FALLBACK_ACTION);
  });

  it("returns fallback for invalid href", () => {
    const action: ResolvedAction = {
      href: "invalid",
      label: "Test",
      reason: "plan_incomplete_item",
      type: "focus",
    };
    const result = validateResolverOutput(action);
    expect(result).toEqual(FALLBACK_ACTION);
  });

  it("returns action with fixed label if empty", () => {
    const action: ResolvedAction = {
      href: "/focus",
      label: "",
      reason: "no_plan_fallback",
      type: "focus",
    };
    const result = validateResolverOutput(action);
    expect(result.label).toBe("Continue");
    expect(result.href).toBe("/focus");
  });

  it("returns valid action unchanged", () => {
    const action: ResolvedAction = {
      href: "/quests/abc",
      label: "My Quest",
      reason: "plan_incomplete_item",
      type: "quest",
    };
    const result = validateResolverOutput(action);
    expect(result).toEqual(action);
  });
});

describe("validateDailyPlan", () => {
  it("returns null for null input", () => {
    expect(validateDailyPlan(null)).toBe(null);
  });

  it("returns null for undefined input", () => {
    expect(validateDailyPlan(undefined)).toBe(null);
  });

  it("returns null for plan without items array", () => {
    const plan = { id: "1", date: "2026-01-04" } as DailyPlan;
    expect(validateDailyPlan(plan)).toBe(null);
  });

  it("returns null for plan without id", () => {
    const plan = { items: [], date: "2026-01-04" } as unknown as DailyPlan;
    expect(validateDailyPlan(plan)).toBe(null);
  });

  it("returns valid plan unchanged", () => {
    const plan: DailyPlan = {
      id: "plan-1",
      date: "2026-01-04",
      items: [],
      completedCount: 0,
      totalCount: 0,
    };
    expect(validateDailyPlan(plan)).toEqual(plan);
  });
});

describe("isValidPlanItem", () => {
  it("returns false for null", () => {
    expect(isValidPlanItem(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isValidPlanItem(undefined)).toBe(false);
  });

  it("returns false for item without id", () => {
    const item = { actionUrl: "/focus", completed: false } as PlanItem;
    expect(isValidPlanItem(item)).toBe(false);
  });

  it("returns false for item without actionUrl", () => {
    const item = { id: "1", completed: false } as PlanItem;
    expect(isValidPlanItem(item)).toBe(false);
  });

  it("returns false for item without completed boolean", () => {
    const item = { id: "1", actionUrl: "/focus" } as PlanItem;
    expect(isValidPlanItem(item)).toBe(false);
  });

  it("returns true for valid item", () => {
    const item: PlanItem = {
      id: "1",
      type: "focus",
      title: "Test",
      actionUrl: "/focus",
      completed: false,
      priority: 1,
    };
    expect(isValidPlanItem(item)).toBe(true);
  });
});

describe("getValidPlanItems", () => {
  it("returns empty array for null plan", () => {
    expect(getValidPlanItems(null)).toEqual([]);
  });

  it("filters out invalid items", () => {
    const plan: DailyPlan = {
      id: "plan-1",
      date: "2026-01-04",
      items: [
        { id: "1", type: "focus", title: "Valid", actionUrl: "/focus", completed: false, priority: 1 },
        { id: "", type: "focus", title: "No ID", actionUrl: "/focus", completed: false, priority: 2 } as PlanItem,
        null as unknown as PlanItem,
      ],
      completedCount: 0,
      totalCount: 3,
    };
    const result = getValidPlanItems(plan);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });
});

describe("validateVisibility", () => {
  it("returns visibility unchanged if CTA visible", () => {
    const visibility: TodayVisibility = {
      showStarterBlock: true,
      showReducedModeBanner: false,
      showDailyPlan: false,
      forceDailyPlanCollapsed: false,
      showExplore: false,
      forceExploreCollapsed: false,
      hideExplore: true,
      showRewards: false,
      maxQuickLinks: 3,
      resolvedState: "focus_active",
    };
    expect(validateVisibility(visibility)).toEqual(visibility);
  });

  it("forces StarterBlock visible if all CTAs hidden", () => {
    const visibility: TodayVisibility = {
      showStarterBlock: false,
      showReducedModeBanner: false,
      showDailyPlan: false,
      forceDailyPlanCollapsed: false,
      showExplore: false,
      forceExploreCollapsed: false,
      hideExplore: true,
      showRewards: false,
      maxQuickLinks: 0,
      resolvedState: "default",
    };
    const result = validateVisibility(visibility);
    expect(result.showStarterBlock).toBe(true);
  });
});

describe("withFallback", () => {
  it("returns function result on success", () => {
    const result = withFallback(() => "success", "fallback", "test");
    expect(result).toBe("success");
  });

  it("returns fallback on error", () => {
    const result = withFallback(
      () => {
        throw new Error("test error");
      },
      "fallback",
      "test"
    );
    expect(result).toBe("fallback");
  });
});

describe("withFallbackAsync", () => {
  it("returns async function result on success", async () => {
    const result = await withFallbackAsync(
      async () => "success",
      "fallback",
      "test"
    );
    expect(result).toBe("success");
  });

  it("returns fallback on async error", async () => {
    const result = await withFallbackAsync(
      async () => {
        throw new Error("test error");
      },
      "fallback",
      "test"
    );
    expect(result).toBe("fallback");
  });
});

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

describe("safeSessionStorageGet", () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    vi.clearAllMocks();
  });

  it("returns value when available", () => {
    mockSessionStorage.setItem("test", "value");
    expect(safeSessionStorageGet("test")).toBe("value");
  });

  it("returns null for missing key", () => {
    expect(safeSessionStorageGet("missing")).toBe(null);
  });
});

describe("safeSessionStorageSet", () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    vi.clearAllMocks();
  });

  it("returns true on success", () => {
    expect(safeSessionStorageSet("test", "value")).toBe(true);
    expect(mockSessionStorage.getItem("test")).toBe("value");
  });
});

