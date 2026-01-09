/**
 * Goals API Route
 * CRUD operations for user goals
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ensureUserExists } from "@/lib/db/repositories/users";
import type { CloudflareEnv } from "@/env";

export const dynamic = "force-dynamic";

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string | null;
  milestones: string; // JSON string
  completed: number;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/goals
 * List all goals for the user
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ goals: [] });
    }

    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    const result = await db
      .prepare(`
        SELECT id, title, description, category, deadline, milestones, completed, created_at, updated_at
        FROM goals
        WHERE user_id = ?
        ORDER BY created_at DESC
      `)
      .bind(dbUser.id)
      .all<Goal>();

    // Parse milestones JSON
    const goals = (result.results || []).map((g) => ({
      ...g,
      milestones: g.milestones ? JSON.parse(g.milestones) : [],
      completed: g.completed === 1,
    }));

    return NextResponse.json({ goals });
  } catch (error) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/goals
 * Create or update a goal
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ success: true, persisted: false });
    }

    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const now = new Date().toISOString();

    if (body.action === "create") {
      const id = body.id || `goal_${Date.now()}`;
      await db
        .prepare(`
          INSERT INTO goals (id, user_id, title, description, category, deadline, milestones, completed, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        `)
        .bind(
          id,
          dbUser.id,
          body.title,
          body.description || "",
          body.category || "personal",
          body.deadline || null,
          JSON.stringify(body.milestones || []),
          now,
          now
        )
        .run();

      return NextResponse.json({ success: true, id });
    }

    if (body.action === "update") {
      await db
        .prepare(`
          UPDATE goals 
          SET title = ?, description = ?, category = ?, deadline = ?, milestones = ?, completed = ?, updated_at = ?
          WHERE id = ? AND user_id = ?
        `)
        .bind(
          body.title,
          body.description || "",
          body.category,
          body.deadline || null,
          JSON.stringify(body.milestones || []),
          body.completed ? 1 : 0,
          now,
          body.id,
          dbUser.id
        )
        .run();

      return NextResponse.json({ success: true });
    }

    if (body.action === "delete") {
      await db
        .prepare(`DELETE FROM goals WHERE id = ? AND user_id = ?`)
        .bind(body.id, dbUser.id)
        .run();

      return NextResponse.json({ success: true });
    }

    if (body.action === "sync") {
      // Bulk sync all goals from client
      const goals = body.goals || [];
      for (const goal of goals) {
        await db
          .prepare(`
            INSERT OR REPLACE INTO goals (id, user_id, title, description, category, deadline, milestones, completed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            goal.id,
            dbUser.id,
            goal.title,
            goal.description || "",
            goal.category || "personal",
            goal.deadline || null,
            JSON.stringify(goal.milestones || []),
            goal.completed ? 1 : 0,
            goal.createdAt || now,
            now
          )
          .run();
      }
      return NextResponse.json({ success: true, synced: goals.length });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

