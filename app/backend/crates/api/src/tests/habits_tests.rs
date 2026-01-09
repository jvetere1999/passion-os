//! Habits tests
//!
//! Unit tests for habit tracking: create, complete, streak tracking, XP awards.

#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use uuid::Uuid;

    use crate::db::gamification_repos::UserProgressRepo;
    use crate::db::habits_goals_models::CreateHabitRequest;
    use crate::db::habits_goals_repos::HabitsRepo;

    // ========================================================================
    // TEST HELPERS
    // ========================================================================

    async fn create_test_user(pool: &PgPool) -> Uuid {
        let user_id = Uuid::new_v4();
        let email = format!("test-habits-{}@example.com", user_id);

        sqlx::query(
            r#"INSERT INTO users (id, email, name, role)
               VALUES ($1, $2, 'Test Habits User', 'user')"#,
        )
        .bind(user_id)
        .bind(&email)
        .execute(pool)
        .await
        .expect("Failed to create test user");

        // Initialize gamification progress (required for point awards)
        UserProgressRepo::get_or_create(pool, user_id)
            .await
            .expect("Failed to init progress");

        user_id
    }

    // ========================================================================
    // CREATE TESTS
    // ========================================================================

    #[sqlx::test]
    async fn test_create_habit(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let habit = HabitsRepo::create(
            &pool,
            user_id,
            &CreateHabitRequest {
                name: "Morning Meditation".to_string(),
                description: Some("10 minutes of calm".to_string()),
                frequency: "daily".to_string(),
                target_count: 1,
                custom_days: None,
                icon: Some("🧘".to_string()),
                color: Some("#8B5CF6".to_string()),
            },
        )
        .await
        .expect("Failed to create habit");

        assert_eq!(habit.name, "Morning Meditation");
        assert_eq!(habit.frequency, "daily");
        assert!(habit.is_active);
        assert_eq!(habit.current_streak, 0);
    }

    // ========================================================================
    // LIST TESTS
    // ========================================================================

    #[sqlx::test]
    async fn test_list_active_habits(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        // Create two habits
        HabitsRepo::create(
            &pool,
            user_id,
            &CreateHabitRequest {
                name: "Habit 1".to_string(),
                description: None,
                frequency: "daily".to_string(),
                target_count: 1,
                custom_days: None,
                icon: None,
                color: None,
            },
        )
        .await
        .expect("Failed to create habit 1");

        HabitsRepo::create(
            &pool,
            user_id,
            &CreateHabitRequest {
                name: "Habit 2".to_string(),
                description: None,
                frequency: "weekly".to_string(),
                target_count: 3,
                custom_days: None,
                icon: None,
                color: None,
            },
        )
        .await
        .expect("Failed to create habit 2");

        // List
        let list = HabitsRepo::list_active(&pool, user_id)
            .await
            .expect("Failed to list");

        assert_eq!(list.habits.len(), 2);
    }

    // ========================================================================
    // COMPLETE TESTS
    // ========================================================================

    #[sqlx::test]
    async fn test_complete_habit_awards_xp(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let habit = HabitsRepo::create(
            &pool,
            user_id,
            &CreateHabitRequest {
                name: "Exercise".to_string(),
                description: None,
                frequency: "daily".to_string(),
                target_count: 1,
                custom_days: None,
                icon: None,
                color: None,
            },
        )
        .await
        .expect("Failed to create habit");

        let result = HabitsRepo::complete_habit(&pool, habit.id, user_id, None)
            .await
            .expect("Failed to complete");

        assert!(result.habit.completed_today);
        assert_eq!(result.new_streak, 1);
        assert!(result.xp_awarded >= 5); // At least base XP
    }

    #[sqlx::test]
    async fn test_complete_habit_idempotent_same_day(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let habit = HabitsRepo::create(
            &pool,
            user_id,
            &CreateHabitRequest {
                name: "Read".to_string(),
                description: None,
                frequency: "daily".to_string(),
                target_count: 1,
                custom_days: None,
                icon: None,
                color: None,
            },
        )
        .await
        .expect("Failed to create habit");

        // Complete once
        let result1 = HabitsRepo::complete_habit(&pool, habit.id, user_id, None)
            .await
            .expect("Failed to complete");

        assert!(result1.xp_awarded >= 5);

        // Complete again same day - should be idempotent (no XP)
        let result2 = HabitsRepo::complete_habit(&pool, habit.id, user_id, None)
            .await
            .expect("Failed to complete again");

        assert_eq!(result2.xp_awarded, 0);
        assert!(result2.habit.completed_today);
    }

    // ========================================================================
    // STREAK TESTS
    // ========================================================================

    #[sqlx::test]
    async fn test_habit_streak_builds(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let habit = HabitsRepo::create(
            &pool,
            user_id,
            &CreateHabitRequest {
                name: "Streak Test".to_string(),
                description: None,
                frequency: "daily".to_string(),
                target_count: 1,
                custom_days: None,
                icon: None,
                color: None,
            },
        )
        .await
        .expect("Failed to create habit");

        // First completion
        let result = HabitsRepo::complete_habit(&pool, habit.id, user_id, None)
            .await
            .expect("Failed to complete");

        assert_eq!(result.new_streak, 1);
    }

    // ========================================================================
    // GET BY ID TESTS
    // ========================================================================

    #[sqlx::test]
    async fn test_get_habit_by_id(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let habit = HabitsRepo::create(
            &pool,
            user_id,
            &CreateHabitRequest {
                name: "Find Me".to_string(),
                description: Some("Searchable".to_string()),
                frequency: "daily".to_string(),
                target_count: 1,
                custom_days: None,
                icon: None,
                color: None,
            },
        )
        .await
        .expect("Failed to create");

        let found = HabitsRepo::get_by_id(&pool, habit.id, user_id)
            .await
            .expect("Failed to get")
            .expect("Habit not found");

        assert_eq!(found.name, "Find Me");
    }

    #[sqlx::test]
    async fn test_get_habit_by_id_wrong_user(pool: PgPool) {
        let user_id = create_test_user(&pool).await;
        let other_user_id = create_test_user(&pool).await;

        let habit = HabitsRepo::create(
            &pool,
            user_id,
            &CreateHabitRequest {
                name: "Private".to_string(),
                description: None,
                frequency: "daily".to_string(),
                target_count: 1,
                custom_days: None,
                icon: None,
                color: None,
            },
        )
        .await
        .expect("Failed to create");

        // Other user can't access
        let found = HabitsRepo::get_by_id(&pool, habit.id, other_user_id)
            .await
            .expect("Failed to get");

        assert!(found.is_none());
    }
}
