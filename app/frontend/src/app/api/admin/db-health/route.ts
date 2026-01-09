/**
 * Admin API: Database Health Check
 * Returns diagnostic information about database integrity
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return isAdminEmail(session?.user?.email);
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const env = (globalThis as unknown as { env?: { DB?: D1Database } }).env;
    const db = env?.DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Run diagnostic queries
    const diagnostics: Record<string, unknown> = {};

    // 1. Users with NULL values
    const nullUsers = await db
      .prepare(`
        SELECT id, name, email, created_at, role, approved 
        FROM users 
        WHERE name IS NULL OR email IS NULL
        ORDER BY created_at DESC
      `)
      .all();
    diagnostics.nullUsers = {
      count: nullUsers.results?.length || 0,
      users: nullUsers.results || [],
    };

    // 2. Total user count
    const totalUsers = await db
      .prepare(`SELECT COUNT(*) as count FROM users`)
      .first<{ count: number }>();
    diagnostics.totalUsers = totalUsers?.count || 0;

    // 3. Users without accounts (orphaned users)
    const orphanedUsers = await db
      .prepare(`
        SELECT u.id, u.email, u.name, u.created_at 
        FROM users u
        LEFT JOIN accounts a ON u.id = a.userId
        WHERE a.id IS NULL
      `)
      .all();
    diagnostics.orphanedUsers = {
      count: orphanedUsers.results?.length || 0,
      users: orphanedUsers.results || [],
    };

    // 4. Accounts without users (orphaned accounts)
    const orphanedAccounts = await db
      .prepare(`
        SELECT a.id, a.userId, a.provider, a.providerAccountId 
        FROM accounts a
        LEFT JOIN users u ON a.userId = u.id
        WHERE u.id IS NULL
      `)
      .all();
    diagnostics.orphanedAccounts = {
      count: orphanedAccounts.results?.length || 0,
      accounts: orphanedAccounts.results || [],
    };

    // 5. Expired sessions
    const expiredSessions = await db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM sessions 
        WHERE datetime(expires) < datetime('now')
      `)
      .first<{ count: number }>();
    diagnostics.expiredSessions = expiredSessions?.count || 0;

    // 6. Active sessions
    const activeSessions = await db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM sessions 
        WHERE datetime(expires) > datetime('now')
      `)
      .first<{ count: number }>();
    diagnostics.activeSessions = activeSessions?.count || 0;

    // 7. Users by provider
    const usersByProvider = await db
      .prepare(`
        SELECT a.provider, COUNT(DISTINCT a.userId) as user_count
        FROM accounts a
        GROUP BY a.provider
      `)
      .all();
    diagnostics.usersByProvider = usersByProvider.results || [];

    // 8. Recent user signups (last 7 days)
    const recentSignups = await db
      .prepare(`
        SELECT id, name, email, created_at, role
        FROM users
        WHERE datetime(created_at) > datetime('now', '-7 days')
        ORDER BY created_at DESC
      `)
      .all();
    diagnostics.recentSignups = {
      count: recentSignups.results?.length || 0,
      users: recentSignups.results || [],
    };

    // 9. Users with TOS accepted
    const tosAccepted = await db
      .prepare(`SELECT COUNT(*) as count FROM users WHERE tos_accepted = 1`)
      .first<{ count: number }>();
    diagnostics.tosAccepted = tosAccepted?.count || 0;

    // 10. Admin users
    const adminUsers = await db
      .prepare(`SELECT id, name, email FROM users WHERE role = 'admin'`)
      .all();
    diagnostics.adminUsers = {
      count: adminUsers.results?.length || 0,
      users: adminUsers.results || [],
    };

    // Summary
    diagnostics.summary = {
      healthy: (diagnostics.nullUsers as { count: number }).count === 0 &&
               (diagnostics.orphanedUsers as { count: number }).count === 0 &&
               (diagnostics.orphanedAccounts as { count: number }).count === 0,
      issues: [
        ...(diagnostics.nullUsers as { count: number }).count > 0
          ? [`${(diagnostics.nullUsers as { count: number }).count} users with NULL name/email`]
          : [],
        ...(diagnostics.orphanedUsers as { count: number }).count > 0
          ? [`${(diagnostics.orphanedUsers as { count: number }).count} users without linked accounts`]
          : [],
        ...(diagnostics.orphanedAccounts as { count: number }).count > 0
          ? [`${(diagnostics.orphanedAccounts as { count: number }).count} orphaned account records`]
          : [],
        ...((diagnostics.expiredSessions as number) > 100)
          ? [`${diagnostics.expiredSessions} expired sessions need cleanup`]
          : [],
      ],
    };

    return NextResponse.json(diagnostics);

  } catch (error) {
    console.error("[db-health] Error:", error);
    return NextResponse.json(
      { error: "Failed to run database health check" },
      { status: 500 }
    );
  }
}

// Cleanup action - DELETE expired sessions and orphaned data
export async function DELETE() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const env = (globalThis as unknown as { env?: { DB?: D1Database } }).env;
    const db = env?.DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const results: Record<string, number> = {};

    // 1. Delete expired sessions
    const expiredResult = await db
      .prepare(`DELETE FROM sessions WHERE datetime(expires) < datetime('now')`)
      .run();
    results.expiredSessionsDeleted = expiredResult.meta?.changes || 0;

    // 2. Delete orphaned accounts (accounts pointing to non-existent users)
    const orphanedAccountsResult = await db
      .prepare(`
        DELETE FROM accounts 
        WHERE userId NOT IN (SELECT id FROM users)
      `)
      .run();
    results.orphanedAccountsDeleted = orphanedAccountsResult.meta?.changes || 0;

    // 3. Delete orphaned sessions (sessions pointing to non-existent users)
    const orphanedSessionsResult = await db
      .prepare(`
        DELETE FROM sessions 
        WHERE userId NOT IN (SELECT id FROM users)
      `)
      .run();
    results.orphanedSessionsDeleted = orphanedSessionsResult.meta?.changes || 0;

    return NextResponse.json({
      message: "Cleanup completed",
      results,
    });

  } catch (error) {
    console.error("[db-health] Cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to run database cleanup" },
      { status: 500 }
    );
  }
}
