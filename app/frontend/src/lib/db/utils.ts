/**
 * Repository utilities
 * Common helpers for D1 repositories
 */

import type { D1Database } from "@cloudflare/workers-types";

/**
 * Generate a unique ID
 * Uses crypto.randomUUID() for secure random IDs
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get current ISO timestamp
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Compute content hash for conflict detection
 * Uses a simple hash of the JSON-serialized content
 */
export async function computeContentHash(content: unknown): Promise<string> {
  const json = JSON.stringify(content);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Parse JSON safely from database column
 */
export function parseJSON<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Stringify value for JSON column
 */
export function toJSON(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

/**
 * Convert boolean to SQLite integer
 */
export function boolToInt(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Convert SQLite integer to boolean
 */
export function intToBool(value: number): boolean {
  return value === 1;
}

/**
 * Paginated query result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

/**
 * Get pagination SQL clauses
 */
export function getPaginationSQL(options: PaginationOptions): {
  limit: number;
  offset: number;
} {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE)
  );
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}

/**
 * Execute a query and return paginated results
 */
export async function paginatedQuery<T>(
  db: D1Database,
  sql: string,
  countSql: string,
  params: unknown[],
  options: PaginationOptions
): Promise<PaginatedResult<T>> {
  const { limit, offset } = getPaginationSQL(options);
  const page = Math.max(1, options.page ?? 1);

  // Get count
  const countResult = await db.prepare(countSql).bind(...params).first<{ count: number }>();
  const total = countResult?.count ?? 0;

  // Get data
  const paginatedSql = `${sql} LIMIT ? OFFSET ?`;
  const result = await db
    .prepare(paginatedSql)
    .bind(...params, limit, offset)
    .all<T>();

  return {
    data: result.results,
    total,
    page,
    pageSize: limit,
    hasMore: offset + result.results.length < total,
  };
}

/**
 * Validate required string field
 */
export function validateRequired(
  value: unknown,
  fieldName: string
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }
}

/**
 * Validate string max length
 */
export function validateMaxLength(
  value: string | null | undefined,
  maxLength: number,
  fieldName: string
): void {
  if (value && value.length > maxLength) {
    throw new Error(`${fieldName} must be at most ${maxLength} characters`);
  }
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fieldName: string
): asserts value is T {
  if (!allowed.includes(value as T)) {
    throw new Error(
      `${fieldName} must be one of: ${allowed.join(", ")}`
    );
  }
}

