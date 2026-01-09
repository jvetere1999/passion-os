/**
 * Onboarding API Routes
 * GET /api/onboarding - Get current onboarding state
 * POST /api/onboarding/start - Start onboarding
 * POST /api/onboarding/step - Complete a step
 * POST /api/onboarding/skip - Skip onboarding
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";
import {
  getUserOnboardingState,
  getActiveFlow,
  getFlowSteps,
  getStep,
  needsOnboarding,
  getOnboardingProgress,
} from "@/lib/db/repositories/onboarding";

export const dynamic = "force-dynamic";

/**
 * GET /api/onboarding
 * Get user's onboarding state and current step
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const userId = session.user.id;

    // Get state
    const state = await getUserOnboardingState(db, userId);
    const needs = await needsOnboarding(db, userId);
    const progress = await getOnboardingProgress(db, userId);

    // Get flow and steps if needed
    let flow = null;
    let steps: Awaited<ReturnType<typeof getFlowSteps>> = [];
    let currentStep = null;

    if (state) {
      flow = await getActiveFlow(db);
      if (flow) {
        steps = await getFlowSteps(db, flow.id);
      }
      if (state.current_step_id) {
        currentStep = await getStep(db, state.current_step_id);
      }
    }

    return NextResponse.json({
      needsOnboarding: needs,
      state: state ? {
        status: state.status,
        startedAt: state.started_at,
        completedAt: state.completed_at,
        skippedAt: state.skipped_at,
        canResume: state.can_resume === 1,
      } : null,
      progress,
      flow: flow ? {
        id: flow.id,
        name: flow.name,
        totalSteps: flow.total_steps,
      } : null,
      currentStep: currentStep ? {
        id: currentStep.id,
        order: currentStep.step_order,
        type: currentStep.step_type,
        title: currentStep.title,
        description: currentStep.description,
        targetSelector: currentStep.target_selector,
        targetRoute: currentStep.target_route,
        fallbackContent: currentStep.fallback_content,
        options: currentStep.options_json ? JSON.parse(currentStep.options_json) : null,
        allowsMultiple: currentStep.allows_multiple === 1,
        required: currentStep.required === 1,
        actionType: currentStep.action_type,
        actionConfig: currentStep.action_config_json ? JSON.parse(currentStep.action_config_json) : null,
      } : null,
      allSteps: steps.map(s => ({
        id: s.id,
        order: s.step_order,
        type: s.step_type,
        title: s.title,
      })),
    });
  } catch (error) {
    console.error("[onboarding] GET error:", error);
    return NextResponse.json({ error: "Failed to get onboarding state" }, { status: 500 });
  }
}

