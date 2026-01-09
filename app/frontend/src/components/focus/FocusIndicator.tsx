"use client";

/**
 * Focus Indicator Component
 * Shows a persistent bottom indicator when a focus session is active
 * Displays timer, mode, and quick actions
 *
 * STORAGE RULE: Focus pause state is fetched from D1 via /api/focus/pause API.
 * localStorage is DEPRECATED for focus_paused_state (behavior-affecting data).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePlayerVisible } from "@/lib/player";
import { DISABLE_MASS_LOCAL_PERSISTENCE } from "@/lib/storage/deprecation";
import styles from "./FocusIndicator.module.css";

interface FocusSession {
  id: string;
  started_at: string;
  planned_duration: number;
  status: "active" | "completed" | "abandoned";
  mode: "focus" | "break" | "long_break";
  expires_at: string | null;
}

interface PausedState {
  mode: "focus" | "break" | "long_break";
  timeRemaining: number;
  pausedAt: string;
}

const MODE_LABELS: Record<string, string> = {
  focus: "Focus",
  break: "Break",
  long_break: "Long Break",
};

const MODE_COLORS: Record<string, string> = {
  focus: "var(--accent-primary, #ff764d)",
  break: "var(--accent-success, #4caf50)",
  long_break: "var(--accent-info, #2196f3)",
};

function formatTime(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function FocusIndicator() {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [pausedState, setPausedState] = useState<PausedState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayerVisible = usePlayerVisible();

  // Determine if we should show the indicator
  const isActive = session !== null && session.status === "active";
  const isPaused = !session && pausedState !== null;
  const shouldShow = !isLoading && (isActive || isPaused);

  // Add padding to body when focus indicator is visible but player is not
  // (when player is visible, it handles the padding)
  useEffect(() => {
    if (shouldShow && !isPlayerVisible && !isMinimized) {
      // Focus indicator is ~48px tall
      document.body.style.paddingBottom = "48px";
    } else if (shouldShow && !isPlayerVisible && isMinimized) {
      // Minimized focus indicator is smaller
      document.body.style.paddingBottom = "40px";
    }
    // Don't set padding when player is visible - it handles that
    return () => {
      // Only clear if we set it (player not visible)
      if (!isPlayerVisible) {
        document.body.style.paddingBottom = "";
      }
    };
  }, [shouldShow, isPlayerVisible, isMinimized]);

  // Check for paused state - D1 is source of truth
  const checkPausedState = useCallback(async () => {
    // Always check D1 first (source of truth)
    try {
      const response = await fetch("/api/focus/pause");
      if (response.ok) {
        const data = await response.json() as { pauseState: PausedState | null };
        if (data.pauseState) {
          setPausedState(data.pauseState);
          setTimeRemaining(data.pauseState.timeRemaining);
          return true;
        }
      }
    } catch (e) {
      console.error("Failed to fetch pause state from D1:", e);
    }

    // Only fall back to localStorage if deprecation is disabled
    if (!DISABLE_MASS_LOCAL_PERSISTENCE) {
      try {
        const stored = localStorage.getItem("focus_paused_state");
        if (stored) {
          const parsed = JSON.parse(stored) as PausedState;
          const pausedTime = new Date(parsed.pausedAt).getTime();
          const hourAgo = Date.now() - 60 * 60 * 1000;
          if (pausedTime > hourAgo) {
            setPausedState(parsed);
            setTimeRemaining(parsed.timeRemaining);
            return true;
          } else {
            localStorage.removeItem("focus_paused_state");
          }
        }
      } catch {
        localStorage.removeItem("focus_paused_state");
      }
    }

    setPausedState(null);
    return false;
  }, []);

  // Fetch active session
  const fetchActiveSession = useCallback(async () => {
    try {
      const response = await fetch("/api/focus/active");
      if (response.ok) {
        const data = await response.json() as { session?: FocusSession | null };
        if (data.session && data.session.status === "active") {
          setSession(data.session);
          setPausedState(null); // Clear paused state if there's an active session

          // Calculate remaining time
          const startTime = new Date(data.session.started_at).getTime();
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = Math.max(0, data.session.planned_duration - elapsed);
          setTimeRemaining(remaining);
        } else {
          setSession(null);
          // Check for paused state if no active session
          await checkPausedState();
        }
      }
    } catch (error) {
      console.error("Failed to fetch active focus session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [checkPausedState]);

  // Initial fetch
  useEffect(() => {
    // First check for paused state (for immediate display)
    checkPausedState();
    fetchActiveSession();

    // Poll for session changes every 30 seconds
    const pollInterval = setInterval(fetchActiveSession, 30000);

    // Listen for storage changes only if deprecation is disabled
    const handleStorageChange = (e: StorageEvent) => {
      if (!DISABLE_MASS_LOCAL_PERSISTENCE && e.key === "focus_paused_state") {
        checkPausedState();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchActiveSession, checkPausedState]);

  // Timer countdown
  useEffect(() => {
    if (!session || session.status !== "active") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timer complete - refetch to get updated status
          fetchActiveSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [session, fetchActiveSession]);

  // Handle abandon (only for active sessions)
  const handleAbandon = useCallback(async () => {
    if (session) {
      try {
        const response = await fetch(`/api/focus/${session.id}/abandon`, {
          method: "POST",
        });
        if (response.ok) {
          setSession(null);
        }
      } catch (error) {
        console.error("Failed to abandon focus session:", error);
      }
    }
  }, [session]);

  // Handle dismiss paused state
  const handleDismissPaused = useCallback(async () => {
    // Always clean up localStorage (even if deprecated, for cleanup)
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("focus_paused_state");
    }
    setPausedState(null);

    // Clear from D1 (source of truth)
    try {
      await fetch("/api/focus/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
    } catch (e) {
      console.error("Failed to clear pause state from D1:", e);
    }
  }, []);

  // Toggle minimize
  const handleToggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  // Determine current mode
  const currentMode = session?.mode || pausedState?.mode || "focus";

  // Don't render if no active session and no paused state, or still loading
  if (isLoading || (!session && !pausedState)) {
    return null;
  }

  // Calculate progress
  let totalDuration = 0;
  if (session) {
    totalDuration = session.planned_duration;
  } else if (pausedState) {
    // For paused state, we need to get the original duration from settings
    const focusSettings = localStorage.getItem("focus_settings");
    if (focusSettings) {
      try {
        const settings = JSON.parse(focusSettings);
        const durations: Record<string, number> = {
          focus: settings.focusDuration * 60,
          break: settings.breakDuration * 60,
          long_break: settings.longBreakDuration * 60,
        };
        totalDuration = durations[pausedState.mode] || 25 * 60;
      } catch {
        totalDuration = 25 * 60;
      }
    } else {
      totalDuration = 25 * 60;
    }
  }

  const progress = totalDuration > 0
    ? Math.max(0, Math.min(1, 1 - timeRemaining / totalDuration))
    : 0;

  // Calculate bottom offset based on player visibility
  const bottomOffset = isPlayerVisible ? 90 : 0;

  // Minimized view
  if (isMinimized) {
    return (
      <div
        className={`${styles.indicator} ${styles.minimized}`}
        style={{
          "--mode-color": MODE_COLORS[currentMode],
          bottom: `${bottomOffset}px`,
        } as React.CSSProperties}
        onClick={handleToggleMinimize}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleToggleMinimize()}
      >
        <div className={styles.minimizedContent}>
          <span className={styles.modeLabel}>{MODE_LABELS[currentMode]}</span>
          <span className={styles.timer}>{formatTime(timeRemaining)}</span>
          {isPaused && <span className={styles.pausedBadge}>Paused</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.indicator}
      style={{
        "--mode-color": MODE_COLORS[currentMode],
        bottom: `${bottomOffset}px`,
      } as React.CSSProperties}
    >
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.left}>
          <span className={styles.modeLabel}>{MODE_LABELS[currentMode]}</span>
          <span className={styles.timer}>{formatTime(timeRemaining)}</span>
          {isPaused && <span className={styles.pausedBadge}>Paused</span>}
        </div>

        <div className={styles.right}>
          <Link href="/focus" className={styles.viewButton}>
            {isPaused ? "Resume" : "View"}
          </Link>
          <button
            className={styles.minimizeButton}
            onClick={handleToggleMinimize}
            title="Minimize"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" />
            </svg>
          </button>
          {isActive && (
            <button
              className={styles.abandonButton}
              onClick={handleAbandon}
              title="Abandon session"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          {isPaused && (
            <button
              className={styles.abandonButton}
              onClick={handleDismissPaused}
              title="Dismiss"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

