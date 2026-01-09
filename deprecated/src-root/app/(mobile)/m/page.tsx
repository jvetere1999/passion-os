/**
 * Mobile Home Page (Today)
 * Entry point for mobile PWA
 *
 * Architecture (backend-first):
 * - Session is fetched from backend via auth()
 * - User state uses defaults for SSR
 * - MobileTodayClient fetches real data from backend API
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getTodayVisibility,
  ensureMinimumVisibility,
  type TodayUserState,
  type TodayVisibility,
} from "@/lib/today";
import { MobileTodayClient } from "@/components/mobile/screens/MobileTodayClient";
import type { DynamicUIData, DailyPlanSummary } from "@/app/(app)/today/types";

/**
 * Compute visibility based on user state
 */
function computeVisibility(userState: TodayUserState): TodayVisibility {
  const visibility = getTodayVisibility(userState);
  return ensureMinimumVisibility(visibility);
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

  // Default user state for SSR - MobileTodayClient will fetch real data
  const userState: TodayUserState = {
    planExists: false,
    hasIncompletePlanItems: false,
    returningAfterGap: false,
    firstDay: false,
    focusActive: false,
    activeStreak: false,
  };

  // Default data for SSR
  const dynamicUIData: DynamicUIData | null = null;
  const planSummary: DailyPlanSummary | null = null;

  // Compute visibility based on user state
  const visibility = computeVisibility(userState);

  return (
    <MobileTodayClient
      isReducedMode={visibility.showReducedModeBanner}
      forceDailyPlanCollapsed={visibility.forceDailyPlanCollapsed}
      forceExploreCollapsed={visibility.forceExploreCollapsed}
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

