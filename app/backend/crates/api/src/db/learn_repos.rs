//! Learn repository
//!
//! Database operations for learning system.

use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::error::AppError;

use super::learn_models::*;

// ============================================================================
// TOPIC REPOSITORY
// ============================================================================

pub struct LearnRepo;

impl LearnRepo {
    /// List all topics with user progress
    pub async fn list_topics(pool: &PgPool, user_id: Uuid) -> Result<TopicsListResponse, AppError> {
        #[derive(FromRow)]
        struct TopicRow {
            id: Uuid,
            key: String,
            name: String,
            description: Option<String>,
            category: Option<String>,
            icon: Option<String>,
            lesson_count: Option<i64>,
            completed_count: Option<i64>,
        }

        let topics = sqlx::query_as::<_, TopicRow>(
            r#"
            SELECT t.id, t.key, t.name, t.description, t.category, t.icon,
                   COUNT(DISTINCT l.id) as lesson_count,
                   COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN l.id END) as completed_count
            FROM learn_topics t
            LEFT JOIN learn_lessons l ON l.topic_id = t.id
            LEFT JOIN user_lesson_progress p ON p.lesson_id = l.id AND p.user_id = $1
            GROUP BY t.id, t.key, t.name, t.description, t.category, t.icon
            ORDER BY t.sort_order
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        let total = topics.len() as i64;

        Ok(TopicsListResponse {
            topics: topics
                .into_iter()
                .map(|t| TopicResponse {
                    id: t.id,
                    key: t.key,
                    name: t.name,
                    description: t.description,
                    category: t.category.unwrap_or_default(),
                    icon: t.icon,
                    lesson_count: t.lesson_count.unwrap_or(0),
                    completed_count: t.completed_count.unwrap_or(0),
                })
                .collect(),
            total,
        })
    }

    /// List lessons for a topic with user progress
    pub async fn list_lessons(
        pool: &PgPool,
        user_id: Uuid,
        topic_id: Uuid,
    ) -> Result<LessonsListResponse, AppError> {
        #[derive(FromRow)]
        struct LessonRow {
            id: Uuid,
            topic_id: Uuid,
            key: String,
            title: String,
            description: Option<String>,
            duration_minutes: Option<i32>,
            difficulty: Option<String>,
            xp_reward: i32,
            coin_reward: i32,
            has_quiz: Option<bool>,
            has_audio: Option<bool>,
            status: Option<String>,
        }

        let lessons = sqlx::query_as::<_, LessonRow>(
            r#"
            SELECT l.id, l.topic_id, l.key, l.title, l.description,
                   l.duration_minutes, l.difficulty, l.xp_reward, l.coin_reward,
                   l.quiz_json IS NOT NULL as has_quiz,
                   l.audio_r2_key IS NOT NULL as has_audio,
                   COALESCE(p.status, 'not_started') as status
            FROM learn_lessons l
            LEFT JOIN user_lesson_progress p ON p.lesson_id = l.id AND p.user_id = $1
            WHERE l.topic_id = $2
            ORDER BY l.sort_order
            "#,
        )
        .bind(user_id)
        .bind(topic_id)
        .fetch_all(pool)
        .await?;

        let total = lessons.len() as i64;

        Ok(LessonsListResponse {
            lessons: lessons
                .into_iter()
                .map(|l| LessonResponse {
                    id: l.id,
                    topic_id: l.topic_id,
                    key: l.key,
                    title: l.title,
                    description: l.description,
                    duration_minutes: l.duration_minutes.unwrap_or(0),
                    difficulty: l.difficulty.unwrap_or_default(),
                    xp_reward: l.xp_reward,
                    coin_reward: l.coin_reward,
                    status: l.status.unwrap_or_else(|| "not_started".to_string()),
                    has_quiz: l.has_quiz.unwrap_or(false),
                    has_audio: l.has_audio.unwrap_or(false),
                })
                .collect(),
            total,
        })
    }

    /// Get lesson content
    pub async fn get_lesson_content(
        pool: &PgPool,
        user_id: Uuid,
        lesson_id: Uuid,
    ) -> Result<Option<LessonContentResponse>, AppError> {
        #[derive(FromRow)]
        struct LessonContentRow {
            id: Uuid,
            title: String,
            content_markdown: Option<String>,
            quiz_json: Option<serde_json::Value>,
            audio_r2_key: Option<String>,
            status: Option<String>,
            started_at: Option<chrono::DateTime<chrono::Utc>>,
            completed_at: Option<chrono::DateTime<chrono::Utc>>,
            quiz_score: Option<i32>,
            attempts: Option<i32>,
        }

        let lesson = sqlx::query_as::<_, LessonContentRow>(
            r#"
            SELECT l.id, l.title, l.content_markdown, l.quiz_json, l.audio_r2_key,
                   p.status, p.started_at, p.completed_at, p.quiz_score, p.attempts
            FROM learn_lessons l
            LEFT JOIN user_lesson_progress p ON p.lesson_id = l.id AND p.user_id = $1
            WHERE l.id = $2
            "#,
        )
        .bind(user_id)
        .bind(lesson_id)
        .fetch_optional(pool)
        .await?;

        Ok(lesson.map(|l| LessonContentResponse {
            id: l.id,
            title: l.title,
            content_markdown: l.content_markdown,
            quiz_json: l.quiz_json,
            audio_url: l
                .audio_r2_key
                .map(|k| format!("/api/blobs/{}/download-url", k)),
            progress: LessonProgressInfo {
                status: l.status.unwrap_or_else(|| "not_started".to_string()),
                started_at: l.started_at,
                completed_at: l.completed_at,
                quiz_score: l.quiz_score,
                attempts: l.attempts.unwrap_or(0),
            },
        }))
    }

    /// Start a lesson
    pub async fn start_lesson(
        pool: &PgPool,
        user_id: Uuid,
        lesson_id: Uuid,
    ) -> Result<LessonProgressInfo, AppError> {
        // Check if lesson exists
        let exists: Option<Uuid> = sqlx::query_scalar("SELECT id FROM learn_lessons WHERE id = $1")
            .bind(lesson_id)
            .fetch_optional(pool)
            .await?;

        if exists.is_none() {
            return Err(AppError::NotFound("Lesson not found".to_string()));
        }

        // Upsert progress
        #[derive(FromRow)]
        struct ProgressRow {
            status: String,
            started_at: Option<chrono::DateTime<chrono::Utc>>,
            completed_at: Option<chrono::DateTime<chrono::Utc>>,
            quiz_score: Option<i32>,
            attempts: i32,
        }

        let progress = sqlx::query_as::<_, ProgressRow>(
            r#"
            INSERT INTO user_lesson_progress (user_id, lesson_id, status, started_at)
            VALUES ($1, $2, 'in_progress', NOW())
            ON CONFLICT (user_id, lesson_id)
            DO UPDATE SET status = 'in_progress', started_at = COALESCE(user_lesson_progress.started_at, NOW())
            RETURNING status, started_at, completed_at, quiz_score, attempts
            "#,
        )
        .bind(user_id)
        .bind(lesson_id)
        .fetch_one(pool)
        .await?;

        Ok(LessonProgressInfo {
            status: progress.status,
            started_at: progress.started_at,
            completed_at: progress.completed_at,
            quiz_score: progress.quiz_score,
            attempts: progress.attempts,
        })
    }

    /// Complete a lesson
    pub async fn complete_lesson(
        pool: &PgPool,
        user_id: Uuid,
        req: &CompleteLessonRequest,
    ) -> Result<CompleteLessonResult, AppError> {
        // Get lesson
        #[derive(FromRow)]
        struct LessonRewards {
            id: Uuid,
            xp_reward: i32,
            coin_reward: i32,
        }

        let lesson = sqlx::query_as::<_, LessonRewards>(
            "SELECT id, xp_reward, coin_reward FROM learn_lessons WHERE id = $1",
        )
        .bind(req.lesson_id)
        .fetch_optional(pool)
        .await?;

        let lesson = lesson.ok_or_else(|| AppError::NotFound("Lesson not found".to_string()))?;

        // Check if already completed
        #[derive(FromRow)]
        struct CompletedCheck {
            completed_at: Option<chrono::DateTime<chrono::Utc>>,
        }

        let existing = sqlx::query_as::<_, CompletedCheck>(
            "SELECT completed_at FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2",
        )
        .bind(user_id)
        .bind(req.lesson_id)
        .fetch_optional(pool)
        .await?;

        let is_first_completion = existing.map_or(true, |e| e.completed_at.is_none());

        // Upsert progress
        sqlx::query(
            r#"
            INSERT INTO user_lesson_progress (user_id, lesson_id, status, started_at, completed_at, quiz_score, attempts)
            VALUES ($1, $2, 'completed', NOW(), NOW(), $3, 1)
            ON CONFLICT (user_id, lesson_id)
            DO UPDATE SET
                status = 'completed',
                completed_at = COALESCE(user_lesson_progress.completed_at, NOW()),
                quiz_score = COALESCE($3, user_lesson_progress.quiz_score),
                attempts = user_lesson_progress.attempts + 1
            "#,
        )
        .bind(user_id)
        .bind(req.lesson_id)
        .bind(req.quiz_score)
        .execute(pool)
        .await?;

        // Award XP/coins only on first completion
        let (xp_awarded, coins_awarded) = if is_first_completion {
            (lesson.xp_reward, lesson.coin_reward)
        } else {
            (0, 0)
        };

        Ok(CompleteLessonResult {
            lesson_id: req.lesson_id,
            xp_awarded,
            coins_awarded,
            is_first_completion,
            quiz_score: req.quiz_score,
        })
    }

    /// List drills for a topic with user stats
    pub async fn list_drills(
        pool: &PgPool,
        user_id: Uuid,
        topic_id: Uuid,
    ) -> Result<DrillsListResponse, AppError> {
        #[derive(FromRow)]
        struct DrillRow {
            id: Uuid,
            topic_id: Uuid,
            key: String,
            title: String,
            description: Option<String>,
            drill_type: String,
            difficulty: Option<String>,
            duration_seconds: Option<i32>,
            xp_reward: i32,
            best_score: Option<i32>,
            current_streak: Option<i32>,
        }

        let drills = sqlx::query_as::<_, DrillRow>(
            r#"
            SELECT d.id, d.topic_id, d.key, d.title, d.description,
                   d.drill_type, d.difficulty, d.duration_seconds, d.xp_reward,
                   s.best_score, s.current_streak
            FROM learn_drills d
            LEFT JOIN user_drill_stats s ON s.drill_id = d.id AND s.user_id = $1
            WHERE d.topic_id = $2
            ORDER BY d.sort_order
            "#,
        )
        .bind(user_id)
        .bind(topic_id)
        .fetch_all(pool)
        .await?;

        let total = drills.len() as i64;

        Ok(DrillsListResponse {
            drills: drills
                .into_iter()
                .map(|d| DrillResponse {
                    id: d.id,
                    topic_id: d.topic_id,
                    key: d.key,
                    title: d.title,
                    description: d.description,
                    drill_type: d.drill_type,
                    difficulty: d.difficulty.unwrap_or_default(),
                    duration_seconds: d.duration_seconds.unwrap_or(0),
                    xp_reward: d.xp_reward,
                    best_score: d.best_score,
                    current_streak: d.current_streak.unwrap_or(0),
                })
                .collect(),
            total,
        })
    }

    /// Submit drill result
    pub async fn submit_drill(
        pool: &PgPool,
        user_id: Uuid,
        req: &SubmitDrillRequest,
    ) -> Result<DrillResultResponse, AppError> {
        // Get drill
        #[derive(FromRow)]
        struct DrillInfo {
            id: Uuid,
            xp_reward: i32,
        }

        let drill =
            sqlx::query_as::<_, DrillInfo>("SELECT id, xp_reward FROM learn_drills WHERE id = $1")
                .bind(req.drill_id)
                .fetch_optional(pool)
                .await?;

        let drill = drill.ok_or_else(|| AppError::NotFound("Drill not found".to_string()))?;

        // Get existing stats
        #[derive(FromRow)]
        struct StatsRow {
            best_score: Option<i32>,
            current_streak: Option<i32>,
        }

        let existing = sqlx::query_as::<_, StatsRow>(
            "SELECT best_score, current_streak FROM user_drill_stats WHERE user_id = $1 AND drill_id = $2",
        )
        .bind(user_id)
        .bind(req.drill_id)
        .fetch_optional(pool)
        .await?;

        let is_new_best = existing
            .as_ref()
            .map_or(true, |e| e.best_score.map_or(true, |b| req.score > b));

        // Check if streak continues (practiced yesterday or today)
        let streak_continued = true; // Simplified - would check last_attempt_at

        let new_streak = if streak_continued {
            existing
                .as_ref()
                .map_or(1, |e| e.current_streak.unwrap_or(0) + 1)
        } else {
            1
        };

        // Upsert stats
        sqlx::query(
            r#"
            INSERT INTO user_drill_stats (user_id, drill_id, total_attempts, correct_answers, best_score,
                                          current_streak, last_attempt_at, total_time_seconds)
            VALUES ($1, $2, 1, $3, $4, $5, NOW(), $6)
            ON CONFLICT (user_id, drill_id)
            DO UPDATE SET
                total_attempts = user_drill_stats.total_attempts + 1,
                correct_answers = user_drill_stats.correct_answers + $3,
                best_score = GREATEST(user_drill_stats.best_score, $4),
                current_streak = $5,
                last_attempt_at = NOW(),
                total_time_seconds = user_drill_stats.total_time_seconds + $6
            "#,
        )
        .bind(user_id)
        .bind(req.drill_id)
        .bind(req.correct_count)
        .bind(req.score)
        .bind(new_streak)
        .bind(req.time_seconds)
        .execute(pool)
        .await?;

        // Award XP based on performance
        let xp_awarded = if req.score >= 80 {
            drill.xp_reward
        } else if req.score >= 60 {
            drill.xp_reward / 2
        } else {
            1
        };

        Ok(DrillResultResponse {
            drill_id: req.drill_id,
            score: req.score,
            xp_awarded,
            is_new_best,
            streak_continued,
            new_streak,
        })
    }

    /// Get items due for review (spaced repetition)
    pub async fn get_review_items(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<ReviewItemsResponse, AppError> {
        // Get lessons that were completed but might need review
        #[derive(FromRow)]
        struct LessonDueRow {
            id: Uuid,
            topic_id: Uuid,
            key: String,
            title: String,
            description: Option<String>,
            duration_minutes: Option<i32>,
            difficulty: Option<String>,
            xp_reward: i32,
            coin_reward: i32,
            has_quiz: Option<bool>,
            has_audio: Option<bool>,
        }

        let lessons_due = sqlx::query_as::<_, LessonDueRow>(
            r#"
            SELECT l.id, l.topic_id, l.key, l.title, l.description,
                   l.duration_minutes, l.difficulty, l.xp_reward, l.coin_reward,
                   l.quiz_json IS NOT NULL as has_quiz,
                   l.audio_r2_key IS NOT NULL as has_audio
            FROM learn_lessons l
            JOIN user_lesson_progress p ON p.lesson_id = l.id AND p.user_id = $1
            WHERE p.status = 'completed'
              AND p.completed_at < NOW() - INTERVAL '7 days'
            ORDER BY p.completed_at
            LIMIT 5
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        #[derive(FromRow)]
        struct DrillDueRow {
            id: Uuid,
            topic_id: Uuid,
            key: String,
            title: String,
            description: Option<String>,
            drill_type: String,
            difficulty: Option<String>,
            duration_seconds: Option<i32>,
            xp_reward: i32,
            best_score: Option<i32>,
            current_streak: Option<i32>,
        }

        let drills_due = sqlx::query_as::<_, DrillDueRow>(
            r#"
            SELECT d.id, d.topic_id, d.key, d.title, d.description,
                   d.drill_type, d.difficulty, d.duration_seconds, d.xp_reward,
                   s.best_score, s.current_streak
            FROM learn_drills d
            JOIN user_drill_stats s ON s.drill_id = d.id AND s.user_id = $1
            WHERE s.last_attempt_at < NOW() - INTERVAL '3 days'
            ORDER BY s.last_attempt_at
            LIMIT 5
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        let total_due = (lessons_due.len() + drills_due.len()) as i64;

        Ok(ReviewItemsResponse {
            lessons_due: lessons_due
                .into_iter()
                .map(|l| LessonResponse {
                    id: l.id,
                    topic_id: l.topic_id,
                    key: l.key,
                    title: l.title,
                    description: l.description,
                    duration_minutes: l.duration_minutes.unwrap_or(0),
                    difficulty: l.difficulty.unwrap_or_default(),
                    xp_reward: l.xp_reward,
                    coin_reward: l.coin_reward,
                    status: "review".to_string(),
                    has_quiz: l.has_quiz.unwrap_or(false),
                    has_audio: l.has_audio.unwrap_or(false),
                })
                .collect(),
            drills_due: drills_due
                .into_iter()
                .map(|d| DrillResponse {
                    id: d.id,
                    topic_id: d.topic_id,
                    key: d.key,
                    title: d.title,
                    description: d.description,
                    drill_type: d.drill_type,
                    difficulty: d.difficulty.unwrap_or_default(),
                    duration_seconds: d.duration_seconds.unwrap_or(0),
                    xp_reward: d.xp_reward,
                    best_score: d.best_score,
                    current_streak: d.current_streak.unwrap_or(0),
                })
                .collect(),
            total_due,
        })
    }

    /// Get learning progress summary
    pub async fn get_progress_summary(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<LearnProgressSummary, AppError> {
        #[derive(FromRow)]
        struct StatsRow {
            topics_started: Option<i64>,
            lessons_completed: Option<i64>,
        }

        let stats = sqlx::query_as::<_, StatsRow>(
            r#"
            SELECT
                COUNT(DISTINCT l.topic_id) as topics_started,
                COUNT(*) FILTER (WHERE p.status = 'completed') as lessons_completed
            FROM user_lesson_progress p
            JOIN learn_lessons l ON p.lesson_id = l.id
            WHERE p.user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        let total_lessons: Option<i64> = sqlx::query_scalar("SELECT COUNT(*) FROM learn_lessons")
            .fetch_one(pool)
            .await?;

        let drills_practiced: Option<i64> = sqlx::query_scalar(
            "SELECT COUNT(DISTINCT drill_id) FROM user_drill_stats WHERE user_id = $1",
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(LearnProgressSummary {
            topics_started: stats.topics_started.unwrap_or(0),
            lessons_completed: stats.lessons_completed.unwrap_or(0),
            total_lessons: total_lessons.unwrap_or(0),
            drills_practiced: drills_practiced.unwrap_or(0),
            total_xp_earned: 0,     // Would sum from lesson/drill completions
            current_streak_days: 0, // Would calculate from daily activity
        })
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_difficulty_as_str() {
        assert_eq!(Difficulty::Beginner.as_str(), "beginner");
        assert_eq!(Difficulty::Intermediate.as_str(), "intermediate");
        assert_eq!(Difficulty::Advanced.as_str(), "advanced");
    }
}
