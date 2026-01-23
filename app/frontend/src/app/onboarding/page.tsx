"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { safeFetch, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getOnboardingState, startOnboarding, type OnboardingResponse } from "@/lib/api/onboarding";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { StatusToast } from "@/components/ui/StatusToast";
import styles from "./page.module.css";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, refresh } = useAuth();
  const [onboarding, setOnboarding] = useState<OnboardingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRead, setHasRead] = useState(false);
  const [isOldEnough, setIsOldEnough] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [tosError, setTosError] = useState<string | null>(null);

  const needsTos = !!user && !user.tosAccepted;

  useEffect(() => {
    // Always wait for auth loading to complete before proceeding
    if (isAuthLoading) return;
    
    // Redirect unauthenticated users to signin
    if (!isAuthenticated || !user) return;
    
    // If TOS not accepted, don't load onboarding yet - TOS modal will show
    if (!user.tosAccepted) return;

    let isActive = true;

    const loadOnboarding = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let data = await getOnboardingState();
        if (!isActive) return;
        
        // If we have a flow but no current step, initialize the onboarding
        if (data.flow && data.flow.total_steps > 0 && !data.current_step) {
          try {
            await startOnboarding();
            if (!isActive) return;
            // Reload the state after starting
            data = await getOnboardingState();
            if (!isActive) return;
          } catch (startErr) {
            console.error('[onboarding/page] Failed to start onboarding:', startErr);
            // Continue anyway, let the user see the onboarding state
          }
        }
        
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
        console.error('[onboarding/page] Failed to load onboarding:', err);
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
  }, [isAuthLoading, isAuthenticated, user?.tosAccepted, user?.id, router]);

  useEffect(() => {
    if (!hasRead || !isOldEnough) {
      setCanContinue(false);
      return;
    }
    const timer = window.setTimeout(() => setCanContinue(true), 250);
    return () => window.clearTimeout(timer);
  }, [hasRead, isOldEnough]);

  const acceptTos = async () => {
    if (!hasRead || !isOldEnough) {
      setTosError("Please confirm both checkboxes to continue.");
      return;
    }
    setIsAccepting(true);
    setTosError(null);
    try {
      console.log('[onboarding/page] Accepting TOS...');
      const response = await safeFetch(`${API_BASE_URL}/auth/accept-tos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accepted: true,
          version: "1.0",
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "Failed to accept Terms of Service.");
      }
      console.log('[onboarding/page] TOS accepted, refreshing session...');
      await refresh();
      console.log('[onboarding/page] Session refreshed, tosAccepted should be true');
    } catch (acceptError) {
      const message = acceptError instanceof Error ? acceptError.message : "Failed to accept Terms of Service.";
      console.error('[onboarding/page] TOS acceptance error:', message);
      setTosError(message);
    } finally {
      setIsAccepting(false);
    }
  };

  const hasFlowSteps = !!onboarding?.flow && onboarding.flow.total_steps > 0;
  const awaitingStep = !isLoading && !error && hasFlowSteps && !onboarding?.current_step;
  const showStatus = isAuthLoading || isLoading || !!error || !hasFlowSteps || awaitingStep;
  const statusTitle = error
    ? "Onboarding unavailable"
    : awaitingStep
    ? "Fetching your first step"
    : "Preparing onboarding";
  const statusBody = error
    ? "Please refresh to try again."
    : awaitingStep
    ? "If this takes too long, refresh."
    : "Setting up your passkey and personalization steps.";

  if (needsTos) {
    return (
      <div className={styles.page}>
        <div className={styles.brand}>Ignition Onboarding</div>
        <div className={styles.tosCard}>
          <div className={styles.tosHeader}>
            <span className={styles.tosEyebrow}>Required</span>
            <h1 className={styles.tosTitle}>Before we start</h1>
            <p className={styles.tosSubtitle}>
              Review the Terms of Service and confirm your age. This is required to unlock onboarding.
            </p>
          </div>

          <div className={styles.tosBody}>
            <p>
              Ignition is a focus workspace with secure passkey authentication. We keep your data private and
              never access your encryption keys.
            </p>
            <div className={styles.tosLinks}>
              <Link href="/terms">Read Terms of Service</Link>
              <Link href="/privacy">Read Privacy Policy</Link>
            </div>
          </div>

          <div className={styles.tosChecks}>
            <div className={styles.tosCheck} onClick={() => {
              setIsOldEnough(!isOldEnough);
              if (tosError) setTosError(null);
            }} role="button" tabIndex={0}>
              <input
                type="checkbox"
                checked={isOldEnough}
                onChange={(event) => {
                  event.stopPropagation();
                  setIsOldEnough(event.target.checked);
                  if (tosError) setTosError(null);
                }}
              />
              <span>I confirm that I am at least 16 years old.</span>
            </div>
            <div className={styles.tosCheck} onClick={() => {
              setHasRead(!hasRead);
              if (tosError) setTosError(null);
            }} role="button" tabIndex={0}>
              <input
                type="checkbox"
                checked={hasRead}
                onChange={(event) => {
                  event.stopPropagation();
                  setHasRead(event.target.checked);
                  if (tosError) setTosError(null);
                }}
              />
              <span>I have read and agree to the Terms of Service and Privacy Policy.</span>
            </div>
          </div>

          <div className={styles.tosActionRow}>
            {tosError && <p className={styles.tosError}>{tosError}</p>}
            <button
              className={styles.tosAction}
              type="button"
              onClick={acceptTos}
              disabled={isAccepting || !canContinue}
            >
              {isAccepting ? "Continuing..." : "Continue"}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
