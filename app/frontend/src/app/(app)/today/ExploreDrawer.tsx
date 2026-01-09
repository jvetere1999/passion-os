"use client";

/**
 * ExploreDrawer Component
 * Collapsible section containing action cards
 *
 * Collapsed: Shows 3 quick links (Quests, Exercise, Learn)
 * Expanded: Shows all action cards grouped by category
 * State persists in localStorage
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./ExploreDrawer.module.css";

const COLLAPSE_STATE_KEY = "today_explore_collapsed";

// Quick links shown in collapsed state
const QUICK_LINKS = [
  {
    href: "/quests",
    label: "Quests",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="m9 15 2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/exercise",
    label: "Exercise",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="M4 21v-7l-2-4 4-2 4 4-2 4" />
        <path d="M10 5l4 4" />
        <path d="M21 3l-6 6" />
        <path d="M18 22V12l2-4-3-1" />
      </svg>
    ),
  },
  {
    href: "/learn",
    label: "Learn",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
];

interface ExploreDrawerProps {
  children: React.ReactNode;
  forceCollapsed?: boolean;
  /** Callback when user expands the drawer */
  onExpand?: () => void;
}

export function ExploreDrawer({ children, forceCollapsed = false, onExpand }: ExploreDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Load collapse state from localStorage on mount
  // If forceCollapsed is true, start collapsed regardless of localStorage
  useEffect(() => {
    if (forceCollapsed) {
      setIsExpanded(false);
      return;
    }
    try {
      const stored = localStorage.getItem(COLLAPSE_STATE_KEY);
      // Default is collapsed (true), so expanded when stored is "false"
      if (stored === "false") {
        setIsExpanded(true);
      }
    } catch {
      // localStorage not available, default to collapsed
    }
  }, [forceCollapsed]);

  // Persist collapse state to localStorage
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => {
      const newValue = !prev;
      try {
        // Store collapsed state (inverse of expanded)
        localStorage.setItem(COLLAPSE_STATE_KEY, newValue ? "false" : "true");
      } catch {
        // localStorage not available
      }
      // Call onExpand when expanding
      if (newValue && onExpand) {
        onExpand();
      }
      return newValue;
    });
  }, [onExpand]);

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Explore</h2>
        <button
          type="button"
          className={styles.toggleButton}
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Show Less" : "See More"}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${styles.chevron} ${isExpanded ? styles.chevronUp : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {!isExpanded ? (
        // Collapsed: Show 3 quick links
        <div className={styles.quickLinks}>
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={styles.quickLink}>
              <span className={styles.quickLinkIcon}>{link.icon}</span>
              <span className={styles.quickLinkLabel}>{link.label}</span>
            </Link>
          ))}
        </div>
      ) : (
        // Expanded: Show all action cards
        <div className={styles.expandedContent}>{children}</div>
      )}
    </section>
  );
}

