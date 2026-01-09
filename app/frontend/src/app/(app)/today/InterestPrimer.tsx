/**
 * InterestPrimer Component
 * Shows a single suggestion based on user's interest pattern
 *
 * Presentation only - accepts server-computed data
 * Feature Flag: TODAY_DYNAMIC_UI_V1
 */

import Link from "next/link";
import type { InterestPrimer as InterestPrimerType } from "@/lib/db/repositories/dailyPlans";
import styles from "./InterestPrimer.module.css";

interface InterestPrimerProps {
  data: InterestPrimerType | null;
}

/**
 * Icon for each primer type
 */
function getPrimerIcon(type: "learn" | "hub") {
  if (type === "learn") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  }
  // hub - keyboard shortcuts icon
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h.01" />
      <path d="M10 8h.01" />
      <path d="M14 8h.01" />
      <path d="M18 8h.01" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
      <path d="M7 16h10" />
    </svg>
  );
}

export function InterestPrimer({ data }: InterestPrimerProps) {
  if (!data) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Link
        href={data.route}
        className={styles.card}
        aria-label={data.label}
      >
        <span className={styles.icon}>{getPrimerIcon(data.type)}</span>
        <span className={styles.text}>{data.label}</span>
        <svg
          className={styles.arrow}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>
    </div>
  );
}

