"use client";

/**
 * OnboardingModal - Guided first-run tutorial
 * Data-driven, versioned, resumable onboarding flow
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { safeFetch, API_BASE_URL } from "@/lib/api";
import {
  startOnboarding,
  completeStep as apiCompleteStep,
} from "@/lib/api/onboarding";
import { useRouter } from "next/navigation";
import {
  isWebAuthnSupported,
  normalizeCreationOptions,
  serializeAttestationResponse,
} from "@/lib/auth/webauthn";
import styles from "./OnboardingModal.module.css";

interface OnboardingStep {
  id: string;
  step_type: string;
  title: string;
  description: string | null;
  target_selector: string | null;
  target_route: string | null;
  fallback_content?: string | null;
  options?: unknown | null;
  allows_multiple?: boolean;
  required?: boolean;
  action_type?: string | null;
  action_config?: unknown | null;
}

interface OnboardingState {
  status: string;
  can_resume?: boolean;
  started_at?: string | null;
  completed_at?: string | null;
  skipped_at?: string | null;
}

interface OnboardingFlow {
  id: string;
  name: string;
  total_steps: number;
}

interface OnboardingStepSummary {
  id: string;
  order: number;
  step_type: string;
  title: string;
}

interface OnboardingModalProps {
  state: OnboardingState | null;
  flow: OnboardingFlow | null;
  currentStep: OnboardingStep | null;
  allSteps: OnboardingStepSummary[];
  needsOnboarding: boolean;
}

// Interest options
const INTEREST_OPTIONS = [
  { key: "focus", label: "Focus Sessions", description: "Deep work blocks" },
  { key: "learning", label: "Learning", description: "Music theory & ear training" },
  { key: "music", label: "Music/DAW", description: "Production shortcuts & tips" },
  { key: "fitness", label: "Fitness", description: "Workouts & exercise" },
  { key: "habits", label: "Habit Building", description: "Daily routines" },
  { key: "creativity", label: "Creativity", description: "Ideas & brainstorming" },
];

// Module weight options
const MODULE_OPTIONS = [
  { key: "focus", label: "Focus", description: "Deep work sessions" },
  { key: "quests", label: "Quests", description: "Quick tasks" },
  { key: "ignitions", label: "Ignitions", description: "Start suggestions" },
  { key: "learn", label: "Learn", description: "Lessons & drills" },
  { key: "ideas", label: "Ideas", description: "Capture thoughts" },
  { key: "wins", label: "Wins", description: "Recent completions" },
  { key: "plan", label: "Planner", description: "Daily planning" },
];

// Nudge intensity options
const NUDGE_OPTIONS = [
  { key: "gentle", label: "Gentle", description: "Minimal prompts, soft suggestions" },
  { key: "standard", label: "Standard", description: "Balanced guidance" },
  { key: "energetic", label: "Energetic", description: "More frequent nudges" },
];

// WebAuthn setup status tracking
interface WebAuthnStatus {
  isRegistering: boolean;
  isSupported: boolean;
  error: string | null;
  success: boolean;
}

// Focus duration options
const FOCUS_DURATIONS = [
  { minutes: 5, label: "5 min", description: "Quick start" },
  { minutes: 10, label: "10 min", description: "Short session" },
  { minutes: 25, label: "25 min", description: "Pomodoro" },
  { minutes: 45, label: "45 min", description: "Deep work" },
];

export function OnboardingModal({ state, flow, currentStep: initialStep, allSteps, needsOnboarding }: OnboardingModalProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stepData, setStepData] = useState<Record<string, unknown>>({});
  const [activeStep, setActiveStep] = useState<OnboardingStep | null>(initialStep);
  const [stepCache, setStepCache] = useState<Record<string, OnboardingStep>>({});

  // Choice selections
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<Record<string, number>>({});
  const [selectedNudge, setSelectedNudge] = useState<string>("standard");
  const [selectedFocusDuration, setSelectedFocusDuration] = useState<number>(25);
  const [gamificationVisible, setGamificationVisible] = useState<boolean>(true);
  const [webauthnStatus, setWebauthnStatus] = useState<WebAuthnStatus>({
    isRegistering: false,
    isSupported: isWebAuthnSupported(),
    error: null,
    success: false,
  });
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);

  const totalSteps = useMemo(() => {
    if (flow?.total_steps) return flow.total_steps;
    return allSteps.length;
  }, [flow?.total_steps, allSteps.length]);

  useEffect(() => {
    setRecoveryCodes(null);
    setRecoveryError(null);
    setIsGeneratingCodes(false);
  }, [activeStep?.id]);

  const generateRecoveryCodes = useCallback(async () => {
    if (isGeneratingCodes) return;
    setIsGeneratingCodes(true);
    setRecoveryError(null);
    try {
      const response = await safeFetch(`${API_BASE_URL}/auth/recovery/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 8 }),
      });
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(error.message || "Failed to generate recovery codes");
      }
      const data = (await response.json()) as { codes: string[] };
      setRecoveryCodes(data.codes);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate recovery codes";
      setRecoveryError(message);
    } finally {
      setIsGeneratingCodes(false);
    }
  }, [isGeneratingCodes]);

  const startOnboardingFlow = useCallback(async () => {
    try {
      const result = await startOnboarding();
      if (result.current_step) {
        setActiveStep(result.current_step as OnboardingStep);
        setStepCache((prev) => ({ ...prev, [result.current_step!.id]: result.current_step as OnboardingStep }));
        const stepIndex = allSteps.findIndex((s) => s.id === result.current_step!.id);
        if (stepIndex >= 0) {
          setCurrentStepIndex(stepIndex);
        }
      }
    } catch (error) {
      console.error("Failed to start onboarding:", error);
    }
  }, [allSteps]);

  // Determine if we should show onboarding
  useEffect(() => {
    if (!flow || totalSteps === 0 || !needsOnboarding) {
      setIsVisible(false);
      return;
    }

    // Show if no state exists (new user) or if not completed
    if (!state) {
      setIsVisible(true);
      startOnboardingFlow();
    } else if (state.status !== "completed") {
      setIsVisible(true);
      if (initialStep) {
        setActiveStep(initialStep);
        setStepCache((prev) => ({ ...prev, [initialStep.id]: initialStep }));
        const stepIndex = allSteps.findIndex((s) => s.id === initialStep.id);
        if (stepIndex >= 0) {
          setCurrentStepIndex(stepIndex);
        }
      } else {
        startOnboardingFlow();
      }
    }
  }, [allSteps, initialStep, flow, needsOnboarding, startOnboardingFlow, state, totalSteps]);

  const currentStepData = activeStep;
  const currentStep = currentStepData;
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  const completeStep = useCallback(async (data?: Record<string, unknown>) => {
    if (!currentStepData) return;

    setIsLoading(true);
    try {
      const result = await apiCompleteStep(currentStepData.id, data || stepData);

      // Move to next step or complete
      if (result.next_step) {
        setStepCache((prev) => ({ ...prev, [result.next_step!.id]: result.next_step as OnboardingStep }));
        const nextIndex = allSteps.findIndex((s) => s.id === result.next_step!.id);
        if (nextIndex >= 0) {
          setCurrentStepIndex(nextIndex);
        }
        setActiveStep(result.next_step as OnboardingStep);
        setStepData({});
      } else {
        // Onboarding complete
        setIsVisible(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to complete step:", error);
    } finally {
      setIsLoading(false);
    }
  }, [allSteps, currentStepData, router, stepData]);

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      const previousIndex = currentStepIndex - 1;
      const previousStepId = allSteps[previousIndex]?.id;
      const previousStep = previousStepId ? stepCache[previousStepId] : null;
      if (previousStep) {
        setCurrentStepIndex(previousIndex);
        setActiveStep(previousStep);
      }
    }
  }, [allSteps, currentStepIndex, stepCache]);

  // Handle WebAuthn passkey registration
  const registerPasskey = useCallback(async () => {
    if (!webauthnStatus.isSupported) {
      setWebauthnStatus(prev => ({
        ...prev,
        error: "WebAuthn is not supported on your device"
      }));
      return;
    }

    setWebauthnStatus(prev => ({ ...prev, isRegistering: true, error: null }));

    try {
      // Get registration options from backend
      const optionsResponse = await safeFetch(`${API_BASE_URL}/auth/webauthn/register-options`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!optionsResponse.ok) {
        throw new Error("Failed to get registration options");
      }

      const data = (await optionsResponse.json()) as any;
      const options = normalizeCreationOptions(data.options || data);

      const credential = (await navigator.credentials.create({
        publicKey: options,
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error("Passkey creation cancelled");
      }

      const payload = serializeAttestationResponse(credential);

      const verifyResponse = await safeFetch(`${API_BASE_URL}/auth/webauthn/register-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: payload }),
      });

      if (!verifyResponse.ok) {
        const error = (await verifyResponse.json().catch(() => ({}))) as any;
        throw new Error(error.message || "Failed to register passkey");
      }

      setWebauthnStatus(prev => ({
        ...prev,
        isRegistering: false,
        success: true,
        error: null,
      }));
      await generateRecoveryCodes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to register passkey";
      console.error("[WebAuthn] Registration error:", error);
      setWebauthnStatus(prev => ({
        ...prev,
        isRegistering: false,
        error: message,
        success: false,
      }));
    }
  }, [webauthnStatus.isSupported, generateRecoveryCodes]);

  // Handle interest selection
  const toggleInterest = (key: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), key];
      }
      return [...prev, key];
    });
  };

  // Handle module weight
  const toggleModule = (key: string) => {
    setSelectedModules(prev => {
      const newModules = { ...prev };
      if (newModules[key]) {
        delete newModules[key];
      } else {
        newModules[key] = 1;
      }
      return newModules;
    });
  };

  // Render step content based on type
  const renderStepContent = () => {
    if (!currentStep) return null;

    const stepType = currentStep.step_type;

    switch (stepType) {
      case "explain":
        return (
          <div className={styles.explainStep}>
            <div className={styles.stepIcon}>
              {getStepIcon(currentStep.id)}
            </div>
            <p className={styles.stepDescription}>{currentStep.description}</p>
          </div>
        );

      case "tour":
        return (
          <div className={styles.tourStep}>
            <div className={styles.tourTarget}>
              {currentStep.target_route && (
                <span className={styles.routeHint}>
                  Navigate to: {currentStep.target_route}
                </span>
              )}
            </div>
            <p className={styles.stepDescription}>{currentStep.description}</p>
          </div>
        );

      case "choice":
        // Determine which choice type based on step ID
        if (currentStep.id.includes("interest")) {
          return (
            <div className={styles.choiceStep}>
              <p className={styles.choiceHint}>Select up to 3 interests</p>
              <div className={styles.optionGrid}>
                {INTEREST_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    className={`${styles.optionCard} ${selectedInterests.includes(opt.key) ? styles.selected : ""}`}
                    onClick={() => toggleInterest(opt.key)}
                  >
                    <span className={styles.optionLabel}>{opt.label}</span>
                    <span className={styles.optionDesc}>{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div className={styles.choiceStep}>
            <p className={styles.stepDescription}>{currentStep.description}</p>
          </div>
        );

      case "preference":
        // Determine which preference type
        if (currentStep.id.includes("module")) {
          return (
            <div className={styles.preferenceStep}>
              <p className={styles.choiceHint}>Choose modules to show on Today</p>
              <div className={styles.optionGrid}>
                {MODULE_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    className={`${styles.optionCard} ${selectedModules[opt.key] ? styles.selected : ""}`}
                    onClick={() => toggleModule(opt.key)}
                  >
                    <span className={styles.optionLabel}>{opt.label}</span>
                    <span className={styles.optionDesc}>{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        }
        if (currentStep.id.includes("nudge")) {
          return (
            <div className={styles.preferenceStep}>
              <div className={styles.nudgeOptions}>
                {NUDGE_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    className={`${styles.nudgeCard} ${selectedNudge === opt.key ? styles.selected : ""}`}
                    onClick={() => setSelectedNudge(opt.key)}
                  >
                    <span className={styles.nudgeLabel}>{opt.label}</span>
                    <span className={styles.nudgeDesc}>{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        }
        if (currentStep.id.includes("focus")) {
          return (
            <div className={styles.preferenceStep}>
              <div className={styles.durationOptions}>
                {FOCUS_DURATIONS.map(opt => (
                  <button
                    key={opt.minutes}
                    className={`${styles.durationCard} ${selectedFocusDuration === opt.minutes ? styles.selected : ""}`}
                    onClick={() => setSelectedFocusDuration(opt.minutes)}
                  >
                    <span className={styles.durationValue}>{opt.label}</span>
                    <span className={styles.durationDesc}>{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        }
        if (currentStep.id.includes("gamification")) {
          return (
            <div className={styles.preferenceStep}>
              <div className={styles.toggleOptions}>
                <button
                  className={`${styles.toggleCard} ${gamificationVisible ? styles.selected : ""}`}
                  onClick={() => setGamificationVisible(true)}
                >
                  <span className={styles.toggleLabel}>Always Show</span>
                  <span className={styles.toggleDesc}>See points, levels, and achievements</span>
                </button>
                <button
                  className={`${styles.toggleCard} ${!gamificationVisible ? styles.selected : ""}`}
                  onClick={() => setGamificationVisible(false)}
                >
                  <span className={styles.toggleLabel}>Subtle</span>
                  <span className={styles.toggleDesc}>Minimal visibility, background tracking</span>
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className={styles.preferenceStep}>
            <p className={styles.stepDescription}>{currentStep.description}</p>
          </div>
        );

      case "action":
        // Check if this is a WebAuthn action
        if (currentStep.id.includes("webauthn") || currentStep.id.includes("passkey")) {
          return (
            <div className={styles.actionStep}>
              <div className={styles.stepIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1v6m0 6v6" />
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M7 14h10" />
                </svg>
              </div>
              <p className={styles.stepDescription}>
                {currentStep.description || "Set up a passkey to secure your account and enable fast login"}
              </p>
              {!webauthnStatus.isSupported && (
                <div className={styles.errorMessage}>
                  WebAuthn is not supported on your device. You can set this up later.
                </div>
              )}
              {webauthnStatus.error && (
                <div className={styles.errorMessage}>
                  {webauthnStatus.error}
                </div>
              )}
              {webauthnStatus.success && (
                <div className={styles.successMessage}>
                  ✓ Passkey registered successfully!
                </div>
              )}
              {webauthnStatus.success && (
                <div className={styles.recoveryCodesPanel}>
                  <p className={styles.recoveryCodesTitle}>Save your recovery codes</p>
                  {recoveryCodes ? (
                    <div className={styles.recoveryCodesList}>
                      {recoveryCodes.map((code) => (
                        <span key={code} className={styles.recoveryCode}>
                          {code}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.recoveryCodesStatus}>
                      {isGeneratingCodes
                        ? "Generating recovery codes..."
                        : "Recovery codes are unavailable right now."}
                    </p>
                  )}
                  {recoveryError && (
                    <div className={styles.errorMessage}>{recoveryError}</div>
                  )}
                  <p className={styles.recoveryCodesHint}>
                    Each code is single-use. Store them somewhere safe.
                  </p>
                </div>
              )}
              <div className={styles.actionButtons}>
                {webauthnStatus.success ? (
                  <>
                    <button
                      className={styles.actionPrimary}
                      onClick={() =>
                        completeStep({
                          passkey_registered: true,
                          recovery_codes_generated: !!recoveryCodes,
                        })
                      }
                    >
                      Continue
                    </button>
                    {!recoveryCodes && (
                      <button
                        className={styles.actionSecondary}
                        onClick={generateRecoveryCodes}
                        disabled={isGeneratingCodes}
                      >
                        {isGeneratingCodes ? "Generating..." : "Retry recovery codes"}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      className={styles.actionPrimary}
                      onClick={registerPasskey}
                      disabled={webauthnStatus.isRegistering || !webauthnStatus.isSupported}
                    >
                      {webauthnStatus.isRegistering ? "Setting up..." : "Create Passkey"}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        }
        return (
          <div className={styles.actionStep}>
            <p className={styles.stepDescription}>{currentStep.description}</p>
            <div className={styles.actionButtons}>
              <button
                className={styles.actionPrimary}
                onClick={() => {
                  // Navigate to action target and complete
                  if (currentStep.target_route) {
                    router.push(currentStep.target_route);
                  }
                  completeStep({ action_completed: true });
                }}
              >
                Let&apos;s Go
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className={styles.defaultStep}>
            <p className={styles.stepDescription}>{currentStep.description}</p>
          </div>
        );
    }
  };

  // Get icon for step
  const getStepIcon = (stepId: string): React.ReactNode => {
    if (stepId.includes("welcome")) {
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    }
    if (stepId.includes("today")) {
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    }
    if (stepId.includes("focus")) {
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    }
    if (stepId.includes("quest")) {
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    }
    return (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
      </svg>
    );
  };

  // Handle next button based on step type
  const handleNext = () => {
    const data: Record<string, unknown> = {};

    if (currentStep?.id.includes("interest")) {
      data.interests = selectedInterests;
    } else if (currentStep?.id.includes("module")) {
      data.modules = selectedModules;
    } else if (currentStep?.id.includes("nudge")) {
      data.nudge_intensity = selectedNudge;
    } else if (currentStep?.id.includes("focus") && currentStep?.step_type === "preference") {
      data.focus_duration = selectedFocusDuration;
    } else if (currentStep?.id.includes("gamification")) {
      data.gamification_visible = gamificationVisible;
    }

    completeStep(data);
  };

  // Modal visibility controlled by onboarding state props
  // Will only render when user is in active onboarding flow
  if (!isVisible) {
    return null;
  }

  if (!currentStep) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.content}>
            <h2 className={styles.stepTitle}>Preparing your onboarding…</h2>
            <p className={styles.stepDescription}>Fetching your first step. If this takes too long, refresh.</p>
          </div>
        </div>
      </div>
    );
  }

  const canGoBack = currentStepIndex > 0;
  const isActionStep = currentStep.step_type === "action";

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.stepCounter}>
            {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h2 className={styles.stepTitle}>{currentStep.title}</h2>
          {renderStepContent()}
        </div>

        {/* Footer */}
        {!isActionStep && (
          <div className={styles.footer}>
            {canGoBack && (
              <button
                className={styles.backButton}
                onClick={goBack}
                disabled={isLoading}
              >
                Back
              </button>
            )}
            <button
              className={styles.nextButton}
              onClick={handleNext}
              disabled={isLoading}
            >
              {isLoading ? "..." : currentStepIndex === totalSteps - 1 ? "Finish" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
