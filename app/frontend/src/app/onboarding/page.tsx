"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getOnboardingState, type OnboardingResponse } from "@/lib/api/onboarding";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { StatusToast } from "@/components/ui/StatusToast";
import styles from "./page.module.css";

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [onboarding, setOnboarding] = useState<OnboardingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    let isActive = true;

    const loadOnboarding = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getOnboardingState();
        if (!isActive) return;
        setOnboarding(data);

        if (data.state?.status === "completed") {
          router.replace("/today");
          return;
        }

        if (!data.needs_onboarding && data.state?.status !== "skipped") {
          router.replace("/today");
        }
      } catch (err) {
        if (!isActive) return;
        setError("Unable to load onboarding. Please refresh.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadOnboarding();

    return () => {
      isActive = false;
    };
  }, [isAuthLoading, isAuthenticated, router]);

  const hasFlowSteps = !!onboarding?.flow && onboarding.flow.total_steps > 0;
  const showStatus = isAuthLoading || isLoading || !!error || !hasFlowSteps;
  const statusTitle = error ? "Onboarding unavailable" : "Preparing onboarding";
  const statusBody = error
    ? "Please refresh to try again."
    : "Setting up your passkey and personalization steps.";

  return (
    <div className={styles.page}>
      <div className={styles.brand}>Ignition Onboarding</div>
      {showStatus && (
        <StatusToast
          title={statusTitle}
          message={statusBody}
          tone={error ? "error" : "info"}
          isLoading={!error}
          action={
            error
              ? {
                  label: "Refresh",
                  onClick: () => router.refresh(),
                }
              : undefined
          }
        />
      )}
      <OnboardingModal
        state={onboarding?.state ?? null}
        flow={onboarding?.flow ?? null}
        currentStep={onboarding?.current_step ?? null}
        allSteps={onboarding?.all_steps ?? []}
        needsOnboarding={onboarding?.needs_onboarding ?? true}
      />
    </div>
  );
}
