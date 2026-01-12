//! Calendar routes
//!
//! Routes for calendar event management.

use std::sync::Arc;

use axum::{
    extract::{Extension, Path, Query, State},
    routing::get,
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::models::User;
use crate::db::platform_models::*;
use crate::db::platform_repos::CalendarRepo;
use crate::error::AppError;
use crate::state::AppState;

/// Create calendar routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_events).post(create_event))
        .route(
            "/{id}",
            get(get_event).put(update_event).delete(delete_event),
        )
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

#[derive(Debug, Deserialize)]
struct ListEventsQuery {
    start_date: Option<String>,
    end_date: Option<String>,
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(Serialize)]
struct EventWrapper {
    event: CalendarEventResponse,
}

#[derive(Serialize)]
struct EventsListWrapper {
    events: Vec<CalendarEventResponse>,
}

#[derive(Serialize)]
struct DeleteSuccessWrapper {
    success: bool,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /calendar
/// List all events or events in a date range
async fn list_events(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListEventsQuery>,
) -> Result<Json<EventsListWrapper>, AppError> {
    let result = if let (Some(start), Some(end)) = (&query.start_date, &query.end_date) {
        let start: DateTime<Utc> = start
            .parse()
            .map_err(|_| AppError::Validation("Invalid start_date format".into()))?;
        let end: DateTime<Utc> = end
            .parse()
            .map_err(|_| AppError::Validation("Invalid end_date format".into()))?;

        CalendarRepo::list_in_range(&state.db, user.id, start, end).await?
    } else {
        CalendarRepo::list(&state.db, user.id).await?
    };

    Ok(Json(EventsListWrapper { events: result.events }))
}

/// GET /calendar/:id
/// Get a single event
async fn get_event(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<EventWrapper>, AppError> {
    let event = CalendarRepo::get(&state.db, id, user.id).await?;
    Ok(Json(EventWrapper { event }))
}

/// POST /calendar
/// Create a new event
async fn create_event(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateCalendarEventRequest>,
) -> Result<Json<EventWrapper>, AppError> {
    let event = CalendarRepo::create(&state.db, user.id, &req).await?;
    Ok(Json(EventWrapper { event }))
}

/// PUT /calendar/:id
/// Update an event
async fn update_event(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateCalendarEventRequest>,
) -> Result<Json<EventWrapper>, AppError> {
    let event = CalendarRepo::update(&state.db, id, user.id, &req).await?;
    Ok(Json(EventWrapper { event }))
}

/// DELETE /calendar/:id
/// Delete an event
async fn delete_event(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<DeleteSuccessWrapper>, AppError> {
    CalendarRepo::delete(&state.db, id, user.id).await?;
    Ok(Json(DeleteSuccessWrapper { success: true }))
}
