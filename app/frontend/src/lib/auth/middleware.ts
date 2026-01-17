/**
 * Route Protection Middleware
 * 
 * Next.js middleware for protecting routes based on authentication.
 * This should be placed in the main middleware.ts file.
 */

import { type NextRequest, NextResponse } from 'next/server';

/**
 * Route configuration for protection
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/vault',
];

const ADMIN_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/settings',
];

const PUBLIC_ONLY_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
];

/**
 * Middleware to protect routes
 * 
 * Run this middleware on protected routes.
 * Add to middleware.ts:
 * 
 * ```ts
 * import { protectRoute } from '@/lib/auth/middleware';
 * 
 * export const middleware = protectRoute;
 * 
 * export const config = {
 *   matcher: [
 *     '/dashboard/:path*',
 *     '/profile/:path*',
 *     '/settings/:path*',
 *   ],
 * };
 * ```
 */
export function protectRoute(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires authentication
  const requiresAuth = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const requiresAdmin = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  // If public-only route and already authenticated, could redirect
  const isPublicOnly = PUBLIC_ONLY_ROUTES.some(route => pathname.startsWith(route));

  // Check session (stored in secure HTTP-only cookie)
  const hasSession = request.cookies.has('session');

  if (requiresAuth && !hasSession) {
    // Redirect to login, preserving return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (requiresAdmin && !hasSession) {
    // Redirect to login for admin routes
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

/**
 * Check if user is authenticated from request headers
 * (For server components that need to verify auth)
 */
export function isAuthenticatedFromRequest(request: NextRequest): boolean {
  return request.cookies.has('session');
}

/**
 * Get auth header for forwarding to backend API
 */
export function getAuthHeadersFromRequest(request: NextRequest): Record<string, string> {
  const authHeader = request.headers.get('authorization');
  return authHeader ? { 'authorization': authHeader } : {};
}

/**
 * Redirect to login with return path
 */
export function redirectToLogin(
  request: NextRequest,
  returnPath?: string
): NextResponse {
  const loginUrl = new URL('/login', request.url);
  if (returnPath) {
    loginUrl.searchParams.set('from', returnPath);
  } else {
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
  }
  return NextResponse.redirect(loginUrl);
}

/**
 * Set authentication error response
 */
export function authErrorResponse(
  status: number = 401,
  message: string = 'Unauthorized'
): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { 'content-type': 'application/json' },
    }
  );
}
