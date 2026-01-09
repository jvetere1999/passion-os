/**
 * Today Visibility Logic Tests
 */

import { describe, it, expect } from "vitest";
import {
  getTodayVisibility,
  getDefaultVisibility,
  resolveUserState,
  type TodayUserState,
} from "../todayVisibility";

describe("resolveUserState", () => {
  it("returns focus_active when focusActive is true (P1)", () => {
    const state: TodayUserState = {
      planExists: true,
      hasIncompletePlanItems: true,
      returningAfterGap: true,
      firstDay: true,
      focusActive: true,
      activeStreak: true,
    };
    expect(resolveUserState(state)).toBe("focus_active");
  });

  it("returns first_day when firstDay is true and no focus active (P2)", () => {
    const state: TodayUserState = {
      planExists: true,
      hasIncompletePlanItems: true,
      returningAfterGap: true,
      firstDay: true,
      focusActive: false,
      activeStreak: true,
    };
    expect(resolveUserState(state)).toBe("first_day");
  });

  it("returns returning_after_gap when returningAfterGap is true (P3)", () => {
    const state: TodayUserState = {
      planExists: true,
      hasIncompletePlanItems: true,
      returningAfterGap: true,
      firstDay: false,
      focusActive: false,
      activeStreak: true,
    };
    expect(resolveUserState(state)).toBe("returning_after_gap");
  });

  it("returns plan_exists when plan has incomplete items (P4)", () => {
    const state: TodayUserState = {
      planExists: true,
      hasIncompletePlanItems: true,
      returningAfterGap: false,
      firstDay: false,
      focusActive: false,
      activeStreak: true,
    };
    expect(resolveUserState(state)).toBe("plan_exists");
  });

  it("returns active_streak when user has active streak (P5)", () => {
    const state: TodayUserState = {
      planExists: false,
      hasIncompletePlanItems: false,
      returningAfterGap: false,
      firstDay: false,
      focusActive: false,
      activeStreak: true,
    };
    expect(resolveUserState(state)).toBe("active_streak");
  });

  it("returns default when no special conditions (P6)", () => {
    const state: TodayUserState = {
      planExists: false,
      hasIncompletePlanItems: false,
      returningAfterGap: false,
      firstDay: false,
      focusActive: false,
      activeStreak: false,
    };
    expect(resolveUserState(state)).toBe("default");
  });

  it("requires both planExists and hasIncompletePlanItems for plan_exists", () => {
    const state: TodayUserState = {
      planExists: true,
      hasIncompletePlanItems: false, // All items complete
      returningAfterGap: false,
      firstDay: false,
      focusActive: false,
      activeStreak: false,
    };
    expect(resolveUserState(state)).toBe("default");
  });
});

describe("getTodayVisibility", () => {
  it("hides everything except StarterBlock when focusActive", () => {
    const state: TodayUserState = {
      planExists: false,
      hasIncompletePlanItems: false,
      returningAfterGap: false,
      firstDay: false,
      focusActive: true,
      activeStreak: false,
    };
    const visibility = getTodayVisibility(state);

    expect(visibility.showStarterBlock).toBe(true);
    expect(visibility.showDailyPlan).toBe(false);
    expect(visibility.showExplore).toBe(false);
    expect(visibility.hideExplore).toBe(true);
    expect(visibility.showRewards).toBe(false);
    expect(visibility.resolvedState).toBe("focus_active");
  });

  it("shows reduced UI for first day users", () => {
    const state: TodayUserState = {
      planExists: false,
      hasIncompletePlanItems: false,
      returningAfterGap: false,
      firstDay: true,
      focusActive: false,
      activeStreak: false,
    };
    const visibility = getTodayVisibility(state);

    expect(visibility.showStarterBlock).toBe(true);
    expect(visibility.showDailyPlan).toBe(false);
    expect(visibility.showExplore).toBe(true);
    expect(visibility.forceExploreCollapsed).toBe(true);
    expect(visibility.showRewards).toBe(false);
    expect(visibility.maxQuickLinks).toBe(3);
    expect(visibility.resolvedState).toBe("first_day");
  });

  it("shows reduced mode banner when returning after gap", () => {
    const state: TodayUserState = {
      planExists: false,
      hasIncompletePlanItems: false,
      returningAfterGap: true,
      firstDay: false,
      focusActive: false,
      activeStreak: false,
    };
    const visibility = getTodayVisibility(state);

    expect(visibility.showReducedModeBanner).toBe(true);
    expect(visibility.showDailyPlan).toBe(true);
    expect(visibility.forceDailyPlanCollapsed).toBe(true);
    expect(visibility.showExplore).toBe(true);
    expect(visibility.forceExploreCollapsed).toBe(true);
    expect(visibility.showRewards).toBe(false);
    expect(visibility.resolvedState).toBe("returning_after_gap");
  });

  it("shows full UI for active streak users", () => {
    const state: TodayUserState = {
      planExists: false,
      hasIncompletePlanItems: false,
      returningAfterGap: false,
      firstDay: false,
      focusActive: false,
      activeStreak: true,
    };
    const visibility = getTodayVisibility(state);

    expect(visibility.showStarterBlock).toBe(true);
    expect(visibility.showDailyPlan).toBe(true);
    expect(visibility.forceDailyPlanCollapsed).toBe(false);
    expect(visibility.showExplore).toBe(true);
    expect(visibility.showRewards).toBe(true);
    expect(visibility.resolvedState).toBe("active_streak");
  });

  it("returns default visibility for normal users", () => {
    const state: TodayUserState = {
      planExists: false,
      hasIncompletePlanItems: false,
      returningAfterGap: false,
      firstDay: false,
      focusActive: false,
      activeStreak: false,
    };
    const visibility = getTodayVisibility(state);

    expect(visibility.showStarterBlock).toBe(true);
    expect(visibility.showDailyPlan).toBe(true);
    expect(visibility.showExplore).toBe(true);
    expect(visibility.showRewards).toBe(true);
    expect(visibility.resolvedState).toBe("default");
  });
});

describe("getDefaultVisibility", () => {
  it("returns full visibility for feature flag OFF", () => {
    const visibility = getDefaultVisibility();

    expect(visibility.showStarterBlock).toBe(true);
    expect(visibility.showDailyPlan).toBe(true);
    expect(visibility.forceDailyPlanCollapsed).toBe(false);
    expect(visibility.showExplore).toBe(true);
    expect(visibility.forceExploreCollapsed).toBe(false);
    expect(visibility.hideExplore).toBe(false);
    expect(visibility.showRewards).toBe(true);
    expect(visibility.resolvedState).toBe("default");
  });
});

