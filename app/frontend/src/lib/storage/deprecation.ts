/**
 * Mass Local Storage Deprecation Control
 *
 * This module provides a centralized switch to disable behavior-affecting
 * localStorage usage. When DISABLE_MASS_LOCAL_PERSISTENCE is true:
 *
 * - All behavior-affecting localStorage reads return null/empty
 * - All behavior-affecting localStorage writes are no-ops
 * - Only cosmetic keys (theme, collapsed sections) remain functional
 *
 * This flag should be enabled during debugging to expose hidden DB/schema
 * problems that localStorage persistence was masking.
 */

"use client";

/**
 * MASTER SWITCH: Disable all mass local persistence
 *
 * Set to `true` to disable behavior-affecting localStorage.
 * This will cause features to rely solely on D1, exposing any schema mismatches.
 */
export const DISABLE_MASS_LOCAL_PERSISTENCE = true;

/**
 * ALLOWED localStorage keys (cosmetic only)
 *
 * These keys are permitted even when DISABLE_MASS_LOCAL_PERSISTENCE is true.
 */
export const ALLOWED_LOCAL_STORAGE_KEYS = new Set([
  // Theme-related (cosmetic)
  "theme",
  "passion-os-theme",
  "passion_os_theme_prefs_v1",

  // UI collapse state (cosmetic)
  "daily_plan_collapsed",
  "explore_drawer_collapsed",

  // Player settings (ephemeral, not behavior-affecting)
  "passion_player_v1",
  "passion_player_queue_v1",
]);

/**
 * FORBIDDEN localStorage keys (behavior-affecting, must use D1)
 *
 * These are the keys that violate storage rules.
 */
export const FORBIDDEN_LOCAL_STORAGE_KEYS = new Set([
  // Focus (CRITICAL - must be D1 only)
  "focus_paused_state",
  "focus_settings",

  // Goals (CRITICAL - D1 goals table exists)
  "passion_goals_v1",

  // Quests (CRITICAL - D1 API exists)
  "passion_quest_progress_v1",

  // Skills/Progress (CRITICAL - D1 user_skills exists)
  "passion_skills_v1",

  // Reference libraries (CRITICAL - D1 + R2)
  "passion_reference_libraries_v2",

  // Infobase (D1 API exists)
  "passion_infobase_v1",

  // Journal (should be D1)
  "passion_learn_journal_v1",

  // Learn settings (should be user_settings)
  "passion_learn_settings_v1",

  // Inbox (should be D1 for cross-device)
  "passion_inbox_v1",

  // Ideas (D1 API exists)
  "music_ideas",

  // Arrangements (feature data)
  "passion_arrange_v1",

  // Analysis cache (should be D1 track_analysis_cache)
  "passion_analysis_cache_v1",
]);

/**
 * Check if a localStorage key is allowed
 */
export function isLocalStorageKeyAllowed(key: string): boolean {
  if (!DISABLE_MASS_LOCAL_PERSISTENCE) {
    return true; // All keys allowed when flag is off
  }
  return ALLOWED_LOCAL_STORAGE_KEYS.has(key);
}

/**
 * Safe localStorage getter
 * Returns null for forbidden keys when deprecation is enabled
 */
export function safeLocalStorageGet(key: string): string | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  if (!isLocalStorageKeyAllowed(key)) {
    console.warn(
      `[StorageDeprecation] Blocked read of forbidden key: ${key}. ` +
      `This data should come from D1.`
    );
    return null;
  }

  return localStorage.getItem(key);
}

/**
 * Safe localStorage setter
 * No-ops for forbidden keys when deprecation is enabled
 */
export function safeLocalStorageSet(key: string, value: string): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  if (!isLocalStorageKeyAllowed(key)) {
    console.warn(
      `[StorageDeprecation] Blocked write to forbidden key: ${key}. ` +
      `This data should be stored in D1.`
    );
    return;
  }

  localStorage.setItem(key, value);
}

/**
 * Safe localStorage remover
 */
export function safeLocalStorageRemove(key: string): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  // Always allow removal (cleanup is good)
  localStorage.removeItem(key);
}

/**
 * Get deprecation status for debugging
 */
export function getDeprecationStatus(): {
  enabled: boolean;
  allowedKeys: string[];
  forbiddenKeys: string[];
} {
  return {
    enabled: DISABLE_MASS_LOCAL_PERSISTENCE,
    allowedKeys: Array.from(ALLOWED_LOCAL_STORAGE_KEYS),
    forbiddenKeys: Array.from(FORBIDDEN_LOCAL_STORAGE_KEYS),
  };
}

