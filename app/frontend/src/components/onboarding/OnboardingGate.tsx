"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { getOnboardingState } from "@/lib/api/onboarding";
import { StatusToast } from "@/components/ui/StatusToast";

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
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setNeedsOnboarding(null);
    }
  }, [isAuthenticated, user?.id]);

  // TOS should be handled as part of onboarding; if not accepted, push user into onboarding flow
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (!user.tosAccepted && pathname !== "/onboarding") {
      // Backend auto-accepts TOS on first authenticated request; refresh to get updated session
      refresh?.();
      router.replace("/onboarding");
    }
  }, [isLoading, isAuthenticated, user, pathname, router, refresh]);

  useEffect(() => {
    if (pathname !== "/onboarding") return;
    if (isLoading) return;
    if (isAuthenticated) return;
    const callbackUrl = encodeURIComponent("/onboarding");
    router.replace(`/auth/signin?callbackUrl=${callbackUrl}`);
  }, [isAuthenticated, isLoading, pathname, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (pathname === "/onboarding") return;
    let isActive = true;

    const checkOnboarding = async () => {
      try {
        const data = await getOnboardingState();
        if (!isActive) return;
        const requiresOnboarding =
          data.state?.status !== "completed" || data.needs_onboarding;
        setNeedsOnboarding(requiresOnboarding);
      } catch (error) {
        console.error("Failed to load onboarding state:", error);
        if (isActive) {
          setNeedsOnboarding(true);
        }
      }
    };

    checkOnboarding();

    return () => {
      isActive = false;
    };
  }, [isLoading, isAuthenticated, user, pathname]);

  useEffect(() => {
    if (needsOnboarding && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [needsOnboarding, pathname, router]);

  if (
    isAuthenticated &&
    !isLoading &&
    pathname !== "/onboarding" &&
    (needsOnboarding === null || needsOnboarding)
  ) {
    return null;
  }

  // For public routes, render immediately (don't wait for auth)
  if (isPublic) {
    return <>{children}</>;
  }

  // For protected routes, require authentication
  if (isLoading) {
    if (pathname === "/onboarding") {
      return <>{children}</>;
    }
    return (
      <StatusToast
        title="Checking session"
        message="Authenticating your account."
        tone="info"
        isLoading
      />
    );
  }

  if (!isAuthenticated || !user) {
    // Not authenticated - redirect to signin
    // The redirect will happen on next page load, for now show nothing
    return null;
  }

  return <>{children}</>;
}
