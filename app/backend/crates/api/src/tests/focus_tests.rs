//! Focus session smoke tests
//!
//! Basic smoke tests for focus session CRUD operations.
//! MIGRATION: Added during cross-feature extraction (January 2026)

#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use uuid::Uuid;

    use crate::db::focus_models::CreateFocusRequest;
    use crate::db::focus_repos::FocusSessionRepo;
    use crate::db::gamification_repos::UserProgressRepo;

    // ========================================================================
    // TEST HELPERS
    // ========================================================================

    async fn create_test_user(pool: &PgPool) -> Uuid {
        let user_id = Uuid::new_v4();
        let email = format!("test-focus-{}@example.com", user_id);

        sqlx::query(
            r#"INSERT INTO users (id, email, name, role)
               VALUES ($1, $2, 'Test Focus User', 'user')"#,
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
    // SMOKE TESTS
    // ========================================================================

    #[sqlx::test]
    async fn smoke_test_start_session(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let session = FocusSessionRepo::start_session(
            &pool,
            user_id,
            &CreateFocusRequest {
                mode: "focus".to_string(),
                duration_seconds: 1500, // 25 minutes
                task_id: None,
                task_title: Some("Test session".to_string()),
            },
        )
        .await
        .expect("Failed to start focus session");

        assert_eq!(session.duration_seconds, 1500);
        assert_eq!(session.status, "active");
        assert_eq!(session.task_title, Some("Test session".to_string()));
    }

    #[sqlx::test]
    async fn smoke_test_list_sessions(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        // Start a session first
        FocusSessionRepo::start_session(
            &pool,
            user_id,
            &CreateFocusRequest {
                mode: "focus".to_string(),
                duration_seconds: 1500,
                task_id: None,
                task_title: Some("List test".to_string()),
            },
        )
        .await
        .expect("Failed to start session");

        // List sessions
        let list_result = FocusSessionRepo::list_sessions(&pool, user_id, 1, 20)
            .await
            .expect("Failed to list sessions");

        assert!(list_result.total >= 1);
        assert!(!list_result.sessions.is_empty());
    }

    #[sqlx::test]
    async fn smoke_test_get_active_session(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        // Initially no active session
        let active = FocusSessionRepo::get_active_session(&pool, user_id)
            .await
            .expect("Failed to check active session");
        assert!(active.is_none());

        // Start an active session
        FocusSessionRepo::start_session(
            &pool,
            user_id,
            &CreateFocusRequest {
                mode: "focus".to_string(),
                duration_seconds: 1500,
                task_id: None,
                task_title: None,
            },
        )
        .await
        .expect("Failed to start session");

        // Now there should be an active session
        let active = FocusSessionRepo::get_active_session(&pool, user_id)
            .await
            .expect("Failed to get active session");
        assert!(active.is_some());
    }

    #[sqlx::test]
    async fn smoke_test_complete_session(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        // Start a session
        let session = FocusSessionRepo::start_session(
            &pool,
            user_id,
            &CreateFocusRequest {
                mode: "focus".to_string(),
                duration_seconds: 1500,
                task_id: None,
                task_title: Some("Complete test".to_string()),
            },
        )
        .await
        .expect("Failed to start session");

        // Complete the session
        let result = FocusSessionRepo::complete_session(&pool, session.id, user_id)
            .await
            .expect("Failed to complete session");

        // Check the session in the result has completed status
        assert_eq!(result.session.status, "completed");
        assert!(result.session.completed_at.is_some());
        // Check XP was awarded
        assert!(result.xp_awarded >= 0);
    }

    #[sqlx::test]
    async fn smoke_test_abandon_session(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        // Start a session
        let session = FocusSessionRepo::start_session(
            &pool,
            user_id,
            &CreateFocusRequest {
                mode: "focus".to_string(),
                duration_seconds: 1500,
                task_id: None,
                task_title: Some("Abandon test".to_string()),
            },
        )
        .await
        .expect("Failed to start session");

        // Abandon the session
        let abandoned = FocusSessionRepo::abandon_session(&pool, session.id, user_id)
            .await
            .expect("Failed to abandon session");

        assert_eq!(abandoned.status, "abandoned");
        assert!(abandoned.abandoned_at.is_some());
    }
}
