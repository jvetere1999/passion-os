"use client";

/**
 * Daily Plan Component
 * Generates and displays a personalized daily plan
 *
 * Auto-refresh: Refetches on focus after 5 minutes staleness (per SYNC.md)
 * Collapse state: Persisted in localStorage
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAutoRefresh } from "@/lib/hooks";
import styles from "./DailyPlan.module.css";

const COLLAPSE_STATE_KEY = "today_dailyplan_collapsed";

interface PlanItem {
  id: string;
  type: "focus" | "quest" | "workout" | "learning" | "habit";
  title: string;
  description?: string;
  duration?: number;
  actionUrl: string;
  completed: boolean;
  priority: number;
}

interface DailyPlan {
  id: string;
  date: string;
  items: PlanItem[];
  completedCount: number;
  totalCount: number;
}

/**
 * Get first incomplete item sorted by priority
 */
function getFirstIncomplete(items: PlanItem[]): PlanItem | null {
  const incomplete = items
    .filter((item) => !item.completed)
    .sort((a, b) => a.priority - b.priority);
  return incomplete.length > 0 ? incomplete[0] : null;
}

interface DailyPlanWidgetProps {
  forceCollapsed?: boolean;
  /** Callback when user expands the widget */
  onExpand?: () => void;
}

export function DailyPlanWidget({ forceCollapsed = false, onExpand }: DailyPlanWidgetProps) {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load collapse state from localStorage on mount
  // If forceCollapsed is true, start collapsed regardless of localStorage
  useEffect(() => {
    if (forceCollapsed) {
      setIsExpanded(false);
      return;
    }
    try {
      const stored = localStorage.getItem(COLLAPSE_STATE_KEY);
      // Default is collapsed (true), so expanded when stored is "false"
      if (stored === "false") {
        setIsExpanded(true);
      }
    } catch {
      // localStorage not available, default to collapsed
    }
  }, [forceCollapsed]);

  // Persist collapse state to localStorage
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => {
      const newValue = !prev;
      try {
        // Store collapsed state (inverse of expanded)
        localStorage.setItem(COLLAPSE_STATE_KEY, newValue ? "false" : "true");
      } catch {
        // localStorage not available
      }
      // Call onExpand when expanding
      if (newValue && onExpand) {
        onExpand();
      }
      return newValue;
    });
  }, [onExpand]);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/daily-plan");
      if (res.ok) {
        const data = await res.json() as { plan: DailyPlan | null };
        setPlan(data.plan);
      }
    } catch (error) {
      console.error("Failed to fetch daily plan:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh: refetch on focus after 5 minute staleness (per SYNC.md)
  // Pauses on page unload, soft refreshes on reload if stale
  useAutoRefresh({
    onRefresh: fetchPlan,
    refreshKey: "daily-plan",
    stalenessMs: 300000, // 5 minutes per SYNC.md contract
    refreshOnMount: true,
    refetchOnFocus: true,
    refetchOnVisible: true,
    enabled: !isLoading && !isGenerating,
  });

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/daily-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      if (res.ok) {
        const data = await res.json() as { plan: DailyPlan };
        setPlan(data.plan);
      }
    } catch (error) {
      console.error("Failed to generate plan:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteItem = async (itemId: string) => {
    if (!plan) return;

    // Optimistic update
    setPlan({
      ...plan,
      items: plan.items.map((item) =>
        item.id === itemId ? { ...item, completed: true } : item
      ),
      completedCount: plan.completedCount + 1,
    });

    try {
      await fetch("/api/daily-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_item", item_id: itemId }),
      });
    } catch (error) {
      console.error("Failed to complete item:", error);
      fetchPlan(); // Revert on error
    }
  };

  const getTypeIcon = (type: PlanItem["type"]) => {
    switch (type) {
      case "focus":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        );
      case "quest":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <path d="m9 15 2 2 4-4" />
          </svg>
        );
      case "workout":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6.5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
            <path d="M4 21v-7l-2-4 4-2 4 4-2 4" />
          </svg>
        );
      case "learning":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        );
      case "habit":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4" />
            <path d="m16.24 7.76-2.83 2.83" />
            <path d="M20 12h-4" />
            <path d="m16.24 16.24-2.83-2.83" />
            <path d="M12 20v-4" />
            <path d="m7.76 16.24 2.83-2.83" />
            <path d="M4 12h4" />
            <path d="m7.76 7.76 2.83 2.83" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your plan...</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Daily Plan</h3>
        </div>
        <div className={styles.empty}>
          <p>No plan for today yet.</p>
          <button
            className={styles.generateButton}
            onClick={handleGeneratePlan}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Plan My Day"}
          </button>
        </div>
      </div>
    );
  }

  const progress = plan.totalCount > 0 ? (plan.completedCount / plan.totalCount) * 100 : 0;
  const firstIncomplete = getFirstIncomplete(plan.items);
  const allDone = plan.completedCount === plan.totalCount;

  // Collapsed view
  if (!isExpanded) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Today&apos;s Plan</h3>
          <span className={styles.progress}>
            {plan.completedCount}/{plan.totalCount}
          </span>
        </div>

        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <p className={styles.summaryText}>
          {allDone ? "All done" : `Next: ${firstIncomplete?.title}`}
        </p>

        <div className={styles.collapsedActions}>
          {!allDone && firstIncomplete && (
            <Link href={firstIncomplete.actionUrl} className={styles.continueButton}>
              Continue
            </Link>
          )}
          <button
            type="button"
            className={styles.viewPlanButton}
            onClick={toggleExpanded}
          >
            View Plan
          </button>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Today&apos;s Plan</h3>
        <span className={styles.progress}>
          {plan.completedCount}/{plan.totalCount}
        </span>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.items}>
        {plan.items.map((item) => (
          <div
            key={item.id}
            className={`${styles.item} ${item.completed ? styles.completed : ""}`}
          >
            <button
              className={styles.checkbox}
              onClick={() => !item.completed && handleCompleteItem(item.id)}
              disabled={item.completed}
            >
              {item.completed && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            <div className={styles.itemContent}>
              <div className={styles.itemHeader}>
                <span className={styles.itemIcon}>{getTypeIcon(item.type)}</span>
                <span className={styles.itemTitle}>{item.title}</span>
              </div>
              {item.description && (
                <p className={styles.itemDescription}>{item.description}</p>
              )}
            </div>
            <Link href={item.actionUrl} className={styles.startButton}>
              Start
            </Link>
          </div>
        ))}
      </div>

      <div className={styles.expandedActions}>
        <button
          className={styles.regenerateButton}
          onClick={handleGeneratePlan}
          disabled={isGenerating}
        >
          {isGenerating ? "Regenerating..." : "Regenerate Plan"}
        </button>
        <button
          type="button"
          className={styles.hidePlanButton}
          onClick={toggleExpanded}
        >
          Hide Plan
        </button>
      </div>
    </div>
  );
}

