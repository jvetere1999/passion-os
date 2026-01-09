/**
 * User Settings Repository
 * CRUD operations for user settings in D1
 */

import type { D1Database } from "@cloudflare/workers-types";
import type { UserSettings } from "../types";
import { now, validateEnum, toJSON, parseJSON } from "../utils";

const THEMES = ["light", "dark", "system"] as const;
const KEYBOARD_LAYOUTS = ["mac", "windows"] as const;

/**
 * Default user settings
 */
export const DEFAULT_SETTINGS: Omit<UserSettings, "user_id" | "updated_at"> = {
  theme: "system",
  selected_product: null,
  keyboard_layout: "mac",
  notifications_enabled: 1,
  focus_default_duration: 1500, // 25 minutes
  focus_break_duration: 300, // 5 minutes
  focus_long_break_duration: 900, // 15 minutes
  settings_json: null,
};

/**
 * Get user settings, creating defaults if not exists
 */
export async function getUserSettings(
  db: D1Database,
  userId: string
): Promise<UserSettings> {
  const existing = await db
    .prepare("SELECT * FROM user_settings WHERE user_id = ?")
    .bind(userId)
    .first<UserSettings>();

  if (existing) {
    return existing;
  }

  // Create default settings
  const settings: UserSettings = {
    user_id: userId,
    ...DEFAULT_SETTINGS,
    updated_at: now(),
  };

  await db
    .prepare(
      `INSERT INTO user_settings (
        user_id, theme, selected_product, keyboard_layout,
        notifications_enabled, focus_default_duration,
        focus_break_duration, focus_long_break_duration,
        settings_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      settings.user_id,
      settings.theme,
      settings.selected_product,
      settings.keyboard_layout,
      settings.notifications_enabled,
      settings.focus_default_duration,
      settings.focus_break_duration,
      settings.focus_long_break_duration,
      settings.settings_json,
      settings.updated_at
    )
    .run();

  return settings;
}

/**
 * Update user settings
 */
export interface UpdateSettingsInput {
  theme?: "light" | "dark" | "system";
  selected_product?: string | null;
  keyboard_layout?: "mac" | "windows";
  notifications_enabled?: boolean;
  focus_default_duration?: number;
  focus_break_duration?: number;
  focus_long_break_duration?: number;
  settings_json?: Record<string, unknown> | null;
}

export async function updateUserSettings(
  db: D1Database,
  userId: string,
  input: UpdateSettingsInput
): Promise<UserSettings> {
  const existing = await getUserSettings(db, userId);

  if (input.theme) {
    validateEnum(input.theme, THEMES, "theme");
  }
  if (input.keyboard_layout) {
    validateEnum(input.keyboard_layout, KEYBOARD_LAYOUTS, "keyboard_layout");
  }

  const updated: UserSettings = {
    ...existing,
    theme: input.theme ?? existing.theme,
    selected_product:
      input.selected_product !== undefined
        ? input.selected_product
        : existing.selected_product,
    keyboard_layout: input.keyboard_layout ?? existing.keyboard_layout,
    notifications_enabled:
      input.notifications_enabled !== undefined
        ? input.notifications_enabled
          ? 1
          : 0
        : existing.notifications_enabled,
    focus_default_duration:
      input.focus_default_duration ?? existing.focus_default_duration,
    focus_break_duration:
      input.focus_break_duration ?? existing.focus_break_duration,
    focus_long_break_duration:
      input.focus_long_break_duration ?? existing.focus_long_break_duration,
    settings_json:
      input.settings_json !== undefined
        ? toJSON(input.settings_json)
        : existing.settings_json,
    updated_at: now(),
  };

  await db
    .prepare(
      `UPDATE user_settings SET
        theme = ?, selected_product = ?, keyboard_layout = ?,
        notifications_enabled = ?, focus_default_duration = ?,
        focus_break_duration = ?, focus_long_break_duration = ?,
        settings_json = ?, updated_at = ?
      WHERE user_id = ?`
    )
    .bind(
      updated.theme,
      updated.selected_product,
      updated.keyboard_layout,
      updated.notifications_enabled,
      updated.focus_default_duration,
      updated.focus_break_duration,
      updated.focus_long_break_duration,
      updated.settings_json,
      updated.updated_at,
      userId
    )
    .run();

  return updated;
}

/**
 * Get parsed custom settings
 */
export function getCustomSettings<T = Record<string, unknown>>(
  settings: UserSettings
): T | null {
  return parseJSON<T>(settings.settings_json);
}

/**
 * Update a single custom setting
 */
export async function setCustomSetting(
  db: D1Database,
  userId: string,
  key: string,
  value: unknown
): Promise<UserSettings> {
  const settings = await getUserSettings(db, userId);
  const customSettings = getCustomSettings(settings) ?? {};
  customSettings[key] = value;

  return updateUserSettings(db, userId, {
    settings_json: customSettings,
  });
}

