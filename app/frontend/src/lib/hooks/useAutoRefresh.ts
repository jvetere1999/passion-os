/**
 * useAutoRefresh Hook
 *
 * Provides visibility-aware and focus-based auto-refresh for data fetching.
 * Respects SYNC.md contracts for staleness windows.
 *
 * Features:
 * - Soft refresh on mount/reload when data is stale
 * - Refetch when tab regains focus (after configurable staleness)
 * - Refetch when document becomes visible
 * - Optional interval-based polling (pauses when hidden)
 * - Properly pauses on page unload
 * - Subtle update indicator support
 *
 * SYNC CONTRACT compliance:
 * - Respects per-feature staleness windows
 * - Pauses interval when tab hidden (where safe)
 * - Pauses all activity on page unload
 * - Does not auto-refresh on pages with unsaved forms
 */

"use client";

import { useEffect, useRef, useCallback } from "react";

// Session storage key for persisting last fetch time across soft navigations
const LAST_FETCH_KEY_PREFIX = "passion_refresh_";

export interface UseAutoRefreshOptions {
  /**
   * Function to call when refresh is triggered
   */
  onRefresh: () => void | Promise<void>;

  /**
   * Unique key for this refresh context (used for persistence)
   * If not provided, staleness is not persisted across page loads
   */
  refreshKey?: string;

  /**
   * Staleness window in milliseconds. Refetch only if data is older than this.
   * Default: 60000 (1 minute)
   */
  stalenessMs?: number;

  /**
   * Enable soft refresh on mount if data is stale
   * Default: true
   */
  refreshOnMount?: boolean;

  /**
   * Enable refetch on window focus
   * Default: true
   */
  refetchOnFocus?: boolean;

  /**
   * Enable refetch on visibility change (hidden -> visible)
   * Default: true
   */
  refetchOnVisible?: boolean;

  /**
   * Optional polling interval in milliseconds
   * Set to 0 to disable polling
   * Default: 0 (disabled)
   */
  pollingIntervalMs?: number;

  /**
   * Pause polling when tab is hidden
   * Default: true
   */
  pausePollingWhenHidden?: boolean;

  /**
   * Whether the hook is enabled
   * Set to false to disable all auto-refresh (e.g., when form is dirty)
   * Default: true
   */
  enabled?: boolean;
}

/**
 * Hook for automatic data refresh with visibility awareness
 */
export function useAutoRefresh(options: UseAutoRefreshOptions): void {
  const {
    onRefresh,
    refreshKey,
    stalenessMs = 60000, // 1 minute default
    refreshOnMount = true,
    refetchOnFocus = true,
    refetchOnVisible = true,
    pollingIntervalMs = 0,
    pausePollingWhenHidden = true,
    enabled = true,
  } = options;

  const lastFetchTimeRef = useRef<number>(Date.now());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(onRefresh);
  const isUnloadingRef = useRef(false);
  const hasMountedRef = useRef(false);

  // Keep onRefresh ref updated to avoid stale closures
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // Get persisted last fetch time from sessionStorage
  const getPersistedTime = useCallback((): number | null => {
    if (!refreshKey) return null;
    try {
      const stored = sessionStorage.getItem(LAST_FETCH_KEY_PREFIX + refreshKey);
      return stored ? parseInt(stored, 10) : null;
    } catch {
      return null;
    }
  }, [refreshKey]);

  // Persist last fetch time to sessionStorage
  const persistTime = useCallback((time: number) => {
    if (!refreshKey) return;
    try {
      sessionStorage.setItem(LAST_FETCH_KEY_PREFIX + refreshKey, String(time));
    } catch {
      // Ignore storage errors
    }
  }, [refreshKey]);

  // Check if data is stale
  const isStale = useCallback(() => {
    const lastTime = getPersistedTime() ?? lastFetchTimeRef.current;
    return Date.now() - lastTime > stalenessMs;
  }, [stalenessMs, getPersistedTime]);

  // Trigger refresh and update last fetch time
  const triggerRefresh = useCallback(async () => {
    if (isUnloadingRef.current) return; // Don't refresh if unloading
    const now = Date.now();
    lastFetchTimeRef.current = now;
    persistTime(now);
    await onRefreshRef.current();
  }, [persistTime]);

  // Handle page unload - pause all activity
  useEffect(() => {
    const handleUnload = () => {
      isUnloadingRef.current = true;
      // Stop any polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };

    // pagehide is more reliable than beforeunload for bfcache
    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);

    // Reset unloading flag when page is restored from bfcache
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        isUnloadingRef.current = false;
        // Soft refresh on bfcache restore if stale
        if (enabled && refreshOnMount && isStale()) {
          triggerRefresh();
        }
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [enabled, refreshOnMount, isStale, triggerRefresh]);

  // Soft refresh on mount if data is stale
  useEffect(() => {
    if (!enabled || !refreshOnMount || hasMountedRef.current) return;
    hasMountedRef.current = true;

    // Check if we have persisted time indicating a reload/navigation
    const persistedTime = getPersistedTime();
    if (persistedTime && isStale()) {
      // Data is stale from previous session, trigger soft refresh
      triggerRefresh();
    }
  }, [enabled, refreshOnMount, getPersistedTime, isStale, triggerRefresh]);

  // Handle visibility change
  useEffect(() => {
    if (!enabled || !refetchOnVisible) return;

    const handleVisibilityChange = () => {
      if (isUnloadingRef.current) return;
      if (document.visibilityState === "visible" && isStale()) {
        triggerRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, refetchOnVisible, isStale, triggerRefresh]);

  // Handle window focus
  useEffect(() => {
    if (!enabled || !refetchOnFocus) return;

    const handleFocus = () => {
      if (isUnloadingRef.current) return;
      if (isStale()) {
        triggerRefresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, refetchOnFocus, isStale, triggerRefresh]);

  // Handle polling
  useEffect(() => {
    if (!enabled || pollingIntervalMs <= 0) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const startPolling = () => {
      if (pollingIntervalRef.current) return;

      pollingIntervalRef.current = setInterval(() => {
        // Skip if unloading or hidden
        if (isUnloadingRef.current) return;
        if (pausePollingWhenHidden && document.visibilityState === "hidden") {
          return;
        }
        triggerRefresh();
      }, pollingIntervalMs);
    };

    const stopPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };

    // Start polling
    startPolling();

    // Handle visibility for pause/resume
    const handleVisibility = () => {
      if (isUnloadingRef.current) return;
      if (document.visibilityState === "visible") {
        // Resume polling and trigger immediate refresh if stale
        startPolling();
        if (isStale()) {
          triggerRefresh();
        }
      } else if (pausePollingWhenHidden) {
        stopPolling();
      }
    };

    if (pausePollingWhenHidden) {
      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      stopPolling();
      if (pausePollingWhenHidden) {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, [enabled, pollingIntervalMs, pausePollingWhenHidden, isStale, triggerRefresh]);

  // Update last fetch time on mount (initial fetch happened)
  useEffect(() => {
    const now = Date.now();
    lastFetchTimeRef.current = now;
    persistTime(now);
  }, [persistTime]);
}

/**
 * Helper to mark a refresh as having occurred
 * Call this after your fetch completes successfully
 */
export function useRefreshMarker(): {
  markRefreshed: () => void;
  lastRefreshTime: () => number;
} {
  const lastFetchTimeRef = useRef<number>(Date.now());

  return {
    markRefreshed: () => {
      lastFetchTimeRef.current = Date.now();
    },
    lastRefreshTime: () => lastFetchTimeRef.current,
  };
}

