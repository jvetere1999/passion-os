//! Platform repositories
//!
//! Database operations for Calendar, Daily Plan, Feedback, Infobase, Ideas,
//! Onboarding, and User settings.

use chrono::{NaiveDate, Utc};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use super::platform_models::*;
use crate::error::AppError;

// ============================================================================
// CALENDAR REPOSITORY
// ============================================================================

pub struct CalendarRepo;

impl CalendarRepo {
    /// List all events for a user
    pub async fn list(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<CalendarEventsListResponse, AppError> {
        let events = sqlx::query_as::<_, CalendarEvent>(
            r#"
            SELECT id, user_id, title, description, event_type,
                   start_time, end_time, all_day, timezone, location,
                   workout_id, habit_id, goal_id, recurrence_rule,
                   recurrence_end, parent_event_id, color, reminder_minutes,
                   metadata, created_at, updated_at
            FROM calendar_events
            WHERE user_id = $1
            ORDER BY start_time ASC
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        Ok(CalendarEventsListResponse {
            events: events.into_iter().map(Self::to_response).collect(),
        })
    }

    /// List events in a date range
    pub async fn list_in_range(
        pool: &PgPool,
        user_id: Uuid,
        start: chrono::DateTime<Utc>,
        end: chrono::DateTime<Utc>,
    ) -> Result<CalendarEventsListResponse, AppError> {
        let events = sqlx::query_as::<_, CalendarEvent>(
            r#"
            SELECT id, user_id, title, description, event_type,
                   start_time, end_time, all_day, timezone, location,
                   workout_id, habit_id, goal_id, recurrence_rule,
                   recurrence_end, parent_event_id, color, reminder_minutes,
                   metadata, created_at, updated_at
            FROM calendar_events
            WHERE user_id = $1
              AND start_time >= $2
              AND start_time <= $3
            ORDER BY start_time ASC
            "#,
        )
        .bind(user_id)
        .bind(start)
        .bind(end)
        .fetch_all(pool)
        .await?;

        Ok(CalendarEventsListResponse {
            events: events.into_iter().map(Self::to_response).collect(),
        })
    }

    /// Get a single event
    pub async fn get(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
    ) -> Result<CalendarEventResponse, AppError> {
        let event = sqlx::query_as::<_, CalendarEvent>(
            r#"
            SELECT id, user_id, title, description, event_type,
                   start_time, end_time, all_day, timezone, location,
                   workout_id, habit_id, goal_id, recurrence_rule,
                   recurrence_end, parent_event_id, color, reminder_minutes,
                   metadata, created_at, updated_at
            FROM calendar_events
            WHERE id = $1 AND user_id = $2
            "#,
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Calendar event not found".into()))?;

        Ok(Self::to_response(event))
    }

    /// Create a new event
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        req: &CreateCalendarEventRequest,
    ) -> Result<CalendarEventResponse, AppError> {
        let id = Uuid::new_v4();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO calendar_events (
                id, user_id, title, description, event_type,
                start_time, end_time, all_day, timezone, location,
                workout_id, habit_id, goal_id, recurrence_rule,
                recurrence_end, parent_event_id, color, reminder_minutes,
                metadata, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
            )
            "#,
        )
        .bind(id)
        .bind(user_id)
        .bind(&req.title)
        .bind(&req.description)
        .bind(&req.event_type)
        .bind(req.start_time)
        .bind(req.end_time)
        .bind(req.all_day)
        .bind(&req.timezone)
        .bind(&req.location)
        .bind(req.workout_id)
        .bind(req.habit_id)
        .bind(req.goal_id)
        .bind(&req.recurrence_rule)
        .bind(req.recurrence_end)
        .bind(req.parent_event_id)
        .bind(&req.color)
        .bind(req.reminder_minutes)
        .bind(&req.metadata)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;

        Ok(CalendarEventResponse {
            id,
            title: req.title.clone(),
            description: req.description.clone(),
            event_type: req.event_type.clone(),
            start_time: req.start_time,
            end_time: req.end_time,
            all_day: req.all_day,
            timezone: req.timezone.clone(),
            location: req.location.clone(),
            color: req.color.clone(),
            reminder_minutes: req.reminder_minutes,
            created_at: now,
            updated_at: now,
        })
    }

    /// Update an event
    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
        req: &UpdateCalendarEventRequest,
    ) -> Result<CalendarEventResponse, AppError> {
        // First check ownership
        let existing = Self::get(pool, id, user_id).await?;
        let now = Utc::now();

        let title = req.title.as_ref().unwrap_or(&existing.title);
        let description = req.description.clone().or(existing.description);
        let event_type = req.event_type.as_ref().unwrap_or(&existing.event_type);
        let start_time = req.start_time.unwrap_or(existing.start_time);
        let end_time = req.end_time.or(existing.end_time);
        let all_day = req.all_day.unwrap_or(existing.all_day);
        let timezone = req.timezone.clone().or(existing.timezone);
        let location = req.location.clone().or(existing.location);
        let color = req.color.clone().or(existing.color);
        let reminder_minutes = req.reminder_minutes.or(existing.reminder_minutes);

        sqlx::query(
            r#"
            UPDATE calendar_events
            SET title = $1, description = $2, event_type = $3,
                start_time = $4, end_time = $5, all_day = $6,
                timezone = $7, location = $8, color = $9,
                reminder_minutes = $10, metadata = $11, updated_at = $12
            WHERE id = $13 AND user_id = $14
            "#,
        )
        .bind(title)
        .bind(&description)
        .bind(event_type)
        .bind(start_time)
        .bind(end_time)
        .bind(all_day)
        .bind(&timezone)
        .bind(&location)
        .bind(&color)
        .bind(reminder_minutes)
        .bind(&req.metadata)
        .bind(now)
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

        Ok(CalendarEventResponse {
            id,
            title: title.clone(),
            description,
            event_type: event_type.clone(),
            start_time,
            end_time,
            all_day,
            timezone,
            location,
            color,
            reminder_minutes,
            created_at: existing.created_at,
            updated_at: now,
        })
    }

    /// Delete an event
    pub async fn delete(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<(), AppError> {
        let result = sqlx::query("DELETE FROM calendar_events WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(user_id)
            .execute(pool)
            .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Calendar event not found".into()));
        }

        Ok(())
    }

    fn to_response(e: CalendarEvent) -> CalendarEventResponse {
        CalendarEventResponse {
            id: e.id,
            title: e.title,
            description: e.description,
            event_type: e.event_type,
            start_time: e.start_time,
            end_time: e.end_time,
            all_day: e.all_day,
            timezone: e.timezone,
            location: e.location,
            color: e.color,
            reminder_minutes: e.reminder_minutes,
            created_at: e.created_at,
            updated_at: e.updated_at,
        }
    }
}

// ============================================================================
// DAILY PLAN REPOSITORY
// ============================================================================

pub struct DailyPlanRepo;

impl DailyPlanRepo {
    /// Get plan for a specific date
    pub async fn get_for_date(
        pool: &PgPool,
        user_id: Uuid,
        date: NaiveDate,
    ) -> Result<Option<DailyPlanResponse>, AppError> {
        let plan = sqlx::query_as::<_, DailyPlan>(
            r#"
            SELECT id, user_id, date, items, notes, created_at, updated_at
            FROM daily_plans
            WHERE user_id = $1 AND date = $2
            "#,
        )
        .bind(user_id)
        .bind(date)
        .fetch_optional(pool)
        .await?;

        Ok(plan.map(Self::to_response))
    }

    /// Create or update a plan
    pub async fn upsert(
        pool: &PgPool,
        user_id: Uuid,
        req: &UpsertDailyPlanRequest,
    ) -> Result<DailyPlanResponse, AppError> {
        let now = Utc::now();
        let items_json = serde_json::to_value(&req.items.clone().unwrap_or_default())
            .map_err(|e| AppError::Internal(e.to_string()))?;

        let items_count = req.items.as_ref().map(|v| v.len()).unwrap_or(0) as i32;
        let completed_count = req
            .items
            .as_ref()
            .map(|items| items.iter().filter(|i| i.completed).count())
            .unwrap_or(0) as i32;

        // Try update first
        let result = sqlx::query(
            r#"
            UPDATE daily_plans
            SET items = $1, notes = $2, updated_at = $3
            WHERE user_id = $4 AND date = $5
            "#,
        )
        .bind(&items_json)
        .bind(&req.notes)
        .bind(now)
        .bind(user_id)
        .bind(req.date)
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            // Insert new
            let id = Uuid::new_v4();
            sqlx::query(
                r#"
                INSERT INTO daily_plans (id, user_id, date, items, notes, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                "#,
            )
            .bind(id)
            .bind(user_id)
            .bind(req.date)
            .bind(&items_json)
            .bind(&req.notes)
            .bind(now)
            .bind(now)
            .execute(pool)
            .await?;
        }

        Ok(DailyPlanResponse {
            id: Uuid::new_v4(), // Will be overwritten if fetched
            date: req.date,
            items: req.items.clone().unwrap_or_default(),
            notes: req.notes.clone(),
            completed_count,
            total_count: items_count,
        })
    }

    /// Complete or uncomplete a plan item
    pub async fn complete_item(
        pool: &PgPool,
        user_id: Uuid,
        date: NaiveDate,
        item_id: &str,
        completed: bool,
    ) -> Result<DailyPlanResponse, AppError> {
        let plan = Self::get_for_date(pool, user_id, date)
            .await?
            .ok_or_else(|| AppError::NotFound("Daily plan not found".into()))?;

        let mut items = plan.items;
        let mut found = false;
        for item in &mut items {
            if item.id == item_id {
                item.completed = completed;
                found = true;
                break;
            }
        }

        if !found {
            return Err(AppError::NotFound("Plan item not found".into()));
        }

        let req = UpsertDailyPlanRequest {
            date,
            items: Some(items),
            notes: plan.notes,
        };

        Self::upsert(pool, user_id, &req).await
    }

    /// Generate a daily plan from user's active items
    pub async fn generate(
        pool: &PgPool,
        user_id: Uuid,
        date: NaiveDate,
    ) -> Result<DailyPlanResponse, AppError> {
        let mut items: Vec<PlanItem> = vec![];
        let mut priority = 0;

        // Add a focus session suggestion
        items.push(PlanItem {
            id: format!("plan_focus_{}", Utc::now().timestamp_millis()),
            item_type: "focus".to_string(),
            title: "Focus Session".to_string(),
            description: Some("Complete a 25-minute focus session".to_string()),
            duration: Some(25),
            action_url: "/focus".to_string(),
            completed: false,
            priority: priority,
        });
        priority += 1;

        // Get active habits
        #[derive(FromRow)]
        struct HabitRow {
            id: Uuid,
            name: String,
        }

        let habits = sqlx::query_as::<_, HabitRow>(
            r#"
            SELECT id, name FROM habits
            WHERE user_id = $1 AND is_active = true
            LIMIT 5
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        for habit in habits {
            items.push(PlanItem {
                id: format!("plan_habit_{}", habit.id),
                item_type: "habit".to_string(),
                title: habit.name,
                description: None,
                duration: None,
                action_url: "/habits".to_string(),
                completed: false,
                priority,
            });
            priority += 1;
        }

        // Get active quests
        #[derive(FromRow)]
        struct QuestRow {
            id: Uuid,
            name: String,
            description: Option<String>,
        }

        let quests = sqlx::query_as::<_, QuestRow>(
            r#"
            SELECT q.id, q.name, q.description
            FROM universal_quests q
            LEFT JOIN user_quest_progress p ON q.id = p.quest_id AND p.user_id = $1
            WHERE q.is_active = true AND (p.completed IS NULL OR p.completed = false)
            LIMIT 3
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        for quest in quests {
            items.push(PlanItem {
                id: format!("plan_quest_{}", quest.id),
                item_type: "quest".to_string(),
                title: quest.name,
                description: quest.description,
                duration: None,
                action_url: "/quests".to_string(),
                completed: false,
                priority,
            });
            priority += 1;
        }

        // Get scheduled workouts for today via calendar events
        #[derive(FromRow)]
        struct WorkoutRow {
            id: Uuid,
            title: String,
            description: Option<String>,
        }

        let workouts = sqlx::query_as::<_, WorkoutRow>(
            r#"
            SELECT ce.id, ce.title, ce.description
            FROM calendar_events ce
            WHERE ce.user_id = $1 
              AND ce.event_type = 'workout'
              AND DATE(ce.start_time) = $2
            LIMIT 2
            "#,
        )
        .bind(user_id)
        .bind(date)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        for workout in workouts {
            items.push(PlanItem {
                id: format!("plan_workout_{}", workout.id),
                item_type: "workout".to_string(),
                title: workout.title,
                description: workout.description,
                duration: None,
                action_url: "/exercise".to_string(),
                completed: false,
                priority,
            });
            priority += 1;
        }

        let req = UpsertDailyPlanRequest {
            date,
            items: Some(items.clone()),
            notes: None,
        };

        Self::upsert(pool, user_id, &req).await
    }

    fn to_response(p: DailyPlan) -> DailyPlanResponse {
        let items: Vec<PlanItem> = serde_json::from_value(p.items.clone()).unwrap_or_default();
        let completed = items.iter().filter(|i| i.completed).count() as i32;
        let total = items.len() as i32;

        DailyPlanResponse {
            id: p.id,
            date: p.date,
            items,
            notes: p.notes,
            completed_count: completed,
            total_count: total,
        }
    }
}

// ============================================================================
// FEEDBACK REPOSITORY
// ============================================================================

pub struct FeedbackRepo;

impl FeedbackRepo {
    /// List user's feedback
    pub async fn list(pool: &PgPool, user_id: Uuid) -> Result<FeedbackListResponse, AppError> {
        let feedback = sqlx::query_as::<_, Feedback>(
            r#"
            SELECT id, user_id, feedback_type, title, description,
                   status, priority, admin_response, resolved_at,
                   metadata, created_at, updated_at
            FROM feedback
            WHERE user_id = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        Ok(FeedbackListResponse {
            feedback: feedback.into_iter().map(Self::to_response).collect(),
        })
    }

    /// Create feedback
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        req: &CreateFeedbackRequest,
    ) -> Result<FeedbackResponse, AppError> {
        // Validate type
        if !["bug", "feature", "other"].contains(&req.feedback_type.as_str()) {
            return Err(AppError::Validation("Invalid feedback type".into()));
        }

        let id = Uuid::new_v4();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO feedback (id, user_id, feedback_type, title, description, priority, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#
        )
        .bind(id)
        .bind(user_id)
        .bind(&req.feedback_type)
        .bind(&req.title)
        .bind(&req.description)
        .bind(&req.priority)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;

        Ok(FeedbackResponse {
            id,
            feedback_type: req.feedback_type.clone(),
            title: req.title.clone(),
            description: req.description.clone(),
            status: "open".to_string(),
            priority: req.priority.clone(),
            admin_response: None,
            created_at: now,
        })
    }

    fn to_response(f: Feedback) -> FeedbackResponse {
        FeedbackResponse {
            id: f.id,
            feedback_type: f.feedback_type,
            title: f.title,
            description: f.description,
            status: f.status,
            priority: f.priority,
            admin_response: f.admin_response,
            created_at: f.created_at,
        }
    }
}

// ============================================================================
// INFOBASE REPOSITORY
// ============================================================================

pub struct InfobaseRepo;

impl InfobaseRepo {
    /// List entries, optionally filtered
    pub async fn list(
        pool: &PgPool,
        user_id: Uuid,
        category: Option<&str>,
        search: Option<&str>,
    ) -> Result<InfobaseListResponse, AppError> {
        let entries = if let Some(search_term) = search {
            let pattern = format!("%{}%", search_term);
            sqlx::query_as::<_, InfobaseEntry>(
                r#"
                SELECT id, user_id, title, content, category, tags, created_at, updated_at
                FROM infobase_entries
                WHERE user_id = $1 AND (title ILIKE $2 OR content ILIKE $2)
                ORDER BY updated_at DESC
                "#,
            )
            .bind(user_id)
            .bind(&pattern)
            .fetch_all(pool)
            .await?
        } else if let Some(cat) = category {
            if cat != "All Entries" {
                sqlx::query_as::<_, InfobaseEntry>(
                    r#"
                    SELECT id, user_id, title, content, category, tags, created_at, updated_at
                    FROM infobase_entries
                    WHERE user_id = $1 AND category = $2
                    ORDER BY updated_at DESC
                    "#,
                )
                .bind(user_id)
                .bind(cat)
                .fetch_all(pool)
                .await?
            } else {
                sqlx::query_as::<_, InfobaseEntry>(
                    r#"
                    SELECT id, user_id, title, content, category, tags, created_at, updated_at
                    FROM infobase_entries
                    WHERE user_id = $1
                    ORDER BY updated_at DESC
                    "#,
                )
                .bind(user_id)
                .fetch_all(pool)
                .await?
            }
        } else {
            sqlx::query_as::<_, InfobaseEntry>(
                r#"
                SELECT id, user_id, title, content, category, tags, created_at, updated_at
                FROM infobase_entries
                WHERE user_id = $1
                ORDER BY updated_at DESC
                "#,
            )
            .bind(user_id)
            .fetch_all(pool)
            .await?
        };

        Ok(InfobaseListResponse {
            entries: entries.into_iter().map(Self::to_response).collect(),
        })
    }

    /// Get a single entry
    pub async fn get(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
    ) -> Result<InfobaseEntryResponse, AppError> {
        let entry = sqlx::query_as::<_, InfobaseEntry>(
            r#"
            SELECT id, user_id, title, content, category, tags, created_at, updated_at
            FROM infobase_entries
            WHERE id = $1 AND user_id = $2
            "#,
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Infobase entry not found".into()))?;

        Ok(Self::to_response(entry))
    }

    /// Create entry
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        req: &CreateInfobaseEntryRequest,
    ) -> Result<InfobaseEntryResponse, AppError> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let tags_json = req
            .tags
            .as_ref()
            .map(|t| serde_json::to_value(t).ok())
            .flatten();

        sqlx::query(
            r#"
            INSERT INTO infobase_entries (id, user_id, title, content, category, tags, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#
        )
        .bind(id)
        .bind(user_id)
        .bind(&req.title)
        .bind(&req.content)
        .bind(&req.category)
        .bind(&tags_json)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;

        Ok(InfobaseEntryResponse {
            id,
            title: req.title.clone(),
            content: req.content.clone(),
            category: req.category.clone(),
            tags: req.tags.clone().unwrap_or_default(),
            created_at: now,
            updated_at: now,
        })
    }

    /// Update entry
    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
        req: &UpdateInfobaseEntryRequest,
    ) -> Result<InfobaseEntryResponse, AppError> {
        let existing = Self::get(pool, id, user_id).await?;
        let now = Utc::now();

        let title = req.title.as_ref().unwrap_or(&existing.title);
        let content = req.content.as_ref().unwrap_or(&existing.content);
        let category = req.category.as_ref().unwrap_or(&existing.category);
        let tags = req.tags.clone().unwrap_or(existing.tags.clone());
        let tags_json = serde_json::to_value(&tags).ok();

        sqlx::query(
            r#"
            UPDATE infobase_entries
            SET title = $1, content = $2, category = $3, tags = $4, updated_at = $5
            WHERE id = $6 AND user_id = $7
            "#,
        )
        .bind(title)
        .bind(content)
        .bind(category)
        .bind(&tags_json)
        .bind(now)
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

        Ok(InfobaseEntryResponse {
            id,
            title: title.clone(),
            content: content.clone(),
            category: category.clone(),
            tags,
            created_at: existing.created_at,
            updated_at: now,
        })
    }

    /// Delete entry
    pub async fn delete(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<(), AppError> {
        let result = sqlx::query("DELETE FROM infobase_entries WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(user_id)
            .execute(pool)
            .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Infobase entry not found".into()));
        }

        Ok(())
    }

    /// Sync multiple entries (batch upsert)
    pub async fn sync(
        pool: &PgPool,
        user_id: Uuid,
        entries: Vec<CreateInfobaseEntryRequest>,
    ) -> Result<i32, AppError> {
        let mut count = 0;
        for entry in entries {
            Self::create(pool, user_id, &entry).await?;
            count += 1;
        }
        Ok(count)
    }

    fn to_response(e: InfobaseEntry) -> InfobaseEntryResponse {
        let tags: Vec<String> = e
            .tags
            .and_then(|t| serde_json::from_value(t).ok())
            .unwrap_or_default();

        InfobaseEntryResponse {
            id: e.id,
            title: e.title,
            content: e.content,
            category: e.category,
            tags,
            created_at: e.created_at,
            updated_at: e.updated_at,
        }
    }
}

// ============================================================================
// IDEAS REPOSITORY
// ============================================================================

pub struct IdeasRepo;

impl IdeasRepo {
    /// List ideas
    pub async fn list(pool: &PgPool, user_id: Uuid) -> Result<IdeasListResponse, AppError> {
        let ideas = sqlx::query_as::<_, Idea>(
            r#"
            SELECT id, user_id, title, content, category, tags, is_pinned, created_at, updated_at
            FROM ideas
            WHERE user_id = $1
            ORDER BY is_pinned DESC, created_at DESC
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        Ok(IdeasListResponse {
            ideas: ideas.into_iter().map(Self::to_response).collect(),
        })
    }

    /// Get a single idea
    pub async fn get(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<IdeaResponse, AppError> {
        let idea = sqlx::query_as::<_, Idea>(
            r#"
            SELECT id, user_id, title, content, category, tags, is_pinned, created_at, updated_at
            FROM ideas
            WHERE id = $1 AND user_id = $2
            "#,
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Idea not found".into()))?;

        Ok(Self::to_response(idea))
    }

    /// Create idea
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        req: &CreateIdeaRequest,
    ) -> Result<IdeaResponse, AppError> {
        let id = Uuid::new_v4();
        let now = Utc::now();

        // Build content from various inputs
        let mut content = req.content.clone().unwrap_or_default();
        if let Some(key) = &req.key {
            content.push_str(&format!("\nKey: {}", key));
        }
        if let Some(bpm) = req.bpm {
            content.push_str(&format!("\nBPM: {}", bpm));
        }
        if let Some(mood) = &req.mood {
            content.push_str(&format!("\nMood: {}", mood));
        }
        let content = if content.trim().is_empty() {
            None
        } else {
            Some(content.trim().to_string())
        };

        let mut tags = req.tags.clone().unwrap_or_default();
        if let Some(mood) = &req.mood {
            if !tags.contains(mood) {
                tags.push(mood.clone());
            }
        }
        let tags_json = if tags.is_empty() {
            None
        } else {
            serde_json::to_value(&tags).ok()
        };

        sqlx::query(
            r#"
            INSERT INTO ideas (id, user_id, title, content, category, tags, is_pinned, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8)
            "#
        )
        .bind(id)
        .bind(user_id)
        .bind(&req.title)
        .bind(&content)
        .bind(&req.category)
        .bind(&tags_json)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;

        Ok(IdeaResponse {
            id,
            title: req.title.clone(),
            content,
            category: req.category.clone(),
            tags,
            is_pinned: false,
            created_at: now,
            updated_at: now,
        })
    }

    /// Update idea
    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        user_id: Uuid,
        req: &UpdateIdeaRequest,
    ) -> Result<IdeaResponse, AppError> {
        let existing = Self::get(pool, id, user_id).await?;
        let now = Utc::now();

        let title = req.title.as_ref().unwrap_or(&existing.title);
        let content = req.content.clone().or(existing.content);
        let category = req.category.as_ref().unwrap_or(&existing.category);
        let is_pinned = req.is_pinned.unwrap_or(existing.is_pinned);
        let tags = req.tags.clone().unwrap_or(existing.tags.clone());
        let tags_json = if tags.is_empty() {
            None
        } else {
            serde_json::to_value(&tags).ok()
        };

        sqlx::query(
            r#"
            UPDATE ideas
            SET title = $1, content = $2, category = $3, tags = $4, is_pinned = $5, updated_at = $6
            WHERE id = $7 AND user_id = $8
            "#,
        )
        .bind(title)
        .bind(&content)
        .bind(category)
        .bind(&tags_json)
        .bind(is_pinned)
        .bind(now)
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

        Ok(IdeaResponse {
            id,
            title: title.clone(),
            content,
            category: category.clone(),
            tags,
            is_pinned,
            created_at: existing.created_at,
            updated_at: now,
        })
    }

    /// Delete idea
    pub async fn delete(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<(), AppError> {
        let result = sqlx::query("DELETE FROM ideas WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(user_id)
            .execute(pool)
            .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Idea not found".into()));
        }

        Ok(())
    }

    fn to_response(i: Idea) -> IdeaResponse {
        let tags: Vec<String> = i
            .tags
            .and_then(|t| serde_json::from_value(t).ok())
            .unwrap_or_default();

        IdeaResponse {
            id: i.id,
            title: i.title,
            content: i.content,
            category: i.category,
            tags,
            is_pinned: i.is_pinned,
            created_at: i.created_at,
            updated_at: i.updated_at,
        }
    }
}

// ============================================================================
// ONBOARDING REPOSITORY
// ============================================================================

pub struct OnboardingRepo;

impl OnboardingRepo {
    /// Get active flow
    pub async fn get_active_flow(pool: &PgPool) -> Result<Option<OnboardingFlow>, AppError> {
        let flow = sqlx::query_as::<_, OnboardingFlow>(
            r#"
            SELECT id, name, description, is_active, total_steps, created_at, updated_at
            FROM onboarding_flows
            WHERE is_active = true
            LIMIT 1
            "#,
        )
        .fetch_optional(pool)
        .await?;

        Ok(flow)
    }

    /// Get flow steps
    pub async fn get_flow_steps(
        pool: &PgPool,
        flow_id: Uuid,
    ) -> Result<Vec<OnboardingStep>, AppError> {
        let steps = sqlx::query_as::<_, OnboardingStep>(
            r#"
            SELECT id, flow_id, step_order, step_type, title, description,
                   target_selector, target_route, fallback_content, options,
                   allows_multiple, required, action_type, action_config,
                   created_at, updated_at
            FROM onboarding_steps
            WHERE flow_id = $1
            ORDER BY step_order ASC
            "#,
        )
        .bind(flow_id)
        .fetch_all(pool)
        .await?;

        Ok(steps)
    }

    /// Get step by ID
    pub async fn get_step(
        pool: &PgPool,
        step_id: Uuid,
    ) -> Result<Option<OnboardingStep>, AppError> {
        let step = sqlx::query_as::<_, OnboardingStep>(
            r#"
            SELECT id, flow_id, step_order, step_type, title, description,
                   target_selector, target_route, fallback_content, options,
                   allows_multiple, required, action_type, action_config,
                   created_at, updated_at
            FROM onboarding_steps
            WHERE id = $1
            "#,
        )
        .bind(step_id)
        .fetch_optional(pool)
        .await?;

        Ok(step)
    }

    /// Get user onboarding state
    pub async fn get_user_state(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<Option<UserOnboardingState>, AppError> {
        let state = sqlx::query_as::<_, UserOnboardingState>(
            r#"
            SELECT id, user_id, flow_id, current_step_id, status,
                   can_resume, started_at, completed_at, skipped_at,
                   created_at, updated_at
            FROM user_onboarding_state
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(state)
    }

    /// Check if user needs onboarding
    pub async fn needs_onboarding(pool: &PgPool, user_id: Uuid) -> Result<bool, AppError> {
        let state = Self::get_user_state(pool, user_id).await?;

        match state {
            None => Ok(true),
            Some(s) => Ok(s.status == "not_started" || (s.status == "in_progress" && s.can_resume)),
        }
    }

    /// Get onboarding progress
    pub async fn get_progress(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<OnboardingProgress, AppError> {
        let state = Self::get_user_state(pool, user_id).await?;

        let Some(_state) = state else {
            return Ok(OnboardingProgress {
                completed_steps: 0,
                total_steps: 0,
                percent_complete: 0,
            });
        };

        let flow = Self::get_active_flow(pool).await?;
        let total = flow.map(|f| f.total_steps).unwrap_or(0);

        // Count completed steps
        #[derive(FromRow)]
        struct CountRow {
            count: i64,
        }

        let completed = sqlx::query_as::<_, CountRow>(
            "SELECT COUNT(*) as count FROM user_onboarding_responses WHERE user_id = $1",
        )
        .bind(user_id)
        .fetch_one(pool)
        .await
        .map(|r| r.count as i32)
        .unwrap_or(0);

        let percent = if total > 0 {
            (completed * 100) / total
        } else {
            0
        };

        Ok(OnboardingProgress {
            completed_steps: completed,
            total_steps: total,
            percent_complete: percent,
        })
    }

    /// Start onboarding
    pub async fn start(pool: &PgPool, user_id: Uuid) -> Result<StartOnboardingResponse, AppError> {
        let flow = Self::get_active_flow(pool)
            .await?
            .ok_or_else(|| AppError::Internal("No active onboarding flow".into()))?;

        let steps = Self::get_flow_steps(pool, flow.id).await?;
        let first_step = steps.first().cloned();

        let now = Utc::now();
        let id = Uuid::new_v4();

        // Create or update state
        sqlx::query(
            r#"
            INSERT INTO user_onboarding_state (id, user_id, flow_id, current_step_id, status, started_at, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 'in_progress', $5, $5, $5)
            ON CONFLICT (user_id) DO UPDATE
            SET status = 'in_progress', current_step_id = $4, started_at = COALESCE(user_onboarding_state.started_at, $5), updated_at = $5
            "#
        )
        .bind(id)
        .bind(user_id)
        .bind(flow.id)
        .bind(first_step.as_ref().map(|s| s.id))
        .bind(now)
        .execute(pool)
        .await?;

        Ok(StartOnboardingResponse {
            success: true,
            state: OnboardingStateResponse {
                status: "in_progress".to_string(),
                started_at: Some(now),
                completed_at: None,
                skipped_at: None,
                can_resume: true,
            },
            current_step: first_step.map(Self::step_to_response),
        })
    }

    /// Complete a step
    pub async fn complete_step(
        pool: &PgPool,
        user_id: Uuid,
        step_id: Uuid,
        response: Option<serde_json::Value>,
    ) -> Result<CompleteStepResponse, AppError> {
        let now = Utc::now();

        // Store response
        let resp_id = Uuid::new_v4();
        let response_json = response.unwrap_or(serde_json::json!({}));

        sqlx::query(
            r#"
            INSERT INTO user_onboarding_responses (id, user_id, step_id, response, created_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, step_id) DO UPDATE SET response = $4
            "#,
        )
        .bind(resp_id)
        .bind(user_id)
        .bind(step_id)
        .bind(&response_json)
        .bind(now)
        .execute(pool)
        .await?;

        // Get current step to find next
        let step = Self::get_step(pool, step_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Step not found".into()))?;

        // Get next step
        let next_step = sqlx::query_as::<_, OnboardingStep>(
            r#"
            SELECT id, flow_id, step_order, step_type, title, description,
                   target_selector, target_route, fallback_content, options,
                   allows_multiple, required, action_type, action_config,
                   created_at, updated_at
            FROM onboarding_steps
            WHERE flow_id = $1 AND step_order > $2
            ORDER BY step_order ASC
            LIMIT 1
            "#,
        )
        .bind(step.flow_id)
        .bind(step.step_order)
        .fetch_optional(pool)
        .await?;

        let completed = next_step.is_none();

        // Update state
        if completed {
            sqlx::query(
                r#"
                UPDATE user_onboarding_state
                SET status = 'completed', completed_at = $1, current_step_id = NULL, updated_at = $1
                WHERE user_id = $2
                "#,
            )
            .bind(now)
            .bind(user_id)
            .execute(pool)
            .await?;
        } else {
            sqlx::query(
                r#"
                UPDATE user_onboarding_state
                SET current_step_id = $1, updated_at = $2
                WHERE user_id = $3
                "#,
            )
            .bind(next_step.as_ref().map(|s| s.id))
            .bind(now)
            .bind(user_id)
            .execute(pool)
            .await?;
        }

        Ok(CompleteStepResponse {
            success: true,
            completed,
            next_step: next_step.map(Self::step_to_response),
        })
    }

    /// Skip onboarding
    pub async fn skip(pool: &PgPool, user_id: Uuid) -> Result<SkipOnboardingResponse, AppError> {
        let now = Utc::now();
        let soft_landing_until = now + chrono::Duration::hours(1);

        sqlx::query(
            r#"
            UPDATE user_onboarding_state
            SET status = 'skipped', skipped_at = $1, updated_at = $1
            WHERE user_id = $2
            "#,
        )
        .bind(now)
        .bind(user_id)
        .execute(pool)
        .await?;

        // Update user settings with soft landing
        sqlx::query(
            r#"
            INSERT INTO user_settings (id, user_id, soft_landing_until, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $4)
            ON CONFLICT (user_id) DO UPDATE SET soft_landing_until = $3, updated_at = $4
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(soft_landing_until)
        .bind(now)
        .execute(pool)
        .await?;

        Ok(SkipOnboardingResponse {
            success: true,
            message: "Onboarding skipped. You can resume from Settings anytime.".to_string(),
            soft_landing_until: Some(soft_landing_until),
        })
    }

    /// Reset onboarding
    pub async fn reset(pool: &PgPool, user_id: Uuid) -> Result<(), AppError> {
        let now = Utc::now();
        let flow = Self::get_active_flow(pool)
            .await?
            .ok_or_else(|| AppError::Internal("No active onboarding flow".into()))?;

        // Delete responses
        sqlx::query("DELETE FROM user_onboarding_responses WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await?;

        // Reset state
        sqlx::query(
            r#"
            INSERT INTO user_onboarding_state (id, user_id, flow_id, status, can_resume, created_at, updated_at)
            VALUES ($1, $2, $3, 'not_started', true, $4, $4)
            ON CONFLICT (user_id) DO UPDATE
            SET status = 'not_started', current_step_id = NULL, started_at = NULL, 
                completed_at = NULL, skipped_at = NULL, can_resume = true, updated_at = $4
            "#
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(flow.id)
        .bind(now)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Get full onboarding response
    pub async fn get_full_state(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<OnboardingResponse, AppError> {
        let state = Self::get_user_state(pool, user_id).await?;
        let needs = Self::needs_onboarding(pool, user_id).await?;
        let progress = Self::get_progress(pool, user_id).await?;

        let flow = Self::get_active_flow(pool).await?;
        let steps = if let Some(ref f) = flow {
            Self::get_flow_steps(pool, f.id).await?
        } else {
            vec![]
        };

        let current_step = if let Some(ref s) = state {
            if let Some(step_id) = s.current_step_id {
                Self::get_step(pool, step_id).await?
            } else {
                None
            }
        } else {
            None
        };

        Ok(OnboardingResponse {
            needs_onboarding: needs,
            state: state.map(|s| OnboardingStateResponse {
                status: s.status,
                started_at: s.started_at,
                completed_at: s.completed_at,
                skipped_at: s.skipped_at,
                can_resume: s.can_resume,
            }),
            progress,
            flow: flow.map(|f| OnboardingFlowResponse {
                id: f.id,
                name: f.name,
                total_steps: f.total_steps,
            }),
            current_step: current_step.map(Self::step_to_response),
            all_steps: steps
                .into_iter()
                .map(|s| OnboardingStepSummary {
                    id: s.id,
                    order: s.step_order,
                    step_type: s.step_type,
                    title: s.title,
                })
                .collect(),
        })
    }

    fn step_to_response(s: OnboardingStep) -> OnboardingStepResponse {
        OnboardingStepResponse {
            id: s.id,
            order: s.step_order,
            step_type: s.step_type,
            title: s.title,
            description: s.description,
            target_selector: s.target_selector,
            target_route: s.target_route,
            fallback_content: s.fallback_content,
            options: s.options,
            allows_multiple: s.allows_multiple,
            required: s.required,
            action_type: s.action_type,
            action_config: s.action_config,
        }
    }
}

// ============================================================================
// USER SETTINGS REPOSITORY
// ============================================================================

pub struct UserSettingsRepo;

impl UserSettingsRepo {
    /// Get user settings
    pub async fn get(pool: &PgPool, user_id: Uuid) -> Result<UserSettingsResponse, AppError> {
        let settings = sqlx::query_as::<_, UserSettings>(
            r#"
            SELECT id, user_id, notifications_enabled, email_notifications,
                   push_notifications, timezone, locale, profile_public,
                   show_activity, soft_landing_until, daily_reminder_time,
                   created_at, updated_at
            FROM user_settings
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        // Fetch theme from users table
        let theme = sqlx::query_scalar::<_, String>("SELECT theme FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_optional(pool)
            .await?
            .unwrap_or_else(|| "light".to_string());

        match settings {
            Some(s) => Ok(Self::to_response(s, theme)),
            None => Ok(UserSettingsResponse {
                notifications_enabled: true,
                email_notifications: true,
                push_notifications: false,
                theme,
                timezone: None,
                locale: "en".to_string(),
                profile_public: false,
                show_activity: true,
                daily_reminder_time: None,
            }),
        }
    }

    /// Update settings
    pub async fn update(
        pool: &PgPool,
        user_id: Uuid,
        req: &UpdateUserSettingsRequest,
    ) -> Result<UserSettingsResponse, AppError> {
        let existing = Self::get(pool, user_id).await?;
        let now = Utc::now();

        let notifications_enabled = req
            .notifications_enabled
            .unwrap_or(existing.notifications_enabled);
        let email_notifications = req
            .email_notifications
            .unwrap_or(existing.email_notifications);
        let push_notifications = req
            .push_notifications
            .unwrap_or(existing.push_notifications);
        let timezone = req.timezone.clone().or(existing.timezone);
        let locale = req.locale.as_ref().unwrap_or(&existing.locale);
        let profile_public = req.profile_public.unwrap_or(existing.profile_public);
        let show_activity = req.show_activity.unwrap_or(existing.show_activity);
        let daily_reminder_time = req
            .daily_reminder_time
            .clone()
            .or(existing.daily_reminder_time);

        sqlx::query(
            r#"
            INSERT INTO user_settings (
                id, user_id, notifications_enabled, email_notifications,
                push_notifications, timezone, locale, profile_public,
                show_activity, daily_reminder_time, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
            ON CONFLICT (user_id) DO UPDATE SET
                notifications_enabled = $3, email_notifications = $4,
                push_notifications = $5, timezone = $6, locale = $7,
                profile_public = $8, show_activity = $9, daily_reminder_time = $10,
                updated_at = $11
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(notifications_enabled)
        .bind(email_notifications)
        .bind(push_notifications)
        .bind(&timezone)
        .bind(locale)
        .bind(profile_public)
        .bind(show_activity)
        .bind(&daily_reminder_time)
        .bind(now)
        .execute(pool)
        .await?;

        // Fetch theme from users table
        let theme = sqlx::query_scalar::<_, String>("SELECT theme FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_optional(pool)
            .await?
            .unwrap_or_else(|| "light".to_string());

        Ok(UserSettingsResponse {
            notifications_enabled,
            email_notifications,
            push_notifications,
            theme,
            timezone,
            locale: locale.clone(),
            profile_public,
            show_activity,
            daily_reminder_time,
        })
    }

    fn to_response(s: UserSettings, theme: String) -> UserSettingsResponse {
        UserSettingsResponse {
            notifications_enabled: s.notifications_enabled,
            email_notifications: s.email_notifications,
            push_notifications: s.push_notifications,
            theme,
            timezone: s.timezone,
            locale: s.locale,
            profile_public: s.profile_public,
            show_activity: s.show_activity,
            daily_reminder_time: s.daily_reminder_time,
        }
    }
}

// ============================================================================
// USER ACCOUNT REPOSITORY
// ============================================================================

pub struct UserAccountRepo;

impl UserAccountRepo {
    /// Delete all user data
    pub async fn delete_account(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<DeleteAccountResponse, AppError> {
        // Delete from all tables in order (respecting foreign keys)
        // The users table has ON DELETE CASCADE on most child tables
        sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(user_id)
            .execute(pool)
            .await?;

        Ok(DeleteAccountResponse {
            success: true,
            message: "Account and all associated data deleted successfully".to_string(),
        })
    }

    /// Export all user data
    pub async fn export_data(
        pool: &PgPool,
        user_id: Uuid,
        email: Option<String>,
    ) -> Result<ExportDataResponse, AppError> {
        let now = Utc::now();
        let mut data = serde_json::Map::new();

        // Helper macro for fetching table data
        macro_rules! fetch_table {
            ($pool:expr, $user_id:expr, $table:expr) => {{
                let result: Result<Vec<serde_json::Value>, _> = sqlx::query_scalar(&format!(
                    "SELECT row_to_json(t) FROM {} t WHERE user_id = $1",
                    $table
                ))
                .bind($user_id)
                .fetch_all($pool)
                .await;
                result.unwrap_or_default()
            }};
        }

        // Fetch data from each table
        data.insert(
            "calendar_events".to_string(),
            serde_json::to_value(fetch_table!(pool, user_id, "calendar_events"))
                .unwrap_or_default(),
        );
        data.insert(
            "daily_plans".to_string(),
            serde_json::to_value(fetch_table!(pool, user_id, "daily_plans")).unwrap_or_default(),
        );
        data.insert(
            "feedback".to_string(),
            serde_json::to_value(fetch_table!(pool, user_id, "feedback")).unwrap_or_default(),
        );
        data.insert(
            "infobase_entries".to_string(),
            serde_json::to_value(fetch_table!(pool, user_id, "infobase_entries"))
                .unwrap_or_default(),
        );
        data.insert(
            "ideas".to_string(),
            serde_json::to_value(fetch_table!(pool, user_id, "ideas")).unwrap_or_default(),
        );
        data.insert(
            "habits".to_string(),
            serde_json::to_value(fetch_table!(pool, user_id, "habits")).unwrap_or_default(),
        );
        data.insert(
            "goals".to_string(),
            serde_json::to_value(fetch_table!(pool, user_id, "goals")).unwrap_or_default(),
        );
        data.insert(
            "focus_sessions".to_string(),
            serde_json::to_value(fetch_table!(pool, user_id, "focus_sessions")).unwrap_or_default(),
        );
        data.insert(
            "user_settings".to_string(),
            serde_json::to_value(fetch_table!(pool, user_id, "user_settings")).unwrap_or_default(),
        );
        data.insert(
            "user_interests".to_string(),
            serde_json::to_value(fetch_table!(pool, user_id, "user_interests")).unwrap_or_default(),
        );

        Ok(ExportDataResponse {
            exported_at: now,
            user_id,
            email,
            data: serde_json::Value::Object(data),
        })
    }
}
