/**
 * Onboarding Step Completion API
 * POST /api/onboarding/step - Complete current step and get next
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";
import type { D1Database } from "@cloudflare/workers-types";
import { completeStep, getStep, getUserOnboardingState, getActiveFlow, createUserOnboardingState } from "@/lib/db/repositories/onboarding";

export const dynamic = "force-dynamic";

interface StepCompleteRequest {
  stepId: string;
  response?: Record<string, unknown>;
}

/**
 * POST /api/onboarding/step
 * Complete the current step and get the next one
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as StepCompleteRequest;

    if (!body.stepId) {
      return NextResponse.json({ error: "stepId is required" }, { status: 400 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const userId = session.user.id;

    // Get or create user's onboarding state
    let state = await getUserOnboardingState(db, userId);

    // If no state exists, create it
    if (!state) {
      const flow = await getActiveFlow(db);
      if (!flow) {
        return NextResponse.json({ error: "No active onboarding flow" }, { status: 500 });
      }
      state = await createUserOnboardingState(db, userId, flow.id);
    }

    // Check status - allow in_progress and not_started
    if (state.status !== "in_progress" && state.status !== "not_started") {
      return NextResponse.json({ error: "Onboarding already completed or skipped" }, { status: 400 });
    }

    // If status is not_started, update it to in_progress
    if (state.status === "not_started") {
      const now = new Date().toISOString();
      await db
        .prepare(`
          UPDATE user_onboarding_state 
          SET status = 'in_progress', started_at = ?, updated_at = ?
          WHERE user_id = ?
        `)
        .bind(now, now, userId)
        .run();
    }

    // Complete the step
    console.log("[onboarding] Completing step:", { userId, stepId: body.stepId, flowId: state.flow_id });

    try {
      const { nextStep, completed } = await completeStep(db, userId, body.stepId, body.response);

      // Apply any preference changes from the response
      if (body.response) {
        await applyStepResponse(db, userId, body.stepId, body.response);
      }

      return NextResponse.json({
        success: true,
        completed,
        nextStep: nextStep ? {
          id: nextStep.id,
          order: nextStep.step_order,
          type: nextStep.step_type,
          title: nextStep.title,
          description: nextStep.description,
          targetSelector: nextStep.target_selector,
          targetRoute: nextStep.target_route,
          fallbackContent: nextStep.fallback_content,
          options: nextStep.options_json ? JSON.parse(nextStep.options_json) : null,
          allowsMultiple: nextStep.allows_multiple === 1,
          required: nextStep.required === 1,
          actionType: nextStep.action_type,
          actionConfig: nextStep.action_config_json ? JSON.parse(nextStep.action_config_json) : null,
        } : null,
      });
    } catch (stepError) {
      console.error("[onboarding] completeStep error:", stepError);
      return NextResponse.json({
        error: "Failed to complete step",
        details: stepError instanceof Error ? stepError.message : "Unknown error"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[onboarding] step error:", error);
    return NextResponse.json({ error: "Failed to complete step" }, { status: 500 });
  }
}

/**
 * Apply user's response to settings/interests/modules
 */
async function applyStepResponse(
  db: D1Database,
  userId: string,
  stepId: string,
  response: Record<string, unknown>
): Promise<void> {
  const now = new Date().toISOString();
  const step = await getStep(db, stepId);
  if (!step) return;

  try {
    // Handle interest selection (step_interests)
    if (stepId === "step_interests" && response.interests) {
      const interests = response.interests as string[];
      // Delete existing interests
      await db.prepare(`DELETE FROM user_interests WHERE user_id = ?`).bind(userId).run();
      // Insert new ones
      for (let i = 0; i < interests.length; i++) {
        await db
          .prepare(`INSERT INTO user_interests (id, user_id, interest_key, priority, created_at) VALUES (?, ?, ?, ?, ?)`)
          .bind(`interest_${userId}_${interests[i]}`, userId, interests[i], interests.length - i, now)
          .run();
      }
    }

    // Handle nudge intensity (step_intensity)
    if (stepId === "step_intensity" && response.intensity) {
      await db
        .prepare(`UPDATE user_settings SET nudge_intensity = ?, updated_at = ? WHERE user_id = ?`)
        .bind(response.intensity, now, userId)
        .run();
    }

    // Handle focus duration (step_focus_duration)
    if (stepId === "step_focus_duration" && response.duration) {
      const duration = response.duration === "custom" ? (response.customDuration || 300) : parseInt(response.duration as string, 10);
      await db
        .prepare(`UPDATE user_settings SET default_focus_duration = ?, updated_at = ? WHERE user_id = ?`)
        .bind(duration, now, userId)
        .run();
    }

    // Handle module weights (step_modules)
    if (stepId === "step_modules" && response.modules) {
      const modules = response.modules as Array<{ key: string; weight: number; enabled: boolean }>;
      for (const mod of modules) {
        await db
          .prepare(`
            INSERT INTO user_ui_modules (id, user_id, module_key, enabled, weight, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (user_id, module_key) DO UPDATE SET enabled = ?, weight = ?, updated_at = ?
          `)
          .bind(
            `module_${userId}_${mod.key}`,
            userId,
            mod.key,
            mod.enabled ? 1 : 0,
            mod.weight,
            now,
            now,
            mod.enabled ? 1 : 0,
            mod.weight,
            now
          )
          .run();
      }
    }

    // Handle gamification visibility (step_gamification)
    if (stepId === "step_gamification" && response.visibility) {
      await db
        .prepare(`UPDATE user_settings SET gamification_visibility = ?, updated_at = ? WHERE user_id = ?`)
        .bind(response.visibility, now, userId)
        .run();
    }

    // Handle planner visibility (step_planner)
    if (stepId === "step_planner" && response.planner) {
      const planner = response.planner as string;
      const visible = planner !== "hidden" ? 1 : 0;
      const expanded = planner === "visible" ? 1 : 0;
      await db
        .prepare(`UPDATE user_settings SET planner_visible = ?, planner_expanded = ?, updated_at = ? WHERE user_id = ?`)
        .bind(visible, expanded, now, userId)
        .run();
    }
  } catch (error) {
    console.error("[onboarding] Failed to apply step response:", error);
    // Don't fail the step completion if settings fail
  }
}


