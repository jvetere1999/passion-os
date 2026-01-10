/**
 * Database client utilities (DEPRECATED)
 * 
 * This file is kept for type exports only during migration.
 * All data access must go through the Rust backend API at api.ecent.online.
 * 
 * DO NOT add new D1 functions. All new data operations must use the API client.
 */

/**
 * D1 result type (DEPRECATED - for type exports only)
 * @deprecated All data operations must use Rust backend API
 */
export interface D1Result {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
  };
}

