"use client";

/**
 * OnboardingModal - Guided first-run tutorial
 * Data-driven, versioned, resumable onboarding flow
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./OnboardingModal.module.css";

// Step types from the database
type StepType = "tour" | "choice" | "preference" | "action" | "explain";

interface OnboardingStep {
  id: string;
  step_type: StepType;
  title: string;
  description: string | null;
  target_selector: string | null;
  target_route: string | null;
  options_json: string | null;
  step_order: number;
  allows_multiple: number;
  required: number;
}

interface OnboardingState {
  id: string;
  flow_id: string;
  current_step_id: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  responses_json: string | null;
}

interface OnboardingFlow {
  id: string;
  name: string;
  version: string;
  steps: OnboardingStep[];
}

interface OnboardingModalProps {
  initialState: OnboardingState | null;
  flow: OnboardingFlow | null;
  userId: string;
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

// Focus duration options
const FOCUS_DURATIONS = [
  { minutes: 5, label: "5 min", description: "Quick start" },
  { minutes: 10, label: "10 min", description: "Short session" },
  { minutes: 25, label: "25 min", description: "Pomodoro" },
  { minutes: 45, label: "45 min", description: "Deep work" },
];

export function OnboardingModal({ initialState, flow, userId }: OnboardingModalProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stepData, setStepData] = useState<Record<string, unknown>>({});

  // Choice selections
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<Record<string, number>>({});
  const [selectedNudge, setSelectedNudge] = useState<string>("standard");
  const [selectedFocusDuration, setSelectedFocusDuration] = useState<number>(25);
  const [gamificationVisible, setGamificationVisible] = useState<boolean>(true);

  const startOnboarding = useCallback(async () => {
    try {
      await fetch("/api/onboarding/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowId: flow?.id }),
      });
    } catch (error) {
      console.error("Failed to start onboarding:", error);
    }
  }, [flow?.id]);

  // Determine if we should show onboarding
  useEffect(() => {
    if (!flow || !flow.steps.length) {
      setIsVisible(false);
      return;
    }

    // Show if no state exists (new user) or if not completed/skipped
    if (!initialState) {
      setIsVisible(true);
      startOnboarding();
    } else if (initialState.status !== "completed" && initialState.status !== "skipped") {
      setIsVisible(true);
      // Resume from current step
      const stepIndex = flow.steps.findIndex(s => s.id === initialState.current_step_id);
      if (stepIndex >= 0) {
        setCurrentStepIndex(stepIndex);
      }
      // Load saved step data
      if (initialState.responses_json) {
        try {
          setStepData(JSON.parse(initialState.responses_json));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [flow, initialState, startOnboarding]);

  const currentStep = flow?.steps[currentStepIndex];
  const totalSteps = flow?.steps.length || 0;
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  const completeStep = useCallback(async (data?: Record<string, unknown>) => {
    if (!currentStep) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId: currentStep.id,
          response: data || stepData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[onboarding] Step API error:", errorData);
        throw new Error("Failed to complete step");
      }

      // Move to next step or complete
      if (currentStepIndex < totalSteps - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
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
  }, [currentStep, currentStepIndex, totalSteps, stepData, router]);

  const skipOnboarding = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch("/api/onboarding/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ softLandingHours: 24 }),
      });
      setIsVisible(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

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
              <button
                className={styles.actionSecondary}
                onClick={() => completeStep({ action_skipped: true })}
              >
                Skip for now
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

  if (!isVisible || !currentStep) {
    return null;
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
          <button
            className={styles.skipButton}
            onClick={skipOnboarding}
            disabled={isLoading}
          >
            Skip
          </button>
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

