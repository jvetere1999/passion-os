/**
 * OnboardingProvider - Server component that fetches onboarding state
 * and renders the OnboardingModal client component
 */

import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";
import type { CloudflareEnv } from "@/env";
import { OnboardingModal } from "./OnboardingModal";

interface OnboardingStep {
  id: string;
  step_type: "tour" | "choice" | "preference" | "action" | "explain";
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
  status: string;  // 'not_started', 'in_progress', 'skipped', 'completed'
  started_at: string | null;
  completed_at: string | null;
  responses_json: string | null;
}

interface OnboardingFlow {
  id: string;
  name: string;
  version: string;
}

async function getOnboardingData(db: D1Database, userId: string) {
  // Get active flow
  const flow = await db
    .prepare("SELECT * FROM onboarding_flows WHERE is_active = 1 ORDER BY version DESC LIMIT 1")
    .first<OnboardingFlow>();

  if (!flow) {
    return { state: null, flow: null };
  }

  // Get steps for this flow
  const stepsResult = await db
    .prepare("SELECT * FROM onboarding_steps WHERE flow_id = ? ORDER BY step_order ASC")
    .bind(flow.id)
    .all<OnboardingStep>();

  const steps = stepsResult.results || [];

  // Get user's onboarding state
  const state = await db
    .prepare("SELECT * FROM user_onboarding_state WHERE user_id = ? AND flow_id = ?")
    .bind(userId, flow.id)
    .first<OnboardingState>();

  return {
    state,
    flow: { ...flow, steps },
  };
}

export async function OnboardingProvider() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {
    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB as unknown as D1Database;

    const { state, flow } = await getOnboardingData(db, session.user.id);

    // Don't render if no flow or already completed/dismissed
    if (!flow || !flow.steps.length) {
      return null;
    }

    if (state?.status === "completed" || state?.status === "skipped") {
      return null;
    }

    return (
      <OnboardingModal
        initialState={state}
        flow={flow}
        userId={session.user.id}
      />
    );
  } catch (error) {
    console.error("Failed to load onboarding:", error);
    return null;
  }
}

