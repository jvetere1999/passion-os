"use client";

/**
 * BottomBar Component
 * Focus timer bar that appears at the bottom
 * Audio is handled by TrueMiniPlayer separately
 *
 * STORAGE RULE: Focus pause state is fetched from D1 via /api/focus/pause API.
 * localStorage is DEPRECATED for focus_paused_state (behavior-affecting data).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { DISABLE_MASS_LOCAL_PERSISTENCE } from "@/lib/storage/deprecation";
import styles from "./BottomBar.module.css";

interface FocusSession {
  id: string;
  started_at: string;
  planned_duration: number;
  status: "active" | "completed" | "abandoned";
  mode: "focus" | "break" | "long_break";
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

export function BottomBar() {
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);
  const [pausedState, setPausedState] = useState<PausedState | null>(null);
  const [focusTimeRemaining, setFocusTimeRemaining] = useState(0);
  const [focusLoading, setFocusLoading] = useState(true);
  const [showFocusPopup, setShowFocusPopup] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for paused state - D1 is source of truth
  const checkPausedState = useCallback(async () => {
    // Always check D1 first (source of truth)
    try {
      const response = await fetch("/api/focus/pause");
      if (response.ok) {
        const data = await response.json() as { pauseState: PausedState | null };
        if (data.pauseState) {
          setPausedState(data.pauseState);
          setFocusTimeRemaining(data.pauseState.timeRemaining);
          return true;
        }
      }
    } catch {
      // Ignore D1 fetch errors
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
            setFocusTimeRemaining(parsed.timeRemaining);
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

  // Fetch active focus session
  const fetchFocusSession = useCallback(async () => {
    try {
      const response = await fetch("/api/focus/active");
      if (response.ok) {
        const data = await response.json() as { session?: FocusSession | null };
        if (data.session && data.session.status === "active") {
          setFocusSession(data.session);
          setPausedState(null);
          const startTime = new Date(data.session.started_at).getTime();
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = Math.max(0, data.session.planned_duration - elapsed);
          setFocusTimeRemaining(remaining);
        } else {
          setFocusSession(null);
          await checkPausedState();
        }
      }
    } catch {
      // Ignore errors
    } finally {
      setFocusLoading(false);
    }
  }, [checkPausedState]);

  // Initialize
  useEffect(() => {
    checkPausedState();
    fetchFocusSession();
    const pollInterval = setInterval(fetchFocusSession, 30000);
    return () => clearInterval(pollInterval);
  }, [fetchFocusSession, checkPausedState]);

  // Timer countdown
  useEffect(() => {
    if (!focusSession || focusSession.status !== "active") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setFocusTimeRemaining((prev) => {
        if (prev <= 1) {
          fetchFocusSession();
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
  }, [focusSession, fetchFocusSession]);

  const handleDismissFocus = useCallback(async () => {
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
    } catch { /* ignore */ }
  }, []);

  // Computed state
  const isFocusActive = focusSession !== null && focusSession.status === "active";
  const isFocusPaused = !focusSession && pausedState !== null;
  const showFocus = !focusLoading && (isFocusActive || isFocusPaused);

  if (!showFocus) return null;

  const currentMode = focusSession?.mode || pausedState?.mode || "focus";
  const focusTotalDuration = focusSession?.planned_duration || (pausedState?.timeRemaining ? pausedState.timeRemaining * 2 : 25 * 60);
  const focusProgress = focusTotalDuration > 0 ? 1 - (focusTimeRemaining / focusTotalDuration) : 0;

  // Circular progress SVG parameters
  const circleRadius = 18;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - focusProgress);

  return (
    <>
      <div className={styles.bottomBar}>
        <div className={styles.content}>
          <div className={styles.focusSection}>
            <button
              className={styles.focusDialButton}
              onClick={() => setShowFocusPopup(true)}
              aria-label="Open focus timer"
            >
              <div className={styles.circularTimer}>
                <svg className={styles.circularSvg} viewBox="0 0 44 44">
                  <circle
                    cx="22"
                    cy="22"
                    r={circleRadius}
                    fill="none"
                    stroke="var(--color-border-primary)"
                    strokeWidth={strokeWidth}
                  />
                  <circle
                    cx="22"
                    cy="22"
                    r={circleRadius}
                    fill="none"
                    stroke="var(--color-accent-primary)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 22 22)"
                    className={styles.progressCircle}
                  />
                </svg>
                <span className={styles.focusModeIcon}>
                  {currentMode === "focus" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                      <line x1="12" y1="2" x2="12" y2="12" />
                    </svg>
                  )}
                </span>
              </div>
            </button>
            <div className={styles.focusInfo}>
              <span className={styles.focusMode}>{MODE_LABELS[currentMode]}</span>
              {isFocusPaused && <span className={styles.pausedBadge}>Paused</span>}
            </div>
            {isFocusPaused && (
              <button
                className={styles.dismissBtn}
                onClick={handleDismissFocus}
                aria-label="Dismiss paused session"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Focus Popup */}
      {showFocusPopup && (
        <div className={styles.focusPopupOverlay} onClick={() => setShowFocusPopup(false)}>
          <div className={styles.focusPopup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.focusPopupHeader}>
              <h3>{MODE_LABELS[currentMode]}</h3>
              <button onClick={() => setShowFocusPopup(false)} className={styles.closeBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.focusPopupContent}>
              <div className={styles.bigCircularTimer}>
                <svg viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--color-border-primary)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--color-accent-primary)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={(2 * Math.PI * 42) * (1 - focusProgress)}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className={styles.bigTimerText}>
                  {Math.floor(focusTimeRemaining / 60)}:{(focusTimeRemaining % 60).toString().padStart(2, "0")}
                </div>
              </div>
              {isFocusPaused && (
                <p className={styles.pausedText}>Session paused</p>
              )}
              <Link href="/focus" className={styles.openFocusLink} onClick={() => setShowFocusPopup(false)}>
                Open Focus Page
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
