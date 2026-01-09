//! Exercise/Fitness models
//!
//! Models for exercise definitions, workouts, sessions, and training programs.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ============================================================================
// ENUMS
// ============================================================================

/// Workout session status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WorkoutSessionStatus {
    InProgress,
    Completed,
    Abandoned,
}

/// Program difficulty
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProgramDifficulty {
    Beginner,
    Intermediate,
    Advanced,
}

impl ProgramDifficulty {
    pub fn as_str(&self) -> &'static str {
        match self {
            ProgramDifficulty::Beginner => "beginner",
            ProgramDifficulty::Intermediate => "intermediate",
            ProgramDifficulty::Advanced => "advanced",
        }
    }
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

/// Exercise definition
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Exercise {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub muscle_groups: Option<Vec<String>>,
    pub equipment: Option<Vec<String>>,
    pub is_custom: bool,
    pub is_builtin: bool,
    pub user_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

/// Workout template/instance
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Workout {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub estimated_duration: Option<i32>,
    pub is_template: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Workout section
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct WorkoutSection {
    pub id: Uuid,
    pub workout_id: Uuid,
    pub name: String,
    pub sort_order: i32,
}

/// Exercise in workout
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct WorkoutExercise {
    pub id: Uuid,
    pub workout_id: Uuid,
    pub section_id: Option<Uuid>,
    pub exercise_id: Uuid,
    pub sets: i32,
    pub reps: Option<String>,
    pub weight: Option<String>,
    pub duration: Option<i32>,
    pub rest_seconds: Option<i32>,
    pub notes: Option<String>,
    pub sort_order: i32,
}

/// Workout session (completed workout)
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct WorkoutSession {
    pub id: Uuid,
    pub user_id: Uuid,
    pub workout_id: Option<Uuid>,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub notes: Option<String>,
    pub rating: Option<i32>,
    pub xp_awarded: i32,
    pub coins_awarded: i32,
}

/// Exercise set logged during session
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ExerciseSet {
    pub id: Uuid,
    pub session_id: Uuid,
    pub exercise_id: Uuid,
    pub set_number: i32,
    pub reps: Option<i32>,
    pub weight: Option<f64>,
    pub duration: Option<i32>,
    pub is_warmup: bool,
    pub is_dropset: bool,
    pub rpe: Option<i32>,
    pub notes: Option<String>,
    pub completed_at: Option<DateTime<Utc>>,
}

/// Personal record
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct PersonalRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub exercise_id: Uuid,
    pub record_type: String,
    pub value: f64,
    pub reps: Option<i32>,
    pub achieved_at: DateTime<Utc>,
    pub exercise_set_id: Option<Uuid>,
    pub previous_value: Option<f64>,
    pub created_at: DateTime<Utc>,
}

/// Training program
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct TrainingProgram {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub duration_weeks: i32,
    pub goal: Option<String>,
    pub difficulty: Option<String>,
    pub is_active: bool,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// REQUEST MODELS
// ============================================================================

/// Create exercise request
#[derive(Debug, Deserialize)]
pub struct CreateExerciseRequest {
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub muscle_groups: Option<Vec<String>>,
    pub equipment: Option<Vec<String>>,
}

/// Create workout request
#[derive(Debug, Deserialize)]
pub struct CreateWorkoutRequest {
    pub name: String,
    pub description: Option<String>,
    pub estimated_duration: Option<i32>,
    pub is_template: Option<bool>,
}

/// Start workout session request
#[derive(Debug, Deserialize)]
pub struct StartSessionRequest {
    pub workout_id: Option<Uuid>,
}

/// Log exercise set request
#[derive(Debug, Deserialize)]
pub struct LogSetRequest {
    pub exercise_id: Uuid,
    pub set_number: i32,
    pub reps: Option<i32>,
    pub weight: Option<f64>,
    pub duration: Option<i32>,
    pub is_warmup: Option<bool>,
    pub is_dropset: Option<bool>,
    pub rpe: Option<i32>,
    pub notes: Option<String>,
}

/// Complete workout session request
#[derive(Debug, Deserialize)]
pub struct CompleteSessionRequest {
    pub notes: Option<String>,
    pub rating: Option<i32>,
}

/// Create program request
#[derive(Debug, Deserialize)]
pub struct CreateProgramRequest {
    pub name: String,
    pub description: Option<String>,
    pub duration_weeks: Option<i32>,
    pub goal: Option<String>,
    pub difficulty: Option<String>,
}

// ============================================================================
// RESPONSE MODELS
// ============================================================================

/// Exercise response
#[derive(Serialize)]
pub struct ExerciseResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub muscle_groups: Vec<String>,
    pub equipment: Vec<String>,
    pub is_custom: bool,
    pub is_builtin: bool,
}

impl From<Exercise> for ExerciseResponse {
    fn from(e: Exercise) -> Self {
        Self {
            id: e.id,
            name: e.name,
            description: e.description,
            category: e.category,
            muscle_groups: e.muscle_groups.unwrap_or_default(),
            equipment: e.equipment.unwrap_or_default(),
            is_custom: e.is_custom,
            is_builtin: e.is_builtin,
        }
    }
}

/// Exercises list response
#[derive(Serialize)]
pub struct ExercisesListResponse {
    pub exercises: Vec<ExerciseResponse>,
    pub total: i64,
}

/// Workout response with exercises
#[derive(Serialize)]
pub struct WorkoutResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub estimated_duration: Option<i32>,
    pub is_template: bool,
    pub exercises: Vec<WorkoutExerciseDetail>,
    pub created_at: DateTime<Utc>,
}

/// Workout exercise with exercise details
#[derive(Serialize)]
pub struct WorkoutExerciseDetail {
    pub id: Uuid,
    pub exercise_id: Uuid,
    pub exercise_name: String,
    pub sets: i32,
    pub reps: Option<String>,
    pub weight: Option<String>,
    pub duration: Option<i32>,
    pub rest_seconds: Option<i32>,
    pub notes: Option<String>,
    pub sort_order: i32,
}

/// Workouts list response
#[derive(Serialize)]
pub struct WorkoutsListResponse {
    pub workouts: Vec<WorkoutResponse>,
    pub total: i64,
}

/// Workout session response
#[derive(Serialize)]
pub struct WorkoutSessionResponse {
    pub id: Uuid,
    pub workout_id: Option<Uuid>,
    pub workout_name: Option<String>,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub duration_minutes: Option<i64>,
    pub sets_logged: i32,
    pub notes: Option<String>,
    pub rating: Option<i32>,
    pub xp_awarded: i32,
    pub coins_awarded: i32,
}

/// Sessions list response
#[derive(Serialize)]
pub struct SessionsListResponse {
    pub sessions: Vec<WorkoutSessionResponse>,
    pub total: i64,
}

/// Complete session result
#[derive(Serialize)]
pub struct CompleteSessionResult {
    pub session: WorkoutSessionResponse,
    pub xp_awarded: i32,
    pub coins_awarded: i32,
    pub personal_records: Vec<PersonalRecordResponse>,
}

/// Personal record response
#[derive(Serialize)]
pub struct PersonalRecordResponse {
    pub exercise_name: String,
    pub record_type: String,
    pub new_value: f64,
    pub previous_value: Option<f64>,
    pub improvement: Option<f64>,
}

/// Program response
#[derive(Serialize)]
pub struct ProgramResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub duration_weeks: i32,
    pub goal: Option<String>,
    pub difficulty: Option<String>,
    pub is_active: bool,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
}

impl From<TrainingProgram> for ProgramResponse {
    fn from(p: TrainingProgram) -> Self {
        Self {
            id: p.id,
            name: p.name,
            description: p.description,
            duration_weeks: p.duration_weeks,
            goal: p.goal,
            difficulty: p.difficulty,
            is_active: p.is_active,
            started_at: p.started_at,
            completed_at: p.completed_at,
        }
    }
}

/// Programs list response
#[derive(Serialize)]
pub struct ProgramsListResponse {
    pub programs: Vec<ProgramResponse>,
    pub total: i64,
}
