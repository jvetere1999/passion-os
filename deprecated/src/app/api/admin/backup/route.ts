/**
 * Admin Backup API
 * Creates and manages database backups
 * Admin-only access
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";


// Current database version
const CURRENT_DB_VERSION = 14;
const CURRENT_DB_VERSION_NAME = "0014_add_performance_indexes";

// Tables to backup
const BACKUP_TABLES = [
  "users",
  "accounts",
  "sessions",
  "verification_tokens",
  "user_progress",
  "activity_events",
  "focus_sessions",
  "calendar_events",
  "quests",
  "user_quest_progress",
  "habits",
  "habit_logs",
  "goals",
  "goal_milestones",
  "exercises",
  "workouts",
  "workout_sections",
  "workout_exercises",
  "workout_sessions",
  "workout_sets",
  "personal_records",
  "books",
  "reading_sessions",
  "courses",
  "lessons",
  "user_lesson_progress",
  "flashcard_decks",
  "flashcards",
  "journal_entries",
  "rewards",
  "reward_purchases",
  "skill_definitions",
  "user_feedback",
  "daily_plans",
  "notifications",
  "infobase_entries",
  "db_metadata",
];

async function isAdmin(email: string | null | undefined): Promise<boolean> {
  return isAdminEmail(email);
}

export async function POST() {
  const session = await auth();

  if (!session?.user?.email || !await isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const backup: {
      version: number;
      versionName: string;
      createdAt: string;
      createdBy: string;
      tables: Record<string, unknown[]>;
    } = {
      version: CURRENT_DB_VERSION,
      versionName: CURRENT_DB_VERSION_NAME,
      createdAt: new Date().toISOString(),
      createdBy: session.user.email,
      tables: {},
    };

    // Backup each table
    for (const table of BACKUP_TABLES) {
      try {
        const result = await db.prepare(`SELECT * FROM ${table}`).all();
        backup.tables[table] = result.results || [];
      } catch (e) {
        // Table might not exist
        console.warn(`[admin/backup] Table ${table} not found:`, e);
        backup.tables[table] = [];
      }
    }

    // Return backup as downloadable JSON
    const json = JSON.stringify(backup, null, 2);

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="passion-os-backup-v${CURRENT_DB_VERSION}-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("[admin/backup] Failed to create backup:", error);
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.email || !await isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Return current version info
  return NextResponse.json({
    currentVersion: CURRENT_DB_VERSION,
    currentVersionName: CURRENT_DB_VERSION_NAME,
    tables: BACKUP_TABLES,
  });
}

