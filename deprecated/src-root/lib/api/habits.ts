/**
 * Habits API
 *
 * API client methods for habit tracking.
 * All calls go through the backend at api.ecent.online.
 */

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

// ============================================
// Types
// ============================================

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'custom';
  target_count: number;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  current_streak: number;
  longest_streak: number;
  last_completed_at: string | null;
  completed_today: boolean;
  sort_order: number;
}

export interface HabitsList {
  habits: Habit[];
}

export interface CreateHabitRequest {
  name: string;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'custom';
  target_count?: number;
  icon?: string;
  color?: string;
}

export interface CompleteHabitResult {
  habit: Habit;
  new_streak: number;
  xp_awarded: number;
  streak_bonus: boolean;
}

// ============================================
// API Methods
// ============================================

export async function listHabits(): Promise<HabitsList> {
  const response = await apiGet<{ data: HabitsList }>('/habits');
  return response.data;
}

export async function createHabit(req: CreateHabitRequest): Promise<Habit> {
  const response = await apiPost<{ data: Habit }>('/habits', req);
  return response.data;
}

export async function completeHabit(habitId: string, notes?: string): Promise<CompleteHabitResult> {
  const response = await apiPost<{ data: CompleteHabitResult }>(`/habits/${habitId}/complete`, notes ? { notes } : undefined);
  return response.data;
}

// ============================================
// React Query Keys
// ============================================

export const habitsKeys = {
  all: ['habits'] as const,
  list: () => [...habitsKeys.all, 'list'] as const,
};

