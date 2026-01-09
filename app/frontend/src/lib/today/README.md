# Today Logic Module

This module contains the core business logic for the Today page in Passion OS.
All logic is implemented as pure functions for testability and predictability.

## Module Overview

```
src/lib/today/
  index.ts              # Public API exports
  todayVisibility.ts    # Section visibility rules
  resolveNextAction.ts  # Starter CTA resolver
  momentum.ts           # Momentum feedback state
  softLanding.ts        # Soft landing state management
  safetyNets.ts         # Validation and fallback utilities
  __tests__/            # Unit tests for all modules
    todayVisibility.test.ts
    resolveNextAction.test.ts
    momentum.test.ts
    softLanding.test.ts
    safetyNets.test.ts
  README.md             # This file
```

---

## Modules

### 1. todayVisibility.ts

**Purpose:** Determines which sections of the Today page are visible based on user state.

**Feature Flag:** `TODAY_DECISION_SUPPRESSION_V1`
- When OFF: All sections visible (default behavior)
- When ON: Applies state-driven visibility rules

**Exports:**
```typescript
// Main function
getTodayVisibility(state: TodayUserState): TodayVisibility

// Default visibility (flag OFF)
getDefaultVisibility(): TodayVisibility

// State resolver
resolveUserState(state: TodayUserState): UserStateType

// Safety net
ensureMinimumVisibility(visibility: TodayVisibility): TodayVisibility
```

**Input Contract:**
```typescript
interface TodayUserState {
  planExists: boolean;           // User has a daily plan
  hasIncompletePlanItems: boolean; // Plan has incomplete items
  returningAfterGap: boolean;    // User returning after 48h+ gap
  firstDay: boolean;             // User's first day
  focusActive: boolean;          // Active focus session
  activeStreak: boolean;         // Has active streak
}
```

**Output Contract:**
```typescript
interface TodayVisibility {
  showStarterBlock: boolean;
  showReducedModeBanner: boolean;
  showDailyPlan: boolean;
  forceDailyPlanCollapsed: boolean;
  showExplore: boolean;
  forceExploreCollapsed: boolean;
  hideExplore: boolean;
  showRewards: boolean;
  maxQuickLinks: number;
  resolvedState: UserStateType;
}
```

---

### 2. resolveNextAction.ts

**Purpose:** Deterministically resolves the next action for the StarterBlock CTA.

**Feature Flag:** `TODAY_NEXT_ACTION_RESOLVER_V1`
- When OFF: Simple plan-first fallback
- When ON: Uses pure resolver with priority chain

**Exports:**
```typescript
// Full resolver with currentRoute check
resolveNextAction(state: ResolverState): ResolvedAction

// Simplified resolver for StarterBlock
resolveStarterAction(plan: DailyPlan | null): ResolvedAction
```

**Input Contract:**
```typescript
interface ResolverState {
  plan: DailyPlan | null;
  currentRoute?: string;
}

interface DailyPlan {
  id: string;
  date: string;
  items: PlanItem[];
  completedCount: number;
  totalCount: number;
}

interface PlanItem {
  id: string;
  type: "focus" | "quest" | "workout" | "learning" | "habit";
  title: string;
  actionUrl: string;
  completed: boolean;
  priority: number;
}
```

**Output Contract:**
```typescript
interface ResolvedAction {
  href: string;              // Route to navigate to
  label: string;             // Button label
  reason: ResolutionReason;  // Why this was chosen
  type: PlanItem["type"] | "focus";
  entityId?: string;         // If targeting specific item
  itemTitle?: string;        // Original item title
}

type ResolutionReason =
  | "plan_incomplete_item"
  | "plan_complete_fallback"
  | "no_plan_fallback"
  | "noop";
```

**Priority Order:**
1. Plan with incomplete items -> First incomplete by priority
2. Plan complete -> Focus fallback
3. No plan -> Focus -> Quests -> Learn fallback chain

---

### 3. momentum.ts

**Purpose:** Manages session-scoped momentum feedback after first action completion.

**Feature Flag:** `TODAY_MOMENTUM_FEEDBACK_V1`
- When OFF: No momentum banner shown
- When ON: Shows "Good start." banner once per session

**Exports:**
```typescript
// State checks
shouldShowMomentum(): boolean
isMomentumShown(): boolean
isMomentumDismissed(): boolean
getMomentumState(): MomentumState

// State mutations
markMomentumShown(): void
dismissMomentum(): void

// Constants
MOMENTUM_MESSAGE: string  // "Good start."
MOMENTUM_COPY: { option1, option2, option3 }
```

**Storage:**
- Key: `sessionStorage["passion_momentum_v1"]`
- Values: `null` (pending), `"shown"`, `"dismissed"`
- Lifetime: Browser session

**State Flow:**
```
pending -> shown (on first completion)
shown -> dismissed (on user dismiss)
dismissed -> dismissed (no re-trigger)
```

---

### 4. softLanding.ts

**Purpose:** Manages session-scoped soft landing mode after action completion/abandonment.

**Feature Flag:** `TODAY_SOFT_LANDING_V1`
- When OFF: Normal Today after action
- When ON: Reduced-choice Today after first action

**Exports:**
```typescript
// State checks
isSoftLandingActive(): boolean
isSoftLandingCleared(): boolean
getSoftLandingState(): SoftLandingState
getSoftLandingSource(): SoftLandingSource | null

// State mutations
activateSoftLanding(source: SoftLandingSource): void
clearSoftLanding(): void

// URL utilities
buildSoftLandingUrl(source, status): string
isSoftLandingUrl(url: string): boolean
parseSoftLandingParams(params: URLSearchParams): ParsedParams
```

**Storage:**
- Key: `sessionStorage["passion_soft_landing_v1"]`
- Values: `null` (inactive), `"1"` (active), `"0"` (cleared)
- Source Key: `sessionStorage["passion_soft_landing_source"]`
- Lifetime: Browser session

**State Flow:**
```
inactive -> active (on first action complete/abandon)
active -> cleared (on user expands section)
cleared -> cleared (no re-trigger)
```

**Triggers:**
- Focus session complete
- Focus session abandon (reset/skip)

---

### 5. safetyNets.ts

**Purpose:** Provides validation and fallback utilities for graceful degradation.

**Feature Flag:** None (always active as safety layer)

**Exports:**
```typescript
// Resolver safety
FALLBACK_ACTION: ResolvedAction
isValidActionRoute(href: string): boolean
validateResolverOutput(action: ResolvedAction): ResolvedAction

// Plan validation
validateDailyPlan(plan: DailyPlan): DailyPlan | null
isValidPlanItem(item: PlanItem): boolean
getValidPlanItems(plan: DailyPlan): PlanItem[]

// Visibility safety
MINIMUM_VISIBILITY: Partial<TodayVisibility>
validateVisibility(visibility: TodayVisibility): TodayVisibility

// Storage safety
safeSessionStorageGet(key: string): string | null
safeSessionStorageSet(key: string, value: string): boolean

// Error handling
withFallback<T>(fn, fallback, context): T
withFallbackAsync<T>(fn, fallback, context): Promise<T>
```

**Safety Behaviors:**
- Invalid resolver href -> fallback to `/focus`
- Missing plan fields -> treat as no plan
- All CTAs hidden -> force show StarterBlock
- Storage unavailable -> graceful degradation

---

## Feature Flags

All flags are defined in `src/lib/flags.ts`.

| Flag | Module | Default | Purpose |
|------|--------|---------|---------|
| `TODAY_FEATURES_MASTER` | All | OFF | Master kill switch |
| `TODAY_DECISION_SUPPRESSION_V1` | todayVisibility | OFF | State-driven visibility |
| `TODAY_NEXT_ACTION_RESOLVER_V1` | resolveNextAction | OFF | Pure action resolver |
| `TODAY_MOMENTUM_FEEDBACK_V1` | momentum | OFF | Momentum banner |
| `TODAY_SOFT_LANDING_V1` | softLanding | OFF | Soft landing mode |
| `TODAY_REDUCED_MODE_V1` | todayVisibility | OFF | Gap-based reduced mode |

**Flag Hierarchy:**
```
TODAY_FEATURES_MASTER (master switch)
  |
  +-- TODAY_DECISION_SUPPRESSION_V1
  +-- TODAY_NEXT_ACTION_RESOLVER_V1
  +-- TODAY_MOMENTUM_FEEDBACK_V1
  +-- TODAY_SOFT_LANDING_V1
  +-- TODAY_REDUCED_MODE_V1
```

If master is OFF, all child features are OFF.

---

## Usage Examples

### Compute Today Visibility

```typescript
import { getTodayVisibility, getDefaultVisibility } from "@/lib/today";
import { isTodayDecisionSuppressionEnabled } from "@/lib/flags";

const visibility = isTodayDecisionSuppressionEnabled()
  ? getTodayVisibility(userState)
  : getDefaultVisibility();
```

### Resolve Starter Action

```typescript
import { resolveStarterAction, validateResolverOutput } from "@/lib/today";
import { isTodayNextActionResolverEnabled } from "@/lib/flags";

const action = isTodayNextActionResolverEnabled()
  ? validateResolverOutput(resolveStarterAction(plan))
  : getSimpleFallback(plan);
```

### Mark Momentum Shown

```typescript
import { markMomentumShown } from "@/lib/today";
import { isTodayMomentumFeedbackEnabled } from "@/lib/flags";

if (isTodayMomentumFeedbackEnabled()) {
  markMomentumShown();
}
```

### Activate Soft Landing

```typescript
import { activateSoftLanding } from "@/lib/today";
import { isTodaySoftLandingEnabled } from "@/lib/flags";

if (isTodaySoftLandingEnabled()) {
  activateSoftLanding("focus");
}
```

---

## Testing

Run all Today module tests:

```bash
npm run test:unit -- --run src/lib/today/__tests__/
```

Current test count: 112 tests across 5 test files.

---

## Related Components

The following components in `src/app/(app)/today/` consume this module:

| Component | Uses |
|-----------|------|
| `page.tsx` | todayVisibility |
| `StarterBlock.tsx` | resolveNextAction, safetyNets |
| `MomentumBanner.tsx` | momentum |
| `TodayGridClient.tsx` | softLanding, all visibility |
| `DailyPlanWidget.tsx` | (indirect via props) |
| `ExploreDrawer.tsx` | (indirect via props) |

---

## Changelog

- **v1.0** - Initial implementation
  - todayVisibility: State-driven visibility rules
  - resolveNextAction: Pure action resolver
  - momentum: Session feedback state
  - softLanding: Post-action reduced mode
  - safetyNets: Validation and fallbacks

