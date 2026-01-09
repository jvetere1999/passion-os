//! Market models
//!
//! Models for market items, purchases, and wallet operations.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ============================================================================
// ENUMS
// ============================================================================

/// Purchase status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PurchaseStatus {
    Purchased,
    Redeemed,
    Refunded,
    Expired,
}

impl PurchaseStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            PurchaseStatus::Purchased => "purchased",
            PurchaseStatus::Redeemed => "redeemed",
            PurchaseStatus::Refunded => "refunded",
            PurchaseStatus::Expired => "expired",
        }
    }
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

/// Market item
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct MarketItem {
    pub id: Uuid,
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub cost_coins: i32,
    pub icon: Option<String>,
    pub image_url: Option<String>,
    pub is_global: bool,
    pub is_available: bool,
    pub is_active: bool,
    pub is_consumable: bool,
    pub uses_per_purchase: Option<i32>,
    pub total_stock: Option<i32>,
    pub remaining_stock: Option<i32>,
    pub created_by_user_id: Option<Uuid>,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// User purchase
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserPurchase {
    pub id: Uuid,
    pub user_id: Uuid,
    pub item_id: Uuid,
    pub cost_coins: i32,
    pub quantity: i32,
    pub purchased_at: DateTime<Utc>,
    pub redeemed_at: Option<DateTime<Utc>>,
    pub uses_remaining: Option<i32>,
    pub status: String,
    pub refunded_at: Option<DateTime<Utc>>,
    pub refund_reason: Option<String>,
}

// ============================================================================
// REQUEST MODELS
// ============================================================================

/// Purchase item request
#[derive(Debug, Deserialize)]
pub struct PurchaseRequest {
    pub item_key: String,
    pub quantity: Option<i32>,
}

/// Redeem item request
#[derive(Debug, Deserialize)]
pub struct RedeemRequest {
    pub purchase_id: Uuid,
}

/// Create market item request (admin)
#[derive(Debug, Deserialize)]
pub struct CreateItemRequest {
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub cost_coins: i32,
    pub icon: Option<String>,
    pub image_url: Option<String>,
    pub is_consumable: Option<bool>,
    pub uses_per_purchase: Option<i32>,
    pub total_stock: Option<i32>,
}

// ============================================================================
// RESPONSE MODELS
// ============================================================================

/// Market item response
#[derive(Serialize)]
pub struct MarketItemResponse {
    pub id: Uuid,
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub cost_coins: i32,
    pub icon: Option<String>,
    pub image_url: Option<String>,
    pub is_consumable: bool,
    pub uses_per_purchase: Option<i32>,
    pub remaining_stock: Option<i32>,
    pub is_available: bool,
}

impl From<MarketItem> for MarketItemResponse {
    fn from(i: MarketItem) -> Self {
        Self {
            id: i.id,
            key: i.key,
            name: i.name,
            description: i.description,
            category: i.category,
            cost_coins: i.cost_coins,
            icon: i.icon,
            image_url: i.image_url,
            is_consumable: i.is_consumable,
            uses_per_purchase: i.uses_per_purchase,
            remaining_stock: i.remaining_stock,
            is_available: i.is_available && i.is_active,
        }
    }
}

/// Market items list response
#[derive(Serialize)]
pub struct MarketListResponse {
    pub items: Vec<MarketItemResponse>,
    pub total: i64,
}

/// User purchase response
#[derive(Serialize)]
pub struct PurchaseResponse {
    pub id: Uuid,
    pub item_key: String,
    pub item_name: String,
    pub cost_coins: i32,
    pub quantity: i32,
    pub purchased_at: DateTime<Utc>,
    pub status: String,
    pub uses_remaining: Option<i32>,
}

/// Purchase history response
#[derive(Serialize)]
pub struct PurchaseHistoryResponse {
    pub purchases: Vec<PurchaseResponse>,
    pub total: i64,
}

/// Purchase result
#[derive(Serialize)]
pub struct PurchaseResult {
    pub purchase: PurchaseResponse,
    pub new_balance: i64,
    pub item: MarketItemResponse,
}

/// Redeem result
#[derive(Serialize)]
pub struct RedeemResult {
    pub purchase: PurchaseResponse,
    pub message: String,
}

/// Wallet balance response
#[derive(Serialize)]
pub struct WalletResponse {
    pub coins: i64,
    pub lifetime_earned: i64,
    pub lifetime_spent: i64,
}
