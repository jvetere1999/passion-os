/**
 * Gamification API
 *
 * API client methods for gamification endpoints (XP, level, coins, achievements).
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
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// ============================================
// Response Types
// ============================================

/**
 * Achievement definition from backend
 */
export interface AchievementDefinition {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown> | null;
  reward_coins: number;
  reward_xp: number;
  is_hidden: boolean;
  sort_order: number;
  created_at: string;
}

/**
 * Achievement teaser for Today page
 */
export interface AchievementTeaser {
  achievement: AchievementDefinition;
  progress: number;
  progress_max: number;
  progress_label: string;
}

/**
 * Gamification summary response
 */
export interface GamificationSummary {
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  xp_progress_percent: number;
  coins: number;
  total_skill_stars: number;
  achievement_count: number;
  current_streak: number;
  longest_streak: number;
}

/**
 * Teaser response wrapper
 */
export interface TeaserResponse {
  teaser: AchievementTeaser | null;
}

/**
 * Summary response wrapper
 */
export interface SummaryResponse {
  data: GamificationSummary;
}

// ============================================
// API Methods
// ============================================

/**
 * Get gamification summary (XP, level, coins, streaks, achievements)
 */
export async function getGamificationSummary(): Promise<GamificationSummary> {
  const response = await apiGet<SummaryResponse>('/gamification/summary');
  return response.data;
}

/**
 * Get next achievement teaser for Today page
 */
export async function getAchievementTeaser(): Promise<AchievementTeaser | null> {
  const response = await apiGet<TeaserResponse>('/gamification/teaser');
  return response.teaser;
}

// ============================================
// React Query Keys (for cache management)
// ============================================

export const gamificationKeys = {
  all: ['gamification'] as const,
  summary: () => [...gamificationKeys.all, 'summary'] as const,
  teaser: () => [...gamificationKeys.all, 'teaser'] as const,
  achievements: () => [...gamificationKeys.all, 'achievements'] as const,
};

