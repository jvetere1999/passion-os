/**
 * App Shell Component
 * Main layout wrapper with header and navigation
 *
 * Includes FocusStateProvider for deduplicating focus session polling
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { UnifiedBottomBar } from "./UnifiedBottomBar";
import { MobileNav } from "./MobileNav";
import { Omnibar } from "./Omnibar";
import { TOSModal } from "./TOSModal";
import { FocusStateProvider } from "@/lib/focus";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, isAuthenticated, refresh } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [omnibarOpen, setOmnibarOpen] = useState(false);
  const [showTOS, setShowTOS] = useState(false);
  const [tosChecked, setTosChecked] = useState(false);

  // Note: Authentication is enforced by middleware.
  // Client-side redirect is disabled to prevent race conditions.
  // The middleware already redirects unauthenticated users before this component renders.

  // Check TOS acceptance
  useEffect(() => {
    if (!isAuthenticated || tosChecked) return;

    // User from backend includes tosAccepted field
    if (user && !user.tosAccepted) {
      setShowTOS(true);
    }
    setTosChecked(true);
  }, [isAuthenticated, tosChecked, user]);

  const handleTOSAccept = useCallback(() => {
    setShowTOS(false);
    // Refresh session to get updated TOS status
    refresh();
  }, [refresh]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for omnibar
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOmnibarOpen((prev) => !prev);
        return;
      }

      // Cmd/Ctrl + I also opens omnibar (for inbox)
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        setOmnibarOpen((prev) => !prev);
        return;
      }

      // Escape to close omnibar
      if (e.key === "Escape") {
        if (omnibarOpen) {
          setOmnibarOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [omnibarOpen]);

  return (
    <FocusStateProvider>
      <div className={styles.shell}>
        <Header
          onMenuClick={toggleSidebar}
          onCommandPaletteClick={() => setOmnibarOpen(true)}
          onInboxClick={() => setOmnibarOpen(true)}
        />
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} userEmail={user?.email || undefined} />
        <main className={styles.main}>
          <div className={styles.content}>{children}</div>
        </main>
        <UnifiedBottomBar />
        <MobileNav onMoreClick={toggleSidebar} />
        <Omnibar
          isOpen={omnibarOpen}
          onClose={() => setOmnibarOpen(false)}
        />
        {showTOS && <TOSModal onAccept={handleTOSAccept} />}
      </div>
    </FocusStateProvider>
  );
}
