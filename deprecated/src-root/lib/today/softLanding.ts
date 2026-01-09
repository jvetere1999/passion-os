/**
 * Soft Landing Utility
 * Manages session-scoped state for reduced-choice Today after action completion
 *
 * When a user completes or abandons their first action (e.g., Focus session),
 * they land on a reduced-choice Today page to prevent decision paralysis.
 *
 * Session boundary: Browser session (sessionStorage)
 */

const SOFT_LANDING_KEY = "passion_soft_landing_v1";
const SOFT_LANDING_SOURCE_KEY = "passion_soft_landing_source";

/**
 * Soft landing state values
 */
export type SoftLandingState = "inactive" | "active" | "cleared";

/**
 * Action completion status
 */
export type ActionStatus = "complete" | "abandon";

/**
 * Source of soft landing trigger
 */
export type SoftLandingSource = "focus" | "quest" | "workout" | "habit" | "learn";

/**
 * Check if soft landing mode is active
 */
export function isSoftLandingActive(): boolean {
  try {
    return sessionStorage.getItem(SOFT_LANDING_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Get the source that triggered soft landing
 */
export function getSoftLandingSource(): SoftLandingSource | null {
  try {
    const source = sessionStorage.getItem(SOFT_LANDING_SOURCE_KEY);
    if (source === "focus" || source === "quest" || source === "workout" ||
        source === "habit" || source === "learn") {
      return source;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Activate soft landing mode
 * Called after first action completion or abandonment
 */
export function activateSoftLanding(source: SoftLandingSource): void {
  try {
    // Only set if not already set (first action only per session)
    if (sessionStorage.getItem(SOFT_LANDING_KEY) === null) {
      sessionStorage.setItem(SOFT_LANDING_KEY, "1");
      sessionStorage.setItem(SOFT_LANDING_SOURCE_KEY, source);
    }
  } catch {
    // sessionStorage not available
  }
}

/**
 * Clear soft landing mode
 * Called when user explicitly expands a section or takes further action
 */
export function clearSoftLanding(): void {
  try {
    sessionStorage.setItem(SOFT_LANDING_KEY, "0");
  } catch {
    // sessionStorage not available
  }
}

/**
 * Check if soft landing has been cleared by user action
 */
export function isSoftLandingCleared(): boolean {
  try {
    return sessionStorage.getItem(SOFT_LANDING_KEY) === "0";
  } catch {
    return false;
  }
}

/**
 * Get current soft landing state
 */
export function getSoftLandingState(): SoftLandingState {
  try {
    const state = sessionStorage.getItem(SOFT_LANDING_KEY);
    if (state === "1") return "active";
    if (state === "0") return "cleared";
    return "inactive";
  } catch {
    return "inactive";
  }
}

/**
 * Build the Today URL with soft landing mode
 */
export function buildSoftLandingUrl(source: SoftLandingSource, status: ActionStatus): string {
  return `/today?mode=soft&from=${source}&status=${status}`;
}

/**
 * Check if URL indicates soft landing mode
 */
export function isSoftLandingUrl(url: string): boolean {
  try {
    const urlObj = new URL(url, "http://localhost");
    return urlObj.searchParams.get("mode") === "soft";
  } catch {
    return false;
  }
}

/**
 * Parse soft landing params from URL
 */
export function parseSoftLandingParams(searchParams: URLSearchParams): {
  isSoftMode: boolean;
  source: SoftLandingSource | null;
  status: ActionStatus | null;
} {
  const mode = searchParams.get("mode");
  const from = searchParams.get("from");
  const status = searchParams.get("status");

  return {
    isSoftMode: mode === "soft",
    source: (from === "focus" || from === "quest" || from === "workout" ||
             from === "habit" || from === "learn") ? from : null,
    status: (status === "complete" || status === "abandon") ? status : null,
  };
}

