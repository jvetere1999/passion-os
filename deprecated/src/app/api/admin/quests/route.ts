/**
 * Admin Quests API
 * Manage universal quests
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";
import { isAdminEmail } from "@/lib/admin";

async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return isAdminEmail(session?.user?.email);
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({
        quests: [
          { id: "quest-1", title: "Deep Focus", description: "Complete 2 focus sessions", type: "daily", xpReward: 50, coinReward: 25, target: 2, skillId: "knowledge", isActive: true, createdAt: new Date().toISOString() },
        ],
      });
    }

    const result = await db
      .prepare(`
        SELECT 
          id,
          title,
          description,
          type,
          xp_reward as xpReward,
          coin_reward as coinReward,
          target,
          skill_id as skillId,
          is_active as isActive,
          created_at as createdAt
        FROM universal_quests
        ORDER BY created_at DESC
      `)
      .all();

    return NextResponse.json({ quests: result.results || [] });
  } catch (error) {
    console.error("Failed to fetch quests:", error);
    return NextResponse.json({ error: "Failed to fetch quests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json() as { title?: string; description?: string; type?: string; xpReward?: number; coinReward?: number; target?: number; skillId?: string };
    const { title, description, type, xpReward, coinReward, target, skillId } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ success: true, quest: { id: `quest-${Date.now()}`, ...body } });
    }

    const session = await auth();
    const adminId = session?.user?.id || "system";
    const id = `quest-${Date.now()}`;

    await db
      .prepare(`
        INSERT INTO universal_quests (id, title, description, type, xp_reward, coin_reward, target, skill_id, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)
      .bind(id, title, description, type || "daily", xpReward || 25, coinReward || 10, target || 1, skillId || null, adminId)
      .run();

    return NextResponse.json({ success: true, quest: { id, ...body } });
  } catch (error) {
    console.error("Failed to create quest:", error);
    return NextResponse.json({ error: "Failed to create quest" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json() as { questId?: string; isActive?: boolean };
    const { questId, isActive } = body;

    if (!questId) {
      return NextResponse.json({ error: "Missing questId" }, { status: 400 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ success: true });
    }

    await db
      .prepare(`UPDATE universal_quests SET is_active = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(isActive ? 1 : 0, questId)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update quest:", error);
    return NextResponse.json({ error: "Failed to update quest" }, { status: 500 });
  }
}
