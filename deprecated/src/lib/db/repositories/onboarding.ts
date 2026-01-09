/**
 * Onboarding Repository
 * Handles onboarding flows, steps, and user progress
 */

import type { D1Database } from "@cloudflare/workers-types";
import type {
  OnboardingFlow,
  OnboardingStep,
  UserOnboardingState,
} from "../types";

// ============================================
// Flow & Step Queries
// ============================================

/**
 * Get the active onboarding flow
 */
export async function getActiveFlow(db: D1Database): Promise<OnboardingFlow | null> {
  return db
    .prepare(`SELECT * FROM onboarding_flows WHERE is_active = 1 ORDER BY version DESC LIMIT 1`)
    .first<OnboardingFlow>();
}

/**
 * Get all steps for a flow
 */
export async function getFlowSteps(
  db: D1Database,
  flowId: string
): Promise<OnboardingStep[]> {
  const result = await db
    .prepare(`SELECT * FROM onboarding_steps WHERE flow_id = ? ORDER BY step_order ASC`)
    .bind(flowId)
    .all<OnboardingStep>();
  return result.results || [];
}

/**
 * Get a specific step by ID
 */
export async function getStep(
  db: D1Database,
  stepId: string
): Promise<OnboardingStep | null> {
  return db
    .prepare(`SELECT * FROM onboarding_steps WHERE id = ?`)
    .bind(stepId)
    .first<OnboardingStep>();
}

/**
 * Get the next step in a flow
 */
export async function getNextStep(
  db: D1Database,
  flowId: string,
  currentStepOrder: number
): Promise<OnboardingStep | null> {
  return db
    .prepare(`
      SELECT * FROM onboarding_steps 
      WHERE flow_id = ? AND step_order > ? 
      ORDER BY step_order ASC 
      LIMIT 1
    `)
    .bind(flowId, currentStepOrder)
    .first<OnboardingStep>();
}

// ============================================
// User State Queries
// ============================================

/**
 * Get user's onboarding state
 */
export async function getUserOnboardingState(
  db: D1Database,
  userId: string
): Promise<UserOnboardingState | null> {
  return db
    .prepare(`SELECT * FROM user_onboarding_state WHERE user_id = ?`)
    .bind(userId)
    .first<UserOnboardingState>();
}

/**
 * Create initial onboarding state for a user
 */
export async function createUserOnboardingState(
  db: D1Database,
  userId: string,
  flowId: string
): Promise<UserOnboardingState> {
  const id = `onboarding_${userId}`;
  const now = new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO user_onboarding_state (id, user_id, flow_id, status, can_resume, created_at, updated_at)
      VALUES (?, ?, ?, 'not_started', 1, ?, ?)
    `)
    .bind(id, userId, flowId, now, now)
    .run();

  return {
    id,
    user_id: userId,
    flow_id: flowId,
    current_step_id: null,
    status: "not_started",
    started_at: null,
    completed_at: null,
    skipped_at: null,
    last_step_completed_at: null,
    responses_json: null,
    can_resume: 1,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Start onboarding for a user
 */
export async function startOnboarding(
  db: D1Database,
  userId: string
): Promise<{ state: UserOnboardingState; firstStep: OnboardingStep | null }> {
  const now = new Date().toISOString();

  // Get or create state
  let state = await getUserOnboardingState(db, userId);
  if (!state) {
    const flow = await getActiveFlow(db);
    if (!flow) {
      throw new Error("No active onboarding flow found");
    }
    state = await createUserOnboardingState(db, userId, flow.id);
  }

  // Get first step
  const steps = await getFlowSteps(db, state.flow_id);
  const firstStep = steps[0] || null;

  // Update state to in_progress
  await db
    .prepare(`
      UPDATE user_onboarding_state 
      SET status = 'in_progress', 
          started_at = ?, 
          current_step_id = ?,
          updated_at = ?
      WHERE user_id = ?
    `)
    .bind(now, firstStep?.id || null, now, userId)
    .run();

  state.status = "in_progress";
  state.started_at = now;
  state.current_step_id = firstStep?.id || null;

  return { state, firstStep };
}

/**
 * Complete a step and advance to next
 */
export async function completeStep(
  db: D1Database,
  userId: string,
  stepId: string,
  response?: Record<string, unknown>
): Promise<{ nextStep: OnboardingStep | null; completed: boolean }> {
  const now = new Date().toISOString();

  // Get current state
  const state = await getUserOnboardingState(db, userId);
  if (!state) {
    throw new Error("User has no onboarding state");
  }

  // Get current step
  const currentStep = await getStep(db, stepId);
  if (!currentStep) {
    throw new Error("Step not found");
  }

  // Get next step
  const nextStep = await getNextStep(db, state.flow_id, currentStep.step_order);

  // Update responses if provided
  let responses: Record<string, unknown> = {};
  if (state.responses_json) {
    try {
      responses = JSON.parse(state.responses_json);
    } catch {
      responses = {};
    }
  }
  if (response) {
    responses[stepId] = response;
  }

  // Update state
  if (nextStep) {
    await db
      .prepare(`
        UPDATE user_onboarding_state 
        SET current_step_id = ?,
            last_step_completed_at = ?,
            responses_json = ?,
            updated_at = ?
        WHERE user_id = ?
      `)
      .bind(nextStep.id, now, JSON.stringify(responses), now, userId)
      .run();

    return { nextStep, completed: false };
  } else {
    // No more steps - complete onboarding
    await db
      .prepare(`
        UPDATE user_onboarding_state 
        SET status = 'completed',
            current_step_id = NULL,
            completed_at = ?,
            last_step_completed_at = ?,
            responses_json = ?,
            updated_at = ?
        WHERE user_id = ?
      `)
      .bind(now, now, JSON.stringify(responses), now, userId)
      .run();

    // Log activity event
    await db
      .prepare(`
        INSERT INTO activity_events (id, user_id, event_type, metadata_json, created_at)
        VALUES (?, ?, 'onboarding_completed', ?, ?)
      `)
      .bind(crypto.randomUUID(), userId, JSON.stringify({ flow_id: state.flow_id }), now)
      .run();

    return { nextStep: null, completed: true };
  }
}

/**
 * Skip onboarding
 */
export async function skipOnboarding(
  db: D1Database,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();

  await db
    .prepare(`
      UPDATE user_onboarding_state 
      SET status = 'skipped',
          skipped_at = ?,
          updated_at = ?
      WHERE user_id = ?
    `)
    .bind(now, now, userId)
    .run();

  // Log activity event
  await db
    .prepare(`
      INSERT INTO activity_events (id, user_id, event_type, created_at)
      VALUES (?, ?, 'onboarding_skipped', ?)
    `)
    .bind(crypto.randomUUID(), userId, now)
    .run();
}

/**
 * Resume onboarding (after skip or reload)
 */
export async function resumeOnboarding(
  db: D1Database,
  userId: string
): Promise<{ state: UserOnboardingState; currentStep: OnboardingStep | null }> {
  const now = new Date().toISOString();

  const state = await getUserOnboardingState(db, userId);
  if (!state) {
    // Create fresh state
    const flow = await getActiveFlow(db);
    if (!flow) {
      throw new Error("No active onboarding flow found");
    }
    const newState = await createUserOnboardingState(db, userId, flow.id);
    return { state: newState, currentStep: null };
  }

  // If skipped, reset to in_progress
  if (state.status === "skipped" && state.can_resume) {
    await db
      .prepare(`
        UPDATE user_onboarding_state 
        SET status = 'in_progress',
            skipped_at = NULL,
            updated_at = ?
        WHERE user_id = ?
      `)
      .bind(now, userId)
      .run();
    state.status = "in_progress";
    state.skipped_at = null;
  }

  // Get current step
  let currentStep: OnboardingStep | null = null;
  if (state.current_step_id) {
    currentStep = await getStep(db, state.current_step_id);
  }

  return { state, currentStep };
}

/**
 * Check if user needs onboarding
 */
export async function needsOnboarding(
  db: D1Database,
  userId: string
): Promise<boolean> {
  const state = await getUserOnboardingState(db, userId);

  if (!state) {
    return true; // No state = needs onboarding
  }

  return state.status === "not_started" ||
         (state.status === "in_progress") ||
         (state.status === "skipped" && state.can_resume === 1);
}

/**
 * Get onboarding progress percentage
 */
export async function getOnboardingProgress(
  db: D1Database,
  userId: string
): Promise<{ current: number; total: number; percentage: number }> {
  const state = await getUserOnboardingState(db, userId);

  if (!state || state.status === "not_started") {
    return { current: 0, total: 0, percentage: 0 };
  }

  const flow = await getActiveFlow(db);
  if (!flow) {
    return { current: 0, total: 0, percentage: 0 };
  }

  if (state.status === "completed") {
    return { current: flow.total_steps, total: flow.total_steps, percentage: 100 };
  }

  // Count completed steps from responses
  let completedCount = 0;
  if (state.responses_json) {
    try {
      const responses = JSON.parse(state.responses_json);
      completedCount = Object.keys(responses).length;
    } catch {
      completedCount = 0;
    }
  }

  return {
    current: completedCount,
    total: flow.total_steps,
    percentage: Math.round((completedCount / flow.total_steps) * 100),
  };
}

