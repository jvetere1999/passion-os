/**
 * Today Visibility Logic
 * Pure function that determines section visibility based on user state
 *
 * This implements the decision suppression rules from Prompt 9.
 * All logic is pure - no side effects, no external calls.
 */

/**
 * User state input for visibility calculation
 */
export interface TodayUserState {
  /** User has a daily plan for today */
  planExists: boolean;
  /** Plan has at least one incomplete item */
  hasIncompletePlanItems: boolean;
  /** User returning after > 48 hours gap */
  returningAfterGap: boolean;
  /** User is on their first day */
  firstDay: boolean;
  /** User has an active focus session */
  focusActive: boolean;
  /** User has an active streak (current_streak >= 1, last activity today/yesterday) */
  activeStreak: boolean;
}

/**
 * Visibility output for Today page sections
 */
export interface TodayVisibility {
  /** Show the StarterBlock component */
  showStarterBlock: boolean;
  /** Show the ReducedModeBanner */
  showReducedModeBanner: boolean;
  /** Show the DailyPlanWidget */
  showDailyPlan: boolean;
  /** Force DailyPlan to be collapsed (cannot expand) */
  forceDailyPlanCollapsed: boolean;
  /** Show the ExploreDrawer */
  showExplore: boolean;
  /** Force ExploreDrawer to be collapsed */
  forceExploreCollapsed: boolean;
  /** Completely hide ExploreDrawer (not just collapsed) */
  hideExplore: boolean;
  /** Show the Rewards section */
  showRewards: boolean;
  /** Maximum number of quick links to show in collapsed Explore */
  maxQuickLinks: number;
  /** The resolved user state (for debugging/logging) */
  resolvedState: UserStateType;
}

/**
 * User state types in priority order (P1 = highest)
 */
export type UserStateType =
  | "focus_active"      // P1: User has active focus session
  | "first_day"         // P2: User's first day
  | "returning_after_gap" // P3: Returning after > 48h
  | "plan_exists"       // P4: User has a plan for today
  | "active_streak"     // P5: User has active streak
  | "default";          // P6: No special conditions

/**
 * Resolve the user's primary state based on priority order
 */
export function resolveUserState(state: TodayUserState): UserStateType {
  // P1: Focus active takes absolute precedence
  if (state.focusActive) {
    return "focus_active";
  }

  // P2: First day user
  if (state.firstDay) {
    return "first_day";
  }

  // P3: Returning after gap
  if (state.returningAfterGap) {
    return "returning_after_gap";
  }

  // P4: Plan exists with incomplete items
  if (state.planExists && state.hasIncompletePlanItems) {
    return "plan_exists";
  }

  // P5: Active streak
  if (state.activeStreak) {
    return "active_streak";
  }

  // P6: Default state
  return "default";
}

/**
 * Get Today page section visibility based on user state
 *
 * Pure function - no side effects.
 * Same input always produces same output.
 */
export function getTodayVisibility(state: TodayUserState): TodayVisibility {
  const resolvedState = resolveUserState(state);

  switch (resolvedState) {
    case "focus_active":
      // P1: During focus, minimize all distractions
      return {
        showStarterBlock: true,        // Shows "Return to Focus"
        showReducedModeBanner: false,
        showDailyPlan: false,          // Hidden entirely
        forceDailyPlanCollapsed: true,
        showExplore: false,            // Hidden entirely
        forceExploreCollapsed: true,
        hideExplore: true,
        showRewards: false,            // Hidden
        maxQuickLinks: 0,
        resolvedState,
      };

    case "first_day":
      // P2: New users need minimal choices
      return {
        showStarterBlock: true,        // Shows "Start Focus"
        showReducedModeBanner: false,
        showDailyPlan: false,          // Hidden (no plan exists yet)
        forceDailyPlanCollapsed: true,
        showExplore: true,             // Collapsed with quick links
        forceExploreCollapsed: true,
        hideExplore: false,
        showRewards: false,            // Hidden
        maxQuickLinks: 3,
        resolvedState,
      };

    case "returning_after_gap":
      // P3: Reduce overwhelm for returning users
      return {
        showStarterBlock: true,
        showReducedModeBanner: true,   // Shows welcome back message
        showDailyPlan: true,           // Visible but force collapsed
        forceDailyPlanCollapsed: true,
        showExplore: true,             // Visible but force collapsed
        forceExploreCollapsed: true,
        hideExplore: false,
        showRewards: false,            // Hidden
        maxQuickLinks: 3,
        resolvedState,
      };

    case "plan_exists":
      // P4: Plan takes precedence
      return {
        showStarterBlock: true,        // Shows first incomplete item
        showReducedModeBanner: false,
        showDailyPlan: true,           // Visible, collapsed by default
        forceDailyPlanCollapsed: false,
        showExplore: true,             // Collapsed by default
        forceExploreCollapsed: false,
        hideExplore: false,
        showRewards: true,             // Visible but collapsed
        maxQuickLinks: 3,
        resolvedState,
      };

    case "active_streak":
      // P5: User is engaged
      return {
        showStarterBlock: true,
        showReducedModeBanner: false,
        showDailyPlan: true,           // Visible, expanded by default
        forceDailyPlanCollapsed: false,
        showExplore: true,             // Collapsed by default
        forceExploreCollapsed: false,
        hideExplore: false,
        showRewards: true,             // Visible
        maxQuickLinks: 3,
        resolvedState,
      };

    case "default":
    default:
      // P6: Baseline experience
      return {
        showStarterBlock: true,
        showReducedModeBanner: false,
        showDailyPlan: true,           // Visible, collapsed by default
        forceDailyPlanCollapsed: false,
        showExplore: true,             // Collapsed by default
        forceExploreCollapsed: false,
        hideExplore: false,
        showRewards: true,             // Visible
        maxQuickLinks: 3,
        resolvedState,
      };
  }
}

/**
 * Get default visibility (feature flag OFF)
 * Returns visibility that matches the current Today page behavior
 */
export function getDefaultVisibility(): TodayVisibility {
  return {
    showStarterBlock: true,
    showReducedModeBanner: false,
    showDailyPlan: true,
    forceDailyPlanCollapsed: false,
    showExplore: true,
    forceExploreCollapsed: false,
    hideExplore: false,
    showRewards: true,
    maxQuickLinks: 3,
    resolvedState: "default",
  };
}

/**
 * Safety net: Ensure visibility never hides all CTAs
 * If all main CTAs would be hidden, force show StarterBlock
 */
export function ensureMinimumVisibility(visibility: TodayVisibility): TodayVisibility {
  const hasVisibleCTA =
    visibility.showStarterBlock ||
    visibility.showDailyPlan ||
    visibility.showExplore;

  if (!hasVisibleCTA) {
    console.warn("[SafetyNet] All CTAs hidden by visibility, forcing StarterBlock");
    return {
      ...visibility,
      showStarterBlock: true,
    };
  }

  return visibility;
}

