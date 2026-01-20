"use client";

import { useSession, signIn, signOut } from "next-auth/react";

/**
 * Custom hook for session management
 * Provides typed access to session and auth actions
 */
export function useAuth() {
  const { data: session, status } = useSession();

  return {
    // Session data
    session,
    user: session?.user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",

    // Auth actions
signIn: (provider?: string) => signIn(provider, { callbackUrl: "/today" }),
    signOut: () => signOut({ callbackUrl: "/" }),
  };
}

/**
 * Hook that requires authentication
 * Redirects to sign in if not authenticated
 */
export function useRequireAuth() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  if (!isLoading && !isAuthenticated) {
    signIn();
  }

  return {
    isLoading,
    user: session?.user ?? null,
    isAuthenticated,
  };
}

