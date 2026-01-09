"use client";

/**
 * StarterBlock Component
 * Displays a single dominant CTA based on the user's daily plan
 *
 * Uses resolveStarterAction from lib/today for deterministic resolution:
 * - If plan exists with incomplete items: show first incomplete by priority
 * - Otherwise: fallback chain (Focus -> Quests -> Learn)
 *
 * Feature Flag: TODAY_NEXT_ACTION_RESOLVER_V1
 * Safety Net: validateResolverOutput ensures valid action
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  resolveStarterAction,
  validateResolverOutput,
  validateDailyPlan,
  type DailyPlan,
  type PlanItem,
} from "@/lib/today";
import { isTodayNextActionResolverEnabled } from "@/lib/flags";
import styles from "./StarterBlock.module.css";

/**
 * Simple fallback resolver when flag is OFF
 * Matches original behavior before resolver implementation
 */
function getSimpleStarterAction(plan: DailyPlan | null) {
  if (plan && plan.items && plan.items.length > 0) {
    const incompleteItems = plan.items
      .filter((item) => item && !item.completed)
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

    if (incompleteItems.length > 0) {
      const firstItem = incompleteItems[0];
      return {
        href: firstItem.actionUrl || "/focus",
        label: `Continue: ${firstItem.title || "Task"}`,
        type: firstItem.type || "focus",
      };
    }
  }

  return {
    href: "/focus",
    label: "Start Focus",
    type: "focus" as const,
  };
}


function getIconForType(type: PlanItem["type"] | "focus") {
  switch (type) {
    case "focus":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "quest":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );
    case "workout":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
          <path d="M4 21v-7l-2-4 4-2 4 4-2 4" />
        </svg>
      );
    case "learning":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "habit":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
}

export function StarterBlock() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/daily-plan");
      if (res.ok) {
        const data = (await res.json()) as { plan: DailyPlan | null };
        // Safety net: validate plan structure
        setPlan(validateDailyPlan(data.plan));
      }
    } catch (error) {
      console.error("StarterBlock: Failed to fetch daily plan:", error);
      // Safety net: treat fetch errors as no plan
      setPlan(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Feature flag: use resolver or simple fallback
  let starter;
  if (isTodayNextActionResolverEnabled()) {
    // Use the pure resolver function with safety net validation
    const resolved = resolveStarterAction(plan);
    starter = validateResolverOutput(resolved);
  } else {
    // Flag OFF: use simple fallback logic
    starter = getSimpleStarterAction(plan);
  }

  if (isLoading) {
    return (
      <section className={styles.container} data-testid="starter-block">
        <h2 className={styles.title}>Start here</h2>
        <div className={styles.loading}>Loading...</div>
      </section>
    );
  }

  return (
    <section className={styles.container} data-testid="starter-block">
      <h2 className={styles.title}>Start here</h2>
      <div className={styles.actions}>
        <Link
          href={starter.href}
          className={styles.primaryButton}
          data-testid="starter-cta"
        >
          <span className={styles.buttonIcon}>{getIconForType(starter.type)}</span>
          <span className={styles.buttonLabel}>{starter.label}</span>
        </Link>
        <a href="#daily-plan" className={styles.secondaryLink}>
          View today
        </a>
      </div>
    </section>
  );
}

