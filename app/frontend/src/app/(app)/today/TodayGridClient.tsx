"use client";

/**
 * TodayGridClient Component
 * Client-side wrapper that applies soft landing overrides to visibility props
 * and renders the Today page grid content.
 *
 * This component handles:
 * - Soft landing state detection from URL params and sessionStorage
 * - Override application for collapsed states
 * - Section expand callbacks to clear soft landing
 * - Dynamic UI elements (quick picks, resume last, interest primer)
 */

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { DynamicUIData, DailyPlanSummary } from "@/lib/db/repositories/dailyPlans";
import type { UserPersonalization } from "@/lib/today/resolveNextAction";
import {
  activateSoftLanding,
  clearSoftLanding,
  getSoftLandingState,
  parseSoftLandingParams,
  type SoftLandingState,
} from "@/lib/today/softLanding";
import { isTodaySoftLandingEnabled } from "@/lib/flags";
import { MomentumBanner } from "./MomentumBanner";
import { ReducedModeBanner } from "./ReducedModeBanner";
import { DailyPlanWidget } from "./DailyPlan";
import { StarterBlock } from "./StarterBlock";
import { ExploreDrawer } from "./ExploreDrawer";
import { QuickPicks } from "./QuickPicks";
import { ResumeLast } from "./ResumeLast";
import { InterestPrimer } from "./InterestPrimer";
import { RewardTeaser } from "./RewardTeaser";
import styles from "./page.module.css";

interface TodayGridClientProps {
  /** Server-computed reduced mode */
  isReducedMode: boolean;
  /** Server-computed force collapse for daily plan */
  forceDailyPlanCollapsed: boolean;
  /** Server-computed force collapse for explore */
  forceExploreCollapsed: boolean;
  /** Server-computed visibility flags */
  showStarterBlock: boolean;
  showDailyPlan: boolean;
  showExplore: boolean;
  hideExplore: boolean;
  showRewards: boolean;
  /** Server-computed dynamic UI data (null if flag OFF) */
  dynamicUIData?: DynamicUIData | null;
  /** Server-prefetched plan summary to avoid client refetch */
  initialPlanSummary?: DailyPlanSummary | null;
  /** User personalization settings */
  personalization?: UserPersonalization | null;
}

function TodayGridClientInner({
  isReducedMode,
  forceDailyPlanCollapsed,
  forceExploreCollapsed,
  showStarterBlock,
  showDailyPlan,
  showExplore,
  hideExplore,
  showRewards,
  dynamicUIData,
  initialPlanSummary: _initialPlanSummary,
  personalization: _personalization,
}: TodayGridClientProps) {
  const searchParams = useSearchParams();
  const [softLandingState, setSoftLandingState] = useState<SoftLandingState>("inactive");

  // Check for soft landing on mount and when URL changes
  useEffect(() => {
    // Feature flag check - if disabled, always inactive
    if (!isTodaySoftLandingEnabled()) {
      setSoftLandingState("inactive");
      return;
    }

    // Check URL params first
    const params = parseSoftLandingParams(searchParams);

    if (params.isSoftMode && params.source) {
      // Activate soft landing from URL params
      activateSoftLanding(params.source);
      setSoftLandingState("active");

      // Clear URL params without navigation (clean URL)
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("mode");
        url.searchParams.delete("from");
        url.searchParams.delete("status");
        window.history.replaceState({}, "", url.pathname);
      }
      return;
    }

    // Check sessionStorage
    const currentState = getSoftLandingState();
    setSoftLandingState(currentState);
  }, [searchParams]);

  const handleSectionExpand = useCallback(() => {
    if (softLandingState === "active") {
      clearSoftLanding();
      setSoftLandingState("cleared");
    }
  }, [softLandingState]);

  const isSoftLandingActive = softLandingState === "active";

  // Apply soft landing overrides when active
  const effectiveReducedMode = isReducedMode || isSoftLandingActive;
  const effectiveForceDailyPlanCollapsed = forceDailyPlanCollapsed || isSoftLandingActive;
  const effectiveForceExploreCollapsed = forceExploreCollapsed || isSoftLandingActive;
  // Hide rewards during soft landing to reduce choices
  const effectiveShowRewards = showRewards && !isSoftLandingActive;

  return (
    <>
      {/* Momentum Banner - shows once per session after first completion */}
      <MomentumBanner />

      {/* Reduced Mode Banner - only shows when in reduced mode */}
      {effectiveReducedMode && (
        <section className={styles.reducedModeSection}>
          <ReducedModeBanner />
        </section>
      )}

      {/* Starter Block - Primary CTA */}
      {showStarterBlock && (
        <section className={styles.starterSection}>
          <StarterBlock />
        </section>
      )}

      {/* Dynamic UI - Quick Picks, Resume Last, Interest Primer */}
      {dynamicUIData && (
        <section className={styles.dynamicSection}>
          {dynamicUIData.resumeLast && (
            <ResumeLast data={dynamicUIData.resumeLast} />
          )}
          {dynamicUIData.quickPicks.length > 0 && (
            <QuickPicks picks={dynamicUIData.quickPicks} maxVisible={2} />
          )}
          {dynamicUIData.interestPrimer && (
            <InterestPrimer data={dynamicUIData.interestPrimer} />
          )}
        </section>
      )}

      {/* Daily Plan */}
      {showDailyPlan && (
        <section className={styles.planSection} id="daily-plan">
          <DailyPlanWidget
            forceCollapsed={effectiveForceDailyPlanCollapsed}
            onExpand={handleSectionExpand}
          />
        </section>
      )}

      {/* Explore Drawer - Contains all action cards */}
      {!hideExplore && showExplore && (
        <ExploreDrawer
          forceCollapsed={effectiveForceExploreCollapsed}
          onExpand={handleSectionExpand}
        >
          {/* Primary Actions */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Get Started</h2>
            <div className={styles.actions}>
              <Link href="/focus" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <span className={styles.actionLabel}>Start Focus</span>
              </Link>

              <Link href="/planner" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <span className={styles.actionLabel}>Plan Day</span>
              </Link>

              <Link href="/quests" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="m9 15 2 2 4-4" />
                  </svg>
                </div>
                <span className={styles.actionLabel}>Quests</span>
              </Link>

              <Link href="/exercise" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6.5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                    <path d="M4 21v-7l-2-4 4-2 4 4-2 4" />
                    <path d="M10 5l4 4" />
                    <path d="M21 3l-6 6" />
                    <path d="M18 22V12l2-4-3-1" />
                  </svg>
                </div>
                <span className={styles.actionLabel}>Exercise</span>
              </Link>
            </div>
          </section>

          {/* Production Tools */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Production</h2>
            <div className={styles.actions}>
              <Link href="/hub" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                    <path d="M6 8h.001" />
                    <path d="M10 8h.001" />
                    <path d="M14 8h.001" />
                    <path d="M18 8h.001" />
                    <path d="M8 12h.001" />
                    <path d="M12 12h.001" />
                    <path d="M16 12h.001" />
                    <path d="M7 16h10" />
                  </svg>
                </div>
                <span className={styles.actionLabel}>Shortcuts</span>
              </Link>

              <Link href="/arrange" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M3 15h18" />
                    <path d="M9 3v18" />
                  </svg>
                </div>
                <span className={styles.actionLabel}>Arrange</span>
              </Link>

              <Link href="/reference" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13" />
                    <path d="M6 15h12" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
                <span className={styles.actionLabel}>Reference</span>
              </Link>

              <Link href="/templates" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
                <span className={styles.actionLabel}>Templates</span>
              </Link>
            </div>
          </section>

          {/* Knowledge & Learning */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Learn & Grow</h2>
            <div className={styles.actions}>
              <Link href="/learn" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <span className={styles.actionLabel}>Learn</span>
              </Link>

              <Link href="/infobase" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <span className={styles.actionLabel}>Infobase</span>
              </Link>

              <Link href="/goals" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <span className={styles.actionLabel}>Goals</span>
              </Link>

              <Link href="/progress" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="20" x2="12" y2="10" />
                    <line x1="18" y1="20" x2="18" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="16" />
                  </svg>
                </div>
                <span className={styles.actionLabel}>Progress</span>
              </Link>
            </div>
          </section>
        </ExploreDrawer>
      )}

      {/* Rewards Section */}
      {effectiveShowRewards && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Rewards</h2>
            <Link href="/market" className={styles.sectionLink}>
              Visit Market
            </Link>
          </div>
          <RewardTeaser />
          <div className={styles.rewardCard}>
            <p className={styles.rewardText}>
              Complete quests and focus sessions to earn coins and XP.
              Redeem rewards in the Market!
            </p>
          </div>
        </section>
      )}
    </>
  );
}

export function TodayGridClient(props: TodayGridClientProps) {
  // Wrap in Suspense because useSearchParams requires it
  return (
    <Suspense fallback={null}>
      <TodayGridClientInner {...props} />
    </Suspense>
  );
}


