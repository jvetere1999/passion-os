/**
 * Sync API Client
 *
 * Lightweight polling endpoint for UI optimization.
 * Returns minimal data needed for badges, HUD, and status indicators.
 *
 * Design Principles:
 * 1. Single request for all poll data
 * 2. ETag support for conditional requests
 * 3. 30-second polling interval
 * 4. Memory-only caching (no localStorage)
 */

import { apiGet } from './client';

// ============================================
// Types
// ============================================

export interface ProgressData {
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  xp_progress_percent: number;
  coins: number;
  streak_days: number;
}

export interface BadgeData {
  unread_inbox: number;
  active_quests: number;
  pending_habits: number;
  overdue_items: number;
}

export interface FocusStatusData {
  has_active_session: boolean;
  mode: string | null;
  time_remaining_seconds: number | null;
  expires_at: string | null;
}

export interface PlanStatusData {
  has_plan: boolean;
  completed: number;
  total: number;
  percent_complete: number;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  image: string | null;
  theme: string;
  tos_accepted: boolean;
}

export interface PollResponse {
  progress: ProgressData;
  badges: BadgeData;
  focus: FocusStatusData;
  plan: PlanStatusData;
  user: UserData;
  server_time: string;
  etag: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Fetch all poll data in a single request
 * This is the primary endpoint for 30-second polling
 */
export async function pollAll(): Promise<PollResponse> {
  const response = await apiGet<PollResponse>('/api/sync/poll');
  return response;
}

/**
 * Fetch only progress data (XP, level, coins)
 */
export async function getProgress(): Promise<ProgressData> {
  const response = await apiGet<ProgressData>('/api/sync/progress');
  return response;
}

/**
 * Fetch only badge counts
 */
export async function getBadges(): Promise<BadgeData> {
  const response = await apiGet<BadgeData>('/api/sync/badges');
  return response;
}

/**
 * Fetch only focus session status
 */
export async function getFocusStatus(): Promise<FocusStatusData> {
  const response = await apiGet<FocusStatusData>('/api/sync/focus-status');
  return response;
}

/**
 * Fetch only daily plan status
 */
export async function getPlanStatus(): Promise<PlanStatusData> {
  const response = await apiGet<PlanStatusData>('/api/sync/plan-status');
  return response;
}
