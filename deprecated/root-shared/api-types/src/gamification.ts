/**
 * Gamification types
 *
 * Types for XP, levels, wallet, achievements
 */

import type { UUID, ISOTimestamp } from './common.js';

// ============================================
// Enums
// ============================================

/**
 * Reward type for XP earning
 */
export type RewardType = 'xp' | 'achievement' | 'streak' | 'milestone';

/**
 * Transaction type for wallet
 */
export type TransactionType = 'earn' | 'spend' | 'bonus' | 'adjustment';

/**
 * Achievement category
 */
export type AchievementCategory =
  | 'focus'
  | 'streak'
  | 'quests'
  | 'habits'
  | 'exercise'
  | 'learning'
  | 'social'
  | 'special';

// ============================================
// XP and Levels
// ============================================

/**
 * User progress (XP and level)
 */
export interface UserProgress {
  id: UUID;
  user_id: UUID;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string; // YYYY-MM-DD
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

/**
 * Level definition
 */
export interface LevelDefinition {
  level: number;
  xp_required: number;
  title: string;
  badge?: string;
}

/**
 * XP event (for history)
 */
export interface XpEvent {
  id: UUID;
  user_id: UUID;
  amount: number;
  source: string;
  source_id?: UUID;
  description?: string;
  created_at: ISOTimestamp;
}

// ============================================
// Wallet
// ============================================

/**
 * User wallet
 */
export interface UserWallet {
  id: UUID;
  user_id: UUID;
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

/**
 * Wallet transaction
 */
export interface WalletTransaction {
  id: UUID;
  wallet_id: UUID;
  amount: number;
  transaction_type: TransactionType;
  description?: string;
  reference_id?: UUID;
  reference_type?: string;
  created_at: ISOTimestamp;
}

// ============================================
// Achievements
// ============================================

/**
 * Achievement definition
 */
export interface Achievement {
  id: UUID;
  slug: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon?: string;
  xp_reward: number;
  coin_reward: number;
  requirement_type: string;
  requirement_value: number;
  hidden: boolean;
  created_at: ISOTimestamp;
}

/**
 * User achievement (unlocked)
 */
export interface UserAchievement {
  id: UUID;
  user_id: UUID;
  achievement_id: UUID;
  unlocked_at: ISOTimestamp;
  achievement?: Achievement;
}

// ============================================
// Request Types
// ============================================

/**
 * Award XP request
 * POST /api/gamification/xp
 */
export interface AwardXpRequest {
  amount: number;
  source: string;
  source_id?: UUID;
  description?: string;
}

// ============================================
// Response Types
// ============================================

/**
 * User gamification summary
 * GET /api/gamification/summary
 */
export interface GamificationSummaryResponse {
  progress: UserProgress;
  wallet: UserWallet;
  recent_achievements: UserAchievement[];
  level_info: LevelDefinition;
}

/**
 * Achievements list response
 * GET /api/gamification/achievements
 */
export interface AchievementsResponse {
  achievements: Achievement[];
  unlocked: UserAchievement[];
}

/**
 * XP history response
 * GET /api/gamification/xp/history
 */
export interface XpHistoryResponse {
  events: XpEvent[];
  total: number;
}

/**
 * Wallet transactions response
 * GET /api/gamification/wallet/transactions
 */
export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  total: number;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number;
  user_id: UUID;
  user_name: string;
  user_image?: string;
  total_xp: number;
  level: number;
}

/**
 * Leaderboard response
 * GET /api/gamification/leaderboard
 */
export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  user_rank?: number;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

