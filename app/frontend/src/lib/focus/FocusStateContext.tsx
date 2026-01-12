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
import { DISABLE_MASS_LOCAL_PERSISTENCE } from "@/lib/storage/deprecation";

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
  /** Paused timer state from localStorage */
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

const POLL_INTERVAL = 30000; // 30 seconds
const PAUSED_STATE_KEY = "focus_paused_state";
const PAUSED_STATE_TTL = 60 * 60 * 1000; // 1 hour

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
  const session = syncState.focus && syncState.focus.has_active_session
    ? {
        id: "sync-focus", // Placeholder ID from sync data
        started_at: new Date().toISOString(), // Not provided by sync
        planned_duration: (syncState.focus.time_remaining_seconds || 0) + Math.floor(Date.now() / 1000),
        status: "active" as const,
        mode: (syncState.focus.mode as "focus" | "break" | "long_break") || "focus",
        expires_at: syncState.focus.expires_at,
      }
    : null;

  // Update time remaining when sync focus data changes
  useEffect(() => {
    if (syncState.focus?.has_active_session && syncState.focus.time_remaining_seconds) {
      setTimeRemaining(syncState.focus.time_remaining_seconds);
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

  // Paused state handling (from localStorage, deprecated)
  const [pausedState, setPausedState] = useState<PausedState | null>(null);
  
  const clearPausedState = useCallback(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(PAUSED_STATE_KEY);
    }
    setPausedState(null);
  }, []);

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

