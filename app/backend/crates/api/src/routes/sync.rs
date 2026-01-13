//! Sync Routes - Lightweight polling endpoints
//!
//! These endpoints return minimal data optimized for 30-second polling.
//! Designed to be fast (<50ms) and bandwidth-efficient.
//!
//! Use cases:
//! - UI badge counts (inbox, quests)
//! - Gamification HUD (XP, level, coins)
//! - Active session status
//! - Daily plan progress
//!
//! DESIGN PRINCIPLES:
//! 1. Minimal response size - only what's needed for UI indicators
//! 2. Fast queries - indexed lookups, no joins where possible
//! 3. Cache-friendly - includes ETag/Last-Modified for conditional requests
//! 4. Single endpoint - one request to get all poll data

use std::sync::Arc;

use axum::{
    extract::State,
    http::{header, StatusCode},
    response::Response,
    routing::get,
    Extension, Json, Router,
};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::AuthContext;
use crate::state::AppState;

/// Create sync routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        // Combined lightweight sync endpoint - single request for all poll data
        .route("/poll", get(poll_all))
        // Individual endpoints for targeted polling
        .route("/progress", get(get_progress))
        .route("/badges", get(get_badges))
        .route("/focus-status", get(get_focus_status))
        .route("/plan-status", get(get_plan_status))
        // Session endpoint for sync state
        .route("/session", get(get_session))
}

// ============================================
// Combined Poll Response
// ============================================

/// Combined poll response - everything needed for UI in one request
#[derive(Serialize)]
pub struct PollResponse {
    /// User's gamification progress
    pub progress: ProgressData,
    /// Badge counts for UI indicators
    pub badges: BadgeData,
    /// Active focus session status
    pub focus: FocusStatusData,
    /// Daily plan completion status
    pub plan: PlanStatusData,
    /// User profile data
    pub user: UserData,
    /// Server timestamp for sync verification
    pub server_time: String,
    /// ETag for conditional polling
    pub etag: String,
}

/// User profile data for UI caching
#[derive(Serialize)]
pub struct UserData {
    pub id: String,
    pub email: String,
    pub name: String,
    pub image: Option<String>,
    pub theme: String,
    pub tos_accepted: bool,
}

/// Gamification progress for HUD
#[derive(Serialize)]
pub struct ProgressData {
    pub level: i32,
    pub current_xp: i64,
    pub xp_to_next_level: i64,
    pub xp_progress_percent: f32,
    pub coins: i64,
    pub streak_days: i32,
}

/// Badge counts for navigation
#[derive(Serialize)]
pub struct BadgeData {
    pub unread_inbox: i32,
    pub active_quests: i32,
    pub pending_habits: i32,
    pub overdue_items: i32,
}

/// Focus session status with full session data
#[derive(Serialize)]
pub struct FocusStatusData {
    pub active_session: Option<serde_json::Value>, // Full FocusSession if active
    pub pause_state: Option<serde_json::Value>,    // Pause state if paused
}

/// Daily plan completion status
#[derive(Serialize)]
pub struct PlanStatusData {
    pub has_plan: bool,
    pub completed: i32,
    pub total: i32,
    pub percent_complete: f32,
}

// ============================================
// Combined Poll Endpoint
// ============================================

/// GET /api/sync/poll
/// 
/// Single endpoint that returns all data needed for UI polling.
/// Designed for 30-second interval polling.
/// 
/// Response includes ETag header for conditional requests.
/// Clients should use If-None-Match to avoid redundant data transfer.
async fn poll_all(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> Result<Response, AppError> {
    let user_id = auth.user_id;
    
    // Fetch all data in parallel
    let (progress, badges, focus, plan, user) = tokio::try_join!(
        fetch_progress(&state.db, user_id),
        fetch_badges(&state.db, user_id),
        fetch_focus_status(&state.db, user_id),
        fetch_plan_status(&state.db, user_id),
        fetch_user_data(&state.db, user_id),
    )?;
    
    let server_time = chrono::Utc::now().to_rfc3339();
    
    // Generate ETag from content hash
    let etag = generate_etag(&progress, &badges, &focus, &plan, &user);
    
    let response = PollResponse {
        progress,
        badges,
        focus,
        plan,
        user,
        server_time,
        etag: etag.clone(),
    };
    
    // Build response with cache headers
    let body = serde_json::to_string(&response)
        .map_err(|e| AppError::Internal(e.to_string()))?;
    
    Ok(Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::ETAG, format!("\"{}\"", etag))
        .header(header::CACHE_CONTROL, "private, max-age=10")
        .body(axum::body::Body::from(body))
        .map_err(|e| AppError::Internal(e.to_string()))?)
}

// ============================================
// Individual Endpoints
// ============================================

/// GET /api/sync/progress
async fn get_progress(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> Result<Json<ProgressData>, AppError> {
    let data = fetch_progress(&state.db, auth.user_id).await?;
    Ok(Json(data))
}

/// GET /api/sync/badges
async fn get_badges(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> Result<Json<BadgeData>, AppError> {
    let data = fetch_badges(&state.db, auth.user_id).await?;
    Ok(Json(data))
}

/// GET /api/sync/focus-status
async fn get_focus_status(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> Result<Json<FocusStatusData>, AppError> {
    let data = fetch_focus_status(&state.db, auth.user_id).await?;
    Ok(Json(data))
}

/// GET /api/sync/plan-status
async fn get_plan_status(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> Result<Json<PlanStatusData>, AppError> {
    let data = fetch_plan_status(&state.db, auth.user_id).await?;
    Ok(Json(data))
}

// ============================================
// Data Fetchers (optimized queries)
// ============================================

async fn fetch_progress(pool: &PgPool, user_id: Uuid) -> Result<ProgressData, AppError> {
    // Single query to get user progress
    let row = sqlx::query_as::<_, (i32, i32, i32, i32)>(
        r#"
        SELECT 
            COALESCE(up.current_level, 1) as level,
            COALESCE(up.total_xp, 0) as total_xp,
            COALESCE(uw.coins, 0) as coins,
            COALESCE(us.current_streak, 0) as streak_days
        FROM users u
        LEFT JOIN user_progress up ON u.id = up.user_id
        LEFT JOIN user_wallet uw ON u.id = uw.user_id
        LEFT JOIN user_streaks us ON u.id = us.user_id AND us.streak_type = 'daily'
        WHERE u.id = $1
        "#
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?
    .unwrap_or((1, 0, 0, 0));
    
    let (level, total_xp, coins, streak_days) = row;
    
    // Calculate XP to next level (using standard formula)
    let xp_for_current_level = calculate_xp_for_level(level);
    let xp_for_next_level = calculate_xp_for_level(level + 1);
    let xp_in_current_level = total_xp - xp_for_current_level;
    let xp_needed_for_level = xp_for_next_level - xp_for_current_level;
    let xp_progress_percent = if xp_needed_for_level > 0 {
        (xp_in_current_level as f32 / xp_needed_for_level as f32 * 100.0).min(100.0)
    } else {
        0.0
    };
    
    Ok(ProgressData {
        level,
        current_xp: xp_in_current_level as i64,
        xp_to_next_level: (xp_needed_for_level - xp_in_current_level) as i64,
        xp_progress_percent,
        coins: coins as i64,
        streak_days,
    })
}

async fn fetch_badges(pool: &PgPool, user_id: Uuid) -> Result<BadgeData, AppError> {
    // Parallel queries for badge counts (all simple indexed queries)
    let (unread_inbox, active_quests, pending_habits, overdue_items) = tokio::try_join!(
        fetch_unread_inbox_count(pool, user_id),
        fetch_active_quests_count(pool, user_id),
        fetch_pending_habits_count(pool, user_id),
        fetch_overdue_items_count(pool, user_id),
    )?;
    
    Ok(BadgeData {
        unread_inbox,
        active_quests,
        pending_habits,
        overdue_items,
    })
}

async fn fetch_focus_status(pool: &PgPool, user_id: Uuid) -> Result<FocusStatusData, AppError> {
    // Use the crate::db imports (FocusSessionRepo and FocusPauseRepo)
    use crate::db::focus_repos::{FocusSessionRepo, FocusPauseRepo};
    
    // Get active session and pause state
    let (active_session, pause_state) = tokio::try_join!(
        FocusSessionRepo::get_active_session(pool, user_id),
        FocusPauseRepo::get_pause_state(pool, user_id),
    )?;
    
    Ok(FocusStatusData {
        active_session: active_session.map(|s| serde_json::to_value(s).unwrap_or(serde_json::Value::Null)),
        pause_state: pause_state.map(|p| serde_json::to_value(p).unwrap_or(serde_json::Value::Null)),
    })
}

async fn fetch_plan_status(pool: &PgPool, user_id: Uuid) -> Result<PlanStatusData, AppError> {
    // Get today's plan
    let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
    
    let plan = sqlx::query_as::<_, (serde_json::Value,)>(
        r#"
        SELECT items
        FROM daily_plans
        WHERE user_id = $1 AND date = $2::date
        "#
    )
    .bind(user_id)
    .bind(&today)
    .fetch_optional(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;
    
    match plan {
        Some((items_json,)) => {
            // Parse items from JSONB array
            // Expected structure: [{"completed": bool, ...}, ...]
            // Each item MUST have a "completed" boolean field to be counted in completion stats
            let items: Vec<serde_json::Value> = serde_json::from_value(items_json)
                .unwrap_or_default();
            
            let total = items.len() as i32;
            let completed = items.iter()
                .filter(|item| item.get("completed").and_then(|v| v.as_bool()).unwrap_or(false))
                .count() as i32;
            
            let percent = if total > 0 {
                (completed as f32 / total as f32 * 100.0).min(100.0)
            } else {
                0.0
            };
            
            Ok(PlanStatusData {
                has_plan: true,
                completed,
                total,
                percent_complete: percent,
            })
        }
        None => Ok(PlanStatusData {
            has_plan: false,
            completed: 0,
            total: 0,
            percent_complete: 0.0,
        }),
    }
}

// ============================================
// Helper Queries
// ============================================

async fn fetch_user_data(pool: &PgPool, user_id: Uuid) -> Result<UserData, AppError> {
    let user = sqlx::query_as::<_, (String, String, String, Option<String>, String, bool)>(
        r#"
        SELECT 
            id::text,
            email,
            name,
            image,
            COALESCE(theme, 'dark') as theme,
            tos_accepted
        FROM users
        WHERE id = $1
        "#
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;
    
    Ok(UserData {
        id: user.0,
        email: user.1,
        name: user.2,
        image: user.3,
        theme: user.4,
        tos_accepted: user.5,
    })
}

async fn fetch_unread_inbox_count(pool: &PgPool, user_id: Uuid) -> Result<i32, AppError> {
    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM inbox_items WHERE user_id = $1 AND is_processed = false"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;
    
    Ok(count as i32)
}

async fn fetch_active_quests_count(pool: &PgPool, user_id: Uuid) -> Result<i32, AppError> {
    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM user_quests WHERE user_id = $1 AND status = 'accepted'"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;
    
    Ok(count as i32)
}

async fn fetch_pending_habits_count(pool: &PgPool, user_id: Uuid) -> Result<i32, AppError> {
    let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
    
    // Count habits that haven't been completed today
    let count = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*) 
        FROM habits h
        WHERE h.user_id = $1 
          AND h.is_active = true
          AND NOT EXISTS (
            SELECT 1 FROM habit_completions hc 
            WHERE hc.habit_id = h.id 
              AND hc.completed_date = $2::date
          )
        "#
    )
    .bind(user_id)
    .bind(&today)
    .fetch_one(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;
    
    Ok(count as i32)
}

async fn fetch_overdue_items_count(pool: &PgPool, user_id: Uuid) -> Result<i32, AppError> {
    let now = chrono::Utc::now();
    
    // Count quests that are past their deadline
    let count = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*) 
        FROM user_quests 
        WHERE user_id = $1 
          AND status = 'accepted'
          AND expires_at IS NOT NULL 
          AND expires_at < $2
        "#
    )
    .bind(user_id)
    .bind(now)
    .fetch_one(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;
    
    Ok(count as i32)
}

// ============================================
// Utility Functions
// ============================================

/// Calculate total XP needed to reach a level
fn calculate_xp_for_level(level: i32) -> i32 {
    // Standard formula: 100 * level^1.5
    (100.0 * (level as f64).powf(1.5)) as i32
}

/// Generate ETag from response data
fn generate_etag(
    progress: &ProgressData,
    badges: &BadgeData,
    focus: &FocusStatusData,
    plan: &PlanStatusData,
    user: &UserData,
) -> String {
    use std::hash::{Hash, Hasher};
    use std::collections::hash_map::DefaultHasher;
    
    let mut hasher = DefaultHasher::new();
    
    // Hash the key values that would indicate a change
    progress.level.hash(&mut hasher);
    progress.coins.hash(&mut hasher);
    badges.unread_inbox.hash(&mut hasher);
    badges.active_quests.hash(&mut hasher);
    badges.pending_habits.hash(&mut hasher);
    // Hash whether there's an active focus session (not the full session data)
    focus.active_session.is_some().hash(&mut hasher);
    focus.pause_state.is_some().hash(&mut hasher);
    plan.completed.hash(&mut hasher);
    plan.total.hash(&mut hasher);
    user.id.hash(&mut hasher);
    user.email.hash(&mut hasher);
    user.name.hash(&mut hasher);
    user.image.hash(&mut hasher);
    user.theme.hash(&mut hasher);
    user.tos_accepted.hash(&mut hasher);
    
    format!("{:x}", hasher.finish())
}

/// GET /sync/session
/// Get current user session state
async fn get_session(
    Extension(user): Extension<crate::middleware::auth::AuthContext>,
) -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "session": {
            "user_id": user.user_id,
            "authenticated": true,
            "created_at": chrono::Utc::now().to_rfc3339(),
        }
    }))
}
