/**
 * Auth.js configuration for Passion OS
 * Uses D1 adapter for session/user storage
 */

import NextAuth from "next-auth";
import { D1Adapter } from "@auth/d1-adapter";
import type { NextAuthConfig } from "next-auth";
import type { D1Database } from "@cloudflare/workers-types";
import { getProviders } from "./providers";

/**
 * Extended session type to include user ID and approval status
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      approved?: boolean;
      ageVerified?: boolean;
    };
  }
  interface User {
    approved?: boolean;
    ageVerified?: boolean;
  }
}


/**
 * Helper to get D1 database from Cloudflare environment
 * Returns null if not available (e.g., during build or local development)
 */
function getD1Database(): D1Database | null {
  try {
    const env = (globalThis as unknown as { env?: { DB?: D1Database } }).env;
    return env?.DB ?? null;
  } catch {
    return null;
  }
}

// Track if we've logged the D1 warning
let hasLoggedD1Warning = false;

/**
 * Create auth configuration based on environment
 * Uses D1 adapter when available, falls back to JWT when not
 */
function createRuntimeConfig(): NextAuthConfig {
  const db = getD1Database();

  // Secure cookies require HTTPS; disable on localhost
  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "";
  const isLocal = authUrl.startsWith("http://localhost") || authUrl.startsWith("http://127.0.0.1");
  const useSecureCookies = process.env.NODE_ENV === "production" && !isLocal;

  // Debug logging (remove after fixing)
  if (!hasLoggedD1Warning) {
    console.log("[auth] Config:", {
      nodeEnv: process.env.NODE_ENV,
      authUrl,
      isLocal,
      useSecureCookies,
      hasD1: !!db,
    });
    hasLoggedD1Warning = true;
  }

  // Base configuration shared by both modes
  const baseConfig: NextAuthConfig = {
    providers: getProviders(),
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
    trustHost: true,
    debug: process.env.NODE_ENV === "development",
    callbacks: {
      // Control who can sign in - log user data and reject only if no email
      signIn: async ({ user, account, profile }) => {
        // Log full sign-in attempt for debugging
        console.log("[auth] signIn callback:", {
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          provider: account?.provider,
          profileName: (profile as { name?: string })?.name,
          profileEmail: (profile as { email?: string })?.email,
        });

        // Reject sign-in attempts without a valid email
        if (!user?.email) {
          console.error("[auth] Rejected sign-in attempt without email");
          return false;
        }
        return true;
      },
      // Redirect after sign in - strict validation to prevent open redirects
      redirect: ({ url, baseUrl }) => {
        // Parse URLs safely
        try {
          const targetUrl = new URL(url, baseUrl);
          const base = new URL(baseUrl);

          // Only allow redirects to same origin
          if (targetUrl.origin === base.origin) {
            // Prevent protocol-relative URLs that could bypass origin check
            if (!url.startsWith("//")) {
              return targetUrl.href;
            }
          }

          // Relative paths are safe
          if (url.startsWith("/") && !url.startsWith("//")) {
            return `${baseUrl}${url}`;
          }
        } catch {
          // Invalid URL, fallback to base
        }

        // Default to baseUrl for any suspicious input
        return baseUrl;
      },
    },
    cookies: {
      sessionToken: {
        name: "passion-os.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: useSecureCookies,
        },
      },
      callbackUrl: {
        name: "passion-os.callback-url",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: useSecureCookies,
        },
      },
      csrfToken: {
        name: "passion-os.csrf-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: useSecureCookies,
        },
      },
    },
  };

  if (db) {
    // Production mode with D1 adapter
    return {
      ...baseConfig,
      adapter: D1Adapter(db),
      session: {
        strategy: "database",
        maxAge: 30 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
      },
      events: {
        // When a new user is created, set initial values and create settings
        createUser: async ({ user }) => {
          // Log user data for debugging
          console.log("[auth] createUser event fired:", {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          });

          // User must have at least an ID to proceed
          if (!user.id) {
            console.error("[auth] CRITICAL: User created without ID");
            return;
          }

          // INVARIANT: User must have email (enforced by signIn callback)
          if (!user.email) {
            console.error("[auth] CRITICAL: User created without email - this should never happen");
            // Attempt to delete the orphaned user
            try {
              await db.prepare(`DELETE FROM users WHERE id = ?`).bind(user.id).run();
              console.log("[auth] Deleted orphaned user without email");
            } catch (e) {
              console.error("[auth] Failed to delete orphaned user:", e);
            }
            return;
          }

          try {
            // Derive name from email if missing - NEVER allow NULL name
            const userName = user.name || user.email.split("@")[0] || "User";

            // Check if user is an admin
            const adminEmails = (process.env.ADMIN_EMAILS || "")
              .split(",")
              .map((e) => e.trim().toLowerCase())
              .filter((e) => e.length > 0);
            const isAdmin = adminEmails.includes(user.email.toLowerCase());

            const role = isAdmin ? "admin" : "user";
            const tosAccepted = isAdmin ? 1 : 0;
            const now = new Date().toISOString();

            console.log(`[auth] Initializing user: ${user.email} (${userName}), admin=${isAdmin}`);

            // Update the user with proper values - ensure name is NEVER NULL
            await db
              .prepare(`
                UPDATE users 
                SET name = ?,
                    approved = 1,
                    age_verified = 1,
                    role = ?,
                    tos_accepted = ?,
                    tos_accepted_at = ${isAdmin ? "?" : "NULL"},
                    tos_version = ${isAdmin ? "'1.0'" : "NULL"},
                    last_activity_at = ?,
                    updated_at = ? 
                WHERE id = ?
              `)
              .bind(
                userName,
                role,
                tosAccepted,
                ...(isAdmin ? [now] : []),
                now,
                now,
                user.id
              )
              .run();

            // Create user_settings with defaults
            await db
              .prepare(`
                INSERT OR IGNORE INTO user_settings (id, user_id, created_at, updated_at)
                VALUES (?, ?, ?, ?)
              `)
              .bind(
                `settings_${user.id}`,
                user.id,
                now,
                now
              )
              .run();

            // Create user_wallet with starting balance
            await db
              .prepare(`
                INSERT OR IGNORE INTO user_wallet (id, user_id, coins, xp, level, xp_to_next_level, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `)
              .bind(
                `wallet_${user.id}`,
                user.id,
                0,  // Starting coins
                0,  // Starting XP
                1,  // Starting level
                100, // XP needed for level 2
                now
              )
              .run();

            // Create initial onboarding state
            await db
              .prepare(`
                INSERT OR IGNORE INTO user_onboarding_state (id, user_id, flow_id, status, created_at, updated_at)
                VALUES (?, ?, 'flow_main_v1', 'not_started', ?, ?)
              `)
              .bind(
                `onboarding_${user.id}`,
                user.id,
                now,
                now
              )
              .run();

            console.log(`[auth] User initialized: ${user.email}, settings/wallet/onboarding created`);
          } catch (e) {
            console.error("[auth] Failed to initialize user:", e);
          }
        },
      },
      callbacks: {
        ...baseConfig.callbacks,
        // Sync user profile data on every sign-in and handle account linking
        signIn: async ({ user, account, profile }) => {
          // Log sign-in for debugging
          console.log("[auth] signIn callback (database mode):", {
            userId: user?.id,
            userName: user?.name,
            userEmail: user?.email,
            provider: account?.provider,
            profileName: (profile as { name?: string })?.name,
            profileEmail: (profile as { email?: string })?.email,
          });

          // Reject if no email - STRICT requirement
          const email = user?.email || (profile as { email?: string })?.email;
          if (!email) {
            console.error("[auth] Rejected sign-in: no email provided");
            return "/auth/error?error=NoEmail";
          }

          // Reject if no name - derive from email if needed
          const name = user?.name || (profile as { name?: string })?.name || email.split("@")[0] || "User";

          try {
            // Check if user already exists with this email (for account linking)
            const existingUser = await db
              .prepare(`SELECT id, name, email FROM users WHERE email = ?`)
              .bind(email.toLowerCase())
              .first<{ id: string; name: string; email: string }>();

            if (existingUser && account) {
              // Check if this account is already linked
              const existingAccount = await db
                .prepare(`SELECT id FROM accounts WHERE provider = ? AND providerAccountId = ?`)
                .bind(account.provider, account.providerAccountId)
                .first<{ id: string }>();

              if (!existingAccount) {
                // Link this new provider to existing user
                console.log(`[auth] Linking ${account.provider} account to existing user: ${email}`);

                const accountId = crypto.randomUUID();
                await db
                  .prepare(`
                    INSERT INTO accounts (id, userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `)
                  .bind(
                    accountId,
                    existingUser.id,
                    account.type || "oauth",
                    account.provider,
                    account.providerAccountId,
                    null, // Don't store tokens for security
                    null,
                    account.expires_at || null,
                    account.token_type || null,
                    account.scope || null,
                    null, // Don't store id_token
                    account.session_state || null,
                    new Date().toISOString()
                  )
                  .run();

                console.log(`[auth] Account linked successfully`);
              }

              // Update last activity
              await db
                .prepare(`UPDATE users SET last_activity_at = ?, updated_at = ? WHERE id = ?`)
                .bind(new Date().toISOString(), new Date().toISOString(), existingUser.id)
                .run();
            }

            // Update user's name from profile if missing in DB
            if (user?.id && name) {
              await db
                .prepare(`UPDATE users SET name = COALESCE(NULLIF(name, ''), ?) WHERE id = ?`)
                .bind(name, user.id)
                .run();
            }
          } catch (e) {
            console.error("[auth] Account linking error:", e);
            // Don't fail sign-in for linking errors - allow it to proceed
          }

          return true;
        },
        // Add user ID and approval status to session for database sessions
        session: async ({ session, user }) => {
          // Fetch approval status from users table
          let approved = false;
          let ageVerified = false;

          try {
            const userRecord = await db
              .prepare(`SELECT approved, age_verified FROM users WHERE id = ?`)
              .bind(user.id)
              .first<{ approved: number; age_verified: number }>();

            if (userRecord) {
              approved = userRecord.approved === 1;
              ageVerified = userRecord.age_verified === 1;
            }
          } catch (e) {
            console.error("[auth] Failed to fetch user approval status:", e);
          }

          return {
            ...session,
            user: {
              ...session.user,
              id: user.id,
              approved,
              ageVerified,
            },
          };
        },
      },
    };
  }

  // Fallback to JWT sessions when D1 is not available
  // This allows local development and build-time operations to work
  if (!hasLoggedD1Warning) {
    console.log("[auth] D1 not available, using JWT sessions");
    hasLoggedD1Warning = true;
  }

  return {
    ...baseConfig,
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {
      ...baseConfig.callbacks,
      // For JWT mode, include user info in token
      jwt: ({ token, user, account }) => {
        // Initial sign in - add user data to token
        if (account && user) {
          return {
            ...token,
            id: user.id,
            name: user.name,
            email: user.email,
            picture: user.image,
            // In JWT mode without D1, assume approved for development
            approved: true,
            ageVerified: true,
          };
        }
        return token;
      },
      // Add user ID to session for JWT sessions
      session: ({ session, token }) => ({
        ...session,
        user: {
          ...session.user,
          id: token.id as string ?? token.sub ?? "",
          name: token.name,
          email: token.email,
          image: token.picture as string | undefined,
          approved: token.approved as boolean ?? true,
          ageVerified: token.ageVerified as boolean ?? true,
        },
      }),
    },
  };
}

/**
 * Export auth handlers and helpers
 * Configuration is created at runtime to access D1 binding
 */
export const { handlers, auth, signIn, signOut } = NextAuth(createRuntimeConfig);

/**
 * Get the current session (server-side)
 */
export { auth as getSession };

