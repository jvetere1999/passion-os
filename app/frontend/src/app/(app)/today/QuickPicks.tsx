/**
 * QuickPicks Component
 * Shows up to 2 personalized quick action chips based on usage frequency
 *
 * Presentation only - accepts server-computed data
 * Feature Flag: TODAY_DYNAMIC_UI_V1
 */

import Link from "next/link";
import type { QuickPick } from "@/lib/db/repositories/dailyPlans";
import styles from "./QuickPicks.module.css";

interface QuickPicksProps {
  picks: QuickPick[];
  /** Maximum number to show (respects decision suppression) */
  maxVisible?: number;
}

/**
 * Icon for each module type
 */
function getModuleIcon(module: string) {
  switch (module) {
    case "focus":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "exercise":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
          <path d="M4 21v-7l-2-4 4-2 4 4-2 4" />
          <path d="M10 5l4 4" />
          <path d="M21 3l-6 6" />
        </svg>
      );
    case "learn":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case "quests":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );
    case "habits":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
  }
}

export function QuickPicks({ picks, maxVisible = 2 }: QuickPicksProps) {
  if (picks.length === 0) {
    return null;
  }

  const visiblePicks = picks.slice(0, maxVisible);

  return (
    <div className={styles.container} role="navigation" aria-label="Quick actions">
      <span className={styles.label}>Quick picks:</span>
      <div className={styles.picks}>
        {visiblePicks.map((pick) => (
          <Link
            key={pick.module}
            href={pick.route}
            className={styles.chip}
            aria-label={`${pick.label} - used ${pick.count} times recently`}
          >
            <span className={styles.icon}>{getModuleIcon(pick.module)}</span>
            <span className={styles.text}>{pick.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

