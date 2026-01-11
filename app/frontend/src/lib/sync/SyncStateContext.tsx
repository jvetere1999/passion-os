/**
 * Sync State Context
 *
 * Centralized polling for UI optimization data.
 * Polls every 30 seconds to keep badges, HUD, and status indicators fresh.
 *
 * DESIGN PRINCIPLES:
 * 1. Memory-only caching - NO localStorage for this data
 * 2. Single poll endpoint - one request for all data
 * 3. Visibility-aware - pauses when tab is hidden
 * 4. Error-resilient - continues polling even after errors
 *
 * STORAGE RULE:
 * This data is purely for UI optimization. It must NOT be persisted
 * to localStorage. If the browser reloads, we fetch fresh.
 */

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  pollAll,
  type PollResponse,
  type ProgressData,
  type BadgeData,
  type FocusStatusData,
  type PlanStatusData,
  type UserData,
} from "@/lib/api/sync";

// ============================================
// Types
// ============================================

interface SyncStateContextValue {
  /** User's gamification progress */
  progress: ProgressData | null;
  /** Badge counts for UI indicators */
  badges: BadgeData | null;
  /** Active focus session status */
  focus: FocusStatusData | null;
  /** Daily plan completion status */
  plan: PlanStatusData | null;
  /** User profile and settings */
  user: UserData | null;
  /** Whether initial load is complete */
  isLoading: boolean;
  /** Last error (cleared on success) */
  error: Error | null;
  /** Last sync timestamp */
  lastSyncAt: Date | null;
  /** Force immediate refresh */
  refresh: () => Promise<void>;
}

const SyncStateContext = createContext<SyncStateContextValue | null>(null);

// ============================================
// Configuration
// ============================================

const POLL_INTERVAL_MS = 30000; // 30 seconds
const RETRY_DELAY_MS = 5000; // 5 seconds after error

// ============================================
// Provider Component
// ============================================

interface SyncStateProviderProps {
  children: ReactNode;
  /** Disable polling (for tests or when not authenticated) */
  disabled?: boolean;
}

export function SyncStateProvider({ children, disabled = false }: SyncStateProviderProps) {
  // State - memory only, no persistence
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [badges, setBadges] = useState<BadgeData | null>(null);
  const [focus, setFocus] = useState<FocusStatusData | null>(null);
  const [plan, setPlan] = useState<PlanStatusData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  // Refs for polling control
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastEtagRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch poll data from server
   */
  const fetchPollData = useCallback(async () => {
    if (disabled) return;

    try {
      const data = await pollAll();

      // Only update if component is still mounted
      if (!isMountedRef.current) return;

      // Check if data actually changed (via ETag)
      if (data.etag === lastEtagRef.current) {
        // No changes, just update sync time
        setLastSyncAt(new Date());
        return;
      }

      // Update all state
      setProgress(data.progress);
      setBadges(data.badges);
      setFocus(data.focus);
      setPlan(data.plan);
      setUser(data.user);
      setLastSyncAt(new Date());
      setError(null);
      lastEtagRef.current = data.etag;

    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error("[SyncState] Poll error:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      // Don't clear existing data on error - stale is better than nothing
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [disabled]);

  /**
   * Force immediate refresh
   */
  const refresh = useCallback(async () => {
    // Clear ETag to force data update
    lastEtagRef.current = null;
    await fetchPollData();
  }, [fetchPollData]);

  /**
   * Start polling loop
   */
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current || disabled) return;

    // Initial fetch
    fetchPollData();

    // Setup interval
    pollIntervalRef.current = setInterval(() => {
      fetchPollData();
    }, POLL_INTERVAL_MS);
  }, [fetchPollData, disabled]);

  /**
   * Stop polling loop
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  /**
   * Handle visibility change - pause polling when hidden
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Resume polling and fetch immediately
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startPolling, stopPolling]);

  /**
   * Main effect - start/stop polling based on disabled state
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (!disabled) {
      startPolling();
    }

    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [disabled, startPolling, stopPolling]);

  // Context value
  const value: SyncStateContextValue = {
    progress,
    badges,
    focus,
    plan,
    user,
    isLoading,
    error,
    lastSyncAt,
    refresh,
  };

  return (
    <SyncStateContext.Provider value={value}>
      {children}
    </SyncStateContext.Provider>
  );
}

// ============================================
// Hooks
// ============================================

/**
 * Access the full sync state
 */
export function useSyncState(): SyncStateContextValue {
  const ctx = useContext(SyncStateContext);
  if (!ctx) {
    throw new Error("useSyncState must be used within SyncStateProvider");
  }
  return ctx;
}

/**
 * Access only progress data
 */
export function useProgress(): ProgressData | null {
  const ctx = useContext(SyncStateContext);
  return ctx?.progress ?? null;
}

/**
 * Access only badge counts
 */
export function useBadges(): BadgeData | null {
  const ctx = useContext(SyncStateContext);
  return ctx?.badges ?? null;
}

/**
 * Access only focus status
 */
export function useFocusStatus(): FocusStatusData | null {
  const ctx = useContext(SyncStateContext);
  return ctx?.focus ?? null;
}

/**
 * Access only plan status
 */
export function usePlanStatus(): PlanStatusData | null {
  const ctx = useContext(SyncStateContext);
  return ctx?.plan ?? null;
}

/**
 * Get specific badge count
 */
export function useBadgeCount(key: keyof BadgeData): number {
  const ctx = useContext(SyncStateContext);
  return ctx?.badges?.[key] ?? 0;
}
