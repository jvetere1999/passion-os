/**
 * Admin Console Button
 * Floating button visible only to admin users
 * Provides quick access to admin.ecent.online
 */

"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useState, useEffect } from "react";
import styles from "./AdminButton.module.css";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.ecent.online';

export function AdminButton() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user is admin via API
    async function checkAdmin() {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }

      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online';
        const response = await fetch(`${API_BASE}/api/auth/session`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const session = await response.json() as { user?: { is_admin?: boolean } };
          setIsAdmin(session.user?.is_admin === true);
        }
      } catch {
        setIsAdmin(false);
      }
    }

    checkAdmin();
  }, [user?.id]);

  // Delay visibility to avoid layout shift
  useEffect(() => {
    if (isAdmin) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isAdmin]);

  if (!isAdmin || !isVisible) {
    return null;
  }

  return (
    <a
      href={ADMIN_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.button}
      title="Open Admin Console"
      aria-label="Open Admin Console"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6m8.66-15.66l-3 3m-11.32 0l-3-3m14.66 14.66l-3-3m-11.32 0l-3 3" />
      </svg>
      <span className={styles.label}>Admin</span>
    </a>
  );
}
