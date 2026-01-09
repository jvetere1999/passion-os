/**
 * Database client utilities for D1
 * Provides type-safe access to Cloudflare D1 bindings
 */

import type { D1Database } from "@cloudflare/workers-types";

/**
 * Get D1 database from Cloudflare environment
 * In Next.js with OpenNext, this is accessed via getRequestContext()
 */
export function getDB(): D1Database {
  // In Cloudflare Workers environment, DB is available via env
  // This will be properly wired up via OpenNext
  const env = (globalThis as unknown as { env?: { DB?: D1Database } }).env;

  if (!env?.DB) {
    throw new Error(
      "D1 Database not available. Ensure you are running in Cloudflare Workers environment."
    );
  }

  return env.DB;
}

/**
 * Execute a query with parameters
 * Wrapper for consistent error handling
 */
export async function query<T = unknown>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const result = await db.prepare(sql).bind(...params).all<T>();
    return result.results;
  } catch (error) {
    console.error("D1 Query Error:", { sql, error });
    throw error;
  }
}

/**
 * Execute a single query returning one result
 */
export async function queryOne<T = unknown>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  try {
    const result = await db.prepare(sql).bind(...params).first<T>();
    return result;
  } catch (error) {
    console.error("D1 Query Error:", { sql, error });
    throw error;
  }
}

/**
 * Execute a write operation (INSERT, UPDATE, DELETE)
 */
export async function execute(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Result> {
  try {
    const result = await db.prepare(sql).bind(...params).run();
    return result;
  } catch (error) {
    console.error("D1 Execute Error:", { sql, error });
    throw error;
  }
}

/**
 * D1 result type for write operations
 */
export interface D1Result {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
  };
}

/**
 * Batch execute multiple statements in a transaction
 */
export async function batch(
  db: D1Database,
  statements: Array<{ sql: string; params?: unknown[] }>
): Promise<D1Result[]> {
  try {
    const prepared = statements.map(({ sql, params = [] }) =>
      db.prepare(sql).bind(...params)
    );
    const results = await db.batch(prepared);
    return results as unknown as D1Result[];
  } catch (error) {
    console.error("D1 Batch Error:", error);
    throw error;
  }
}

