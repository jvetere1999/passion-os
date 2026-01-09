/**
 * SuccessState Component
 * Standard success display with optional action
 *
 * Usage:
 * <SuccessState
 *   title="Task completed"
 *   message="Your changes have been saved"
 *   action={{ label: "Continue", href: "/next" }}
 * />
 */

import Link from "next/link";
import type { SuccessStateProps } from "@/lib/ui/contract";
import { Button } from "./Button";
import styles from "./States.module.css";

export function SuccessState({
  title,
  message,
  action,
}: SuccessStateProps) {
  return (
    <div
      className={`${styles.state} ${styles.success}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className={styles.successIcon}
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
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.description}>{message}</p>}
      {action && (
        <div className={styles.action}>
          {action.href ? (
            <Link href={action.href}>
              <Button variant="primary">{action.label}</Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

