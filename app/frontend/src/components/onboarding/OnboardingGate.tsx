"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";

/**
 * Public routes that don't require authentication
 * These paths are protected by middleware but don't require logged-in user
 */
const PUBLIC_ROUTES = new Set([
  "/",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/help",
  "/auth/signin",
  "/auth/signup",
  "/auth/callback",
  "/auth/error",
  "/pending-approval",
]);

function isPublicRoute(pathname: string): boolean {
  // Exact match
  if (PUBLIC_ROUTES.has(pathname)) {
    return true;
  }
  // Prefix match for routes with subpaths
  for (const route of PUBLIC_ROUTES) {
    if (pathname.startsWith(route + "/")) {
      return true;
    }
  }
  return false;
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = isPublicRoute(pathname);

  // If authenticated and on any public page (including auth pages), push into onboarding
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (isPublic) {
      router.replace("/onboarding");
    }
  }, [isLoading, isAuthenticated, user, router, isPublic]);

  // TOS should be handled as part of onboarding; if not accepted, push user into onboarding flow
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (!user.tosAccepted && pathname !== "/onboarding") {
      // Backend auto-accepts TOS on first authenticated request; refresh to get updated session
      refresh?.();
      router.replace("/onboarding");
    }
  }, [isLoading, isAuthenticated, user, pathname, router, refresh]);

  // For public routes, render immediately (don't wait for auth)
  if (isPublic) {
    return <>{children}</>;
  }

  // For protected routes, require authentication
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</div>
    );
  }

  if (!isAuthenticated || !user) {
    // Not authenticated - redirect to signin
    // The redirect will happen on next page load, for now show nothing
    return null;
  }

  return <>{children}</>;
}
