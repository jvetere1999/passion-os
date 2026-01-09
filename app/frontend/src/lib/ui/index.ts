/**
 * UI Contract and Types
 * Barrel export for lib/ui
 */

export {
  // Page structure types
  type PageHeaderProps,
  type SectionHeaderProps,

  // State types
  type LoadingStateProps,
  type EmptyStateProps,
  type ErrorStateProps,
  type SuccessStateProps,

  // CTA types
  type CTALevel,
  type CTAProps,

  // Layout constants
  MAX_CTAS_PER_SECTION,
  MAX_QUICK_LINKS,
  PAGE_PADDING,
  SECTION_GAP,
  CARD_PADDING,

  // Accessibility constants
  MIN_TOUCH_TARGET,
  FOCUS_RING,
  FOCUS_RING_OFFSET,

  // Timing constants
  TRANSITION_FAST,
  TRANSITION_NORMAL,
  TRANSITION_SLOW,
  EASING_DEFAULT,
  EASING_IN_OUT,

  // Validation helpers
  validateCTA,
  validateCTACount,
} from "./contract";

