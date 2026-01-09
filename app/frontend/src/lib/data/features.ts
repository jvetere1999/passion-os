/**
 * Feature Inventory
 *
 * Single source of truth for all navigable features in Passion OS.
 * Used by tabs, navigation, Explore grid, and dynamic UI.
 */

export type FeatureCategory = "start" | "do" | "plan" | "explore" | "me";

export interface FeatureDefinition {
  key: string;
  label: string;
  href: string;
  category: FeatureCategory;
  icon: string; // SVG path or icon name
  description: string;
  isPrimaryEligible: boolean; // Can be chosen as primary CTA
  usageEventType?: string; // For tracking usage frequency
  requiresAuth: boolean;
  mobileVisible: boolean;
}

/**
 * Complete feature inventory
 * All features that can appear in navigation or dynamic UI
 */
export const FEATURE_INVENTORY: FeatureDefinition[] = [
  // === START/DO Category ===
  {
    key: "focus",
    label: "Focus",
    href: "/focus",
    category: "do",
    icon: "clock",
    description: "Start a focus session",
    isPrimaryEligible: true,
    usageEventType: "focus_start",
    requiresAuth: true,
    mobileVisible: true,
  },
  {
    key: "quests",
    label: "Quests",
    href: "/quests",
    category: "do",
    icon: "target",
    description: "Complete daily quests",
    isPrimaryEligible: true,
    usageEventType: "quest_complete",
    requiresAuth: true,
    mobileVisible: true,
  },
  {
    key: "habits",
    label: "Habits",
    href: "/habits",
    category: "do",
    icon: "check-circle",
    description: "Track habits",
    isPrimaryEligible: true,
    usageEventType: "habit_complete",
    requiresAuth: true,
    mobileVisible: true,
  },
  {
    key: "exercise",
    label: "Exercise",
    href: "/exercise",
    category: "do",
    icon: "activity",
    description: "Log workouts",
    isPrimaryEligible: true,
    usageEventType: "workout_start",
    requiresAuth: true,
    mobileVisible: true,
  },

  // === PLAN Category ===
  {
    key: "planner",
    label: "Planner",
    href: "/planner",
    category: "plan",
    icon: "calendar",
    description: "Plan your day",
    isPrimaryEligible: false,
    usageEventType: "planner_task_complete",
    requiresAuth: true,
    mobileVisible: true,
  },
  {
    key: "goals",
    label: "Goals",
    href: "/goals",
    category: "plan",
    icon: "flag",
    description: "Long-term goals",
    isPrimaryEligible: false,
    usageEventType: "goal_milestone",
    requiresAuth: true,
    mobileVisible: true,
  },

  // === EXPLORE Category ===
  {
    key: "learn",
    label: "Learn",
    href: "/learn",
    category: "explore",
    icon: "book-open",
    description: "Music production lessons",
    isPrimaryEligible: true,
    usageEventType: "lesson_start",
    requiresAuth: true,
    mobileVisible: true,
  },
  {
    key: "hub",
    label: "Hub",
    href: "/hub",
    category: "explore",
    icon: "grid",
    description: "DAW shortcuts",
    isPrimaryEligible: false,
    requiresAuth: false,
    mobileVisible: true,
  },
  {
    key: "reference",
    label: "Reference",
    href: "/reference",
    category: "explore",
    icon: "music",
    description: "Music theory reference",
    isPrimaryEligible: false,
    requiresAuth: false,
    mobileVisible: true,
  },
  {
    key: "templates",
    label: "Templates",
    href: "/templates",
    category: "explore",
    icon: "layers",
    description: "Project templates",
    isPrimaryEligible: false,
    requiresAuth: false,
    mobileVisible: true,
  },
  {
    key: "infobase",
    label: "Infobase",
    href: "/infobase",
    category: "explore",
    icon: "database",
    description: "Personal knowledge base",
    isPrimaryEligible: false,
    requiresAuth: true,
    mobileVisible: true,
  },
  {
    key: "books",
    label: "Books",
    href: "/books",
    category: "explore",
    icon: "book",
    description: "Book tracker",
    isPrimaryEligible: false,
    requiresAuth: true,
    mobileVisible: true,
  },
  {
    key: "arrange",
    label: "Arrange",
    href: "/arrange",
    category: "explore",
    icon: "sliders",
    description: "Arrangement helper",
    isPrimaryEligible: false,
    requiresAuth: false,
    mobileVisible: true,
  },
  {
    key: "market",
    label: "Market",
    href: "/market",
    category: "explore",
    icon: "shopping-bag",
    description: "Rewards market",
    isPrimaryEligible: false,
    requiresAuth: true,
    mobileVisible: true,
  },
  {
    key: "progress",
    label: "Progress",
    href: "/progress",
    category: "explore",
    icon: "trending-up",
    description: "Track progress",
    isPrimaryEligible: false,
    requiresAuth: true,
    mobileVisible: true,
  },

  // === ME Category ===
  {
    key: "settings",
    label: "Settings",
    href: "/settings",
    category: "me",
    icon: "settings",
    description: "Account settings",
    isPrimaryEligible: false,
    requiresAuth: true,
    mobileVisible: true,
  },
];

/**
 * Get features by category
 */
export function getFeaturesByCategory(category: FeatureCategory): FeatureDefinition[] {
  return FEATURE_INVENTORY.filter((f) => f.category === category);
}

/**
 * Get features eligible for primary CTA
 */
export function getPrimaryEligibleFeatures(): FeatureDefinition[] {
  return FEATURE_INVENTORY.filter((f) => f.isPrimaryEligible);
}

/**
 * Get feature by key
 */
export function getFeatureByKey(key: string): FeatureDefinition | undefined {
  return FEATURE_INVENTORY.find((f) => f.key === key);
}

/**
 * Get mobile-visible features
 */
export function getMobileFeatures(): FeatureDefinition[] {
  return FEATURE_INVENTORY.filter((f) => f.mobileVisible);
}

/**
 * Get features that track usage events
 */
export function getTrackableFeatures(): FeatureDefinition[] {
  return FEATURE_INVENTORY.filter((f) => f.usageEventType !== undefined);
}

