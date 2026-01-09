/**
 * Admin Stats API
 * Returns comprehensive system statistics
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";


export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const env = (globalThis as unknown as { env?: { DB?: D1Database } }).env;
    const db = env?.DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Get comprehensive stats
    const [
      userStats,
      contentStats,
      activityStats,
      gamificationStats,
    ] = await Promise.all([
      // User stats
      db.prepare(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN tos_accepted = 1 THEN 1 END) as tos_accepted,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
          COUNT(CASE WHEN last_activity_at > datetime('now', '-7 days') THEN 1 END) as active_7d,
          COUNT(CASE WHEN last_activity_at > datetime('now', '-30 days') THEN 1 END) as active_30d
        FROM users
      `).first(),

      // Content stats
      db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM exercises) as exercises,
          (SELECT COUNT(*) FROM learn_topics) as learn_topics,
          (SELECT COUNT(*) FROM learn_lessons) as learn_lessons,
          (SELECT COUNT(*) FROM learn_drills) as learn_drills,
          (SELECT COUNT(*) FROM quests WHERE is_universal = 1) as universal_quests,
          (SELECT COUNT(*) FROM quests WHERE is_universal = 0) as user_quests,
          (SELECT COUNT(*) FROM ignition_packs) as ignition_packs,
          (SELECT COUNT(*) FROM market_items) as market_items,
          (SELECT COUNT(*) FROM plan_templates) as plan_templates,
          (SELECT COUNT(*) FROM infobase_entries WHERE is_public = 1) as infobase_public,
          (SELECT COUNT(*) FROM glossary_terms) as glossary_terms,
          (SELECT COUNT(*) FROM daw_shortcuts) as daw_shortcuts,
          (SELECT COUNT(*) FROM recipe_templates) as recipe_templates
      `).first(),

      // Activity stats
      db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM focus_sessions) as total_focus_sessions,
          (SELECT COUNT(*) FROM focus_sessions WHERE status = 'completed') as completed_focus,
          (SELECT SUM(duration) FROM focus_sessions WHERE status = 'completed') / 60 as total_focus_minutes,
          (SELECT COUNT(*) FROM activity_events) as total_events,
          (SELECT COUNT(*) FROM activity_events WHERE created_at > datetime('now', '-24 hours')) as events_24h,
          (SELECT COUNT(*) FROM habit_logs) as habit_completions,
          (SELECT COUNT(*) FROM goals) as total_goals,
          (SELECT COUNT(*) FROM ideas) as total_ideas,
          (SELECT COUNT(*) FROM books) as total_books,
          (SELECT COUNT(*) FROM reference_tracks) as reference_tracks
      `).first(),

      // Gamification stats
      db.prepare(`
        SELECT 
          (SELECT SUM(coins) FROM user_wallet) as total_coins_distributed,
          (SELECT SUM(xp) FROM user_wallet) as total_xp_distributed,
          (SELECT COUNT(*) FROM user_achievements) as achievements_earned,
          (SELECT COUNT(*) FROM user_purchases) as total_purchases,
          (SELECT COUNT(*) FROM points_ledger) as ledger_entries
      `).first(),
    ]);

    // Get recent activity
    const recentUsers = await db.prepare(`
      SELECT id, name, email, created_at, last_activity_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();

    const recentEvents = await db.prepare(`
      SELECT ae.event_type, ae.created_at, u.email
      FROM activity_events ae
      LEFT JOIN users u ON ae.user_id = u.id
      ORDER BY ae.created_at DESC
      LIMIT 20
    `).all();

    // Get onboarding stats
    const onboardingStats = await db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM user_onboarding_state
      GROUP BY status
    `).all();

    return NextResponse.json({
      users: userStats,
      content: contentStats,
      activity: activityStats,
      gamification: gamificationStats,
      onboarding: onboardingStats.results,
      recentUsers: recentUsers.results,
      recentEvents: recentEvents.results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

