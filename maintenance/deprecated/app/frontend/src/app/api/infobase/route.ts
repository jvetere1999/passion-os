/**
 * Infobase API Route
 * CRUD for knowledge base entries (D1)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ensureUserExists } from "@/lib/db/repositories/users";
import type { CloudflareEnv } from "@/env";

export const dynamic = "force-dynamic";

interface InfobaseEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/infobase
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ entries: [] });
    }

    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let query = `SELECT * FROM infobase_entries WHERE user_id = ?`;
    const params: string[] = [dbUser.id];

    if (category && category !== "All Entries") {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (title LIKE ? OR content LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY updated_at DESC`;

    const result = await db.prepare(query).bind(...params).all<InfobaseEntry>();
    const entries = (result.results || []).map((e) => ({
      ...e,
      tags: e.tags ? JSON.parse(e.tags) : [],
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("GET /api/infobase error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/infobase
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

    const body = await request.json() as {
      action: string;
      id?: string;
      title?: string;
      content?: string;
      category?: string;
      tags?: string[];
      entries?: Array<{ id: string; title: string; content: string; category?: string; tags?: string[]; createdAt?: string }>;
    };
    const now = new Date().toISOString();

    if (body.action === "create") {
      const id = body.id || `info_${Date.now()}`;
      await db
        .prepare(`INSERT INTO infobase_entries (id, user_id, title, content, category, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, dbUser.id, body.title, body.content, body.category || "Tips", body.tags ? JSON.stringify(body.tags) : null, now, now)
        .run();
      return NextResponse.json({ success: true, id });
    }

    if (body.action === "update") {
      await db
        .prepare(`UPDATE infobase_entries SET title = ?, content = ?, category = ?, tags = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
        .bind(body.title, body.content, body.category || "Tips", body.tags ? JSON.stringify(body.tags) : null, now, body.id, dbUser.id)
        .run();
      return NextResponse.json({ success: true });
    }

    if (body.action === "delete") {
      await db.prepare(`DELETE FROM infobase_entries WHERE id = ? AND user_id = ?`).bind(body.id, dbUser.id).run();
      return NextResponse.json({ success: true });
    }

    if (body.action === "sync") {
      for (const entry of body.entries || []) {
        await db
          .prepare(`INSERT OR REPLACE INTO infobase_entries (id, user_id, title, content, category, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(entry.id, dbUser.id, entry.title, entry.content, entry.category || "Tips", entry.tags ? JSON.stringify(entry.tags) : null, entry.createdAt || now, now)
          .run();
      }
      return NextResponse.json({ success: true, synced: (body.entries || []).length });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/infobase error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
