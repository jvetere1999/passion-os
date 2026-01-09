"use client";

/**
 * ReducedModeBanner Component
 * Shows a welcome back message for users returning after a gap
 * No shaming language - encouraging and supportive
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./ReducedModeBanner.module.css";

const DISMISS_KEY = "today_reduced_mode_dismissed";

interface ReducedModeBannerProps {
  onDismiss?: () => void;
}

export function ReducedModeBanner({ onDismiss }: ReducedModeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if already dismissed this session
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(DISMISS_KEY);
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    } catch {
      // sessionStorage not available
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // sessionStorage not available
    }
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <p className={styles.message}>Welcome back. Start small.</p>
        <div className={styles.suggestions}>
          <Link href="/focus" className={styles.suggestion}>
            <span className={styles.suggestionIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </span>
            <span>5 min focus</span>
          </Link>
          <Link href="/quests" className={styles.suggestion}>
            <span className={styles.suggestionIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <path d="m9 15 2 2 4-4" />
              </svg>
            </span>
            <span>Quick quest</span>
          </Link>
        </div>
      </div>
      <button
        type="button"
        className={styles.dismissButton}
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

