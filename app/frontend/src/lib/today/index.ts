/**
 * Today Logic Module
 *
 * Pure functions for Today page behavior:
 * - todayVisibility: Section visibility rules
 * - resolveNextAction: Starter CTA resolver
 * - momentum: Session feedback state
 * - softLanding: Post-action reduced mode
 * - safetyNets: Validation and fallbacks
 *
 * See README.md for full documentation.
 */

// ============================================
// Visibility Logic (FLAG: TODAY_DECISION_SUPPRESSION_V1)
// ============================================

export {
  getTodayVisibility,
  getDefaultVisibility,
  resolveUserState,
  ensureMinimumVisibility,
  type TodayUserState,
  type TodayVisibility,
  type UserStateType,
} from "./todayVisibility";

// ============================================
// Next Action Resolver (FLAG: TODAY_NEXT_ACTION_RESOLVER_V1)
// ============================================

export {
  resolveNextAction,
  resolveStarterAction,
  type ResolverState,
  type ResolvedAction,
  type ResolutionReason,
  type PlanItem,
  type DailyPlan,
} from "./resolveNextAction";

// ============================================
// Momentum Feedback (FLAG: TODAY_MOMENTUM_FEEDBACK_V1)
// ============================================

export {
  shouldShowMomentum,
  isMomentumShown,
  isMomentumDismissed,
  markMomentumShown,
  dismissMomentum,
  getMomentumState,
  MOMENTUM_COPY,
  MOMENTUM_MESSAGE,
  type MomentumState,
} from "./momentum";

// ============================================
// Soft Landing (FLAG: TODAY_SOFT_LANDING_V1)
// ============================================

export {
  isSoftLandingActive,
  getSoftLandingSource,
  activateSoftLanding,
  clearSoftLanding,
  isSoftLandingCleared,
  getSoftLandingState,
  buildSoftLandingUrl,
  isSoftLandingUrl,
  parseSoftLandingParams,
  type SoftLandingState,
  type SoftLandingSource,
  type ActionStatus,
} from "./softLanding";

// ============================================
// Safety Nets (Always Active)
// ============================================

export {
  FALLBACK_ACTION,
  isValidActionRoute,
  validateResolverOutput,
  validateDailyPlan,
  isValidPlanItem,
  getValidPlanItems,
  validateVisibility,
  safeSessionStorageGet,
  safeSessionStorageSet,
  withFallback,
  withFallbackAsync,
  MINIMUM_VISIBILITY,
} from "./safetyNets";

