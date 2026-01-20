/**
 * OnboardingProvider - ENABLED (2026-01-13)
 *
 * Onboarding modal feature is enabled and provides guided setup for new users.
 * Displays onboarding flow when conditions are met (new user, active onboarding state).
 *
 * Backend API: GET /api/onboarding/state, POST /api/onboarding/step
 * Context provides: isVisible, currentStep, completeStep, skipOnboarding
 * Modal renders within context when all validation passes.
 */

"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getOnboardingState, type OnboardingResponse } from "@/lib/api/onboarding";
import { OnboardingModal } from "./OnboardingModal";

interface OnboardingContextType {
  isVisible: boolean;
  currentStep: unknown; // OnboardingStep or null
  currentStepIndex: number;
  completeStep: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [onboarding, setOnboarding] = useState<OnboardingResponse | null>(null);
  const [checked, setChecked] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

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

  const handleCompleteStep = useCallback(async () => {
    if (!onboarding?.flow) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < onboarding.flow.total_steps) {
      setCurrentStepIndex(nextIndex);
    } else {
      // All steps completed
      await handleSkipOnboarding();
    }
  }, [onboarding, currentStepIndex]);

  const handleSkipOnboarding = useCallback(async () => {
    try {
      await getOnboardingState(); // Mark as skipped via API call
      setOnboarding(null);
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
    }
  }, []);

  // Don't render if not authenticated or still loading
  if (!isAuthenticated || !user) {
    return children;
  }

  // Don't render if we haven't checked yet
  if (!checked || !onboarding) {
    return children;
  }

  // Don't render if onboarding not needed
  if (!onboarding.needs_onboarding) {
    return children;
  }

  // Don't render if already completed or skipped
  if (onboarding.state?.status === "completed" || onboarding.state?.status === "skipped") {
    return children;
  }

  // Don't render if no flow
  if (!onboarding.flow) {
    return children;
  }

  // Provide context to children - modal will render based on context state
  return (
    <OnboardingContext.Provider
      value={{
        isVisible: true,
        currentStep: onboarding.current_step || null,
        currentStepIndex,
        completeStep: handleCompleteStep,
        skipOnboarding: handleSkipOnboarding,
      }}
    >
      {children}
      <OnboardingModal
        initialState={onboarding.state as any || null}
        flow={onboarding.flow as any || null}
        userId={user.id}
      />
    </OnboardingContext.Provider>
  );
}

