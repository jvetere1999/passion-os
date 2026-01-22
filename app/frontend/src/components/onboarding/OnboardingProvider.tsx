/**
 * OnboardingProvider - ENABLED (2026-01-13)
 *
 * Ensures onboarding is initialized for new users and redirects to /onboarding
 * when required. The onboarding UI is rendered on the /onboarding route.
 */

"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getOnboardingState, startOnboarding, type OnboardingResponse } from "@/lib/api/onboarding";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnboardingRoute = pathname === "/onboarding";
  const { user, isAuthenticated, isLoading } = useAuth();
  const [onboarding, setOnboarding] = useState<OnboardingResponse | null>(null);
  const [checked, setChecked] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  useEffect(() => {
    const nextUserId = user?.id ?? null;
    if (nextUserId !== lastUserId) {
      setChecked(false);
      setOnboarding(null);
      setLastUserId(nextUserId);
    }
  }, [user?.id, lastUserId]);

  useEffect(() => {
    if (isOnboardingRoute) return;
    if (isLoading || !isAuthenticated || checked) return;
    if (!user || !user.approved) return;

    const checkOnboarding = async () => {
      try {
        let data = await getOnboardingState();

        // Ensure onboarding is initialized for first-time users
        if (data.needs_onboarding && (!data.state || !data.current_step)) {
          await startOnboarding();
          data = await getOnboardingState();
        }

        setOnboarding(data);
      } catch (error) {
        console.error("Failed to load onboarding:", error);
        try {
          await startOnboarding();
          const data = await getOnboardingState();
          setOnboarding(data);
        } catch (startError) {
          console.error("Failed to start onboarding:", startError);
        }
      }
      setChecked(true);
    };

    checkOnboarding();
  }, [isLoading, isAuthenticated, checked, user, isOnboardingRoute]);

  const needsRedirect =
    !isOnboardingRoute &&
    checked &&
    !!onboarding &&
    onboarding.needs_onboarding &&
    onboarding.state?.status !== "completed" &&
    !!onboarding.flow;

  useEffect(() => {
    if (needsRedirect) {
      router.replace("/onboarding");
    }
  }, [needsRedirect, router]);

  // Don't render if not authenticated or still loading
  if (!isAuthenticated || !user) {
    return children;
  }

  if (isOnboardingRoute) {
    return children;
  }

  return children;
}
