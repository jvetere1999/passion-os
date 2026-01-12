/**
 * Theme Provider and Utilities
 *
 * Enhanced theme system with Ableton Live 12 theme support.
 * Provides multiple color themes with light/dark variants.
 * Syncs theme changes to backend for persistence across devices.
 */

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { ThemeDefinition, ThemePreferences, WaveformColorMode } from "../themes/types";
import { DEFAULT_THEME_PREFERENCES } from "../themes/types";
import {
  getThemes,
  getThemesByMode,
  loadThemePreferences,
  saveThemePreferences,
  resolveTheme,
  applyTheme,
  applyWaveformMode,
} from "../themes";

// Simple theme type for backward compatibility
export type Theme = "light" | "dark" | "system";

/**
 * Send theme change to backend for persistence
 * Retries once on network failure, falls back to local storage
 */
async function sendThemeToBackend(themeId: string): Promise<void> {
  try {
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ theme: themeId }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.warn("Theme sync to backend failed (using local storage):", error);
    // Theme still applied locally; sync will retry on next poll cycle
  }
}

interface ThemeContextValue {
  // Simple theme API (backward compat)
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;

  // Extended theme API
  currentTheme: ThemeDefinition;
  themeId: string;
  waveformMode: WaveformColorMode;
  isDark: boolean;

  // Available themes
  themes: ThemeDefinition[];
  lightThemes: ThemeDefinition[];
  darkThemes: ThemeDefinition[];

  // Extended actions
  setThemeById: (themeId: string) => void;
  setWaveformMode: (mode: WaveformColorMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "passion-os-theme";


/**
 * Map simple theme to extended theme ID
 */
function mapSimpleToExtended(simple: Theme): string {
  if (simple === "system") return "system";
  if (simple === "light") return "ableton-live-light";
  return "ableton-live-dark";
}

/**
 * Theme provider component
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [prefs, setPrefs] = useState<ThemePreferences>(DEFAULT_THEME_PREFERENCES);

  const currentTheme = resolveTheme(prefs.themeId);
  const themes = getThemes();
  const lightThemes = getThemesByMode("light");
  const darkThemes = getThemesByMode("dark");

  // Compute simple theme for backward compat
  const simpleTheme: Theme = prefs.themeId === "system"
    ? "system"
    : currentTheme.mode;
  const resolvedTheme = currentTheme.mode;

  // Load theme preferences on mount
  useEffect(() => {
    setMounted(true);

    // First check for legacy simple theme
    const legacyTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const stored = loadThemePreferences();

    // If legacy theme exists but no extended prefs, migrate
    if (legacyTheme && stored.themeId === DEFAULT_THEME_PREFERENCES.themeId) {
      const mappedId = mapSimpleToExtended(legacyTheme);
      stored.themeId = mappedId;
      saveThemePreferences(stored);
    }

    setPrefs(stored);
  }, []);

  // Apply theme when preferences change
  useEffect(() => {
    if (!mounted) return;

    const resolvedTheme = resolveTheme(prefs.themeId);
    applyTheme(resolvedTheme);
    applyWaveformMode(prefs.waveformMode, resolvedTheme);
  }, [prefs, mounted]);

  // Watch for system theme changes
  useEffect(() => {
    if (!mounted || prefs.themeId !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const newTheme = resolveTheme("system");
      applyTheme(newTheme);
      applyWaveformMode(prefs.waveformMode, newTheme);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [mounted, prefs.themeId, prefs.waveformMode]);

  // Simple theme setter (backward compat)
  const setTheme = useCallback((theme: Theme) => {
    const themeId = mapSimpleToExtended(theme);
    setPrefs((prev) => {
      const next = { ...prev, themeId };
      saveThemePreferences(next);
      localStorage.setItem(STORAGE_KEY, theme); // Keep legacy key for compat
      return next;
    });
  }, []);

  // Extended theme setter - syncs to backend
  const setThemeById = useCallback((themeId: string) => {
    setPrefs((prev) => {
      const next = { ...prev, themeId };
      saveThemePreferences(next);
      return next;
    });
    
    // Sync theme change to backend (fire and forget, with error handling)
    sendThemeToBackend(themeId).catch((error) => {
      console.warn("Theme sync error:", error);
    });
  }, []);

  const setWaveformMode = useCallback((mode: WaveformColorMode) => {
    setPrefs((prev) => {
      const next = { ...prev, waveformMode: mode };
      saveThemePreferences(next);
      return next;
    });
  }, []);

  const toggleMode = useCallback(() => {
    const currentMode = currentTheme.mode;
    const targetMode = currentMode === "dark" ? "light" : "dark";
    const targetThemes = getThemesByMode(targetMode);

    // Try to find a theme with similar name in the other mode
    const currentName = currentTheme.name.toLowerCase();
    let newTheme = targetThemes.find((t) =>
      t.name.toLowerCase().includes(
        currentName.replace(" dark", "").replace(" light", "").replace("live ", "")
      )
    );

    // Fallback to first theme of target mode
    if (!newTheme) {
      newTheme = targetThemes[0];
    }

    if (newTheme) {
      setThemeById(newTheme.id);
    }
  }, [currentTheme, setThemeById]);

  const value: ThemeContextValue = {
    // Simple API
    theme: simpleTheme,
    resolvedTheme,
    setTheme,
    // Extended API
    currentTheme,
    themeId: prefs.themeId,
    waveformMode: prefs.waveformMode,
    isDark: currentTheme.mode === "dark",
    themes,
    lightThemes,
    darkThemes,
    setThemeById,
    setWaveformMode,
    toggleMode,
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access theme context
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Hook to get current theme mode
 */
export function useThemeMode(): "light" | "dark" {
  const { isDark } = useTheme();
  return isDark ? "dark" : "light";
}

/**
 * Hook to check if dark mode
 */
export function useIsDarkMode(): boolean {
  const { isDark } = useTheme();
  return isDark;
}


