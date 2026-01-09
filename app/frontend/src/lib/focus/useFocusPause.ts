/**
 * useFocusPause Hook
 * Centralized focus pause state management using D1 API
 * Replaces localStorage-based pause state
 */

import { useState, useCallback, useEffect, useRef } from "react";

interface PauseState {
  mode: string;
  timeRemaining: number;
  pausedAt: string;
}

interface UseFocusPauseResult {
  pauseState: PauseState | null;
  isPaused: boolean;
  isLoading: boolean;
  savePause: (mode: string, timeRemaining: number) => Promise<void>;
  clearPause: () => Promise<void>;
  refreshPause: () => Promise<void>;
}

export function useFocusPause(): UseFocusPauseResult {
  const [pauseState, setPauseState] = useState<PauseState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  // Fetch pause state from API
  const refreshPause = useCallback(async () => {
    try {
      const response = await fetch("/api/focus/pause");
      if (response.ok) {
        const data = await response.json() as { pauseState: PauseState | null };
        setPauseState(data.pauseState);
      }
    } catch (error) {
      console.error("Failed to fetch pause state:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save pause state to API
  const savePause = useCallback(async (mode: string, timeRemaining: number) => {
    try {
      const response = await fetch("/api/focus/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          mode,
          timeRemaining,
        }),
      });

      if (response.ok) {
        setPauseState({
          mode,
          timeRemaining,
          pausedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to save pause state:", error);
    }
  }, []);

  // Clear pause state via API
  const clearPause = useCallback(async () => {
    try {
      const response = await fetch("/api/focus/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });

      if (response.ok) {
        setPauseState(null);
      }
    } catch (error) {
      console.error("Failed to clear pause state:", error);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      refreshPause();
    }
  }, [refreshPause]);

  return {
    pauseState,
    isPaused: pauseState !== null,
    isLoading,
    savePause,
    clearPause,
    refreshPause,
  };
}

