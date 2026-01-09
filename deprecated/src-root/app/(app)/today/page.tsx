/**
 * Today Page (Home within app shell)
 * Dashboard view showing today's overview and quick actions
 *
 * Architecture (backend-first):
 * - Session is fetched from backend via auth()
 * - User state and visibility use defaults for SSR
 * - TodayGridClient fetches real data from backend API
 *
 * Features:
 * - Decision suppression: State-driven visibility
 * - Soft landing: Post-action reduced mode
 * - Dynamic UI: Personalized quick picks, resume last
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import {
  getTodayVisibility,
  ensureMinimumVisibility,
  getDefaultPersonalization,
  type TodayUserState,
  type TodayVisibility,
  type UserPersonalization,
} from "@/lib/today";
import styles from "./page.module.css";
import { ReducedModeProvider } from "./ReducedModeContext";
import { TodayGridClient } from "./TodayGridClient";
import type { DynamicUIData, DailyPlanSummary } from "./types";

export const metadata: Metadata = {
  title: "Today",
  description: "Your daily dashboard - quests, focus sessions, and progress.",
};

/**
 * Compute visibility based on user state
 * Always applies safety net to ensure at least one CTA is visible
 */
function computeVisibility(userState: TodayUserState): TodayVisibility {
  const visibility = getTodayVisibility(userState);
  return ensureMinimumVisibility(visibility);
}

export default async function TodayPage() {
  const session = await auth();

  const greeting = getGreeting();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  // Default user state for SSR - TodayGridClient will fetch real data
  const userState: TodayUserState = {
    planExists: false,
    hasIncompletePlanItems: false,
    returningAfterGap: false,
    firstDay: false,
    focusActive: false,
    activeStreak: false,
  };

  // Default data for SSR - real data fetched by client components
  const dynamicUIData: DynamicUIData | null = null;
  const planSummary: DailyPlanSummary | null = null;
  const personalization: UserPersonalization = getDefaultPersonalization();

  // Compute visibility based on user state
  const visibility = computeVisibility(userState);

  return (
    <ReducedModeProvider initialReducedMode={visibility.showReducedModeBanner}>
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


