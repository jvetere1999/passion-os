/**
 * Admin API: Clean up null users
 * Removes user accounts without email or name
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function DELETE(_request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated and admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    if (!adminEmails.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get D1 database
    const env = (globalThis as unknown as { env?: { DB?: D1Database } }).env;
    const db = env?.DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Find users without email or name
    const nullUsers = await db
      .prepare(`
        SELECT id, name, email, created_at 
        FROM users 
        WHERE email IS NULL OR name IS NULL 
        ORDER BY created_at DESC
      `)
      .all();

    if (!nullUsers.results || nullUsers.results.length === 0) {
      return NextResponse.json({
        message: "No null users found",
        cleaned: 0
      });
    }

    console.log(`[cleanup] Found ${nullUsers.results.length} users with null email/name`);

    // Delete related records first (to maintain referential integrity)
    for (const user of nullUsers.results) {
      const userId = (user as { id: string }).id;

      // Delete from accounts table
      await db
        .prepare(`DELETE FROM accounts WHERE userId = ?`)
        .bind(userId)
        .run();

      // Delete from sessions table
      await db
        .prepare(`DELETE FROM sessions WHERE userId = ?`)
        .bind(userId)
        .run();

      // Delete from verification_tokens if exists
      try {
        await db
          .prepare(`DELETE FROM verification_tokens WHERE identifier = ?`)
          .bind(userId)
          .run();
      } catch {
        // Table might not exist, ignore
      }
    }

    // Now delete the users
    const userIds = nullUsers.results.map(u => (u as { id: string }).id);
    const placeholders = userIds.map(() => "?").join(",");

    const result = await db
      .prepare(`DELETE FROM users WHERE id IN (${placeholders})`)
      .bind(...userIds)
      .run();

    const deletedCount = result.meta?.changes ?? userIds.length;
    console.log(`[cleanup] Deleted ${deletedCount} null users and their related data`);

    return NextResponse.json({
      message: `Cleaned up ${deletedCount} users with null email/name`,
      cleaned: deletedCount,
      deletedUsers: nullUsers.results.map(u => ({
        id: (u as { id: string }).id,
        name: (u as { name: string | null }).name,
        email: (u as { email: string | null }).email,
        created_at: (u as { created_at: string }).created_at,
      }))
    });

  } catch (error) {
    console.error("[cleanup] Failed to clean null users:", error);
    return NextResponse.json(
      { error: "Failed to clean null users" },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated and admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    if (!adminEmails.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get D1 database
    const env = (globalThis as unknown as { env?: { DB?: D1Database } }).env;
    const db = env?.DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Find users without email or name, including their linked accounts
    const nullUsers = await db
      .prepare(`
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.created_at, 
          u.updated_at,
          a.provider,
          a.providerAccountId
        FROM users u
        LEFT JOIN accounts a ON u.id = a.userId
        WHERE u.email IS NULL OR u.name IS NULL 
        ORDER BY u.created_at DESC
      `)
      .all();

    // Also get total user count for context
    const totalUsers = await db
      .prepare(`SELECT COUNT(*) as count FROM users`)
      .first<{ count: number }>();

    // Get recent sessions to see if null users have active sessions
    const nullUserIds = [...new Set((nullUsers.results || []).map(u => (u as { id: string }).id))];
    let activeSessions: unknown[] = [];
    if (nullUserIds.length > 0) {
      const placeholders = nullUserIds.map(() => "?").join(",");
      const sessionsResult = await db
        .prepare(`SELECT userId, expires FROM sessions WHERE userId IN (${placeholders})`)
        .bind(...nullUserIds)
        .all();
      activeSessions = sessionsResult.results || [];
    }

    return NextResponse.json({
      nullUsers: nullUsers.results || [],
      count: nullUserIds.length,
      totalUsers: totalUsers?.count || 0,
      activeSessions,
      message: "Use DELETE method to remove these users"
    });

  } catch (error) {
    console.error("[cleanup] Failed to fetch null users:", error);
    return NextResponse.json(
      { error: "Failed to fetch null users" },
      { status: 500 }
    );
  }
}
