//! Admin routes (requires admin role)
//!
//! Admin-only functionality accessible at /admin/*.
//! Per DEC-004=B: Role-based access using DB-backed roles.

use std::sync::Arc;

use axum::{
    extract::{Path, State},
    routing::{get, post},
    Extension, Json, Router,
};
use serde::Serialize;
use uuid::Uuid;

use crate::db::admin_models::*;
use crate::db::admin_repos::*;
use crate::error::AppError;
use crate::middleware::auth::AuthContext;
use crate::shared::audit::{write_audit, AuditEventType};
use crate::state::AppState;

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
        // Database operations
        .nest("/db", db_routes())
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

// Database operations routes
fn db_routes() -> Router<Arc<AppState>> {
    Router::new().route("/health", get(db_health))
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

use axum::extract::Query;

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
