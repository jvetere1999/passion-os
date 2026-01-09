"use client";

/**
 * Theme System Type Definitions
 *
 * Defines the structure for theme definitions, including
 * Ableton Live 12 built-in themes and custom themes.
 */

/**
 * Theme mode - light or dark
 */
export type ThemeMode = "light" | "dark";

/**
 * Waveform color mode
 */
export type WaveformColorMode = "ableton" | "high-contrast";

/**
 * Theme color variables - all UI colors as CSS custom properties
 */
export interface ThemeVars {
  // Backgrounds
  "--bg-primary": string;
  "--bg-secondary": string;
  "--bg-tertiary": string;
  "--bg-elevated": string;

  // Surfaces
  "--surface-default": string;
  "--surface-hover": string;
  "--surface-active": string;
  "--surface-selected": string;

  // Text
  "--text-primary": string;
  "--text-secondary": string;
  "--text-muted": string;
  "--text-inverse": string;

  // Borders
  "--border-default": string;
  "--border-subtle": string;
  "--border-strong": string;

  // Accents
  "--accent-primary": string;
  "--accent-secondary": string;
  "--accent-success": string;
  "--accent-warning": string;
  "--accent-error": string;

  // Selection & Focus
  "--selection-bg": string;
  "--selection-text": string;
  "--focus-ring": string;

  // Keycaps
  "--keycap-bg": string;
  "--keycap-text": string;
  "--keycap-border": string;
  "--keycap-modifier-bg": string;
  "--keycap-modifier-text": string;

  // Waveform
  "--waveform-bg": string;
  "--waveform-wave": string;
  "--waveform-playhead": string;
  "--waveform-region": string;
  "--waveform-marker": string;

  // Player
  "--player-bg": string;
  "--player-controls": string;
  "--player-progress": string;

  // List row states
  "--row-odd": string;
  "--row-even": string;
  "--row-hover": string;
  "--row-selected": string;

  // Tags/Badges
  "--tag-bg": string;
  "--tag-text": string;
  "--badge-bg": string;
  "--badge-text": string;

  // Additional vars can be added
  [key: string]: string;
}

/**
 * Theme metadata - source information
 */
export interface ThemeMeta {
  sourceType: "ableton-ask" | "custom" | "system";
  fileName?: string;
  sha256?: string;
}

/**
 * Theme definition
 */
export interface ThemeDefinition {
  id: string;
  name: string;
  mode: ThemeMode;
  vars: ThemeVars;
  meta: ThemeMeta;
  missing?: string[]; // Fields that couldn't be extracted
}

/**
 * Theme manifest - collection of themes
 */
export interface ThemeManifest {
  version: number;
  generatedAt: string;
  themes: ThemeDefinition[];
}

/**
 * User theme preferences
 */
export interface ThemePreferences {
  themeId: string; // 'system' or specific theme ID
  waveformMode: WaveformColorMode;
}

/**
 * Default theme preferences
 */
export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  themeId: "system",
  waveformMode: "ableton",
};

