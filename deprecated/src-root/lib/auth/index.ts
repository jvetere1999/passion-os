/**
 * Auth module for Passion OS
 *
 * Backend-first authentication using the Rust backend at api.ecent.online.
 * Session management is handled via HttpOnly cookies set by the backend.
 *
 * This module provides:
 * - `auth()`: Get current session (server-side)
 * - `signIn()`: Redirect to OAuth sign-in
 * - `signOut()`: Sign out and destroy session
 * - `handlers`: Next.js API route handlers for auth callbacks
 */

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.ecent.online";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Extended session type to include user ID and approval status
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      approved?: boolean;
      ageVerified?: boolean;
    };
  }
  interface User {
    approved?: boolean;
    ageVerified?: boolean;
  }
}

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: string;
  entitlements: string[];
  age_verified: boolean;
  tos_accepted: boolean;
}

export interface Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    approved?: boolean;
    ageVerified?: boolean;
  };
  /** Session expiry time (ISO string) - for next-auth compatibility */
  expires: string;
}

interface BackendSessionResponse {
  user: SessionUser | null;
}

// ============================================================================
// SERVER-SIDE AUTH
// ============================================================================

/**
 * Get the current session from the backend.
 * 
 * This function fetches the session from the backend API using the
 * session cookie. It's designed for use in Server Components and
 * Server Actions.
 *
 * @returns Session object if authenticated, null otherwise
 */
export async function auth(): Promise<Session | null> {
  try {
    // Get cookies to forward to backend
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    // Get headers for potential CSRF checks
    const headersList = await headers();
    const origin = headersList.get("origin") || "";

    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader,
        "Origin": origin,
      },
      credentials: "include",
      // Don't cache session responses
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[auth] Failed to fetch session:", response.status);
      return null;
    }

    const data: BackendSessionResponse = await response.json();

    if (!data.user) {
      return null;
    }

    // Transform backend response to match next-auth Session type
    // Expires is set to 24 hours from now as a default
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    return {
      user: {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        image: data.user.image,
        approved: data.user.tos_accepted,
        ageVerified: data.user.age_verified,
      },
      expires,
    };
  } catch (error) {
    console.error("[auth] Error fetching session:", error);
    return null;
  }
}

/**
 * Alias for auth() - get the current session
 */
export const getSession = auth;

// ============================================================================
// SIGN IN / SIGN OUT
// ============================================================================

/**
 * Sign in with a provider
 * Redirects to the backend OAuth flow
 *
 * @param provider - OAuth provider (google, azure)
 * @param options - Optional redirect configuration
 */
export async function signIn(
  provider?: string,
  options?: { redirectTo?: string; redirect?: boolean }
): Promise<never> {
  const providerPath = provider === "azure" ? "azure" : "google";
  const callbackUrl = options?.redirectTo
    ? `?callbackUrl=${encodeURIComponent(options.redirectTo)}`
    : "";

  redirect(`${API_BASE_URL}/auth/signin/${providerPath}${callbackUrl}`);
}

/**
 * Sign out and destroy the session
 * Calls the backend signout endpoint and redirects
 *
 * @param options - Optional redirect configuration
 */
export async function signOut(
  options?: { redirectTo?: string }
): Promise<never> {
  // In a Server Action context, we'd POST to signout
  // For now, redirect to a page that will handle the signout
  const callbackUrl = options?.redirectTo
    ? `?callbackUrl=${encodeURIComponent(options.redirectTo)}`
    : "";

  redirect(`/auth/signout${callbackUrl}`);
}

// ============================================================================
// HANDLERS (for API routes)
// ============================================================================

/**
 * Next.js API route handlers for auth
 * 
 * Note: With backend-first auth, most auth is handled by the backend.
 * These handlers provide compatibility for any remaining Next.js auth routes.
 */
export const handlers = {
  GET: async () => {
    // Auth is handled by backend - redirect there
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${API_BASE_URL}/auth/providers`,
      },
    });
  },
  POST: async () => {
    // Auth is handled by backend
    return new Response(JSON.stringify({ error: "Use backend auth" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  },
};
