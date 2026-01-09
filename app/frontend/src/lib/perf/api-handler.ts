/**
 * API Route helper with built-in auth, timing, and memoization
 *
 * This module provides a wrapper for API routes that:
 * - Memoizes auth() and getCloudflareContext() per request
 * - Adds timing instrumentation when x-perf-debug=1
 * - Provides consistent error handling
 * - Returns Server-Timing headers for profiling
 */

import { NextRequest, NextResponse } from "next/server";
import type { D1Database } from "@cloudflare/workers-types";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ensureUserExists, type User } from "@/lib/db/repositories/users";

export interface APIContext {
  request: NextRequest;
  session: Session;
  db: D1Database;
  dbUser: User;
  perfDebug: boolean;
  timings: {
    start: number;
    auth_ms?: number;
    context_ms?: number;
    user_ms?: number;
  };
}

export type APIHandler<T = unknown> = (ctx: APIContext) => Promise<NextResponse<T>>;

interface CreateAPIHandlerOptions {
  /** Skip database requirement (for endpoints that work without D1) */
  skipDB?: boolean;
  /** Skip user existence check */
  skipUser?: boolean;
}

/**
 * Create an authenticated API handler with timing and memoization
 * The generic type is removed to allow flexible return types
 */
export function createAPIHandler(
  handler: (ctx: APIContext) => Promise<NextResponse>,
  options: CreateAPIHandlerOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = performance.now();
    const perfDebug = request.headers.get("x-perf-debug") === "1";
    const timings: APIContext["timings"] = { start: startTime };

    try {
      // 1. Auth check
      const authStart = performance.now();
      const session = await auth();
      timings.auth_ms = performance.now() - authStart;

      if (!session?.user?.id) {
        return createErrorResponse(401, "Unauthorized", perfDebug, timings);
      }

      // 2. Get Cloudflare context
      const ctxStart = performance.now();
      let db: D1Database | null = null;

      try {
        const cfContext = await getCloudflareContext({ async: true });
        db = (cfContext.env as unknown as { DB?: D1Database }).DB ?? null;
      } catch {
        // Fallback for local dev
        const env = (globalThis as unknown as { env?: { DB?: D1Database } }).env;
        db = env?.DB ?? null;
      }
      timings.context_ms = performance.now() - ctxStart;

      if (!db && !options.skipDB) {
        return createErrorResponse(503, "Database not available", perfDebug, timings);
      }

      // 3. Ensure user exists
      let dbUser: User | null = null;
      if (db && !options.skipUser) {
        const userStart = performance.now();
        dbUser = await ensureUserExists(db, session.user.id, {
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        });
        timings.user_ms = performance.now() - userStart;
      }

      // 4. Call handler
      const response = await handler({
        request,
        session,
        db: db!,
        dbUser: dbUser!,
        perfDebug,
        timings,
      });

      // Add Server-Timing header if debug enabled
      if (perfDebug) {
        const totalMs = performance.now() - startTime;
        const timing = buildServerTiming(timings, totalMs);
        response.headers.set("Server-Timing", timing);
      }

      return response;
    } catch (error) {
      console.error("API handler error:", error);
      return createErrorResponse(
        500,
        error instanceof Error ? error.message : "Internal server error",
        perfDebug,
        timings
      );
    }
  };
}

/**
 * Create an error response with optional timing headers
 */
function createErrorResponse(
  status: number,
  message: string,
  perfDebug: boolean,
  timings: APIContext["timings"]
): NextResponse {
  const response = NextResponse.json({ error: message }, { status });

  if (perfDebug) {
    const totalMs = performance.now() - timings.start;
    response.headers.set("Server-Timing", buildServerTiming(timings, totalMs));
  }

  return response;
}

/**
 * Build Server-Timing header value
 */
function buildServerTiming(timings: APIContext["timings"], totalMs: number): string {
  const parts: string[] = [];

  if (timings.auth_ms !== undefined) {
    parts.push(`auth;dur=${timings.auth_ms.toFixed(2)}`);
  }
  if (timings.context_ms !== undefined) {
    parts.push(`ctx;dur=${timings.context_ms.toFixed(2)}`);
  }
  if (timings.user_ms !== undefined) {
    parts.push(`user;dur=${timings.user_ms.toFixed(2)}`);
  }
  parts.push(`total;dur=${totalMs.toFixed(2)}`);

  return parts.join(", ");
}

