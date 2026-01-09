# API Endpoint Inventory

**Generated:** January 6, 2026  
**Source:** `src/app/api/**/*.ts` scan

This document provides a complete inventory of all API endpoints in the current Next.js application.

---

## Summary

- **Total Routes:** 55 route handlers
- **Domains:** 22 functional areas
- **Auth Patterns:** 2 (public, user-authenticated, admin-authenticated)
- **R2 Usage:** 6 routes directly access R2

---

## Complete Endpoint Table

| Route Path | Methods | Auth | D1 Tables | R2 | Runtime | Dependencies | Notes |
|------------|---------|------|-----------|-----|---------|--------------|-------|
| `/api/auth/[...nextauth]` | GET, POST | Public | users, accounts, sessions | No | Edge | next-auth, D1Adapter | OAuth callbacks, session management |
| `/api/auth/accept-tos` | GET, POST | User | users | No | Edge | createAPIHandler | TOS acceptance tracking |
| `/api/auth/verify-age` | POST | User | users | No | Edge | - | Age verification flag |
| `/api/admin/backup` | GET | Admin | All tables | No | Edge | isAdminEmail | Full database backup |
| `/api/admin/cleanup-users` | POST | Admin | users, accounts, sessions | No | Edge | isAdminEmail | Delete orphaned users |
| `/api/admin/content` | GET, POST, DELETE | Admin | Various content tables | No | Edge | isAdminEmail | Manage static content |
| `/api/admin/db-health` | GET | Admin | db_metadata | No | Edge | isAdminEmail | Database health check |
| `/api/admin/feedback` | GET | Admin | feedback | No | Edge | isAdminEmail | View user feedback |
| `/api/admin/quests` | GET, POST | Admin | universal_quests | No | Edge | isAdminEmail | Manage universal quests |
| `/api/admin/restore` | POST | Admin | All tables | No | Edge | isAdminEmail | Restore from backup |
| `/api/admin/skills` | GET, POST | Admin | skill_definitions | No | Edge | isAdminEmail | Manage skills |
| `/api/admin/stats` | GET | Admin | Various | No | Edge | isAdminEmail | Dashboard statistics |
| `/api/admin/users` | GET, DELETE | Admin | users, all user data | No | Edge | isAdminEmail | User management |
| `/api/analysis` | GET, POST | User | track_analysis_cache | No | Edge | - | Track analysis |
| `/api/blobs/[id]` | GET, DELETE, HEAD | User | - | Yes | Edge | R2 getBlobById | Blob download/delete |
| `/api/blobs/upload` | POST | User | - | Yes | Edge | R2 uploadBlob | Blob upload |
| `/api/books` | GET, POST | User | books, reading_sessions | No | Edge | ensureUserExists | Book tracking |
| `/api/calendar` | GET, POST, PUT, DELETE | User | calendar_events | No | Edge | ensureUserExists | Calendar CRUD |
| `/api/daily-plan` | GET, POST | User | daily_plans | No | Edge | createAPIHandler | Daily planning |
| `/api/exercise` | GET, POST, PUT, DELETE | User | exercises, workouts, workout_sessions, exercise_sets, personal_records | No | Edge | ensureUserExists | Exercise/workout tracking |
| `/api/exercise/seed` | POST | Admin | exercises | No | Edge | - | Seed exercise database |
| `/api/feedback` | GET, POST | User | feedback | No | Edge | ensureUserExists | Submit feedback |
| `/api/focus` | GET, POST | User | focus_sessions | No | Edge | createAPIHandler | Focus session CRUD |
| `/api/focus/[id]/abandon` | POST | User | focus_sessions | No | Edge | createAPIHandler | Abandon session |
| `/api/focus/[id]/complete` | POST | User | focus_sessions, points_ledger | No | Edge | createAPIHandler | Complete session |
| `/api/focus/active` | GET | User | focus_sessions | No | Edge | createAPIHandler | Get active session |
| `/api/focus/pause` | GET, POST, DELETE | User | focus_pause_state | No | Edge | createAPIHandler | Pause state management |
| `/api/gamification/teaser` | GET | User | achievement_definitions, user_achievements | No | Edge | createAPIHandler | Next achievement teaser |
| `/api/goals` | GET, POST | User | goals, goal_milestones | No | Edge | ensureUserExists | Goals CRUD |
| `/api/habits` | GET, POST | User | habits, habit_logs, user_streaks | No | Edge | createAPIHandler | Habits CRUD + logging |
| `/api/ideas` | GET, POST, PUT, DELETE | User | ideas | No | Edge | createAPIHandler | Ideas CRUD |
| `/api/infobase` | GET, POST, PUT, DELETE | User | infobase_entries | No | Edge | ensureUserExists | Knowledge base CRUD |
| `/api/learn` | GET | User | learn_topics, learn_lessons | No | Node | - | Learning dashboard |
| `/api/learn/progress` | GET, POST | User | user_lesson_progress, user_drill_stats | No | Edge | - | Learning progress |
| `/api/learn/review` | GET, POST | User | flashcards, flashcard_decks | No | Edge | - | Spaced repetition |
| `/api/market` | GET | User | market_items, user_wallet, user_purchases | No | Edge | getUserWallet | Market overview |
| `/api/market/items` | GET | User | market_items | No | Edge | - | List market items |
| `/api/market/purchase` | POST | User | market_items, user_wallet, user_purchases, points_ledger | No | Edge | - | Purchase item |
| `/api/market/redeem` | POST | User | user_purchases | No | Edge | - | Redeem purchase |
| `/api/onboarding` | GET | User | user_onboarding_state, onboarding_flows, onboarding_steps | No | Edge | - | Get onboarding state |
| `/api/onboarding/reset` | POST | User | user_onboarding_state | No | Edge | - | Reset onboarding |
| `/api/onboarding/skip` | POST | User | user_onboarding_state | No | Edge | - | Skip onboarding |
| `/api/onboarding/start` | POST | User | user_onboarding_state | No | Edge | - | Start onboarding |
| `/api/onboarding/step` | POST | User | user_onboarding_state, user_settings, user_interests | No | Edge | - | Complete step |
| `/api/programs` | GET, POST | User | training_programs, program_weeks, program_workouts | No | Edge | - | Training programs |
| `/api/quests` | GET, POST | User | universal_quests, user_quest_progress | No | Edge | createAPIHandler | Quests + progress |
| `/api/reference/tracks` | GET, POST | User | reference_tracks | No | Edge | createAPIHandler | List/create tracks |
| `/api/reference/tracks/[id]` | GET, PATCH, DELETE | User | reference_tracks | Yes | Edge | createAPIHandler, R2 | Track CRUD |
| `/api/reference/tracks/[id]/analysis` | GET, POST | User | track_analysis_cache | No | Edge | - | Track analysis |
| `/api/reference/tracks/[id]/play` | GET | User | reference_tracks | Yes | Edge | R2 | Play audio |
| `/api/reference/tracks/[id]/stream` | GET | User | reference_tracks | Yes | Edge | R2 | Stream audio |
| `/api/reference/upload` | POST | User | reference_tracks | Yes | Edge | R2 | Upload track |
| `/api/reference/upload/init` | POST | User | - | No | Edge | createAPIHandler | Upload init |
| `/api/user/delete` | DELETE | User | All user tables | No | Edge | - | Delete account |
| `/api/user/export` | GET | User | All user tables | No | Edge | - | Export user data |

---

## Authentication Patterns

### Pattern 1: Public Routes
```typescript
// No auth check required
export async function GET() {
  return NextResponse.json({ ... });
}
```

**Routes using this pattern:**
- `/api/auth/[...nextauth]` (handles its own auth)

### Pattern 2: User-Authenticated (via auth())
```typescript
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

**Routes using this pattern:**
- Most routes (45+)

### Pattern 3: User-Authenticated (via createAPIHandler)
```typescript
import { createAPIHandler, type APIContext } from "@/lib/perf";

export const GET = createAPIHandler(async (ctx: APIContext) => {
  // ctx.session, ctx.db, ctx.dbUser already validated
  return NextResponse.json({ ... });
});
```

**Routes using this pattern:**
- `/api/focus/*`
- `/api/habits`
- `/api/ideas`
- `/api/daily-plan`
- `/api/quests`
- `/api/reference/tracks/*`
- `/api/gamification/teaser`
- `/api/auth/accept-tos`

### Pattern 4: Admin-Authenticated
```typescript
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return isAdminEmail(session?.user?.email);
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  // ...
}
```

**Routes using this pattern:**
- All `/api/admin/*` routes

---

## D1 Table Access by Route

| Table | Routes Accessing |
|-------|-----------------|
| `users` | auth/*, admin/users, admin/cleanup-users, admin/backup, user/delete |
| `accounts` | auth/*, admin/users |
| `sessions` | auth/* |
| `user_settings` | onboarding/step |
| `user_interests` | onboarding/step |
| `user_ui_modules` | onboarding/step |
| `user_onboarding_state` | onboarding/* |
| `onboarding_flows` | onboarding/* |
| `onboarding_steps` | onboarding/* |
| `focus_sessions` | focus/* |
| `focus_pause_state` | focus/pause |
| `quests` | quests |
| `universal_quests` | quests, admin/quests |
| `user_quest_progress` | quests |
| `habits` | habits |
| `habit_logs` | habits |
| `user_streaks` | habits |
| `goals` | goals |
| `goal_milestones` | goals |
| `calendar_events` | calendar |
| `exercises` | exercise, exercise/seed |
| `workouts` | exercise |
| `workout_sessions` | exercise |
| `exercise_sets` | exercise |
| `personal_records` | exercise |
| `books` | books |
| `reading_sessions` | books |
| `learn_topics` | learn |
| `learn_lessons` | learn |
| `user_lesson_progress` | learn/progress |
| `user_drill_stats` | learn/progress |
| `flashcard_decks` | learn/review |
| `flashcards` | learn/review |
| `market_items` | market, market/items, market/purchase |
| `user_wallet` | market, market/purchase |
| `user_purchases` | market, market/purchase, market/redeem |
| `points_ledger` | focus/complete, market/purchase |
| `achievement_definitions` | gamification/teaser |
| `user_achievements` | gamification/teaser |
| `skill_definitions` | admin/skills |
| `infobase_entries` | infobase |
| `ideas` | ideas |
| `daily_plans` | daily-plan |
| `training_programs` | programs |
| `program_weeks` | programs |
| `program_workouts` | programs |
| `reference_tracks` | reference/*, reference/upload |
| `track_analysis_cache` | analysis, reference/tracks/[id]/analysis |
| `feedback` | feedback, admin/feedback |
| `activity_events` | user/export, focus |

---

## R2 Access Patterns

### Direct R2 Access Routes

| Route | Operation | Key Pattern | Size Limit |
|-------|-----------|-------------|------------|
| `POST /api/blobs/upload` | PUT | `{userId}/{category}/{uuid}.{ext}` | 100MB |
| `GET /api/blobs/[id]` | GET | `{userId}/*/{id}.*` | - |
| `DELETE /api/blobs/[id]` | DELETE | `{userId}/*/{id}.*` | - |
| `POST /api/reference/upload` | PUT | `{userId}/audio/{uuid}.{ext}` | 50MB |
| `GET /api/reference/tracks/[id]/stream` | GET | from D1 `r2_key` column | - |
| `GET /api/reference/tracks/[id]/play` | GET | from D1 `r2_key` column | - |

### R2 Authorization Flow

1. Request arrives with session cookie
2. `auth()` validates session, extracts `userId`
3. For blobs: key prefix includes `userId`, only owner's blobs accessible
4. For tracks: D1 query confirms `user_id` matches session user

---

## Runtime Breakdown

| Runtime | Count | Routes |
|---------|-------|--------|
| Edge (default) | 54 | All except /api/learn |
| Node.js | 1 | `/api/learn` |

**Note:** The `/api/learn` route explicitly sets `export const runtime = "nodejs"`. This will need special handling in the Rust backend (or conversion to edge-compatible).

---

## Streaming/Long-Task Routes

| Route | Type | Notes |
|-------|------|-------|
| `/api/blobs/[id]` | Streaming response | Returns R2Object body |
| `/api/reference/tracks/[id]/stream` | Streaming + Range requests | Supports audio seeking |
| `/api/reference/tracks/[id]/play` | Streaming | Full file streaming |
| `/api/admin/backup` | Large response | Full DB dump |
| `/api/user/export` | Large response | All user data |

---

## Request/Response Schemas

### Common Response Patterns

**Success:**
```json
{ "success": true, "data": { ... } }
// or
{ "items": [...], "total": 123 }
// or
{ ... direct entity ... }
```

**Error:**
```json
{ "error": "Error message" }
// Status codes: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (internal)
```

### Key Request Bodies

**POST /api/focus:**
```typescript
{
  mode?: "focus" | "break" | "long_break";
  planned_duration?: number;  // seconds, default 1500 (25 min)
  metadata?: Record<string, unknown>;
}
```

**POST /api/quests:**
```typescript
{
  type: "progress" | "complete";
  questId: string;
  progress?: number;
  xpReward?: number;
  coinReward?: number;
  skillId?: string;
}
```

**POST /api/habits:**
```typescript
{
  action: "create" | "log" | "update" | "delete";
  id?: string;
  habit_id?: string;  // for log
  title?: string;
  description?: string;
  frequency?: string;
  target_count?: number;
}
```

**POST /api/market/purchase:**
```typescript
{
  itemId: string;
}
```

**POST /api/onboarding/step:**
```typescript
{
  stepId: string;
  responses?: Record<string, unknown>;
}
```

---

## Dependencies per Route

### Heavy Dependencies (appearing in 10+ routes)

| Dependency | Usage |
|------------|-------|
| `auth()` from `@/lib/auth` | Session validation |
| `getCloudflareContext()` | D1/R2 access |
| `ensureUserExists()` | User creation on demand |
| `NextResponse.json()` | Response formatting |

### Specialized Dependencies

| Dependency | Routes Using |
|------------|--------------|
| `createAPIHandler` | 15 routes |
| `isAdminEmail` | 9 admin routes |
| `logActivityEvent` | focus, habits |
| `awardPoints` | focus/complete, market/purchase |
| `uploadBlob` / `getBlobById` | blobs/*, reference/* |

---

## Migration Priority

### Priority 1: Core (Must migrate first)
- `/api/auth/*` - Foundation for all other routes
- `/api/focus/*` - Core user feature
- `/api/quests` - Gamification integration
- `/api/market/*` - Wallet/economy

### Priority 2: User Features
- `/api/habits`
- `/api/goals`
- `/api/calendar`
- `/api/books`
- `/api/exercise/*`

### Priority 3: Content & Learning
- `/api/learn/*`
- `/api/infobase`
- `/api/ideas`
- `/api/daily-plan`

### Priority 4: Storage
- `/api/blobs/*`
- `/api/reference/*`
- `/api/analysis`

### Priority 5: Admin
- `/api/admin/*` (can run on legacy during transition)

---

*End of API Endpoint Inventory*

