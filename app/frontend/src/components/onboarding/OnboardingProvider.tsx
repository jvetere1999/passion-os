/**
 * OnboardingProvider - DISABLED (2026-01-11)
 *
 * Onboarding modal feature has been disabled per user selection (Option C).
 * Users now add daily plan items manually instead of via guided onboarding.
 *
 * Component structure remains intact but always returns null.
 * Backend API still works for onboarding state management.
 * Can be re-enabled in the future if needed.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getOnboardingState, type OnboardingResponse } from "@/lib/api/onboarding";
import { OnboardingModal } from "./OnboardingModal";

export function OnboardingProvider() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [onboarding, setOnboarding] = useState<OnboardingResponse | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || checked) return;

    const checkOnboarding = async () => {
      try {
        const data = await getOnboardingState();
        setOnboarding(data);
      } catch (error) {
        console.error("Failed to load onboarding:", error);
      }
      setChecked(true);
    };

    checkOnboarding();
  }, [isLoading, isAuthenticated, checked]);

  // Don't render if not authenticated or still loading
  if (!isAuthenticated || !user) {
    return null;
  }

  // Don't render if we haven't checked yet
  if (!checked || !onboarding) {
    return null;
  }

  // Don't render if onboarding not needed
  if (!onboarding.needs_onboarding) {
    return null;
  }

  // Don't render if already completed or skipped
  if (onboarding.state?.status === "completed" || onboarding.state?.status === "skipped") {
    return null;
  }

  // Don't render if no flow
  if (!onboarding.flow) {
    return null;
  }

  // DISABLED (2026-01-11): Onboarding modal rendering intentionally disabled
  // Decision: Option C - Manual plan entry only
  // Rationale: Users prefer manual control over guided setup
  // The API returns data but we don't render the modal
  // Backend still manages onboarding state for analytics/tracking
  return null;
}

