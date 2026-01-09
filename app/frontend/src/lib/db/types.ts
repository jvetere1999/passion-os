/**
 * Database entity types
 * Matches D1 schema from migrations
 */

// ============================================
// Common Types
// ============================================

export type ISOTimestamp = string;
export type JSONString = string;

export type QuestStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "deferred"
  | "cancelled";

export type QuestPriority = "low" | "medium" | "high" | "critical";

export type FocusSessionStatus = "active" | "completed" | "abandoned";

export type FocusMode = "focus" | "break" | "long_break";

export type ProjectStatus = "active" | "archived" | "completed";

export type LaneTemplateType = "melody" | "drums" | "chord";

export type PlanTemplateType = "day" | "session" | "week";

export type RecurrenceType = "daily" | "weekly" | "monthly" | "custom";

export type RewardType = "xp" | "achievement" | "streak" | "milestone";

export type CalendarEventType = "meeting" | "appointment" | "workout" | "other";

export type WorkoutType = "strength" | "cardio" | "hiit" | "flexibility" | "mixed";

export type ExerciseCategory = "strength" | "cardio" | "flexibility" | "other";

export type WorkoutSessionStatus = "in-progress" | "completed" | "abandoned";

export type PersonalRecordType = "max_weight" | "max_reps" | "max_volume" | "max_duration";

// ============================================
// Planner Core Entities
// ============================================

export interface LogEvent {
  id: string;
  user_id: string;
  event_type: string;
  payload: JSONString;
  timestamp: ISOTimestamp;
  domain_id: string | null;
  created_at: ISOTimestamp;
}

export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  domain_id: string;
  status: QuestStatus;
  priority: QuestPriority;
  due_date: ISOTimestamp | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
  completed_at: ISOTimestamp | null;
  tags: JSONString | null;
  xp_value: number;
  parent_id: string | null;
  content_hash: string;
}

export interface ScheduleRule {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  domain_id: string;
  enabled: number; // SQLite boolean
  recurrence: RecurrenceType;
  days_of_week: JSONString | null;
  day_of_month: number | null;
  custom_cron: string | null;
  quest_template: JSONString;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
  content_hash: string;
}

export interface PlanTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  domain_id: string;
  template_type: PlanTemplateType;
  quest_templates: JSONString;
  tags: JSONString | null;
  estimated_duration: number | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
  content_hash: string;
}

export interface SkillTree {
  id: string;
  user_id: string;
  version: number;
  nodes: JSONString;
  total_xp: number;
  achievements: JSONString | null;
  updated_at: ISOTimestamp;
  content_hash: string;
}

export interface RewardLedgerEntry {
  id: string;
  user_id: string;
  domain_id: string;
  reward_type: RewardType;
  amount: number;
  reason: string;
  source_event_id: string | null;
  metadata: JSONString | null;
  created_at: ISOTimestamp;
}

// ============================================
// Focus Domain Entities
// ============================================

export interface FocusSession {
  id: string;
  user_id: string;
  started_at: ISOTimestamp;
  ended_at: ISOTimestamp | null;
  planned_duration: number;
  actual_duration: number | null;
  status: FocusSessionStatus;
  mode: FocusMode;
  metadata: JSONString | null;
  created_at: ISOTimestamp;
  /** Session expiry time - auto-abandon if exceeded */
  expires_at: ISOTimestamp | null;
  /** Linked reference library for focus music */
  linked_library_id: string | null;
}

// ============================================
// Planner Calendar Entities
// ============================================

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_type: CalendarEventType;
  start_time: ISOTimestamp;
  end_time: ISOTimestamp;
  all_day: number; // SQLite boolean
  location: string | null;
  recurrence_rule: string | null;
  recurrence_end: ISOTimestamp | null;
  parent_event_id: string | null;
  workout_id: string | null;
  color: string | null;
  reminder_minutes: number | null;
  metadata: JSONString | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

// ============================================
// Exercise Domain Entities
// ============================================

export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  category: ExerciseCategory;
  muscle_groups: JSONString | null;
  equipment: JSONString | null;
  instructions: string | null;
  is_builtin: number;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  workout_type: WorkoutType;
  estimated_duration: number | null;
  tags: JSONString | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number | null;
  target_reps: string | null;
  target_weight: number | null;
  target_duration: number | null;
  rest_seconds: number | null;
  notes: string | null;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_id: string | null;
  calendar_event_id: string | null;
  started_at: ISOTimestamp;
  ended_at: ISOTimestamp | null;
  status: WorkoutSessionStatus;
  notes: string | null;
  rating: number | null;
  created_at: ISOTimestamp;
}

export interface ExerciseSet {
  id: string;
  workout_session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  duration: number | null;
  distance: number | null;
  rpe: number | null;
  is_warmup: number;
  is_dropset: number;
  is_failure: number;
  notes: string | null;
  completed_at: ISOTimestamp;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  record_type: PersonalRecordType;
  value: number;
  reps: number | null;
  achieved_at: ISOTimestamp;
  exercise_set_id: string | null;
  previous_value: number | null;
  created_at: ISOTimestamp;
}

// ============================================
// Producing Domain Entities
// ============================================

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  notes: string | null;
  status: ProjectStatus;
  starred: number; // SQLite boolean
  tags: JSONString | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
  content_hash: string;
}

export interface ReferenceLibrary {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface ReferenceTrack {
  id: string;
  library_id: string;
  user_id: string;
  name: string;
  blob_key: string;
  mime_type: string;
  size_bytes: number;
  duration_ms: number | null;
  metadata: JSONString | null;
  created_at: ISOTimestamp;
}

export interface InfobaseEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string | null;
  tags: JSONString | null;
  pinned: number; // SQLite boolean
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
  content_hash: string;
}

export interface LaneTemplate {
  id: string;
  user_id: string;
  name: string;
  template_type: LaneTemplateType;
  lane_settings: JSONString;
  notes: JSONString;
  bpm: number;
  bars: number;
  time_signature: JSONString;
  tags: JSONString | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

// ============================================
// User Settings
// ============================================

export interface UserSettings {
  user_id: string;
  theme: "light" | "dark" | "system";
  selected_product: string | null;
  keyboard_layout: "mac" | "windows";
  notifications_enabled: number; // SQLite boolean
  focus_default_duration: number;
  focus_break_duration: number;
  focus_long_break_duration: number;
  settings_json: JSONString | null;
  updated_at: ISOTimestamp;
}

// ============================================
// Input Types (for creating/updating)
// ============================================

export type CreateQuestInput = Omit<
  Quest,
  "id" | "created_at" | "updated_at" | "completed_at" | "content_hash"
>;

export type UpdateQuestInput = Partial<
  Omit<Quest, "id" | "user_id" | "created_at" | "content_hash">
>;

export type CreateFocusSessionInput = Omit<
  FocusSession,
  "id" | "ended_at" | "actual_duration" | "created_at"
>;

export type CreateProjectInput = Omit<
  Project,
  "id" | "created_at" | "updated_at" | "content_hash"
>;

export type UpdateProjectInput = Partial<
  Omit<Project, "id" | "user_id" | "created_at" | "content_hash">
>;

export type CreateInfobaseEntryInput = Omit<
  InfobaseEntry,
  "id" | "created_at" | "updated_at" | "content_hash"
>;

export type UpdateInfobaseEntryInput = Partial<
  Omit<InfobaseEntry, "id" | "user_id" | "created_at" | "content_hash">
>;

// Calendar Event inputs
export type CreateCalendarEventInput = Omit<
  CalendarEvent,
  "id" | "created_at" | "updated_at"
>;

export type UpdateCalendarEventInput = Partial<
  Omit<CalendarEvent, "id" | "user_id" | "created_at">
>;

// Exercise inputs
export type CreateExerciseInput = Omit<
  Exercise,
  "id" | "created_at" | "updated_at"
>;

export type UpdateExerciseInput = Partial<
  Omit<Exercise, "id" | "user_id" | "created_at" | "is_builtin">
>;

// Workout inputs
export type CreateWorkoutInput = Omit<
  Workout,
  "id" | "created_at" | "updated_at"
>;

export type UpdateWorkoutInput = Partial<
  Omit<Workout, "id" | "user_id" | "created_at">
>;

// Workout Session inputs
export type CreateWorkoutSessionInput = Omit<
  WorkoutSession,
  "id" | "ended_at" | "created_at"
>;

// Exercise Set inputs
export type CreateExerciseSetInput = Omit<ExerciseSet, "id" | "completed_at">;

// ============================================
// NEW v2 Types - Gamification & Personalization
// ============================================

// Currency types
export type Currency = "coins" | "xp" | "skill_stars";

// Nudge intensity
export type NudgeIntensity = "gentle" | "standard" | "energetic";

// Gamification visibility
export type GamificationVisibility = "always" | "subtle" | "hidden";

// Onboarding status
export type OnboardingStatus = "not_started" | "in_progress" | "skipped" | "completed";

// Onboarding step type
export type OnboardingStepType = "tour" | "choice" | "preference" | "action" | "explain";

// User Settings V2 (for v2 schema - combines with old UserSettings after migration)
export interface UserSettingsV2 {
  id: string;
  user_id: string;
  nudge_intensity: NudgeIntensity;
  default_focus_duration: number;
  gamification_visibility: GamificationVisibility;
  streak_type: "daily" | "flexible";
  planner_visible: number; // SQLite boolean
  planner_expanded: number;
  soft_landing_until: ISOTimestamp | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

// User Interests
export interface UserInterest {
  id: string;
  user_id: string;
  interest_key: string;
  priority: number;
  created_at: ISOTimestamp;
}

// User UI Modules
export interface UserUIModule {
  id: string;
  user_id: string;
  module_key: string;
  enabled: number;
  weight: number;
  last_shown_at: ISOTimestamp | null;
  show_count: number;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

// Onboarding Flow
export interface OnboardingFlow {
  id: string;
  version: number;
  name: string;
  description: string | null;
  is_active: number;
  total_steps: number;
  created_at: ISOTimestamp;
}

// Onboarding Step
export interface OnboardingStep {
  id: string;
  flow_id: string;
  step_order: number;
  step_type: OnboardingStepType;
  title: string;
  description: string | null;
  target_selector: string | null;
  target_route: string | null;
  fallback_content: string | null;
  options_json: JSONString | null;
  allows_multiple: number;
  required: number;
  action_type: string | null;
  action_config_json: JSONString | null;
  created_at: ISOTimestamp;
}

// User Onboarding State
export interface UserOnboardingState {
  id: string;
  user_id: string;
  flow_id: string;
  current_step_id: string | null;
  status: OnboardingStatus;
  started_at: ISOTimestamp | null;
  completed_at: ISOTimestamp | null;
  skipped_at: ISOTimestamp | null;
  last_step_completed_at: ISOTimestamp | null;
  responses_json: JSONString | null;
  can_resume: number;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

// Points Ledger
export interface PointsLedgerEntry {
  id: string;
  user_id: string;
  currency: Currency;
  amount: number;
  reason: string;
  source_type: string | null;
  source_id: string | null;
  skill_id: string | null;
  metadata_json: JSONString | null;
  created_at: ISOTimestamp;
}

// User Wallet
export interface UserWallet {
  id: string;
  user_id: string;
  coins: number;
  xp: number;
  level: number;
  xp_to_next_level: number;
  total_skill_stars: number;
  updated_at: ISOTimestamp;
}

// Skill Definition
export interface SkillDefinition {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  max_level: number;
  stars_per_level: number;
  created_at: ISOTimestamp;
}

// User Skill
export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  current_stars: number;
  current_level: number;
  updated_at: ISOTimestamp;
}

// Achievement Definition
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string | null;
  condition_type: string;
  condition_json: JSONString;
  reward_coins: number;
  reward_xp: number;
  reward_skill_stars: number;
  reward_skill_id: string | null;
  is_hidden: number;
  created_at: ISOTimestamp;
}

// User Achievement
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: ISOTimestamp;
  notified: number;
}

// Market Item
export interface MarketItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cost_coins: number;
  icon: string | null;
  is_global: number;
  created_by_user_id: string | null;
  is_active: number;
  created_at: ISOTimestamp;
}

// User Purchase
export interface UserPurchase {
  id: string;
  user_id: string;
  item_id: string;
  cost_coins: number;
  purchased_at: ISOTimestamp;
  redeemed: number;
  redeemed_at: ISOTimestamp | null;
}

// ============================================
// Learn Types
// ============================================

// Learn Topic
export interface LearnTopic {
  id: string;
  name: string;
  description: string | null;
  category: string;
  parent_id: string | null;
  order_index: number;
  icon: string | null;
  estimated_minutes: number | null;
  difficulty: string;
  created_at: ISOTimestamp;
}

// Learn Lesson
export interface LearnLesson {
  id: string;
  topic_id: string;
  title: string;
  description: string | null;
  content_markdown: string;
  order_index: number;
  estimated_minutes: number;
  quiz_json: JSONString | null;
  xp_reward: number;
  coin_reward: number;
  skill_id: string | null;
  skill_star_reward: number;
  audio_r2_key: string | null;
  created_at: ISOTimestamp;
}

// Learn Drill
export interface LearnDrill {
  id: string;
  topic_id: string;
  name: string;
  description: string | null;
  drill_type: string;
  difficulty: string;
  config_json: JSONString;
  initial_interval_hours: number;
  audio_r2_key: string | null;
  created_at: ISOTimestamp;
}

// User Lesson Progress
export interface UserLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: string;
  started_at: ISOTimestamp | null;
  completed_at: ISOTimestamp | null;
  quiz_score: number | null;
  attempts: number;
}

// User Drill Stats
export interface UserDrillStats {
  id: string;
  user_id: string;
  drill_id: string;
  total_attempts: number;
  correct_attempts: number;
  current_streak: number;
  best_streak: number;
  success_rate: number;
  last_seen_at: ISOTimestamp | null;
  next_due_at: ISOTimestamp | null;
  interval_hours: number;
  easiness_factor: number;
}

// Ignition Pack
export interface IgnitionPack {
  id: string;
  name: string;
  description: string | null;
  category: string;
  items_json: JSONString;
  is_active: number;
  created_at: ISOTimestamp;
}

// Idea
export interface Idea {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  category: string;
  tags_json: JSONString | null;
  is_pinned: number;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}
