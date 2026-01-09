/**
 * Focus API
 *
 * API client methods for focus timer sessions.
 * All calls go through the backend at api.ecent.online.
 */

// ============================================
// Configuration
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json() as Promise<T>;
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json() as Promise<T>;
}

async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json() as Promise<T>;
}

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

export async function startFocusSession(req: CreateFocusRequest = {}): Promise<FocusSession> {
  const response = await apiPost<{ data: FocusSession }>('/focus', req);
  return response.data;
}

export async function getActiveFocusSession(): Promise<ActiveFocusResponse> {
  const response = await apiGet<{ data: ActiveFocusResponse }>('/focus/active');
  return response.data;
}

export async function listFocusSessions(page = 1, pageSize = 20): Promise<FocusSessionsList> {
  const response = await apiGet<{ data: FocusSessionsList }>(`/focus?page=${page}&page_size=${pageSize}`);
  return response.data;
}

export async function getFocusStats(period: 'day' | 'week' | 'month' = 'week'): Promise<FocusStats> {
  const response = await apiGet<{ data: FocusStats }>(`/focus?stats=true&period=${period}`);
  return response.data;
}

export async function completeFocusSession(sessionId: string): Promise<CompleteSessionResult> {
  const response = await apiPost<{ data: CompleteSessionResult }>(`/focus/${sessionId}/complete`);
  return response.data;
}

export async function abandonFocusSession(sessionId: string): Promise<FocusSession> {
  const response = await apiPost<{ data: FocusSession }>(`/focus/${sessionId}/abandon`);
  return response.data;
}

export async function pauseFocusSession(): Promise<PauseState> {
  const response = await apiPost<{ data: PauseState }>('/focus/pause');
  return response.data;
}

export async function resumeFocusSession(): Promise<FocusSession> {
  const response = await apiDelete<{ data: FocusSession }>('/focus/pause');
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

