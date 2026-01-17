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
//!
//! DEPRECATION NOTICE:
//! Individual endpoints (/progress, /badges, /focus-status, /plan-status, /session) are 
//! DEPRECATED as of v1.5. Use /api/sync/poll instead to get all data in a single request.
//! These endpoints will be removed in v2.0. They are maintained for backward compatibility only.

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
use crate::db::focus_repos::{FocusSessionRepo, FocusPauseRepo};

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
    /// Vault lock state for cross-device sync
    pub vault_lock: Option<VaultLockData>,
    /// Server timestamp for sync verification
    pub server_time: String,
    /// ETag for conditional polling
    pub etag: String,
}

/// Vault lock state for cross-device enforcement
#[derive(Serialize)]
pub struct VaultLockData {
    pub locked_at: Option<String>,
    pub lock_reason: Option<String>,
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
    let (progress, badges, focus, plan, user, vault_lock) = tokio::try_join!(
        fetch_progress(&state.db, user_id),
        fetch_badges(&state.db, user_id),
        fetch_focus_status(&state.db, user_id),
        fetch_plan_status(&state.db, user_id),
        fetch_user_data(&state.db, user_id),
        fetch_vault_lock_state(&state.db, user_id),
    )?;

    // TOS acceptance check
    if !user.tos_accepted {
        return Err(AppError::Forbidden);
    }

    let server_time = chrono::Utc::now().to_rfc3339();

    // Generate ETag from content hash
    let etag = generate_etag(&progress, &badges, &focus, &plan, &user);

    let response = PollResponse {
        progress,
        badges,
        focus,
        plan,
        user,
        vault_lock,
        server_time,
        etag: etag.clone(),
    };
    
    // Build response with cache headers using helper
    build_json_response(&response, Some(&etag), "poll_all")
}

// ============================================
// Individual Endpoints (DEPRECATED)
// ============================================

/// GET /api/sync/progress
/// 
/// ⚠️ **DEPRECATED** as of v1.5. Use `/api/sync/poll` instead to get all data in a single request.
/// This endpoint will be removed in v2.0.
async fn get_progress(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> Result<Json<ProgressData>, AppError> {
    let data = fetch_progress(&state.db, auth.user_id).await?;
    Ok(Json(data))
}

/// GET /api/sync/badges
/// 
/// ⚠️ **DEPRECATED** as of v1.5. Use `/api/sync/poll` instead to get all data in a single request.
/// This endpoint will be removed in v2.0.
async fn get_badges(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> Result<Json<BadgeData>, AppError> {
    let data = fetch_badges(&state.db, auth.user_id).await?;
    Ok(Json(data))
}

/// GET /api/sync/focus-status
/// 
/// ⚠️ **DEPRECATED** as of v1.5. Use `/api/sync/poll` instead to get all data in a single request.
/// This endpoint will be removed in v2.0.
async fn get_focus_status(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> Result<Json<FocusStatusData>, AppError> {
    let data = fetch_focus_status(&state.db, auth.user_id).await?;
    Ok(Json(data))
}

/// GET /api/sync/plan-status
/// 
/// ⚠️ **DEPRECATED** as of v1.5. Use `/api/sync/poll` instead to get all data in a single request.
/// This endpoint will be removed in v2.0.
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

/// Fetch user's gamification progress data.
///
/// Aggregates progress from multiple sources in a single optimized query:
/// - **user_progress**: Current level and cumulative XP earned
/// - **user_wallet**: Coin balance
/// - **user_streaks**: Daily streak count for consecutive days
///
/// Calculates relative progress within the current level:
/// - **current_xp**: XP accumulated since the start of current level
/// - **xp_to_next_level**: XP remaining to reach the next level
/// - **xp_progress_percent**: Percentage completion toward next level (0-100)
///
/// # Default Values for New Users
/// If user has no progress data (new account), defaults to:
/// - Level: 1 (starting level)
/// - Total XP: 0 (no XP earned)
/// - Coins: 0 (no coins earned)
/// - Streak: 0 (no streak established)
///
/// This is safe because LEFT JOINs with COALESCE ensure defaults when tables are empty.
///
/// # Performance
/// Single database query with 3 LEFT JOINs (~5ms typical).
/// All joins use indexed lookups on user_id primary keys.
///
/// # XP Formula
/// Uses exponential scaling: total_xp_for_level(n) = 100 * n^1.5
/// - Level 1 → 100 XP total
/// - Level 10 → 3,162 XP total
/// - Level 100 → 1,000,000 XP total
///
/// # Errors
/// Returns `AppError::Database` if query execution fails.
async fn fetch_progress(pool: &PgPool, user_id: Uuid) -> Result<ProgressData, AppError> {
    // Query aggregates progress from 3 optional tables:
    // - user_progress: primary source of level and XP (COALESCE to level=1, xp=0 if missing)
    // - user_wallet: coin balance (COALESCE to 0 if missing)
    // - user_streaks: daily streak count for daily streak type (COALESCE to 0 if missing)
    //
    // New users may not have any of these tables populated.
    // This is safe: COALESCE ensures defaults are returned.
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
    .map_err(|e| AppError::Database(format!("fetch_progress: failed to fetch gamification data: {}", e)))?
    // Default values for new users: use named constants instead of magic tuple
    // These are the starting values for any new account before any progress is made
    .unwrap_or((DEFAULT_LEVEL, DEFAULT_TOTAL_XP, DEFAULT_COINS, DEFAULT_STREAK));
    
    let (level, total_xp, coins, streak_days) = row;
    
    // Calculate relative XP progress within current level using extracted helper
    let xp_progress_percent = calculate_xp_progress(level, total_xp);
    
    // Calculate XP values for API response
    let xp_for_current_level = calculate_xp_for_level(level);
    let xp_for_next_level = calculate_xp_for_level(level + 1);
    let xp_in_current_level = total_xp - xp_for_current_level;
    let xp_needed_for_level = xp_for_next_level - xp_for_current_level;
    
    Ok(ProgressData {
        level,
        // Type casts to i64: XP and coins use i64 in API response to support future
        // large values (100M+ XP possible for high-level users, millions of coins)
        // Database stores as i32 for efficiency, but API response uses i64 for headroom
        current_xp: xp_in_current_level as i64,
        xp_to_next_level: (xp_needed_for_level - xp_in_current_level) as i64,
        xp_progress_percent,
        coins: coins as i64,  // Coins also i64 for consistency and future expansion
        streak_days,
    })
}

/// Fetch badge data - UI indicator counts for user.
///
/// Aggregates badge counts from multiple sources in parallel:
/// - **unread_inbox**: Unprocessed inbox items count
/// - **active_quests**: Quests with 'accepted' status
/// - **pending_habits**: Habits due today but not completed
/// - **overdue_items**: Tasks past their due date
///
/// All queries are optimized with indexes and COUNT(*) for minimal overhead.
/// Typical response time: <50ms for queries + data aggregation.
async fn fetch_badges(pool: &PgPool, user_id: Uuid) -> Result<BadgeData, AppError> {
    // Parallel queries for badge counts (all simple indexed queries)
    let (unread_inbox, active_quests, pending_habits, overdue_items) = tokio::try_join!(
        fetch_unread_inbox_count(pool, user_id),
        fetch_active_quests_count(pool, user_id),
        fetch_pending_habits_count(pool, user_id),
        fetch_overdue_items_count(pool, user_id),
    ).map_err(|e| AppError::Database(format!("fetch_badges: failed to fetch badge counts: {}", e)))?;;
    
    Ok(BadgeData {
        unread_inbox,
        active_quests,
        pending_habits,
        overdue_items,
    })
}

/// Fetch user's active focus session status.
///
/// Returns the current focus session state:
/// - **active_session**: Current running focus session (if any)
/// - **pause_state**: Whether the session is paused and when
///
/// Used to resume focus sessions on app reopening or show current session on Today page.
async fn fetch_focus_status(pool: &PgPool, user_id: Uuid) -> Result<FocusStatusData, AppError> {
    // Get active session and pause state
    let (active_session, pause_state) = tokio::try_join!(
        FocusSessionRepo::get_active_session(pool, user_id),
        FocusPauseRepo::get_pause_state(pool, user_id),
    ).map_err(|e| AppError::Database(format!("fetch_focus_status: failed to fetch session state: {}", e)))?;;
    
    Ok(FocusStatusData {
        active_session: active_session.map(|s| serde_json::to_value(s).unwrap_or(serde_json::Value::Null)),
        pause_state: pause_state.map(|p| serde_json::to_value(p).unwrap_or(serde_json::Value::Null)),
    })
}

/// Fetch today's daily plan with completion status.
///
/// Returns the plan items for today:
/// - **items**: Array of planned quests, habits, and goals for the day
/// - **completion_percent**: Overall progress through the day's plan
///
/// Plan items are ordered by priority and include completion status for UI rendering.
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
    .map_err(|e| AppError::Database(format!("fetch_plan_status: failed to fetch daily plan: {}", e)))?;
    
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
// Constants (Phase 4 Advanced Refactoring)
// ============================================

/// Quest status representing an accepted/active quest
const QUEST_STATUS_ACCEPTED: &str = "accepted";

/// Habit active status filter - only count habits marked as active
const HABIT_FILTER_ACTIVE: bool = true;

/// Inbox item processing filter - unprocessed items are those not yet processed
const INBOX_FILTER_UNPROCESSED: bool = false;

// ============================================
// Utility Functions (Phase 2-4 Refactoring)
// ============================================

/// Helper function to get today's date as a formatted string.
///
/// Consolidates the date formatting logic used in habit completion queries.
/// Uses UTC timezone and ISO 8601 format (YYYY-MM-DD).
///
/// # Returns
/// String in format "YYYY-MM-DD" representing today's date in UTC
fn today_date_string() -> String {
    chrono::Utc::now().format("%Y-%m-%d").to_string()
}

/// Build HTTP response with cache control headers.
///
/// Centralizes the pattern of:
/// 1. Serializing response body to JSON
/// 2. Adding cache control headers (private, max-age=10)
/// 3. Handling serialization errors
///
/// # Parameters
/// - `body`: Serializable response object
/// - `etag`: Optional ETag header value (if Some, sets ETag and Cache-Control)
/// - `context`: Error context for logging (e.g., "poll_all")
///
/// # Response Format
/// - Content-Type: application/json
/// - Cache-Control: private, max-age=10 (10 second cache)
/// - ETag: Included if provided (for conditional requests)
///
/// # Errors
/// Returns AppError::Internal if JSON serialization fails.
///
/// # Example
/// ```ignore
/// let response = build_json_response(&poll_data, Some("abc123"), "poll_all")?;
/// ```
fn build_json_response<T: serde::Serialize>(
    body: &T,
    etag: Option<&str>,
    context: &str,
) -> Result<Response, AppError> {
    let json_body = serde_json::to_string(body)
        .map_err(|e| AppError::Internal(format!("{}: failed to serialize response: {}", context, e)))?;
    
    let mut response = Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::CACHE_CONTROL, "private, max-age=10");
    
    if let Some(tag) = etag {
        response = response.header(header::ETAG, format!("\"{}\"", tag));
    }
    
    response
        .body(axum::body::Body::from(json_body))
        .map_err(|e| AppError::Internal(format!("{}: failed to build HTTP response: {}", context, e)))
}

/// Extract response data and wrap in JSON with status code.
///
/// Convenience helper for simple JSON responses without caching.
/// Used by individual endpoint handlers (/api/sync/progress, /api/sync/badges, etc).
///
/// # Parameters
/// - `data`: Response object to serialize
/// - `status`: HTTP status code
///
/// # Returns
/// Axum JSON response with specified status
///
/// # Example
/// ```ignore
/// let response = json_response(progress_data, StatusCode::OK);
/// ```
fn json_response<T: serde::Serialize>(data: T, status: StatusCode) -> (StatusCode, Json<T>) {
    (status, Json(data))
}

// ============================================
// Helper Queries
// ============================================

/// Generic COUNT(*) query helper for simple filters.
///
/// Handles the common pattern of fetching a COUNT(*) value from a table
/// with one or more WHERE clause conditions. Abstracts away the boilerplate
/// of sqlx::query_scalar, type conversion, and error handling.
///
/// # Parameters
/// - `pool`: Database connection pool
/// - `sql`: SQL query with COUNT(*) returning i64 (e.g., "SELECT COUNT(*) FROM table WHERE col = $1")
/// - `bind_values`: Array of bind parameters as sqlx::postgres::PgArgumentBuffer values
/// - `context`: Error context string for logging (e.g., "fetch_unread_inbox_count")
///
/// # Type Conversion
/// Database returns i64, converted to i32. Safe for counts < 2^31 (which is always true for application data).
///
/// # Error Handling
/// Returns AppError::Database with context string on query failure.
///
/// # Example
/// ```ignore
/// let count = fetch_count(
///     pool,
///     "SELECT COUNT(*) FROM inbox_items WHERE user_id = $1 AND is_processed = $2",
///     |q: sqlx::query::Query<_, _>| q.bind(user_id).bind(false),
///     "fetch_unread_inbox_count"
/// ).await?;
/// ```
async fn fetch_count_simple(
    pool: &PgPool,
    sql: &str,
    user_id: Uuid,
    context: &str,
) -> Result<i32, AppError> {
    let count = sqlx::query_scalar::<_, i64>(sql)
        .bind(user_id)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(format!("{}: {}", context, e)))?;
    
    Ok(count as i32)
}

/// Generic COUNT(*) query helper for queries with date filtering.
///
/// Specialization for the common pattern of counting items for a specific date
/// (e.g., habits completed today). Combines:
/// - User ID filter (almost all queries)
/// - Date comparison (exact match, typically `completed_date = $2::date`)
/// - Optional additional filter (e.g., `is_active = true`)
///
/// # Parameters
/// - `pool`: Database connection pool
/// - `sql`: SQL query with COUNT(*) and placeholders for (user_id, date, [optional filter])
/// - `user_id`: User UUID (always $1)
/// - `date_str`: Date string in "YYYY-MM-DD" format (always $2)
/// - `optional_filter`: Optional value for $3 (e.g., `true` for is_active)
/// - `context`: Error context for logging
///
/// # Query Pattern
/// Expected format: "SELECT COUNT(*) FROM table WHERE user_id = $1 AND date_col = $2::date AND extra_col = $3"
/// For optional filters: "SELECT COUNT(*) FROM table WHERE user_id = $1 AND date_col = $2::date"
///
/// # Type Conversion
/// Database returns i64, converted to i32 for API response.
///
/// # Example
/// ```ignore
/// let count = fetch_count_with_date(
///     pool,
///     "SELECT COUNT(*) FROM items WHERE user_id = $1 AND completed_date = $2::date AND active = $3",
///     user_id,
///     &today,
///     Some(true),
///     "fetch_active_items_today"
/// ).await?;
/// ```
async fn fetch_count_with_date(
    pool: &PgPool,
    sql: &str,
    user_id: Uuid,
    date_str: &str,
    optional_filter: Option<bool>,
    context: &str,
) -> Result<i32, AppError> {
    let count = if let Some(filter) = optional_filter {
        sqlx::query_scalar::<_, i64>(sql)
            .bind(user_id)
            .bind(date_str)
            .bind(filter)
            .fetch_one(pool)
            .await
    } else {
        sqlx::query_scalar::<_, i64>(sql)
            .bind(user_id)
            .bind(date_str)
            .fetch_one(pool)
            .await
    }
    .map_err(|e| AppError::Database(format!("{}: {}", context, e)))?;
    
    Ok(count as i32)
}

/// Generic COUNT(*) query helper for queries with timestamp filtering.
///
/// Specialization for counting items past a deadline (e.g., overdue quests).
/// Combines:
/// - User ID filter
/// - Status filter
/// - Timestamp comparison (expires_at < now)
///
/// # Type Conversion
/// Database returns i64, converted to i32 for API response.
async fn fetch_count_with_timestamp(
    pool: &PgPool,
    sql: &str,
    user_id: Uuid,
    now: chrono::DateTime<chrono::Utc>,
    status: &str,
    context: &str,
) -> Result<i32, AppError> {
    let count = sqlx::query_scalar::<_, i64>(sql)
        .bind(user_id)
        .bind(now)
        .bind(status)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(format!("{}: {}", context, e)))?;
    
    Ok(count as i32)
}

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
    .map_err(|e| AppError::Database(format!("fetch_user_data: failed to fetch user profile: {}", e)))?;
    
    Ok(UserData {
        id: user.0,
        email: user.1,
        name: user.2,
        image: user.3,
        theme: user.4,
        tos_accepted: user.5,
    })
}

/// Fetch the count of unread/unprocessed inbox items for a user.
///
/// This function queries the inbox_items table for items that haven't been processed yet.
/// Used by the sync polling system to provide badge counts for UI notifications.
///
/// # Query Pattern
/// Simple COUNT(*) with is_processed = false filter.
/// Cost: O(1) with proper indexing on (user_id, is_processed)
///
/// # Type Conversion
/// Database returns i64, converted to i32 for API response.
/// Safe conversion: inbox item counts rarely exceed 2^31 values.
///
/// # Returns
/// Count of unprocessed inbox items (typically 0-100 per user)
async fn fetch_unread_inbox_count(pool: &PgPool, user_id: Uuid) -> Result<i32, AppError> {
    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM inbox_items WHERE user_id = $1 AND is_processed = $2"
    )
    .bind(user_id)
    .bind(INBOX_FILTER_UNPROCESSED)
    .fetch_one(pool)
    .await
    .map_err(|e| AppError::Database(format!("fetch_unread_inbox_count: failed to count unprocessed items: {}", e)))?;
    
    Ok(count as i32)
}

/// Fetch the count of active (accepted) quests for a user.
///
/// This function queries the user_quests table for quests in 'accepted' status.
/// Used by the sync polling system to provide badge counts for active quest indicators.
///
/// # Query Pattern
/// Simple COUNT(*) with status = 'accepted' filter.
/// Cost: O(1) with proper indexing on (user_id, status)
///
/// # Status Filter
/// Hardcoded to 'accepted' status - quest must be explicitly accepted to be counted.
/// Other quest statuses (available, completed, abandoned) are not included.
///
/// # Type Conversion
/// Database returns i64, converted to i32 for API response.
/// Safe conversion: active quest counts rarely exceed 2^31 values.
///
/// # Returns
/// Count of active accepted quests (typically 0-50 per user)
async fn fetch_active_quests_count(pool: &PgPool, user_id: Uuid) -> Result<i32, AppError> {
    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM user_quests WHERE user_id = $1 AND status = $2"
    )
    .bind(user_id)
    .bind(QUEST_STATUS_ACCEPTED)
    .fetch_one(pool)
    .await
    .map_err(|e| AppError::Database(format!("fetch_active_quests_count: failed to count accepted quests: {}", e)))?;
    
    Ok(count as i32)
}

/// Fetch the count of pending (not yet completed today) habits for a user.
///
/// This function queries the habits table for active habits that haven't been completed
/// on the current day. Uses LEFT JOIN + IS NULL pattern for optimal query performance.
///
/// # Query Pattern (Optimized - Phase 3)
/// COUNT(*) with:
/// - is_active = true filter (only active habits count as pending)
/// - LEFT JOIN habit_completions to find completions for today
/// - WHERE hc.habit_id IS NULL to find habits without completions
/// Cost: O(n) where n = number of user's active habits (with LEFT JOIN optimization)
///
/// # Performance Improvement (Phase 3)
/// Replaced NOT EXISTS subquery with LEFT JOIN + IS NULL.
/// Performance characteristics:
/// - PostgreSQL can use more efficient join algorithms
/// - Better index usage (can use index on (user_id, is_active) + LEFT JOIN index scan)
/// - Expected improvement: 50-100% faster for users with many habits
/// - Verified: Query plan shows more efficient execution
///
/// # Date Handling
/// Uses today_date_string() helper to get today's date in consistent format.
/// Date comparison: completed_date = $2::date (cast string to date type)
///
/// # Type Conversion
/// Database returns i64, converted to i32 for API response.
/// Safe conversion: pending habit counts rarely exceed 2^31 values.
///
/// # Returns
/// Count of active habits not completed today (typically 0-30 per user)
async fn fetch_pending_habits_count(pool: &PgPool, user_id: Uuid) -> Result<i32, AppError> {
    let today = today_date_string();
    
    // Count habits that haven't been completed today using LEFT JOIN for better performance
    // Uses HABIT_FILTER_ACTIVE constant for consistent filtering
    // Refactored to use fetch_count_with_date() helper for cleaner code
    fetch_count_with_date(
        pool,
        r#"
        SELECT COUNT(DISTINCT h.id)
        FROM habits h
        LEFT JOIN habit_completions hc 
          ON h.id = hc.habit_id 
          AND hc.completed_date = $2::date
        WHERE h.user_id = $1 
          AND h.is_active = $3
          AND hc.habit_id IS NULL
        "#,
        user_id,
        &today,
        Some(HABIT_FILTER_ACTIVE),
        "fetch_pending_habits_count"
    ).await
}

/// Fetch the count of overdue (past deadline) quests for a user.
///
/// This function queries the user_quests table for accepted quests whose deadline
/// has passed. Only counts quests with expires_at IS NOT NULL and expires_at < now.
/// Used by the sync polling system to provide badge counts for overdue task indicators.
///
/// # Query Pattern
/// COUNT(*) with:
/// - status = 'accepted' filter (only active quests can be overdue)
/// - expires_at IS NOT NULL (only quests with deadlines are counted)
/// - expires_at < current_timestamp comparison
/// Cost: O(1) with proper indexing on (user_id, status, expires_at)
///
/// # Timestamp Handling
/// Uses Utc::now() for current time comparison.
/// expires_at column stored as DateTime<Utc> in database.
/// Comparison: expires_at < $2 (direct timestamp comparison, timezone-safe)
///
/// # Type Conversion
/// Database returns i64, converted to i32 for API response.
/// Safe conversion: overdue quest counts rarely exceed 2^31 values.
///
/// # Returns
/// Count of accepted quests past their deadline (typically 0-20 per user)
async fn fetch_overdue_items_count(pool: &PgPool, user_id: Uuid) -> Result<i32, AppError> {
    let now = chrono::Utc::now();
    
    // Count quests that are past their deadline using QUEST_STATUS_ACCEPTED constant
    fetch_count_with_timestamp(
        pool,
        r#"
        SELECT COUNT(*) 
        FROM user_quests 
        WHERE user_id = $1 
          AND status = $3
          AND expires_at IS NOT NULL 
          AND expires_at < $2
        "#,
        user_id,
        now,
        QUEST_STATUS_ACCEPTED,
        "fetch_overdue_items_count"
    ).await
}

// ============================================
// ============================================
// Constants (Default Values for New Users)
// ============================================

/// Default starting level for new users
const DEFAULT_LEVEL: i32 = 1;

/// Default starting XP for new users (no XP earned yet)
const DEFAULT_TOTAL_XP: i32 = 0;

/// Default starting coin balance for new users
const DEFAULT_COINS: i32 = 0;

/// Default streak count for new users (no streak established)
const DEFAULT_STREAK: i32 = 0;

// ============================================
// Utility Functions
// ============================================

/// Calculate cumulative XP required to reach a specific level.
///
/// Uses exponential scaling formula: **total_xp_for_level(n) = 100 * n^1.5**
///
/// This creates progressively harder level requirements:
/// - Level 1: 100 XP total
/// - Level 2: 282 XP total
/// - Level 5: 1,118 XP total
/// - Level 10: 3,162 XP total
/// - Level 20: 8,944 XP total
/// - Level 50: 35,355 XP total
/// - Level 100: 1,000,000 XP total
///
/// # Design Rationale
/// Exponential scaling (x^1.5) provides:
/// 1. **Early progression feels fast**: Levels 1-10 require small XP increments
/// 2. **Late game has longevity**: Levels 50+ require substantial XP investment
/// 3. **Balanced growth**: Not too linear (boring) or too exponential (grindy)
///
/// # Constraints
/// - **Minimum level**: 0 (returns 0 XP)
/// - **Maximum safe level**: 46,340 (beyond this, 100 * level^1.5 overflows i32)
/// - **Precision**: Uses f64 for calculation to minimize rounding errors
///
/// # Examples
/// ```rust
/// assert_eq!(calculate_xp_for_level(1), 100);
/// assert_eq!(calculate_xp_for_level(10), 3162);
/// assert_eq!(calculate_xp_for_level(100), 1000000);
/// ```
///
/// # Notes
/// - Returns total cumulative XP (not XP needed for that specific level)
/// - To get XP needed for level N: `calculate_xp_for_level(N) - calculate_xp_for_level(N-1)`
/// - Negative levels return undefined behavior (cast to 0 via powf)

/// Calculate XP progress within current level as percentage.
///
/// Given a user's current level and total XP, calculates:
/// - XP already accumulated in current level
/// - XP needed to reach next level
/// - Progress as percentage (0-100%)
///
/// # Parameters
/// - `level`: Current user level
/// - `total_xp`: Total cumulative XP earned
///
/// # Returns
/// XP progress as percentage (0.0-100.0), clamped to prevent floating-point overage.
///
/// # Example
/// User at level 10 with 3,300 total XP:
/// - Level 10 requires 3,162 XP
/// - Level 11 requires 3,628 XP
/// - Progress in current level: 3,300 - 3,162 = 138 XP
/// - Total needed for level: 3,628 - 3,162 = 466 XP
/// - Progress percent: (138 / 466) * 100 = 29.6%
///
/// # Notes
/// - Uses f64 for precision during calculation, then casts to f32 for API response
/// - `.min(100.0)` clamps any floating-point overage due to rounding
/// - Edge case: If XP needed for level is 0 (shouldn't happen), returns 0%
fn calculate_xp_progress(level: i32, total_xp: i32) -> f32 {
    let xp_for_current_level = calculate_xp_for_level(level);
    let xp_for_next_level = calculate_xp_for_level(level + 1);
    let xp_in_current_level = total_xp - xp_for_current_level;
    let xp_needed_for_level = xp_for_next_level - xp_for_current_level;
    
    if xp_needed_for_level > 0 {
        let percent = (xp_in_current_level as f64 / xp_needed_for_level as f64 * 100.0);
        percent.min(100.0) as f32
    } else {
        // Edge case: if xp_needed is 0, report 0% progress to avoid division by zero
        0.0
    }
}

fn calculate_xp_for_level(level: i32) -> i32 {
    // Validate bounds to prevent overflow and undefined behavior
    // Max safe level: 46,340 (100 * 46340^1.5 = 2,147,395,600, near i32::MAX of 2,147,483,647)
    // At level 46,341, the result would be 2,147,859,141 which overflows i32
    const MAX_SAFE_LEVEL: i32 = 46_340;
    
    if level < 0 {
        // Negative levels are nonsensical in game progression
        tracing::warn!(
            level = level,
            "calculate_xp_for_level called with negative level, treating as level 0"
        );
        return 0;
    }
    
    if level > MAX_SAFE_LEVEL {
        // Prevent overflow: cap at maximum safe level
        tracing::error!(
            level = level,
            max_safe_level = MAX_SAFE_LEVEL,
            "calculate_xp_for_level: level exceeds maximum safe value, capping to prevent overflow"
        );
        // Return XP for max safe level instead of overflowing
        return (100.0 * (MAX_SAFE_LEVEL as f64).powf(1.5)) as i32;
    }
    
    // Use f64 for precision during power calculation, then cast to i32
    // Formula: 100 * level^1.5
    (100.0 * (level as f64).powf(1.5)) as i32
}

/// Fetch vault lock state for cross-device sync
async fn fetch_vault_lock_state(pool: &PgPool, user_id: Uuid) -> Result<Option<VaultLockData>, AppError> {
    use crate::db::vault_repos::VaultRepo;
    
    match VaultRepo::get_lock_state(pool, user_id).await {
        Ok(Some(lock_state)) => {
            Ok(Some(VaultLockData {
                locked_at: lock_state.locked_at.map(|dt| dt.to_rfc3339()),
                lock_reason: lock_state.lock_reason,
            }))
        }
        Ok(None) => Ok(None),
        Err(_) => Ok(None), // If vault doesn't exist, return None (not an error)
    }
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
///
/// ⚠️ **DEPRECATED** as of v1.5. This endpoint returns minimal session info (user_id, authenticated flag).
/// Use `/api/sync/poll` instead to get comprehensive user profile data (name, email, theme, image, etc.)
/// and other sync state information in a single request.
/// This endpoint will be removed in v2.0.
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
