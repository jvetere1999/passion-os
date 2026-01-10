//! Admin routes (requires admin role)
//!
//! Admin-only functionality accessible at /admin/*.
//! Per DEC-004=B: Role-based access using DB-backed roles.

use std::sync::Arc;
use std::sync::OnceLock;
use rand::Rng;

use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Extension, Json, Router,
};
use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

use crate::db::admin_models::*;
use crate::db::admin_repos::*;
use crate::error::AppError;
use crate::middleware::auth::AuthContext;
use crate::shared::audit::{write_audit, AuditEventType};
use crate::state::AppState;

/// Generate and log a random claim key for admin bootstrap
fn generate_claim_key() -> String {
    let key: String = rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();
    
    // Log the claim key prominently
    tracing::warn!("{}", "=".repeat(60));
    tracing::warn!("ADMIN CLAIM KEY: {}", key);
    tracing::warn!("Use this key to claim admin access at first launch");
    tracing::warn!("{}", "=".repeat(60));
    
    key
}

static CLAIM_KEY: OnceLock<String> = OnceLock::new();

fn get_claim_key() -> &'static str {
    CLAIM_KEY.get_or_init(generate_claim_key).as_str()
}

/// Create admin claiming routes (no admin role required)
pub fn claiming_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/status", get(admin_status))
        .route("/claim", post(admin_claim))
}

/// Create admin routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        // Admin info
        .route("/", get(admin_info))
        // User management
        .nest("/users", users_routes())
        // Quest management
        .nest("/quests", quests_routes())
        // Skill management
        .nest("/skills", skills_routes())
        // Feedback management
        .nest("/feedback", feedback_routes())
        // Content management
        .nest("/content", content_routes())
        // Statistics
        .nest("/stats", stats_routes())
        // Database operations (enhanced)
        .nest("/db", db_routes())
        // Session management
        .nest("/sessions", sessions_routes())
        // Listening prompt templates (admin-curated)
        .nest("/templates", super::admin_templates::router())
        // Backup/restore
        .route("/backup", get(get_backup).post(create_backup))
        .route("/restore", post(restore_backup))
        // Database health
        .route("/db-health", get(db_health))
        // Audit log
        .nest("/audit", audit_routes())
    // Note: Auth + admin role + CSRF middleware applied at top level
}

#[derive(Serialize)]
struct AdminInfo {
    version: String,
    modules: Vec<String>,
    role_required: String,
}

/// Admin info endpoint
async fn admin_info() -> Json<AdminInfo> {
    Json(AdminInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        modules: vec![
            "users".to_string(),
            "quests".to_string(),
            "skills".to_string(),
            "feedback".to_string(),
            "content".to_string(),
            "stats".to_string(),
            "db".to_string(),
            "backup".to_string(),
            "templates".to_string(),
        ],
        role_required: "admin".to_string(),
    })
}

// ============================================
// Admin Status & Claiming Handlers
// ============================================

/// GET /api/admin/status
/// Check if user is admin and if claiming is available
async fn admin_status(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> Result<Json<AdminStatus>, AppError> {
    // Check if user is admin
    let is_admin = AdminClaimRepo::is_user_admin(&state.db, &auth.user_id).await?;

    // Check if any admins exist (for claiming)
    let has_admins = AdminClaimRepo::has_any_admins(&state.db).await?;
    let can_claim = !has_admins;

    // Get user info
    let user_info = Some(AdminUserInfo {
        id: auth.user_id.to_string(),
        email: auth.email.clone(),
        name: Some(auth.name.clone()),
    });

    Ok(Json(AdminStatus {
        is_admin,
        can_claim,
        user: user_info,
    }))
}

/// POST /api/admin/claim
/// Claim admin role (only works if no admins exist)
async fn admin_claim(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(payload): Json<ClaimRequest>,
) -> Result<Json<ClaimResponse>, AppError> {
    // Check if any admins exist
    let has_admins = AdminClaimRepo::has_any_admins(&state.db).await?;
    if has_admins {
        return Ok(Json(ClaimResponse {
            success: false,
            message: "Admin claiming is disabled - admins already exist".to_string(),
        }));
    }

    // Validate claim key
    if payload.claim_key != get_claim_key() {
        tracing::warn!(
            "Invalid admin claim attempt by user {} with key: {}",
            auth.user_id,
            payload.claim_key
        );
        return Ok(Json(ClaimResponse {
            success: false,
            message: "Invalid claim key".to_string(),
        }));
    }

    // Set user as admin
    AdminClaimRepo::set_user_admin(&state.db, &auth.user_id).await?;

    tracing::info!(
        "User {} ({}) successfully claimed admin access",
        auth.user_id,
        auth.email
    );

    // Audit log
    write_audit(
        state.db.clone(),
        AuditEventType::AdminClaimed,
        Some(auth.user_id),
        "User claimed admin role during initial bootstrap",
        Some("user"),
        Some(auth.user_id),
    );

    Ok(Json(ClaimResponse {
        success: true,
        message: "Admin access granted".to_string(),
    }))
}

// User management routes
fn users_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_users))
        .route("/{id}", get(get_user).delete(delete_user))
        .route("/{id}/cleanup", post(cleanup_user))
}

// Quest management routes
fn quests_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_quests).post(create_quest))
        .route(
            "/{id}",
            get(get_quest).put(update_quest).delete(delete_quest),
        )
}

// Skill management routes
fn skills_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_skills).post(create_skill))
        .route(
            "/{id}",
            get(get_skill).put(update_skill).delete(delete_skill),
        )
}

// Feedback management routes
fn feedback_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_feedback))
        .route("/{id}", get(get_feedback).put(update_feedback))
}

// Content management routes
fn content_routes() -> Router<Arc<AppState>> {
    Router::new().route("/", get(list_content))
}

// Statistics routes
fn stats_routes() -> Router<Arc<AppState>> {
    Router::new().route("/", get(get_stats))
}

// Database operations routes (enhanced database viewer)
fn db_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/health", get(db_health))
        .route("/tables", get(list_tables))
        .route("/tables/{table}", get(get_table_data))
        .route("/query", post(run_query))
}

// Session management routes
fn sessions_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_sessions))
        .route("/{id}", axum::routing::delete(delete_session))
}

// Audit log routes
fn audit_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_audit_entries))
        .route("/event-types", get(get_audit_event_types))
}

// ============================================
// User Management Handlers
// ============================================

/// List all users with stats
async fn list_users(
    State(state): State<Arc<AppState>>,
) -> Result<Json<AdminUsersResponse>, AppError> {
    let users = AdminUserRepo::list_users(&state.db).await?;
    Ok(Json(users))
}

/// Get a single user by ID
async fn get_user(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<AdminUserWithStats>, AppError> {
    let user = AdminUserRepo::get_user(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;
    Ok(Json(user))
}

/// Delete a user and all their data
async fn delete_user(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> Result<Json<DeleteUserResponse>, AppError> {
    let result = AdminUserRepo::delete_user(&state.db, id).await?;

    // Audit log: admin user deletion
    write_audit(
        state.db.clone(),
        AuditEventType::UserDeleted,
        Some(auth.user_id),
        &format!("Admin deleted user {}", id),
        Some("user"),
        Some(id),
    );

    Ok(Json(result))
}

/// Cleanup a user's data (same as delete for now)
async fn cleanup_user(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> Result<Json<DeleteUserResponse>, AppError> {
    let result = AdminUserRepo::delete_user(&state.db, id).await?;

    // Audit log: admin user cleanup
    write_audit(
        state.db.clone(),
        AuditEventType::AdminAction,
        Some(auth.user_id),
        &format!("Admin cleaned up user data for {}", id),
        Some("user"),
        Some(id),
    );

    Ok(Json(result))
}

// ============================================
// Quest Management Handlers
// ============================================

/// List all universal quests
async fn list_quests(
    State(state): State<Arc<AppState>>,
) -> Result<Json<AdminQuestsResponse>, AppError> {
    let quests = AdminQuestRepo::list_quests(&state.db).await?;
    Ok(Json(quests))
}

/// Get a single quest
async fn get_quest(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<AdminQuest>, AppError> {
    let quest = AdminQuestRepo::get_quest(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Quest not found".to_string()))?;
    Ok(Json(quest))
}

/// Create a new universal quest
async fn create_quest(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(request): Json<CreateQuestRequest>,
) -> Result<Json<AdminQuest>, AppError> {
    let quest = AdminQuestRepo::create_quest(&state.db, auth.user_id, request).await?;
    Ok(Json(quest))
}

/// Update a quest
async fn update_quest(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateQuestRequest>,
) -> Result<Json<AdminQuest>, AppError> {
    let quest = AdminQuestRepo::update_quest(&state.db, id, request).await?;
    Ok(Json(quest))
}

/// Delete a quest
async fn delete_quest(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let deleted = AdminQuestRepo::delete_quest(&state.db, id).await?;
    Ok(Json(serde_json::json!({
        "success": deleted,
        "message": if deleted { "Quest deleted" } else { "Quest not found" }
    })))
}

// ============================================
// Skill Management Handlers
// ============================================

/// List all skill definitions
async fn list_skills(
    State(state): State<Arc<AppState>>,
) -> Result<Json<AdminSkillsResponse>, AppError> {
    let skills = AdminSkillRepo::list_skills(&state.db).await?;
    Ok(Json(skills))
}

/// Get a single skill
async fn get_skill(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<AdminSkill>, AppError> {
    let skill = AdminSkillRepo::get_skill(&state.db, &id)
        .await?
        .ok_or_else(|| AppError::NotFound("Skill not found".to_string()))?;
    Ok(Json(skill))
}

/// Create or update a skill
async fn create_skill(
    State(state): State<Arc<AppState>>,
    Json(request): Json<CreateSkillRequest>,
) -> Result<Json<AdminSkill>, AppError> {
    let skill = AdminSkillRepo::upsert_skill(&state.db, request).await?;
    Ok(Json(skill))
}

/// Update a skill
async fn update_skill(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(request): Json<UpdateSkillRequest>,
) -> Result<Json<AdminSkill>, AppError> {
    let skill = AdminSkillRepo::update_skill(&state.db, &id, request).await?;
    Ok(Json(skill))
}

/// Delete a skill
async fn delete_skill(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let deleted = AdminSkillRepo::delete_skill(&state.db, &id).await?;
    Ok(Json(serde_json::json!({
        "success": deleted,
        "message": if deleted { "Skill deleted" } else { "Skill not found" }
    })))
}

// ============================================
// Feedback Management Handlers
// ============================================

/// List all feedback
async fn list_feedback(
    State(state): State<Arc<AppState>>,
) -> Result<Json<AdminFeedbackResponse>, AppError> {
    let feedback = AdminFeedbackRepo::list_feedback(&state.db).await?;
    Ok(Json(feedback))
}

/// Get a single feedback entry (list with filter)
async fn get_feedback(
    State(state): State<Arc<AppState>>,
    Path(_id): Path<Uuid>,
) -> Result<Json<AdminFeedbackResponse>, AppError> {
    // For now, return all feedback (UI can filter)
    let feedback = AdminFeedbackRepo::list_feedback(&state.db).await?;
    Ok(Json(feedback))
}

/// Update feedback status/response
async fn update_feedback(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateFeedbackRequest>,
) -> Result<Json<AdminFeedback>, AppError> {
    let feedback = AdminFeedbackRepo::update_feedback(&state.db, id, auth.user_id, request).await?;
    Ok(Json(feedback))
}

// ============================================
// Content & Stats Handlers
// ============================================

/// List content statistics
async fn list_content(State(state): State<Arc<AppState>>) -> Result<Json<ContentStats>, AppError> {
    let stats = AdminStatsRepo::get_stats(&state.db).await?;
    Ok(Json(stats.content))
}

/// Get comprehensive platform statistics
async fn get_stats(
    State(state): State<Arc<AppState>>,
) -> Result<Json<AdminStatsResponse>, AppError> {
    let stats = AdminStatsRepo::get_stats(&state.db).await?;
    Ok(Json(stats))
}

// ============================================
// Database Health & Backup Handlers
// ============================================

/// Database health check with table stats
async fn db_health(State(state): State<Arc<AppState>>) -> Result<Json<DbHealthResponse>, AppError> {
    let health = AdminDbRepo::get_health(&state.db).await?;
    Ok(Json(health))
}

/// List available backups (stub - not implemented for Postgres)
async fn get_backup() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "backups": [],
        "message": "Backup listing not yet implemented for PostgreSQL"
    }))
}

/// Create a backup (stub - not implemented for Postgres)
async fn create_backup() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "success": false,
        "message": "Backup creation not yet implemented for PostgreSQL. Use pg_dump externally."
    }))
}

/// Restore from backup (stub - not implemented for Postgres)
async fn restore_backup() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "success": false,
        "message": "Restore not yet implemented for PostgreSQL. Use pg_restore externally."
    }))
}

// ============================================
// Audit Log Handlers
// ============================================

/// GET /admin/audit
/// List audit log entries with optional filters
async fn list_audit_entries(
    State(state): State<Arc<AppState>>,
    Query(query): Query<AuditLogQuery>,
) -> Result<Json<AuditLogResponse>, AppError> {
    let result = AdminAuditRepo::list_entries(&state.db, &query).await?;
    Ok(Json(result))
}

/// GET /admin/audit/event-types
/// Get distinct event types for filter dropdown
async fn get_audit_event_types(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<String>>, AppError> {
    let types = AdminAuditRepo::get_event_types(&state.db).await?;
    Ok(Json(types))
}

// ============================================
// Database Viewer Handlers
// ============================================

/// Table info for the database viewer
#[derive(Serialize)]
struct TableInfo {
    name: String,
    row_count: i64,
    size_bytes: Option<i64>,
}

/// List all tables with row counts
async fn list_tables(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<TableInfo>>, AppError> {
    let rows = sqlx::query_as::<_, (String, i64, Option<i64>)>(
        r#"
        SELECT 
            tablename::text as name,
            (xpath('/row/cnt/text()', 
                query_to_xml(format('SELECT COUNT(*) as cnt FROM %I.%I', schemaname, tablename), false, true, '')
            ))[1]::text::bigint as row_count,
            pg_table_size(quote_ident(schemaname) || '.' || quote_ident(tablename)) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| AppError::Internal(format!("Failed to list tables: {}", e)))?;

    let tables: Vec<TableInfo> = rows
        .into_iter()
        .map(|(name, row_count, size_bytes)| TableInfo { name, row_count, size_bytes })
        .collect();

    Ok(Json(tables))
}

/// Query parameters for table data
#[derive(serde::Deserialize)]
struct TableDataQuery {
    limit: Option<i32>,
    offset: Option<i32>,
}

/// Get data from a specific table
async fn get_table_data(
    State(state): State<Arc<AppState>>,
    Path(table): Path<String>,
    Query(query): Query<TableDataQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Validate table name to prevent SQL injection
    let valid_tables: Vec<String> = sqlx::query_scalar(
        "SELECT tablename::text FROM pg_tables WHERE schemaname = 'public'"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| AppError::Internal(format!("Failed to validate table: {}", e)))?;

    if !valid_tables.contains(&table) {
        return Err(AppError::NotFound(format!("Table '{}' not found", table)));
    }

    let limit = query.limit.unwrap_or(100).min(1000);
    let offset = query.offset.unwrap_or(0);

    // Get column names first
    let columns: Vec<String> = sqlx::query_scalar(
        r#"
        SELECT column_name::text
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
        "#
    )
    .bind(&table)
    .fetch_all(&state.db)
    .await
    .map_err(|e| AppError::Internal(format!("Failed to get columns: {}", e)))?;

    // Execute query and convert to JSON
    let sql = format!(
        "SELECT row_to_json(t) FROM (SELECT * FROM {} LIMIT {} OFFSET {}) t",
        table, limit, offset
    );
    
    let rows: Vec<serde_json::Value> = sqlx::query_scalar(&sql)
        .fetch_all(&state.db)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch data: {}", e)))?;

    // Get total count
    let count_sql = format!("SELECT COUNT(*) FROM {}", table);
    let total: i64 = sqlx::query_scalar(&count_sql)
        .fetch_one(&state.db)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to count: {}", e)))?;

    Ok(Json(serde_json::json!({
        "table": table,
        "columns": columns,
        "rows": rows,
        "total": total,
        "limit": limit,
        "offset": offset
    })))
}

/// Request body for running queries
#[derive(serde::Deserialize)]
struct RunQueryRequest {
    sql: String,
}

/// Run a read-only SQL query
async fn run_query(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(request): Json<RunQueryRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let sql = request.sql.trim();
    
    // Security: Only allow SELECT statements
    let sql_upper = sql.to_uppercase();
    if !sql_upper.starts_with("SELECT") && !sql_upper.starts_with("WITH") {
        return Err(AppError::Validation("Only SELECT queries are allowed".to_string()));
    }
    
    // Block dangerous keywords
    let dangerous = ["DELETE", "UPDATE", "INSERT", "DROP", "TRUNCATE", "ALTER", "CREATE", "GRANT", "REVOKE"];
    for keyword in dangerous {
        if sql_upper.contains(keyword) {
            return Err(AppError::Validation(format!("Query contains forbidden keyword: {}", keyword)));
        }
    }

    // Limit results
    let limited_sql = if !sql_upper.contains("LIMIT") {
        format!("{} LIMIT 1000", sql)
    } else {
        sql.to_string()
    };

    // Execute and return as JSON
    let start = std::time::Instant::now();
    let rows: Vec<serde_json::Value> = sqlx::query_scalar(
        &format!("SELECT row_to_json(t) FROM ({}) t", limited_sql)
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| AppError::Internal(format!("Query failed: {}", e)))?;

    let duration_ms = start.elapsed().as_millis();

    // Audit log: admin query
    write_audit(
        state.db.clone(),
        AuditEventType::AdminAction,
        Some(auth.user_id),
        &format!("Admin ran query: {}", if sql.len() > 100 { &sql[..100] } else { sql }),
        None,
        None,
    );

    Ok(Json(serde_json::json!({
        "rows": rows,
        "count": rows.len(),
        "duration_ms": duration_ms,
        "sql": sql
    })))
}

// ============================================
// Session Management Handlers
// ============================================

/// Session info for admin view
#[derive(Serialize)]
struct SessionInfo {
    id: Uuid,
    user_id: Uuid,
    user_email: Option<String>,
    user_name: Option<String>,
    created_at: DateTime<Utc>,
    last_activity_at: DateTime<Utc>,
    expires_at: DateTime<Utc>,
    user_agent: Option<String>,
    ip_address: Option<String>,
}

/// List all active sessions
async fn list_sessions(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<SessionInfo>>, AppError> {
    let rows = sqlx::query_as::<_, (Uuid, Uuid, Option<String>, Option<String>, DateTime<Utc>, DateTime<Utc>, DateTime<Utc>, Option<String>, Option<String>)>(
        r#"
        SELECT 
            s.id,
            s.user_id,
            u.email,
            u.name,
            s.created_at,
            s.last_activity_at,
            s.expires_at,
            s.user_agent,
            s.ip_address::text
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.expires_at > NOW()
        ORDER BY s.last_activity_at DESC
        LIMIT 500
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| AppError::Internal(format!("Failed to list sessions: {}", e)))?;

    let sessions: Vec<SessionInfo> = rows
        .into_iter()
        .map(|(id, user_id, user_email, user_name, created_at, last_activity_at, expires_at, user_agent, ip_address)| {
            SessionInfo {
                id,
                user_id,
                user_email,
                user_name,
                created_at,
                last_activity_at,
                expires_at,
                user_agent,
                ip_address,
            }
        })
        .collect();

    Ok(Json(sessions))
}

/// Delete a session (force logout)
async fn delete_session(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM sessions WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to delete session: {}", e)))?;

    // Audit log
    write_audit(
        state.db.clone(),
        AuditEventType::AdminAction,
        Some(auth.user_id),
        &format!("Admin deleted session {}", id),
        Some("session"),
        Some(id),
    );

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Session deleted"
    })))
}
