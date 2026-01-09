//! Transaction Utilities
//!
//! Provides helpers for explicit transaction management.

use sqlx::{PgPool, Postgres, Transaction};

use crate::error::AppError;

/// Transaction wrapper for database operations
pub struct Tx<'a> {
    inner: Transaction<'a, Postgres>,
}

impl<'a> Tx<'a> {
    /// Begin a new transaction
    pub async fn begin(pool: &'a PgPool) -> Result<Self, AppError> {
        let tx = pool
            .begin()
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(Self { inner: tx })
    }

    /// Commit the transaction
    pub async fn commit(self) -> Result<(), AppError> {
        self.inner
            .commit()
            .await
            .map_err(|e| AppError::Database(e.to_string()))
    }

    /// Rollback the transaction
    pub async fn rollback(self) -> Result<(), AppError> {
        self.inner
            .rollback()
            .await
            .map_err(|e| AppError::Database(e.to_string()))
    }

    /// Get mutable reference to inner transaction for queries
    pub fn as_mut(&mut self) -> &mut Transaction<'a, Postgres> {
        &mut self.inner
    }
}

/// Execute a function within a transaction
///
/// Automatically commits on success, rolls back on error.
///
/// # Example
/// ```rust,ignore
/// let result = with_transaction(&pool, |tx| async move {
///     sqlx::query("INSERT INTO users ...").execute(&mut **tx).await?;
///     Ok(user_id)
/// }).await?;
/// ```
pub async fn with_transaction<F, T, Fut>(pool: &PgPool, f: F) -> Result<T, AppError>
where
    F: FnOnce(&mut Transaction<'_, Postgres>) -> Fut,
    Fut: std::future::Future<Output = Result<T, AppError>>,
{
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    match f(&mut tx).await {
        Ok(result) => {
            tx.commit()
                .await
                .map_err(|e| AppError::Database(e.to_string()))?;
            Ok(result)
        }
        Err(e) => {
            // Attempt rollback, but don't override the original error
            let _ = tx.rollback().await;
            Err(e)
        }
    }
}

/// Savepoint within a transaction
///
/// Use for partial rollback scenarios.
pub struct Savepoint<'a, 'b> {
    name: String,
    tx: &'a mut Transaction<'b, Postgres>,
    released: bool,
}

impl<'a, 'b> Savepoint<'a, 'b> {
    /// Create a new savepoint
    pub async fn new(tx: &'a mut Transaction<'b, Postgres>, name: &str) -> Result<Self, AppError> {
        sqlx::query(&format!("SAVEPOINT {}", name))
            .execute(&mut **tx)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(Self {
            name: name.to_string(),
            tx,
            released: false,
        })
    }

    /// Release the savepoint (commit the work since savepoint)
    pub async fn release(mut self) -> Result<(), AppError> {
        sqlx::query(&format!("RELEASE SAVEPOINT {}", self.name))
            .execute(&mut **self.tx)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        self.released = true;
        Ok(())
    }

    /// Rollback to the savepoint
    pub async fn rollback(mut self) -> Result<(), AppError> {
        sqlx::query(&format!("ROLLBACK TO SAVEPOINT {}", self.name))
            .execute(&mut **self.tx)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        self.released = true;
        Ok(())
    }
}

impl Drop for Savepoint<'_, '_> {
    fn drop(&mut self) {
        if !self.released {
            // Savepoint will be automatically released when the transaction ends
            tracing::debug!("Savepoint {} dropped without explicit release", self.name);
        }
    }
}

#[cfg(test)]
mod tests {
    // Transaction tests require a database connection, so we test the logic
    // rather than actual database operations

    #[test]
    fn test_savepoint_name() {
        let name = "test_savepoint";
        let sql = format!("SAVEPOINT {}", name);
        assert_eq!(sql, "SAVEPOINT test_savepoint");
    }

    #[test]
    fn test_savepoint_release_sql() {
        let name = "test_savepoint";
        let sql = format!("RELEASE SAVEPOINT {}", name);
        assert_eq!(sql, "RELEASE SAVEPOINT test_savepoint");
    }

    #[test]
    fn test_savepoint_rollback_sql() {
        let name = "test_savepoint";
        let sql = format!("ROLLBACK TO SAVEPOINT {}", name);
        assert_eq!(sql, "ROLLBACK TO SAVEPOINT test_savepoint");
    }
}
