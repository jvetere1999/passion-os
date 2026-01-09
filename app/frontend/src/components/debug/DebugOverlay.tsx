"use client";

/**
 * Debug Overlay Component
 *
 * Shows computed TodayUserState, resolved action, visibility rules,
 * and suppression status. Only visible to admin users in development/preview.
 *
 * Completely stripped in production for non-admins.
 */

import { useState } from "react";
import type { TodayServerState, DynamicUIData } from "@/lib/db/repositories/dailyPlans";
import type { TodayVisibility } from "@/lib/today/todayVisibility";
import styles from "./DebugOverlay.module.css";

interface DebugOverlayProps {
  /** Whether to show the overlay (admin check done server-side) */
  isEnabled: boolean;
  /** Server-computed user state */
  userState: TodayServerState;
  /** Computed visibility flags */
  visibility: TodayVisibility;
  /** Resolved primary action */
  resolvedAction: {
    href: string;
    label: string;
    reason: string;
  };
  /** Dynamic UI data (if enabled) */
  dynamicUIData?: DynamicUIData | null;
  /** Whether reduced mode is active */
  isReducedMode: boolean;
  /** Whether soft landing is active */
  isSoftLanding: boolean;
}

export function DebugOverlay({
  isEnabled,
  userState,
  visibility,
  resolvedAction,
  dynamicUIData,
  isReducedMode,
  isSoftLanding,
}: DebugOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isEnabled) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <button
        className={styles.toggle}
        onClick={() => setIsExpanded(!isExpanded)}
        title="Toggle Debug Overlay"
      >
        {isExpanded ? "Hide Debug" : "Debug"}
      </button>

      {isExpanded && (
        <div className={styles.panel}>
          <h3 className={styles.title}>Today Debug Info</h3>

          {/* User State */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>User State (Server)</h4>
            <div className={styles.grid}>
              <StateRow label="planExists" value={userState.planExists} />
              <StateRow label="hasIncompletePlanItems" value={userState.hasIncompletePlanItems} />
              <StateRow label="returningAfterGap" value={userState.returningAfterGap} />
              <StateRow label="firstDay" value={userState.firstDay} />
              <StateRow label="focusActive" value={userState.focusActive} />
              <StateRow label="activeStreak" value={userState.activeStreak} />
            </div>
            {userState.nextIncompleteItem && (
              <div className={styles.subSection}>
                <span className={styles.label}>Next Item:</span>
                <span className={styles.value}>{userState.nextIncompleteItem.title}</span>
              </div>
            )}
          </section>

          {/* Resolved Action */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Resolved Action</h4>
            <div className={styles.grid}>
              <div className={styles.row}>
                <span className={styles.label}>CTA:</span>
                <span className={styles.value}>{resolvedAction.label}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Href:</span>
                <span className={styles.value}>{resolvedAction.href}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Reason:</span>
                <span className={styles.value}>{resolvedAction.reason}</span>
              </div>
            </div>
          </section>

          {/* Visibility */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Visibility Rules</h4>
            <div className={styles.grid}>
              <StateRow label="showStarterBlock" value={visibility.showStarterBlock} />
              <StateRow label="showDailyPlan" value={visibility.showDailyPlan} />
              <StateRow label="showExplore" value={visibility.showExplore} />
              <StateRow label="hideExplore" value={visibility.hideExplore} />
              <StateRow label="showRewards" value={visibility.showRewards} />
              <StateRow label="forceDailyPlanCollapsed" value={visibility.forceDailyPlanCollapsed} />
              <StateRow label="forceExploreCollapsed" value={visibility.forceExploreCollapsed} />
            </div>
          </section>

          {/* Mode Status */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Active Modes</h4>
            <div className={styles.grid}>
              <StateRow label="Reduced Mode" value={isReducedMode} />
              <StateRow label="Soft Landing" value={isSoftLanding} />
            </div>
          </section>

          {/* Dynamic UI */}
          {dynamicUIData && (
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Dynamic UI</h4>
              <div className={styles.subSection}>
                <span className={styles.label}>Quick Picks:</span>
                <span className={styles.value}>
                  {dynamicUIData.quickPicks?.length || 0} items
                </span>
              </div>
              {dynamicUIData.resumeLast && (
                <div className={styles.subSection}>
                  <span className={styles.label}>Resume Last:</span>
                  <span className={styles.value}>{dynamicUIData.resumeLast.label}</span>
                </div>
              )}
              {dynamicUIData.interestPrimer && (
                <div className={styles.subSection}>
                  <span className={styles.label}>Interest Primer:</span>
                  <span className={styles.value}>{dynamicUIData.interestPrimer.label}</span>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function StateRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}:</span>
      <span className={`${styles.value} ${value ? styles.true : styles.false}`}>
        {value ? "true" : "false"}
      </span>
    </div>
  );
}

