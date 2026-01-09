//! Quests tests
//!
//! Unit tests for quest system: create, accept, complete, abandon, rewards.

#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use uuid::Uuid;

    use crate::db::gamification_repos::{UserProgressRepo, UserWalletRepo};
    use crate::db::quests_models::CreateQuestRequest;
    use crate::db::quests_repos::QuestsRepo;

    // ========================================================================
    // TEST HELPERS
    // ========================================================================

    async fn create_test_user(pool: &PgPool) -> Uuid {
        let user_id = Uuid::new_v4();
        let email = format!("test-quests-{}@example.com", user_id);

        sqlx::query(
            r#"INSERT INTO users (id, email, name, role)
               VALUES ($1, $2, 'Test Quests User', 'user')"#,
        )
        .bind(user_id)
        .bind(&email)
        .execute(pool)
        .await
        .expect("Failed to create test user");

        // Initialize gamification
        UserProgressRepo::get_or_create(pool, user_id)
            .await
            .expect("Failed to init progress");
        UserWalletRepo::get_or_create(pool, user_id)
            .await
            .expect("Failed to init wallet");

        user_id
    }

    // ========================================================================
    // CREATE TESTS
    // ========================================================================

    #[sqlx::test]
    async fn test_create_quest(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let quest = QuestsRepo::create(
            &pool,
            user_id,
            &CreateQuestRequest {
                title: "Complete 5 focus sessions".to_string(),
                description: Some("Focus challenge".to_string()),
                category: "focus".to_string(),
                difficulty: "medium".to_string(),
                xp_reward: None,
                coin_reward: None,
                is_repeatable: Some(false),
                repeat_frequency: None,
            },
        )
        .await
        .expect("Failed to create quest");

        assert_eq!(quest.title, "Complete 5 focus sessions");
        assert_eq!(quest.difficulty, "medium");
        assert_eq!(quest.status, "available");
        // Default rewards for medium difficulty
        assert_eq!(quest.xp_reward, 50);
        assert_eq!(quest.coin_reward, 25);
    }

    #[sqlx::test]
    async fn test_create_quest_custom_rewards(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let quest = QuestsRepo::create(
            &pool,
            user_id,
            &CreateQuestRequest {
                title: "Custom Quest".to_string(),
                description: None,
                category: "custom".to_string(),
                difficulty: "starter".to_string(),
                xp_reward: Some(100),
                coin_reward: Some(50),
                is_repeatable: None,
                repeat_frequency: None,
            },
        )
        .await
        .expect("Failed to create");

        assert_eq!(quest.xp_reward, 100);
        assert_eq!(quest.coin_reward, 50);
    }

    // ========================================================================
    // LIST TESTS
    // ========================================================================

    #[sqlx::test]
    async fn test_list_quests(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        // Create quests
        QuestsRepo::create(
            &pool,
            user_id,
            &CreateQuestRequest {
                title: "Quest 1".to_string(),
                description: None,
                category: "test".to_string(),
                difficulty: "easy".to_string(),
                xp_reward: None,
                coin_reward: None,
                is_repeatable: None,
                repeat_frequency: None,
            },
        )
        .await
        .expect("Failed to create 1");

        QuestsRepo::create(
            &pool,
            user_id,
            &CreateQuestRequest {
                title: "Quest 2".to_string(),
                description: None,
                category: "test".to_string(),
                difficulty: "hard".to_string(),
                xp_reward: None,
                coin_reward: None,
                is_repeatable: None,
                repeat_frequency: None,
            },
        )
        .await
        .expect("Failed to create 2");

        let list = QuestsRepo::list(&pool, user_id, None)
            .await
            .expect("Failed to list");

        assert_eq!(list.total, 2);
        assert_eq!(list.quests.len(), 2);
    }

    #[sqlx::test]
    async fn test_list_quests_by_status(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let quest = QuestsRepo::create(
            &pool,
            user_id,
            &CreateQuestRequest {
                title: "Filterable".to_string(),
                description: None,
                category: "test".to_string(),
                difficulty: "easy".to_string(),
                xp_reward: None,
                coin_reward: None,
                is_repeatable: None,
                repeat_frequency: None,
            },
        )
        .await
        .expect("Failed to create");

        // Accept it
        QuestsRepo::accept_quest(&pool, quest.id, user_id)
            .await
            .expect("Failed to accept");

        // List available (should be 0)
        let available = QuestsRepo::list(&pool, user_id, Some("available"))
            .await
            .expect("Failed to list");
        assert_eq!(available.total, 0);

        // List accepted (should be 1)
        let accepted = QuestsRepo::list(&pool, user_id, Some("accepted"))
            .await
            .expect("Failed to list");
        assert_eq!(accepted.total, 1);
    }

    // ========================================================================
    // ACCEPT TESTS
    // ========================================================================

    #[sqlx::test]
    async fn test_accept_quest(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let quest = QuestsRepo::create(
            &pool,
            user_id,
            &CreateQuestRequest {
                title: "Accept Me".to_string(),
                description: None,
                category: "test".to_string(),
                difficulty: "easy".to_string(),
                xp_reward: None,
                coin_reward: None,
                is_repeatable: None,
                repeat_frequency: None,
            },
        )
        .await
        .expect("Failed to create");

        let accepted = QuestsRepo::accept_quest(&pool, quest.id, user_id)
            .await
            .expect("Failed to accept");

        assert_eq!(accepted.status, "accepted");
        assert!(accepted.accepted_at.is_some());
    }

    #[sqlx::test]
    async fn test_accept_quest_invalid_status(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let quest = QuestsRepo::create(
            &pool,
            user_id,
            &CreateQuestRequest {
                title: "Double Accept".to_string(),
                description: None,
                category: "test".to_string(),
                difficulty: "easy".to_string(),
                xp_reward: None,
                coin_reward: None,
                is_repeatable: None,
                repeat_frequency: None,
            },
        )
        .await
        .expect("Failed to create");

        // First accept
        QuestsRepo::accept_quest(&pool, quest.id, user_id)
            .await
            .expect("Failed first accept");

        // Second accept should fail
        let result = QuestsRepo::accept_quest(&pool, quest.id, user_id).await;
        assert!(result.is_err());
    }

    // ========================================================================
    // COMPLETE TESTS
    // ========================================================================

    #[sqlx::test]
    async fn test_complete_quest_awards_xp_and_coins(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let quest = QuestsRepo::create(
            &pool,
            user_id,
            &CreateQuestRequest {
                title: "Complete for XP".to_string(),
                description: None,
                category: "test".to_string(),
                difficulty: "hard".to_string(), // 100 XP, 50 coins
                xp_reward: None,
                coin_reward: None,
                is_repeatable: None,
                repeat_frequency: None,
            },
        )
        .await
        .expect("Failed to create");

        // Accept
        QuestsRepo::accept_quest(&pool, quest.id, user_id)
            .await
            .expect("Failed to accept");

        // Complete
        let result = QuestsRepo::complete_quest(&pool, quest.id, user_id)
            .await
            .expect("Failed to complete");

        assert_eq!(result.quest.status, "completed");
        assert_eq!(result.xp_awarded, 100);
        assert_eq!(result.coins_awarded, 50);
    }

    #[sqlx::test]
    async fn test_complete_quest_idempotent(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let quest = QuestsRepo::create(
            &pool,
            user_id,
            &CreateQuestRequest {
                title: "Idempotent Complete".to_string(),
                description: None,
                category: "test".to_string(),
                difficulty: "easy".to_string(),
                xp_reward: None,
                coin_reward: None,
                is_repeatable: None,
                repeat_frequency: None,
            },
        )
        .await
        .expect("Failed to create");

        QuestsRepo::accept_quest(&pool, quest.id, user_id)
            .await
            .expect("Failed to accept");

        // First complete
        let result1 = QuestsRepo::complete_quest(&pool, quest.id, user_id)
            .await
            .expect("Failed first complete");

        assert_eq!(result1.xp_awarded, 25);

        // Second complete should fail
        let result2 = QuestsRepo::complete_quest(&pool, quest.id, user_id).await;
        assert!(result2.is_err());
    }

    // ========================================================================
    // ABANDON TESTS
    // ========================================================================

    #[sqlx::test]
    async fn test_abandon_quest(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let quest = QuestsRepo::create(
            &pool,
            user_id,
            &CreateQuestRequest {
                title: "Abandon Me".to_string(),
                description: None,
                category: "test".to_string(),
                difficulty: "easy".to_string(),
                xp_reward: None,
                coin_reward: None,
                is_repeatable: None,
                repeat_frequency: None,
            },
        )
        .await
        .expect("Failed to create");

        QuestsRepo::accept_quest(&pool, quest.id, user_id)
            .await
            .expect("Failed to accept");

        let abandoned = QuestsRepo::abandon_quest(&pool, quest.id, user_id)
            .await
            .expect("Failed to abandon");

        assert_eq!(abandoned.status, "abandoned");
    }

    #[sqlx::test]
    async fn test_abandon_completed_quest_fails(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let quest = QuestsRepo::create(
            &pool,
            user_id,
            &CreateQuestRequest {
                title: "Completed".to_string(),
                description: None,
                category: "test".to_string(),
                difficulty: "easy".to_string(),
                xp_reward: None,
                coin_reward: None,
                is_repeatable: None,
                repeat_frequency: None,
            },
        )
        .await
        .expect("Failed to create");

        QuestsRepo::accept_quest(&pool, quest.id, user_id)
            .await
            .expect("Failed to accept");

        QuestsRepo::complete_quest(&pool, quest.id, user_id)
            .await
            .expect("Failed to complete");

        // Can't abandon completed quest
        let result = QuestsRepo::abandon_quest(&pool, quest.id, user_id).await;
        assert!(result.is_err());
    }

    // ========================================================================
    // GET BY ID TESTS
    // ========================================================================

    #[sqlx::test]
    async fn test_get_quest_by_id(pool: PgPool) {
        let user_id = create_test_user(&pool).await;

        let quest = QuestsRepo::create(
            &pool,
            user_id,
            &CreateQuestRequest {
                title: "Find Me".to_string(),
                description: Some("Hidden quest".to_string()),
                category: "test".to_string(),
                difficulty: "epic".to_string(),
                xp_reward: None,
                coin_reward: None,
                is_repeatable: None,
                repeat_frequency: None,
            },
        )
        .await
        .expect("Failed to create");

        let found = QuestsRepo::get_by_id(&pool, quest.id, user_id)
            .await
            .expect("Failed to get")
            .expect("Quest not found");

        assert_eq!(found.title, "Find Me");
        assert_eq!(found.difficulty, "epic");
    }

    #[sqlx::test]
    async fn test_get_quest_wrong_user(pool: PgPool) {
        let user_id = create_test_user(&pool).await;
        let other_user = create_test_user(&pool).await;

        let quest = QuestsRepo::create(
            &pool,
            user_id,
            &CreateQuestRequest {
                title: "Private Quest".to_string(),
                description: None,
                category: "test".to_string(),
                difficulty: "easy".to_string(),
                xp_reward: None,
                coin_reward: None,
                is_repeatable: None,
                repeat_frequency: None,
            },
        )
        .await
        .expect("Failed to create");

        let found = QuestsRepo::get_by_id(&pool, quest.id, other_user)
            .await
            .expect("Failed to get");

        assert!(found.is_none());
    }
}
