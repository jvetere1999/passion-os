"use client";

/**
 * Mobile Tab Bar Component
 * Bottom navigation with Now/Act/Browse/System pattern
 *
 * Mobile prioritizes immediacy over completeness.
 * Planning is never the default. Execution is one tap away.
 */

import Link from "next/link";
import styles from "./MobileTabBar.module.css";

interface TabItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

/**
 * Mobile Tab Configuration (per blueprint)
 * Now: Today, stripped down
 * Act: Focus + Quests only
 * Browse: Everything else
 * System: Settings
 */
const TABS: TabItem[] = [
  {
    href: "/m",
    label: "Now",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="mobileTabFlame" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#8B0000"/>
            <stop offset="100%" stopColor="#DC143C"/>
          </linearGradient>
        </defs>
        <path d="M6 20 Q7.5 14 9 10 Q10.5 5 8 2 Q12 4 10.5 10 Q9.5 15 10.5 20 Z" fill="url(#mobileTabFlame)"/>
        <path d="M10.5 20 Q12 13 13.5 8 Q15 2.5 13.5 0 Q17 3 15 9 Q13.5 15 15 20 Z" fill="url(#mobileTabFlame)"/>
        <path d="M15 20 Q16.5 14 18 9 Q19.5 4 17.5 1 Q21 6 19.5 12 Q18 17 19.5 20 Z" fill="url(#mobileTabFlame)"/>
      </svg>
    ),
  },
  {
    href: "/m/do",
    label: "Act",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    href: "/m/explore",
    label: "Browse",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/m/me",
    label: "System",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

interface MobileTabBarProps {
  currentPath: string;
}

export function MobileTabBar({ currentPath }: MobileTabBarProps) {
  const isActive = (href: string) => {
    if (href === "/m") {
      return currentPath === "/m";
    }
    return currentPath.startsWith(href);
  };

  return (
    <nav className={styles.tabBar}>
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab} ${isActive(tab.href) ? styles.active : ""}`}
          >
            <span className={styles.icon}>
              {isActive(tab.href) && tab.activeIcon ? tab.activeIcon : tab.icon}
            </span>
            <span className={styles.label}>{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

