/**
 * Onboarding API
 *
 * API client methods for user onboarding flow.
 * All calls go through the backend at api.ecent.online.
 *
 * Wave 4: Onboarding routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost } from './client';

// ============================================
// Types
// ============================================

export interface OnboardingStep {
  id: string;
  order: number;
  step_type: 'welcome' | 'tour' | 'input' | 'multi_select' | 'action' | 'completion';
  title: string;
  description: string | null;
  target_selector: string | null;
  target_route: string | null;
  fallback_content: string | null;
  options: unknown | null;
  allows_multiple: boolean;
  required: boolean;
  action_type: string | null;
  action_config: unknown | null;
}

export interface OnboardingStepSummary {
  id: string;
  order: number;
  step_type: string;
  title: string;
}

export interface OnboardingState {
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  started_at: string | null;
  completed_at: string | null;
  skipped_at: string | null;
  can_resume: boolean;
}

export interface OnboardingProgress {
  completed_steps: number;
  total_steps: number;
  percent_complete: number;
}

export interface OnboardingFlow {
  id: string;
  name: string;
  total_steps: number;
}

export interface OnboardingResponse {
  needs_onboarding: boolean;
  state: OnboardingState | null;
  progress: OnboardingProgress;
  flow: OnboardingFlow | null;
  current_step: OnboardingStep | null;
  all_steps: OnboardingStepSummary[];
}

export interface StartOnboardingResponse {
  success: boolean;
  state: OnboardingState;
  current_step: OnboardingStep | null;
}

export interface CompleteStepResponse {
  success: boolean;
  completed: boolean;
  next_step: OnboardingStep | null;
}

interface OnboardingWrapper {
  data: OnboardingResponse;
}

interface StartWrapper {
  data: StartOnboardingResponse;
}

interface CompleteStepWrapper {
  data: CompleteStepResponse;
}

interface ResetWrapper {
  success: boolean;
  message: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Get the current onboarding state
 */
export async function getOnboardingState(): Promise<OnboardingResponse> {
  const response = await apiGet<OnboardingWrapper>('/api/onboarding');
  return response.data;
}

/**
 * Check if the user needs onboarding
 */
export async function needsOnboarding(): Promise<boolean> {
  const state = await getOnboardingState();
  return state.needs_onboarding;
}

/**
 * Start or resume onboarding
 */
export async function startOnboarding(): Promise<StartOnboardingResponse> {
  const response = await apiPost<StartWrapper>('/api/onboarding/start');
  return response.data;
}

/**
 * Complete the current step
 */
export async function completeStep(
  stepId: string,
  response?: unknown
): Promise<CompleteStepResponse> {
  const result = await apiPost<CompleteStepWrapper>('/api/onboarding/step', {
    step_id: stepId,
    response,
  });
  return result.data;
}

/**
 * Reset onboarding (for testing/admin)
 */
export async function resetOnboarding(): Promise<{ success: boolean; message: string }> {
  return apiPost<ResetWrapper>('/api/onboarding/reset');
}

/**
 * Get the current step in the flow
 */
export async function getCurrentStep(): Promise<OnboardingStep | null> {
  const state = await getOnboardingState();
  return state.current_step;
}

/**
 * Get all steps in the flow
 */
export async function getAllSteps(): Promise<OnboardingStepSummary[]> {
  const state = await getOnboardingState();
  return state.all_steps;
}

/**
 * Get progress through the onboarding flow
 */
export async function getProgress(): Promise<OnboardingProgress> {
  const state = await getOnboardingState();
  return state.progress;
}
