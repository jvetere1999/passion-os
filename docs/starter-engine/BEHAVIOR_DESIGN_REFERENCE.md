# Starter Engine: Behavior Design Reference (Corrected)

> **Purpose**: This document provides the theoretical foundations and evidence-based frameworks that inform Ignition's "Starter Engine" mechanics—features designed to help users initiate tasks, overcome procrastination, and build momentum.

---

## Overview

"Starter Engine" is our term for software patterns that reduce the friction of beginning tasks. While not a standard industry term, it draws from established fields:

* **Behavior Design** — Making starting easier
* **Implementation Intentions** — Converting intentions to action
* **Behavioral Activation** — Clinical approaches to momentum
* **Productivity Systems** — Next-action thinking

---

## Ignition Product Glossary

These are the direct product terms used in Ignition's codebase that map to the behavior design concepts:

| Product Term                   | Definition                                                         | Theory Basis                                     | Flag/Module                       | Status         |
| ------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------ | --------------------------------- | -------------- |
| **Starter Block**        | Primary CTA widget on Today page showing the next action           | GTD Next Actions, Fogg Prompt                    | `StarterBlock.tsx`              | ✅ IMPLEMENTED |
| **Soft Landing**         | Reduced-choice Today page after completing/abandoning first action | Implementation Intentions, BA momentum           | `TODAY_SOFT_LANDING_V1`         | ✅ IMPLEMENTED |
| **Momentum Feedback**    | "Good start." banner shown once per session after first completion | Tiny Habits celebration, BA upward spiral        | `TODAY_MOMENTUM_FEEDBACK_V1`    | ✅ IMPLEMENTED |
| **Decision Suppression** | State-driven visibility that hides sections based on user context  | Fogg Ability (reduce choices), COM-B Opportunity | `TODAY_DECISION_SUPPRESSION_V1` | ✅ IMPLEMENTED |
| **Next Action Resolver** | Pure function that deterministically selects the single next CTA   | GTD Next Action, Fogg Prompt                     | `TODAY_NEXT_ACTION_RESOLVER_V1` | ✅ IMPLEMENTED |
| **Reduced Mode**         | Simplified Today view for users returning after 48+ hours          | BA Gradual Activation, Fogg tiny start           | `TODAY_REDUCED_MODE_V1`         | ✅ IMPLEMENTED |
| **Dynamic UI**           | Personalized quick picks based on 14-day usage patterns            | BCT Self-monitoring, Fogg Anchoring              | `TODAY_DYNAMIC_UI_V1`           | ✅ IMPLEMENTED |
| **Quest**                | Goal-oriented task with objectives and rewards                     | BCT Goal Setting, WOOP Wish                      | `quests` table                  | ✅ IMPLEMENTED |
| **Focus Session**        | Timed deep work block (Pomodoro-style)                             | BA Activity Scheduling, BCT Behavioral practice  | `/focus` route                  | ✅ IMPLEMENTED |
| **Daily Plan**           | Prioritized list of today's intended completions                   | GTD Next Actions, Implementation Intentions      | `DailyPlanWidget`               | ✅ IMPLEMENTED |
| **Explore Drawer**       | Discovery section for new activities                               | COM-B Opportunity, BCT Adding objects            | `ExploreDrawer`                 | ✅ IMPLEMENTED |

---

## Behavioral Mechanics (What Each Feature DOES)

### Starter Block — "Remove the Question of What to Do"

**Behavioral Problem Solved**: Decision paralysis at app open. Users see a dashboard and freeze: "What should I do first?"

**What It Does**:

1. On page load, queries `daily_plans` for today's items
2. Runs `resolveStarterAction()` to pick ONE action (never multiple)
3. Displays a large, visually dominant button with that single CTA
4. User taps → immediately enters flow (Focus, Quest, etc.)

**Behavioral Mechanism** (Fogg Model):

- **Prompt**: The Starter Block IS the prompt — it appears automatically
- **Ability**: Maximum — one tap, no decisions required
- **Motivation**: Irrelevant — so easy that even low motivation succeeds

**Code Flow**:

```
User opens /today
  → StarterBlock.tsx:155 fetches /api/daily-plan
  → StarterBlock.tsx:178 calls resolveStarterAction(plan)
  → resolveNextAction.ts:287 returns { href, label, type }
  → User sees: [▶ Continue: Review inbox] (single button)
```

---

### Soft Landing — "Don't Restart the Decision Engine"

**Behavioral Problem Solved**: After completing a task, users return to Today and face decision paralysis again. "I just finished Focus, now what?" leads to abandonment.

**What It Does**:

1. When user completes Focus/Quest/etc., redirect includes `?mode=soft&from=focus`
2. `TodayGridClient.tsx:77` detects URL params, calls `activateSoftLanding('focus')`
3. Sets `sessionStorage['passion_soft_landing_v1'] = '1'`
4. Today page renders with collapsed sections, hidden rewards, minimal choices
5. Starter Block still shows — user can immediately chain to next action
6. If user expands any section, `clearSoftLanding()` restores full view

**Behavioral Mechanism** (Implementation Intentions):

- Pre-commits user to "If I complete action, I see reduced choices"
- Prevents the "browsing" behavior that leads to disengagement
- Maintains momentum by keeping the next action front-and-center

**Code Flow**:

```
User completes Focus session
  → focus.rs redirects to /today?mode=soft&from=focus
  → TodayGridClient.tsx:77-99 parses params
  → softLanding.ts:56 activateSoftLanding('focus')
  → TodayGridClient.tsx:112-114 applies overrides:
      effectiveReducedMode = true
      effectiveForceDailyPlanCollapsed = true
      effectiveForceExploreCollapsed = true
```

---

### Momentum Feedback — "Acknowledge the Win Without Overdoing It"

**Behavioral Problem Solved**: Gamification can feel patronizing ("You earned 50 XP! 🎉"). But NO feedback feels cold. Users need acknowledgment that's respectful.

**What It Does**:

1. On first completion of session (Focus, Quest, Habit, etc.)
2. `markMomentumShown()` sets `sessionStorage['passion_momentum_v1'] = 'shown'`
3. `MomentumBanner.tsx` displays: "Good start." (exactly 2 words, neutral tone)
4. User can dismiss with X button → sets state to 'dismissed'
5. Never shows again until new browser session

**Behavioral Mechanism** (Tiny Habits):

- **Celebration**: Immediate positive signal after behavior
- **Non-gamified**: No XP, coins, streaks shown — respects adult users
- **Once per session**: Doesn't become annoying or expected

**Code Flow**:

```
User completes first action
  → Activity event logged to activity_events table
  → Client detects completion (via polling or redirect)
  → momentum.ts:56 markMomentumShown()
  → MomentumBanner.tsx:34 reads getMomentumState() === 'shown'
  → Renders: [ Good start.  ✕ ]
```

---

### Decision Suppression — "Show Less, Not More"

**Behavioral Problem Solved**: Dashboards overwhelm. Seeing Quests, Habits, Goals, Learn, Focus, Explore all at once triggers analysis paralysis.

**What It Does**:

1. Server computes `TodayUserState` from 4 database queries (parallel)
2. `getTodayVisibility(state)` returns visibility rules based on priority:
   - `focus_active` → Hide everything except "Return to Focus"
   - `first_day` → Hide DailyPlan, Rewards; show only StarterBlock + Explore
   - `returning_after_gap` → Show ReducedModeBanner, collapse everything
   - `plan_exists` → Normal view with plan emphasized
   - `active_streak` → Engaged user, show rewards
3. `TodayGridClient` receives visibility props, conditionally renders sections

**Behavioral Mechanism** (Fogg Ability + COM-B Opportunity):

- **Reduce choices** = Increase ability
- **Remove distractions** = Shape opportunity
- **Context-aware** = Right content at right time

**Code Flow**:

```
Server renders /today
  → dailyPlans.ts:269 getTodayServerState(db, userId, returningAfterGap)
      → Promise.all([
          getDailyPlanSummary(db, userId),  // daily_plans
          isFirstDay(db, userId),           // activity_events COUNT
          hasFocusActive(db, userId),       // focus_sessions.status
          hasActiveStreak(db, userId)       // user_streaks.current_streak
        ])
  → todayVisibility.ts:103 getTodayVisibility(state)
  → Returns: { showStarterBlock: true, showDailyPlan: false, ... }
  → TodayGridClient.tsx renders based on visibility props
```

---

### Reduced Mode — "Welcome Back Without Shame"

**Behavioral Problem Solved**: User hasn't opened app in 3+ days. Full dashboard feels overwhelming and triggers guilt. "I fell off the wagon."

**What It Does**:

1. On login, API checks `users.last_activity_at`
2. If > 48 hours since last activity, sets `returningAfterGap = true`
3. `getTodayVisibility()` returns `resolvedState: 'returning_after_gap'`
4. `ReducedModeBanner.tsx` shows: "Welcome back. Start small."
5. Provides two gentle CTAs: "5 min focus" and "Quick quest"
6. All other sections collapsed (not hidden) — user can expand if ready

**Behavioral Mechanism** (Behavioral Activation):

- **Gradual activation**: Start with tiny commitment after inactivity
- **No shame language**: "Welcome back" not "You missed 5 days!"
- **User control**: Sections collapsed, not deleted — autonomy preserved

**Code Flow**:

```
User logs in after 72-hour gap
  → Auth middleware computes hoursSinceActivity > 48
  → Server passes returningAfterGap: true to getTodayServerState()
  → todayVisibility.ts:141 returns 'returning_after_gap' state
  → ReducedModeBanner.tsx renders with suggestions
  → User clicks "5 min focus" → enters Focus with 5:00 timer
```

---

### Dynamic UI — "Show What You Actually Use"

**Behavioral Problem Solved**: Generic quick-access buttons (Focus, Learn, Quests) don't match individual usage. User who never uses Learn sees it anyway.

**What It Does**:

1. Queries `activity_events` for last 14 days of user activity
2. `getQuickPicks()`: Groups by event_type, returns top 2 modules by frequency
3. `getResumeLast()`: Finds most recent activity within 24h
4. `getInterestPrimer()`: Suggests Learn or Hub based on usage patterns
5. `QuickPicks.tsx`, `ResumeLast.tsx`, `InterestPrimer.tsx` render personalized CTAs

**Behavioral Mechanism** (BCT Self-monitoring + Fogg Anchoring):

- **Self-monitoring**: System reflects user's actual behavior back to them
- **Anchoring**: "You often do Focus at this time" → triggers behavior
- **Reduced friction**: One tap to most-used features

**Code Flow**:

```
Server renders /today (flag: TODAY_DYNAMIC_UI_V1)
  → dailyPlans.ts:566 getDynamicUIData(db, userId)
      → Promise.all([
          getQuickPicks(db, userId),      // GROUP BY event_type, 14 days
          getResumeLast(db, userId),      // ORDER BY created_at DESC, 24h
          getInterestPrimer(db, userId)   // COUNT lesson/focus events
        ])
  → Returns: { quickPicks: [{module:'focus', count:23}], resumeLast: {...}, ... }
  → QuickPicks.tsx renders: [Focus (23)] [Exercise (12)]
```

---

### Next Action Resolver — "Deterministic, No Randomness"

**Behavioral Problem Solved**: If the "next action" changes randomly or based on complex logic, users lose trust. "Why did it show me X yesterday but Y today?"

**What It Does**:

1. Pure function: same input → always same output
2. Priority chain (deterministic):
   - If plan has incomplete items → first incomplete by priority number
   - Else if has active quests → "Continue quest"
   - Else → "Start Focus" (default)
3. Includes `validateResolverOutput()` safety net

**Behavioral Mechanism** (GTD + Trust):

- **Clarity**: User always knows what's next without thinking
- **Trust**: Predictable system = user relies on it
- **No gaming**: Can't "refresh to get different suggestion"

**Code Flow**:

```
resolveNextAction.ts:287 resolveStarterAction(plan)
  → If plan?.items has incompletes:
      → Sort by priority (lower = higher priority)
      → Return first incomplete: { href: item.actionUrl, label: item.title }
  → Else:
      → Return default: { href: '/focus', label: 'Start Focus', type: 'focus' }

StarterBlock.tsx:178-182:
  if (isTodayNextActionResolverEnabled()) {
    starter = validateResolverOutput(resolveStarterAction(plan));
  } else {
    starter = getSimpleStarterAction(plan);  // Legacy fallback
  }
```

### Frontend Components (React/Next.js)

| Component              | File Path                                  | Database Queries           | R2 Storage | Status |
| ---------------------- | ------------------------------------------ | -------------------------- | ---------- | ------ |
| `StarterBlock`       | `app/(app)/today/StarterBlock.tsx`       | Uses `DailyPlan` via API | None       | ✅     |
| `DailyPlanWidget`    | `app/(app)/today/DailyPlan.tsx`          | `GET /api/daily-plan`    | None       | ✅     |
| `MomentumBanner`     | `app/(app)/today/MomentumBanner.tsx`     | sessionStorage only        | None       | ✅     |
| `ReducedModeBanner`  | `app/(app)/today/ReducedModeBanner.tsx`  | sessionStorage only        | None       | ✅     |
| `ReducedModeContext` | `app/(app)/today/ReducedModeContext.tsx` | Server-computed state      | None       | ✅     |
| `ExploreDrawer`      | `app/(app)/today/ExploreDrawer.tsx`      | Props from parent          | None       | ✅     |
| `TodayGridClient`    | `app/(app)/today/TodayGridClient.tsx`    | Orchestrates all           | None       | ✅     |
| `QuickPicks`         | `app/(app)/today/QuickPicks.tsx`         | `DynamicUIData`          | None       | ✅     |
| `ResumeLast`         | `app/(app)/today/ResumeLast.tsx`         | `DynamicUIData`          | None       | ✅     |
| `InterestPrimer`     | `app/(app)/today/InterestPrimer.tsx`     | `DynamicUIData`          | None       | ✅     |

### Frontend Libraries (Pure Functions)

| Module                | File Path                                  | Purpose                                | Database       | Status |
| --------------------- | ------------------------------------------ | -------------------------------------- | -------------- | ------ |
| `todayVisibility`   | `lib/today/todayVisibility.ts`           | `getTodayVisibility()` pure function | Input only     | ✅     |
| `softLanding`       | `lib/today/softLanding.ts`               | Session state management               | sessionStorage | ✅     |
| `momentum`          | `lib/today/momentum.ts`                  | Session-scoped feedback                | sessionStorage | ✅     |
| `resolveNextAction` | `lib/today/resolveNextAction.ts`         | `resolveStarterAction()`             | Input only     | ✅     |
| `dailyPlans` (repo) | `lib/db/repositories/dailyPlans.ts`      | Server-side queries                    | D1 → Postgres | ✅     |
| `activity-events`   | `lib/db/repositories/activity-events.ts` | Event logging + rewards                | D1 → Postgres | ✅     |

### Backend API Routes (Rust/Axum)

| Route                        | File Path                | Database Table                                | R2 Storage | Status |
| ---------------------------- | ------------------------ | --------------------------------------------- | ---------- | ------ |
| `GET/POST /api/daily-plan` | `routes/daily_plan.rs` | `daily_plans`                               | None       | ✅     |
| `GET/POST /api/focus/*`    | `routes/focus.rs`      | `focus_sessions`, `focus_pauses`          | None       | ✅     |
| `GET/POST /api/quests/*`   | `routes/quests.rs`     | `universal_quests`, `user_quest_progress` | None       | ✅     |
| `GET/POST /api/habits/*`   | `routes/habits.rs`     | `habits`, `habit_logs`                    | None       | ✅     |
| `GET/POST /api/goals/*`    | `routes/goals.rs`      | `goals`                                     | None       | ✅     |

### Database Schema (PostgreSQL)

| Table                   | Migration                           | Purpose               | Starter Engine Use              |
| ----------------------- | ----------------------------------- | --------------------- | ------------------------------- |
| `daily_plans`         | `0006_planning_substrate.sql`     | User daily plans      | Daily Plan, Starter Block       |
| `focus_sessions`      | `0003_focus_substrate.sql`        | Focus session records | Focus Session                   |
| `focus_pauses`        | `0003_focus_substrate.sql`        | Pause state tracking  | Focus Session pause/resume      |
| `universal_quests`    | `0005_quests_substrate.sql`       | Quest definitions     | Quest system                    |
| `user_quest_progress` | `0005_quests_substrate.sql`       | User progress         | Quest progress tracking         |
| `activity_events`     | `0001_auth_substrate.sql`         | Activity log          | Dynamic UI, First-day detection |
| `user_streaks`        | `0002_gamification_substrate.sql` | Streak tracking       | Active streak detection         |
| `habits`              | `0004_habits_goals_substrate.sql` | Habit definitions     | Habit system                    |
| `habit_logs`          | `0004_habits_goals_substrate.sql` | Habit completions     | Habit tracking                  |

### Feature Flag Verification

| Flag                                   | `env.d.ts` | `flags.ts` Getter                     | Default | Status |
| -------------------------------------- | ------------ | --------------------------------------- | ------- | ------ |
| `FLAG_TODAY_SOFT_LANDING_V1`         | ✅ Line 32   | `isTodaySoftLandingEnabled()`         | OFF     | ✅     |
| `FLAG_TODAY_MOMENTUM_FEEDBACK_V1`    | ✅ Line 31   | `isTodayMomentumFeedbackEnabled()`    | ON      | ✅     |
| `FLAG_TODAY_DECISION_SUPPRESSION_V1` | ✅ Line 29   | `isTodayDecisionSuppressionEnabled()` | ON      | ✅     |
| `FLAG_TODAY_NEXT_ACTION_RESOLVER_V1` | ✅ Line 30   | `isTodayNextActionResolverEnabled()`  | OFF     | ✅     |
| `FLAG_TODAY_REDUCED_MODE_V1`         | ✅ Line 33   | `isTodayReducedModeEnabled()`         | OFF     | ✅     |
| `FLAG_TODAY_DYNAMIC_UI_V1`           | ✅ Line 34   | `isTodayDynamicUIEnabled()`           | OFF     | ✅     |

### Key Pure Functions (Database-First Principles)

#### `getTodayVisibility(state: TodayUserState): TodayVisibility`

- **Location**: `lib/today/todayVisibility.ts:103`
- **Input**: Server-computed `TodayUserState` from database queries
- **Output**: Pure visibility rules (no side effects)
- **Database queries feeding state**:
  - `getDailyPlanSummary()` → `daily_plans` table
  - `isFirstDay()` → `activity_events` table (COUNT = 0)
  - `hasFocusActive()` → `focus_sessions` table (status = 'active')
  - `hasActiveStreak()` → `user_streaks` table

#### `getDynamicUIData(db, userId): Promise<DynamicUIData>`

- **Location**: `lib/db/repositories/dailyPlans.ts:566`
- **Database queries**:
  - `getQuickPicks()` → `activity_events` GROUP BY event_type (14 days)
  - `getResumeLast()` → `activity_events` ORDER BY created_at DESC (24h)
  - `getInterestPrimer()` → `activity_events` COUNT lesson/focus events

#### `resolveStarterAction(plan: DailyPlan | null): ResolvedAction`

- **Location**: `lib/today/resolveNextAction.ts:287`
- **Input**: Pre-fetched daily plan (already from database)
- **Logic**: Pure function, deterministic CTA selection
- **Fallback chain**: First incomplete plan item → Focus → Quests → Learn

### Soft Landing Sources

When a user completes or abandons an action, `SoftLandingSource` tracks the origin:

| Source      | Trigger                        | Behavior                                  | Implementation                                    |
| ----------- | ------------------------------ | ----------------------------------------- | ------------------------------------------------- |
| `focus`   | Focus session complete/abandon | Collapse DailyPlan, Explore; hide Rewards | `softLanding.ts:activateSoftLanding('focus')`   |
| `quest`   | Quest completed                | Same reduced-choice state                 | `softLanding.ts:activateSoftLanding('quest')`   |
| `workout` | Workout completed              | Same reduced-choice state                 | `softLanding.ts:activateSoftLanding('workout')` |
| `habit`   | Habit logged                   | Same reduced-choice state                 | `softLanding.ts:activateSoftLanding('habit')`   |
| `learn`   | Learn session completed        | Same reduced-choice state                 | `softLanding.ts:activateSoftLanding('learn')`   |

**Session Storage Keys**:

- `passion_soft_landing_v1`: "1" = active, "0" = cleared
- `passion_soft_landing_source`: Source that triggered the landing

### Momentum States

| State         | Description                    | Trigger                   | Implementation                                    |
| ------------- | ------------------------------ | ------------------------- | ------------------------------------------------- |
| `pending`   | No completion yet this session | Initial state             | `sessionStorage.getItem(MOMENTUM_KEY) === null` |
| `shown`     | Banner displayed               | First completion detected | `markMomentumShown()` in `momentum.ts`        |
| `dismissed` | User closed banner             | Click dismiss             | `dismissMomentum()` in `momentum.ts`          |

**Session Storage Key**: `passion_momentum_v1`
**Banner Copy**: "Good start." (5 words or fewer, neutral, non-gamified)

---

## Core Frameworks

### 1. Fogg Behavior Model (B=MAP)

**Source**: Fogg Behavior Model site. ([Fogg Behavior Model][1])

The foundational framework for understanding why people do (or don't) start:

```
B=MAP  (shorthand)
Behavior happens when Motivation, Ability, and a Prompt converge at the same moment.
```

| Component            | Description                         | Starter Engine Application                      |
| -------------------- | ----------------------------------- | ----------------------------------------------- |
| **Motivation** | Desire to perform the behavior      | Show progress, celebrate wins, connect to goals |
| **Ability**    | Ease of performing the behavior     | Break tasks into tiny steps, reduce friction    |
| **Prompt**     | Trigger that initiates the behavior | Timely notifications, contextual cues           |

**Key Insight**: When motivation is low, increase ability (make it easier). When ability is high, a simple prompt can be enough. ([Fogg Behavior Model][1])

#### Design Principles from Fogg

1. **Start tiny** — Make the first action extremely small/easy (small enough to do even with low motivation). ([Fogg Behavior Model][1])
2. **Anchor to existing behavior** — “After I [existing habit], I will [new behavior].” ([Tiny Habits][2])
3. **Celebrate immediately** — Create an immediate positive feeling after the tiny behavior. ([Tiny Habits][2])
4. **Reduce friction** — Every extra tap, decision, or context switch raises the “ability” cost. ([Fogg Behavior Model][1])

---

### 2. Tiny Habits Method

**Source**: Tiny Habits recipe cards (anchor / tiny behavior / celebration). ([Tiny Habits][2])

Practical application of the Fogg model for habit formation:

#### The Tiny Habits Recipe

```
After I [ANCHOR MOMENT], I will [TINY BEHAVIOR], then I will [CELEBRATE].
```

**Examples in Ignition context**:

* After I open Ignition, I will review my top priority, then I’ll celebrate
* After I complete a task, I will add the next action, then I’ll celebrate

#### Starter Engine Features Aligned

| Tiny Habits Concept | Ignition Product Term                 | Implementation                                                 | Code Location                                 |
| ------------------- | ------------------------------------- | -------------------------------------------------------------- | --------------------------------------------- |
| Anchor moments      | **Starter Block**               | `StarterBlock.tsx` — Context-aware CTA on Today page        | `app/(app)/today/StarterBlock.tsx:53`       |
| Tiny behaviors      | **Focus Session** (2-min start) | `/focus` with timer; "Just start" mode                       | `routes/focus.rs`, `focus_sessions` table |
| Celebration         | **Momentum Feedback**           | `MomentumBanner.tsx` — "Good start." after first completion | `app/(app)/today/MomentumBanner.tsx`        |
| Behavior crafting   | **Quest** with objectives       | `quests` table — Goal + sub-objectives structure            | `db/quests_models.rs`, `routes/quests.rs` |

**Database Tables Used**:

- `focus_sessions` — Focus timer state (duration, status, pauses)
- `activity_events` — Completion events that trigger celebration
- `universal_quests` / `user_quest_progress` — Quest definitions and progress

---

### 3. Implementation Intentions (If–Then Plans)

**Source**: Gollwitzer (1999) paper; plus meta-analytic evidence (Gollwitzer & Sheeran, 2006). ([Prospective Psychology][3])

Evidence-based method to bridge intention–action gaps:

```
If [SITUATION X], then I will [BEHAVIOR Y]
```

**Research findings (corrected)**:

* Meta-analyses find **medium-to-large average improvements** in goal attainment from forming implementation intentions, with effects varying by context/population. ([KOPS][4])
* Implementation intentions work partly by linking a situational cue (“if”) to a response (“then”), increasing the likelihood of initiating action when the cue is encountered. ([Prospective Psychology][3])

#### Starter Engine Applications

| Scenario                | Implementation Intention                      | Ignition Product Implementation                                                    | Code Location                                              |
| ----------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Morning start           | "If I open Ignition, I start my first task"   | **Starter Block** shows deterministic CTA via **Next Action Resolver** | `resolveStarterAction()` in `resolveNextAction.ts:287` |
| Re-entry after action   | "If I complete Focus, I see reduced choices"  | **Soft Landing** — `mode=soft&from=focus` URL params                      | `TodayGridClient.tsx:77-99`                              |
| Procrastination trigger | "If I feel resistance, I commit to 2 minutes" | **Focus Session** with timer; minimal commitment                             | `focus.rs` start with short duration                     |
| Long absence            | "If I've been away 48+ hours, I start small"  | **Reduced Mode** — `TODAY_REDUCED_MODE_V1`                                | `getTodayVisibility()` returns `returning_after_gap`   |

**Database Queries for State Detection**:

```typescript
// lib/db/repositories/dailyPlans.ts
isFirstDay(db, userId)     // SELECT 1 FROM activity_events WHERE user_id = ? LIMIT 1
hasFocusActive(db, userId) // SELECT id FROM focus_sessions WHERE status = 'active'
hasActiveStreak(db, userId) // SELECT current_streak FROM user_streaks WHERE current_streak >= 1
```

**Feature ideas**:

* Let users define personal if–then rules
* Prompt users with their rules at trigger moments
* Track which rules correlate with successful starts

---

### 4. WOOP (Wish–Outcome–Obstacle–Plan)

**Source**: WOOP method pages and science overview; MCII meta-analysis for “mental contrasting + implementation intentions” efficacy. ([WOOP my life][5])

Structured mental contrasting that turns goals into obstacle-aware plans:

| Step               | Description                       | User Prompt                             |
| ------------------ | --------------------------------- | --------------------------------------- |
| **W**ish     | What do you want to achieve?      | “What’s your goal for today?”        |
| **O**utcome  | Best possible outcome if achieved | “How will you feel when done?”        |
| **O**bstacle | Main internal obstacle            | “What might get in your way?”         |
| **P**lan     | If–then plan for obstacle        | “If [obstacle], then I will [action]” |

**Why it works**: Integrates outcome visualization with obstacle identification and an if–then plan. ([WOOP my life][6])

#### Starter Engine Integration

| WOOP Step | Ignition Product Term      | Implementation                         | Code Location                     | Status  |
| --------- | -------------------------- | -------------------------------------- | --------------------------------- | ------- |
| Wish      | **Quest** creation   | User defines goal in quest wizard      | `routes/quests.rs:create_quest` | ✅      |
| Outcome   | Quest description          | "How will you feel?" prompt (future)   | —                                | 🔲 TODO |
| Obstacle  | Barrier identification     | "What might stop you?" prompt (future) | —                                | 🔲 TODO |
| Plan      | **Daily Plan** items | If-then via scheduled plan items       | `routes/daily_plan.rs`          | ✅      |

**Database Tables**:

- `universal_quests` — System-defined quest templates
- `user_quest_progress` — User's progress on quests
- `daily_plans` — User's daily planning items

* **Goal setting flow**: Guide users through WOOP when creating **Quests**
* **Morning planning**: Quick WOOP via **Daily Plan** setup
* **Restart prompts**: "What's blocking you?" in **Reduced Mode** re-entry

---

### 5. Behavior Change Wheel (COM-B)

**Source**: Michie et al. (2011), *Implementation Science* (BCW/COM-B). ([Springer Link][7])

Systems approach for diagnosing behavior barriers.

COM-B frames behavior as arising from interaction among:

* **Capability**
* **Opportunity**
* **Motivation** ([Springer Link][7])

| Component             | Sub-types               | Questions to Ask                           |
| --------------------- | ----------------------- | ------------------------------------------ |
| **Capability**  | Physical, Psychological | Can they do it? Do they know how?          |
| **Opportunity** | Physical, Social        | Does the environment support it?           |
| **Motivation**  | Reflective, Automatic   | Do they want to? Is it habitual/automatic? |

#### Mapping to Intervention Types (examples)

| Barrier                     | Intervention Type (BCW)         | Ignition Product Term                                    | Implementation                                      | Code Location                   |
| --------------------------- | ------------------------------- | -------------------------------------------------------- | --------------------------------------------------- | ------------------------------- |
| Low capability              | Training / Enablement           | Onboarding flow, Learn module                            | `/learn` guided content                           | `routes/learn.rs`             |
| Low opportunity             | Environmental restructuring     | **Decision Suppression**, **Explore Drawer** | Hide irrelevant options; surface contextual choices | `getTodayVisibility()`        |
| Low motivation (reflective) | Education / Persuasion          | **Quest** progress, skill trees                    | Visual goal progression                             | `user_quest_progress` table   |
| Low motivation (automatic)  | Incentivisation / Reinforcement | **Momentum Feedback**, XP, streaks                 | `MomentumBanner`, gamification layer              | `activity_events` → XP/coins |

**Decision Suppression Implementation**:

```typescript
// lib/today/todayVisibility.ts:103
export function getTodayVisibility(state: TodayUserState): TodayVisibility {
  const resolvedState = resolveUserState(state);
  switch (resolvedState) {
    case "focus_active":     // Hide all distractions during focus
    case "first_day":        // Minimal choices for new users
    case "returning_after_gap": // Reduce overwhelm after absence
    // ... each returns different visibility rules
  }
}
```

(BCW defines a broader set of “intervention functions”; these are representative mappings.) ([Springer Link][7])

---

### 6. Behavior Change Technique Taxonomy (BCTTv1)

**Source**: Michie et al. (2013), BCTTv1 (93 techniques). ([DHI][8])

Standardized vocabulary for intervention components. Key techniques for starter engines:

| BCT Code | Technique                                          | Ignition Implementation                  |
| -------- | -------------------------------------------------- | ---------------------------------------- |
| 1.1      | Goal setting (behavior)                            | Daily priorities, quest objectives       |
| 1.2      | Problem solving                                    | Obstacle prompts, stuck detection        |
| 1.4      | Action planning                                    | Task scheduling, time blocking           |
| 1.5      | Review behavior goal(s)                            | Evening reflection, weekly review        |
| 2.3      | Self-monitoring of behavior                        | Activity tracking, completion logs       |
| 4.1      | Instruction on how to perform the behavior         | Task breakdowns, templates               |
| 7.1      | Prompts/cues                                       | Notifications, widgets                   |
| 8.1      | Behavioral practice/rehearsal                      | “Just start for 2 min” mode            |
| 10.4     | Social reward                                      | Sharing achievements, team visibility    |
| 12.5     | Adding objects to the environment                  | App widgets, physical reminders          |
| 15.1     | **Verbal persuasion to boost self-efficacy** | Encouragement messages                   |
| 15.3     | Focus on past success                              | Streak displays, “you did this before” |

---

### 7. Getting Things Done (GTD) — Next Actions

**Source**: GTD definitions for projects and next actions; linking next actions and projects; two-minute rule (David Allen). ([Getting Things Done®][9])

Productivity system emphasizing clarity on the very next physical action:

#### Core Concepts

| Concept                 | Definition                                                                 | Starter Engine Relevance                        |
| ----------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- |
| **Next Action**   | The next**physical, visible** action step                            | Removes ambiguity about what to do              |
| **Project**       | Any outcome requiring**more than one action step**                   | Ensures every project has a defined next action |
| **Context**       | Where/when/with-what the action happens                                    | Match tasks to current situation                |
| **2-Minute Rule** | If it can be done in ~2 minutes, do it immediately rather than tracking it | Quick wins build momentum                       |

(Definitions and the two-minute rule are explicitly described in GTD materials.) ([Getting Things Done®][9])

#### Design Implications

| GTD Principle           | Ignition Product Term                                    | Implementation                                | Code Location                |
| ----------------------- | -------------------------------------------------------- | --------------------------------------------- | ---------------------------- |
| Always show next action | **Starter Block** + **Next Action Resolver** | `resolveStarterAction()` returns single CTA | `resolveNextAction.ts:287` |
| Context filtering       | **Decision Suppression**                           | `getTodayVisibility()` based on user state  | `todayVisibility.ts:103`   |
| Quick capture           | Quick-add                                                | Inbox capture (future)                        | 🔲 TODO                      |
| Regular review          | Weekly review prompts                                    | Review reminders (future)                     | 🔲 TODO                      |

1. **Always show the next action** — **Starter Block** uses **Next Action Resolver** to display exactly one CTA. ([Getting Things Done®][9])
   - Implementation: `StarterBlock.tsx:178` calls `resolveStarterAction(plan)`
2. **Context filtering** — **Decision Suppression** shows/hides sections based on user state (first-day, focus-active, etc.). ([Getting Things Done®][9])
   - Implementation: `TodayGridClient` receives visibility props from server
3. **Quick capture** — Friction-free inbox for thoughts. ([Getting Things Done®][10])
   - Status: 🔲 TODO — Not yet implemented
4. **Regular review** — Encourage consistent review so the system stays trusted. ([Getting Things Done®][10])
   - Status: 🔲 TODO — Not yet implemented

---

### 8. Behavioral Activation

**Source**: University of Michigan BA handout (pleasure/mastery; activity scheduling; barriers; upward spiral). ([Michigan Medicine][11])

Clinical approach to building momentum through action.

#### The Pleasure–Mastery Loop

| Dimension          | Description                | Example Activities             |
| ------------------ | -------------------------- | ------------------------------ |
| **Pleasure** | Enjoyment, fun, relaxation | Hobbies, social time, rest     |
| **Mastery**  | Accomplishment, competence | Work tasks, learning, exercise |

BA materials emphasize building an “upward spiral” of motivation/energy through scheduling meaningful activities and reducing avoidance. ([Michigan Medicine][11])

#### Activity Scheduling Principles

1. **Schedule rather than wait** — BA focuses on acting first rather than waiting for motivation. ([Michigan Medicine][11])
2. **Start with high-probability activities** — Easy/likely wins to reinitiate momentum. ([Michigan Medicine][11])
3. **Identify barriers beforehand** — Problem-solve obstacles to activation. ([Michigan Medicine][11])
4. **Track before/after** — Many BA protocols monitor activities and their effects to build insight. ([Michigan Medicine][11])

#### Starter Engine Features

| BA Concept               | Ignition Product Term                          | Implementation                                            | Code Location                              |
| ------------------------ | ---------------------------------------------- | --------------------------------------------------------- | ------------------------------------------ |
| Activity scheduling      | **Daily Plan**, **Focus Session**  | `DailyPlanWidget`, `/focus` time blocks               | `DailyPlan.tsx`, `routes/focus.rs`     |
| Pleasure/mastery ratings | Quest categories                               | Task type: work, play, health, learn                      | `quests_models.rs:QuestDifficulty`       |
| Barrier identification   | Barrier prompts                                | "What might stop you?" (future)                           | 🔲 TODO                                    |
| Gradual activation       | **Reduced Mode**, **Soft Landing** | 48h+ gap = simplified view; post-action = reduced choices | `todayVisibility.ts:returning_after_gap` |
| Upward spiral            | **Momentum Feedback**                    | "Good start." reinforces first action                     | `MomentumBanner.tsx`, `momentum.ts`    |

**Reduced Mode Database Query**:

```typescript
// Computed from users.last_activity_at in API layer
const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
const returningAfterGap = hoursSinceActivity > 48;
```

---

## Search Terms for Further Research

When looking for more resources, use these terms instead of “starter engine”:

### Academic/Research

* “task initiation design”
* “behavior design motivation ability prompt”
* “implementation intentions if–then plans”
* “behavior change wheel COM-B”
* “behavior change technique taxonomy BCTTv1”
* “behavioral activation activity scheduling”

### Product/UX

* “habit formation app design”
* “micro-commitments UX”
* “friction reduction design”
* “onboarding behavior change”
* “gamification behavior change”

---

## Application Matrix

How each framework maps to Ignition product terms:

| Framework                 | Primary Application    | Ignition Product Terms                                   | Feature Flags                                             | Status         |
| ------------------------- | ---------------------- | -------------------------------------------------------- | --------------------------------------------------------- | -------------- |
| Fogg Model                | Core design philosophy | **Starter Block**, **Decision Suppression**  | `TODAY_DECISION_SUPPRESSION_V1`                         | ✅             |
| Tiny Habits               | Habit formation        | **Momentum Feedback**, **Focus Session**     | `TODAY_MOMENTUM_FEEDBACK_V1`                            | ✅             |
| Implementation Intentions | Re-entry & restart     | **Soft Landing**, **Reduced Mode**           | `TODAY_SOFT_LANDING_V1`, `TODAY_REDUCED_MODE_V1`      | ✅             |
| WOOP                      | Goal planning          | **Quest**, **Daily Plan**                    | —                                                        | ✅ (Wish/Plan) |
| COM-B                     | Barrier diagnosis      | **Decision Suppression**, **Explore Drawer** | `TODAY_DECISION_SUPPRESSION_V1`                         | ✅             |
| BCTTv1                    | Feature vocabulary     | All features mapped to BCT codes                         | —                                                        | ✅             |
| GTD                       | Task management        | **Next Action Resolver**, **Daily Plan**     | `TODAY_NEXT_ACTION_RESOLVER_V1`                         | ✅             |
| Behavioral Activation     | Momentum building      | **Momentum Feedback**, **Soft Landing**      | `TODAY_MOMENTUM_FEEDBACK_V1`, `TODAY_SOFT_LANDING_V1` | ✅             |

---

## TODO: Future Enhancements

Based on the framework analysis, these features are planned but not yet implemented:

| ID     | Feature                     | Framework Source          | Priority |
| ------ | --------------------------- | ------------------------- | -------- |
| TODO-1 | WOOP "Outcome" prompt       | WOOP                      | Medium   |
| TODO-2 | WOOP "Obstacle" prompt      | WOOP                      | Medium   |
| TODO-3 | Personal if-then rules      | Implementation Intentions | High     |
| TODO-4 | Barrier prompts             | COM-B, BA                 | Medium   |
| TODO-5 | Quick capture inbox         | GTD                       | High     |
| TODO-6 | Weekly review prompts       | GTD                       | Medium   |
| TODO-7 | Rule effectiveness tracking | Implementation Intentions | Low      |

---

## References (source-backed)

1. Fogg Behavior Model (B=MAP; motivation/ability/prompt convergence). ([Fogg Behavior Model][1])
2. Tiny Habits recipe card (anchor, tiny behavior, celebration). ([Tiny Habits][2])
3. Gollwitzer, P.M. (1999). *Implementation intentions: Strong effects of simple plans* (if–then planning mechanisms). ([Prospective Psychology][3])
4. Gollwitzer, P.M. & Sheeran, P. (2006). *Implementation intentions and goal achievement: A meta-analysis of effects and processes.* ([KOPS][4])
5. WOOP (Wish–Outcome–Obstacle–Plan) method and science overview (Oettingen). ([WOOP my life][5])
6. Meta-analysis of MCII (mental contrasting + implementation intentions) showing small-to-medium effects on goal attainment. ([Frontiers][12])
7. Michie, S. et al. (2011). *The behaviour change wheel* (COM-B and intervention functions). ([Springer Link][7])
8. Michie, S. et al. (2013). *BCT Taxonomy v1* (93 techniques). ([DHI][8])
9. Getting Things Done®: definitions for Projects and Next Actions; linking next actions and projects; Two-Minute Rule (David Allen). ([Getting Things Done®][9])
10. University of Michigan. *Behavioral Activation for Depression* (pleasure/mastery; scheduling; barriers). ([Michigan Medicine][11])

---

## Document History

| Date       | Author | Change                                                                                                                                                                                                                                       |
| ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-01-09 | System | Initial creation                                                                                                                                                                                                                             |
| 2026-01-09 | System | Fact-check + sourcing corrections (equation-as-shorthand; implementation intentions effect claim; BCT label fix; added primary citations)                                                                                                    |
| 2026-01-09 | System | Integrated Ignition product terms (Starter Block, Soft Landing, Momentum Feedback, Decision Suppression, etc.) and added Product Glossary                                                                                                    |
| 2026-01-09 | System | **Code Audit**: Verified all implementations against codebase. Added Implementation Verification section with component/route/database mappings. Added code locations, database queries, and TODO tracking for unimplemented features. |

[1]: https://www.behaviormodel.org/?utm_source=chatgpt.com
[2]: https://tinyhabits.com/wp-content/uploads/2020/10/tinyhabits-recipe-cards.pdf?utm_source=chatgpt.com
[3]: https://www.prospectivepsych.org/sites/default/files/pictures/Gollwitzer_Implementation-intentions-1999.pdf?utm_source=chatgpt.com
[4]: https://kops.uni-konstanz.de/bitstreams/d4f710b4-a505-49ef-a831-5b8d7675100b/download?utm_source=chatgpt.com
[5]: https://woopmylife.org/?utm_source=chatgpt.com
[6]: https://woopmylife.org/en/science?utm_source=chatgpt.com
[7]: https://link.springer.com/content/pdf/10.1186/1748-5908-6-42.pdf?utm_source=chatgpt.com
[8]: https://www.dhi.ac.uk/san/waysofbeing/data/health-jones-michie-2013.pdf?utm_source=chatgpt.com
[9]: https://gettingthingsdone.com/2010/02/managing-projects-tips-from-david-allen/?utm_source=chatgpt.com
[10]: https://gettingthingsdone.com/2020/06/the-gtd-approach-to-linking-next-actions-and-projects/?utm_source=chatgpt.com
[11]: https://medicine.umich.edu/sites/default/files/content/downloads/Behavioral-Activation-for-Depression.pdf?utm_source=chatgpt.com
[12]: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.565202/full?utm_source=chatgpt.com
