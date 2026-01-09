/**
 * User Personalization Fetcher
 *
 * Provides user personalization settings.
 * In the backend-first architecture, personalization is fetched from the
 * backend API. This module provides default values for SSR.
 */

import type { UserPersonalization } from "./resolveNextAction";

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

/**
 * Fetch user personalization from the backend API
 *
 * For SSR, returns default personalization.
 * Client components should use the onboarding API client for real data.
 */
export async function fetchUserPersonalization(
  _userId?: string
): Promise<UserPersonalization | null> {
  // In the backend-first architecture, personalization comes from the API.
  // For server-side rendering, we return defaults to avoid blocking the page.
  // Client components will fetch real data via the onboarding/user API.
  return getDefaultPersonalization();
}
