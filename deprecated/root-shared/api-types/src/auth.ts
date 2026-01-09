/**
 * Authentication and User types
 *
 * Mirrors Rust types in:
 * - app/backend/crates/api/src/db/models.rs (User, Session, Account)
 * - app/backend/crates/api/src/middleware/auth.rs (AuthContext)
 * - app/backend/crates/api/src/routes/auth.rs (request/response types)
 */

import type { UUID, ISOTimestamp } from './common.js';

// ============================================
// Enums
// ============================================

/**
 * User role enum
 * Matches Rust UserRole
 */
export type UserRole = 'user' | 'moderator' | 'admin';

/**
 * OAuth provider enum
 */
export type OAuthProvider = 'google' | 'azure';

// ============================================
// User Entity
// ============================================

/**
 * User entity
 * Matches Rust User struct
 */
export interface User {
  id: UUID;
  name: string;
  email: string;
  email_verified?: ISOTimestamp;
  image?: string;
  role: UserRole;
  approved: boolean;
  age_verified: boolean;
  tos_accepted: boolean;
  tos_accepted_at?: ISOTimestamp;
  tos_version?: string;
  last_activity_at?: ISOTimestamp;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

/**
 * Public user info (safe to expose)
 */
export interface PublicUser {
  id: UUID;
  name: string;
  image?: string;
}

// ============================================
// Session Entity
// ============================================

/**
 * Session entity
 * Matches Rust Session struct
 */
export interface Session {
  id: UUID;
  user_id: UUID;
  token: string;
  expires_at: ISOTimestamp;
  created_at: ISOTimestamp;
  last_activity_at: ISOTimestamp;
  user_agent?: string;
  ip_address?: string;
}

/**
 * Session info returned to client (token excluded)
 */
export interface SessionInfo {
  id: UUID;
  user_id: UUID;
  expires_at: ISOTimestamp;
  created_at: ISOTimestamp;
  last_activity_at: ISOTimestamp;
}

// ============================================
// OAuth Account Entity
// ============================================

/**
 * OAuth account link
 * Matches Rust Account struct
 */
export interface Account {
  id: UUID;
  user_id: UUID;
  account_type: string;
  provider: OAuthProvider;
  provider_account_id: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

// ============================================
// Auth Request/Response Types
// ============================================

/**
 * Current user response (GET /api/user/me)
 */
export interface CurrentUserResponse {
  user: User;
  entitlements: string[];
}

/**
 * Auth status response (GET /auth/status)
 */
export interface AuthStatusResponse {
  authenticated: boolean;
  user?: PublicUser;
}

/**
 * Accept TOS request (POST /auth/accept-tos)
 */
export interface AcceptTosRequest {
  version: string;
}

/**
 * Verify age request (POST /auth/verify-age)
 */
export interface VerifyAgeRequest {
  confirmed: boolean;
}

/**
 * OAuth sign-in response (redirect info)
 */
export interface OAuthSignInResponse {
  redirect_url: string;
}

// ============================================
// Admin Auth Types
// ============================================

/**
 * Admin user list response
 */
export interface AdminUserListResponse {
  users: User[];
  total: number;
}

/**
 * Admin user detail response
 */
export interface AdminUserDetailResponse {
  user: User;
  accounts: Account[];
  sessions: SessionInfo[];
}

