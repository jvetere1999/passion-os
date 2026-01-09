//! Admin routes for listening prompt templates
//!
//! CRUD operations for admin-curated listening prompt templates and presets.
//! Per DEC-004=B: Role-based access using DB-backed roles.

use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::get,
    Extension, Json, Router,
};
use serde::Serialize;
use uuid::Uuid;

use crate::db::template_models::{
    CreatePresetInput, CreateTemplateInput, ListeningPromptPreset, ListeningPromptTemplate,
    TemplateListOptions, TemplateWithPresets, UpdatePresetInput, UpdateTemplateInput,
};
use crate::db::template_repos::{PresetRepository, TemplateRepository};
use crate::middleware::auth::AuthContext;
use crate::state::AppState;

/// Create template admin routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        // Templates
        .route("/", get(list_templates).post(create_template))
        .route(
            "/{id}",
            get(get_template)
                .put(update_template)
                .delete(delete_template),
        )
        // Presets nested under templates
        .route(
            "/{id}/presets",
            get(list_template_presets).post(create_preset),
        )
        // Standalone preset routes
        .nest("/presets", preset_routes())
}

/// Standalone preset routes (for presets not tied to templates)
fn preset_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_all_presets))
        .route("/standalone", get(list_standalone_presets))
        .route(
            "/{id}",
            get(get_preset).put(update_preset).delete(delete_preset),
        )
}

// ============================================
// Response types
// ============================================

#[derive(Serialize)]
struct TemplateListResponse {
    templates: Vec<ListeningPromptTemplate>,
    total: i64,
    page: i64,
    page_size: i64,
}

#[derive(Serialize)]
struct TemplateResponse {
    template: ListeningPromptTemplate,
}

#[derive(Serialize)]
struct TemplateDetailResponse {
    template: TemplateWithPresets,
}

#[derive(Serialize)]
struct PresetListResponse {
    presets: Vec<ListeningPromptPreset>,
}

#[derive(Serialize)]
struct PresetResponse {
    preset: ListeningPromptPreset,
}

#[derive(Serialize)]
struct DeleteResponse {
    deleted: bool,
    message: String,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

// ============================================
// Template handlers
// ============================================

/// List templates with optional filtering
async fn list_templates(
    State(state): State<Arc<AppState>>,
    Query(options): Query<TemplateListOptions>,
) -> Result<Json<TemplateListResponse>, (StatusCode, Json<ErrorResponse>)> {
    let page = options.page.unwrap_or(1);
    let page_size = options.page_size.unwrap_or(50);

    let templates = TemplateRepository::list(&state.db, &options)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to list templates: {}", e),
                }),
            )
        })?;

    let total = TemplateRepository::count(&state.db, &options)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to count templates: {}", e),
                }),
            )
        })?;

    Ok(Json(TemplateListResponse {
        templates,
        total,
        page,
        page_size,
    }))
}

/// Get a single template with its presets
async fn get_template(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<TemplateDetailResponse>, (StatusCode, Json<ErrorResponse>)> {
    let template = TemplateRepository::get_with_presets(&state.db, id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to get template: {}", e),
                }),
            )
        })?;

    match template {
        Some(template) => Ok(Json(TemplateDetailResponse { template })),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Template not found".to_string(),
            }),
        )),
    }
}

/// Create a new template
async fn create_template(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(input): Json<CreateTemplateInput>,
) -> Result<(StatusCode, Json<TemplateResponse>), (StatusCode, Json<ErrorResponse>)> {
    // Validate input
    if input.name.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Name is required".to_string(),
            }),
        ));
    }

    if input.prompt_text.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Prompt text is required".to_string(),
            }),
        ));
    }

    let template = TemplateRepository::create(&state.db, &input, auth.user_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to create template: {}", e),
                }),
            )
        })?;

    Ok((StatusCode::CREATED, Json(TemplateResponse { template })))
}

/// Update a template
async fn update_template(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(input): Json<UpdateTemplateInput>,
) -> Result<Json<TemplateResponse>, (StatusCode, Json<ErrorResponse>)> {
    let template = TemplateRepository::update(&state.db, id, &input)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to update template: {}", e),
                }),
            )
        })?;

    match template {
        Some(template) => Ok(Json(TemplateResponse { template })),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Template not found".to_string(),
            }),
        )),
    }
}

/// Delete a template
async fn delete_template(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<DeleteResponse>, (StatusCode, Json<ErrorResponse>)> {
    let deleted = TemplateRepository::delete(&state.db, id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to delete template: {}", e),
                }),
            )
        })?;

    if deleted {
        Ok(Json(DeleteResponse {
            deleted: true,
            message: "Template deleted successfully".to_string(),
        }))
    } else {
        Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Template not found".to_string(),
            }),
        ))
    }
}

// ============================================
// Preset handlers
// ============================================

/// List all presets
async fn list_all_presets(
    State(state): State<Arc<AppState>>,
) -> Result<Json<PresetListResponse>, (StatusCode, Json<ErrorResponse>)> {
    let presets = PresetRepository::list(&state.db).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to list presets: {}", e),
            }),
        )
    })?;

    Ok(Json(PresetListResponse { presets }))
}

/// List standalone presets (not attached to any template)
async fn list_standalone_presets(
    State(state): State<Arc<AppState>>,
) -> Result<Json<PresetListResponse>, (StatusCode, Json<ErrorResponse>)> {
    let presets = PresetRepository::list_standalone(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to list presets: {}", e),
                }),
            )
        })?;

    Ok(Json(PresetListResponse { presets }))
}

/// List presets for a specific template
async fn list_template_presets(
    State(state): State<Arc<AppState>>,
    Path(template_id): Path<Uuid>,
) -> Result<Json<PresetListResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Verify template exists
    let template = TemplateRepository::get_by_id(&state.db, template_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to get template: {}", e),
                }),
            )
        })?;

    if template.is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Template not found".to_string(),
            }),
        ));
    }

    let presets = PresetRepository::list_by_template(&state.db, template_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to list presets: {}", e),
                }),
            )
        })?;

    Ok(Json(PresetListResponse { presets }))
}

/// Get a single preset
async fn get_preset(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<PresetResponse>, (StatusCode, Json<ErrorResponse>)> {
    let preset = PresetRepository::get_by_id(&state.db, id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to get preset: {}", e),
                }),
            )
        })?;

    match preset {
        Some(preset) => Ok(Json(PresetResponse { preset })),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Preset not found".to_string(),
            }),
        )),
    }
}

/// Create a new preset
async fn create_preset(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Path(template_id): Path<Uuid>,
    Json(mut input): Json<CreatePresetInput>,
) -> Result<(StatusCode, Json<PresetResponse>), (StatusCode, Json<ErrorResponse>)> {
    // Set template_id from path
    input.template_id = Some(template_id);

    // Validate input
    if input.name.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Name is required".to_string(),
            }),
        ));
    }

    // Verify template exists
    let template = TemplateRepository::get_by_id(&state.db, template_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to get template: {}", e),
                }),
            )
        })?;

    if template.is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Template not found".to_string(),
            }),
        ));
    }

    let preset = PresetRepository::create(&state.db, &input, auth.user_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to create preset: {}", e),
                }),
            )
        })?;

    Ok((StatusCode::CREATED, Json(PresetResponse { preset })))
}

/// Update a preset
async fn update_preset(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(input): Json<UpdatePresetInput>,
) -> Result<Json<PresetResponse>, (StatusCode, Json<ErrorResponse>)> {
    let preset = PresetRepository::update(&state.db, id, &input)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to update preset: {}", e),
                }),
            )
        })?;

    match preset {
        Some(preset) => Ok(Json(PresetResponse { preset })),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Preset not found".to_string(),
            }),
        )),
    }
}

/// Delete a preset
async fn delete_preset(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<DeleteResponse>, (StatusCode, Json<ErrorResponse>)> {
    let deleted = PresetRepository::delete(&state.db, id).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to delete preset: {}", e),
            }),
        )
    })?;

    if deleted {
        Ok(Json(DeleteResponse {
            deleted: true,
            message: "Preset deleted successfully".to_string(),
        }))
    } else {
        Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Preset not found".to_string(),
            }),
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_template_response_serialization() {
        // Verify response types can be serialized
        let response = DeleteResponse {
            deleted: true,
            message: "Test".to_string(),
        };
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("deleted"));
    }
}
