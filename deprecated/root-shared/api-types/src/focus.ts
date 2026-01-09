/**
 * Focus Session types
 *
 * Types for focus/pomodoro sessions
 */

import type { UUID, ISOTimestamp } from './common.js';

// ============================================
// Enums
// ============================================

/**
 * Focus mode type
 */
export type FocusMode = 'focus' | 'break' | 'long_break';

/**
 * Focus session status
 */
export type FocusSessionStatus = 'active' | 'completed' | 'abandoned';

// ============================================
// Entity Types
// ============================================

/**
 * Focus session entity
 */
export interface FocusSession {
  id: UUID;
  user_id: UUID;
  duration_minutes: number;
  mode: FocusMode;
  status: FocusSessionStatus;
  task_id?: UUID;
  task_title?: string;
  started_at: ISOTimestamp;
  ended_at?: ISOTimestamp;
  actual_duration_seconds?: number;
  xp_earned?: number;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

/**
 * Focus pause state
 */
export interface FocusPauseState {
  id: UUID;
  session_id: UUID;
  paused_at: ISOTimestamp;
  elapsed_seconds: number;
}

// ============================================
// Request Types
// ============================================

/**
 * Create focus session request
 * POST /api/focus
 */
export interface CreateFocusRequest {
  duration_minutes: number;
  mode: FocusMode;
  task_id?: UUID;
  task_title?: string;
}

/**
 * Complete focus session request
 * POST /api/focus/:id/complete
 */
export interface CompleteFocusRequest {
  actual_duration_seconds?: number;
}

// ============================================
// Response Types
// ============================================

/**
 * Focus session response
 */
export type FocusSessionResponse = FocusSession;

/**
 * Active focus session response
 * GET /api/focus/active
 */
export interface ActiveFocusResponse {
  session?: FocusSession;
  pause_state?: FocusPauseState;
}

/**
 * Focus history response
 * GET /api/focus
 */
export interface FocusHistoryResponse {
  sessions: FocusSession[];
  total: number;
}

/**
 * Focus stats
 */
export interface FocusStats {
  total_sessions: number;
  total_minutes: number;
  completed_sessions: number;
  average_duration_minutes: number;
  current_streak: number;
}

