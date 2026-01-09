/**
 * Infobase Repository
 * CRUD operations for infobase entries in D1
 */

import type { D1Database } from "@cloudflare/workers-types";
import type {
  InfobaseEntry,
  CreateInfobaseEntryInput,
  UpdateInfobaseEntryInput,
} from "../types";
import {
  generateId,
  now,
  computeContentHash,
  validateRequired,
  boolToInt,
  paginatedQuery,
  type PaginatedResult,
  type PaginationOptions,
} from "../utils";

/**
 * Create a new infobase entry
 */
export async function createInfobaseEntry(
  db: D1Database,
  input: CreateInfobaseEntryInput
): Promise<InfobaseEntry> {
  validateRequired(input.title, "title");
  validateRequired(input.content, "content");

  const id = generateId();
  const timestamp = now();
  const contentHash = await computeContentHash({
    title: input.title,
    content: input.content,
    category: input.category,
    tags: input.tags,
  });

  const entry: InfobaseEntry = {
    id,
    user_id: input.user_id,
    title: input.title,
    content: input.content,
    category: input.category,
    tags: input.tags,
    pinned: input.pinned,
    created_at: timestamp,
    updated_at: timestamp,
    content_hash: contentHash,
  };

  await db
    .prepare(
      `INSERT INTO infobase_entries (
        id, user_id, title, content, category, tags, pinned,
        created_at, updated_at, content_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      entry.id,
      entry.user_id,
      entry.title,
      entry.content,
      entry.category,
      entry.tags,
      entry.pinned,
      entry.created_at,
      entry.updated_at,
      entry.content_hash
    )
    .run();

  return entry;
}

/**
 * Get an infobase entry by ID
 */
export async function getInfobaseEntry(
  db: D1Database,
  id: string,
  userId: string
): Promise<InfobaseEntry | null> {
  const result = await db
    .prepare("SELECT * FROM infobase_entries WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .first<InfobaseEntry>();

  return result;
}

/**
 * Update an infobase entry
 */
export async function updateInfobaseEntry(
  db: D1Database,
  id: string,
  userId: string,
  input: UpdateInfobaseEntryInput
): Promise<InfobaseEntry | null> {
  const existing = await getInfobaseEntry(db, id, userId);
  if (!existing) return null;

  const updated: InfobaseEntry = {
    ...existing,
    ...input,
    updated_at: now(),
  };

  // Recompute content hash
  updated.content_hash = await computeContentHash({
    title: updated.title,
    content: updated.content,
    category: updated.category,
    tags: updated.tags,
  });

  await db
    .prepare(
      `UPDATE infobase_entries SET
        title = ?, content = ?, category = ?, tags = ?,
        pinned = ?, updated_at = ?, content_hash = ?
      WHERE id = ? AND user_id = ?`
    )
    .bind(
      updated.title,
      updated.content,
      updated.category,
      updated.tags,
      updated.pinned,
      updated.updated_at,
      updated.content_hash,
      id,
      userId
    )
    .run();

  return updated;
}

/**
 * Delete an infobase entry
 */
export async function deleteInfobaseEntry(
  db: D1Database,
  id: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM infobase_entries WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .run();

  return result.meta.changes > 0;
}

/**
 * List infobase entries with filtering and pagination
 */
export interface ListInfobaseEntriesOptions extends PaginationOptions {
  category?: string;
  pinned?: boolean;
  search?: string;
}

export async function listInfobaseEntries(
  db: D1Database,
  userId: string,
  options: ListInfobaseEntriesOptions = {}
): Promise<PaginatedResult<InfobaseEntry>> {
  const conditions = ["user_id = ?"];
  const params: unknown[] = [userId];

  if (options.category) {
    conditions.push("category = ?");
    params.push(options.category);
  }
  if (options.pinned !== undefined) {
    conditions.push("pinned = ?");
    params.push(boolToInt(options.pinned));
  }
  if (options.search) {
    conditions.push("(title LIKE ? OR content LIKE ?)");
    const searchPattern = `%${options.search}%`;
    params.push(searchPattern, searchPattern);
  }

  const whereClause = conditions.join(" AND ");
  const sql = `SELECT * FROM infobase_entries WHERE ${whereClause} ORDER BY pinned DESC, updated_at DESC`;
  const countSql = `SELECT COUNT(*) as count FROM infobase_entries WHERE ${whereClause}`;

  return paginatedQuery<InfobaseEntry>(db, sql, countSql, params, options);
}

/**
 * Get all categories for a user
 */
export async function getCategories(
  db: D1Database,
  userId: string
): Promise<string[]> {
  const result = await db
    .prepare(
      `SELECT DISTINCT category FROM infobase_entries 
       WHERE user_id = ? AND category IS NOT NULL 
       ORDER BY category`
    )
    .bind(userId)
    .all<{ category: string }>();

  return result.results.map((r) => r.category);
}

/**
 * Toggle entry pinned status
 */
export async function toggleInfobaseEntryPinned(
  db: D1Database,
  id: string,
  userId: string
): Promise<InfobaseEntry | null> {
  const existing = await getInfobaseEntry(db, id, userId);
  if (!existing) return null;

  const newPinned = existing.pinned === 1 ? 0 : 1;

  await db
    .prepare(
      "UPDATE infobase_entries SET pinned = ?, updated_at = ? WHERE id = ? AND user_id = ?"
    )
    .bind(newPinned, now(), id, userId)
    .run();

  return {
    ...existing,
    pinned: newPinned,
    updated_at: now(),
  };
}

