"use client";

/**
 * Mobile Today Client Component
 * Mobile-optimized Today view with larger touch targets
 *
 * Logic Parity: Uses same server-computed state as desktop TodayGridClient
 * Only presentation differs:
 * - Larger touch targets (44x44 minimum)
 * - Full-width cards
 * - Bottom sheet navigation patterns
 * - Simplified layout for small screens
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DynamicUIData, DailyPlanSummary } from "@/lib/db/repositories/dailyPlans";
import { isTodaySoftLandingEnabled } from "@/lib/flags";
import { isSoftLandingActive, clearSoftLanding } from "@/lib/today/softLanding";
import styles from "./MobileToday.module.css";

interface MobileTodayClientProps {
  isReducedMode: boolean;
  forceDailyPlanCollapsed: boolean;
  forceExploreCollapsed: boolean;
  showStarterBlock: boolean;
  showDailyPlan: boolean;
  showExplore: boolean;
  hideExplore: boolean;
  showRewards: boolean;
  dynamicUIData: DynamicUIData | null;
  initialPlanSummary: DailyPlanSummary | null;
  greeting: string;
  firstName: string;
}

export function MobileTodayClient({
  isReducedMode,
  forceDailyPlanCollapsed,
  forceExploreCollapsed,
  showStarterBlock,
  showDailyPlan,
  showExplore,
  hideExplore,
  showRewards,
  dynamicUIData,
  initialPlanSummary,
  greeting,
  firstName,
}: MobileTodayClientProps) {
  const [softLandingActive, setSoftLandingActive] = useState(false);
  const [planExpanded, setPlanExpanded] = useState(!forceDailyPlanCollapsed);

  // Check soft landing on mount
  useEffect(() => {
    if (isTodaySoftLandingEnabled()) {
      setSoftLandingActive(isSoftLandingActive());
    }
  }, []);

  // Effective reduced mode includes soft landing
  const effectiveReducedMode = isReducedMode || softLandingActive;

  // Resolve primary CTA
  const getPrimaryCTA = () => {
    if (initialPlanSummary?.hasIncompletePlanItems && initialPlanSummary.nextIncompleteItem) {
      return {
        href: initialPlanSummary.nextIncompleteItem.actionUrl || "/focus",
        label: initialPlanSummary.nextIncompleteItem.title || "Continue",
      };
    }
    return { href: "/focus", label: "Start Focus" };
  };

  const primaryCTA = getPrimaryCTA();

  return (
    <div className={styles.screen}>
      {/* Greeting */}
      <header className={styles.greeting}>
        <h1 className={styles.greetingTitle}>{greeting}, {firstName}</h1>
        <p className={styles.greetingDate}>{formatDate(new Date())}</p>
      </header>

      {/* Reduced Mode Banner */}
      {effectiveReducedMode && (
        <div className={styles.reducedBanner}>
          <p className={styles.reducedText}>Welcome back. Start small.</p>
          {softLandingActive && (
            <button
              className={styles.reducedDismiss}
              onClick={() => {
                clearSoftLanding();
                setSoftLandingActive(false);
              }}
            >
              Show all
            </button>
          )}
        </div>
      )}

      {/* Primary Action Card - Starter Block */}
      {showStarterBlock && (
        <section className={styles.starterSection}>
          <Link href={primaryCTA.href} className={styles.starterCard}>
            <div className={styles.starterContent}>
              <span className={styles.starterLabel}>Start here</span>
              <span className={styles.starterTitle}>{primaryCTA.label}</span>
            </div>
            <span className={styles.starterArrow}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </Link>
        </section>
      )}

      {/* Quick Picks - Dynamic UI */}
      {dynamicUIData?.quickPicks && dynamicUIData.quickPicks.length > 0 && !effectiveReducedMode && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Picks</h2>
          <div className={styles.quickPicks}>
            {dynamicUIData.quickPicks.slice(0, 2).map((pick, idx) => (
              <Link key={idx} href={pick.route} className={styles.quickPickCard}>
                <span className={styles.quickPickLabel}>{pick.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Daily Plan Summary */}
      {showDailyPlan && initialPlanSummary && (
        <section className={styles.section}>
          <button
            className={styles.planHeader}
            onClick={() => setPlanExpanded(!planExpanded)}
          >
            <div className={styles.planHeaderContent}>
              <h2 className={styles.sectionTitle}>Today&apos;s Plan</h2>
              <span className={styles.planProgress}>
                {initialPlanSummary.completedCount}/{initialPlanSummary.totalCount}
              </span>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={planExpanded ? styles.chevronUp : styles.chevronDown}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {planExpanded && (
            <div className={styles.planContent}>
              {initialPlanSummary.hasIncompletePlanItems ? (
                <p className={styles.planNext}>
                  Next: {initialPlanSummary.nextIncompleteItem?.title || "Continue working"}
                </p>
              ) : (
                <p className={styles.planComplete}>All done for today!</p>
              )}
              <Link href="/today" className={styles.planLink}>
                View full plan
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Quick Actions Grid - Only when not in reduced mode */}
      {showExplore && !hideExplore && !effectiveReducedMode && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Explore</h2>
          <div className={styles.actionGrid}>
            <QuickAction href="/focus" label="Focus" icon={<FocusIcon />} />
            <QuickAction href="/quests" label="Quests" icon={<QuestsIcon />} />
            <QuickAction href="/habits" label="Habits" icon={<HabitsIcon />} />
            <QuickAction href="/exercise" label="Exercise" icon={<ExerciseIcon />} />
          </div>
        </section>
      )}

      {/* Minimal actions in reduced mode */}
      {effectiveReducedMode && (
        <section className={styles.section}>
          <div className={styles.minimalActions}>
            <Link href="/focus" className={styles.minimalAction}>5 min focus</Link>
            <Link href="/quests" className={styles.minimalAction}>Quick quest</Link>
          </div>
        </section>
      )}
    </div>
  );
}

// Helper Components
function QuickAction({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className={styles.actionCard}>
      <span className={styles.actionIcon}>{icon}</span>
      <span className={styles.actionLabel}>{label}</span>
    </Link>
  );
}

// Icons
function FocusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function QuestsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

function HabitsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ExerciseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6.5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M4 21v-7l-2-4 4-2 4 4-2 4" />
      <path d="M10 5l4 4" />
      <path d="M21 3l-6 6" />
      <path d="M18 22V12l2-4-3-1" />
    </svg>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

