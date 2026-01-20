/**
 * Ideas API Routes
 * GET /api/ideas - Get all user ideas
 * POST /api/ideas - Create a new idea
 * PUT /api/ideas - Update an idea
 * DELETE /api/ideas - Delete an idea
 */

import { NextResponse } from "next/server";
import { createAPIHandler, type APIContext } from "@/lib/perf";

export const dynamic = "force-dynamic";

interface Idea {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  category: string;
  tags_json: string | null;
  is_pinned: number;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/ideas
 * Get all ideas for the current user
 */
export const GET = createAPIHandler(async (ctx: APIContext) => {
  const result = await ctx.db
    .prepare(`
      SELECT * FROM ideas 
      WHERE user_id = ? 
      ORDER BY is_pinned DESC, created_at DESC
    `)
    .bind(ctx.dbUser.id)
    .all<Idea>();

  const ideas = (result.results || []).map((idea) => ({
    id: idea.id,
    title: idea.title,
    content: idea.content,
    category: idea.category,
    tags: idea.tags_json ? JSON.parse(idea.tags_json) : [],
    isPinned: idea.is_pinned === 1,
    createdAt: idea.created_at,
    updatedAt: idea.updated_at,
  }));

  return NextResponse.json({ ideas });
});

/**
 * POST /api/ideas
 * Create a new idea
 */
export const POST = createAPIHandler(async (ctx: APIContext) => {
  const body = await ctx.request.json() as {
    title: string;
    content?: string;
    category?: string;
    tags?: string[];
    key?: string;
    bpm?: number;
    mood?: string;
  };

  if (!body.title || body.title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Build content from various inputs
  let content = body.content || "";
  if (body.key) content += `\nKey: ${body.key}`;
  if (body.bpm) content += `\nBPM: ${body.bpm}`;
  if (body.mood) content += `\nMood: ${body.mood}`;

  const tags = body.tags || [];
  if (body.mood && !tags.includes(body.mood)) {
    tags.push(body.mood);
  }

  await ctx.db
    .prepare(`
      INSERT INTO ideas (id, user_id, title, content, category, tags_json, is_pinned, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
    `)
    .bind(
      id,
      ctx.dbUser.id,
      body.title.trim(),
      content.trim() || null,
      body.category || "general",
      tags.length > 0 ? JSON.stringify(tags) : null,
      now,
      now
    )
    .run();

  return NextResponse.json({
    success: true,
    idea: {
      id,
      title: body.title.trim(),
      content: content.trim() || null,
      category: body.category || "general",
      tags,
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    },
  });
});

/**
 * PUT /api/ideas
 * Update an existing idea
 */
export const PUT = createAPIHandler(async (ctx: APIContext) => {
  const body = await ctx.request.json() as {
    id: string;
    title?: string;
    content?: string;
    category?: string;
    tags?: string[];
    isPinned?: boolean;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Idea ID is required" }, { status: 400 });
  }

  // Check ownership
  const existing = await ctx.db
    .prepare("SELECT id FROM ideas WHERE id = ? AND user_id = ?")
    .bind(body.id, ctx.dbUser.id)
    .first<{ id: string }>();

  if (!existing) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.title !== undefined) {
    updates.push("title = ?");
    values.push(body.title);
  }
  if (body.content !== undefined) {
    updates.push("content = ?");
    values.push(body.content);
  }
  if (body.category !== undefined) {
    updates.push("category = ?");
    values.push(body.category);
  }
  if (body.tags !== undefined) {
    updates.push("tags_json = ?");
    values.push(JSON.stringify(body.tags));
  }
  if (body.isPinned !== undefined) {
    updates.push("is_pinned = ?");
    values.push(body.isPinned ? 1 : 0);
  }

  updates.push("updated_at = ?");
  values.push(now);
  values.push(body.id);

  await ctx.db
    .prepare(`UPDATE ideas SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return NextResponse.json({ success: true });
});

/**
 * DELETE /api/ideas
 * Delete an idea
 */
export const DELETE = createAPIHandler(async (ctx: APIContext) => {
  const { searchParams } = new URL(ctx.request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Idea ID is required" }, { status: 400 });
  }

  // Check ownership and delete
  const result = await ctx.db
    .prepare("DELETE FROM ideas WHERE id = ? AND user_id = ?")
    .bind(id, ctx.dbUser.id)
    .run();

  if (!result.meta.changes || result.meta.changes === 0) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});

