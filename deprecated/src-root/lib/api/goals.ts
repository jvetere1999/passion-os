/**
 * Goals API
 *
 * API client methods for goal management.
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

export async function listGoals(status?: string): Promise<GoalsList> {
  const query = status ? `?status=${status}` : '';
  const response = await apiGet<{ data: GoalsList }>(`/goals${query}`);
  return response.data;
}

export async function getGoal(goalId: string): Promise<Goal> {
  const response = await apiGet<{ data: Goal }>(`/goals/${goalId}`);
  return response.data;
}

export async function createGoal(req: CreateGoalRequest): Promise<Goal> {
  const response = await apiPost<{ data: Goal }>('/goals', req);
  return response.data;
}

export async function addMilestone(goalId: string, req: CreateMilestoneRequest): Promise<GoalMilestone> {
  const response = await apiPost<{ data: GoalMilestone }>(`/goals/${goalId}/milestones`, req);
  return response.data;
}

export async function completeMilestone(milestoneId: string): Promise<CompleteMilestoneResult> {
  const response = await apiPost<{ data: CompleteMilestoneResult }>(`/goals/milestones/${milestoneId}/complete`);
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

