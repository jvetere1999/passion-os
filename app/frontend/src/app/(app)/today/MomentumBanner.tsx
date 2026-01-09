"use client";

/**
 * MomentumBanner Component
 * Inline acknowledgment banner shown once after first completion in a session
 *
 * Non-gamified: No XP, coins, streaks, or celebratory language.
 * Neutral copy: "Good start."
 *
 * Feature Flag: TODAY_MOMENTUM_FEEDBACK_V1
 */

import { useState, useEffect, useCallback } from "react";
import {
  getMomentumState,
  dismissMomentum,
  MOMENTUM_MESSAGE,
  type MomentumState,
} from "@/lib/today/momentum";
import { isTodayMomentumFeedbackEnabled } from "@/lib/flags";
import styles from "./MomentumBanner.module.css";

interface MomentumBannerProps {
  /** Force refresh trigger (increment to re-check state) */
  refreshKey?: number;
}

export function MomentumBanner({ refreshKey = 0 }: MomentumBannerProps) {
  const [state, setState] = useState<MomentumState>("pending");
  const [isEnabled, setIsEnabled] = useState(false);

  // Check momentum state and feature flag on mount and when refreshKey changes
  useEffect(() => {
    // Check feature flag (client-side)
    setIsEnabled(isTodayMomentumFeedbackEnabled());
    setState(getMomentumState());
  }, [refreshKey]);

  const handleDismiss = useCallback(() => {
    dismissMomentum();
    setState("dismissed");
  }, []);

  // Feature flag check
  if (!isEnabled) {
    return null;
  }

  // Only show when state is "shown"
  if (state !== "shown") {
    return null;
  }

  return (
    <div className={styles.container} role="status" aria-live="polite">
      <span className={styles.message}>{MOMENTUM_MESSAGE}</span>
      <button
        type="button"
        className={styles.dismissButton}
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

