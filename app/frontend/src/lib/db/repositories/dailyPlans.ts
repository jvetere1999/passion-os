/**
 * Daily Plans Repository
 * Server-side queries for Today page state
 */

import type { D1Database } from "@cloudflare/workers-types";

/**
 * Plan item structure (matches API route)
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

/**
 * Get daily plan summary for a user
 * Used by Today page to determine visibility state
 *
 * @param db - D1 database instance
 * @param userId - User ID to query
 * @param date - Date string (YYYY-MM-DD), defaults to today
 * @returns DailyPlanSummary
 */
export async function getDailyPlanSummary(
  db: D1Database,
  userId: string,
  date?: string
): Promise<DailyPlanSummary> {
  const today = date || new Date().toISOString().split("T")[0];

  try {
    const plan = await db
      .prepare(
        `SELECT id, items, completed_count, total_count 
         FROM daily_plans 
         WHERE user_id = ? AND plan_date = ?`
      )
      .bind(userId, today)
      .first<{
        id: string;
        items: string;
        completed_count: number;
        total_count: number;
      }>();

    if (!plan) {
      return {
        planExists: false,
        hasIncompletePlanItems: false,
        nextIncompleteItem: null,
        totalCount: 0,
        completedCount: 0,
      };
    }

    // Parse items and find incomplete ones
    let items: PlanItem[] = [];
    try {
      items = JSON.parse(plan.items) as PlanItem[];
    } catch {
      // Invalid JSON, treat as empty
      items = [];
    }

    const incompleteItems = items
      .filter((item) => item && !item.completed)
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

    const hasIncompletePlanItems = incompleteItems.length > 0;
    const nextItem = incompleteItems[0] || null;

    return {
      planExists: true,
      hasIncompletePlanItems,
      nextIncompleteItem: nextItem
        ? {
            id: nextItem.id,
            title: nextItem.title,
            priority: nextItem.priority,
            actionUrl: nextItem.actionUrl,
            type: nextItem.type,
          }
        : null,
      totalCount: plan.total_count,
      completedCount: plan.completed_count,
    };
  } catch (error) {
    // Gracefully degrade to no plan on error
    console.error("[getDailyPlanSummary] Error:", error);
    return {
      planExists: false,
      hasIncompletePlanItems: false,
      nextIncompleteItem: null,
      totalCount: 0,
      completedCount: 0,
    };
  }
}

/**
 * Check if user is on their first day (no activity events)
 *
 * @param db - D1 database instance
 * @param userId - User ID to check
 * @returns true if user has no activity events
 */
export async function isFirstDay(
  db: D1Database,
  userId: string
): Promise<boolean> {
  try {
    const result = await db
      .prepare(
        `SELECT 1 FROM activity_events WHERE user_id = ? LIMIT 1`
      )
      .bind(userId)
      .first<{ 1: number }>();

    // First day if no activity events exist
    return result === null;
  } catch (error) {
    // Gracefully degrade to not first day on error
    console.error("[isFirstDay] Error:", error);
    return false;
  }
}

/**
 * Check if user has an active focus session
 *
 * @param db - D1 database instance
 * @param userId - User ID to check
 * @returns true if user has an active (non-expired) focus session
 */
export async function hasFocusActive(
  db: D1Database,
  userId: string
): Promise<boolean> {
  try {
    const session = await db
      .prepare(
        `SELECT id, expires_at 
         FROM focus_sessions 
         WHERE user_id = ? AND status = 'active' 
         LIMIT 1`
      )
      .bind(userId)
      .first<{ id: string; expires_at: string | null }>();

    if (!session) {
      return false;
    }

    // Check if session has expired
    if (session.expires_at) {
      const expiryTime = new Date(session.expires_at).getTime();
      if (Date.now() > expiryTime) {
        // Session is expired, will be auto-abandoned on next access
        return false;
      }
    }

    return true;
  } catch (error) {
    // Gracefully degrade to no active focus on error
    console.error("[hasFocusActive] Error:", error);
    return false;
  }
}

/**
 * Active streak threshold (hours)
 * Streak is "active" if last activity was within this many hours
 */
const STREAK_ACTIVE_THRESHOLD_HOURS = 36; // 36 hours to account for timezone differences

/**
 * Check if user has an active streak
 *
 * Definition: current_streak >= 1 AND last_activity_date within STREAK_ACTIVE_THRESHOLD_HOURS
 *
 * @param db - D1 database instance
 * @param userId - User ID to check
 * @returns true if user has an active streak
 */
export async function hasActiveStreak(
  db: D1Database,
  userId: string
): Promise<boolean> {
  try {
    // Check for any streak type with current_streak >= 1 and recent activity
    const streak = await db
      .prepare(
        `SELECT current_streak, last_activity_date 
         FROM user_streaks 
         WHERE user_id = ? AND current_streak >= 1 
         ORDER BY current_streak DESC 
         LIMIT 1`
      )
      .bind(userId)
      .first<{ current_streak: number; last_activity_date: string | null }>();

    if (!streak || streak.current_streak < 1) {
      return false;
    }

    // Check if last activity is within threshold
    if (streak.last_activity_date) {
      const lastActivity = new Date(streak.last_activity_date);
      const now = new Date();
      const hoursSinceActivity =
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

      return hoursSinceActivity <= STREAK_ACTIVE_THRESHOLD_HOURS;
    }

    // Has streak but no last_activity_date - treat as active
    return true;
  } catch (error) {
    // Gracefully degrade to no active streak on error
    console.error("[hasActiveStreak] Error:", error);
    return false;
  }
}

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
 * Get complete Today user state from server
 * Single function to fetch all state needed for visibility calculations
 *
 * @param db - D1 database instance
 * @param userId - User ID to query
 * @param returningAfterGap - Pre-computed from users.last_activity_at
 * @returns TodayServerState
 */
export async function getTodayServerState(
  db: D1Database,
  userId: string,
  returningAfterGap: boolean
): Promise<TodayServerState> {
  // Run queries in parallel for efficiency
  const [planSummary, firstDay, focusActive, activeStreak] = await Promise.all([
    getDailyPlanSummary(db, userId),
    isFirstDay(db, userId),
    hasFocusActive(db, userId),
    hasActiveStreak(db, userId),
  ]);

  return {
    planExists: planSummary.planExists,
    hasIncompletePlanItems: planSummary.hasIncompletePlanItems,
    nextIncompleteItem: planSummary.nextIncompleteItem,
    returningAfterGap,
    firstDay,
    focusActive,
    activeStreak,
  };
}

// ============================================
// Dynamic UI Data (FLAG: TODAY_DYNAMIC_UI_V1)
// ============================================

/**
 * Module configuration for dynamic UI
 * Maps event types to modules with routes and labels
 */
const MODULE_CONFIG: Record<
  string,
  { module: string; route: string; label: string }
> = {
  focus_start: { module: "focus", route: "/focus", label: "Focus" },
  focus_complete: { module: "focus", route: "/focus", label: "Focus" },
  workout_start: { module: "exercise", route: "/exercise", label: "Exercise" },
  workout_complete: { module: "exercise", route: "/exercise", label: "Exercise" },
  lesson_start: { module: "learn", route: "/learn", label: "Learn" },
  lesson_complete: { module: "learn", route: "/learn", label: "Learn" },
  review_complete: { module: "learn", route: "/learn", label: "Learn" },
  habit_complete: { module: "habits", route: "/habits", label: "Habits" },
  quest_complete: { module: "quests", route: "/quests", label: "Quests" },
  goal_milestone: { module: "goals", route: "/goals", label: "Goals" },
  planner_task_complete: { module: "planner", route: "/planner", label: "Planner" },
};

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

/**
 * Get empty dynamic UI data
 */
function getEmptyDynamicUIData(): DynamicUIData {
  return {
    quickPicks: [],
    resumeLast: null,
    interestPrimer: null,
  };
}

/**
 * Time constants
 */
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const MIN_EVENTS_FOR_QUICK_PICKS = 3;

/**
 * Get quick picks from last 14 days of activity
 * Returns top 2 modules by usage frequency
 *
 * @param db - D1 database instance
 * @param userId - User ID to query
 * @returns Array of up to 2 QuickPick items
 */
async function getQuickPicks(
  db: D1Database,
  userId: string
): Promise<QuickPick[]> {
  try {
    const fourteenDaysAgo = new Date(Date.now() - FOURTEEN_DAYS_MS).toISOString();

    // Count events by type in last 14 days
    const result = await db
      .prepare(
        `SELECT event_type, COUNT(*) as count
         FROM activity_events
         WHERE user_id = ? AND created_at >= ?
         GROUP BY event_type
         ORDER BY count DESC`
      )
      .bind(userId, fourteenDaysAgo)
      .all<{ event_type: string; count: number }>();

    if (!result.results || result.results.length === 0) {
      return [];
    }

    // Aggregate by module
    const moduleCounts: Record<string, number> = {};
    for (const row of result.results) {
      const config = MODULE_CONFIG[row.event_type];
      if (config) {
        moduleCounts[config.module] = (moduleCounts[config.module] || 0) + row.count;
      }
    }

    // Sort by count and take top 2
    const sortedModules = Object.entries(moduleCounts)
      .filter(([, count]) => count >= MIN_EVENTS_FOR_QUICK_PICKS)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    // Map to QuickPick format
    return sortedModules.map(([module, count]) => {
      const config = Object.values(MODULE_CONFIG).find((c) => c.module === module);
      return {
        module,
        route: config?.route || `/${module}`,
        label: config?.label || module.charAt(0).toUpperCase() + module.slice(1),
        count,
      };
    });
  } catch (error) {
    console.error("[getQuickPicks] Error:", error);
    return [];
  }
}

/**
 * Get resume last from most recent activity within 24 hours
 *
 * @param db - D1 database instance
 * @param userId - User ID to query
 * @returns ResumeLast or null if no recent activity
 */
async function getResumeLast(
  db: D1Database,
  userId: string
): Promise<ResumeLast | null> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - TWENTY_FOUR_HOURS_MS).toISOString();

    const result = await db
      .prepare(
        `SELECT event_type, created_at
         FROM activity_events
         WHERE user_id = ? AND created_at >= ?
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .bind(userId, twentyFourHoursAgo)
      .first<{ event_type: string; created_at: string }>();

    if (!result) {
      return null;
    }

    const config = MODULE_CONFIG[result.event_type];
    if (!config) {
      return null;
    }

    return {
      module: config.module,
      route: config.route,
      label: config.label,
      lastUsed: result.created_at,
    };
  } catch (error) {
    console.error("[getResumeLast] Error:", error);
    return null;
  }
}

/**
 * Get interest primer based on learn/hub frequency
 * Shows learn primer if user has lesson/review events
 * Shows hub primer if user has been using shortcuts
 *
 * @param db - D1 database instance
 * @param userId - User ID to query
 * @returns InterestPrimer or null
 */
async function getInterestPrimer(
  db: D1Database,
  userId: string
): Promise<InterestPrimer | null> {
  try {
    const fourteenDaysAgo = new Date(Date.now() - FOURTEEN_DAYS_MS).toISOString();

    // Count learn-related events
    const learnResult = await db
      .prepare(
        `SELECT COUNT(*) as count
         FROM activity_events
         WHERE user_id = ? 
         AND created_at >= ?
         AND event_type IN ('lesson_start', 'lesson_complete', 'review_complete')`
      )
      .bind(userId, fourteenDaysAgo)
      .first<{ count: number }>();

    const learnCount = learnResult?.count || 0;

    // If user has significant learn activity, suggest learn
    if (learnCount >= 5) {
      return {
        type: "learn",
        route: "/learn",
        label: "Continue Learning",
      };
    }

    // Check if user has used focus frequently (hub users tend to use focus)
    const focusResult = await db
      .prepare(
        `SELECT COUNT(*) as count
         FROM activity_events
         WHERE user_id = ? 
         AND created_at >= ?
         AND event_type IN ('focus_start', 'focus_complete')`
      )
      .bind(userId, fourteenDaysAgo)
      .first<{ count: number }>();

    const focusCount = focusResult?.count || 0;

    // If focus user but not learning, suggest hub for shortcuts
    if (focusCount >= 10 && learnCount < 3) {
      return {
        type: "hub",
        route: "/hub",
        label: "Explore Shortcuts",
      };
    }

    return null;
  } catch (error) {
    console.error("[getInterestPrimer] Error:", error);
    return null;
  }
}

/**
 * Get complete dynamic UI data for a user
 * Runs all queries in parallel for efficiency
 *
 * @param db - D1 database instance
 * @param userId - User ID to query
 * @returns DynamicUIData
 */
export async function getDynamicUIData(
  db: D1Database,
  userId: string
): Promise<DynamicUIData> {
  try {
    const [quickPicks, resumeLast, interestPrimer] = await Promise.all([
      getQuickPicks(db, userId),
      getResumeLast(db, userId),
      getInterestPrimer(db, userId),
    ]);

    return {
      quickPicks,
      resumeLast,
      interestPrimer,
    };
  } catch (error) {
    console.error("[getDynamicUIData] Error:", error);
    return getEmptyDynamicUIData();
  }
}

