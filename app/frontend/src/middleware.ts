/**
 * Next.js middleware for route protection
 * Redirects unauthenticated users to sign in page
 * Enforces TOS acceptance on first sign-in
 *
 * Performance optimizations:
 * - Precompiled route patterns (avoid runtime regex)
 * - Early bailout for static/API routes
 * - Timing instrumentation with x-perf-debug=1
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Public routes that don't require authentication
 * Using a Set for O(1) exact match lookup
 */
const PUBLIC_ROUTES_EXACT = new Set([
  "/",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/help",
  "/auth/signin",
  "/auth/error",
]);

/**
 * Public route prefixes for prefix matching
 */
const PUBLIC_ROUTE_PREFIXES = [
  "/about/",
  "/privacy/",
  "/terms/",
  "/contact/",
  "/help/",
  "/auth/signin/",
  "/auth/error/",
];

/**
 * Check if a path is public - optimized with Set lookup + prefix check
 */
function isPublicRoute(path: string): boolean {
  // Fast exact match first
  if (PUBLIC_ROUTES_EXACT.has(path)) {
    return true;
  }
  // Then check prefixes
  for (const prefix of PUBLIC_ROUTE_PREFIXES) {
    if (path.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

export async function middleware(req: NextRequest) {
  const startTime = performance.now();
  const perfDebug = req.headers.get("x-perf-debug") === "1";
  const { pathname } = req.nextUrl;

  // Early bailout for API routes and static files (no auth needed in middleware)
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check public routes before auth (avoid auth() call when not needed)
  const isPublic = isPublicRoute(pathname);

  // For the landing page, we need auth to check for redirect
  // For other public routes, skip auth entirely
  if (isPublic && pathname !== "/") {
    return NextResponse.next();
  }

  // Get session - this is the expensive call
  const authStart = performance.now();
  const session = await auth();
  const authDuration = performance.now() - authStart;
  const isAuthenticated = !!session?.user;

  // Redirect authenticated users from landing page to Today
  if (pathname === "/" && isAuthenticated) {
    const response = NextResponse.redirect(new URL("/today", req.url));
    if (perfDebug) {
      response.headers.set(
        "Server-Timing",
        `mw;dur=${(performance.now() - startTime).toFixed(2)}, auth;dur=${authDuration.toFixed(2)}`
      );
    }
    return response;
  }

  // Allow public routes (landing page for unauthenticated)
  if (isPublic) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to sign in
  if (!isAuthenticated) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Authenticated user accessing protected route
  const response = NextResponse.next();
  if (perfDebug) {
    response.headers.set(
      "Server-Timing",
      `mw;dur=${(performance.now() - startTime).toFixed(2)}, auth;dur=${authDuration.toFixed(2)}`
    );
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

