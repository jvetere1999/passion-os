//! Exercise/Fitness routes
//!
//! Routes for exercises, workouts, sessions, and programs.

use std::sync::Arc;

use axum::{
    extract::{Extension, Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::exercise_models::*;
use crate::db::exercise_repos::{ExerciseRepo, ProgramRepo, WorkoutRepo, WorkoutSessionRepo};
use crate::db::models::User;
use crate::error::AppError;
use crate::state::AppState;

/// Create exercise routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        // Exercises
        .route("/", get(list_exercises).post(create_exercise))
        .route("/{id}", get(get_exercise).delete(delete_exercise))
        .route("/seed", post(seed_exercises))
        // Workouts
        .route("/workouts", get(list_workouts).post(create_workout))
        .route("/workouts/{id}", get(get_workout).delete(delete_workout))
        // Sessions
        .route("/sessions", get(list_sessions).post(start_session))
        .route("/sessions/active", get(get_active_session))
        .route("/sessions/{id}/sets", post(log_set))
        .route("/sessions/{id}/complete", post(complete_session))
        // Programs
        .route("/programs", get(list_programs).post(create_program))
        .route("/programs/{id}", get(get_program))
        .route("/programs/{id}/activate", post(activate_program))
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ListExercisesQuery {
    pub category: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListWorkoutsQuery {
    pub templates_only: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ListSessionsQuery {
    pub limit: Option<i64>,
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(Serialize)]
struct ExerciseWrapper {
    data: ExerciseResponse,
}

#[derive(Serialize)]
struct ExercisesListWrapper {
    data: ExercisesListResponse,
}

#[derive(Serialize)]
struct WorkoutWrapper {
    data: WorkoutResponse,
}

#[derive(Serialize)]
struct WorkoutsListWrapper {
    data: WorkoutsListResponse,
}

#[derive(Serialize)]
struct SessionWrapper {
    data: WorkoutSessionResponse,
}

#[derive(Serialize)]
struct SessionsListWrapper {
    data: SessionsListResponse,
}

#[derive(Serialize)]
struct CompleteSessionWrapper {
    data: CompleteSessionResult,
}

#[derive(Serialize)]
struct SetWrapper {
    data: SetResponse,
}

#[derive(Serialize)]
struct SetResponse {
    id: Uuid,
    set_number: i32,
    reps: Option<i32>,
    weight: Option<f64>,
}

#[derive(Serialize)]
struct ProgramWrapper {
    data: ProgramResponse,
}

#[derive(Serialize)]
struct ProgramsListWrapper {
    data: ProgramsListResponse,
}

#[derive(Serialize)]
struct SeedResult {
    message: String,
    count: i32,
}

// ============================================================================
// EXERCISE HANDLERS
// ============================================================================

/// GET /exercise
/// List exercises (builtin + user's custom)
async fn list_exercises(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListExercisesQuery>,
) -> Result<Json<ExercisesListWrapper>, AppError> {
    let result = ExerciseRepo::list(&state.db, user.id, query.category.as_deref()).await?;
    Ok(Json(ExercisesListWrapper { data: result }))
}

/// POST /exercise
/// Create custom exercise
async fn create_exercise(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateExerciseRequest>,
) -> Result<Json<ExerciseWrapper>, AppError> {
    let exercise = ExerciseRepo::create(&state.db, user.id, &req).await?;
    Ok(Json(ExerciseWrapper {
        data: exercise.into(),
    }))
}

/// GET /exercise/:id
/// Get exercise by ID
async fn get_exercise(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<ExerciseWrapper>, AppError> {
    let exercise = ExerciseRepo::get_by_id(&state.db, id, user.id).await?;
    let exercise = exercise.ok_or_else(|| AppError::NotFound("Exercise not found".to_string()))?;
    Ok(Json(ExerciseWrapper {
        data: exercise.into(),
    }))
}

/// DELETE /exercise/:id
/// Delete custom exercise
async fn delete_exercise(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let deleted = ExerciseRepo::delete(&state.db, id, user.id).await?;
    if !deleted {
        return Err(AppError::NotFound(
            "Exercise not found or cannot be deleted".to_string(),
        ));
    }
    Ok(Json(serde_json::json!({ "message": "Exercise deleted" })))
}

/// POST /exercise/seed
/// Seed builtin exercises (admin endpoint)
async fn seed_exercises(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(exercises): Json<Vec<CreateExerciseRequest>>,
) -> Result<Json<SeedResult>, AppError> {
    // TODO: Check admin role
    let _ = user;
    let count = ExerciseRepo::seed_builtin(&state.db, exercises).await?;
    Ok(Json(SeedResult {
        message: format!("Seeded {} exercises", count),
        count,
    }))
}

// ============================================================================
// WORKOUT HANDLERS
// ============================================================================

/// GET /exercise/workouts
/// List user's workouts
async fn list_workouts(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListWorkoutsQuery>,
) -> Result<Json<WorkoutsListWrapper>, AppError> {
    let result =
        WorkoutRepo::list(&state.db, user.id, query.templates_only.unwrap_or(false)).await?;
    Ok(Json(WorkoutsListWrapper { data: result }))
}

/// POST /exercise/workouts
/// Create workout
async fn create_workout(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateWorkoutRequest>,
) -> Result<Json<WorkoutWrapper>, AppError> {
    let workout = WorkoutRepo::create(&state.db, user.id, &req).await?;
    Ok(Json(WorkoutWrapper {
        data: WorkoutResponse {
            id: workout.id,
            name: workout.name,
            description: workout.description,
            estimated_duration: workout.estimated_duration,
            is_template: workout.is_template,
            exercises: vec![],
            created_at: workout.created_at,
        },
    }))
}

/// GET /exercise/workouts/:id
/// Get workout by ID
async fn get_workout(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<WorkoutWrapper>, AppError> {
    let workout = WorkoutRepo::get_by_id(&state.db, id, user.id).await?;
    let workout = workout.ok_or_else(|| AppError::NotFound("Workout not found".to_string()))?;
    Ok(Json(WorkoutWrapper { data: workout }))
}

/// DELETE /exercise/workouts/:id
/// Delete workout
async fn delete_workout(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let deleted = WorkoutRepo::delete(&state.db, id, user.id).await?;
    if !deleted {
        return Err(AppError::NotFound("Workout not found".to_string()));
    }
    Ok(Json(serde_json::json!({ "message": "Workout deleted" })))
}

// ============================================================================
// SESSION HANDLERS
// ============================================================================

/// GET /exercise/sessions
/// List user's workout sessions
async fn list_sessions(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListSessionsQuery>,
) -> Result<Json<SessionsListWrapper>, AppError> {
    let limit = query.limit.unwrap_or(20).min(100);
    let result = WorkoutSessionRepo::list(&state.db, user.id, limit).await?;
    Ok(Json(SessionsListWrapper { data: result }))
}

/// POST /exercise/sessions
/// Start a workout session
async fn start_session(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<StartSessionRequest>,
) -> Result<Json<SessionWrapper>, AppError> {
    // Check for existing active session
    let active = WorkoutSessionRepo::get_active(&state.db, user.id).await?;
    if active.is_some() {
        return Err(AppError::BadRequest(
            "Already have an active session".to_string(),
        ));
    }

    let session = WorkoutSessionRepo::start(&state.db, user.id, req.workout_id).await?;

    // Get workout name if provided
    let workout_name: Option<String> = if let Some(wid) = session.workout_id {
        sqlx::query_scalar("SELECT name FROM workouts WHERE id = $1")
            .bind(wid)
            .fetch_optional(&state.db)
            .await?
    } else {
        None
    };

    Ok(Json(SessionWrapper {
        data: WorkoutSessionResponse {
            id: session.id,
            workout_id: session.workout_id,
            workout_name,
            started_at: session.started_at,
            completed_at: session.completed_at,
            duration_minutes: None,
            sets_logged: 0,
            notes: session.notes,
            rating: session.rating,
            xp_awarded: session.xp_awarded,
            coins_awarded: session.coins_awarded,
        },
    }))
}

/// GET /exercise/sessions/active
/// Get active workout session
async fn get_active_session(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<serde_json::Value>, AppError> {
    let session = WorkoutSessionRepo::get_active(&state.db, user.id).await?;

    match session {
        Some(s) => {
            // Get workout name
            let workout_name: Option<String> = if let Some(wid) = s.workout_id {
                sqlx::query_scalar("SELECT name FROM workouts WHERE id = $1")
                    .bind(wid)
                    .fetch_optional(&state.db)
                    .await?
            } else {
                None
            };

            // Get sets count
            let sets_logged: Option<i64> =
                sqlx::query_scalar("SELECT COUNT(*) FROM exercise_sets WHERE session_id = $1")
                    .bind(s.id)
                    .fetch_one(&state.db)
                    .await?;

            Ok(Json(serde_json::json!({
                "data": {
                    "id": s.id,
                    "workout_id": s.workout_id,
                    "workout_name": workout_name,
                    "started_at": s.started_at,
                    "sets_logged": sets_logged.unwrap_or(0),
                }
            })))
        }
        None => Ok(Json(serde_json::json!({ "data": null }))),
    }
}

/// POST /exercise/sessions/:id/sets
/// Log an exercise set
async fn log_set(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(session_id): Path<Uuid>,
    Json(req): Json<LogSetRequest>,
) -> Result<Json<SetWrapper>, AppError> {
    let set = WorkoutSessionRepo::log_set(&state.db, user.id, session_id, &req).await?;
    Ok(Json(SetWrapper {
        data: SetResponse {
            id: set.id,
            set_number: set.set_number,
            reps: set.reps,
            weight: set.weight,
        },
    }))
}

/// POST /exercise/sessions/:id/complete
/// Complete a workout session
async fn complete_session(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(session_id): Path<Uuid>,
    Json(req): Json<CompleteSessionRequest>,
) -> Result<Json<CompleteSessionWrapper>, AppError> {
    let result = WorkoutSessionRepo::complete(&state.db, user.id, session_id, &req).await?;
    Ok(Json(CompleteSessionWrapper { data: result }))
}

// ============================================================================
// PROGRAM HANDLERS
// ============================================================================

/// GET /exercise/programs
/// List user's training programs
async fn list_programs(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<ProgramsListWrapper>, AppError> {
    let result = ProgramRepo::list(&state.db, user.id).await?;
    Ok(Json(ProgramsListWrapper { data: result }))
}

/// POST /exercise/programs
/// Create training program
async fn create_program(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateProgramRequest>,
) -> Result<Json<ProgramWrapper>, AppError> {
    let program = ProgramRepo::create(&state.db, user.id, &req).await?;
    Ok(Json(ProgramWrapper {
        data: program.into(),
    }))
}

/// GET /exercise/programs/:id
/// Get program by ID
async fn get_program(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<ProgramWrapper>, AppError> {
    let program = ProgramRepo::get_by_id(&state.db, id, user.id).await?;
    let program = program.ok_or_else(|| AppError::NotFound("Program not found".to_string()))?;
    Ok(Json(ProgramWrapper {
        data: program.into(),
    }))
}

/// POST /exercise/programs/:id/activate
/// Activate a training program
async fn activate_program(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<ProgramWrapper>, AppError> {
    let program = ProgramRepo::activate(&state.db, id, user.id).await?;
    Ok(Json(ProgramWrapper {
        data: program.into(),
    }))
}
