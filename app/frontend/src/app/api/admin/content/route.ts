/**
 * Admin Content API
 * Manage learn lessons, templates, glossary, etc.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";


function getDB(): D1Database | null {
  const env = (globalThis as unknown as { env?: { DB?: D1Database } }).env;
  return env?.DB || null;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "lessons";

  try {
    const db = getDB();
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    let data;
    switch (type) {
      case "lessons":
        data = await db.prepare(`
          SELECT l.*, t.name as topic_name 
          FROM learn_lessons l
          LEFT JOIN learn_topics t ON l.topic_id = t.id
          ORDER BY t.sort_order, l.sort_order
        `).all();
        break;
      case "drills":
        data = await db.prepare(`
          SELECT d.*, t.name as topic_name 
          FROM learn_drills d
          LEFT JOIN learn_topics t ON d.topic_id = t.id
          ORDER BY t.sort_order, d.sort_order
        `).all();
        break;
      case "topics":
        data = await db.prepare(`
          SELECT * FROM learn_topics ORDER BY sort_order
        `).all();
        break;
      case "templates":
        data = await db.prepare(`
          SELECT * FROM plan_templates ORDER BY category, name
        `).all();
        break;
      case "recipes":
        data = await db.prepare(`
          SELECT * FROM recipe_templates ORDER BY category, name
        `).all();
        break;
      case "glossary":
        data = await db.prepare(`
          SELECT * FROM glossary_terms ORDER BY term
        `).all();
        break;
      case "shortcuts":
        data = await db.prepare(`
          SELECT * FROM daw_shortcuts ORDER BY daw, category, sort_order
        `).all();
        break;
      case "ignitions":
        data = await db.prepare(`
          SELECT * FROM ignition_packs ORDER BY sort_order
        `).all();
        break;
      case "market":
        data = await db.prepare(`
          SELECT * FROM market_items ORDER BY category, sort_order
        `).all();
        break;
      case "achievements":
        data = await db.prepare(`
          SELECT * FROM achievement_definitions ORDER BY sort_order
        `).all();
        break;
      case "infobase":
        data = await db.prepare(`
          SELECT * FROM infobase_entries WHERE is_public = 1 ORDER BY category, title
        `).all();
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ [type]: data.results });
  } catch (error) {
    console.error("Admin content error:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

// Create new content item
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDB();
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }
    const body = await request.json() as { type: string; data: Record<string, unknown> };

    const { type, data } = body;
    const id = `${type}_${Date.now()}`;

    switch (type) {
      case "glossary":
        await db.prepare(`
          INSERT INTO glossary_terms (id, term, definition, category, related_terms)
          VALUES (?, ?, ?, ?, ?)
        `).bind(id, data.term, data.definition, data.category || null, data.related_terms || null).run();
        break;
      case "quest":
        await db.prepare(`
          INSERT INTO quests (id, title, description, category, difficulty, xp_reward, coin_reward, is_universal, is_active, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 'available')
        `).bind(id, data.title, data.description, data.category || 'general', data.difficulty || 'starter',
                data.xp_reward || 20, data.coin_reward || 10).run();
        break;
      case "ignition":
        await db.prepare(`
          INSERT INTO ignition_packs (id, key, name, description, category, items_json, icon, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, data.key, data.name, data.description, data.category || 'general',
                JSON.stringify(data.items || []), data.icon || 'zap', data.sort_order || 99).run();
        break;
      default:
        return NextResponse.json({ error: "Unsupported type for creation" }, { status: 400 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Admin content create error:", error);
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 });
  }
}

// Delete content item
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  try {
    const db = getDB();
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    let table: string;
    switch (type) {
      case "glossary": table = "glossary_terms"; break;
      case "quest": table = "quests"; break;
      case "ignition": table = "ignition_packs"; break;
      case "market": table = "market_items"; break;
      case "achievement": table = "achievement_definitions"; break;
      default:
        return NextResponse.json({ error: "Unsupported type" }, { status: 400 });
    }

    await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin content delete error:", error);
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
  }
}

