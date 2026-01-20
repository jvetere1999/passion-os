/**
 * Admin Skills API
 * Manage skill definitions and XP scaling
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
    const ctx = await getCloudflareContext(); const db = (ctx.env as unknown as CloudflareEnv).DB;
    

    if (!db) {
      return NextResponse.json({
        skills: [
          { id: "proficiency", name: "Proficiency", description: "Task completion", color: "#ef4444", maxLevel: 10, xpScalingBase: 100, xpScalingMultiplier: 1.5, displayOrder: 0, isActive: true },
          { id: "knowledge", name: "Knowledge", description: "Focus sessions", color: "#3b82f6", maxLevel: 10, xpScalingBase: 100, xpScalingMultiplier: 1.5, displayOrder: 1, isActive: true },
          { id: "guts", name: "Guts", description: "Exercise", color: "#f59e0b", maxLevel: 10, xpScalingBase: 100, xpScalingMultiplier: 1.5, displayOrder: 2, isActive: true },
          { id: "kindness", name: "Kindness", description: "Helping others", color: "#10b981", maxLevel: 10, xpScalingBase: 100, xpScalingMultiplier: 1.5, displayOrder: 3, isActive: true },
          { id: "charm", name: "Charm", description: "Social activities", color: "#ec4899", maxLevel: 10, xpScalingBase: 100, xpScalingMultiplier: 1.5, displayOrder: 4, isActive: true },
        ],
      });
    }

    const result = await db
      .prepare(`
        SELECT 
          id,
          name,
          description,
          color,
          max_level as maxLevel,
          xp_scaling_base as xpScalingBase,
          xp_scaling_multiplier as xpScalingMultiplier,
          display_order as displayOrder,
          is_active as isActive
        FROM skill_definitions
        ORDER BY display_order ASC
      `)
      .all();

    return NextResponse.json({ skills: result.results || [] });
  } catch (error) {
    console.error("Failed to fetch skills:", error);
    return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json() as { id?: string; name?: string; description?: string; color?: string; maxLevel?: number; xpScalingBase?: number; xpScalingMultiplier?: number };
    const { id, name, description, color, maxLevel, xpScalingBase, xpScalingMultiplier } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ctx = await getCloudflareContext(); const db = (ctx.env as unknown as CloudflareEnv).DB;
    

    if (!db) {
      return NextResponse.json({ success: true, skill: body });
    }

    // Get next display order
    const orderResult = await db.prepare(`SELECT MAX(display_order) as maxOrder FROM skill_definitions`).first<{ maxOrder: number }>();
    const displayOrder = (orderResult?.maxOrder || 0) + 1;

    await db
      .prepare(`
        INSERT OR REPLACE INTO skill_definitions 
        (id, name, description, color, max_level, xp_scaling_base, xp_scaling_multiplier, display_order, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `)
      .bind(id, name, description || null, color || "#8b5cf6", maxLevel || 10, xpScalingBase || 100, xpScalingMultiplier || 1.5, displayOrder)
      .run();

    return NextResponse.json({ success: true, skill: body });
  } catch (error) {
    console.error("Failed to save skill:", error);
    return NextResponse.json({ error: "Failed to save skill" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json() as {
      id?: string;
      name?: string;
      description?: string;
      maxLevel?: number;
      xpScalingBase?: number;
      xpScalingMultiplier?: number;
      color?: string;
      isActive?: boolean;
      displayOrder?: number;
    };
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing skill id" }, { status: 400 });
    }

    const ctx = await getCloudflareContext(); const db = (ctx.env as unknown as CloudflareEnv).DB;
    

    if (!db) {
      return NextResponse.json({ success: true });
    }

    // Build dynamic update query
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.maxLevel !== undefined) {
      fields.push("max_level = ?");
      values.push(updates.maxLevel);
    }
    if (updates.xpScalingBase !== undefined) {
      fields.push("xp_scaling_base = ?");
      values.push(updates.xpScalingBase);
    }
    if (updates.xpScalingMultiplier !== undefined) {
      fields.push("xp_scaling_multiplier = ?");
      values.push(updates.xpScalingMultiplier);
    }
    if (updates.color !== undefined) {
      fields.push("color = ?");
      values.push(updates.color);
    }
    if (updates.isActive !== undefined) {
      fields.push("is_active = ?");
      values.push(updates.isActive ? 1 : 0);
    }
    if (updates.displayOrder !== undefined) {
      fields.push("display_order = ?");
      values.push(updates.displayOrder);
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);

      await db
        .prepare(`UPDATE skill_definitions SET ${fields.join(", ")} WHERE id = ?`)
        .bind(...values)
        .run();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update skill:", error);
    return NextResponse.json({ error: "Failed to update skill" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing skill id" }, { status: 400 });
    }

    const ctx = await getCloudflareContext(); const db = (ctx.env as unknown as CloudflareEnv).DB;


    if (!db) {
      return NextResponse.json({ success: true });
    }

    await db
      .prepare(`DELETE FROM skill_definitions WHERE id = ?`)
      .bind(id)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete skill:", error);
    return NextResponse.json({ error: "Failed to delete skill" }, { status: 500 });
  }
}

