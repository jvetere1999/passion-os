/**
 * Focus Sessions Repository
 * CRUD operations for focus sessions in D1
 */

import type { D1Database } from "@cloudflare/workers-types";
import type {
  FocusSession,
  FocusSessionStatus,
  FocusMode,
  CreateFocusSessionInput,
} from "../types";
import {
  generateId,
  now,
  validateRequired,
  validateEnum,
  paginatedQuery,
  type PaginatedResult,
  type PaginationOptions,
} from "../utils";

const FOCUS_STATUSES: readonly FocusSessionStatus[] = [
  "active",
  "completed",
  "abandoned",
];

const FOCUS_MODES: readonly FocusMode[] = ["focus", "break", "long_break"];

/**
 * Create a new focus session
 */
export async function createFocusSession(
  db: D1Database,
  input: CreateFocusSessionInput
): Promise<FocusSession> {
  validateRequired(input.user_id, "user_id");
  validateEnum(input.status, FOCUS_STATUSES, "status");
  validateEnum(input.mode, FOCUS_MODES, "mode");

  if (input.planned_duration <= 0) {
    throw new Error("planned_duration must be positive");
  }

  const id = generateId();
  const timestamp = now();

  const session: FocusSession = {
    id,
    user_id: input.user_id,
    started_at: input.started_at,
    ended_at: null,
    planned_duration: input.planned_duration,
    actual_duration: null,
    status: input.status,
    mode: input.mode,
    metadata: input.metadata,
    created_at: timestamp,
    expires_at: input.expires_at || null,
    linked_library_id: input.linked_library_id || null,
  };

  await db
    .prepare(
      `INSERT INTO focus_sessions (
        id, user_id, started_at, ended_at, planned_duration,
        actual_duration, status, mode, metadata, created_at,
        expires_at, linked_library_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      session.id,
      session.user_id,
      session.started_at,
      session.ended_at,
      session.planned_duration,
      session.actual_duration,
      session.status,
      session.mode,
      session.metadata,
      session.created_at,
      session.expires_at,
      session.linked_library_id
    )
    .run();

  return session;
}

/**
 * Get a focus session by ID
 */
export async function getFocusSession(
  db: D1Database,
  id: string,
  userId: string
): Promise<FocusSession | null> {
  const result = await db
    .prepare("SELECT * FROM focus_sessions WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .first<FocusSession>();

  return result;
}

/**
 * Complete a focus session
 */
export async function completeFocusSession(
  db: D1Database,
  id: string,
  userId: string
): Promise<FocusSession | null> {
  const existing = await getFocusSession(db, id, userId);
  if (!existing || existing.status !== "active") return null;

  const endedAt = now();
  const startTime = new Date(existing.started_at).getTime();
  const endTime = new Date(endedAt).getTime();
  const actualDuration = Math.floor((endTime - startTime) / 1000);

  await db
    .prepare(
      `UPDATE focus_sessions SET
        ended_at = ?, actual_duration = ?, status = ?
      WHERE id = ? AND user_id = ?`
    )
    .bind(endedAt, actualDuration, "completed", id, userId)
    .run();

  return {
    ...existing,
    ended_at: endedAt,
    actual_duration: actualDuration,
    status: "completed",
  };
}

/**
 * Abandon a focus session
 */
export async function abandonFocusSession(
  db: D1Database,
  id: string,
  userId: string
): Promise<FocusSession | null> {
  const existing = await getFocusSession(db, id, userId);
  if (!existing || existing.status !== "active") return null;

  const endedAt = now();
  const startTime = new Date(existing.started_at).getTime();
  const endTime = new Date(endedAt).getTime();
  const actualDuration = Math.floor((endTime - startTime) / 1000);

  await db
    .prepare(
      `UPDATE focus_sessions SET
        ended_at = ?, actual_duration = ?, status = ?
      WHERE id = ? AND user_id = ?`
    )
    .bind(endedAt, actualDuration, "abandoned", id, userId)
    .run();

  return {
    ...existing,
    ended_at: endedAt,
    actual_duration: actualDuration,
    status: "abandoned",
  };
}

/**
 * Get active focus session for user
 * Also auto-abandons expired sessions
 */
export async function getActiveFocusSession(
  db: D1Database,
  userId: string
): Promise<FocusSession | null> {
  const result = await db
    .prepare(
      "SELECT * FROM focus_sessions WHERE user_id = ? AND status = 'active' LIMIT 1"
    )
    .bind(userId)
    .first<FocusSession>();

  if (!result) return null;

  // Check if session has expired
  if (result.expires_at) {
    const expiryTime = new Date(result.expires_at).getTime();
    if (Date.now() > expiryTime) {
      // Auto-abandon expired session
      await abandonFocusSession(db, result.id, userId);
      return null;
    }
  }

  return result;
}

/**
 * List focus sessions with pagination
 */
export interface ListFocusSessionsOptions extends PaginationOptions {
  status?: FocusSessionStatus;
  mode?: FocusMode;
  startDate?: string;
  endDate?: string;
}

export async function listFocusSessions(
  db: D1Database,
  userId: string,
  options: ListFocusSessionsOptions = {}
): Promise<PaginatedResult<FocusSession>> {
  const conditions = ["user_id = ?"];
  const params: unknown[] = [userId];

  if (options.status) {
    conditions.push("status = ?");
    params.push(options.status);
  }
  if (options.mode) {
    conditions.push("mode = ?");
    params.push(options.mode);
  }
  if (options.startDate) {
    conditions.push("started_at >= ?");
    params.push(options.startDate);
  }
  if (options.endDate) {
    conditions.push("started_at <= ?");
    params.push(options.endDate);
  }

  const whereClause = conditions.join(" AND ");
  const sql = `SELECT * FROM focus_sessions WHERE ${whereClause} ORDER BY started_at DESC`;
  const countSql = `SELECT COUNT(*) as count FROM focus_sessions WHERE ${whereClause}`;

  return paginatedQuery<FocusSession>(db, sql, countSql, params, options);
}

/**
 * Get focus session stats for a user
 */
export interface FocusStats {
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  totalFocusTime: number;
  averageSessionLength: number;
}

export async function getFocusStats(
  db: D1Database,
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<FocusStats> {
  const conditions = ["user_id = ?"];
  const params: unknown[] = [userId];

  if (startDate) {
    conditions.push("started_at >= ?");
    params.push(startDate);
  }
  if (endDate) {
    conditions.push("started_at <= ?");
    params.push(endDate);
  }

  const whereClause = conditions.join(" AND ");

  const result = await db
    .prepare(
      `SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
        SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) as abandoned_sessions,
        SUM(CASE WHEN status = 'completed' AND mode = 'focus' THEN actual_duration ELSE 0 END) as total_focus_time
      FROM focus_sessions WHERE ${whereClause}`
    )
    .bind(...params)
    .first<{
      total_sessions: number;
      completed_sessions: number;
      abandoned_sessions: number;
      total_focus_time: number;
    }>();

  const totalSessions = result?.total_sessions ?? 0;
  const completedSessions = result?.completed_sessions ?? 0;
  const totalFocusTime = result?.total_focus_time ?? 0;

  return {
    totalSessions,
    completedSessions,
    abandonedSessions: result?.abandoned_sessions ?? 0,
    totalFocusTime,
    averageSessionLength:
      completedSessions > 0 ? Math.floor(totalFocusTime / completedSessions) : 0,
  };
}

