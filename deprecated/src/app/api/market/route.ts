/**
 * Market API Routes
 * GET /api/market - Get market items and wallet balance
 * POST /api/market/purchase - Purchase an item
 * POST /api/market/redeem - Redeem a purchase
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";
import {
  getMarketItems,
  getWalletBalance,
  getUserPurchases,
  getPurchaseHistory,
} from "@/lib/db/repositories/market";
import { getUserWallet, createUserWallet } from "@/lib/db/repositories/gamification";

export const dynamic = "force-dynamic";

/**
 * GET /api/market
 * Get market items, wallet balance, and recent purchases
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get("history") === "true";

    // Ensure wallet exists (create on-demand for users created before wallet system)
    let existingWallet = await getUserWallet(db, userId);
    if (!existingWallet) {
      existingWallet = await createUserWallet(db, userId);
    }

    // Get data in parallel
    const [items, wallet, unredeemed] = await Promise.all([
      getMarketItems(db, userId),
      getWalletBalance(db, userId),
      getUserPurchases(db, userId, { unredeemedOnly: true }),
    ]);

    // Optionally include full purchase history
    let history: Awaited<ReturnType<typeof getPurchaseHistory>> = [];
    if (includeHistory) {
      history = await getPurchaseHistory(db, userId, 50);
    }

    // Group items by category
    const itemsByCategory: Record<string, typeof items> = {};
    for (const item of items) {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    }

    return NextResponse.json({
      wallet,
      items,
      itemsByCategory,
      unredeemed: unredeemed.map(p => ({
        id: p.id,
        itemId: p.item_id,
        cost: p.cost_coins,
        purchasedAt: p.purchased_at,
      })),
      history: includeHistory ? history.map(p => ({
        id: p.id,
        itemId: p.item_id,
        itemName: p.item_name,
        itemCategory: p.item_category,
        cost: p.cost_coins,
        purchasedAt: p.purchased_at,
        redeemed: p.redeemed === 1,
        redeemedAt: p.redeemed_at,
      })) : undefined,
    });
  } catch (error) {
    console.error("[market] GET error:", error);
    return NextResponse.json({ error: "Failed to get market data" }, { status: 500 });
  }
}

