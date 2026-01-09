"use client";

/**
 * Theme Registry and Loader
 *
 * Loads theme definitions from the manifest and provides
 * utilities for applying themes to the document.
 */

import type {
  ThemeDefinition,
  ThemePreferences,
  WaveformColorMode,
} from "./types";
import { DEFAULT_THEME_PREFERENCES } from "./types";
import { themeManifest } from "./manifest";

// Storage key for theme preferences
const STORAGE_KEY = "passion_os_theme_prefs_v1";

// Use the imported manifest
const manifest = themeManifest;

/**
 * Get all available themes
 */
export function getThemes(): ThemeDefinition[] {
  return manifest.themes;
}

/**
 * Get a theme by ID
 */
export function getThemeById(id: string): ThemeDefinition | undefined {
  return manifest.themes.find((t) => t.id === id);
}

/**
 * Get themes by mode
 */
export function getThemesByMode(mode: "light" | "dark"): ThemeDefinition[] {
  return manifest.themes.filter((t) => t.mode === mode);
}

/**
 * Load theme preferences from localStorage
 */
export function loadThemePreferences(): ThemePreferences {
  if (typeof localStorage === "undefined") {
    return DEFAULT_THEME_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        themeId: parsed.themeId || DEFAULT_THEME_PREFERENCES.themeId,
        waveformMode: parsed.waveformMode || DEFAULT_THEME_PREFERENCES.waveformMode,
      };
    }
  } catch (e) {
    console.warn("Failed to load theme preferences:", e);
  }

  return DEFAULT_THEME_PREFERENCES;
}

/**
 * Save theme preferences to localStorage
 */
export function saveThemePreferences(prefs: ThemePreferences): void {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn("Failed to save theme preferences:", e);
  }
}

/**
 * Detect system color scheme preference
 */
export function getSystemColorScheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Resolve theme ID to actual theme definition
 * 'system' resolves to the first theme matching system preference
 */
export function resolveTheme(themeId: string): ThemeDefinition {
  if (themeId === "system") {
    const systemMode = getSystemColorScheme();
    const themes = getThemesByMode(systemMode);
    return themes[0] || manifest.themes[0];
  }

  return getThemeById(themeId) || manifest.themes[0];
}

/**
 * Apply a theme to the document
 */
export function applyTheme(theme: ThemeDefinition): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // Set theme mode data attribute
  root.dataset.theme = theme.mode;
  root.dataset.themeId = theme.id;

  // Apply all CSS variables
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }

  // Also set the mapped variables for backward compatibility
  root.style.setProperty("--color-bg-primary", theme.vars["--bg-primary"]);
  root.style.setProperty("--color-bg-secondary", theme.vars["--bg-secondary"]);
  root.style.setProperty("--color-bg-tertiary", theme.vars["--bg-tertiary"]);
  root.style.setProperty("--color-bg-elevated", theme.vars["--bg-elevated"]);
  root.style.setProperty("--color-text-primary", theme.vars["--text-primary"]);
  root.style.setProperty("--color-text-secondary", theme.vars["--text-secondary"]);
  root.style.setProperty("--color-text-muted", theme.vars["--text-muted"]);
  root.style.setProperty("--color-border-primary", theme.vars["--border-default"]);
  root.style.setProperty("--color-border-secondary", theme.vars["--border-subtle"]);
  root.style.setProperty("--color-border-focus", theme.vars["--focus-ring"]);
  root.style.setProperty("--color-accent-primary", theme.vars["--accent-primary"]);
  root.style.setProperty("--color-accent-secondary", theme.vars["--accent-secondary"]);
  root.style.setProperty("--color-success", theme.vars["--accent-success"]);
  root.style.setProperty("--color-warning", theme.vars["--accent-warning"]);
  root.style.setProperty("--color-error", theme.vars["--accent-error"]);
}

/**
 * Apply waveform color mode overrides
 */
export function applyWaveformMode(
  mode: WaveformColorMode,
  theme: ThemeDefinition
): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (mode === "high-contrast") {
    // High contrast mode uses more vibrant colors
    const isLight = theme.mode === "light";
    root.style.setProperty("--waveform-wave", isLight ? "#0066cc" : "#00ff88");
    root.style.setProperty("--waveform-playhead", isLight ? "#ff0000" : "#ffff00");
    root.style.setProperty("--waveform-region", isLight ? "#0066cc44" : "#00ff8844");
  } else {
    // Ableton mode uses theme defaults
    root.style.setProperty("--waveform-wave", theme.vars["--waveform-wave"]);
    root.style.setProperty("--waveform-playhead", theme.vars["--waveform-playhead"]);
    root.style.setProperty("--waveform-region", theme.vars["--waveform-region"]);
  }

  root.dataset.waveformMode = mode;
}

/**
 * Initialize theme system
 * Call this on app startup
 */
export function initThemeSystem(): ThemePreferences {
  const prefs = loadThemePreferences();
  const theme = resolveTheme(prefs.themeId);

  applyTheme(theme);
  applyWaveformMode(prefs.waveformMode, theme);

  // Watch for system theme changes
  if (typeof window !== "undefined" && prefs.themeId === "system") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", () => {
      const newTheme = resolveTheme("system");
      applyTheme(newTheme);
      applyWaveformMode(prefs.waveformMode, newTheme);
    });
  }

  return prefs;
}

/**
 * Update theme and save preferences
 */
export function setTheme(themeId: string): void {
  const prefs = loadThemePreferences();
  prefs.themeId = themeId;
  saveThemePreferences(prefs);

  const theme = resolveTheme(themeId);
  applyTheme(theme);
  applyWaveformMode(prefs.waveformMode, theme);
}

/**
 * Update waveform mode and save preferences
 */
export function setWaveformMode(mode: WaveformColorMode): void {
  const prefs = loadThemePreferences();
  prefs.waveformMode = mode;
  saveThemePreferences(prefs);

  const theme = resolveTheme(prefs.themeId);
  applyWaveformMode(mode, theme);
}

/**
 * Export for external use
 */
export { manifest as themeManifest };
export type { ThemeDefinition, ThemePreferences, WaveformColorMode };

