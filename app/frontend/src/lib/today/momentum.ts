/**
 * Momentum Feedback Utility
 * Manages session-scoped acknowledgment after first completed action
 *
 * Non-gamified - no XP, coins, or streaks.
 * Shows once per browser session after first completion.
 */

const MOMENTUM_KEY = "passion_momentum_v1";

/**
 * Momentum state values
 */
export type MomentumState = "pending" | "shown" | "dismissed";

/**
 * Check if momentum feedback should be shown
 * Returns true only if no completion has been acknowledged this session
 */
export function shouldShowMomentum(): boolean {
  try {
    const state = sessionStorage.getItem(MOMENTUM_KEY);
    return state === null; // Show only if never set
  } catch {
    // sessionStorage not available (SSR, private mode issues)
    return false;
  }
}

/**
 * Check if momentum is currently in "shown" state (not dismissed)
 */
export function isMomentumShown(): boolean {
  try {
    return sessionStorage.getItem(MOMENTUM_KEY) === "shown";
  } catch {
    return false;
  }
}

/**
 * Check if momentum has been dismissed
 */
export function isMomentumDismissed(): boolean {
  try {
    const state = sessionStorage.getItem(MOMENTUM_KEY);
    return state === "dismissed";
  } catch {
    return false;
  }
}

/**
 * Mark momentum as shown (first completion occurred)
 * Call this when a completion event is confirmed
 */
export function markMomentumShown(): void {
  try {
    // Only set if not already set (first completion only)
    if (sessionStorage.getItem(MOMENTUM_KEY) === null) {
      sessionStorage.setItem(MOMENTUM_KEY, "shown");
    }
  } catch {
    // sessionStorage not available
  }
}

/**
 * Mark momentum as dismissed (user closed the banner)
 */
export function dismissMomentum(): void {
  try {
    sessionStorage.setItem(MOMENTUM_KEY, "dismissed");
  } catch {
    // sessionStorage not available
  }
}

/**
 * Get current momentum state
 */
export function getMomentumState(): MomentumState {
  try {
    const state = sessionStorage.getItem(MOMENTUM_KEY);
    if (state === "shown") return "shown";
    if (state === "dismissed") return "dismissed";
    return "pending";
  } catch {
    return "dismissed"; // Treat unavailable storage as dismissed (don't show)
  }
}

/**
 * Copy options for momentum feedback (all <= 5 words, neutral)
 */
export const MOMENTUM_COPY = {
  option1: "Good start.",
  option2: "One step done.",
  option3: "Underway.",
} as const;

/**
 * Selected copy for the momentum banner
 * Using "Good start." - minimal, neutral, acknowledging
 */
export const MOMENTUM_MESSAGE = MOMENTUM_COPY.option1;

