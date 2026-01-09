/**
 * Custom Market Items API
 * POST /api/market/items - Create a custom item
 * PUT /api/market/items - Update a custom item
 * DELETE /api/market/items - Delete a custom item
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";
import {
  createCustomItem,
  updateCustomItem,
  deleteCustomItem,
  getUserCustomItems,
} from "@/lib/db/repositories/market";

export const dynamic = "force-dynamic";

/**
 * GET /api/market/items
 * Get user's custom items
 */
export async function GET() {
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

    const items = await getUserCustomItems(db, session.user.id);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[market] get items error:", error);
    return NextResponse.json({ error: "Failed to get items" }, { status: 500 });
  }
}

interface CreateItemRequest {
  name: string;
  description?: string;
  category: string;
  cost_coins: number;
  icon?: string;
}

/**
 * POST /api/market/items
 * Create a custom market item
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateItemRequest;

    if (!body.name || !body.category || !body.cost_coins) {
      return NextResponse.json({
        error: "name, category, and cost_coins are required"
      }, { status: 400 });
    }

    if (body.cost_coins < 1) {
      return NextResponse.json({ error: "cost_coins must be at least 1" }, { status: 400 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const item = await createCustomItem(db, session.user.id, body);

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("[market] create item error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

interface UpdateItemRequest {
  itemId: string;
  name?: string;
  description?: string;
  category?: string;
  cost_coins?: number;
  icon?: string;
  is_active?: boolean;
}

/**
 * PUT /api/market/items
 * Update a custom market item
 */
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as UpdateItemRequest;

    if (!body.itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const { itemId, ...updates } = body;
    const success = await updateCustomItem(db, session.user.id, itemId, updates);

    if (!success) {
      return NextResponse.json({ error: "Item not found or not owned by you" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[market] update item error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

interface DeleteItemRequest {
  itemId: string;
}

/**
 * DELETE /api/market/items
 * Delete a custom market item
 */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as DeleteItemRequest;

    if (!body.itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const success = await deleteCustomItem(db, session.user.id, body.itemId);

    if (!success) {
      return NextResponse.json({ error: "Item not found or not owned by you" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[market] delete item error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}

