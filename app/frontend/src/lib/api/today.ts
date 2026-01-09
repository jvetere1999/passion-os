/**
 * Today API Client
 *
 * API client for Today page data.
 * All calls go through the backend at api.ecent.online.
 */

import { apiGet } from './client';

// ============================================
// Types
// ============================================

export interface TodayUserState {
  planExists: boolean;
  hasIncompletePlanItems: boolean;
  returningAfterGap: boolean;
  firstDay: boolean;
  focusActive: boolean;
  activeStreak: boolean;
}

export interface QuickPick {
  module: string;
  route: string;
  label: string;
  count: number;
}

export interface ResumeLast {
  module: string;
  route: string;
  label: string;
  lastUsed: string;
}

export interface InterestPrimer {
  type: "learn" | "hub";
  route: string;
  label: string;
}

export interface DynamicUIData {
  quickPicks: QuickPick[];
  resumeLast: ResumeLast | null;
  interestPrimer: InterestPrimer | null;
}

export type PlanItemType = "focus" | "quest" | "workout" | "learning" | "habit";

export interface DailyPlanSummary {
  planExists: boolean;
  hasIncompletePlanItems: boolean;
  nextIncompleteItem: {
    id: string;
    title: string;
    priority: number;
    actionUrl: string;
    type: PlanItemType;
  } | null;
  totalCount: number;
  completedCount: number;
}

export interface PlanItemSummary {
  id: string;
  title: string;
  type: string;
  completed: boolean;
}

export interface UserPersonalization {
  interests: string[];
  moduleWeights: Record<string, number>;
  nudgeIntensity: string;
  focusDuration: number;
  gamificationVisible: boolean;
  onboardingActive: boolean;
  onboardingRoute?: string;
}

export interface TodayData {
  userState: TodayUserState;
  dynamicUIData: DynamicUIData | null;
  planSummary: DailyPlanSummary | null;
  personalization: UserPersonalization;
}

// ============================================
// Default values (for when API fails or user not authenticated)
// ============================================

export function getDefaultUserState(): TodayUserState {
  return {
    planExists: false,
    hasIncompletePlanItems: false,
    returningAfterGap: false,
    firstDay: false,
    focusActive: false,
    activeStreak: false,
  };
}

export function getDefaultPersonalization(): UserPersonalization {
  return {
    interests: [],
    moduleWeights: {},
    nudgeIntensity: 'standard',
    focusDuration: 25,
    gamificationVisible: true,
    onboardingActive: false,
  };
}

// ============================================
// API Functions
// ============================================

/**
 * Get all Today page data in one call
 */
export async function getTodayData(): Promise<TodayData> {
  try {
    const data = await apiGet<TodayData>('/api/today');
    return data;
  } catch {
    // Return defaults on error
    return {
      userState: getDefaultUserState(),
      dynamicUIData: null,
      planSummary: null,
      personalization: getDefaultPersonalization(),
    };
  }
}
