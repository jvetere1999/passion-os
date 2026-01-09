/**
 * MobileNav Component
 * Bottom tab bar navigation for mobile devices
 *
 * Shows on screens < 768px
 * Provides quick access to core sections: Today, Focus, Quests, More
 *
 * Logic parity: Uses same routes as Sidebar, just different presentation
 */

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./MobileNav.module.css";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchPaths?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/today",
    label: "Today",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "/focus",
    label: "Focus",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    href: "/quests",
    label: "Quests",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="m9 15 2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/progress",
    label: "Progress",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
  },
];

interface MobileNavProps {
  onMoreClick?: () => void;
}

export function MobileNav({ onMoreClick }: MobileNavProps) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (pathname === item.href) return true;
    if (item.matchPaths?.some(p => pathname.startsWith(p))) return true;
    return false;
  };

  return (
    <nav className={styles.mobileNav} aria-label="Mobile navigation">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.navItem} ${isActive(item) ? styles.active : ""}`}
          aria-current={isActive(item) ? "page" : undefined}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          <span className={styles.navLabel}>{item.label}</span>
        </Link>
      ))}
      <button
        type="button"
        className={styles.navItem}
        onClick={onMoreClick}
        aria-label="More options"
      >
        <span className={styles.navIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </span>
        <span className={styles.navLabel}>More</span>
      </button>
    </nav>
  );
}

