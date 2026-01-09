/**
 * Mobile Home Page (Today)
 * Entry point for mobile PWA
 *
 * LOGIC PARITY: Uses same server-side state computation as desktop Today page
 * Only presentation differs (mobile-optimized layout with larger touch targets)
 */

import type { D1Database } from "@cloudflare/workers-types";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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
import { MobileTodayClient } from "@/components/mobile/screens/MobileTodayClient";

/**
 * Check if user is returning after a gap (> 48 hours since last activity)
 */
async function checkReturningAfterGapOptimized(
  db: D1Database,
  userId: string
): Promise<boolean> {
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
 * Compute visibility based on user state (same as desktop)
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
 * Fetch all Today page data in parallel (same as desktop)
 */
async function fetchTodayData(db: D1Database, userId: string) {
  const returningAfterGap = await checkReturningAfterGapOptimized(db, userId);

  const [serverState, dynamicUIData, planSummary] = await Promise.all([
    getTodayServerState(db, userId, returningAfterGap),
    isTodayDynamicUIEnabled() ? getDynamicUIData(db, userId) : Promise.resolve(null),
    getDailyPlanSummary(db, userId),
  ]);

  return {
    returningAfterGap,
    serverState,
    dynamicUIData,
    planSummary,
  };
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function MobileHomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/m/auth/signin");
  }

  const greeting = getGreeting();
  const firstName = session.user.name?.split(" ")[0] || "there";

  // Single DB and user lookup (same pattern as desktop)
  const db = await getDB();
  let dbUser = null;
  if (db && session.user.id) {
    try {
      dbUser = await ensureUserExists(db, session.user.id);
    } catch {
      // Ignore, will use default state
    }
  }

  // Fetch all Today data in parallel (same as desktop)
  let userState: TodayUserState;
  let dynamicUIData: DynamicUIData | null = null;
  let planSummary: DailyPlanSummary | null = null;
  let returningAfterGap = false;

  if (db && dbUser) {
    const data = await fetchTodayData(db, dbUser.id);
    returningAfterGap = data.returningAfterGap;
    dynamicUIData = data.dynamicUIData;
    planSummary = data.planSummary;

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
  }

  // Compute visibility based on user state (same logic as desktop)
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
    <MobileTodayClient
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
      greeting={greeting}
      firstName={firstName}
    />
  );
}

