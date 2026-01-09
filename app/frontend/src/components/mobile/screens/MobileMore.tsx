"use client";

/**
 * Mobile More Screen
 * Navigation to additional features and settings
 */

import type { User } from "next-auth";
import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./MobileMore.module.css";

interface MobileMoreProps {
  user: User;
}

const MENU_SECTIONS = [
  {
    title: "Features",
    items: [
      { href: "/m/planner", label: "Planner" },
      { href: "/m/goals", label: "Goals" },
      { href: "/m/market", label: "Market" },
      { href: "/m/learn", label: "Learn" },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: "/m/shortcuts", label: "Shortcuts" },
      { href: "/m/arrange", label: "Arrange" },
      { href: "/m/reference", label: "Reference" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/m/settings", label: "Settings" },
    ],
  },
];

export function MobileMore({ user }: MobileMoreProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/m/auth/signin" });
  };

  return (
    <div className={styles.screen}>
      {/* User Profile */}
      <div className={styles.profile}>
        <div className={styles.avatar}>
          {user.image ? (
            <img src={user.image} alt={user.name || "User"} />
          ) : (
            <span>{user.name?.charAt(0) || user.email?.charAt(0) || "?"}</span>
          )}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.name || "User"}</span>
          <span className={styles.userEmail}>{user.email}</span>
        </div>
      </div>

      {/* Menu Sections */}
      {MENU_SECTIONS.map((section) => (
        <div key={section.title} className={styles.section}>
          <h2 className={styles.sectionTitle}>{section.title}</h2>
          <div className={styles.menuList}>
            {section.items.map((item) => (
              <Link key={item.href} href={item.href} className={styles.menuItem}>
                <span>{item.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Sign Out */}
      <button className={styles.signOutBtn} onClick={handleSignOut}>
        Sign Out
      </button>

      {/* App Version */}
      <p className={styles.version}>Ignition v1.0.0</p>
    </div>
  );
}

