//! Exercise/Fitness repository
//!
//! Database operations for exercises, workouts, sessions, and programs.

use chrono::Utc;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::error::AppError;

use super::exercise_models::*;

// ============================================================================
// EXERCISE REPOSITORY
// ============================================================================

pub struct ExerciseRepo;

impl ExerciseRepo {
    /// List exercises (builtin + user's custom)
    pub async fn list(
        pool: &PgPool,
        user_id: Uuid,
        category: Option<&str>,
    ) -> Result<ExercisesListResponse, AppError> {
        let exercises = if let Some(cat) = category {
            sqlx::query_as::<_, Exercise>(
                r#"
                SELECT id, name, description, category,
                       muscle_groups,
                       equipment,
                       is_custom, is_builtin, user_id, created_at
                FROM exercises
                WHERE (is_builtin = true OR user_id = $1)
                  AND category = $2
                ORDER BY is_builtin DESC, name
                "#,
            )
            .bind(user_id)
            .bind(cat)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as::<_, Exercise>(
                r#"
                SELECT id, name, description, category,
                       muscle_groups,
                       equipment,
                       is_custom, is_builtin, user_id, created_at
                FROM exercises
                WHERE is_builtin = true OR user_id = $1
                ORDER BY is_builtin DESC, name
                "#,
            )
            .bind(user_id)
            .fetch_all(pool)
            .await?
        };

        let total = exercises.len() as i64;

        Ok(ExercisesListResponse {
            exercises: exercises.into_iter().map(|e| e.into()).collect(),
            total,
        })
    }

    /// Create custom exercise
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        req: &CreateExerciseRequest,
    ) -> Result<Exercise, AppError> {
        let exercise = sqlx::query_as::<_, Exercise>(
            r#"
            INSERT INTO exercises (user_id, name, description, category, muscle_groups, equipment, is_custom)
            VALUES ($1, $2, $3, $4, $5, $6, true)
            RETURNING id, name, description, category,
                      muscle_groups,
                      equipment,
                      is_custom, is_builtin, user_id, created_at
            "#,
        )
        .bind(user_id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(&req.category)
        .bind(req.muscle_groups.as_deref())
        .bind(req.equipment.as_deref())
        .fetch_one(pool)
        .await?;

        Ok(exercise)
    }

    /// Get exercise by ID
    pub async fn get_by_id(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<Exercise>, AppError> {
        let exercise = sqlx::query_as::<_, Exercise>(
            r#"
            SELECT id, name, description, category,
                   muscle_groups,
                   equipment,
                   is_custom, is_builtin, user_id, created_at
            FROM exercises
            WHERE id = $1 AND (is_builtin = true OR user_id = $2)
            "#,
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(exercise)
    }

    /// Delete custom exercise
    pub async fn delete(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<bool, AppError> {
        let result = sqlx::query(
            r#"
            DELETE FROM exercises
            WHERE id = $1 AND user_id = $2 AND is_custom = true
            "#,
        )
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Seed builtin exercises (admin only)
    pub async fn seed_builtin(
        pool: &PgPool,
        exercises: Vec<CreateExerciseRequest>,
    ) -> Result<i32, AppError> {
        let mut count = 0;
        for req in exercises {
            let result = sqlx::query(
                r#"
                INSERT INTO exercises (name, description, category, muscle_groups, equipment, is_builtin)
                VALUES ($1, $2, $3, $4, $5, true)
                ON CONFLICT DO NOTHING
                "#,
            )
            .bind(&req.name)
            .bind(&req.description)
            .bind(&req.category)
            .bind(req.muscle_groups.as_deref())
            .bind(req.equipment.as_deref())
            .execute(pool)
            .await?;

            if result.rows_affected() > 0 {
                count += 1;
            }
        }
        Ok(count)
    }
}

// ============================================================================
// WORKOUT REPOSITORY
// ============================================================================

pub struct WorkoutRepo;

impl WorkoutRepo {
    /// List user's workouts
    pub async fn list(
        pool: &PgPool,
        user_id: Uuid,
        templates_only: bool,
    ) -> Result<WorkoutsListResponse, AppError> {
        let workouts: Vec<Workout> = if templates_only {
            sqlx::query_as::<_, Workout>(
                r#"
                SELECT id, user_id, name, description, estimated_duration,
                       is_template, created_at, updated_at
                FROM workouts
                WHERE user_id = $1 AND is_template = true
                ORDER BY updated_at DESC
                "#,
            )
            .bind(user_id)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as::<_, Workout>(
                r#"
                SELECT id, user_id, name, description, estimated_duration,
                       is_template, created_at, updated_at
                FROM workouts
                WHERE user_id = $1
                ORDER BY updated_at DESC
                "#,
            )
            .bind(user_id)
            .fetch_all(pool)
            .await?
        };

        let total = workouts.len() as i64;

        // Get exercises for each workout
        let mut responses = Vec::new();
        for workout in workouts {
            let exercises = Self::get_workout_exercises(pool, workout.id).await?;
            responses.push(WorkoutResponse {
                id: workout.id,
                name: workout.name,
                description: workout.description,
                estimated_duration: workout.estimated_duration,
                is_template: workout.is_template,
                exercises,
                created_at: workout.created_at,
            });
        }

        Ok(WorkoutsListResponse {
            workouts: responses,
            total,
        })
    }

    /// Get workout exercises with exercise names
    async fn get_workout_exercises(
        pool: &PgPool,
        workout_id: Uuid,
    ) -> Result<Vec<WorkoutExerciseDetail>, AppError> {
        #[derive(FromRow)]
        struct WorkoutExerciseRow {
            id: Uuid,
            exercise_id: Uuid,
            exercise_name: String,
            sets: Option<i32>,
            reps: Option<i32>,
            weight: Option<f64>,
            duration: Option<i32>,
            rest_seconds: Option<i32>,
            notes: Option<String>,
            sort_order: i32,
        }

        let rows = sqlx::query_as::<_, WorkoutExerciseRow>(
            r#"
            SELECT we.id, we.exercise_id, e.name as exercise_name,
                   we.sets, we.reps, we.weight, we.duration,
                   we.rest_seconds, we.notes, we.sort_order
            FROM workout_exercises we
            JOIN exercises e ON we.exercise_id = e.id
            WHERE we.workout_id = $1
            ORDER BY we.sort_order
            "#,
        )
        .bind(workout_id)
        .fetch_all(pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|r| WorkoutExerciseDetail {
                id: r.id,
                exercise_id: r.exercise_id,
                exercise_name: r.exercise_name,
                sets: r.sets.unwrap_or(0),
                reps: r.reps.map(|v| v.to_string()),
                weight: r.weight.map(|v| v.to_string()),
                duration: r.duration,
                rest_seconds: r.rest_seconds,
                notes: r.notes,
                sort_order: r.sort_order,
            })
            .collect())
    }

    /// Create workout
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        req: &CreateWorkoutRequest,
    ) -> Result<Workout, AppError> {
        let workout = sqlx::query_as::<_, Workout>(
            r#"
            INSERT INTO workouts (user_id, name, description, estimated_duration, is_template)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, user_id, name, description, estimated_duration,
                      is_template, created_at, updated_at
            "#,
        )
        .bind(user_id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(req.estimated_duration)
        .bind(req.is_template.unwrap_or(false))
        .fetch_one(pool)
        .await?;

        Ok(workout)
    }

    /// Get workout by ID
    pub async fn get_by_id(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<WorkoutResponse>, AppError> {
        let workout = sqlx::query_as::<_, Workout>(
            r#"
            SELECT id, user_id, name, description, estimated_duration,
                   is_template, created_at, updated_at
            FROM workouts
            WHERE id = $1 AND user_id = $2
            "#,
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        match workout {
            Some(w) => {
                let exercises = Self::get_workout_exercises(pool, w.id).await?;
                Ok(Some(WorkoutResponse {
                    id: w.id,
                    name: w.name,
                    description: w.description,
                    estimated_duration: w.estimated_duration,
                    is_template: w.is_template,
                    exercises,
                    created_at: w.created_at,
                }))
            }
            None => Ok(None),
        }
    }

    /// Delete workout
    pub async fn delete(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<bool, AppError> {
        let result = sqlx::query("DELETE FROM workouts WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(user_id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}

// ============================================================================
// WORKOUT SESSION REPOSITORY
// ============================================================================

pub struct WorkoutSessionRepo;

impl WorkoutSessionRepo {
    /// List user's workout sessions
    pub async fn list(
        pool: &PgPool,
        user_id: Uuid,
        limit: i64,
    ) -> Result<SessionsListResponse, AppError> {
        #[derive(FromRow)]
        struct SessionRow {
            id: Uuid,
            workout_id: Option<Uuid>,
            workout_name: Option<String>,
            started_at: chrono::DateTime<chrono::Utc>,
            completed_at: Option<chrono::DateTime<chrono::Utc>>,
            notes: Option<String>,
            rating: Option<i32>,
            xp_awarded: i32,
            coins_awarded: i32,
            sets_logged: Option<i64>,
        }

        let sessions = sqlx::query_as::<_, SessionRow>(
            r#"
            SELECT ws.id, ws.workout_id, w.name as workout_name,
                   ws.started_at, ws.completed_at, ws.notes, ws.rating,
                   ws.xp_awarded, ws.coins_awarded,
                   (SELECT COUNT(*) FROM exercise_sets es WHERE es.session_id = ws.id) as sets_logged
            FROM workout_sessions ws
            LEFT JOIN workouts w ON ws.workout_id = w.id
            WHERE ws.user_id = $1
            ORDER BY ws.started_at DESC
            LIMIT $2
            "#,
        )
        .bind(user_id)
        .bind(limit)
        .fetch_all(pool)
        .await?;

        let total = sessions.len() as i64;

        Ok(SessionsListResponse {
            sessions: sessions
                .into_iter()
                .map(|s| {
                    let duration_minutes = s.completed_at.map(|c| (c - s.started_at).num_minutes());
                    WorkoutSessionResponse {
                        id: s.id,
                        workout_id: s.workout_id,
                        workout_name: s.workout_name,
                        started_at: s.started_at,
                        completed_at: s.completed_at,
                        duration_minutes,
                        sets_logged: s.sets_logged.unwrap_or(0) as i32,
                        notes: s.notes,
                        rating: s.rating,
                        xp_awarded: s.xp_awarded,
                        coins_awarded: s.coins_awarded,
                    }
                })
                .collect(),
            total,
        })
    }

    /// Start a new workout session
    pub async fn start(
        pool: &PgPool,
        user_id: Uuid,
        workout_id: Option<Uuid>,
    ) -> Result<WorkoutSession, AppError> {
        let session = sqlx::query_as::<_, WorkoutSession>(
            r#"
            INSERT INTO workout_sessions (user_id, workout_id, started_at)
            VALUES ($1, $2, NOW())
            RETURNING id, user_id, workout_id, started_at, completed_at,
                      notes, rating, xp_awarded, coins_awarded
            "#,
        )
        .bind(user_id)
        .bind(workout_id)
        .fetch_one(pool)
        .await?;

        Ok(session)
    }

    /// Log an exercise set
    pub async fn log_set(
        pool: &PgPool,
        user_id: Uuid,
        session_id: Uuid,
        req: &LogSetRequest,
    ) -> Result<ExerciseSet, AppError> {
        // Verify session belongs to user
        let session: Option<Uuid> = sqlx::query_scalar(
            "SELECT id FROM workout_sessions WHERE id = $1 AND user_id = $2 AND completed_at IS NULL",
        )
        .bind(session_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        if session.is_none() {
            return Err(AppError::NotFound(
                "Session not found or already completed".to_string(),
            ));
        }

        let set = sqlx::query_as::<_, ExerciseSet>(
            r#"
            INSERT INTO exercise_sets (session_id, exercise_id, set_number, reps, weight,
                                       duration, is_warmup, is_dropset, rpe, notes, completed_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            RETURNING id, session_id, exercise_id, set_number, reps,
                      weight, duration, is_warmup, is_dropset,
                      rpe, notes, completed_at
            "#,
        )
        .bind(session_id)
        .bind(req.exercise_id)
        .bind(req.set_number)
        .bind(req.reps)
        .bind(req.weight)
        .bind(req.duration)
        .bind(req.is_warmup.unwrap_or(false))
        .bind(req.is_dropset.unwrap_or(false))
        .bind(req.rpe)
        .bind(&req.notes)
        .fetch_one(pool)
        .await?;

        Ok(set)
    }

    /// Complete a workout session
    pub async fn complete(
        pool: &PgPool,
        user_id: Uuid,
        session_id: Uuid,
        req: &CompleteSessionRequest,
    ) -> Result<CompleteSessionResult, AppError> {
        // Get session
        let session = sqlx::query_as::<_, WorkoutSession>(
            r#"
            SELECT id, user_id, workout_id, started_at, completed_at,
                   notes, rating, xp_awarded, coins_awarded
            FROM workout_sessions
            WHERE id = $1 AND user_id = $2 AND completed_at IS NULL
            "#,
        )
        .bind(session_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        let session = session.ok_or_else(|| {
            AppError::NotFound("Session not found or already completed".to_string())
        })?;

        // Calculate duration and rewards
        let now = Utc::now();
        let duration_minutes = (now - session.started_at).num_minutes();

        // Count sets
        let sets_logged: Option<i64> =
            sqlx::query_scalar("SELECT COUNT(*) FROM exercise_sets WHERE session_id = $1")
                .bind(session_id)
                .fetch_one(pool)
                .await?;
        let sets_logged = sets_logged.unwrap_or(0);

        // Calculate rewards: 1 XP per minute, 1 coin per 5 sets
        let xp = duration_minutes.min(120) as i32; // Cap at 2 hours
        let coins = (sets_logged / 5).max(1) as i32;

        // Update session
        let updated = sqlx::query(
            r#"
            UPDATE workout_sessions
            SET completed_at = NOW(), notes = $3, rating = $4,
                xp_awarded = $5, coins_awarded = $6
            WHERE id = $1 AND user_id = $2
            "#,
        )
        .bind(session_id)
        .bind(user_id)
        .bind(&req.notes)
        .bind(req.rating)
        .bind(xp)
        .bind(coins)
        .execute(pool)
        .await?;

        if updated.rows_affected() == 0 {
            return Err(AppError::Internal("Failed to update session".to_string()));
        }

        // Get workout name
        let workout_name: Option<String> = if let Some(wid) = session.workout_id {
            sqlx::query_scalar("SELECT name FROM workouts WHERE id = $1")
                .bind(wid)
                .fetch_optional(pool)
                .await?
        } else {
            None
        };

        Ok(CompleteSessionResult {
            session: WorkoutSessionResponse {
                id: session_id,
                workout_id: session.workout_id,
                workout_name,
                started_at: session.started_at,
                completed_at: Some(now),
                duration_minutes: Some(duration_minutes),
                sets_logged: sets_logged as i32,
                notes: req.notes.clone(),
                rating: req.rating,
                xp_awarded: xp,
                coins_awarded: coins,
            },
            xp_awarded: xp,
            coins_awarded: coins,
            personal_records: vec![], // TODO: Check for PRs
        })
    }

    /// Get active session for user
    pub async fn get_active(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<Option<WorkoutSession>, AppError> {
        let session = sqlx::query_as::<_, WorkoutSession>(
            r#"
            SELECT id, user_id, workout_id, started_at, completed_at,
                   notes, rating, xp_awarded, coins_awarded
            FROM workout_sessions
            WHERE user_id = $1 AND completed_at IS NULL
            ORDER BY started_at DESC
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(session)
    }
}

// ============================================================================
// PROGRAM REPOSITORY
// ============================================================================

pub struct ProgramRepo;

impl ProgramRepo {
    /// List user's programs
    pub async fn list(pool: &PgPool, user_id: Uuid) -> Result<ProgramsListResponse, AppError> {
        let programs = sqlx::query_as::<_, TrainingProgram>(
            r#"
            SELECT id, user_id, name, description, duration_weeks, goal,
                   difficulty, is_active, started_at, completed_at,
                   created_at, updated_at
            FROM training_programs
            WHERE user_id = $1
            ORDER BY is_active DESC, updated_at DESC
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        let total = programs.len() as i64;

        Ok(ProgramsListResponse {
            programs: programs.into_iter().map(|p| p.into()).collect(),
            total,
        })
    }

    /// Create program
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        req: &CreateProgramRequest,
    ) -> Result<TrainingProgram, AppError> {
        let program = sqlx::query_as::<_, TrainingProgram>(
            r#"
            INSERT INTO training_programs (user_id, name, description, duration_weeks, goal, difficulty)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, user_id, name, description, duration_weeks, goal,
                      difficulty, is_active, started_at, completed_at,
                      created_at, updated_at
            "#,
        )
        .bind(user_id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(req.duration_weeks.unwrap_or(4))
        .bind(&req.goal)
        .bind(&req.difficulty)
        .fetch_one(pool)
        .await?;

        Ok(program)
    }

    /// Get program by ID
    pub async fn get_by_id(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<TrainingProgram>, AppError> {
        let program = sqlx::query_as::<_, TrainingProgram>(
            r#"
            SELECT id, user_id, name, description, duration_weeks, goal,
                   difficulty, is_active, started_at, completed_at,
                   created_at, updated_at
            FROM training_programs
            WHERE id = $1 AND user_id = $2
            "#,
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(program)
    }

    /// Activate a program
    pub async fn activate(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
    ) -> Result<TrainingProgram, AppError> {
        // Deactivate other programs
        sqlx::query("UPDATE training_programs SET is_active = false WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await?;

        // Activate this one
        let program = sqlx::query_as::<_, TrainingProgram>(
            r#"
            UPDATE training_programs
            SET is_active = true, started_at = COALESCE(started_at, NOW())
            WHERE id = $1 AND user_id = $2
            RETURNING id, user_id, name, description, duration_weeks, goal,
                      difficulty, is_active, started_at, completed_at,
                      created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(program)
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // Test that models compile correctly
    #[test]
    fn test_exercise_response_from() {
        let exercise = Exercise {
            id: Uuid::new_v4(),
            name: "Bench Press".to_string(),
            description: Some("Chest exercise".to_string()),
            category: "chest".to_string(),
            muscle_groups: Some(vec!["chest".to_string(), "triceps".to_string()]),
            equipment: Some(vec!["barbell".to_string(), "bench".to_string()]),
            is_custom: false,
            is_builtin: true,
            user_id: None,
            created_at: Utc::now(),
        };

        let response: ExerciseResponse = exercise.into();
        assert_eq!(response.name, "Bench Press");
        assert!(response.is_builtin);
    }

    #[test]
    fn test_program_response_from() {
        let program = TrainingProgram {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            name: "Strength Program".to_string(),
            description: None,
            duration_weeks: 8,
            goal: Some("strength".to_string()),
            difficulty: Some("intermediate".to_string()),
            is_active: false,
            started_at: None,
            completed_at: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let response: ProgramResponse = program.into();
        assert_eq!(response.name, "Strength Program");
        assert_eq!(response.duration_weeks, 8);
    }
}
