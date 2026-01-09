//! Market routes
//!
//! Routes for market items, purchases, and wallet.

use std::sync::Arc;

use axum::{
    extract::{Extension, Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::market_models::*;
use crate::db::market_repos::MarketRepo;
use crate::db::models::User;
use crate::error::AppError;
use crate::shared::audit::{write_audit, AuditEventType};
use crate::state::AppState;

/// Create market routes
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_market_overview))
        .route("/items", get(list_items).post(create_item))
        .route("/items/:key", get(get_item))
        .route("/purchase", post(purchase_item))
        .route("/redeem", post(redeem_item))
        .route("/history", get(get_purchase_history))
        .route("/wallet", get(get_wallet))
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ListItemsQuery {
    pub category: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct HistoryQuery {
    pub limit: Option<i64>,
}

// ============================================================================
// RESPONSE WRAPPERS
// ============================================================================

#[derive(Serialize)]
struct ItemWrapper {
    data: MarketItemResponse,
}

#[derive(Serialize)]
struct ItemsListWrapper {
    data: MarketListResponse,
}

#[derive(Serialize)]
struct PurchaseWrapper {
    data: PurchaseResult,
}

#[derive(Serialize)]
struct RedeemWrapper {
    data: RedeemResult,
}

#[derive(Serialize)]
struct HistoryWrapper {
    data: PurchaseHistoryResponse,
}

#[derive(Serialize)]
struct WalletWrapper {
    data: WalletResponse,
}

#[derive(Serialize)]
struct MarketOverview {
    wallet: WalletResponse,
    featured_items: Vec<MarketItemResponse>,
    categories: Vec<String>,
}

#[derive(Serialize)]
struct OverviewWrapper {
    data: MarketOverview,
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /market
/// Get market overview (wallet + featured items)
async fn get_market_overview(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<OverviewWrapper>, AppError> {
    let wallet = MarketRepo::get_wallet(&state.db, user.id).await?;
    let items = MarketRepo::list_items(&state.db, None).await?;

    // Get unique categories
    let mut categories: Vec<String> = items.items.iter().map(|i| i.category.clone()).collect();
    categories.sort();
    categories.dedup();

    // Take first 6 as featured
    let featured_items: Vec<MarketItemResponse> = items.items.into_iter().take(6).collect();

    Ok(Json(OverviewWrapper {
        data: MarketOverview {
            wallet,
            featured_items,
            categories,
        },
    }))
}

/// GET /market/items
/// List available market items
async fn list_items(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ListItemsQuery>,
) -> Result<Json<ItemsListWrapper>, AppError> {
    let result = MarketRepo::list_items(&state.db, query.category.as_deref()).await?;
    Ok(Json(ItemsListWrapper { data: result }))
}

/// GET /market/items/:key
/// Get item by key
async fn get_item(
    State(state): State<Arc<AppState>>,
    Path(key): Path<String>,
) -> Result<Json<ItemWrapper>, AppError> {
    let item = MarketRepo::get_item_by_key(&state.db, &key).await?;
    let item = item.ok_or_else(|| AppError::NotFound("Item not found".to_string()))?;
    Ok(Json(ItemWrapper { data: item.into() }))
}

/// POST /market/items
/// Create market item (admin)
async fn create_item(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateItemRequest>,
) -> Result<Json<ItemWrapper>, AppError> {
    // TODO: Check admin role
    let item = MarketRepo::create_item(&state.db, user.id, &req).await?;
    Ok(Json(ItemWrapper { data: item.into() }))
}

/// POST /market/purchase
/// Purchase an item
async fn purchase_item(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<PurchaseRequest>,
) -> Result<Json<PurchaseWrapper>, AppError> {
    let result = MarketRepo::purchase(&state.db, user.id, &req).await?;

    // Audit log: purchase event
    write_audit(
        state.db.clone(),
        AuditEventType::Purchase,
        Some(user.id),
        &format!(
            "Purchased {} x{} for {} coins",
            result.item.name, result.purchase.quantity, result.purchase.cost_coins
        ),
        Some("market_item"),
        Some(result.item.id),
    );

    Ok(Json(PurchaseWrapper { data: result }))
}

/// POST /market/redeem
/// Redeem a consumable purchase
async fn redeem_item(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<RedeemRequest>,
) -> Result<Json<RedeemWrapper>, AppError> {
    let result = MarketRepo::redeem(&state.db, user.id, req.purchase_id).await?;
    Ok(Json(RedeemWrapper { data: result }))
}

/// GET /market/history
/// Get purchase history
async fn get_purchase_history(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<HistoryQuery>,
) -> Result<Json<HistoryWrapper>, AppError> {
    let limit = query.limit.unwrap_or(20).min(100);
    let result = MarketRepo::get_purchase_history(&state.db, user.id, limit).await?;
    Ok(Json(HistoryWrapper { data: result }))
}

/// GET /market/wallet
/// Get wallet balance
async fn get_wallet(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
) -> Result<Json<WalletWrapper>, AppError> {
    let wallet = MarketRepo::get_wallet(&state.db, user.id).await?;
    Ok(Json(WalletWrapper { data: wallet }))
}
