/**
 * Daily Plan API
 *
 * API client methods for daily planning.
 * All calls go through the backend at api.ecent.online.
 *
 * Wave 4: Daily Plan routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost } from './client';

// ============================================
// Types
// ============================================

export interface PlanItem {
  id: string;
  type: 'focus' | 'quest' | 'workout' | 'learning' | 'habit';
  title: string;
  description?: string;
  duration?: number;
  action_url: string;
  completed: boolean;
  priority: number;
}

export interface DailyPlan {
  id: string;
  date: string;
  items: PlanItem[];
  notes: string | null;
  completed_count: number;
  total_count: number;
}

interface PlanResponse {
  plan: DailyPlan | null;
}

// ============================================
// API Functions
// ============================================

/**
 * Get the daily plan for a specific date (defaults to today)
 */
export async function getDailyPlan(date?: string): Promise<DailyPlan | null> {
  const path = date ? `/api/daily-plan?date=${date}` : '/api/daily-plan';
  const response = await apiGet<PlanResponse>(path);
  return response.plan;
}

/**
 * Generate a new daily plan
 */
export async function generateDailyPlan(date?: string): Promise<DailyPlan | null> {
  const response = await apiPost<PlanResponse>('/api/daily-plan', {
    action: 'generate',
    date,
  });
  return response.plan;
}

/**
 * Update the daily plan
 */
export async function updateDailyPlan(
  date: string,
  items: PlanItem[],
  notes?: string
): Promise<DailyPlan | null> {
  const response = await apiPost<PlanResponse>('/api/daily-plan', {
    action: 'update',
    date,
    items,
    notes,
  });
  return response.plan;
}

/**
 * Complete or uncomplete a plan item
 */
export async function completePlanItem(
  date: string,
  itemId: string,
  completed: boolean = true
): Promise<DailyPlan | null> {
  const response = await apiPost<PlanResponse>('/api/daily-plan', {
    action: 'complete_item',
    date,
    item_id: itemId,
    completed,
  });
  return response.plan;
}

/**
 * Get or generate today's plan
 */
export async function getOrGenerateTodayPlan(): Promise<DailyPlan | null> {
  const today = new Date().toISOString().split('T')[0];
  const existing = await getDailyPlan(today);
  if (existing) return existing;
  return generateDailyPlan(today);
}
