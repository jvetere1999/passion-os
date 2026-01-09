/**
 * User Personalization Fetcher
 * Fetches user settings, interests, and module weights from D1
 */

import type { D1Database } from "@cloudflare/workers-types";
import type { UserPersonalization } from "./resolveNextAction";

interface UserSettings {
  nudge_intensity: string | null;
  focus_default_duration: number | null;
  gamification_visible: number;
}

interface UserInterest {
  interest_key: string;
}

interface UserUIModule {
  module_key: string;
  weight: number;
  is_enabled: number;
}

interface OnboardingState {
  status: string;  // 'not_started', 'in_progress', 'skipped', 'completed'
}

/**
 * Fetch user personalization from D1
 */
export async function fetchUserPersonalization(
  db: D1Database,
  userId: string
): Promise<UserPersonalization | null> {
  try {
    // Fetch user settings
    const settings = await db
      .prepare("SELECT nudge_intensity, focus_default_duration, gamification_visible FROM user_settings WHERE user_id = ?")
      .bind(userId)
      .first<UserSettings>();

    // Fetch user interests
    const interestsResult = await db
      .prepare("SELECT interest_key FROM user_interests WHERE user_id = ?")
      .bind(userId)
      .all<UserInterest>();
    const interests = (interestsResult.results || []).map(i => i.interest_key);

    // Fetch module weights
    const modulesResult = await db
      .prepare("SELECT module_key, weight, is_enabled FROM user_ui_modules WHERE user_id = ?")
      .bind(userId)
      .all<UserUIModule>();

    const moduleWeights: Record<string, number> = {};
    for (const mod of modulesResult.results || []) {
      if (mod.is_enabled) {
        moduleWeights[mod.module_key] = mod.weight;
      }
    }

    // Check onboarding state
    const onboarding = await db
      .prepare("SELECT status FROM user_onboarding_state WHERE user_id = ? ORDER BY started_at DESC LIMIT 1")
      .bind(userId)
      .first<OnboardingState>();

    const onboardingActive = onboarding
      ? onboarding.status !== "completed" && onboarding.status !== "skipped"
      : true; // If no state, user needs onboarding

    return {
      interests,
      moduleWeights,
      nudgeIntensity: settings?.nudge_intensity || "standard",
      focusDuration: settings?.focus_default_duration || 25,
      gamificationVisible: settings?.gamification_visible !== 0,
      onboardingActive,
      onboardingRoute: onboardingActive ? "/today" : undefined, // Onboarding renders as modal on Today
    };
  } catch (error) {
    console.error("Failed to fetch user personalization:", error);
    return null;
  }
}

/**
 * Default personalization for users without settings
 */
export function getDefaultPersonalization(): UserPersonalization {
  return {
    interests: [],
    moduleWeights: {
      focus: 1,
      quests: 1,
      learn: 1,
      ignitions: 1,
    },
    nudgeIntensity: "standard",
    focusDuration: 25,
    gamificationVisible: true,
    onboardingActive: false,
  };
}

