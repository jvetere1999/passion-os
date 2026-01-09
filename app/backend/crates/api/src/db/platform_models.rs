//! Platform models
//!
//! Models for Calendar, Daily Plan, Feedback, Infobase, Ideas, Onboarding, and User settings.

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ============================================================================
// CALENDAR
// ============================================================================

/// Calendar event database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct CalendarEvent {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub event_type: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub all_day: bool,
    pub timezone: Option<String>,
    pub location: Option<String>,
    pub workout_id: Option<Uuid>,
    pub habit_id: Option<Uuid>,
    pub goal_id: Option<Uuid>,
    pub recurrence_rule: Option<String>,
    pub recurrence_end: Option<DateTime<Utc>>,
    pub parent_event_id: Option<Uuid>,
    pub color: Option<String>,
    pub reminder_minutes: Option<i32>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Create calendar event request
#[derive(Debug, Clone, Deserialize)]
pub struct CreateCalendarEventRequest {
    pub title: String,
    pub description: Option<String>,
    #[serde(default = "default_event_type")]
    pub event_type: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    #[serde(default)]
    pub all_day: bool,
    pub timezone: Option<String>,
    pub location: Option<String>,
    pub workout_id: Option<Uuid>,
    pub habit_id: Option<Uuid>,
    pub goal_id: Option<Uuid>,
    pub recurrence_rule: Option<String>,
    pub recurrence_end: Option<DateTime<Utc>>,
    pub parent_event_id: Option<Uuid>,
    pub color: Option<String>,
    pub reminder_minutes: Option<i32>,
    pub metadata: Option<serde_json::Value>,
}

fn default_event_type() -> String {
    "general".to_string()
}

/// Update calendar event request
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateCalendarEventRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub event_type: Option<String>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub all_day: Option<bool>,
    pub timezone: Option<String>,
    pub location: Option<String>,
    pub color: Option<String>,
    pub reminder_minutes: Option<i32>,
    pub metadata: Option<serde_json::Value>,
}

/// Calendar event response
#[derive(Debug, Clone, Serialize)]
pub struct CalendarEventResponse {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub event_type: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub all_day: bool,
    pub timezone: Option<String>,
    pub location: Option<String>,
    pub color: Option<String>,
    pub reminder_minutes: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Calendar events list response
#[derive(Debug, Clone, Serialize)]
pub struct CalendarEventsListResponse {
    pub events: Vec<CalendarEventResponse>,
}

// ============================================================================
// DAILY PLAN
// ============================================================================

/// Daily plan database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct DailyPlan {
    pub id: Uuid,
    pub user_id: Uuid,
    pub date: NaiveDate,
    pub items: serde_json::Value,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Plan item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanItem {
    pub id: String,
    #[serde(rename = "type")]
    pub item_type: String,
    pub title: String,
    pub description: Option<String>,
    pub duration: Option<i32>,
    pub action_url: String,
    pub completed: bool,
    pub priority: i32,
}

/// Create/update daily plan request
#[derive(Debug, Clone, Deserialize)]
pub struct UpsertDailyPlanRequest {
    pub date: NaiveDate,
    pub items: Option<Vec<PlanItem>>,
    pub notes: Option<String>,
}

/// Generate daily plan request
#[derive(Debug, Clone, Deserialize)]
pub struct GeneratePlanRequest {
    pub date: Option<NaiveDate>,
}

/// Complete plan item request
#[derive(Debug, Clone, Deserialize)]
pub struct CompletePlanItemRequest {
    pub item_id: String,
    pub completed: bool,
}

/// Daily plan response
#[derive(Debug, Clone, Serialize)]
pub struct DailyPlanResponse {
    pub id: Uuid,
    pub date: NaiveDate,
    pub items: Vec<PlanItem>,
    pub notes: Option<String>,
    pub completed_count: i32,
    pub total_count: i32,
}

// ============================================================================
// FEEDBACK
// ============================================================================

/// Feedback database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Feedback {
    pub id: Uuid,
    pub user_id: Uuid,
    pub feedback_type: String,
    pub title: String,
    pub description: String,
    pub status: String,
    pub priority: String,
    pub admin_response: Option<String>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Create feedback request
#[derive(Debug, Clone, Deserialize)]
pub struct CreateFeedbackRequest {
    #[serde(rename = "type")]
    pub feedback_type: String,
    pub title: String,
    pub description: String,
    #[serde(default = "default_priority")]
    pub priority: String,
}

fn default_priority() -> String {
    "normal".to_string()
}

/// Feedback response
#[derive(Debug, Clone, Serialize)]
pub struct FeedbackResponse {
    pub id: Uuid,
    pub feedback_type: String,
    pub title: String,
    pub description: String,
    pub status: String,
    pub priority: String,
    pub admin_response: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Feedback list response
#[derive(Debug, Clone, Serialize)]
pub struct FeedbackListResponse {
    pub feedback: Vec<FeedbackResponse>,
}

// ============================================================================
// INFOBASE
// ============================================================================

/// Infobase entry database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct InfobaseEntry {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub content: String,
    pub category: String,
    pub tags: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Create infobase entry request
#[derive(Debug, Clone, Deserialize)]
pub struct CreateInfobaseEntryRequest {
    pub title: String,
    pub content: String,
    #[serde(default = "default_category")]
    pub category: String,
    pub tags: Option<Vec<String>>,
}

fn default_category() -> String {
    "Tips".to_string()
}

/// Update infobase entry request
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateInfobaseEntryRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
}

/// Infobase entry response
#[derive(Debug, Clone, Serialize)]
pub struct InfobaseEntryResponse {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub category: String,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Infobase list response
#[derive(Debug, Clone, Serialize)]
pub struct InfobaseListResponse {
    pub entries: Vec<InfobaseEntryResponse>,
}

// ============================================================================
// IDEAS
// ============================================================================

/// Idea database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Idea {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub content: Option<String>,
    pub category: String,
    pub tags: Option<serde_json::Value>,
    pub is_pinned: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Create idea request
#[derive(Debug, Clone, Deserialize)]
pub struct CreateIdeaRequest {
    pub title: String,
    pub content: Option<String>,
    #[serde(default = "default_idea_category")]
    pub category: String,
    pub tags: Option<Vec<String>>,
    // Music-specific fields that get folded into content
    pub key: Option<String>,
    pub bpm: Option<i32>,
    pub mood: Option<String>,
}

fn default_idea_category() -> String {
    "general".to_string()
}

/// Update idea request
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateIdeaRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_pinned: Option<bool>,
}

/// Idea response
#[derive(Debug, Clone, Serialize)]
pub struct IdeaResponse {
    pub id: Uuid,
    pub title: String,
    pub content: Option<String>,
    pub category: String,
    pub tags: Vec<String>,
    pub is_pinned: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Ideas list response
#[derive(Debug, Clone, Serialize)]
pub struct IdeasListResponse {
    pub ideas: Vec<IdeaResponse>,
}

// ============================================================================
// ONBOARDING
// ============================================================================

/// Onboarding flow database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct OnboardingFlow {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub is_active: bool,
    pub total_steps: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Onboarding step database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct OnboardingStep {
    pub id: Uuid,
    pub flow_id: Uuid,
    pub step_order: i32,
    pub step_type: String,
    pub title: String,
    pub description: Option<String>,
    pub target_selector: Option<String>,
    pub target_route: Option<String>,
    pub fallback_content: Option<String>,
    pub options: Option<serde_json::Value>,
    pub allows_multiple: bool,
    pub required: bool,
    pub action_type: Option<String>,
    pub action_config: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// User onboarding state database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserOnboardingState {
    pub id: Uuid,
    pub user_id: Uuid,
    pub flow_id: Uuid,
    pub current_step_id: Option<Uuid>,
    pub status: String,
    pub can_resume: bool,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub skipped_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Step response (for API)
#[derive(Debug, Clone, Serialize)]
pub struct OnboardingStepResponse {
    pub id: Uuid,
    pub order: i32,
    pub step_type: String,
    pub title: String,
    pub description: Option<String>,
    pub target_selector: Option<String>,
    pub target_route: Option<String>,
    pub fallback_content: Option<String>,
    pub options: Option<serde_json::Value>,
    pub allows_multiple: bool,
    pub required: bool,
    pub action_type: Option<String>,
    pub action_config: Option<serde_json::Value>,
}

/// Onboarding state response
#[derive(Debug, Clone, Serialize)]
pub struct OnboardingStateResponse {
    pub status: String,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub skipped_at: Option<DateTime<Utc>>,
    pub can_resume: bool,
}

/// Flow summary response
#[derive(Debug, Clone, Serialize)]
pub struct OnboardingFlowResponse {
    pub id: Uuid,
    pub name: String,
    pub total_steps: i32,
}

/// Step summary (for listing all steps)
#[derive(Debug, Clone, Serialize)]
pub struct OnboardingStepSummary {
    pub id: Uuid,
    pub order: i32,
    pub step_type: String,
    pub title: String,
}

/// Full onboarding response
#[derive(Debug, Clone, Serialize)]
pub struct OnboardingResponse {
    pub needs_onboarding: bool,
    pub state: Option<OnboardingStateResponse>,
    pub progress: OnboardingProgress,
    pub flow: Option<OnboardingFlowResponse>,
    pub current_step: Option<OnboardingStepResponse>,
    pub all_steps: Vec<OnboardingStepSummary>,
}

/// Onboarding progress
#[derive(Debug, Clone, Serialize)]
pub struct OnboardingProgress {
    pub completed_steps: i32,
    pub total_steps: i32,
    pub percent_complete: i32,
}

/// Complete step request
#[derive(Debug, Clone, Deserialize)]
pub struct CompleteStepRequest {
    pub step_id: Uuid,
    pub response: Option<serde_json::Value>,
}

/// Start onboarding response
#[derive(Debug, Clone, Serialize)]
pub struct StartOnboardingResponse {
    pub success: bool,
    pub state: OnboardingStateResponse,
    pub current_step: Option<OnboardingStepResponse>,
}

/// Complete step response
#[derive(Debug, Clone, Serialize)]
pub struct CompleteStepResponse {
    pub success: bool,
    pub completed: bool,
    pub next_step: Option<OnboardingStepResponse>,
}

/// Skip onboarding response
#[derive(Debug, Clone, Serialize)]
pub struct SkipOnboardingResponse {
    pub success: bool,
    pub message: String,
    pub soft_landing_until: Option<DateTime<Utc>>,
}

// ============================================================================
// USER SETTINGS
// ============================================================================

/// User settings database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserSettings {
    pub id: Uuid,
    pub user_id: Uuid,
    pub notifications_enabled: bool,
    pub email_notifications: bool,
    pub push_notifications: bool,
    pub theme: String,
    pub timezone: Option<String>,
    pub locale: String,
    pub profile_public: bool,
    pub show_activity: bool,
    pub soft_landing_until: Option<DateTime<Utc>>,
    pub daily_reminder_time: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Update settings request
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateUserSettingsRequest {
    pub notifications_enabled: Option<bool>,
    pub email_notifications: Option<bool>,
    pub push_notifications: Option<bool>,
    pub theme: Option<String>,
    pub timezone: Option<String>,
    pub locale: Option<String>,
    pub profile_public: Option<bool>,
    pub show_activity: Option<bool>,
    pub daily_reminder_time: Option<String>,
}

/// User settings response
#[derive(Debug, Clone, Serialize)]
pub struct UserSettingsResponse {
    pub notifications_enabled: bool,
    pub email_notifications: bool,
    pub push_notifications: bool,
    pub theme: String,
    pub timezone: Option<String>,
    pub locale: String,
    pub profile_public: bool,
    pub show_activity: bool,
    pub daily_reminder_time: Option<String>,
}

// ============================================================================
// USER INTERESTS
// ============================================================================

/// User interest database model
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserInterest {
    pub id: Uuid,
    pub user_id: Uuid,
    pub interest_key: String,
    pub interest_label: String,
    pub created_at: DateTime<Utc>,
}

/// Interest item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Interest {
    pub key: String,
    pub label: String,
}

/// User interests response
#[derive(Debug, Clone, Serialize)]
pub struct UserInterestsResponse {
    pub interests: Vec<Interest>,
}

// ============================================================================
// USER ACCOUNT
// ============================================================================

/// Delete account response
#[derive(Debug, Clone, Serialize)]
pub struct DeleteAccountResponse {
    pub success: bool,
    pub message: String,
}

/// Export data response is a full JSON object containing all user data
#[derive(Debug, Clone, Serialize)]
pub struct ExportDataResponse {
    pub exported_at: DateTime<Utc>,
    pub user_id: Uuid,
    pub email: Option<String>,
    pub data: serde_json::Value,
}
