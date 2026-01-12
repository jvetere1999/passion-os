//! Focus session repositories
//!
//! Database operations for focus timer sessions.

use chrono::{Duration, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use super::focus_models::*;
use super::gamification_models::AwardPointsInput;
use super::gamification_repos::GamificationRepo;
use crate::error::AppError;

// ============================================================================
// FOCUS SESSION REPOSITORY
// ============================================================================

pub struct FocusSessionRepo;

impl FocusSessionRepo {
    /// Start a new focus session
    pub async fn start_session(
        pool: &PgPool,
        user_id: Uuid,
        req: &CreateFocusRequest,
    ) -> Result<FocusSession, AppError> {
        // Abandon any existing active session
        sqlx::query(
            r#"UPDATE focus_sessions
               SET status = 'abandoned', abandoned_at = NOW()
               WHERE user_id = $1 AND status IN ('active', 'paused')"#,
        )
        .bind(user_id)
        .execute(pool)
        .await?;

        // Clear pause state
        sqlx::query("DELETE FROM focus_pause_state WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await?;

        // Calculate expiry (2x duration as buffer)
        let expires_at = Utc::now() + Duration::seconds((req.duration_seconds * 2) as i64);

        // Create new session
        let session = sqlx::query_as::<_, FocusSession>(
            r#"INSERT INTO focus_sessions
               (user_id, mode, duration_seconds, expires_at, task_id, task_title, status)
               VALUES ($1, $2, $3, $4, $5, $6, 'active')
               RETURNING id, user_id, mode, duration_seconds, started_at, completed_at,
                         abandoned_at, expires_at, paused_at, paused_remaining_seconds,
                         status, xp_awarded, coins_awarded, task_id, task_title, created_at"#,
        )
        .bind(user_id)
        .bind(&req.mode)
        .bind(req.duration_seconds)
        .bind(expires_at)
        .bind(req.task_id)
        .bind(&req.task_title)
        .fetch_one(pool)
        .await?;

        Ok(session)
    }

    /// Get a session by ID
    pub async fn get_session(
        pool: &PgPool,
        session_id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<FocusSession>, AppError> {
        let session = sqlx::query_as::<_, FocusSession>(
            r#"SELECT id, user_id, mode, duration_seconds, started_at, completed_at,
                      abandoned_at, expires_at, paused_at, paused_remaining_seconds,
                      status, xp_awarded, coins_awarded, task_id, task_title, created_at
               FROM focus_sessions WHERE id = $1 AND user_id = $2"#,
        )
        .bind(session_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(session)
    }

    /// Get active session for user
    pub async fn get_active_session(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<Option<FocusSession>, AppError> {
        let session = sqlx::query_as::<_, FocusSession>(
            r#"SELECT id, user_id, mode, duration_seconds, started_at, completed_at,
                      abandoned_at, expires_at, paused_at, paused_remaining_seconds,
                      status, xp_awarded, coins_awarded, task_id, task_title, created_at
               FROM focus_sessions
               WHERE user_id = $1 AND status IN ('active', 'paused')
               ORDER BY started_at DESC
               LIMIT 1"#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(session)
    }

    /// Complete a focus session
    pub async fn complete_session(
        pool: &PgPool,
        session_id: Uuid,
        user_id: Uuid,
    ) -> Result<CompleteSessionResult, AppError> {
        let session = Self::get_session(pool, session_id, user_id).await?;
        let session = session.ok_or_else(|| AppError::NotFound("Session not found".to_string()))?;

        if session.status != "active" && session.status != "paused" {
            return Err(AppError::BadRequest(format!(
                "Session cannot be completed (status: {})",
                session.status
            )));
        }

        // Calculate rewards based on mode and duration
        let (xp, coins) = match session.mode.as_str() {
            "focus" => {
                let xp = std::cmp::max(5, session.duration_seconds / 60);
                let coins = std::cmp::max(2, session.duration_seconds / 300);
                (xp, coins)
            }
            "break" => (2, 0),
            "long_break" => (3, 1),
            _ => (0, 0),
        };

        // Update session
        let updated = sqlx::query_as::<_, FocusSession>(
            r#"UPDATE focus_sessions
               SET status = 'completed', completed_at = NOW(), xp_awarded = $1, coins_awarded = $2
               WHERE id = $3 AND user_id = $4
               RETURNING id, user_id, mode, duration_seconds, started_at, completed_at,
                         abandoned_at, expires_at, paused_at, paused_remaining_seconds,
                         status, xp_awarded, coins_awarded, task_id, task_title, created_at"#,
        )
        .bind(xp)
        .bind(coins)
        .bind(session_id)
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        // Clear pause state
        sqlx::query("DELETE FROM focus_pause_state WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await?;

        // Award points with idempotency
        let idempotency_key = format!("focus_complete_{}", session_id);
        let award_result = GamificationRepo::award_points(
            pool,
            user_id,
            &AwardPointsInput {
                xp: Some(xp),
                coins: Some(coins),
                skill_stars: None,
                skill_key: None,
                event_type: "focus_complete".to_string(),
                event_id: Some(session_id),
                reason: Some("Focus session completed".to_string()),
                idempotency_key: Some(idempotency_key),
            },
        )
        .await?;

        Ok(CompleteSessionResult {
            session: updated.into(),
            xp_awarded: xp,
            coins_awarded: coins,
            leveled_up: award_result.leveled_up.unwrap_or(false),
            new_level: award_result.new_level,
        })
    }

    /// Abandon a focus session
    pub async fn abandon_session(
        pool: &PgPool,
        session_id: Uuid,
        user_id: Uuid,
    ) -> Result<FocusSession, AppError> {
        let session = Self::get_session(pool, session_id, user_id).await?;
        let session = session.ok_or_else(|| AppError::NotFound("Session not found".to_string()))?;

        if session.status != "active" && session.status != "paused" {
            return Err(AppError::BadRequest(format!(
                "Session cannot be abandoned (status: {})",
                session.status
            )));
        }

        let updated = sqlx::query_as::<_, FocusSession>(
            r#"UPDATE focus_sessions
               SET status = 'abandoned', abandoned_at = NOW()
               WHERE id = $1 AND user_id = $2
               RETURNING id, user_id, mode, duration_seconds, started_at, completed_at,
                         abandoned_at, expires_at, paused_at, paused_remaining_seconds,
                         status, xp_awarded, coins_awarded, task_id, task_title, created_at"#,
        )
        .bind(session_id)
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        // Clear pause state
        sqlx::query("DELETE FROM focus_pause_state WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await?;

        Ok(updated)
    }

    /// List focus sessions for user
    pub async fn list_sessions(
        pool: &PgPool,
        user_id: Uuid,
        page: i64,
        page_size: i64,
    ) -> Result<FocusSessionsListResponse, AppError> {
        let offset = (page - 1) * page_size;

        let sessions = sqlx::query_as::<_, FocusSession>(
            r#"SELECT id, user_id, mode, duration_seconds, started_at, completed_at,
                      abandoned_at, expires_at, paused_at, paused_remaining_seconds,
                      status, xp_awarded, coins_awarded, task_id, task_title, created_at
               FROM focus_sessions
               WHERE user_id = $1
               ORDER BY started_at DESC
               LIMIT $2 OFFSET $3"#,
        )
        .bind(user_id)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        let total =
            sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM focus_sessions WHERE user_id = $1")
                .bind(user_id)
                .fetch_one(pool)
                .await?;

        Ok(FocusSessionsListResponse {
            sessions: sessions.into_iter().map(|s| s.into()).collect(),
            total,
            page,
            page_size,
        })
    }

    /// Get focus stats for user
    pub async fn get_stats(
        pool: &PgPool,
        user_id: Uuid,
        since: Option<chrono::DateTime<Utc>>,
    ) -> Result<FocusStatsResponse, AppError> {
        let stats = if let Some(since_date) = since {
            sqlx::query_as::<_, (i64, i64, Option<i64>, Option<i64>, Option<i64>)>(
                r#"SELECT
                     COUNT(*) FILTER (WHERE status = 'completed') as completed,
                     COUNT(*) FILTER (WHERE status = 'abandoned') as abandoned,
                     SUM(duration_seconds) FILTER (WHERE status = 'completed') as total_seconds,
                     SUM(xp_awarded) as total_xp,
                     SUM(coins_awarded) as total_coins
                   FROM focus_sessions
                   WHERE user_id = $1 AND started_at >= $2"#,
            )
            .bind(user_id)
            .bind(since_date)
            .fetch_one(pool)
            .await?
        } else {
            sqlx::query_as::<_, (i64, i64, Option<i64>, Option<i64>, Option<i64>)>(
                r#"SELECT
                     COUNT(*) FILTER (WHERE status = 'completed') as completed,
                     COUNT(*) FILTER (WHERE status = 'abandoned') as abandoned,
                     SUM(duration_seconds) FILTER (WHERE status = 'completed') as total_seconds,
                     SUM(xp_awarded) as total_xp,
                     SUM(coins_awarded) as total_coins
                   FROM focus_sessions
                   WHERE user_id = $1"#,
            )
            .bind(user_id)
            .fetch_one(pool)
            .await?
        };

        Ok(FocusStatsResponse {
            completed_sessions: stats.0,
            abandoned_sessions: stats.1,
            total_focus_seconds: stats.2.unwrap_or(0),
            total_xp_earned: stats.3.unwrap_or(0),
            total_coins_earned: stats.4.unwrap_or(0),
        })
    }
}

// ============================================================================
// PAUSE STATE REPOSITORY
// ============================================================================

pub struct FocusPauseRepo;

impl FocusPauseRepo {
    /// Get pause state for user
    pub async fn get_pause_state(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<Option<FocusPauseState>, AppError> {
        let state = sqlx::query_as::<_, FocusPauseState>(
            r#"SELECT id, user_id, session_id, mode, is_paused, time_remaining_seconds,
                      paused_at, resumed_at, created_at, updated_at
               FROM focus_pause_state WHERE user_id = $1"#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(state)
    }

    /// Pause active session
    pub async fn pause_session(pool: &PgPool, user_id: Uuid) -> Result<FocusPauseState, AppError> {
        // Get active session
        let session = FocusSessionRepo::get_active_session(pool, user_id).await?;
        let session =
            session.ok_or_else(|| AppError::NotFound("No active session to pause".to_string()))?;

        if session.status != "active" {
            return Err(AppError::BadRequest("Session is not active".to_string()));
        }

        // Calculate remaining time
        let time_remaining = session
            .expires_at
            .map(|exp| (exp - Utc::now()).num_seconds().max(0) as i32)
            .unwrap_or(session.duration_seconds);

        // Update session status
        sqlx::query(
            r#"UPDATE focus_sessions
               SET status = 'paused', paused_at = NOW(), paused_remaining_seconds = $1
               WHERE id = $2"#,
        )
        .bind(time_remaining)
        .bind(session.id)
        .execute(pool)
        .await?;

        // Upsert pause state
        let state = sqlx::query_as::<_, FocusPauseState>(
            r#"INSERT INTO focus_pause_state
               (user_id, session_id, mode, is_paused, time_remaining_seconds, paused_at)
               VALUES ($1, $2, $3, true, $4, NOW())
               ON CONFLICT (session_id) DO UPDATE
               SET mode = EXCLUDED.mode,
                   is_paused = true,
                   time_remaining_seconds = EXCLUDED.time_remaining_seconds,
                   paused_at = NOW(),
                   updated_at = NOW()
               RETURNING id, user_id, session_id, mode, is_paused, time_remaining_seconds,
                         paused_at, resumed_at, created_at, updated_at"#,
        )
        .bind(user_id)
        .bind(session.id)
        .bind(&session.mode)
        .bind(time_remaining)
        .fetch_one(pool)
        .await?;

        Ok(state)
    }

    /// Resume paused session
    pub async fn resume_session(pool: &PgPool, user_id: Uuid) -> Result<FocusSession, AppError> {
        let pause_state = Self::get_pause_state(pool, user_id).await?;
        let pause_state = pause_state
            .ok_or_else(|| AppError::NotFound("No paused session to resume".to_string()))?;

        let session_id = pause_state.session_id;

        // Calculate new expiry
        let time_remaining = pause_state.time_remaining_seconds.unwrap_or(0);
        let new_expires_at = Utc::now() + Duration::seconds(time_remaining as i64);

        // Update session
        let session = sqlx::query_as::<_, FocusSession>(
            r#"UPDATE focus_sessions
               SET status = 'active', paused_at = NULL, expires_at = $1
               WHERE id = $2 AND user_id = $3
               RETURNING id, user_id, mode, duration_seconds, started_at, completed_at,
                         abandoned_at, expires_at, paused_at, paused_remaining_seconds,
                         status, xp_awarded, coins_awarded, task_id, task_title, created_at"#,
        )
        .bind(new_expires_at)
        .bind(session_id)
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        // Clear pause state
        sqlx::query("DELETE FROM focus_pause_state WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await?;

        Ok(session)
    }

    /// Clear pause state
    pub async fn clear_pause_state(pool: &PgPool, user_id: Uuid) -> Result<(), AppError> {
        sqlx::query("DELETE FROM focus_pause_state WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await?;

        Ok(())
    }
}

// ============================================================================
// FOCUS LIBRARIES REPOSITORY
// ============================================================================

pub struct FocusLibraryRepo;

impl FocusLibraryRepo {
    /// List focus libraries for user
    pub async fn list(
        pool: &PgPool,
        user_id: Uuid,
        page: i64,
        page_size: i64,
    ) -> Result<FocusLibrariesListResponse, AppError> {
        let offset = (page - 1) * page_size;

        let libraries = sqlx::query_as::<_, FocusLibrary>(
            "SELECT * FROM focus_libraries WHERE user_id = $1 ORDER BY is_favorite DESC, created_at DESC LIMIT $2 OFFSET $3",
        )
        .bind(user_id)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        let total: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM focus_libraries WHERE user_id = $1",
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(FocusLibrariesListResponse {
            libraries: libraries.into_iter().map(FocusLibraryResponse::from).collect(),
            total: total.0,
            page,
            page_size,
        })
    }

    /// Get single focus library
    pub async fn get(
        pool: &PgPool,
        user_id: Uuid,
        library_id: Uuid,
    ) -> Result<FocusLibrary, AppError> {
        let library = sqlx::query_as::<_, FocusLibrary>(
            "SELECT * FROM focus_libraries WHERE id = $1 AND user_id = $2",
        )
        .bind(library_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or(AppError::NotFound("Library not found".into()))?;

        Ok(library)
    }

    /// Create focus library
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        req: &CreateFocusLibraryRequest,
    ) -> Result<FocusLibrary, AppError> {
        let library_type = req.library_type.as_deref().unwrap_or("custom");

        let library = sqlx::query_as::<_, FocusLibrary>(
            "INSERT INTO focus_libraries (user_id, name, description, library_type)
             VALUES ($1, $2, $3, $4)
             RETURNING *",
        )
        .bind(user_id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(library_type)
        .fetch_one(pool)
        .await?;

        Ok(library)
    }

    /// Delete focus library
    pub async fn delete(
        pool: &PgPool,
        user_id: Uuid,
        library_id: Uuid,
    ) -> Result<(), AppError> {
        // First delete all tracks
        sqlx::query("DELETE FROM focus_library_tracks WHERE library_id = $1")
            .bind(library_id)
            .execute(pool)
            .await?;

        // Then delete library
        let result = sqlx::query(
            "DELETE FROM focus_libraries WHERE id = $1 AND user_id = $2",
        )
        .bind(library_id)
        .bind(user_id)
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Library not found".into()));
        }

        Ok(())
    }

    /// Toggle library favorite status
    pub async fn toggle_favorite(
        pool: &PgPool,
        user_id: Uuid,
        library_id: Uuid,
    ) -> Result<FocusLibrary, AppError> {
        let library = sqlx::query_as::<_, FocusLibrary>(
            "UPDATE focus_libraries 
             SET is_favorite = NOT is_favorite, updated_at = NOW()
             WHERE id = $1 AND user_id = $2
             RETURNING *",
        )
        .bind(library_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or(AppError::NotFound("Library not found".into()))?;

        Ok(library)
    }

    /// Add track to library
    pub async fn add_track(
        pool: &PgPool,
        user_id: Uuid,
        library_id: Uuid,
        track_title: &str,
        track_url: Option<&str>,
        _r2_key: Option<&str>,
        duration_seconds: Option<i32>,
    ) -> Result<FocusLibraryTrack, AppError> {
        // Verify library ownership
        let _library = sqlx::query_as::<_, FocusLibrary>(
            "SELECT * FROM focus_libraries WHERE id = $1 AND user_id = $2",
        )
        .bind(library_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or(AppError::NotFound("Library not found".into()))?;

        // Generate unique track_id
        let track_id = format!("track_{}", uuid::Uuid::new_v4().to_string()[0..8].to_string());

        // Create new track ID for return
        let new_id = Uuid::new_v4();

        // Insert track (without r2_key if column doesn't exist)
        sqlx::query(
            r#"INSERT INTO focus_library_tracks
               (id, library_id, track_id, track_title, track_url, duration_seconds, added_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW())"#,
        )
        .bind(new_id)
        .bind(library_id)
        .bind(&track_id)
        .bind(track_title)
        .bind(track_url)
        .bind(duration_seconds)
        .execute(pool)
        .await?;

        // Increment tracks_count
        sqlx::query(
            "UPDATE focus_libraries SET tracks_count = tracks_count + 1, updated_at = NOW() WHERE id = $1",
        )
        .bind(library_id)
        .execute(pool)
        .await?;

        // Return the created track
        let track = FocusLibraryTrack {
            id: new_id,
            library_id,
            track_id,
            track_title: track_title.to_string(),
            track_url: track_url.map(|s| s.to_string()),
            r2_key: None,
            duration_seconds,
            added_at: Utc::now(),
        };

        Ok(track)
    }

    /// Get track by ID
    pub async fn get_track(
        pool: &PgPool,
        user_id: Uuid,
        track_id: Uuid,
    ) -> Result<Option<FocusLibraryTrack>, AppError> {
        let track = sqlx::query_as::<_, FocusLibraryTrack>(
            r#"SELECT t.id, t.library_id, t.track_id, t.track_title, t.track_url, 
                      CAST(NULL AS TEXT) as r2_key, t.duration_seconds, t.added_at
               FROM focus_library_tracks t
               JOIN focus_libraries l ON t.library_id = l.id
               WHERE t.id = $1 AND l.user_id = $2"#,
        )
        .bind(track_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(track)
    }

    /// Delete track from library
    pub async fn delete_track(
        pool: &PgPool,
        user_id: Uuid,
        track_id: Uuid,
    ) -> Result<(), AppError> {
        let result = sqlx::query(
            r#"DELETE FROM focus_library_tracks t
               USING focus_libraries l
               WHERE t.id = $1 AND t.library_id = l.id AND l.user_id = $2"#,
        )
        .bind(track_id)
        .bind(user_id)
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Track not found".into()));
        }

        Ok(())
    }

    /// List tracks in library
    pub async fn list_tracks(
        pool: &PgPool,
        user_id: Uuid,
        library_id: Uuid,
    ) -> Result<Vec<FocusLibraryTrack>, AppError> {
        let tracks = sqlx::query_as::<_, FocusLibraryTrack>(
            r#"SELECT t.id, t.library_id, t.track_id, t.track_title, t.track_url, 
                      CAST(NULL AS TEXT) as r2_key, t.duration_seconds, t.added_at
               FROM focus_library_tracks t
               JOIN focus_libraries l ON t.library_id = l.id
               WHERE l.id = $1 AND l.user_id = $2
               ORDER BY t.added_at DESC"#,
        )
        .bind(library_id)
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        Ok(tracks)
    }
}
