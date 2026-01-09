/**
 * Safety Nets for Today Features
 * Provides fallback behaviors when features encounter errors or invalid state
 *
 * These safety nets ensure graceful degradation:
 * - Invalid resolver output -> fallback to /focus
 * - Missing plan fields -> treat as no plan
 * - All CTAs hidden -> force show Focus CTA
 */

import type { ResolvedAction, DailyPlan, PlanItem } from "./resolveNextAction";
import type { TodayVisibility } from "./todayVisibility";

// ============================================
// Resolver Safety Nets
// ============================================

/**
 * Default fallback action when resolver fails
 */
export const FALLBACK_ACTION: ResolvedAction = {
  href: "/focus",
  label: "Start Focus",
  reason: "no_plan_fallback",
  type: "focus",
};

/**
 * Valid route patterns for Today actions
 */
const VALID_ROUTE_PATTERNS = [
  /^\/focus$/,
  /^\/quests(\/.*)?$/,
  /^\/exercise(\/.*)?$/,
  /^\/learn(\/.*)?$/,
  /^\/habits(\/.*)?$/,
  /^\/planner(\/.*)?$/,
  /^\/goals(\/.*)?$/,
  /^\/hub(\/.*)?$/,
];

/**
 * Check if a route is valid for Today actions
 */
export function isValidActionRoute(href: string | null | undefined): boolean {
  if (!href || typeof href !== "string") {
    return false;
  }

  // Must start with /
  if (!href.startsWith("/")) {
    return false;
  }

  // Block dangerous patterns
  if (href.includes("javascript:") || href.includes("data:")) {
    return false;
  }

  // Check against valid patterns
  return VALID_ROUTE_PATTERNS.some((pattern) => pattern.test(href));
}

/**
 * Validate and sanitize resolver output
 * Returns fallback if output is invalid
 */
export function validateResolverOutput(action: ResolvedAction | null | undefined): ResolvedAction {
  // Null/undefined check
  if (!action) {
    console.warn("[SafetyNet] Resolver returned null, using fallback");
    return FALLBACK_ACTION;
  }

  // Validate href
  if (!isValidActionRoute(action.href)) {
    console.warn(`[SafetyNet] Invalid href "${action.href}", using fallback`);
    return FALLBACK_ACTION;
  }

  // Validate label
  if (!action.label || typeof action.label !== "string" || action.label.length === 0) {
    return {
      ...action,
      label: "Continue",
    };
  }

  // Validate type
  const validTypes = ["focus", "quest", "workout", "learning", "habit", "plan_item", "noop"];
  if (!action.type || !validTypes.includes(action.type)) {
    return {
      ...action,
      type: "focus",
    };
  }

  return action;
}

// ============================================
// Plan Safety Nets
// ============================================

/**
 * Validate a daily plan has required fields
 * Returns null if plan is invalid (treat as no plan)
 */
export function validateDailyPlan(plan: DailyPlan | null | undefined): DailyPlan | null {
  if (!plan) {
    return null;
  }

  // Must have items array
  if (!Array.isArray(plan.items)) {
    console.warn("[SafetyNet] Plan missing items array, treating as no plan");
    return null;
  }

  // Must have id
  if (!plan.id || typeof plan.id !== "string") {
    console.warn("[SafetyNet] Plan missing id, treating as no plan");
    return null;
  }

  return plan;
}

/**
 * Validate a plan item has required fields
 */
export function isValidPlanItem(item: PlanItem | null | undefined): item is PlanItem {
  if (!item) {
    return false;
  }

  // Required fields
  if (!item.id || typeof item.id !== "string") {
    return false;
  }

  if (!item.actionUrl || typeof item.actionUrl !== "string") {
    return false;
  }

  if (typeof item.completed !== "boolean") {
    return false;
  }

  return true;
}

/**
 * Filter valid items from a plan
 */
export function getValidPlanItems(plan: DailyPlan | null): PlanItem[] {
  const validatedPlan = validateDailyPlan(plan);
  if (!validatedPlan) {
    return [];
  }

  return validatedPlan.items.filter(isValidPlanItem);
}

// ============================================
// Visibility Safety Nets
// ============================================

/**
 * Minimum visibility to prevent hiding all CTAs
 */
export const MINIMUM_VISIBILITY: Partial<TodayVisibility> = {
  showStarterBlock: true,
};

/**
 * Validate visibility does not hide all CTAs
 * If all CTAs would be hidden, force show StarterBlock with Focus
 */
export function validateVisibility(visibility: TodayVisibility): TodayVisibility {
  // Check if any CTA is visible
  const hasVisibleCTA =
    visibility.showStarterBlock ||
    visibility.showDailyPlan ||
    visibility.showExplore;

  // If no CTAs visible, force show StarterBlock
  if (!hasVisibleCTA) {
    console.warn("[SafetyNet] All CTAs hidden, forcing StarterBlock visible");
    return {
      ...visibility,
      showStarterBlock: true,
    };
  }

  return visibility;
}

// ============================================
// Session Storage Safety Nets
// ============================================

/**
 * Safe sessionStorage getter
 * Returns null if sessionStorage is unavailable
 */
export function safeSessionStorageGet(key: string): string | null {
  try {
    if (typeof sessionStorage === "undefined") {
      return null;
    }
    return sessionStorage.getItem(key);
  } catch {
    // Private browsing mode, storage disabled, etc.
    return null;
  }
}

/**
 * Safe sessionStorage setter
 * Returns false if sessionStorage is unavailable
 */
export function safeSessionStorageSet(key: string, value: string): boolean {
  try {
    if (typeof sessionStorage === "undefined") {
      return false;
    }
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    // Quota exceeded, private browsing mode, etc.
    return false;
  }
}

// ============================================
// Error Boundary Helpers
// ============================================

/**
 * Wrap a function with error handling and fallback
 */
export function withFallback<T>(
  fn: () => T,
  fallback: T,
  errorContext: string
): T {
  try {
    return fn();
  } catch (error) {
    console.error(`[SafetyNet] Error in ${errorContext}:`, error);
    return fallback;
  }
}

/**
 * Wrap an async function with error handling and fallback
 */
export async function withFallbackAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  errorContext: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[SafetyNet] Async error in ${errorContext}:`, error);
    return fallback;
  }
}

