/**
 * Next Action Resolver
 * Pure, deterministic function that resolves the default next action for a user
 *
 * Priority order (with personalization):
 * 1. If onboarding is active: drive onboarding flow
 * 2. If plan exists with incomplete items: first incomplete by lowest priority
 * 3. Fallback based on user's module weights and interests
 * 4. Default: Focus -> Quests -> Learn
 */

/**
 * Plan item from daily plan API
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
 * Daily plan from API
 */
export interface DailyPlan {
  id: string;
  date: string;
  items: PlanItem[];
  completedCount: number;
  totalCount: number;
}

/**
 * User personalization settings
 */
export interface UserPersonalization {
  /** User's selected interests */
  interests: string[];
  /** Module weights (module_key -> weight, higher = more preferred) */
  moduleWeights: Record<string, number>;
  /** Nudge intensity: "gentle" | "standard" | "energetic" */
  nudgeIntensity: string;
  /** Default focus duration in minutes */
  focusDuration: number;
  /** Whether gamification is visible */
  gamificationVisible: boolean;
  /** Whether onboarding is active */
  onboardingActive: boolean;
  /** Current onboarding step route (if applicable) */
  onboardingRoute?: string;
}

/**
 * Input state for the resolver
 */
export interface ResolverState {
  /** Daily plan, or null if not loaded/doesn't exist */
  plan: DailyPlan | null;
  /** Current route (optional, for noop detection) */
  currentRoute?: string;
  /** User personalization (optional) */
  personalization?: UserPersonalization | null;
}

/**
 * Resolution reason for debugging/logging
 */
export type ResolutionReason =
  | "plan_incomplete_item"
  | "plan_complete_fallback"
  | "no_plan_fallback"
  | "noop";

/**
 * Resolved action to take
 */
export interface ResolvedAction {
  /** Route to navigate to */
  href: string;
  /** Label for the CTA button */
  label: string;
  /** Reason for this resolution (for debugging) */
  reason: ResolutionReason;
  /** Action type for icon selection */
  type: PlanItem["type"] | "focus";
  /** Entity ID if action targets a specific item */
  entityId?: string;
  /** Original item title if from plan */
  itemTitle?: string;
}

/**
 * Get incomplete items from plan, sorted by priority (lowest first)
 */
function getIncompleteItemsSorted(plan: DailyPlan | null): PlanItem[] {
  if (!plan || !plan.items || !Array.isArray(plan.items)) {
    return [];
  }

  return plan.items
    .filter((item) => item && item.completed === false)
    .sort((a, b) => {
      // Handle missing priority - default to 999 (low priority)
      const priorityA = typeof a.priority === "number" ? a.priority : 999;
      const priorityB = typeof b.priority === "number" ? b.priority : 999;
      return priorityA - priorityB;
    });
}

/**
 * Validate a plan item has required fields
 */
function isValidPlanItem(item: PlanItem): boolean {
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.actionUrl === "string" &&
    item.actionUrl.length > 0
  );
}

/**
 * Get fallback action when no plan exists
 * Now considers user personalization for module ranking
 */
function getFallbackAction(currentRoute: string | undefined, personalization?: UserPersonalization | null): ResolvedAction {
  // Default fallback chain
  const defaultFallbacks: ResolvedAction[] = [
    { href: "/focus", label: "Start Focus", reason: "no_plan_fallback", type: "focus" },
    { href: "/quests", label: "One small quest", reason: "no_plan_fallback", type: "quest" },
    { href: "/learn", label: "Quick learn", reason: "no_plan_fallback", type: "learning" },
    { href: "/ignitions", label: "Pick a spark", reason: "no_plan_fallback", type: "focus" },
  ];

  // If no personalization, use default order
  if (!personalization || !personalization.moduleWeights || Object.keys(personalization.moduleWeights).length === 0) {
    for (const fallback of defaultFallbacks) {
      if (fallback.href !== currentRoute) {
        return fallback;
      }
    }
    return defaultFallbacks[0];
  }

  // Map module keys to fallback hrefs
  const moduleToHref: Record<string, string> = {
    focus: "/focus",
    quests: "/quests",
    learn: "/learn",
    ignitions: "/ignitions",
    ideas: "/ideas",
    wins: "/wins",
  };

  // Sort by weight (descending) and filter to only enabled modules
  const sortedModules = Object.entries(personalization.moduleWeights)
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);

  // Build personalized fallback chain
  const personalizedFallbacks: ResolvedAction[] = [];

  for (const moduleKey of sortedModules) {
    const href = moduleToHref[moduleKey];
    if (href) {
      const label = getModuleLabel(moduleKey);
      personalizedFallbacks.push({
        href,
        label,
        reason: "no_plan_fallback",
        type: moduleKey === "quests" ? "quest" : moduleKey === "learn" ? "learning" : "focus",
      });
    }
  }

  // Add defaults at the end for any missing modules
  for (const fallback of defaultFallbacks) {
    if (!personalizedFallbacks.some(f => f.href === fallback.href)) {
      personalizedFallbacks.push(fallback);
    }
  }

  // Return first fallback that isn't the current route
  for (const fallback of personalizedFallbacks) {
    if (fallback.href !== currentRoute) {
      return fallback;
    }
  }

  return personalizedFallbacks[0] || defaultFallbacks[0];
}

/**
 * Get human-readable label for module
 */
function getModuleLabel(moduleKey: string): string {
  const labels: Record<string, string> = {
    focus: "Start Focus",
    quests: "One small quest",
    learn: "Quick learn",
    ignitions: "Pick a spark",
    ideas: "Capture an idea",
    wins: "See your wins",
    plan: "Plan your day",
  };
  return labels[moduleKey] || "Start something";
}

/**
 * Resolve the next action based on user state
 *
 * Pure function - no side effects, deterministic output.
 *
 * @param state - Current user state
 * @returns Resolved action with href, label, and reason
 */
export function resolveNextAction(state: ResolverState): ResolvedAction {
  // Case 0: Onboarding is active - redirect to onboarding
  if (state.personalization?.onboardingActive && state.personalization.onboardingRoute) {
    return {
      href: state.personalization.onboardingRoute,
      label: "Continue setup",
      reason: "no_plan_fallback",
      type: "focus",
    };
  }

  // Case 1: Plan exists with incomplete items
  const incompleteItems = getIncompleteItemsSorted(state.plan);

  if (incompleteItems.length > 0) {
    // Find first valid incomplete item
    for (const item of incompleteItems) {
      if (isValidPlanItem(item)) {
        // Check for noop (already on target route)
        if (state.currentRoute && state.currentRoute === item.actionUrl) {
          return {
            href: item.actionUrl,
            label: `Continue: ${item.title || "Task"}`,
            reason: "noop",
            type: item.type || "focus",
            entityId: item.id,
            itemTitle: item.title,
          };
        }

        return {
          href: item.actionUrl,
          label: `Continue: ${item.title || "Task"}`,
          reason: "plan_incomplete_item",
          type: item.type || "focus",
          entityId: item.id,
          itemTitle: item.title,
        };
      }
    }
  }

  // Case 2: Plan exists but all items complete - fallback based on personalization
  if (state.plan && state.plan.items && state.plan.items.length > 0) {
    // Check for noop
    if (state.currentRoute === "/focus") {
      return {
        href: "/focus",
        label: "Start Focus",
        reason: "noop",
        type: "focus",
      };
    }

    return getFallbackAction(state.currentRoute, state.personalization);
  }

  // Case 3: No plan - fallback based on personalization
  return getFallbackAction(state.currentRoute, state.personalization);
}

/**
 * Simplified resolver for StarterBlock (no currentRoute check)
 * Always returns a valid action, never noop
 */
export function resolveStarterAction(plan: DailyPlan | null): ResolvedAction {
  return resolveNextAction({ plan, currentRoute: undefined });
}
