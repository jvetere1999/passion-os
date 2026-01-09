//! Goals tests
//!
//! Unit tests for goals: create, list, complete, progress.
//! MIGRATION: Restored during cross-feature extraction (January 2026)

#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use uuid::Uuid;

    use crate::db::gamification_repos::UserProgressRepo;
    use crate::db::habits_goals_models::{CreateGoalRequest, CreateMilestoneRequest};
    use crate::db::habits_goals_repos::GoalsRepo;

    // ========================================================================
    // TEST HELPERS
    // ========================================================================

    async fn create_test_user(pool: &PgPool) -> Uuid {
        let user_id = Uuid::new_v4();
        let email = format!("test-goals-{}@example.com", user_id);

        sqlx::query(
            r#"INSERT INTO users (id, email, name, role)
               VALUES ($1, $2, 'Test Goals User', 'user')"#,
        )
        .bind(user_id)
        .bind(&email)
        .execute(pool)
        .await
        .expect("Failed to create test user");

        // Initialize gamification progress
        UserProgressRepo::get_or_create(pool, user_id)
            .await
            .expect("Failed to init progress");

        user_id
    }

    // ========================================================================
    // CREATE TESTS
    // ========================================================================

    #[sqlx::test]
    async fn smoke_test_create_goal(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let goal = GoalsRepo::create(
            &pool,
            user_id,
            &CreateGoalRequest {
                title: "Learn Rust".to_string(),
                description: Some("Master the language".to_string()),
                category: Some("learning".to_string()),
                target_date: None,
                priority: Some(1),
            },
        )
        .await
        .expect("Failed to create goal");

        assert_eq!(goal.title, "Learn Rust");
        assert_eq!(goal.category, Some("learning".to_string()));
        assert_eq!(goal.status, "active");
        assert_eq!(goal.progress, 0);
    }

    // ========================================================================
    // LIST TESTS
    // ========================================================================

    #[sqlx::test]
    async fn smoke_test_list_goals(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        // Create two goals
        GoalsRepo::create(
            &pool,
            user_id,
            &CreateGoalRequest {
                title: "Goal 1".to_string(),
                description: None,
                category: Some("work".to_string()),
                target_date: None,
                priority: None,
            },
        )
        .await
        .expect("Failed to create goal 1");

        GoalsRepo::create(
            &pool,
            user_id,
            &CreateGoalRequest {
                title: "Goal 2".to_string(),
                description: None,
                category: Some("health".to_string()),
                target_date: None,
                priority: None,
            },
        )
        .await
        .expect("Failed to create goal 2");

        // List all goals
        let result = GoalsRepo::list(&pool, user_id, None)
            .await
            .expect("Failed to list");

        assert!(result.total >= 2);
    }

    // ========================================================================
    // GET BY ID TESTS
    // ========================================================================

    #[sqlx::test]
    async fn smoke_test_get_goal_by_id(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let goal = GoalsRepo::create(
            &pool,
            user_id,
            &CreateGoalRequest {
                title: "Find This Goal".to_string(),
                description: None,
                category: Some("personal".to_string()),
                target_date: None,
                priority: None,
            },
        )
        .await
        .expect("Failed to create");

        let found = GoalsRepo::get_by_id(&pool, goal.id, user_id)
            .await
            .expect("Failed to get")
            .expect("Goal not found");

        assert_eq!(found.title, "Find This Goal");
    }

    // ========================================================================
    // MILESTONE TESTS
    // ========================================================================

    #[sqlx::test]
    async fn smoke_test_add_milestone(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let goal = GoalsRepo::create(
            &pool,
            user_id,
            &CreateGoalRequest {
                title: "Goal With Milestones".to_string(),
                description: None,
                category: Some("work".to_string()),
                target_date: None,
                priority: None,
            },
        )
        .await
        .expect("Failed to create goal");

        let milestone = GoalsRepo::add_milestone(
            &pool,
            goal.id,
            user_id,
            &CreateMilestoneRequest {
                title: "First Step".to_string(),
                description: Some("Get started".to_string()),
            },
        )
        .await
        .expect("Failed to add milestone");

        assert_eq!(milestone.title, "First Step");
        assert!(!milestone.is_completed);
    }

    #[sqlx::test]
    async fn smoke_test_complete_milestone(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let goal = GoalsRepo::create(
            &pool,
            user_id,
            &CreateGoalRequest {
                title: "Goal For Completion".to_string(),
                description: None,
                category: Some("work".to_string()),
                target_date: None,
                priority: None,
            },
        )
        .await
        .expect("Failed to create goal");

        let milestone = GoalsRepo::add_milestone(
            &pool,
            goal.id,
            user_id,
            &CreateMilestoneRequest {
                title: "Complete This".to_string(),
                description: None,
            },
        )
        .await
        .expect("Failed to add milestone");

        let result = GoalsRepo::complete_milestone(&pool, milestone.id, user_id)
            .await
            .expect("Failed to complete milestone");

        // Verify milestone was completed
        assert!(result.milestone.is_completed);
        // Verify goal progress was updated
        assert!(result.goal_progress > 0);
    }
}
