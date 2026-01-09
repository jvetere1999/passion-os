"use client";

/**
 * QuickModeHeader Component
 * Shows a header bar when in quick mode (?quick=1)
 * Provides "Back to Today" navigation
 */

import Link from "next/link";
import styles from "./QuickModeHeader.module.css";

interface QuickModeHeaderProps {
  title?: string;
}

export function QuickModeHeader({ title = "Quick Start" }: QuickModeHeaderProps) {
  return (
    <div className={styles.container}>
      <span className={styles.title}>{title}</span>
      <Link href="/today" className={styles.backLink}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Today
      </Link>
    </div>
  );
}

/**
 * Hook to detect quick mode from URL
 */
export function useQuickMode(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("quick") === "1";
}

