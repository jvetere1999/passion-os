/**
 * User API
 *
 * API client methods for user settings, account management, and data export.
 * All calls go through the backend at api.ecent.online.
 *
 * Wave 4: User routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPut, apiDelete } from './client';

// ============================================
// Types
// ============================================

export interface UserSettings {
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  timezone: string | null;
  locale: string;
  profile_public: boolean;
  show_activity: boolean;
  daily_reminder_time: string | null;
}

export interface UpdateUserSettingsRequest {
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  theme?: 'light' | 'dark' | 'system';
  timezone?: string;
  locale?: string;
  profile_public?: boolean;
  show_activity?: boolean;
  daily_reminder_time?: string;
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
}

export interface ExportDataResponse {
  exported_at: string;
  user_id: string;
  email: string | null;
  data: Record<string, unknown>;
}

interface SettingsWrapper {
  data: UserSettings;
}

interface DeleteWrapper {
  data: DeleteAccountResponse;
}

interface ExportWrapper {
  data: ExportDataResponse;
}

// ============================================
// API Functions
// ============================================

/**
 * Get user settings
 */
export async function getSettings(): Promise<UserSettings> {
  const response = await apiGet<SettingsWrapper>('/api/user/settings');
  return response.data;
}

/**
 * Update user settings
 */
export async function updateSettings(
  settings: UpdateUserSettingsRequest
): Promise<UserSettings> {
  const response = await apiPut<SettingsWrapper>('/api/user/settings', settings);
  return response.data;
}

/**
 * Set theme preference
 */
export async function setTheme(theme: 'light' | 'dark' | 'system'): Promise<UserSettings> {
  return updateSettings({ theme });
}

/**
 * Toggle notifications
 */
export async function toggleNotifications(enabled: boolean): Promise<UserSettings> {
  return updateSettings({ notifications_enabled: enabled });
}

/**
 * Set timezone
 */
export async function setTimezone(timezone: string): Promise<UserSettings> {
  return updateSettings({ timezone });
}

/**
 * Set daily reminder time
 */
export async function setDailyReminder(time: string | null): Promise<UserSettings> {
  return updateSettings({ daily_reminder_time: time ?? undefined });
}

/**
 * Delete user account and all data
 * WARNING: This is irreversible!
 */
export async function deleteAccount(): Promise<DeleteAccountResponse> {
  const response = await apiDelete<DeleteWrapper>('/api/user/delete');
  return response.data;
}

/**
 * Export all user data
 */
export async function exportData(): Promise<ExportDataResponse> {
  const response = await apiGet<ExportWrapper>('/api/user/export');
  return response.data;
}

/**
 * Download exported data as a JSON file
 */
export async function downloadExportedData(): Promise<void> {
  const data = await exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ignition-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
