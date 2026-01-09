/**
 * User Repository
 * Handles user creation/lookup for JWT session users
 */

import type { D1Database } from "@cloudflare/workers-types";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: number | null;
  image: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
}

/**
 * 48 hours in milliseconds (threshold for "returning after gap")
 */
const GAP_THRESHOLD_MS = 48 * 60 * 60 * 1000;

/**
 * Ensure a user exists in the database
 * Creates the user if they don't exist (for JWT session users)
 * If user exists with same email but different ID, links the session to existing user
 * Returns the user record
 */
export async function ensureUserExists(
  db: D1Database,
  userId: string,
  userData?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
): Promise<User> {
  // Check if user exists by ID
  const existingById = await db
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(userId)
    .first<User>();

  if (existingById) {
    return existingById;
  }

  // Check if user exists by email (different OAuth provider, same email)
  if (userData?.email) {
    const existingByEmail = await db
      .prepare("SELECT * FROM users WHERE email = ?")
      .bind(userData.email)
      .first<User>();

    if (existingByEmail) {
      // User exists with this email but different ID
      // This happens when signing in with different OAuth providers
      // Return the existing user - the session will work with their data
      console.log(`[users] User exists with email ${userData.email}, returning existing user ${existingByEmail.id}`);
      return existingByEmail;
    }
  }

  // Create user if they don't exist
  const now = new Date().toISOString();

  // NEVER create a user without a real email - this indicates a session/auth issue
  if (!userData?.email) {
    console.error(`[users] Cannot create user without email. userId=${userId}, userData=`, userData);
    throw new Error("Cannot create user without email address");
  }

  // Ensure name is not null (schema requires NOT NULL)
  const userName = userData.name || userData.email.split("@")[0] || "User";
  const userEmail = userData.email;

  try {
    await db
      .prepare(
        `INSERT INTO users (id, name, email, image, role, approved, age_verified, tos_accepted, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'user', 1, 1, 0, ?, ?)`
      )
      .bind(
        userId,
        userName,
        userEmail,
        userData?.image || null,
        now,
        now
      )
      .run();
  } catch (insertError) {
    // If insert fails due to UNIQUE constraint on email, fetch existing user
    if (insertError instanceof Error && insertError.message.includes("UNIQUE constraint failed")) {
      console.log(`[users] Insert failed due to UNIQUE constraint, fetching existing user`);
      if (userData?.email) {
        const existingByEmail = await db
          .prepare("SELECT * FROM users WHERE email = ?")
          .bind(userData.email)
          .first<User>();
        if (existingByEmail) {
          return existingByEmail;
        }
      }
    }
    throw insertError;
  }

  // Return the created user
  const user = await db
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(userId)
    .first<User>();

  if (!user) {
    throw new Error("Failed to create user");
  }

  return user;
}

/**
 * Get user by ID
 */
export async function getUserById(
  db: D1Database,
  userId: string
): Promise<User | null> {
  return db
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(userId)
    .first<User>();
}

/**
 * Check if user is returning after a gap (> 48 hours since last activity)
 *
 * Uses users.last_activity_at for O(1) lookup.
 * Falls back to activity_events if column is null (pre-migration users).
 *
 * @param db - D1 database instance
 * @param userId - User ID to check
 * @returns true if last activity was > 48 hours ago, false otherwise
 */
export async function isReturningAfterGap(
  db: D1Database,
  userId: string
): Promise<boolean> {
  try {
    // Get user's last_activity_at
    const user = await db
      .prepare("SELECT last_activity_at FROM users WHERE id = ?")
      .bind(userId)
      .first<{ last_activity_at: string | null }>();

    let lastActivityAt = user?.last_activity_at;

    // Fallback: query activity_events if users.last_activity_at is null
    if (!lastActivityAt) {
      const fallback = await db
        .prepare("SELECT MAX(created_at) as last_date FROM activity_events WHERE user_id = ?")
        .bind(userId)
        .first<{ last_date: string | null }>();
      lastActivityAt = fallback?.last_date || null;
    }

    // No activity recorded - treat as NOT returning after gap (new user)
    if (!lastActivityAt) {
      return false;
    }

    // Calculate time difference in UTC
    const lastActivity = new Date(lastActivityAt);
    const now = new Date();
    const msSinceActivity = now.getTime() - lastActivity.getTime();

    return msSinceActivity >= GAP_THRESHOLD_MS;
  } catch (error) {
    // Gracefully degrade: treat as NOT returning after gap
    console.error("[isReturningAfterGap] Error checking gap:", error);
    return false;
  }
}

/**
 * Update user's last activity timestamp
 *
 * Best-effort update - failure does not propagate to caller.
 * This ensures the primary action (focus complete, habit complete, etc.)
 * is not affected by a failure to update last_activity_at.
 *
 * @param db - D1 database instance
 * @param userId - User ID to update
 * @param timestamp - ISO timestamp (defaults to now)
 */
export async function touchUserActivity(
  db: D1Database,
  userId: string,
  timestamp?: string
): Promise<void> {
  const now = timestamp || new Date().toISOString();
  try {
    await db
      .prepare(
        "UPDATE users SET last_activity_at = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .bind(now, userId)
      .run();
  } catch (error) {
    // Best-effort: log but don't throw
    // Primary action should not fail due to activity tracking
    console.error(
      `[touchUserActivity] Failed to update last_activity_at for user ${userId}:`,
      error
    );
  }
}

