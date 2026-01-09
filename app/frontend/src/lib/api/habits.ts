/**
 * Habits API
 *
 * API client methods for habit tracking.
 * All calls go through the backend at api.ecent.online.
 *
 * PARITY-026: Habits routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost } from './client';

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

/**
 * List all active habits with today's completion status
 * GET /api/habits
 */
export async function listHabits(): Promise<HabitsList> {
  const response = await apiGet<{ data: HabitsList }>('/api/habits');
  return response.data;
}

/**
 * Create a new habit
 * POST /api/habits
 */
export async function createHabit(req: CreateHabitRequest): Promise<Habit> {
  const response = await apiPost<{ data: Habit }>('/api/habits', req);
  return response.data;
}

/**
 * Complete a habit for today
 * POST /api/habits/:id/complete
 */
export async function completeHabit(habitId: string, notes?: string): Promise<CompleteHabitResult> {
  const response = await apiPost<{ data: CompleteHabitResult }>(
    `/api/habits/${habitId}/complete`,
    notes ? { notes } : undefined
  );
  return response.data;
}

// ============================================
// React Query Keys
// ============================================

export const habitsKeys = {
  all: ['habits'] as const,
  list: () => [...habitsKeys.all, 'list'] as const,
};
