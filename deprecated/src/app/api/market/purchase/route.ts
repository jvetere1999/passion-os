/**
 * Market Purchase API
 * POST /api/market/purchase - Purchase a market item
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";
import { purchaseItem, getMarketItem } from "@/lib/db/repositories/market";
import { checkAchievements } from "@/lib/db/repositories/gamification";

export const dynamic = "force-dynamic";

interface PurchaseRequest {
  itemId: string;
}

/**
 * POST /api/market/purchase
 * Purchase a market item
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as PurchaseRequest;

    if (!body.itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const userId = session.user.id;

    // Get item details for response
    const item = await getMarketItem(db, body.itemId);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Attempt purchase
    const result = await purchaseItem(db, userId, body.itemId);

    if (!result.success) {
      return NextResponse.json({
        error: result.error,
        currentBalance: result.newBalance,
        itemCost: item.cost_coins,
      }, { status: 400 });
    }

    // Check for achievements
    const achievements = await checkAchievements(db, userId, "market_purchase");

    return NextResponse.json({
      success: true,
      purchase: result.purchase ? {
        id: result.purchase.id,
        itemId: result.purchase.item_id,
        itemName: item.name,
        cost: result.purchase.cost_coins,
        purchasedAt: result.purchase.purchased_at,
      } : null,
      newBalance: result.newBalance,
      achievements: achievements.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
      })),
    });
  } catch (error) {
    console.error("[market] purchase error:", error);
    return NextResponse.json({ error: "Failed to complete purchase" }, { status: 500 });
  }
}

