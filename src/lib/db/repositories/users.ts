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
}

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
  try {
    await db
      .prepare(
        `INSERT INTO users (id, name, email, image, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        userId,
        userData?.name || null,
        userData?.email || null,
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

