/**
 * Quests API
 *
 * API client methods for quest system.
 * All calls go through the backend at api.ecent.online.
 *
 * PARITY-028: Quests routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost } from './client';

// ============================================
// Types
// ============================================

export type QuestDifficulty = 'starter' | 'easy' | 'medium' | 'hard' | 'epic';
export type QuestStatus = 'available' | 'accepted' | 'completed' | 'abandoned' | 'expired';

export interface Quest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: QuestDifficulty;
  xp_reward: number;
  coin_reward: number;
  status: QuestStatus;
  is_repeatable: boolean;
  streak_count: number;
  accepted_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
}

export interface QuestsList {
  quests: Quest[];
  total: number;
}

export interface CreateQuestRequest {
  title: string;
  description?: string;
  category: string;
  difficulty?: QuestDifficulty;
  xp_reward?: number;
  coin_reward?: number;
  is_repeatable?: boolean;
  repeat_frequency?: 'daily' | 'weekly' | 'monthly';
}

export interface CompleteQuestResult {
  quest: Quest;
  xp_awarded: number;
  coins_awarded: number;
  leveled_up: boolean;
  new_level?: number;
}

// ============================================
// API Methods
// ============================================

/**
 * List quests for user
 * GET /api/quests
 */
export async function listQuests(status?: QuestStatus): Promise<QuestsList> {
  const query = status ? `?status=${status}` : '';
  const response = await apiGet<{ data: QuestsList }>(`/api/quests${query}`);
  return response.data;
}

/**
 * Get a quest by ID
 * GET /api/quests/:id
 */
export async function getQuest(questId: string): Promise<Quest> {
  const response = await apiGet<{ data: Quest }>(`/api/quests/${questId}`);
  return response.data;
}

/**
 * Create a new quest
 * POST /api/quests
 */
export async function createQuest(req: CreateQuestRequest): Promise<Quest> {
  const response = await apiPost<{ data: Quest }>('/api/quests', req);
  return response.data;
}

/**
 * Accept a quest
 * POST /api/quests/:id/accept
 */
export async function acceptQuest(questId: string): Promise<Quest> {
  const response = await apiPost<{ data: Quest }>(`/api/quests/${questId}/accept`);
  return response.data;
}

/**
 * Complete a quest
 * POST /api/quests/:id/complete
 */
export async function completeQuest(questId: string): Promise<CompleteQuestResult> {
  const response = await apiPost<{ data: CompleteQuestResult }>(`/api/quests/${questId}/complete`);
  return response.data;
}

/**
 * Abandon a quest
 * POST /api/quests/:id/abandon
 */
export async function abandonQuest(questId: string): Promise<Quest> {
  const response = await apiPost<{ data: Quest }>(`/api/quests/${questId}/abandon`);
  return response.data;
}

// ============================================
// React Query Keys
// ============================================

export const questsKeys = {
  all: ['quests'] as const,
  list: (status?: string) => [...questsKeys.all, 'list', status] as const,
  detail: (id: string) => [...questsKeys.all, 'detail', id] as const,
};
