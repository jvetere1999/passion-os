/**
 * User Feedback API
 * Submit bug reports and feature requests
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ensureUserExists } from "@/lib/db/repositories/users";
import type { CloudflareEnv } from "@/env";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as { type?: string; title?: string; description?: string; priority?: string };
    const { type, title, description, priority } = body;

    if (!type || !title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["bug", "feature", "other"].includes(type)) {
      return NextResponse.json({ error: "Invalid feedback type" }, { status: 400 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      // Store locally in development
      return NextResponse.json({ success: true, id: `feedback-${Date.now()}` });
    }

    // Get the database user ID
    const dbUser = await ensureUserExists(db, session.user.id!, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    const id = `feedback-${Date.now()}`;

    await db
      .prepare(`
        INSERT INTO feedback (id, user_id, type, title, description, priority, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'open', datetime('now'), datetime('now'))
      `)
      .bind(id, dbUser.id, type, title, description, priority || "normal")
      .run();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ feedback: [] });
    }

    // Get the database user ID
    const dbUser = await ensureUserExists(db, session.user.id!, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    const result = await db
      .prepare(`
        SELECT 
          id,
          type,
          title,
          description,
          status,
          priority,
          created_at as createdAt
        FROM feedback
        WHERE user_id = ?
        ORDER BY created_at DESC
      `)
      .bind(dbUser.id)
      .all();

    return NextResponse.json({ feedback: result.results || [] });
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

