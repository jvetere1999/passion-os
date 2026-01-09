/**
 * Feature Configuration
 *
 * All Starter Engine features are now permanently enabled as part of the core platform.
 * This module provides compatibility layer for existing code that checks feature status.
 *
 * MIGRATION NOTE (v10.1):
 * - All feature flags have been removed
 * - Features are now always-on platform capabilities
 * - These functions remain for backward compatibility but always return true
 * - In future refactors, remove flag checks entirely from calling code
 */

// ============================================
// All Features Are Now Always Enabled
// ============================================

/**
 * Decision suppression - always enabled
 * Applies state-driven visibility rules to reduce decision paralysis
 */
export function isTodayDecisionSuppressionEnabled(): boolean {
  return true;
}

/**
 * Next action resolver - always enabled
 * StarterBlock uses pure resolver function for deterministic CTA
 */
export function isTodayNextActionResolverEnabled(): boolean {
  return true;
}

/**
 * Momentum feedback - always enabled
 * Shows "Good start." banner once per session after first completion
 */
export function isTodayMomentumFeedbackEnabled(): boolean {
  return true;
}

/**
 * Soft landing - always enabled
 * After first action completion/abandonment, Today shows reduced choices
 */
export function isTodaySoftLandingEnabled(): boolean {
  return true;
}

/**
 * Reduced mode - always enabled
 * Users returning after 48h gap see reduced choice Today
 */
export function isTodayReducedModeEnabled(): boolean {
  return true;
}

/**
 * Dynamic UI - always enabled
 * Shows personalized quick picks, resume last, and interest primers
 */
export function isTodayDynamicUIEnabled(): boolean {
  return true;
}

/**
 * Master switch - always enabled (deprecated)
 * Kept for compatibility, always returns true
 * @deprecated All features are now permanently enabled
 */
export function isTodayFeaturesMasterEnabled(): boolean {
  return true;
}

// ============================================
// Compatibility Layer (deprecated, always true)
// ============================================

/**
 * @deprecated Feature flags have been removed. All features are always enabled.
 */
export type FlagName =
  | "TODAY_DECISION_SUPPRESSION_V1"
  | "TODAY_NEXT_ACTION_RESOLVER_V1"
  | "TODAY_MOMENTUM_FEEDBACK_V1"
  | "TODAY_SOFT_LANDING_V1"
  | "TODAY_REDUCED_MODE_V1"
  | "TODAY_DYNAMIC_UI_V1"
  | "TODAY_FEATURES_MASTER";

/**
 * @deprecated Feature flags have been removed. Always returns true.
 */
export function getFlag(_flagName: FlagName): boolean {
  return true;
}

/**
 * @deprecated Feature flags have been removed. Returns all flags as true.
 */
export function getAllFlagValues(): Record<FlagName, boolean> {
  return {
    TODAY_DECISION_SUPPRESSION_V1: true,
    TODAY_NEXT_ACTION_RESOLVER_V1: true,
    TODAY_MOMENTUM_FEEDBACK_V1: true,
    TODAY_SOFT_LANDING_V1: true,
    TODAY_REDUCED_MODE_V1: true,
    TODAY_DYNAMIC_UI_V1: true,
    TODAY_FEATURES_MASTER: true,
  };
}

/**
 * @deprecated Feature flags have been removed.
 */
export function getActiveTodayFeatures(): string[] {
  return [
    "decision_suppression",
    "next_action_resolver",
    "momentum_feedback",
    "soft_landing",
    "reduced_mode",
    "dynamic_ui",
  ];
}

