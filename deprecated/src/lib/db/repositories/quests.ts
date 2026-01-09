/**
 * Quest Repository
 * CRUD operations for quests in D1
 */

import type { D1Database } from "@cloudflare/workers-types";
import type {
  Quest,
  QuestStatus,
  QuestPriority,
  CreateQuestInput,
  UpdateQuestInput,
} from "../types";
import {
  generateId,
  now,
  computeContentHash,
  validateRequired,
  validateEnum,
  paginatedQuery,
  type PaginatedResult,
  type PaginationOptions,
} from "../utils";

const QUEST_STATUSES: readonly QuestStatus[] = [
  "pending",
  "in-progress",
  "completed",
  "deferred",
  "cancelled",
];

const QUEST_PRIORITIES: readonly QuestPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

/**
 * Create a new quest
 */
export async function createQuest(
  db: D1Database,
  input: CreateQuestInput
): Promise<Quest> {
  validateRequired(input.title, "title");
  validateRequired(input.domain_id, "domain_id");
  validateEnum(input.status, QUEST_STATUSES, "status");
  validateEnum(input.priority, QUEST_PRIORITIES, "priority");

  const id = generateId();
  const timestamp = now();
  const contentHash = await computeContentHash({
    title: input.title,
    description: input.description,
    domain_id: input.domain_id,
    status: input.status,
    priority: input.priority,
    tags: input.tags,
    xp_value: input.xp_value,
  });

  const quest: Quest = {
    id,
    user_id: input.user_id,
    title: input.title,
    description: input.description,
    domain_id: input.domain_id,
    status: input.status,
    priority: input.priority,
    due_date: input.due_date,
    created_at: timestamp,
    updated_at: timestamp,
    completed_at: null,
    tags: input.tags,
    xp_value: input.xp_value,
    parent_id: input.parent_id,
    content_hash: contentHash,
  };

  await db
    .prepare(
      `INSERT INTO quests (
        id, user_id, title, description, domain_id, status, priority,
        due_date, created_at, updated_at, completed_at, tags, xp_value,
        parent_id, content_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      quest.id,
      quest.user_id,
      quest.title,
      quest.description,
      quest.domain_id,
      quest.status,
      quest.priority,
      quest.due_date,
      quest.created_at,
      quest.updated_at,
      quest.completed_at,
      quest.tags,
      quest.xp_value,
      quest.parent_id,
      quest.content_hash
    )
    .run();

  return quest;
}

/**
 * Get a quest by ID
 */
export async function getQuest(
  db: D1Database,
  id: string,
  userId: string
): Promise<Quest | null> {
  const result = await db
    .prepare("SELECT * FROM quests WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .first<Quest>();

  return result;
}

/**
 * Update a quest
 */
export async function updateQuest(
  db: D1Database,
  id: string,
  userId: string,
  input: UpdateQuestInput
): Promise<Quest | null> {
  const existing = await getQuest(db, id, userId);
  if (!existing) return null;

  if (input.status) {
    validateEnum(input.status, QUEST_STATUSES, "status");
  }
  if (input.priority) {
    validateEnum(input.priority, QUEST_PRIORITIES, "priority");
  }

  const updated: Quest = {
    ...existing,
    ...input,
    updated_at: now(),
    completed_at:
      input.status === "completed" && !existing.completed_at
        ? now()
        : existing.completed_at,
  };

  // Recompute content hash
  updated.content_hash = await computeContentHash({
    title: updated.title,
    description: updated.description,
    domain_id: updated.domain_id,
    status: updated.status,
    priority: updated.priority,
    tags: updated.tags,
    xp_value: updated.xp_value,
  });

  await db
    .prepare(
      `UPDATE quests SET
        title = ?, description = ?, status = ?, priority = ?,
        due_date = ?, updated_at = ?, completed_at = ?, tags = ?,
        xp_value = ?, parent_id = ?, content_hash = ?
      WHERE id = ? AND user_id = ?`
    )
    .bind(
      updated.title,
      updated.description,
      updated.status,
      updated.priority,
      updated.due_date,
      updated.updated_at,
      updated.completed_at,
      updated.tags,
      updated.xp_value,
      updated.parent_id,
      updated.content_hash,
      id,
      userId
    )
    .run();

  return updated;
}

/**
 * Delete a quest
 */
export async function deleteQuest(
  db: D1Database,
  id: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM quests WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .run();

  return result.meta.changes > 0;
}

/**
 * List quests with filtering and pagination
 */
export interface ListQuestsOptions extends PaginationOptions {
  status?: QuestStatus;
  priority?: QuestPriority;
  domainId?: string;
  parentId?: string | null;
}

export async function listQuests(
  db: D1Database,
  userId: string,
  options: ListQuestsOptions = {}
): Promise<PaginatedResult<Quest>> {
  const conditions = ["user_id = ?"];
  const params: unknown[] = [userId];

  if (options.status) {
    conditions.push("status = ?");
    params.push(options.status);
  }
  if (options.priority) {
    conditions.push("priority = ?");
    params.push(options.priority);
  }
  if (options.domainId) {
    conditions.push("domain_id = ?");
    params.push(options.domainId);
  }
  if (options.parentId !== undefined) {
    if (options.parentId === null) {
      conditions.push("parent_id IS NULL");
    } else {
      conditions.push("parent_id = ?");
      params.push(options.parentId);
    }
  }

  const whereClause = conditions.join(" AND ");
  const sql = `SELECT * FROM quests WHERE ${whereClause} ORDER BY created_at DESC`;
  const countSql = `SELECT COUNT(*) as count FROM quests WHERE ${whereClause}`;

  return paginatedQuery<Quest>(db, sql, countSql, params, options);
}

/**
 * Get quests due today or overdue
 */
export async function getDueQuests(
  db: D1Database,
  userId: string
): Promise<Quest[]> {
  const today = new Date().toISOString().split("T")[0];

  const result = await db
    .prepare(
      `SELECT * FROM quests 
       WHERE user_id = ? 
       AND status IN ('pending', 'in-progress')
       AND due_date <= ?
       ORDER BY due_date ASC, priority DESC`
    )
    .bind(userId, today)
    .all<Quest>();

  return result.results;
}

/**
 * Complete a quest and return XP earned
 */
export async function completeQuest(
  db: D1Database,
  id: string,
  userId: string
): Promise<{ quest: Quest; xpEarned: number } | null> {
  const quest = await updateQuest(db, id, userId, { status: "completed" });
  if (!quest) return null;

  return {
    quest,
    xpEarned: quest.xp_value,
  };
}

