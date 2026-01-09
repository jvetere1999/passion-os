/**
 * Onboarding Start API
 * POST /api/onboarding/start - Start or resume onboarding
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";
import { startOnboarding, resumeOnboarding } from "@/lib/db/repositories/onboarding";

export const dynamic = "force-dynamic";

/**
 * POST /api/onboarding/start
 * Start or resume onboarding flow
 */
export async function POST() {
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

    // Try to resume first, then start fresh if needed
    const { state, currentStep } = await resumeOnboarding(db, userId);

    // If not started yet, start it
    if (state.status === "not_started") {
      const { state: newState, firstStep } = await startOnboarding(db, userId);

      return NextResponse.json({
        success: true,
        state: {
          status: newState.status,
          startedAt: newState.started_at,
        },
        currentStep: firstStep ? {
          id: firstStep.id,
          order: firstStep.step_order,
          type: firstStep.step_type,
          title: firstStep.title,
          description: firstStep.description,
          targetSelector: firstStep.target_selector,
          targetRoute: firstStep.target_route,
          fallbackContent: firstStep.fallback_content,
          options: firstStep.options_json ? JSON.parse(firstStep.options_json) : null,
          allowsMultiple: firstStep.allows_multiple === 1,
          required: firstStep.required === 1,
          actionType: firstStep.action_type,
          actionConfig: firstStep.action_config_json ? JSON.parse(firstStep.action_config_json) : null,
        } : null,
      });
    }

    // Already in progress or resuming
    return NextResponse.json({
      success: true,
      state: {
        status: state.status,
        startedAt: state.started_at,
      },
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
    });
  } catch (error) {
    console.error("[onboarding] start error:", error);
    return NextResponse.json({ error: "Failed to start onboarding" }, { status: 500 });
  }
}

