/**
 * Goals API
 *
 * API client methods for goal management.
 * All calls go through the backend at api.ecent.online.
 *
 * PARITY-027: Goals routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost } from './client';

// ============================================
// Types
// ============================================

export interface GoalMilestone {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  progress: number;
  priority: number;
  milestones: GoalMilestone[];
  total_milestones: number;
  completed_milestones: number;
}

export interface GoalsList {
  goals: Goal[];
  total: number;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  category?: string;
  target_date?: string;
  priority?: number;
}

export interface CreateMilestoneRequest {
  title: string;
  description?: string;
}

export interface CompleteMilestoneResult {
  milestone: GoalMilestone;
  goal_progress: number;
  goal_completed: boolean;
}

// ============================================
// API Methods
// ============================================

/**
 * List goals for user
 * GET /api/goals
 */
export async function listGoals(status?: string): Promise<GoalsList> {
  const query = status ? `?status=${status}` : '';
  const response = await apiGet<{ data: GoalsList }>(`/api/goals${query}`);
  return response.data;
}

/**
 * Get a goal with milestones
 * GET /api/goals/:id
 */
export async function getGoal(goalId: string): Promise<Goal> {
  const response = await apiGet<{ data: Goal }>(`/api/goals/${goalId}`);
  return response.data;
}

/**
 * Create a new goal
 * POST /api/goals
 */
export async function createGoal(req: CreateGoalRequest): Promise<Goal> {
  const response = await apiPost<{ data: Goal }>('/api/goals', req);
  return response.data;
}

/**
 * Add a milestone to a goal
 * POST /api/goals/:id/milestones
 */
export async function addMilestone(goalId: string, req: CreateMilestoneRequest): Promise<GoalMilestone> {
  const response = await apiPost<{ data: GoalMilestone }>(`/api/goals/${goalId}/milestones`, req);
  return response.data;
}

/**
 * Complete a milestone
 * POST /api/goals/milestones/:id/complete
 */
export async function completeMilestone(milestoneId: string): Promise<CompleteMilestoneResult> {
  const response = await apiPost<{ data: CompleteMilestoneResult }>(`/api/goals/milestones/${milestoneId}/complete`);
  return response.data;
}

// ============================================
// React Query Keys
// ============================================

export const goalsKeys = {
  all: ['goals'] as const,
  list: (status?: string) => [...goalsKeys.all, 'list', status] as const,
  detail: (id: string) => [...goalsKeys.all, 'detail', id] as const,
};
