/**
 * @ignition/api-types
 *
 * Shared API types for Ignition frontend and admin.
 * Single source of truth for request/response types.
 *
 * @example
 * ```typescript
 * import type { User, ApiResponse, FocusSession } from '@ignition/api-types';
 * import { isAllowedMimeType, ApiClientError } from '@ignition/api-types';
 * ```
 */

// ============================================
// Common Types
// ============================================
export type {
  UUID,
  ISOTimestamp,
  JSONValue,
  ApiResponse,
  ApiMeta,
  PaginatedResponse,
  ApiError,
  ApiErrorType,
} from './common.js';

export {
  isSuccess,
  isClientError,
  isServerError,
} from './common.js';

// ============================================
// Auth Types
// ============================================
export type {
  UserRole,
  OAuthProvider,
  User,
  PublicUser,
  Session,
  SessionInfo,
  Account,
  CurrentUserResponse,
  AuthStatusResponse,
  AcceptTosRequest,
  VerifyAgeRequest,
  OAuthSignInResponse,
  AdminUserListResponse,
  AdminUserDetailResponse,
} from './auth.js';

// ============================================
// Storage Types
// ============================================
export type {
  BlobCategory,
  AllowedMimeType,
  UploadUrlRequest,
  UploadResponse,
  BlobInfo,
  SignedUrlResponse,
  DeleteBlobResponse,
  StorageUsageResponse,
  ListBlobsResponse,
  ListBlobsQuery,
} from './storage.js';

export {
  ALLOWED_MIME_TYPES,
  SIZE_LIMITS,
  SIGNED_URL_EXPIRY,
  isAllowedMimeType,
  getCategoryFromMimeType,
  getMaxSizeForMime,
} from './storage.js';

// ============================================
// Focus Types
// ============================================
export type {
  FocusMode,
  FocusSessionStatus,
  FocusSession,
  FocusPauseState,
  CreateFocusRequest,
  CompleteFocusRequest,
  FocusSessionResponse,
  ActiveFocusResponse,
  FocusHistoryResponse,
  FocusStats,
} from './focus.js';

// ============================================
// Gamification Types
// ============================================
export type {
  RewardType,
  TransactionType,
  AchievementCategory,
  UserProgress,
  LevelDefinition,
  XpEvent,
  UserWallet,
  WalletTransaction,
  Achievement,
  UserAchievement,
  AwardXpRequest,
  GamificationSummaryResponse,
  AchievementsResponse,
  XpHistoryResponse,
  WalletTransactionsResponse,
  LeaderboardEntry,
  LeaderboardResponse,
} from './gamification.js';

// ============================================
// Error Utilities
// ============================================
export {
  ApiClientError,
  isApiClientError,
  getErrorMessage,
} from './errors.js';

