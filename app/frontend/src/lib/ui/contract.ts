/**
 * UI Contract
 * Defines shared patterns and types for consistent UI across all surfaces
 *
 * This contract ensures:
 * - Consistent page structure (header, content, states)
 * - Consistent CTA patterns (primary, secondary, tertiary)
 * - Consistent state handling (loading, empty, error, success)
 * - Consistent spacing and layout
 */

// ============================================
// Page Structure Types
// ============================================

/**
 * Standard page header props
 */
export interface PageHeaderProps {
  /** Page title (h1) */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Optional action buttons */
  actions?: React.ReactNode;
  /** Optional breadcrumb or back link */
  backLink?: {
    href: string;
    label: string;
  };
}

/**
 * Standard section header props
 */
export interface SectionHeaderProps {
  /** Section title (h2/h3) */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional action button */
  action?: React.ReactNode;
  /** Heading level for accessibility */
  level?: 2 | 3 | 4;
}

// ============================================
// State Types
// ============================================

/**
 * Standard loading state props
 */
export interface LoadingStateProps {
  /** Loading message */
  message?: string;
  /** Size of spinner */
  size?: "sm" | "md" | "lg";
}

/**
 * Standard empty state props
 */
export interface EmptyStateProps {
  /** Empty state title */
  title: string;
  /** Empty state description */
  description?: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Optional action button */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

/**
 * Standard error state props
 */
export interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error message */
  message: string;
  /** Optional retry action */
  retry?: {
    label?: string;
    onClick: () => void;
  };
}

/**
 * Standard success state props
 */
export interface SuccessStateProps {
  /** Success title */
  title: string;
  /** Success message */
  message?: string;
  /** Optional action button */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

// ============================================
// CTA Patterns
// ============================================

/**
 * CTA hierarchy levels
 * - primary: Main action (one per view)
 * - secondary: Supporting actions
 * - tertiary: Minor actions (text links)
 */
export type CTALevel = "primary" | "secondary" | "tertiary";

/**
 * Standard CTA props
 */
export interface CTAProps {
  /** CTA label */
  label: string;
  /** Destination URL (for links) */
  href?: string;
  /** Click handler (for buttons) */
  onClick?: () => void;
  /** CTA level */
  level?: CTALevel;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Icon (optional) */
  icon?: React.ReactNode;
}

// ============================================
// Layout Constants
// ============================================

/**
 * Maximum number of visible CTAs per section
 * Enforced by decision suppression rules
 */
export const MAX_CTAS_PER_SECTION = 3;

/**
 * Maximum quick links in collapsed Explore
 */
export const MAX_QUICK_LINKS = 3;

/**
 * Standard page padding
 */
export const PAGE_PADDING = "var(--space-6)";

/**
 * Standard section gap
 */
export const SECTION_GAP = "var(--space-6)";

/**
 * Standard card padding
 */
export const CARD_PADDING = "var(--space-4)";

// ============================================
// Accessibility Constants
// ============================================

/**
 * Minimum touch target size (WCAG 2.2)
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Focus ring style (consistent across components)
 */
export const FOCUS_RING = "2px solid var(--color-border-focus)";

/**
 * Focus ring offset
 */
export const FOCUS_RING_OFFSET = "2px";

// ============================================
// Timing Constants
// ============================================

/**
 * Standard transition duration
 */
export const TRANSITION_FAST = "150ms";
export const TRANSITION_NORMAL = "250ms";
export const TRANSITION_SLOW = "350ms";

/**
 * Standard easing
 */
export const EASING_DEFAULT = "ease";
export const EASING_IN_OUT = "ease-in-out";

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate that a CTA has either href or onClick
 */
export function validateCTA(cta: CTAProps): boolean {
  return Boolean(cta.href || cta.onClick);
}

/**
 * Validate section CTA count
 */
export function validateCTACount(count: number): boolean {
  return count <= MAX_CTAS_PER_SECTION;
}

