/**
 * Today Page Types
 *
 * Type definitions for the Today dashboard.
 * These types are used by both server and client components.
 *
 * Note: These were previously in @/lib/db/repositories/dailyPlans
 * but have been extracted to remove D1 dependency.
 */

// ============================================================================
// PLAN TYPES
// ============================================================================

/**
 * Plan item structure
 */
export interface PlanItem {
  id: string;
  type: "focus" | "quest" | "workout" | "learning" | "habit";
  title: string;
  description?: string;
  duration?: number;
  actionUrl: string;
  completed: boolean;
  priority: number;
}

/**
 * Daily plan summary for Today page state
 */
export interface DailyPlanSummary {
  /** Plan exists for today */
  planExists: boolean;
  /** Has at least one incomplete item */
  hasIncompletePlanItems: boolean;
  /** First incomplete item (sorted by priority) */
  nextIncompleteItem: {
    id: string;
    title: string;
    priority: number;
    actionUrl: string;
    type: PlanItem["type"];
  } | null;
  /** Total items in plan */
  totalCount: number;
  /** Completed items count */
  completedCount: number;
}

// ============================================================================
// SERVER STATE TYPES
// ============================================================================

/**
 * Complete Today user state for visibility calculations
 */
export interface TodayServerState {
  planExists: boolean;
  hasIncompletePlanItems: boolean;
  nextIncompleteItem: DailyPlanSummary["nextIncompleteItem"];
  returningAfterGap: boolean;
  firstDay: boolean;
  focusActive: boolean;
  activeStreak: boolean;
}

/**
 * User state for visibility calculations
 */
export interface TodayUserState {
  planExists: boolean;
  hasIncompletePlanItems: boolean;
  returningAfterGap: boolean;
  firstDay: boolean;
  focusActive: boolean;
  activeStreak: boolean;
}

// ============================================================================
// VISIBILITY TYPES
// ============================================================================

/**
 * Today page visibility settings
 */
export interface TodayVisibility {
  showStarterBlock: boolean;
  showDailyPlan: boolean;
  showExplore: boolean;
  hideExplore: boolean;
  showRewards: boolean;
  showReducedModeBanner: boolean;
  forceDailyPlanCollapsed: boolean;
  forceExploreCollapsed: boolean;
}

// ============================================================================
// DYNAMIC UI TYPES
// ============================================================================

/**
 * Quick pick item for dynamic UI
 */
export interface QuickPick {
  module: string;
  route: string;
  label: string;
  count: number;
}

/**
 * Resume last item for dynamic UI
 */
export interface ResumeLast {
  module: string;
  route: string;
  label: string;
  lastUsed: string; // ISO timestamp
}

/**
 * Interest primer for dynamic UI
 */
export interface InterestPrimer {
  type: "learn" | "hub";
  route: string;
  label: string;
}

/**
 * Complete dynamic UI data
 */
export interface DynamicUIData {
  /** Top 2 most-used modules from last 14 days */
  quickPicks: QuickPick[];
  /** Most recently used module within 24 hours */
  resumeLast: ResumeLast | null;
  /** Interest primer based on learn/hub frequency */
  interestPrimer: InterestPrimer | null;
}

// ============================================================================
// PERSONALIZATION TYPES
// ============================================================================

/**
 * User personalization settings
 */
export interface UserPersonalization {
  preferredActivities: string[];
  focusDuration: number;
  dailyGoalMinutes: number;
  streakGoal: number;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Get default (empty) user state
 */
export function getDefaultUserState(): TodayUserState {
  return {
    planExists: false,
    hasIncompletePlanItems: false,
    returningAfterGap: false,
    firstDay: false,
    focusActive: false,
    activeStreak: false,
  };
}

/**
 * Get default visibility (all visible)
 */
export function getDefaultVisibility(): TodayVisibility {
  return {
    showStarterBlock: true,
    showDailyPlan: true,
    showExplore: true,
    hideExplore: false,
    showRewards: true,
    showReducedModeBanner: false,
    forceDailyPlanCollapsed: false,
    forceExploreCollapsed: false,
  };
}

/**
 * Get empty dynamic UI data
 */
export function getEmptyDynamicUIData(): DynamicUIData {
  return {
    quickPicks: [],
    resumeLast: null,
    interestPrimer: null,
  };
}

/**
 * Get default personalization
 */
export function getDefaultPersonalization(): UserPersonalization {
  return {
    preferredActivities: [],
    focusDuration: 25,
    dailyGoalMinutes: 60,
    streakGoal: 7,
  };
}

/**
 * Get default plan summary (no plan)
 */
export function getDefaultPlanSummary(): DailyPlanSummary {
  return {
    planExists: false,
    hasIncompletePlanItems: false,
    nextIncompleteItem: null,
    totalCount: 0,
    completedCount: 0,
  };
}

/**
 * Ensure minimum visibility - at least one CTA must be visible
 */
export function ensureMinimumVisibility(visibility: TodayVisibility): TodayVisibility {
  const hasVisibleCTA =
    visibility.showStarterBlock ||
    visibility.showDailyPlan ||
    (visibility.showExplore && !visibility.hideExplore);

  if (!hasVisibleCTA) {
    return {
      ...visibility,
      showStarterBlock: true,
    };
  }

  return visibility;
}

/**
 * Compute visibility based on user state
 */
export function getTodayVisibility(state: TodayUserState): TodayVisibility {
  // Start with default visibility
  const visibility = getDefaultVisibility();

  // Returning after gap - show reduced mode
  if (state.returningAfterGap) {
    return {
      ...visibility,
      showReducedModeBanner: true,
      forceDailyPlanCollapsed: true,
      forceExploreCollapsed: true,
    };
  }

  // First day - focus on starter
  if (state.firstDay) {
    return {
      ...visibility,
      showStarterBlock: true,
      showDailyPlan: false,
      hideExplore: true,
    };
  }

  // Active focus - hide distractions
  if (state.focusActive) {
    return {
      ...visibility,
      showStarterBlock: false,
      forceExploreCollapsed: true,
    };
  }

  // Has plan with items - show plan prominently
  if (state.planExists && state.hasIncompletePlanItems) {
    return {
      ...visibility,
      showStarterBlock: false,
      forceDailyPlanCollapsed: false,
    };
  }

  return visibility;
}
