/**
 * Focus State Context (REFACTORED 2026-01-11)
 *
 * Now uses SyncStateContext to get focus data instead of separate polling.
 * This provides:
 * - Single source of truth for focus session status
 * - Eliminates duplicate /api/focus API calls
 * - Aligns with centralized sync polling (30s interval)
 *
 * Data flow: SyncStateContext (polling /api/sync) → FocusStateContext → Components
 */

"use client";

import { createContext, useContext, useEffect, useCallback, useRef, useState, type ReactNode } from "react";
import { useSyncState } from "@/lib/sync/SyncStateContext";

// Types
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

interface FocusStateContextValue {
  /** Current active focus session from server */
  session: FocusSession | null;
  /** Paused timer state from backend */
  pausedState: PausedState | null;
  /** Time remaining in seconds */
  timeRemaining: number;
  /** Whether initial load is complete */
  isLoading: boolean;
  /** Force refresh from server */
  refresh: () => Promise<void>;
  /** Clear paused state */
  clearPausedState: () => void;
}

const FocusStateContext = createContext<FocusStateContextValue | null>(null);

/**
 * FocusStateProvider
 *
 * Wrap your app with this to enable shared focus state.
 * Should be placed in a client layout component.
 */
export function FocusStateProvider({ children }: { children: ReactNode }) {
  // Use sync state instead of separate polling
  const syncState = useSyncState();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Convert sync focus data to our session format
  const session = syncState.focus && syncState.focus.active_session
    ? {
        id: syncState.focus.active_session.id,
        started_at: syncState.focus.active_session.started_at,
        planned_duration: syncState.focus.active_session.duration_seconds,
        status: "active" as const,
        mode: syncState.focus.active_session.mode,
        expires_at: syncState.focus.active_session.expires_at,
      }
    : null;

  // Update time remaining when sync focus data changes
  useEffect(() => {
    if (syncState.focus?.active_session) {
      const activeSession = syncState.focus.active_session;
      const startTime = new Date(activeSession.started_at).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, activeSession.duration_seconds - elapsed);
      setTimeRemaining(remaining);
    } else if (syncState.focus?.pause_state?.time_remaining_seconds != null) {
      setTimeRemaining(syncState.focus.pause_state.time_remaining_seconds);
    } else {
      setTimeRemaining(0);
    }
  }, [syncState.focus]);

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
  }, [session]);

  // Paused state handling (from sync state)
  const pausedState = syncState.focus?.pause_state?.mode
    ? {
        mode: syncState.focus.pause_state.mode as PausedState["mode"],
        timeRemaining: syncState.focus.pause_state.time_remaining_seconds ?? 0,
        pausedAt: syncState.focus.pause_state.paused_at ?? new Date().toISOString(),
      }
    : null;

  const clearPausedState = useCallback(() => {
    syncState.refresh();
  }, [syncState]);

  const value: FocusStateContextValue = {
    session,
    pausedState,
    timeRemaining,
    isLoading: syncState.isLoading,
    refresh: syncState.refresh,
    clearPausedState,
  };

  return (
    <FocusStateContext.Provider value={value}>
      {children}
    </FocusStateContext.Provider>
  );
}

/**
 * Hook to access focus state
 */
export function useFocusState(): FocusStateContextValue {
  const ctx = useContext(FocusStateContext);
  if (!ctx) {
    throw new Error("useFocusState must be used within FocusStateProvider");
  }
  return ctx;
}

/**
 * Hook for components that only need to know if focus is active
 * (lighter-weight alternative)
 */
export function useFocusActive(): {
  isActive: boolean;
  isPaused: boolean;
  mode: "focus" | "break" | "long_break" | null;
} {
  const ctx = useContext(FocusStateContext);

  if (!ctx) {
    return { isActive: false, isPaused: false, mode: null };
  }

  return {
    isActive: ctx.session !== null && ctx.session.status === "active",
    isPaused: ctx.pausedState !== null,
    mode: ctx.session?.mode || ctx.pausedState?.mode || null,
  };
}
