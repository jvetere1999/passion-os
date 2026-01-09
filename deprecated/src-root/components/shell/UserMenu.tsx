/**
 * User Menu Component
 * Dropdown menu for authenticated users
 */

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTheme, type Theme } from "@/lib/theme";
import { isAdminEmail } from "@/lib/admin";
import styles from "./UserMenu.module.css";

interface UserMenuProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user.email?.[0]?.toUpperCase() || "?";

  return (
    <div className={styles.container} ref={menuRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className={styles.avatar}
            width={32}
            height={32}
          />
        ) : (
          <span className={styles.avatarFallback}>{initials}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.menu} role="menu">
          <div className={styles.header}>
            <span className={styles.name}>{user.name || "User"}</span>
            <span className={styles.email}>{user.email}</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Theme</span>
            <div className={styles.themeButtons}>
              <button
                className={`${styles.themeButton} ${theme === "light" ? styles.active : ""}`}
                onClick={() => handleThemeChange("light")}
                aria-pressed={theme === "light"}
              >
                <LightIcon />
                <span>Light</span>
              </button>
              <button
                className={`${styles.themeButton} ${theme === "dark" ? styles.active : ""}`}
                onClick={() => handleThemeChange("dark")}
                aria-pressed={theme === "dark"}
              >
                <DarkIcon />
                <span>Dark</span>
              </button>
              <button
                className={`${styles.themeButton} ${theme === "system" ? styles.active : ""}`}
                onClick={() => handleThemeChange("system")}
                aria-pressed={theme === "system"}
              >
                <SystemIcon />
                <span>System</span>
              </button>
            </div>
          </div>

          <div className={styles.divider} />

          {isAdminEmail(user.email) && (
            <Link
              href="/admin"
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: "8px" }}
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Admin
            </Link>
          )}

          <Link
            href="/settings"
            className={styles.menuItem}
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            Settings
          </Link>

          <button
            className={styles.menuItem}
            onClick={handleSignOut}
            role="menuitem"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function LightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function DarkIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

