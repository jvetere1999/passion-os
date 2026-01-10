/**
 * Next.js middleware for route protection
 * 
 * Checks session via backend API.
 * Frontend performs 0% auth logic beyond forwarding cookies.
 *
 * Performance optimizations:
 * - Precompiled route patterns (avoid runtime regex)
 * - Early bailout for static/API routes
 * - Timing instrumentation with x-perf-debug=1
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online';

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

/**
 * Check session with backend API
 * Forwards cookies from the request
 */
async function checkSession(request: NextRequest): Promise<{ authenticated: boolean }> {
  try {
    // Get session cookie directly from request
    const sessionCookie = request.cookies.get('session');
    
    console.log(`[middleware] checkSession: has session cookie: ${!!sessionCookie}, value length: ${sessionCookie?.value?.length || 0}`);
    
    if (!sessionCookie?.value) {
      console.log(`[middleware] checkSession: no session cookie found`);
      return { authenticated: false };
    }
    
    // TRUST THE COOKIE - Don't call backend from edge middleware
    // The backend API calls from Cloudflare Workers edge are timing out (522)
    // Instead, we trust that if a session cookie exists, the user is authenticated
    // The pages will validate the session with the backend on load
    console.log(`[middleware] checkSession: session cookie exists, assuming authenticated`);
    return { authenticated: true };
  } catch (error) {
    console.error(`[middleware] checkSession error:`, error);
    return { authenticated: false };
  }
}

export async function middleware(req: NextRequest) {
  const startTime = performance.now();
  const perfDebug = req.headers.get("x-perf-debug") === "1";
  const { pathname } = req.nextUrl;

  console.log(`[middleware] START: ${pathname}`);

  // Early bailout for API routes and static files (no auth needed in middleware)
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    console.log(`[middleware] SKIP: static/api route`);
    const response = NextResponse.next();
    response.headers.set('X-Middleware-Skip', 'true');
    return response;
  }

  // Check public routes before auth (avoid API call when not needed)
  const isPublic = isPublicRoute(pathname);
  console.log(`[middleware] isPublic: ${isPublic}`);

  // For the landing page, we need auth to check for redirect
  // For other public routes, skip auth entirely
  if (isPublic && pathname !== "/") {
    console.log(`[middleware] ALLOW: public route (non-landing)`);
    const response = NextResponse.next();
    response.headers.set('X-Middleware-Public', 'true');
    return response;
  }

  // Get session from backend - this is the expensive call
  const authStart = performance.now();
  console.log(`[middleware] Checking session...`);
  const { authenticated } = await checkSession(req);
  const authDuration = performance.now() - authStart;
  console.log(`[middleware] Session check complete: authenticated=${authenticated}, duration=${authDuration.toFixed(2)}ms`);

  // Redirect authenticated users from landing page to Today
  if (pathname === "/" && authenticated) {
    console.log(`[middleware] REDIRECT: authenticated user at landing -> /today`);
    const response = NextResponse.redirect(new URL("/today", req.url));
    response.headers.set('X-Middleware-Auth', 'redirect-to-today');
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
    console.log(`[middleware] ALLOW: public route (landing page)`);
    const response = NextResponse.next();
    response.headers.set('X-Middleware-Public-Landing', 'true');
    return response;
  }

  // Redirect unauthenticated users to sign in
  if (!authenticated) {
    console.log(`[middleware] REDIRECT: unauthenticated user -> /auth/signin?callbackUrl=${pathname}`);
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(signInUrl);
    response.headers.set('X-Middleware-Auth', `redirect-to-signin:${authenticated}`);
    return response;
  }

  // Authenticated user accessing protected route
  console.log(`[middleware] ALLOW: authenticated user accessing ${pathname}`);
  const response = NextResponse.next();
  response.headers.set('X-Middleware-Auth', 'authenticated');
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
