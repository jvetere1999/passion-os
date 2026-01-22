"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getOnboardingState, type OnboardingResponse } from "@/lib/api/onboarding";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

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
  const statusTitle = error ? "Onboarding unavailable" : "Preparing your onboarding";
  const statusBody = error
    ? "Please refresh to try again."
    : "Setting up your passkey and personalization steps.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {showStatus && (
        <div className="text-center space-y-3 px-6">
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Onboarding</div>
          <h1 className="text-2xl font-semibold">{statusTitle}</h1>
          <p className="text-slate-400 text-sm">{statusBody}</p>
          {error && (
            <button
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
              onClick={() => router.refresh()}
              type="button"
            >
              Refresh
            </button>
          )}
        </div>
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
