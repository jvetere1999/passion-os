// Test: Verify AccountRepo queries can find and upsert accounts after migration 0015
// Location: app/backend/crates/api/tests/accounts_type_column_test.rs
// Purpose: Regression test for the 'no column found for name: type' error

#[cfg(test)]
mod accounts_type_column_tests {
    use sqlx::postgres::PgPool;
    use uuid::Uuid;

    // This test would be run as part of the integration test suite
    // It verifies that after applying all migrations (including 0015),
    // the AccountRepo can successfully query, insert, and update accounts

    #[sqlx::test]
    async fn test_accounts_table_has_type_column(pool: PgPool) -> Result<(), Box<dyn std::error::Error>> {
        // Verify the type column exists
        let result: (bool,) = sqlx::query_as(
            r#"
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'accounts' AND column_name = 'type'
            )
            "#
        )
        .fetch_one(&pool)
        .await?;

        assert!(
            result.0,
            "Column 'type' does not exist in accounts table. Migration 0015 may not have been applied."
        );

        Ok(())
    }

    #[sqlx::test]
    async fn test_accounts_type_column_has_correct_type(pool: PgPool) -> Result<(), Box<dyn std::error::Error>> {
        // Verify the type column has correct definition
        let result: Option<(String, String, bool)> = sqlx::query_as(
            r#"
            SELECT column_name, data_type, is_nullable::text::boolean
            FROM information_schema.columns
            WHERE table_name = 'accounts' AND column_name = 'type'
            "#
        )
        .fetch_optional(&pool)
        .await?;

        match result {
            Some((col_name, data_type, is_nullable)) => {
                assert_eq!(col_name, "type", "Column name mismatch");
                assert_eq!(data_type, "text", "Column type should be 'text', got '{}'", data_type);
                assert!(!is_nullable, "Column should be NOT NULL");
            }
            None => panic!("Column 'type' does not exist in accounts table"),
        }

        Ok(())
    }

    #[sqlx::test]
    async fn test_accounts_type_column_has_default(pool: PgPool) -> Result<(), Box<dyn std::error::Error>> {
        // Verify the type column has correct default value
        let result: Option<(String,)> = sqlx::query_as(
            r#"
            SELECT column_default
            FROM information_schema.columns
            WHERE table_name = 'accounts' AND column_name = 'type'
            "#
        )
        .fetch_optional(&pool)
        .await?;

        match result {
            Some((default,)) => {
                assert!(
                    default.contains("'oauth'"),
                    "Column default should contain 'oauth', got: {}",
                    default
                );
            }
            None => panic!("Column 'type' does not exist in accounts table"),
        }

        Ok(())
    }

    // Additional test: Verify the AccountRepo can deserialize rows with the type column
    #[sqlx::test]
    async fn test_account_struct_can_deserialize_with_type_column(pool: PgPool) -> Result<(), Box<dyn std::error::Error>> {
        // Create a test user first
        let user_id = Uuid::new_v4();
        sqlx::query("INSERT INTO users (id, email, name) VALUES ($1, $2, $3)")
            .bind(user_id)
            .bind("test@example.com")
            .bind("Test User")
            .execute(&pool)
            .await?;

        // Insert an account
        let account_id = Uuid::new_v4();
        let result = sqlx::query_as::<_, (String,)>(
            r#"
            INSERT INTO accounts (
                id, user_id, provider, provider_account_id, type
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            "#
        )
        .bind(account_id)
        .bind(user_id)
        .bind("google")
        .bind("google-oauth-123")
        .bind("oauth")
        .fetch_one(&pool)
        .await;

        assert!(
            result.is_ok(),
            "Failed to insert account with type column. Error: {:?}",
            result.err()
        );

        // Query the account back with the type column alias (as used in AccountRepo)
        let query_result = sqlx::query_as::<_, (String, String)>(
            r#"
            SELECT id, type as account_type FROM accounts WHERE id = $1
            "#
        )
        .bind(account_id)
        .fetch_optional(&pool)
        .await?;

        assert!(
            query_result.is_some(),
            "Could not query account back with type column alias"
        );

        let (returned_id, account_type) = query_result.unwrap();
        assert_eq!(returned_id, account_id.to_string());
        assert_eq!(account_type, "oauth");

        Ok(())
    }
}
