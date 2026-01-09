/**
 * Quests API
 *
 * API client methods for quest system.
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

export async function listQuests(status?: QuestStatus): Promise<QuestsList> {
  const query = status ? `?status=${status}` : '';
  const response = await apiGet<{ data: QuestsList }>(`/quests${query}`);
  return response.data;
}

export async function getQuest(questId: string): Promise<Quest> {
  const response = await apiGet<{ data: Quest }>(`/quests/${questId}`);
  return response.data;
}

export async function createQuest(req: CreateQuestRequest): Promise<Quest> {
  const response = await apiPost<{ data: Quest }>('/quests', req);
  return response.data;
}

export async function acceptQuest(questId: string): Promise<Quest> {
  const response = await apiPost<{ data: Quest }>(`/quests/${questId}/accept`);
  return response.data;
}

export async function completeQuest(questId: string): Promise<CompleteQuestResult> {
  const response = await apiPost<{ data: CompleteQuestResult }>(`/quests/${questId}/complete`);
  return response.data;
}

export async function abandonQuest(questId: string): Promise<Quest> {
  const response = await apiPost<{ data: Quest }>(`/quests/${questId}/abandon`);
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

