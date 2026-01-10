"use client";

/**
 * Today Client Component
 *
 * Client-side component that fetches all Today data from the backend API.
 * Renders the Today dashboard with all widgets.
 *
 * Architecture:
 * - Frontend performs 0% data logic
 * - All data flows through Rust backend at api.ecent.online
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  getTodayData,
  getDefaultUserState,
  getDefaultPersonalization,
  type TodayData,
  type TodayUserState,
  type DynamicUIData,
  type DailyPlanSummary,
  type UserPersonalization,
} from "@/lib/api/today";
import styles from "./page.module.css";
import { ReducedModeProvider } from "./ReducedModeContext";
import { TodayGridClient } from "./TodayGridClient";

interface TodayClientProps {
  greeting: string;
}

/**
 * Compute visibility based on user state
 * Simplified client-side version
 */
function computeVisibility(userState: TodayUserState) {
  return {
    showStarterBlock: userState.firstDay,
    showDailyPlan: true,
    showExplore: true,
    hideExplore: false,
    showRewards: true,
    showReducedModeBanner: userState.returningAfterGap,
    forceDailyPlanCollapsed: userState.returningAfterGap,
    forceExploreCollapsed: userState.returningAfterGap,
  };
}

export function TodayClient({ greeting }: TodayClientProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userState, setUserState] = useState<TodayUserState>(getDefaultUserState());
  const [dynamicUIData, setDynamicUIData] = useState<DynamicUIData | null>(null);
  const [planSummary, setPlanSummary] = useState<DailyPlanSummary | null>(null);
  const [personalization, setPersonalization] = useState<UserPersonalization>(
    getDefaultPersonalization()
  );

  const firstName = user?.name?.split(" ")[0] || "there";

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getTodayData();
        setUserState(data.userState);
        setDynamicUIData(data.dynamicUIData);
        setPlanSummary(data.planSummary);
        setPersonalization(data.personalization);
      } catch (error) {
        console.error("Failed to fetch Today data:", error);
        // Keep defaults on error
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const visibility = computeVisibility(userState);

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {greeting}, {firstName}
          </h1>
          <p className={styles.subtitle}>Loading your day...</p>
        </header>
        <div className={styles.grid}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        </div>
      </div>
    );
  }

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
