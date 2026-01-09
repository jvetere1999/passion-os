"use client";

/**
 * Mobile Today Wrapper
 *
 * Client-side component that fetches all Today data from the backend API.
 * Wraps MobileTodayClient with data fetching logic.
 *
 * Architecture:
 * - Frontend performs 0% data logic
 * - All data flows through Rust backend at api.ecent.online
 */

import { useEffect, useState } from "react";
import {
  getTodayData,
  getDefaultUserState,
  type TodayUserState,
  type DynamicUIData,
  type DailyPlanSummary,
} from "@/lib/api/today";
import { MobileTodayClient } from "./MobileTodayClient";

interface MobileTodayWrapperProps {
  greeting: string;
  firstName: string;
  userId: string;
}

/**
 * Compute visibility based on user state
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

export function MobileTodayWrapper({
  greeting,
  firstName,
}: MobileTodayWrapperProps) {
  const [loading, setLoading] = useState(true);
  const [userState, setUserState] = useState<TodayUserState>(getDefaultUserState());
  const [dynamicUIData, setDynamicUIData] = useState<DynamicUIData | null>(null);
  const [planSummary, setPlanSummary] = useState<DailyPlanSummary | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getTodayData();
        setUserState(data.userState);
        setDynamicUIData(data.dynamicUIData);
        setPlanSummary(data.planSummary);
      } catch (error) {
        console.error("Failed to fetch Today data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const visibility = computeVisibility(userState);

  if (loading) {
    return (
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <p>Loading your day...</p>
      </div>
    );
  }

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
