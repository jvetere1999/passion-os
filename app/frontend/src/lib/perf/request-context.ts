/**
 * Request-scoped context for memoization and timing
 *
 * This module provides request-level caching to avoid redundant work
 * within a single request lifecycle on Cloudflare Workers.
 *
 * Key features:
 * - Memoize expensive operations (auth, db context, user lookup)
 * - Track timing metrics for performance analysis
 * - Safe for concurrent requests (uses AsyncLocalStorage pattern)
 */

import type { D1Database } from "@cloudflare/workers-types";

/**
 * Timing metrics collected per request
 */
export interface RequestTimings {
  requestId: string;
  route: string;
  startTime: number;
  middleware_total_ms?: number;
  auth_parse_ms?: number;
  auth_verify_ms?: number;
  context_get_ms?: number;
  user_ensure_ms?: number;
  data_fetch_ms_total?: number;
  render_ms?: number;
  serialize_ms?: number;
  total_ms?: number;
  upstream_call_count: number;
  upstream_calls: Array<{
    endpoint: string;
    duration_ms: number;
    cached: boolean;
  }>;
}

/**
 * Request context holding memoized values
 */
export interface RequestContext {
  timings: RequestTimings;
  memoized: Map<string, unknown>;
  perfDebug: boolean;
}

// WeakMap keyed by request object for isolation
const requestContexts = new WeakMap<Request, RequestContext>();

/**
 * Initialize or get request context
 */
export function getRequestContext(request: Request): RequestContext {
  let ctx = requestContexts.get(request);
  if (!ctx) {
    const perfDebug = request.headers.get("x-perf-debug") === "1";
    ctx = {
      timings: {
        requestId: crypto.randomUUID().slice(0, 8),
        route: new URL(request.url).pathname,
        startTime: performance.now(),
        upstream_call_count: 0,
        upstream_calls: [],
      },
      memoized: new Map(),
      perfDebug,
    };
    requestContexts.set(request, ctx);
  }
  return ctx;
}

/**
 * Check if performance debug is enabled for this request
 */
export function isPerfDebugEnabled(request: Request): boolean {
  return request.headers.get("x-perf-debug") === "1";
}

/**
 * Record a timing metric
 */
export function recordTiming(
  request: Request,
  metric: keyof Omit<RequestTimings, "requestId" | "route" | "startTime" | "upstream_call_count" | "upstream_calls">,
  value: number
): void {
  const ctx = getRequestContext(request);
  // Safe cast through unknown for dynamic property access
  (ctx.timings as unknown as Record<string, number | undefined>)[metric] = value;
}

/**
 * Record an upstream call
 */
export function recordUpstreamCall(
  request: Request,
  endpoint: string,
  duration_ms: number,
  cached: boolean
): void {
  const ctx = getRequestContext(request);
  ctx.timings.upstream_call_count++;
  ctx.timings.upstream_calls.push({ endpoint, duration_ms, cached });
}

/**
 * Get a memoized value or compute it
 */
export async function memoize<T>(
  request: Request,
  key: string,
  compute: () => Promise<T>
): Promise<T> {
  const ctx = getRequestContext(request);

  if (ctx.memoized.has(key)) {
    return ctx.memoized.get(key) as T;
  }

  const value = await compute();
  ctx.memoized.set(key, value);
  return value;
}

/**
 * Get a memoized value synchronously or compute it
 */
export function memoizeSync<T>(
  request: Request,
  key: string,
  compute: () => T
): T {
  const ctx = getRequestContext(request);

  if (ctx.memoized.has(key)) {
    return ctx.memoized.get(key) as T;
  }

  const value = compute();
  ctx.memoized.set(key, value);
  return value;
}

/**
 * Finalize timing and get Server-Timing header value
 */
export function getServerTimingHeader(request: Request): string {
  const ctx = requestContexts.get(request);
  if (!ctx || !ctx.perfDebug) return "";

  const t = ctx.timings;
  t.total_ms = performance.now() - t.startTime;

  const parts: string[] = [];

  if (t.middleware_total_ms !== undefined) {
    parts.push(`mw;dur=${t.middleware_total_ms.toFixed(2)}`);
  }
  if (t.auth_parse_ms !== undefined) {
    parts.push(`auth-parse;dur=${t.auth_parse_ms.toFixed(2)}`);
  }
  if (t.auth_verify_ms !== undefined) {
    parts.push(`auth-verify;dur=${t.auth_verify_ms.toFixed(2)}`);
  }
  if (t.context_get_ms !== undefined) {
    parts.push(`ctx;dur=${t.context_get_ms.toFixed(2)}`);
  }
  if (t.user_ensure_ms !== undefined) {
    parts.push(`user;dur=${t.user_ensure_ms.toFixed(2)}`);
  }
  if (t.data_fetch_ms_total !== undefined) {
    parts.push(`data;dur=${t.data_fetch_ms_total.toFixed(2)}`);
  }
  if (t.render_ms !== undefined) {
    parts.push(`render;dur=${t.render_ms.toFixed(2)}`);
  }
  parts.push(`total;dur=${t.total_ms.toFixed(2)}`);
  parts.push(`calls;desc="${t.upstream_call_count}"`);

  return parts.join(", ");
}

/**
 * Get timing summary for JSON response
 */
export function getTimingSummary(request: Request): RequestTimings | null {
  const ctx = requestContexts.get(request);
  if (!ctx || !ctx.perfDebug) return null;

  ctx.timings.total_ms = performance.now() - ctx.timings.startTime;
  return ctx.timings;
}

/**
 * Time an async operation
 */
export async function timeAsync<T>(
  request: Request,
  metric: keyof Omit<RequestTimings, "requestId" | "route" | "startTime" | "upstream_call_count" | "upstream_calls">,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await operation();
  } finally {
    recordTiming(request, metric, performance.now() - start);
  }
}

/**
 * Time a sync operation
 */
export function timeSync<T>(
  request: Request,
  metric: keyof Omit<RequestTimings, "requestId" | "route" | "startTime" | "upstream_call_count" | "upstream_calls">,
  operation: () => T
): T {
  const start = performance.now();
  try {
    return operation();
  } finally {
    recordTiming(request, metric, performance.now() - start);
  }
}

// ============================================================
// Memoized wrappers for common operations
// ============================================================

/**
 * Memoized Cloudflare context getter
 * Avoids repeated getCloudflareContext() calls within a request
 */
let cachedCloudflareContext: { env: { DB?: D1Database } } | null = null;

export async function getMemoizedCloudflareContext(): Promise<{ env: { DB?: D1Database } }> {
  if (cachedCloudflareContext) {
    return cachedCloudflareContext;
  }

  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    cachedCloudflareContext = ctx as { env: { DB?: D1Database } };
    return cachedCloudflareContext;
  } catch {
    // Fallback for local dev
    const env = (globalThis as unknown as { env?: { DB?: D1Database } }).env;
    return { env: { DB: env?.DB } };
  }
}

/**
 * Get D1 database with memoization
 */
export async function getDB(): Promise<D1Database | null> {
  const ctx = await getMemoizedCloudflareContext();
  return ctx.env?.DB ?? null;
}

