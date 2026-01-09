/**
 * Today Page (Home within app shell)
 * Dashboard view showing today's overview and quick actions
 * Supports reduced mode for users returning after > 48 hours
 * Supports decision suppression via feature flag
 * Supports soft landing after first action completion
 * Supports dynamic UI based on usage patterns
 *
 * Feature Flags:
 * - TODAY_DECISION_SUPPRESSION_V1: State-driven visibility
 * - TODAY_REDUCED_MODE_V1: Gap-based reduced mode
 * - TODAY_DYNAMIC_UI_V1: Personalized quick picks, resume last, interest primers
 *
 * Safety Nets:
 * - ensureMinimumVisibility: Never hide all CTAs
 *
 * Performance Optimizations:
 * - Single getDB() call
 * - Single ensureUserExists() call
 * - Parallel fetches for all state queries
 * - Server-side plan data passed to client (avoids refetch)
 */

import type { Metadata } from "next";
import type { D1Database } from "@cloudflare/workers-types";
import { auth } from "@/lib/auth";
import { getDB } from "@/lib/perf";
import { ensureUserExists, isReturningAfterGap } from "@/lib/db/repositories/users";
import {
  getTodayServerState,
  getDynamicUIData,
  getDailyPlanSummary,
  type DynamicUIData,
  type DailyPlanSummary,
} from "@/lib/db/repositories/dailyPlans";
import { isTodayDecisionSuppressionEnabled, isTodayReducedModeEnabled, isTodayDynamicUIEnabled } from "@/lib/flags";
import {
  getTodayVisibility,
  getDefaultVisibility,
  ensureMinimumVisibility,
  type TodayUserState,
  type TodayVisibility,
} from "@/lib/today";
import { fetchUserPersonalization, getDefaultPersonalization } from "@/lib/today/fetchPersonalization";
import type { UserPersonalization } from "@/lib/today/resolveNextAction";
import styles from "./page.module.css";
import { ReducedModeProvider } from "./ReducedModeContext";
import { TodayGridClient } from "./TodayGridClient";

export const metadata: Metadata = {
  title: "Today",
  description: "Your daily dashboard - quests, focus sessions, and progress.",
};

/**
 * Check if user is returning after a gap (> 48 hours since last activity)
 * Now accepts db and userId to avoid duplicate lookups
 */
async function checkReturningAfterGapOptimized(
  db: D1Database,
  userId: string
): Promise<boolean> {
  // Feature flag check
  if (!isTodayReducedModeEnabled()) {
    return false;
  }

  try {
    return await isReturningAfterGap(db, userId);
  } catch (error) {
    console.error("Failed to check returning after gap:", error);
    return false;
  }
}

/**
 * Compute visibility based on user state
 * When feature flag is OFF, returns default visibility
 * Always applies safety net to ensure at least one CTA is visible
 */
function computeVisibility(userState: TodayUserState): TodayVisibility {
  let visibility: TodayVisibility;

  if (!isTodayDecisionSuppressionEnabled()) {
    visibility = getDefaultVisibility();
  } else {
    visibility = getTodayVisibility(userState);
  }

  return ensureMinimumVisibility(visibility);
}

/**
 * Fetch all Today page data in parallel
 * Single entry point for all server-side data needs
 */
async function fetchTodayData(db: D1Database, userId: string) {
  // First, check returning after gap (needed for getTodayServerState)
  const returningAfterGap = await checkReturningAfterGapOptimized(db, userId);

  // Fetch all remaining data in parallel
  const [serverState, dynamicUIData, planSummary, personalization] = await Promise.all([
    getTodayServerState(db, userId, returningAfterGap),
    isTodayDynamicUIEnabled() ? getDynamicUIData(db, userId) : Promise.resolve(null),
    getDailyPlanSummary(db, userId),
    fetchUserPersonalization(db, userId),
  ]);

  return {
    returningAfterGap,
    serverState,
    dynamicUIData,
    planSummary,
    personalization,
  };
}

export default async function TodayPage() {
  const session = await auth();

  const greeting = getGreeting();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  // Single DB and user lookup
  const db = await getDB();
  let dbUser = null;
  if (db && session?.user?.id) {
    try {
      dbUser = await ensureUserExists(db, session.user.id);
    } catch {
      // Ignore, will use default state
    }
  }

  // Fetch all Today data in parallel (optimized)
  let userState: TodayUserState;
  let dynamicUIData: DynamicUIData | null = null;
  let planSummary: DailyPlanSummary | null = null;
  let personalization: UserPersonalization | null = null;
  let returningAfterGap = false;

  if (db && dbUser) {
    const data = await fetchTodayData(db, dbUser.id);
    returningAfterGap = data.returningAfterGap;
    dynamicUIData = data.dynamicUIData;
    planSummary = data.planSummary;
    personalization = data.personalization || getDefaultPersonalization();

    userState = {
      planExists: data.serverState.planExists,
      hasIncompletePlanItems: data.serverState.hasIncompletePlanItems,
      returningAfterGap: data.serverState.returningAfterGap,
      firstDay: data.serverState.firstDay,
      focusActive: data.serverState.focusActive,
      activeStreak: data.serverState.activeStreak,
    };
  } else {
    userState = {
      planExists: false,
      hasIncompletePlanItems: false,
      returningAfterGap: false,
      firstDay: false,
      focusActive: false,
      activeStreak: false,
    };
    personalization = getDefaultPersonalization();
  }

  // Compute visibility based on user state and feature flag
  const visibility = computeVisibility(userState);

  const effectiveReducedMode = isTodayDecisionSuppressionEnabled()
    ? visibility.showReducedModeBanner
    : returningAfterGap;

  const effectiveForceDailyPlanCollapsed = isTodayDecisionSuppressionEnabled()
    ? visibility.forceDailyPlanCollapsed
    : returningAfterGap;

  const effectiveForceExploreCollapsed = isTodayDecisionSuppressionEnabled()
    ? visibility.forceExploreCollapsed
    : returningAfterGap;


  return (
    <ReducedModeProvider initialReducedMode={effectiveReducedMode}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {greeting}, {firstName}
          </h1>
          <p className={styles.subtitle}>
            Here&apos;s what&apos;s on your plate today.
          </p>
        </header>

        <div className={styles.grid}>
          <TodayGridClient
            isReducedMode={effectiveReducedMode}
            forceDailyPlanCollapsed={effectiveForceDailyPlanCollapsed}
            forceExploreCollapsed={effectiveForceExploreCollapsed}
            showStarterBlock={visibility.showStarterBlock}
            showDailyPlan={visibility.showDailyPlan}
            showExplore={visibility.showExplore}
            hideExplore={visibility.hideExplore}
            showRewards={visibility.showRewards}
            dynamicUIData={dynamicUIData}
            initialPlanSummary={planSummary}
            personalization={personalization}
          />
        </div>
      </div>
    </ReducedModeProvider>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}


