/**
 * ResumeLast Component
 * Shows a single chip to resume the last-used module (within 24h)
 *
 * Presentation only - accepts server-computed data
 * Feature Flag: TODAY_DYNAMIC_UI_V1
 */

import Link from "next/link";
import type { ResumeLast as ResumeLastType } from "@/lib/db/repositories/dailyPlans";
import styles from "./ResumeLast.module.css";

interface ResumeLastProps {
  data: ResumeLastType | null;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    return diffMinutes <= 1 ? "just now" : `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours}h ago`;
  }
  return "yesterday";
}

export function ResumeLast({ data }: ResumeLastProps) {
  if (!data) {
    return null;
  }

  const relativeTime = formatRelativeTime(data.lastUsed);

  return (
    <div className={styles.container}>
      <Link
        href={data.route}
        className={styles.chip}
        aria-label={`Resume ${data.label} - last used ${relativeTime}`}
      >
        <svg
          className={styles.icon}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span className={styles.text}>Resume {data.label}</span>
        <span className={styles.time}>{relativeTime}</span>
      </Link>
    </div>
  );
}

