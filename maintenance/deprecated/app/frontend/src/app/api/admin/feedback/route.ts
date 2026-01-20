/**
 * Admin Feedback API
 * Manage user feedback (bug reports, feature requests)
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
      return NextResponse.json({ feedback: [] });
    }

    const result = await db
      .prepare(`
        SELECT 
          f.id,
          f.user_id as userId,
          u.email as userEmail,
          f.type,
          f.title,
          f.description,
          f.status,
          f.priority,
          f.created_at as createdAt
        FROM feedback f
        LEFT JOIN users u ON f.user_id = u.id
        ORDER BY 
          CASE f.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
          f.created_at DESC
      `)
      .all();

    return NextResponse.json({ feedback: result.results || [] });
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json() as { feedbackId?: string; status?: string; adminNotes?: string };
    const { feedbackId, status, adminNotes } = body;

    if (!feedbackId) {
      return NextResponse.json({ error: "Missing feedbackId" }, { status: 400 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ success: true });
    }

    const session = await auth();
    const adminId = session?.user?.id;

    if (status === "resolved") {
      await db
        .prepare(`
          UPDATE feedback 
          SET status = ?, admin_notes = ?, resolved_by = ?, resolved_at = datetime('now'), updated_at = datetime('now')
          WHERE id = ?
        `)
        .bind(status, adminNotes || null, adminId, feedbackId)
        .run();
    } else {
      await db
        .prepare(`UPDATE feedback SET status = ?, updated_at = datetime('now') WHERE id = ?`)
        .bind(status, feedbackId)
        .run();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update feedback:", error);
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
  }
}

