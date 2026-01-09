/**
 * Storage Keys
 *
 * Centralized constants for all sessionStorage and localStorage keys.
 * Single source of truth to prevent magic strings.
 */

// ============================================
// Session Storage Keys (cleared on tab close)
// ============================================

export const SESSION_KEYS = {
  /** Momentum feedback shown state */
  MOMENTUM: "passion_momentum_v1",

  /** Soft landing active state */
  SOFT_LANDING: "passion_soft_landing_v1",

  /** Soft landing source (what triggered it) */
  SOFT_LANDING_SOURCE: "passion_soft_landing_source",

  /** Reduced mode dismissed state */
  REDUCED_MODE_DISMISSED: "passion_reduced_dismissed_v1",

  /** Last fetch timestamps for auto-refresh */
  LAST_FETCH_PREFIX: "passion_last_fetch_",
} as const;

// ============================================
// Local Storage Keys (persisted across sessions)
// ============================================

export const LOCAL_KEYS = {
  /** Daily plan collapsed state */
  DAILY_PLAN_COLLAPSED: "passion_daily_plan_collapsed",

  /** Explore section collapsed state */
  EXPLORE_COLLAPSED: "passion_explore_collapsed",

  /** Theme preference */
  THEME: "theme",

  /** Focus timer settings */
  FOCUS_SETTINGS: "passion_focus_settings",

  /** Command palette recent commands */
  COMMAND_PALETTE_RECENT: "passion_command_recent",
} as const;

// ============================================
// Time Constants
// ============================================

export const TIME_CONSTANTS = {
  /** Gap threshold for reduced mode (48 hours in ms) */
  GAP_THRESHOLD_MS: 48 * 60 * 60 * 1000,

  /** Gap threshold in hours */
  GAP_THRESHOLD_HOURS: 48,

  /** Resume last threshold (24 hours in ms) */
  RESUME_LAST_THRESHOLD_MS: 24 * 60 * 60 * 1000,

  /** Quick picks lookback (14 days in ms) */
  QUICK_PICKS_LOOKBACK_MS: 14 * 24 * 60 * 60 * 1000,

  /** Auto-refresh interval (5 minutes in ms) */
  AUTO_REFRESH_INTERVAL_MS: 5 * 60 * 1000,
} as const;

// ============================================
// Type exports
// ============================================

export type SessionKey = (typeof SESSION_KEYS)[keyof typeof SESSION_KEYS];
export type LocalKey = (typeof LOCAL_KEYS)[keyof typeof LOCAL_KEYS];

