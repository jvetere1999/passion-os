/**
 * Focus API
 *
 * API client methods for focus timer sessions (Pomodoro-style).
 * All calls go through the backend at api.ecent.online.
 *
 * PARITY-021 to PARITY-025: Focus routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost, apiDelete } from './client';

// ============================================
// Types
// ============================================

export interface FocusSession {
  id: string;
  mode: 'focus' | 'break' | 'long_break';
  duration_seconds: number;
  started_at: string;
  completed_at: string | null;
  abandoned_at: string | null;
  expires_at: string | null;
  status: 'active' | 'paused' | 'completed' | 'abandoned' | 'expired';
  xp_awarded: number;
  coins_awarded: number;
  task_title: string | null;
  time_remaining_seconds?: number;
}

export interface PauseState {
  mode: string;
  time_remaining_seconds: number;
  paused_at: string;
}

export interface ActiveFocusResponse {
  session: FocusSession | null;
  pause_state: PauseState | null;
}

export interface FocusStats {
  completed_sessions: number;
  abandoned_sessions: number;
  total_sessions: number;
  total_focus_seconds: number;
  total_xp_earned: number;
  total_coins_earned: number;
}

export interface FocusSessionsList {
  sessions: FocusSession[];
  total: number;
  page: number;
  page_size: number;
}

export interface CompleteSessionResult {
  session: FocusSession;
  xp_awarded: number;
  coins_awarded: number;
  leveled_up: boolean;
  new_level?: number;
}

export interface CreateFocusRequest {
  mode?: 'focus' | 'break' | 'long_break';
  duration_seconds?: number;
  task_title?: string;
}

// ============================================
// API Methods
// ============================================

/**
 * Start a new focus session
 * POST /api/focus
 */
export async function startFocusSession(req: CreateFocusRequest = {}): Promise<FocusSession> {
  const response = await apiPost<{ data: FocusSession }>('/api/focus', req);
  return response.data;
}

/**
 * Get the active focus session and pause state
 * GET /api/focus/active
 */
export async function getActiveFocusSession(): Promise<ActiveFocusResponse> {
  const response = await apiGet<{ data: ActiveFocusResponse }>('/api/focus/active');
  return response.data;
}

/**
 * List focus sessions with pagination
 * GET /api/focus
 */
export async function listFocusSessions(page = 1, pageSize = 20): Promise<FocusSessionsList> {
  const response = await apiGet<{ data: FocusSessionsList }>(`/api/focus?page=${page}&page_size=${pageSize}`);
  return response.data;
}

/**
 * Get focus stats for a time period
 * GET /api/focus?stats=true&period=...
 */
export async function getFocusStats(period: 'day' | 'week' | 'month' = 'week'): Promise<FocusStats> {
  const response = await apiGet<{ data: FocusStats }>(`/api/focus?stats=true&period=${period}`);
  return response.data;
}

/**
 * Complete a focus session
 * POST /api/focus/:id/complete
 */
export async function completeFocusSession(sessionId: string): Promise<CompleteSessionResult> {
  const response = await apiPost<{ data: CompleteSessionResult }>(`/api/focus/${sessionId}/complete`);
  return response.data;
}

/**
 * Abandon a focus session
 * POST /api/focus/:id/abandon
 */
export async function abandonFocusSession(sessionId: string): Promise<FocusSession> {
  const response = await apiPost<{ data: FocusSession }>(`/api/focus/${sessionId}/abandon`);
  return response.data;
}

/**
 * Get current pause state
 * GET /api/focus/pause
 */
export async function getPauseState(): Promise<PauseState | null> {
  const response = await apiGet<{ data: PauseState | null }>('/api/focus/pause');
  return response.data;
}

/**
 * Pause the current focus session
 * POST /api/focus/pause
 */
export async function pauseFocusSession(timeRemaining: number): Promise<PauseState> {
  const response = await apiPost<{ data: PauseState }>('/api/focus/pause', { time_remaining_seconds: timeRemaining });
  return response.data;
}

/**
 * Resume from paused state
 * DELETE /api/focus/pause
 */
export async function resumeFocusSession(): Promise<FocusSession> {
  const response = await apiDelete<{ data: FocusSession }>('/api/focus/pause');
  return response.data;
}

// ============================================
// React Query Keys
// ============================================

export const focusKeys = {
  all: ['focus'] as const,
  active: () => [...focusKeys.all, 'active'] as const,
  list: (page: number) => [...focusKeys.all, 'list', page] as const,
  stats: (period: string) => [...focusKeys.all, 'stats', period] as const,
};
