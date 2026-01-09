/**
 * Feature Inventory
 *
 * Single source of truth for all app features/modules.
 * Used to render navigation, Explore cards, and mobile tabs dynamically.
 */

export type FeatureCategory = "do" | "plan" | "explore" | "me" | "production" | "learning";

export interface FeatureItem {
  key: string;
  label: string;
  href: string;
  category: FeatureCategory;
  icon: string; // SVG path or icon name
  description?: string;
  isPrimaryEligible: boolean;
  usageEventType?: string;
}

/**
 * Complete feature inventory
 * All app modules defined in one place
 */
export const FEATURE_INVENTORY: FeatureItem[] = [
  // === DO (Execution) ===
  {
    key: "focus",
    label: "Focus",
    href: "/focus",
    category: "do",
    icon: "target",
    description: "Timed focus sessions",
    isPrimaryEligible: true,
    usageEventType: "focus_session",
  },
  {
    key: "quests",
    label: "Quests",
    href: "/quests",
    category: "do",
    icon: "clipboard-check",
    description: "Daily and weekly challenges",
    isPrimaryEligible: true,
    usageEventType: "quest_progress",
  },
  {
    key: "exercise",
    label: "Exercise",
    href: "/exercise",
    category: "do",
    icon: "dumbbell",
    description: "Log workouts and track PRs",
    isPrimaryEligible: true,
    usageEventType: "workout",
  },

  // === PLAN ===
  {
    key: "planner",
    label: "Planner",
    href: "/planner",
    category: "plan",
    icon: "calendar",
    description: "Calendar and events",
    isPrimaryEligible: false,
  },
  {
    key: "goals",
    label: "Goals",
    href: "/goals",
    category: "plan",
    icon: "target",
    description: "Long-term objectives",
    isPrimaryEligible: false,
  },
  {
    key: "habits",
    label: "Habits",
    href: "/habits",
    category: "plan",
    icon: "repeat",
    description: "Daily routines",
    isPrimaryEligible: false,
  },

  // === EXPLORE (Optional modules) ===
  {
    key: "progress",
    label: "Progress",
    href: "/progress",
    category: "explore",
    icon: "bar-chart",
    description: "XP and skill levels",
    isPrimaryEligible: false,
  },
  {
    key: "books",
    label: "Books",
    href: "/books",
    category: "explore",
    icon: "book",
    description: "Reading tracker",
    isPrimaryEligible: false,
    usageEventType: "reading_session",
  },
  {
    key: "market",
    label: "Market",
    href: "/market",
    category: "explore",
    icon: "shopping-cart",
    description: "Spend coins on rewards",
    isPrimaryEligible: false,
  },

  // === PRODUCTION ===
  {
    key: "shortcuts",
    label: "Shortcuts",
    href: "/hub",
    category: "production",
    icon: "keyboard",
    description: "DAW keyboard shortcuts",
    isPrimaryEligible: false,
  },
  {
    key: "arrange",
    label: "Arrange",
    href: "/arrange",
    category: "production",
    icon: "grid",
    description: "Song arrangement tool",
    isPrimaryEligible: false,
  },
  {
    key: "templates",
    label: "Templates",
    href: "/templates",
    category: "production",
    icon: "music",
    description: "Project templates",
    isPrimaryEligible: false,
  },
  {
    key: "reference",
    label: "Reference",
    href: "/reference",
    category: "production",
    icon: "headphones",
    description: "Reference tracks",
    isPrimaryEligible: false,
  },
  {
    key: "infobase",
    label: "Infobase",
    href: "/infobase",
    category: "production",
    icon: "book-open",
    description: "Production knowledge base",
    isPrimaryEligible: false,
  },
  {
    key: "wheel",
    label: "Harmonics",
    href: "/wheel",
    category: "production",
    icon: "circle",
    description: "Camelot wheel and key relationships",
    isPrimaryEligible: false,
  },

  // === LEARNING ===
  {
    key: "learn",
    label: "Learn",
    href: "/learn",
    category: "learning",
    icon: "graduation-cap",
    description: "Courses and lessons",
    isPrimaryEligible: false,
    usageEventType: "lesson_complete",
  },

  // === ME (Settings/Account) ===
  {
    key: "settings",
    label: "Settings",
    href: "/settings",
    category: "me",
    icon: "settings",
    description: "App preferences",
    isPrimaryEligible: false,
  },
];

/**
 * Get features by category
 */
export function getFeaturesByCategory(category: FeatureCategory): FeatureItem[] {
  return FEATURE_INVENTORY.filter((f) => f.category === category);
}

/**
 * Get all primary-eligible features (for starter block)
 */
export function getPrimaryEligibleFeatures(): FeatureItem[] {
  return FEATURE_INVENTORY.filter((f) => f.isPrimaryEligible);
}

/**
 * Get a single feature by key
 */
export function getFeatureByKey(key: string): FeatureItem | undefined {
  return FEATURE_INVENTORY.find((f) => f.key === key);
}

/**
 * Get all execution features (for mobile Do tab)
 */
export function getDoFeatures(): FeatureItem[] {
  return getFeaturesByCategory("do");
}

/**
 * Get all exploration features (for mobile Explore tab)
 */
export function getExploreFeatures(): FeatureItem[] {
  return [
    ...getFeaturesByCategory("explore"),
    ...getFeaturesByCategory("production"),
    ...getFeaturesByCategory("learning"),
    ...getFeaturesByCategory("plan"),
  ];
}

