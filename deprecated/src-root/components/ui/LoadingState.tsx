/**
 * LoadingState Component
 * Standard loading indicator with optional message
 *
 * Usage:
 * <LoadingState message="Loading your data..." size="md" />
 */

import type { LoadingStateProps } from "@/lib/ui/contract";
import styles from "./States.module.css";

export function LoadingState({
  message = "Loading...",
  size = "md",
}: LoadingStateProps) {
  const spinnerSize = size === "sm" ? 20 : size === "lg" ? 32 : 24;

  return (
    <div
      className={`${styles.state} ${styles.loading}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className={styles.spinner}
        width={spinnerSize}
        height={spinnerSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <span className={styles.message}>{message}</span>
    </div>
  );
}

