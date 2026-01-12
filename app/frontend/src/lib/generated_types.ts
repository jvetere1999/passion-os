// GENERATED FROM schema.json v2.0.0 - DO NOT EDIT
// Generated: 2026-01-10
//
// Source of truth for database types. Import from here.
//
// Domains:
//   - Authentication & Authorization
//   - Gamification & Progress
//   - Focus Timer & Sessions
//   - Habits & Goals
//   - Reading & Books
//   - Fitness & Exercise
//   - Learning & Courses
//   - Shop & Market
//   - Calendar & Planning
//   - Analysis Frames
//   - Music Analysis
//   - Sync & Settings
//   - Content & References
//   - Onboarding
//   - Admin & Platform
//   - Other Tables

// =============================================================================
// AUTHENTICATION & AUTHORIZATION
// =============================================================================

/** Database model for `accounts` table */
export interface Accounts {
  id: string;
  user_id: string;
  type: string;
  provider: string;
  provider_account_id: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
  created_at: string;
  updated_at: string;
}

/** Database model for `authenticators` table */
export interface Authenticators {
  id: string;
  user_id: string;
  credential_id: string;
  provider_account_id: string;
  credential_public_key: string;
  counter: number;
  credential_device_type: string;
  credential_backed_up: boolean;
  transports: string[];
  created_at: string;
}

/** Database model for `entitlements` table */
export interface Entitlements {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: string;
}

/** Database model for `role_entitlements` table */
export interface RoleEntitlements {
  role_id: string;
  entitlement_id: string;
  created_at: string;
}

/** Database model for `roles` table */
export interface Roles {
  id: string;
  name: string;
  description?: string;
  parent_role_id?: string;
  created_at: string;
}

/** Database model for `sessions` table */
export interface Sessions {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  last_activity_at?: string;
  user_agent?: string;
  ip_address?: string;
  rotated_from?: string;
}

/** Database model for `user_roles` table */
export interface UserRoles {
  user_id: string;
  role_id: string;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
}

/** Database model for `users` table */
export interface Users {
  id: string;
  name?: string;
  email: string;
  email_verified?: string;
  image?: string;
  role: string;
  approved: boolean;
  age_verified: boolean;
  tos_accepted: boolean;
  tos_accepted_at?: string;
  tos_version?: string;
  is_admin: boolean;
  last_activity_at?: string;
  theme?: string;
  created_at: string;
  updated_at: string;
}

/** Database model for `verification_tokens` table */
export interface VerificationTokens {
  identifier: string;
  token: string;
  expires: string;
  created_at: string;
}

// =============================================================================
// GAMIFICATION & PROGRESS
// =============================================================================

/** Database model for `achievement_definitions` table */
export interface AchievementDefinitions {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  reward_coins: number;
  reward_xp: number;
  is_hidden: boolean;
  sort_order: number;
  created_at: string;
}

/** Database model for `activity_events` table */
export interface ActivityEvents {
  id: string;
  user_id: string;
  event_type: string;
  category?: string;
  metadata?: Record<string, unknown>;
  xp_earned: number;
  coins_earned: number;
  created_at: string;
}

/** Database model for `skill_definitions` table */
export interface SkillDefinitions {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  max_level: number;
  stars_per_level: number;
  sort_order: number;
  created_at: string;
}

/** Database model for `universal_quests` table */
export interface UniversalQuests {
  id: string;
  title: string;
  description?: string;
  type: string;
  xp_reward: number;
  coin_reward: number;
  target: number;
  target_type: string;
  target_config?: Record<string, unknown>;
  skill_key?: string;
  is_active: boolean;
  created_by?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Database model for `user_achievements` table */
export interface UserAchievements {
  id: string;
  user_id: string;
  achievement_key: string;
  earned_at: string;
  notified: boolean;
}

/** Database model for `user_progress` table */
export interface UserProgress {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  total_skill_stars: number;
  created_at: string;
  updated_at: string;
}

/** Database model for `user_quests` table */
export interface UserQuests {
  id: string;
  user_id: string;
  source_quest_id?: string;
  title: string;
  description?: string;
  category?: string;
  difficulty: string;
  xp_reward: number;
  coin_reward: number;
  status: string;
  progress: number;
  target: number;
  is_active: boolean;
  is_repeatable: boolean;
  repeat_frequency?: string;
  accepted_at: string;
  completed_at?: string;
  claimed_at?: string;
  expires_at?: string;
  last_completed_date?: string;
  streak_count: number;
  created_at: string;
  updated_at: string;
}

/** Database model for `user_skills` table */
export interface UserSkills {
  id: string;
  user_id: string;
  skill_key: string;
  current_stars: number;
  current_level: number;
  created_at: string;
  updated_at: string;
}

/** Database model for `user_wallet` table */
export interface UserWallet {
  id: string;
  user_id: string;
  coins: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// FOCUS TIMER & SESSIONS
// =============================================================================

/** Database model for `focus_pause_state` table */
export interface FocusPauseState {
  id: string;
  user_id: string;
  session_id: string;
  mode?: string;
  is_paused: boolean;
  time_remaining_seconds?: number;
  paused_at?: string;
  resumed_at?: string;
  created_at: string;
  updated_at: string;
}

/** Database model for `focus_sessions` table */
export interface FocusSessions {
  id: string;
  user_id: string;
  mode: string;
  duration_seconds: number;
  started_at: string;
  completed_at?: string;
  abandoned_at?: string;
  expires_at?: string;
  status: string;
  xp_awarded: number;
  coins_awarded: number;
  task_id?: string;
  task_title?: string;
  paused_at?: string;
  paused_remaining_seconds?: number;
  created_at: string;
}

// =============================================================================
// HABITS & GOALS
// =============================================================================

/** Database model for `goal_milestones` table */
export interface GoalMilestones {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  sort_order: number;
}

/** Database model for `goals` table */
export interface Goals {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  target_date?: string;
  started_at?: string;
  completed_at?: string;
  status: string;
  progress: number;
  priority: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Database model for `habit_completions` table */
export interface HabitCompletions {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  completed_date: string;
  notes?: string;
}

/** Database model for `habits` table */
export interface Habits {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  frequency: string;
  target_count: number;
  custom_days?: number[];
  icon?: string;
  color?: string;
  is_active: boolean;
  current_streak: number;
  longest_streak: number;
  last_completed_at?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// READING & BOOKS
// =============================================================================

/** Database model for `books` table */
export interface Books {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  total_pages?: number;
  current_page: number;
  status: string;
  started_at?: string;
  completed_at?: string;
  rating?: number;
  notes?: string;
  cover_blob_id?: string;
  created_at: string;
  updated_at: string;
}

/** Database model for `reading_sessions` table */
export interface ReadingSessions {
  id: string;
  book_id: string;
  user_id: string;
  pages_read: number;
  start_page?: number;
  end_page?: number;
  duration_minutes?: number;
  started_at: string;
  notes?: string;
  xp_awarded: number;
  coins_awarded: number;
}

// =============================================================================
// FITNESS & EXERCISE
// =============================================================================

/** Database model for `personal_records` table */
export interface PersonalRecords {
  id: string;
  user_id: string;
  exercise_id: string;
  record_type: string;
  value: number;
  reps?: number;
  achieved_at: string;
  exercise_set_id?: string;
  previous_value?: number;
  created_at: string;
}

/** Database model for `workout_exercises` table */
export interface WorkoutExercises {
  id: string;
  workout_id: string;
  section_id?: string;
  exercise_id: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  rest_seconds?: number;
  notes?: string;
  sort_order: number;
}

/** Database model for `workout_sessions` table */
export interface WorkoutSessions {
  id: string;
  user_id: string;
  workout_id?: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  notes?: string;
  rating?: number;
  xp_awarded: number;
  coins_awarded: number;
}

// =============================================================================
// LEARNING & COURSES
// =============================================================================

/** Database model for `learn_lessons` table */
export interface LearnLessons {
  id: string;
  topic_id: string;
  key: string;
  title: string;
  description?: string;
  content_markdown?: string;
  duration_minutes?: number;
  difficulty: string;
  quiz_json?: Record<string, unknown>;
  xp_reward: number;
  coin_reward: number;
  skill_key?: string;
  skill_star_reward: number;
  audio_r2_key?: string;
  video_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

/** Database model for `learn_topics` table */
export interface LearnTopics {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

/** Database model for `user_lesson_progress` table */
export interface UserLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  quiz_score?: number;
  attempts: number;
}

// =============================================================================
// SHOP & MARKET
// =============================================================================

/** Database model for `market_items` table */
export interface MarketItems {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: string;
  cost_coins: number;
  rarity?: string;
  icon?: string;
  image_url?: string;
  is_global: boolean;
  is_available: boolean;
  is_active: boolean;
  is_consumable: boolean;
  uses_per_purchase?: number;
  total_stock?: number;
  remaining_stock?: number;
  created_by_user_id?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Database model for `user_purchases` table */
export interface UserPurchases {
  id: string;
  user_id: string;
  item_id: string;
  cost_coins: number;
  quantity: number;
  purchased_at: string;
  redeemed_at?: string;
  uses_remaining?: number;
  status: string;
  refunded_at?: string;
  refund_reason?: string;
}

// =============================================================================
// CALENDAR & PLANNING
// =============================================================================

/** Database model for `calendar_events` table */
export interface CalendarEvents {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time?: string;
  all_day: boolean;
  timezone?: string;
  location?: string;
  workout_id?: string;
  habit_id?: string;
  goal_id?: string;
  recurrence_rule?: string;
  recurrence_end?: string;
  parent_event_id?: string;
  color?: string;
  reminder_minutes?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Database model for `daily_plans` table */
export interface DailyPlans {
  id: string;
  user_id: string;
  date: string;
  items: Record<string, unknown>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// ANALYSIS FRAMES
// =============================================================================

/** Database model for `analysis_events` table */
export interface AnalysisEvents {
  id: string;
  analysis_id: string;
  time_ms: number;
  duration_ms?: number;
  event_type: string;
  event_data?: Record<string, unknown>;
  confidence?: number;
  created_at: string;
}

/** Database model for `analysis_frame_data` table */
export interface AnalysisFrameData {
  id: string;
  manifest_id: string;
  chunk_index: number;
  start_frame: number;
  end_frame: number;
  start_time_ms: number;
  end_time_ms: number;
  frame_data: Uint8Array;
  frame_count: number;
  compressed: boolean;
  compression_type?: string;
  created_at: string;
}

/** Database model for `analysis_frame_manifests` table */
export interface AnalysisFrameManifests {
  id: string;
  analysis_id: string;
  manifest_version: number;
  hop_ms: number;
  frame_count: number;
  duration_ms: number;
  sample_rate: number;
  bands: number;
  bytes_per_frame: number;
  frame_layout: Record<string, unknown>;
  events?: Record<string, unknown>;
  fingerprint?: string;
  analyzer_version: string;
  chunk_size_frames: number;
  total_chunks: number;
  created_at: string;
}

// =============================================================================
// SYNC & SETTINGS
// =============================================================================

/** Database model for `feature_flags` table */
export interface FeatureFlags {
  id: string;
  flag_name: string;
  enabled: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Database model for `user_settings` table */
export interface UserSettings {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  theme: string;
  timezone?: string;
  locale: string;
  profile_public: boolean;
  show_activity: boolean;
  daily_reminder_time?: string;
  soft_landing_until?: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// CONTENT & REFERENCES
// =============================================================================

/** Database model for `ideas` table */
export interface Ideas {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  category?: string;
  tags?: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

/** Database model for `inbox_items` table */
export interface InboxItems {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  item_type: string;
  tags?: string[];
  is_processed: boolean;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// ONBOARDING
// =============================================================================

/** Database model for `onboarding_flows` table */
export interface OnboardingFlows {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  total_steps: number;
  created_at: string;
  updated_at: string;
}

/** Database model for `onboarding_steps` table */
export interface OnboardingSteps {
  id: string;
  flow_id: string;
  step_order: number;
  step_type: string;
  title: string;
  description?: string;
  target_selector?: string;
  target_route?: string;
  fallback_content?: string;
  options?: Record<string, unknown>;
  allows_multiple: boolean;
  required: boolean;
  action_type?: string;
  action_config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// ADMIN & PLATFORM
// =============================================================================

/** Database model for `audit_log` table */
export interface AuditLog {
  id: string;
  user_id?: string;
  session_id?: string;
  event_type: string;
  resource_type?: string;
  resource_id?: string;
  action?: string;
  status: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  created_at: string;
}

/** Database model for `feedback` table */
export interface Feedback {
  id: string;
  user_id: string;
  feedback_type: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  admin_response?: string;
  resolved_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// OTHER TABLES
// =============================================================================

/** Database model for `exercise_sets` table */
export interface ExerciseSets {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps?: number;
  weight?: number;
  duration?: number;
  is_warmup: boolean;
  is_dropset: boolean;
  rpe?: number;
  notes?: string;
  completed_at: string;
}

/** Database model for `exercises` table */
export interface Exercises {
  id: string;
  name: string;
  description?: string;
  category: string;
  muscle_groups?: string[];
  equipment?: string[];
  instructions?: string;
  video_url?: string;
  is_custom: boolean;
  is_builtin: boolean;
  user_id?: string;
  created_at: string;
}

/** Database model for `focus_libraries` table */
export interface FocusLibraries {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  library_type: string;
  tracks_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

/** Database model for `focus_library_tracks` table */
export interface FocusLibraryTracks {
  id: string;
  library_id: string;
  track_id?: string;
  track_title: string;
  track_url?: string;
  duration_seconds?: number;
  sort_order: number;
  added_at: string;
}

/** Database model for `infobase_entries` table */
export interface InfobaseEntries {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

/** Database model for `learn_drills` table */
export interface LearnDrills {
  id: string;
  topic_id: string;
  key: string;
  title: string;
  description?: string;
  drill_type: string;
  config_json: Record<string, unknown>;
  difficulty: string;
  duration_seconds?: number;
  xp_reward: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

/** Database model for `listening_prompt_presets` table */
export interface ListeningPromptPresets {
  id: string;
  name: string;
  description?: string;
  template_id: string;
  preset_type: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/** Database model for `listening_prompt_templates` table */
export interface ListeningPromptTemplates {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty: string;
  prompt_text: string;
  hints?: Record<string, unknown>;
  expected_observations?: Record<string, unknown>;
  tags?: string[];
  display_order: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/** Database model for `market_recommendations` table */
export interface MarketRecommendations {
  id: string;
  user_id: string;
  item_id: string;
  score: number;
  reason?: string;
  computed_at: string;
}

/** Database model for `market_transactions` table */
export interface MarketTransactions {
  id: string;
  user_id: string;
  transaction_type: string;
  coins_amount: number;
  item_id?: string;
  reason?: string;
  created_at: string;
}

/** Database model for `oauth_states` table */
export interface OauthStates {
  state_key: string;
  pkce_verifier: string;
  redirect_uri?: string;
  created_at: string;
  expires_at: string;
}

/** Database model for `plan_templates` table */
export interface PlanTemplates {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  items: Record<string, unknown>;
  is_public: boolean;
  category?: string;
  use_count: number;
  created_at: string;
  updated_at: string;
}

/** Database model for `points_ledger` table */
export interface PointsLedger {
  id: string;
  user_id: string;
  event_type: string;
  event_id?: string;
  coins: number;
  xp: number;
  skill_stars: number;
  skill_key?: string;
  reason?: string;
  idempotency_key?: string;
  created_at: string;
}

/** Database model for `program_weeks` table */
export interface ProgramWeeks {
  id: string;
  program_id: string;
  week_number: number;
  name?: string;
  is_deload: boolean;
  notes?: string;
}

/** Database model for `program_workouts` table */
export interface ProgramWorkouts {
  id: string;
  program_week_id: string;
  workout_id: string;
  day_of_week: number;
  order_index: number;
  intensity_modifier: number;
}

/** Database model for `reference_tracks` table */
export interface ReferenceTracks {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  r2_key: string;
  file_size_bytes: number;
  mime_type: string;
  duration_seconds?: number;
  artist?: string;
  album?: string;
  genre?: string;
  bpm?: number;
  key_signature?: string;
  tags?: string[];
  status: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

/** Database model for `track_analyses` table */
export interface TrackAnalyses {
  id: string;
  track_id: string;
  analysis_type: string;
  version: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  summary?: Record<string, unknown>;
  manifest?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Database model for `track_annotations` table */
export interface TrackAnnotations {
  id: string;
  track_id: string;
  user_id: string;
  start_time_ms: number;
  end_time_ms?: number;
  title: string;
  content?: string;
  category?: string;
  color?: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

/** Database model for `track_regions` table */
export interface TrackRegions {
  id: string;
  track_id: string;
  user_id: string;
  start_time_ms: number;
  end_time_ms: number;
  name: string;
  description?: string;
  section_type?: string;
  color?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/** Database model for `training_programs` table */
export interface TrainingPrograms {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  duration_weeks: number;
  goal?: string;
  difficulty?: string;
  is_active: boolean;
  current_week: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

/** Database model for `user_drill_stats` table */
export interface UserDrillStats {
  id: string;
  user_id: string;
  drill_id: string;
  total_attempts: number;
  correct_answers: number;
  best_score: number;
  average_score: number;
  current_streak: number;
  best_streak: number;
  last_attempt_at?: string;
  total_time_seconds: number;
}

/** Database model for `user_interests` table */
export interface UserInterests {
  id: string;
  user_id: string;
  interest_key: string;
  interest_label: string;
  created_at: string;
}

/** Database model for `user_onboarding_responses` table */
export interface UserOnboardingResponses {
  id: string;
  user_id: string;
  step_id: string;
  response: Record<string, unknown>;
  created_at: string;
}

/** Database model for `user_onboarding_state` table */
export interface UserOnboardingState {
  id: string;
  user_id: string;
  flow_id: string;
  current_step_id?: string;
  status: string;
  can_resume: boolean;
  started_at?: string;
  completed_at?: string;
  skipped_at?: string;
  created_at: string;
  updated_at: string;
}

/** Database model for `user_quest_progress` table */
export interface UserQuestProgress {
  id: string;
  user_id: string;
  quest_id: string;
  status: string;
  progress: number;
  accepted_at: string;
  completed_at?: string;
  claimed_at?: string;
  last_reset_at?: string;
  times_completed: number;
  created_at: string;
  updated_at: string;
}

/** Database model for `user_references` table */
export interface UserReferences {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  url?: string;
  category?: string;
  tags?: string[];
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

/** Database model for `user_rewards` table */
export interface UserRewards {
  id: string;
  user_id: string;
  reward_type: string;
  source_id?: string;
  coins_earned: number;
  xp_earned: number;
  claimed: boolean;
  claimed_at?: string;
  expires_at?: string;
  created_at: string;
}

/** Database model for `user_streaks` table */
export interface UserStreaks {
  id: string;
  user_id: string;
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  created_at: string;
  updated_at: string;
}

/** Database model for `workout_sections` table */
export interface WorkoutSections {
  id: string;
  workout_id: string;
  name: string;
  section_type?: string;
  sort_order: number;
}

/** Database model for `workouts` table */
export interface Workouts {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  estimated_duration?: number;
  difficulty?: string;
  category?: string;
  is_template: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// TYPE ALIASES
// =============================================================================

export type Account = Accounts;
export type AchievementDefinition = AchievementDefinitions;
export type ActivityEvent = ActivityEvents;
export type AnalysisEvent = AnalysisEvents;
export type AnalysisFrameManifest = AnalysisFrameManifests;
export type Authenticator = Authenticators;
export type Book = Books;
export type CalendarEvent = CalendarEvents;
export type DailyPlan = DailyPlans;
export type Entitlement = Entitlements;
export type ExerciseSet = ExerciseSets;
export type Exercise = Exercises;
export type FeatureFlag = FeatureFlags;
export type FocusLibrary = FocusLibraries;
export type FocusLibraryTrack = FocusLibraryTracks;
export type FocusSession = FocusSessions;
export type GoalMileston = GoalMilestones;
export type Goal = Goals;
export type HabitCompletion = HabitCompletions;
export type Habit = Habits;
export type Idea = Ideas;
export type InboxItem = InboxItems;
export type InfobaseEntry = InfobaseEntries;
export type LearnDrill = LearnDrills;
export type LearnLesson = LearnLessons;
export type LearnTopic = LearnTopics;
export type ListeningPromptPreset = ListeningPromptPresets;
export type ListeningPromptTemplat = ListeningPromptTemplates;
export type MarketItem = MarketItems;
export type MarketRecommendation = MarketRecommendations;
export type MarketTransaction = MarketTransactions;
export type OauthStat = OauthStates;
export type OnboardingFlow = OnboardingFlows;
export type OnboardingStep = OnboardingSteps;
export type PersonalRecord = PersonalRecords;
export type PlanTemplat = PlanTemplates;
export type ProgramWeek = ProgramWeeks;
export type ProgramWorkout = ProgramWorkouts;
export type ReadingSession = ReadingSessions;
export type ReferenceTrack = ReferenceTracks;
export type RoleEntitlement = RoleEntitlements;
export type Rol = Roles;
export type Session = Sessions;
export type SkillDefinition = SkillDefinitions;
export type TrackAnalyse = TrackAnalyses;
export type TrackAnnotation = TrackAnnotations;
export type TrackRegion = TrackRegions;
export type TrainingProgram = TrainingPrograms;
export type UniversalQuest = UniversalQuests;
export type UserAchievement = UserAchievements;
export type UserDrillStat = UserDrillStats;
export type UserInterest = UserInterests;
export type UserOnboardingResponse = UserOnboardingResponses;
export type UserPurchase = UserPurchases;
export type UserQuest = UserQuests;
export type UserReferenc = UserReferences;
export type UserReward = UserRewards;
export type UserRol = UserRoles;
export type UserSetting = UserSettings;
export type UserSkill = UserSkills;
export type UserStreak = UserStreaks;
export type User = Users;
export type VerificationToken = VerificationTokens;
export type WorkoutExercise = WorkoutExercises;
export type WorkoutSection = WorkoutSections;
export type WorkoutSession = WorkoutSessions;
export type Workout = Workouts;

export const SCHEMA_VERSION = "2.0.0";

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Create input - omit auto-generated fields */
export type CreateInput<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

/** Update input - all fields optional except id */
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'created_at'>> & { id: string };

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
