//! Learn routes
//!
//! Routes for learning system (topics, lessons, drills, progress).

use std::sync::Arc;

use axum::{
    extract::{Extension, Path, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::learn_models::*;
use crate::db::learn_repos::LearnRepo;
use crate::db::models::User;
use crate::error::AppError;
use crate::state::AppState;

/// Create learn routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_overview))
        .route("/topics", get(list_topics))
        .route("/topics/{topic_id}/lessons", get(list_lessons))
        .route("/topics/{topic_id}/drills", get(list_drills))
        .route("/lessons/{id}", get(get_lesson))
        .route("/lessons/{id}/start", post(start_lesson))
        .route("/lessons/{id}/complete", post(complete_lesson))
        .route("/drills/{id}/submit", post(submit_drill))
        .route("/review", get(get_review_items))
        .route("/progress", get(get_progress))
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(Serialize)]
struct TopicsWrapper {
    topics: Vec<TopicResponse>,
}

#[derive(Serialize)]
struct LessonsWrapper {
    lessons: Vec<LessonResponse>,
}

#[derive(Serialize)]
struct LessonContentWrapper {
    lesson: LessonContentResponse,
}

#[derive(Serialize)]
struct LessonProgressWrapper {
    progress: LessonProgressInfo,
}

#[derive(Serialize)]
struct CompleteLessonWrapper {
    result: CompleteLessonResult,
}

#[derive(Serialize)]
struct DrillsWrapper {
    drills: Vec<DrillResponse>,
}

#[derive(Serialize)]
struct DrillResultWrapper {
    result: DrillResultResponse,
}

#[derive(Serialize)]
struct ReviewWrapper {
    review: ReviewItemsResponse,
}

#[derive(Serialize)]
struct ProgressWrapper {
    progress: LearnProgressSummary,
}

#[derive(Serialize)]
struct LearnOverview {
    progress: LearnProgressSummary,
    review_count: i64,
    topics: Vec<TopicResponse>,
}

#[derive(Serialize)]
struct OverviewWrapper {
    overview: LearnOverview,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /learn
/// Get learning overview
async fn get_overview(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<OverviewWrapper>, AppError> {
    let progress = LearnRepo::get_progress_summary(&state.db, user.id).await?;
    let topics = LearnRepo::list_topics(&state.db, user.id).await?;
    let review = LearnRepo::get_review_items(&state.db, user.id).await?;

    Ok(Json(OverviewWrapper {
        overview: LearnOverview {
            progress,
            review_count: review.total_due,
            topics: topics.topics,
        },
    }))
}

/// GET /learn/topics
/// List all topics with progress
async fn list_topics(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<TopicsWrapper>, AppError> {
    let result = LearnRepo::list_topics(&state.db, user.id).await?;
    Ok(Json(TopicsWrapper { topics: result.topics }))
}

/// GET /learn/topics/:topic_id/lessons
/// List lessons for a topic
async fn list_lessons(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(topic_id): Path<Uuid>,
) -> Result<Json<LessonsWrapper>, AppError> {
    let result = LearnRepo::list_lessons(&state.db, user.id, topic_id).await?;
    Ok(Json(LessonsWrapper { lessons: result.lessons }))
}

/// GET /learn/topics/:topic_id/drills
/// List drills for a topic
async fn list_drills(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(topic_id): Path<Uuid>,
) -> Result<Json<DrillsWrapper>, AppError> {
    let result = LearnRepo::list_drills(&state.db, user.id, topic_id).await?;
    Ok(Json(DrillsWrapper { drills: result.drills }))
}

/// GET /learn/lessons/:id
/// Get lesson content
async fn get_lesson(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<Json<LessonContentWrapper>, AppError> {
    let lesson = LearnRepo::get_lesson_content(&state.db, user.id, id).await?;
    let lesson = lesson.ok_or_else(|| AppError::NotFound("Lesson not found".to_string()))?;
    Ok(Json(LessonContentWrapper { lesson }))
}

/// POST /learn/lessons/:id/start
/// Start a lesson
async fn start_lesson(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(lesson_id): Path<Uuid>,
) -> Result<Json<LessonProgressWrapper>, AppError> {
    let progress = LearnRepo::start_lesson(&state.db, user.id, lesson_id).await?;
    Ok(Json(LessonProgressWrapper { progress }))
}

/// POST /learn/lessons/:id/complete
/// Complete a lesson
async fn complete_lesson(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(lesson_id): Path<Uuid>,
    Json(body): Json<CompleteRequest>,
) -> Result<Json<CompleteLessonWrapper>, AppError> {
    let req = CompleteLessonRequest {
        lesson_id,
        quiz_score: body.quiz_score,
    };
    let result = LearnRepo::complete_lesson(&state.db, user.id, &req).await?;
    Ok(Json(CompleteLessonWrapper { result }))
}

#[derive(Deserialize)]
struct CompleteRequest {
    quiz_score: Option<i32>,
}

/// POST /learn/drills/:id/submit
/// Submit drill result
async fn submit_drill(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(drill_id): Path<Uuid>,
    Json(body): Json<SubmitRequest>,
) -> Result<Json<DrillResultWrapper>, AppError> {
    let req = SubmitDrillRequest {
        drill_id,
        score: body.score,
        correct_count: body.correct_count,
        total_count: body.total_count,
        time_seconds: body.time_seconds,
    };
    let result = LearnRepo::submit_drill(&state.db, user.id, &req).await?;
    Ok(Json(DrillResultWrapper { result }))
}

#[derive(Deserialize)]
struct SubmitRequest {
    score: i32,
    correct_count: i32,
    total_count: i32,
    time_seconds: i32,
}

/// GET /learn/review
/// Get items due for review
async fn get_review_items(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<ReviewWrapper>, AppError> {
    let result = LearnRepo::get_review_items(&state.db, user.id).await?;
    Ok(Json(ReviewWrapper { review: result }))
}

/// GET /learn/progress
/// Get learning progress summary
async fn get_progress(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<ProgressWrapper>, AppError> {
    let progress = LearnRepo::get_progress_summary(&state.db, user.id).await?;
    Ok(Json(ProgressWrapper { progress }))
}
