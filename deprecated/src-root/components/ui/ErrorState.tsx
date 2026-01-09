/**
 * ErrorState Component
 * Standard error display with optional retry action
 *
 * Usage:
 * <ErrorState
 *   title="Something went wrong"
 *   message="Failed to load data"
 *   retry={{ onClick: () => refetch() }}
 * />
 */

import type { ErrorStateProps } from "@/lib/ui/contract";
import { Button } from "./Button";
import styles from "./States.module.css";

export function ErrorState({
  title = "Error",
  message,
  retry,
}: ErrorStateProps) {
  return (
    <div
      className={`${styles.state} ${styles.error}`}
      role="alert"
      aria-live="assertive"
    >
      <svg
        className={styles.errorIcon}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{message}</p>
      {retry && (
        <div className={styles.action}>
          <Button variant="secondary" onClick={retry.onClick}>
            {retry.label || "Try Again"}
          </Button>
        </div>
      )}
    </div>
  );
}

