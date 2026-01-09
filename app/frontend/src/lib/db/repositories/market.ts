/**
 * Market Repository
 * Handles market items and purchases
 */

import type { D1Database } from "@cloudflare/workers-types";
import type { MarketItem, UserPurchase } from "../types";
import { getUserWallet, spendCoins } from "./gamification";

// ============================================
// Market Items
// ============================================

/**
 * Get all available market items (global + user's custom)
 */
export async function getMarketItems(
  db: D1Database,
  userId: string
): Promise<MarketItem[]> {
  const result = await db
    .prepare(`
      SELECT * FROM market_items 
      WHERE (is_global = 1 OR created_by_user_id = ?) AND is_active = 1
      ORDER BY category, cost_coins ASC
    `)
    .bind(userId)
    .all<MarketItem>();
  return result.results || [];
}

/**
 * Get global market items only
 */
export async function getGlobalMarketItems(
  db: D1Database
): Promise<MarketItem[]> {
  const result = await db
    .prepare(`
      SELECT * FROM market_items 
      WHERE is_global = 1 AND is_active = 1
      ORDER BY category, cost_coins ASC
    `)
    .all<MarketItem>();
  return result.results || [];
}

/**
 * Get user's custom items
 */
export async function getUserCustomItems(
  db: D1Database,
  userId: string
): Promise<MarketItem[]> {
  const result = await db
    .prepare(`
      SELECT * FROM market_items 
      WHERE created_by_user_id = ? AND is_active = 1
      ORDER BY cost_coins ASC
    `)
    .bind(userId)
    .all<MarketItem>();
  return result.results || [];
}

/**
 * Get a specific market item
 */
export async function getMarketItem(
  db: D1Database,
  itemId: string
): Promise<MarketItem | null> {
  return db
    .prepare(`SELECT * FROM market_items WHERE id = ?`)
    .bind(itemId)
    .first<MarketItem>();
}

/**
 * Create a custom market item
 */
export async function createCustomItem(
  db: D1Database,
  userId: string,
  data: {
    name: string;
    description?: string;
    category: string;
    cost_coins: number;
    icon?: string;
  }
): Promise<MarketItem> {
  const id = `item_user_${userId}_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO market_items (id, name, description, category, cost_coins, icon, is_global, created_by_user_id, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, 1, ?)
    `)
    .bind(id, data.name, data.description || null, data.category, data.cost_coins, data.icon || null, userId, now)
    .run();

  return {
    id,
    name: data.name,
    description: data.description || null,
    category: data.category,
    cost_coins: data.cost_coins,
    icon: data.icon || null,
    is_global: 0,
    created_by_user_id: userId,
    is_active: 1,
    created_at: now,
  };
}

/**
 * Update a custom market item
 */
export async function updateCustomItem(
  db: D1Database,
  userId: string,
  itemId: string,
  data: Partial<{
    name: string;
    description: string;
    category: string;
    cost_coins: number;
    icon: string;
    is_active: boolean;
  }>
): Promise<boolean> {
  // Verify ownership
  const item = await getMarketItem(db, itemId);
  if (!item || item.created_by_user_id !== userId) {
    return false;
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    values.push(data.description);
  }
  if (data.category !== undefined) {
    updates.push("category = ?");
    values.push(data.category);
  }
  if (data.cost_coins !== undefined) {
    updates.push("cost_coins = ?");
    values.push(data.cost_coins);
  }
  if (data.icon !== undefined) {
    updates.push("icon = ?");
    values.push(data.icon);
  }
  if (data.is_active !== undefined) {
    updates.push("is_active = ?");
    values.push(data.is_active ? 1 : 0);
  }

  if (updates.length === 0) {
    return true;
  }

  values.push(itemId);

  await db
    .prepare(`UPDATE market_items SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return true;
}

/**
 * Delete a custom market item
 */
export async function deleteCustomItem(
  db: D1Database,
  userId: string,
  itemId: string
): Promise<boolean> {
  // Verify ownership
  const item = await getMarketItem(db, itemId);
  if (!item || item.created_by_user_id !== userId) {
    return false;
  }

  // Soft delete
  await db
    .prepare(`UPDATE market_items SET is_active = 0 WHERE id = ?`)
    .bind(itemId)
    .run();

  return true;
}

// ============================================
// Purchases
// ============================================

/**
 * Purchase a market item
 */
export async function purchaseItem(
  db: D1Database,
  userId: string,
  itemId: string
): Promise<{ success: boolean; error?: string; purchase?: UserPurchase; newBalance?: number }> {
  // Get item
  const item = await getMarketItem(db, itemId);
  if (!item || !item.is_active) {
    return { success: false, error: "Item not found or not available" };
  }

  // Check if user can see this item (global or owns it)
  if (!item.is_global && item.created_by_user_id !== userId) {
    return { success: false, error: "Item not available to you" };
  }

  // Spend coins
  const spendResult = await spendCoins(db, userId, item.cost_coins, `Purchased: ${item.name}`, itemId);
  if (!spendResult.success) {
    return { success: false, error: spendResult.error, newBalance: spendResult.newBalance };
  }

  // Create purchase record
  const purchaseId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO user_purchases (id, user_id, item_id, cost_coins, purchased_at, redeemed, redeemed_at)
      VALUES (?, ?, ?, ?, ?, 0, NULL)
    `)
    .bind(purchaseId, userId, itemId, item.cost_coins, now)
    .run();

  // Log activity event
  await db
    .prepare(`
      INSERT INTO activity_events (id, user_id, event_type, entity_type, entity_id, metadata_json, created_at)
      VALUES (?, ?, 'market_purchase', 'market_item', ?, ?, ?)
    `)
    .bind(crypto.randomUUID(), userId, itemId, JSON.stringify({ name: item.name, cost: item.cost_coins }), now)
    .run();

  const purchase: UserPurchase = {
    id: purchaseId,
    user_id: userId,
    item_id: itemId,
    cost_coins: item.cost_coins,
    purchased_at: now,
    redeemed: 0,
    redeemed_at: null,
  };

  return { success: true, purchase, newBalance: spendResult.newBalance };
}

/**
 * Get user purchases
 */
export async function getUserPurchases(
  db: D1Database,
  userId: string,
  options?: {
    redeemedOnly?: boolean;
    unredeemedOnly?: boolean;
    limit?: number;
  }
): Promise<UserPurchase[]> {
  let query = `SELECT * FROM user_purchases WHERE user_id = ?`;
  const params: (string | number)[] = [userId];

  if (options?.redeemedOnly) {
    query += ` AND redeemed = 1`;
  } else if (options?.unredeemedOnly) {
    query += ` AND redeemed = 0`;
  }

  query += ` ORDER BY purchased_at DESC`;

  if (options?.limit) {
    query += ` LIMIT ?`;
    params.push(options.limit);
  }

  const result = await db.prepare(query).bind(...params).all<UserPurchase>();
  return result.results || [];
}

/**
 * Redeem a purchase
 */
export async function redeemPurchase(
  db: D1Database,
  userId: string,
  purchaseId: string
): Promise<{ success: boolean; error?: string }> {
  // Get purchase
  const purchase = await db
    .prepare(`SELECT * FROM user_purchases WHERE id = ? AND user_id = ?`)
    .bind(purchaseId, userId)
    .first<UserPurchase>();

  if (!purchase) {
    return { success: false, error: "Purchase not found" };
  }

  if (purchase.redeemed) {
    return { success: false, error: "Already redeemed" };
  }

  const now = new Date().toISOString();

  await db
    .prepare(`UPDATE user_purchases SET redeemed = 1, redeemed_at = ? WHERE id = ?`)
    .bind(now, purchaseId)
    .run();

  return { success: true };
}

/**
 * Get user's wallet balance (convenience wrapper)
 */
export async function getWalletBalance(
  db: D1Database,
  userId: string
): Promise<{ coins: number; xp: number; level: number }> {
  const wallet = await getUserWallet(db, userId);
  return {
    coins: wallet?.coins || 0,
    xp: wallet?.xp || 0,
    level: wallet?.level || 1,
  };
}

/**
 * Get purchase history with item details
 */
export async function getPurchaseHistory(
  db: D1Database,
  userId: string,
  limit: number = 50
): Promise<Array<UserPurchase & { item_name: string; item_category: string }>> {
  const result = await db
    .prepare(`
      SELECT p.*, m.name as item_name, m.category as item_category
      FROM user_purchases p
      LEFT JOIN market_items m ON p.item_id = m.id
      WHERE p.user_id = ?
      ORDER BY p.purchased_at DESC
      LIMIT ?
    `)
    .bind(userId, limit)
    .all<UserPurchase & { item_name: string; item_category: string }>();

  return result.results || [];
}

