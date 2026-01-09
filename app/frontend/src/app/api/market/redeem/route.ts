/**
 * Market Redeem API
 * POST /api/market/redeem - Redeem a purchased item
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";
import { redeemPurchase } from "@/lib/db/repositories/market";

export const dynamic = "force-dynamic";

interface RedeemRequest {
  purchaseId: string;
}

/**
 * POST /api/market/redeem
 * Redeem a purchased item
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as RedeemRequest;

    if (!body.purchaseId) {
      return NextResponse.json({ error: "purchaseId is required" }, { status: 400 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const userId = session.user.id;

    // Attempt redemption
    const result = await redeemPurchase(db, userId, body.purchaseId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Enjoy your reward!",
    });
  } catch (error) {
    console.error("[market] redeem error:", error);
    return NextResponse.json({ error: "Failed to redeem" }, { status: 500 });
  }
}

