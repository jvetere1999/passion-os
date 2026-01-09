/**
 * App Shell Component
 * Main layout wrapper with header and navigation
 *
 * Includes FocusStateProvider for deduplicating focus session polling
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
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
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [omnibarOpen, setOmnibarOpen] = useState(false);
  const [showTOS, setShowTOS] = useState(false);
  const [tosChecked, setTosChecked] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  // Check TOS acceptance
  useEffect(() => {
    if (status !== "authenticated" || tosChecked) return;

    const checkTOS = async () => {
      try {
        const response = await fetch("/api/auth/accept-tos");
        if (response.ok) {
          const data = await response.json() as { needsAcceptance?: boolean; accepted?: boolean };
          if (data.needsAcceptance && !data.accepted) {
            setShowTOS(true);
          }
        }
      } catch (error) {
        console.error("Failed to check TOS status:", error);
      }
      setTosChecked(true);
    };

    checkTOS();
  }, [status, tosChecked]);

  const handleTOSAccept = useCallback(() => {
    setShowTOS(false);
    // Refresh session to get updated TOS status
    update();
  }, [update]);

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
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} userEmail={session?.user?.email || undefined} />
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

