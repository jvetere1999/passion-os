//! Market repository
//!
//! Database operations for market items and purchases.

use sqlx::{FromRow, PgPool, Row};
use uuid::Uuid;

use crate::error::AppError;

use super::market_models::*;

// ============================================================================
// MARKET REPOSITORY
// ============================================================================

pub struct MarketRepo;

impl MarketRepo {
    /// List available market items
    pub async fn list_items(
        pool: &PgPool,
        category: Option<&str>,
    ) -> Result<MarketListResponse, AppError> {
        let items = if let Some(cat) = category {
            sqlx::query_as::<_, MarketItem>(
                r#"
                SELECT id, key, name, description, category, cost_coins,
                       icon, image_url, is_global, is_available, is_active,
                       is_consumable, uses_per_purchase, total_stock,
                       remaining_stock, created_by_user_id, sort_order,
                       created_at, updated_at
                FROM market_items
                WHERE is_active = true AND is_available = true
                  AND is_global = true AND category = $1
                ORDER BY sort_order, name
                "#,
            )
            .bind(cat)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as::<_, MarketItem>(
                r#"
                SELECT id, key, name, description, category, cost_coins,
                       icon, image_url, is_global, is_available, is_active,
                       is_consumable, uses_per_purchase, total_stock,
                       remaining_stock, created_by_user_id, sort_order,
                       created_at, updated_at
                FROM market_items
                WHERE is_active = true AND is_available = true AND is_global = true
                ORDER BY sort_order, name
                "#,
            )
            .fetch_all(pool)
            .await?
        };

        let total = items.len() as i64;

        Ok(MarketListResponse {
            items: items.into_iter().map(|i| i.into()).collect(),
            total,
        })
    }

    /// Get item by key
    pub async fn get_item_by_key(pool: &PgPool, key: &str) -> Result<Option<MarketItem>, AppError> {
        let item = sqlx::query_as::<_, MarketItem>(
            r#"
            SELECT id, key, name, description, category, cost_coins,
                   icon, image_url, is_global, is_available, is_active,
                   is_consumable, uses_per_purchase, total_stock,
                   remaining_stock, created_by_user_id, sort_order,
                   created_at, updated_at
            FROM market_items
            WHERE key = $1
            "#,
        )
        .bind(key)
        .fetch_optional(pool)
        .await?;

        Ok(item)
    }

    /// Purchase an item
    pub async fn purchase(
        pool: &PgPool,
        user_id: Uuid,
        req: &PurchaseRequest,
    ) -> Result<PurchaseResult, AppError> {
        let quantity = req.quantity.unwrap_or(1);
        if quantity < 1 {
            return Err(AppError::BadRequest(
                "Quantity must be at least 1".to_string(),
            ));
        }

        // Get and lock item
        let item = sqlx::query_as::<_, MarketItem>(
            r#"
            SELECT id, key, name, description, category, cost_coins,
                   icon, image_url, is_global, is_available, is_active,
                   is_consumable, uses_per_purchase, total_stock,
                   remaining_stock, created_by_user_id, sort_order,
                   created_at, updated_at
            FROM market_items
            WHERE key = $1
            FOR UPDATE
            "#,
        )
        .bind(&req.item_key)
        .fetch_optional(pool)
        .await?;

        let item = item.ok_or_else(|| AppError::NotFound("Item not found".to_string()))?;

        if !item.is_available || !item.is_active {
            return Err(AppError::BadRequest("Item not available".to_string()));
        }

        // Check stock
        if let Some(remaining) = item.remaining_stock {
            if remaining < quantity {
                return Err(AppError::BadRequest("Insufficient stock".to_string()));
            }
        }

        let total_cost = item.cost_coins * quantity;

        // Get and update wallet
        let wallet_row = sqlx::query(
            r#"
            SELECT coins FROM user_wallet WHERE user_id = $1 FOR UPDATE
            "#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        let current_coins: i64 = wallet_row.map(|r| r.get("coins")).unwrap_or(0);

        if current_coins < total_cost as i64 {
            return Err(AppError::BadRequest(format!(
                "Insufficient coins. Need {} but have {}",
                total_cost, current_coins
            )));
        }

        // Deduct coins
        let new_balance: i64 = sqlx::query_scalar(
            r#"
            UPDATE user_wallet
            SET coins = coins - $2, lifetime_spent = lifetime_spent + $2
            WHERE user_id = $1
            RETURNING coins
            "#,
        )
        .bind(user_id)
        .bind(total_cost as i64)
        .fetch_one(pool)
        .await?;

        // Update stock if applicable
        if item.remaining_stock.is_some() {
            sqlx::query(
                "UPDATE market_items SET remaining_stock = remaining_stock - $2 WHERE id = $1",
            )
            .bind(item.id)
            .bind(quantity)
            .execute(pool)
            .await?;
        }

        // Create purchase record
        let uses_remaining = if item.is_consumable {
            item.uses_per_purchase.map(|u| u * quantity)
        } else {
            None
        };

        #[derive(FromRow)]
        struct PurchaseRow {
            id: Uuid,
            purchased_at: chrono::DateTime<chrono::Utc>,
            status: String,
        }

        let purchase = sqlx::query_as::<_, PurchaseRow>(
            r#"
            INSERT INTO user_purchases (user_id, item_id, cost_coins, quantity, uses_remaining)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, purchased_at, status
            "#,
        )
        .bind(user_id)
        .bind(item.id)
        .bind(total_cost)
        .bind(quantity)
        .bind(uses_remaining)
        .fetch_one(pool)
        .await?;

        Ok(PurchaseResult {
            purchase: PurchaseResponse {
                id: purchase.id,
                item_key: item.key.clone(),
                item_name: item.name.clone(),
                cost_coins: total_cost,
                quantity,
                purchased_at: purchase.purchased_at,
                status: purchase.status,
                uses_remaining,
            },
            new_balance,
            item: item.into(),
        })
    }

    /// Redeem a purchase (for consumables)
    pub async fn redeem(
        pool: &PgPool,
        user_id: Uuid,
        purchase_id: Uuid,
    ) -> Result<RedeemResult, AppError> {
        // Get and lock purchase
        let purchase = sqlx::query_as::<_, UserPurchase>(
            r#"
            SELECT id, user_id, item_id, cost_coins, quantity, purchased_at,
                   redeemed_at, uses_remaining, status, refunded_at, refund_reason
            FROM user_purchases
            WHERE id = $1 AND user_id = $2
            FOR UPDATE
            "#,
        )
        .bind(purchase_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        let purchase =
            purchase.ok_or_else(|| AppError::NotFound("Purchase not found".to_string()))?;

        if purchase.status != "purchased" {
            return Err(AppError::BadRequest(format!(
                "Cannot redeem: status is {}",
                purchase.status
            )));
        }

        // Get item info
        #[derive(FromRow)]
        struct ItemInfo {
            key: String,
            name: String,
            is_consumable: bool,
            uses_per_purchase: Option<i32>,
        }

        let item = sqlx::query_as::<_, ItemInfo>(
            "SELECT key, name, is_consumable, uses_per_purchase FROM market_items WHERE id = $1",
        )
        .bind(purchase.item_id)
        .fetch_one(pool)
        .await?;

        if !item.is_consumable {
            return Err(AppError::BadRequest("Item is not consumable".to_string()));
        }

        // Update uses or mark as redeemed
        let new_uses = purchase.uses_remaining.map(|u| u - 1);
        let new_status = if new_uses.map_or(true, |u| u <= 0) {
            "redeemed"
        } else {
            "purchased"
        };

        sqlx::query(
            r#"
            UPDATE user_purchases
            SET uses_remaining = $3, status = $4,
                redeemed_at = CASE WHEN $4 = 'redeemed' THEN NOW() ELSE redeemed_at END
            WHERE id = $1 AND user_id = $2
            "#,
        )
        .bind(purchase_id)
        .bind(user_id)
        .bind(new_uses)
        .bind(new_status)
        .execute(pool)
        .await?;

        let message = if new_status == "redeemed" {
            format!("Fully redeemed: {}", item.name)
        } else {
            format!(
                "Used 1 of {}: {} remaining",
                item.name,
                new_uses.unwrap_or(0)
            )
        };

        Ok(RedeemResult {
            purchase: PurchaseResponse {
                id: purchase.id,
                item_key: item.key,
                item_name: item.name,
                cost_coins: purchase.cost_coins,
                quantity: purchase.quantity,
                purchased_at: purchase.purchased_at,
                status: new_status.to_string(),
                uses_remaining: new_uses,
            },
            message,
        })
    }

    /// Get user's purchase history
    pub async fn get_purchase_history(
        pool: &PgPool,
        user_id: Uuid,
        limit: i64,
    ) -> Result<PurchaseHistoryResponse, AppError> {
        #[derive(FromRow)]
        struct PurchaseHistoryRow {
            id: Uuid,
            cost_coins: i32,
            quantity: i32,
            purchased_at: chrono::DateTime<chrono::Utc>,
            status: String,
            uses_remaining: Option<i32>,
            item_key: String,
            item_name: String,
        }

        let purchases = sqlx::query_as::<_, PurchaseHistoryRow>(
            r#"
            SELECT p.id, p.cost_coins, p.quantity, p.purchased_at,
                   p.status, p.uses_remaining,
                   i.key as item_key, i.name as item_name
            FROM user_purchases p
            JOIN market_items i ON p.item_id = i.id
            WHERE p.user_id = $1
            ORDER BY p.purchased_at DESC
            LIMIT $2
            "#,
        )
        .bind(user_id)
        .bind(limit)
        .fetch_all(pool)
        .await?;

        let total = purchases.len() as i64;

        Ok(PurchaseHistoryResponse {
            purchases: purchases
                .into_iter()
                .map(|p| PurchaseResponse {
                    id: p.id,
                    item_key: p.item_key,
                    item_name: p.item_name,
                    cost_coins: p.cost_coins,
                    quantity: p.quantity,
                    purchased_at: p.purchased_at,
                    status: p.status,
                    uses_remaining: p.uses_remaining,
                })
                .collect(),
            total,
        })
    }

    /// Get user's wallet balance
    pub async fn get_wallet(pool: &PgPool, user_id: Uuid) -> Result<WalletResponse, AppError> {
        #[derive(FromRow)]
        struct WalletRow {
            coins: i64,
            lifetime_earned: i64,
            lifetime_spent: i64,
        }

        let wallet = sqlx::query_as::<_, WalletRow>(
            r#"
            SELECT coins, lifetime_earned, lifetime_spent
            FROM user_wallet
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        match wallet {
            Some(w) => Ok(WalletResponse {
                coins: w.coins,
                lifetime_earned: w.lifetime_earned,
                lifetime_spent: w.lifetime_spent,
            }),
            None => Ok(WalletResponse {
                coins: 0,
                lifetime_earned: 0,
                lifetime_spent: 0,
            }),
        }
    }

    /// Create market item (admin)
    pub async fn create_item(
        pool: &PgPool,
        user_id: Uuid,
        req: &CreateItemRequest,
    ) -> Result<MarketItem, AppError> {
        let item = sqlx::query_as::<_, MarketItem>(
            r#"
            INSERT INTO market_items (key, name, description, category, cost_coins,
                                      icon, image_url, is_consumable, uses_per_purchase,
                                      total_stock, remaining_stock, created_by_user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11)
            RETURNING id, key, name, description, category, cost_coins,
                      icon, image_url, is_global, is_available, is_active,
                      is_consumable, uses_per_purchase, total_stock,
                      remaining_stock, created_by_user_id, sort_order,
                      created_at, updated_at
            "#,
        )
        .bind(&req.key)
        .bind(&req.name)
        .bind(&req.description)
        .bind(&req.category)
        .bind(req.cost_coins)
        .bind(&req.icon)
        .bind(&req.image_url)
        .bind(req.is_consumable.unwrap_or(true))
        .bind(req.uses_per_purchase)
        .bind(req.total_stock)
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(item)
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_market_item_response() {
        let item = MarketItem {
            id: Uuid::new_v4(),
            key: "test_item".to_string(),
            name: "Test Item".to_string(),
            description: Some("A test item".to_string()),
            category: "rewards".to_string(),
            cost_coins: 100,
            icon: Some("🎁".to_string()),
            image_url: None,
            is_global: true,
            is_available: true,
            is_active: true,
            is_consumable: true,
            uses_per_purchase: Some(1),
            total_stock: None,
            remaining_stock: None,
            created_by_user_id: None,
            sort_order: 0,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let response: MarketItemResponse = item.into();
        assert_eq!(response.key, "test_item");
        assert!(response.is_available);
    }
}
