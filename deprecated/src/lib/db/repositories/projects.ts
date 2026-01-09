/**
 * Projects Repository
 * CRUD operations for projects in D1
 */

import type { D1Database } from "@cloudflare/workers-types";
import type {
  Project,
  ProjectStatus,
  CreateProjectInput,
  UpdateProjectInput,
} from "../types";
import {
  generateId,
  now,
  computeContentHash,
  validateRequired,
  validateEnum,
  boolToInt,
  paginatedQuery,
  type PaginatedResult,
  type PaginationOptions,
} from "../utils";

const PROJECT_STATUSES: readonly ProjectStatus[] = [
  "active",
  "archived",
  "completed",
];

/**
 * Create a new project
 */
export async function createProject(
  db: D1Database,
  input: CreateProjectInput
): Promise<Project> {
  validateRequired(input.name, "name");
  validateEnum(input.status, PROJECT_STATUSES, "status");

  const id = generateId();
  const timestamp = now();
  const contentHash = await computeContentHash({
    name: input.name,
    description: input.description,
    notes: input.notes,
    tags: input.tags,
  });

  const project: Project = {
    id,
    user_id: input.user_id,
    name: input.name,
    description: input.description,
    notes: input.notes,
    status: input.status,
    starred: input.starred,
    tags: input.tags,
    created_at: timestamp,
    updated_at: timestamp,
    content_hash: contentHash,
  };

  await db
    .prepare(
      `INSERT INTO projects (
        id, user_id, name, description, notes, status, starred,
        tags, created_at, updated_at, content_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      project.id,
      project.user_id,
      project.name,
      project.description,
      project.notes,
      project.status,
      project.starred,
      project.tags,
      project.created_at,
      project.updated_at,
      project.content_hash
    )
    .run();

  return project;
}

/**
 * Get a project by ID
 */
export async function getProject(
  db: D1Database,
  id: string,
  userId: string
): Promise<Project | null> {
  const result = await db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .first<Project>();

  return result;
}

/**
 * Update a project
 */
export async function updateProject(
  db: D1Database,
  id: string,
  userId: string,
  input: UpdateProjectInput
): Promise<Project | null> {
  const existing = await getProject(db, id, userId);
  if (!existing) return null;

  if (input.status) {
    validateEnum(input.status, PROJECT_STATUSES, "status");
  }

  const updated: Project = {
    ...existing,
    ...input,
    updated_at: now(),
  };

  // Recompute content hash
  updated.content_hash = await computeContentHash({
    name: updated.name,
    description: updated.description,
    notes: updated.notes,
    tags: updated.tags,
  });

  await db
    .prepare(
      `UPDATE projects SET
        name = ?, description = ?, notes = ?, status = ?,
        starred = ?, tags = ?, updated_at = ?, content_hash = ?
      WHERE id = ? AND user_id = ?`
    )
    .bind(
      updated.name,
      updated.description,
      updated.notes,
      updated.status,
      updated.starred,
      updated.tags,
      updated.updated_at,
      updated.content_hash,
      id,
      userId
    )
    .run();

  return updated;
}

/**
 * Delete a project
 */
export async function deleteProject(
  db: D1Database,
  id: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM projects WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .run();

  return result.meta.changes > 0;
}

/**
 * List projects with filtering and pagination
 */
export interface ListProjectsOptions extends PaginationOptions {
  status?: ProjectStatus;
  starred?: boolean;
  search?: string;
}

export async function listProjects(
  db: D1Database,
  userId: string,
  options: ListProjectsOptions = {}
): Promise<PaginatedResult<Project>> {
  const conditions = ["user_id = ?"];
  const params: unknown[] = [userId];

  if (options.status) {
    conditions.push("status = ?");
    params.push(options.status);
  }
  if (options.starred !== undefined) {
    conditions.push("starred = ?");
    params.push(boolToInt(options.starred));
  }
  if (options.search) {
    conditions.push("(name LIKE ? OR description LIKE ?)");
    const searchPattern = `%${options.search}%`;
    params.push(searchPattern, searchPattern);
  }

  const whereClause = conditions.join(" AND ");
  const sql = `SELECT * FROM projects WHERE ${whereClause} ORDER BY starred DESC, updated_at DESC`;
  const countSql = `SELECT COUNT(*) as count FROM projects WHERE ${whereClause}`;

  return paginatedQuery<Project>(db, sql, countSql, params, options);
}

/**
 * Toggle project starred status
 */
export async function toggleProjectStarred(
  db: D1Database,
  id: string,
  userId: string
): Promise<Project | null> {
  const existing = await getProject(db, id, userId);
  if (!existing) return null;

  const newStarred = existing.starred === 1 ? 0 : 1;

  await db
    .prepare(
      "UPDATE projects SET starred = ?, updated_at = ? WHERE id = ? AND user_id = ?"
    )
    .bind(newStarred, now(), id, userId)
    .run();

  return {
    ...existing,
    starred: newStarred,
    updated_at: now(),
  };
}

