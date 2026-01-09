/**
 * Admin Restore API
 * Restores database from backup with version migration
 * Admin-only access
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";

// Current database version
const CURRENT_DB_VERSION = 14;

async function isAdmin(email: string | null | undefined): Promise<boolean> {
  return isAdminEmail(email);
}

interface BackupData {
  version: number;
  versionName: string;
  createdAt: string;
  createdBy?: string;
  tables: Record<string, Record<string, unknown>[]>;
}

/**
 * Migrate data from older versions to current version
 * Each migration function handles upgrading from version N to N+1
 */
function migrateData(backup: BackupData): BackupData {
  const data = { ...backup };
  let version = data.version || 1;

  // Migration: v1-3 -> v4 (add approval columns)
  if (version < 4) {
    data.tables.users = (data.tables.users || []).map((user) => ({
      ...user,
      approved: user.approved ?? 0,
      denial_reason: user.denial_reason ?? null,
    }));
    version = 4;
  }

  // Migration: v4-6 -> v7 (add age verification, universal quests)
  if (version < 7) {
    data.tables.users = (data.tables.users || []).map((user) => ({
      ...user,
      age_verified: user.age_verified ?? 0,
      age_verified_at: user.age_verified_at ?? null,
      role: user.role ?? "user",
    }));
    // Add is_universal to quests
    data.tables.quests = (data.tables.quests || []).map((quest) => ({
      ...quest,
      is_universal: quest.is_universal ?? 0,
      created_by: quest.created_by ?? null,
    }));
    version = 7;
  }

  // Migration: v7-11 -> v12 (add TOS columns)
  if (version < 12) {
    data.tables.users = (data.tables.users || []).map((user) => ({
      ...user,
      tos_accepted: user.tos_accepted ?? 0,
      tos_accepted_at: user.tos_accepted_at ?? null,
      tos_version: user.tos_version ?? null,
    }));
    // Ensure db_metadata exists
    if (!data.tables.db_metadata) {
      data.tables.db_metadata = [];
    }
    version = 12;
  }

  // Migration: v12 -> v13 (add last_activity_at)
  if (version < 13) {
    data.tables.users = (data.tables.users || []).map((user) => ({
      ...user,
      // last_activity_at is derived from activity_events on restore
      // Set to null; will be populated on next activity
      last_activity_at: user.last_activity_at ?? null,
    }));
    version = 13;
  }

  // Migration: v13 -> v14 (performance indexes)
  // No data migration needed - indexes are created by migration SQL
  if (version < 14) {
    version = 14;
  }

  data.version = version;
  return data;
}

/**
 * Insert data into a table
 */
async function insertTableData(
  db: D1Database,
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<{ inserted: number; errors: number }> {
  let inserted = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = columns.map(() => "?").join(", ");

      await db
        .prepare(`INSERT OR REPLACE INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`)
        .bind(...values)
        .run();
      inserted++;
    } catch (e) {
      console.warn(`[admin/restore] Failed to insert into ${tableName}:`, e);
      errors++;
    }
  }

  return { inserted, errors };
}

export async function POST(req: NextRequest) {
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

    // Parse backup data
    const backupData = await req.json() as BackupData;

    if (!backupData.version || !backupData.tables) {
      return NextResponse.json({ error: "Invalid backup format" }, { status: 400 });
    }

    // Migrate data to current version if needed
    const migratedData = backupData.version < CURRENT_DB_VERSION
      ? migrateData(backupData)
      : backupData;

    const results: Record<string, { inserted: number; errors: number }> = {};

    // Restore order matters for foreign keys
    const restoreOrder = [
      "users",
      "accounts",
      "sessions",
      "verification_tokens",
      "skill_definitions",
      "db_metadata",
      "user_progress",
      "quests",
      "user_quest_progress",
      "habits",
      "habit_logs",
      "goals",
      "goal_milestones",
      "focus_sessions",
      "calendar_events",
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
      "user_feedback",
      "activity_events",
      "daily_plans",
      "notifications",
      "infobase_entries",
    ];

    // Restore each table
    for (const tableName of restoreOrder) {
      const tableData = migratedData.tables[tableName];
      if (tableData && tableData.length > 0) {
        results[tableName] = await insertTableData(db, tableName, tableData);
      }
    }

    // Update db_metadata with current version
    await db
      .prepare(`INSERT OR REPLACE INTO db_metadata (key, value, updated_at) VALUES (?, ?, ?)`)
      .bind("db_version", String(CURRENT_DB_VERSION), new Date().toISOString())
      .run();

    await db
      .prepare(`INSERT OR REPLACE INTO db_metadata (key, value, updated_at) VALUES (?, ?, ?)`)
      .bind("last_restore", new Date().toISOString(), new Date().toISOString())
      .run();

    await db
      .prepare(`INSERT OR REPLACE INTO db_metadata (key, value, updated_at) VALUES (?, ?, ?)`)
      .bind("restored_by", session.user.email, new Date().toISOString())
      .run();

    return NextResponse.json({
      success: true,
      originalVersion: backupData.version,
      restoredVersion: CURRENT_DB_VERSION,
      migrated: backupData.version < CURRENT_DB_VERSION,
      results,
    });
  } catch (error) {
    console.error("[admin/restore] Failed to restore backup:", error);
    return NextResponse.json({ error: "Failed to restore backup" }, { status: 500 });
  }
}

