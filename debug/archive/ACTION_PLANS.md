# ACTION PLANS - Phase 3 Discovery Complete

**Status**: Ready for Phase 5 Implementation  
**Date**: 2026-01-11  
**Discovery Phase**: Complete  

---

## 🔴 PRIORITY P0: Session Termination on Invalid Sync

**Selected**: Option A - Centralized 401 Handler  
**Status**: Ready for implementation

### Discovery Findings

#### Current State
- **Location**: `app/frontend/src/lib/sync/SyncStateContext.tsx`
- **Polling Pattern**: Every 30 seconds via `pollAll()` endpoint
- **Error Handling**: Current error handling doesn't clear session on 401
- **Auth**: Uses cookies for authentication (`credentials: 'include'`)
- **Cleanup Function**: NOT IMPLEMENTED - No `clearAllClientData()` function exists

#### Auth Flow Analysis
1. SyncStateContext polls `/api/sync` every 30s
2. Backend returns 401 if session invalid
3. Frontend catches error but doesn't react
4. User sees error state, session persists in memory
5. **GAP**: No automatic session cleanup mechanism

#### Code Locations Found
- `app/frontend/src/lib/sync/SyncStateContext.tsx:1-284` - Main polling logic
- `app/frontend/src/lib/auth/AuthProvider.tsx` - Session management
- Need to find: API client setup, error interceptor patterns

### Action Plan

#### Step 1: Create Global API Client with 401 Interceptor
```
FILE: app/frontend/src/lib/api/apiClient.ts (NEW)
- Export async function: apiRequest<T>(path: string, options: RequestInit): Promise<T>
- Catch all responses with status 401
- On 401: 
  - Call clearAllClientData() function
  - Redirect to login with ?session_expired=true
  - Show toast notification
```

#### Step 2: Create Data Cleanup Function
```
FILE: app/frontend/src/lib/sync/clearClientData.ts (NEW)
- Export async function: clearAllClientData()
- Clear SyncStateContext state (reset to null)
- Clear FocusStateContext state
- Clear player queue
- Clear any localStorage data (if present)
- Clear cookies via signOut()
```

#### Step 3: Update SyncStateContext
```
FILE: app/frontend/src/lib/sync/SyncStateContext.tsx
- Line ~130 (in pollData function):
  - Wrap fetch call with apiClient
  - Add 401 error handler that calls clearAllClientData()
```

#### Step 4: Update Other API Calls
```
FILES: All API client files in app/frontend/src/lib/api/
- Replace direct fetch() calls with apiClient()
- Examples: focus-libraries.ts, onboarding.ts, quests.ts, etc.
```

#### Step 5: Add Error Notification
```
FILE: app/frontend/src/components/ui/Toast.tsx (or Notification.tsx)
- Add session_expired toast
- Show: "Your session has expired. Please log in again."
- Auto-dismiss after 5 seconds
```

### Dependencies
- ✅ AuthProvider.signOut() exists (confirmed in grep)
- ❌ clearAllClientData() function needs creation
- ❌ apiClient wrapper needs creation
- ❌ Toast notification system may need update

### Validation Checklist
- [ ] 401 response triggers notification in UI
- [ ] Session cleared from memory
- [ ] Cookies cleared
- [ ] Redirect to login works
- [ ] App doesn't crash on 401
- [ ] Multiple tabs stay in sync on auth expiry

---

## 🔴 PRIORITY P1: Plan My Day Generation Broken

**Selected**: Option A - Full Generation Logic  
**Status**: Ready for implementation

### Discovery Findings

#### Current State
```rust
// app/backend/crates/api/src/db/platform_repos.rs:275-320
pub struct DailyPlanRepo;
pub async fn generate(...) -> Result<DailyPlanResponse, AppError> {
    let mut items: Vec<PlanItem> = vec![];
    // TODO: Actually generate items
    // Returns empty plan
}
```

#### Data Sources Needed
From schema.json v2.0.0:
- `quests` table: `status = 'active'` for user
- `habit_instances` table: Pending habits for date
- `workouts` table: Scheduled for date (via calendar_events)
- `learning_items` table: Due/recommended for date

#### Route Handler
- Location: `app/backend/crates/api/src/routes/daily_plan.rs:95`
- Calls: `DailyPlanRepo::generate(&state.db, user_id, date).await?`
- Response: `DailyPlanResponse { date, items, ... }`

### Action Plan

#### Step 1: Implement Quest Query
```
FILE: app/backend/crates/api/src/db/platform_repos.rs
- Add new method: fetch_active_quests(pool, user_id, limit: 3)
- Query: SELECT id, title, status FROM quests 
         WHERE user_id = $1 AND status = 'active'
         LIMIT $2
- Return: Vec<PlanItem> with quest data
```

#### Step 2: Implement Habit Instance Query
```
FILE: app/backend/crates/api/src/db/platform_repos.rs
- Add new method: fetch_pending_habits(pool, user_id, date)
- Query: SELECT h.id, h.name, hi.date FROM habit_instances hi
         JOIN habits h ON h.id = hi.habit_id
         WHERE h.user_id = $1 AND hi.date = $2 AND hi.status = 'pending'
- Return: Vec<PlanItem> with habit data
```

#### Step 3: Implement Workout Query
```
FILE: app/backend/crates/api/src/db/platform_repos.rs
- Add new method: fetch_scheduled_workouts(pool, user_id, date)
- Query: SELECT id, title FROM calendar_events 
         WHERE user_id = $1 AND event_date = $2 AND event_type = 'workout'
- Return: Vec<PlanItem> with workout data
```

#### Step 4: Implement Learning Item Query
```
FILE: app/backend/crates/api/src/db/platform_repos.rs
- Add new method: fetch_learning_items(pool, user_id, date)
- Query: SELECT id, title, due_date FROM learning_items
         WHERE user_id = $1 AND due_date = $2
- Return: Vec<PlanItem> with learning data
```

#### Step 5: Update generate() Method
```rust
pub async fn generate(pool: &PgPool, user_id: Uuid, date: NaiveDate) 
    -> Result<DailyPlanResponse, AppError> {
    let mut items: Vec<PlanItem> = vec![];
    
    // Fetch and add items (in priority order)
    items.extend(fetch_active_quests(pool, user_id, 3).await?);
    items.extend(fetch_pending_habits(pool, user_id, date).await?);
    items.extend(fetch_scheduled_workouts(pool, user_id, date).await?);
    items.extend(fetch_learning_items(pool, user_id, date).await?);
    
    // Add default focus session
    items.push(PlanItem {
        id: Uuid::new_v4(),
        title: "Focus Session".to_string(),
        // ... other fields
    });
    
    // Create and return plan
    Ok(DailyPlanResponse {
        date,
        items,
        notes: None,
        // ... other fields
    })
}
```

#### Step 6: Test in SQL
```bash
# Test quest query
SELECT id, title FROM quests WHERE user_id = '...' AND status = 'active' LIMIT 3;

# Test habit query
SELECT h.id, h.name FROM habit_instances hi
JOIN habits h ON h.id = hi.habit_id
WHERE h.user_id = '...' AND hi.date = '2026-01-11' AND hi.status = 'pending';
```

### Dependencies
- ✅ Database schema exists (confirmed in schema.json)
- ✅ Route handler exists
- ✅ Response types exist
- ❌ Query methods need implementation (4 new functions)

### Validation Checklist
- [ ] `cargo check --bin ignition-api` = 0 errors
- [ ] Each query method returns correct types
- [ ] generate() returns non-empty items array
- [ ] API endpoint returns valid response
- [ ] Frontend receives plan items correctly

---

## 🟡 PRIORITY P2: Onboarding Modal Not Rendering

**Selected**: Option C - Manual Entry Only (Disable Generation)  
**Status**: Ready for implementation

### Discovery Findings

#### Current State
```tsx
// app/frontend/src/components/onboarding/OnboardingProvider.tsx:61-68
// TODO: Modal disabled during migration
// Returns null, skipping modal render
console.log("Onboarding needed but modal temporarily disabled during migration");
return null;
```

#### API vs Modal Mismatch
- **API Returns**: `state, flow (without steps), current_step, all_steps`
- **Modal Expects**: `initialState, flow (with steps array), userId`

#### Option C: What We're Doing
- Remove onboarding modal from rendering
- Remove "Generate" button from daily plan UI
- Keep API/backend working
- Users add items manually instead

### Action Plan

#### Step 1: Disable Modal Completely
```
FILE: app/frontend/src/components/onboarding/OnboardingProvider.tsx
- Replace TODO comment with clear explanation
- Keep return null (already disabled)
- Add documentation: "Onboarding disabled per user selection"
```

#### Step 2: Hide Plan Generation Button
```
FILE: app/frontend/src/components/daily-plan/DailyPlanUI.tsx (or similar)
- Find "Generate" button
- Add condition: if (false) { /* hide */ }
- Or remove button entirely
- Add comment: "Plan generation disabled per user selection"
```

#### Step 3: Update Documentation
```
FILE: docs/FEATURES.md or similar
- Add section: "Onboarding"
- Note: "Manual plan entry only - users add items via UI"
- Note: "Modal rendering disabled 2026-01-11"
```

### Dependencies
- ✅ OnboardingProvider already returns null
- ✅ No code changes needed for provider
- ❌ Need to find and hide generate button
- ❌ Documentation needs update

### Validation Checklist
- [ ] OnboardingModal never renders
- [ ] No console errors about onboarding
- [ ] Generate button not visible
- [ ] Users can manually add items
- [ ] No broken UI elements

---

## 🔴 PRIORITY P3: Create Focus Library Broken

**Selected**: Option A + B - R2 Upload + Reference Library Paradigm (Hybrid)  
**Status**: Ready for implementation

### Discovery Findings

#### Current State
```tsx
// app/frontend/src/components/focus/FocusTracks.tsx:48-56
const response = await listFocusLibraries(1, 100);
setFocusLibrary(null); // Placeholder until backend track support
// TODO: Implement track storage in focus libraries
```

#### Storage Gap
- Backend: `focus_libraries` table exists (metadata only)
- Backend: `focus_library_tracks` table exists (no storage integration)
- Frontend: Uses IndexedDB for reference library (working)
- **GAP**: No R2 integration for focus library track uploads

#### Architecture Options
- **Option A**: R2 upload + REST endpoint (full backend)
- **Option B**: IndexedDB local storage (client-side only, no sync)
- **Decision**: BOTH - Hybrid approach for future flexibility

### Action Plan

#### PHASE A: Add R2 Upload Support (Option A)

##### Step A1: Create Presigned URL Endpoint
```
FILE: app/backend/crates/api/src/routes/focus.rs
- Add route: POST /api/focus/libraries/{id}/tracks/upload-url
- Return: { presigned_url, key }
- Expire: 1 hour
```

##### Step A2: Create Backend Upload Handler
```
FILE: app/backend/crates/api/src/lib/r2.rs (or similar)
- Function: generate_presigned_url(bucket, key, expires_in)
- Use: AWS S3-compatible SDK
- Return: Full presigned POST URL for browser
```

##### Step A3: Update Frontend Upload
```
FILE: app/frontend/src/lib/api/focus-libraries.ts
- Function: uploadTrackToR2(file: File, presignedUrl: string)
- Method: PUT request to presigned URL
- Content-Type: audio/mpeg (or detected mime type)
- Return: r2_key for backend storage
```

##### Step A4: Save Track Reference
```
FILE: app/backend/crates/api/src/routes/focus.rs
- After R2 upload: POST /api/focus/libraries/{id}/tracks
- Body: { track_name, r2_key, duration_ms, mime_type }
- Update: focus_library_tracks table with r2_key
```

#### PHASE B: Keep Reference Library Fallback (Option B)

##### Step B1: Update FocusTracks Component
```
FILE: app/frontend/src/components/focus/FocusTracks.tsx
- Check if focus library has tracks
- If no tracks: Show reference library tracks (existing code)
- If has tracks: Show uploaded tracks from R2
- Allow: Switch between reference + custom tracks
```

##### Step B2: Storage Strategy
- **Uploaded Tracks**: Stored in R2, accessible everywhere
- **Reference Library**: IndexedDB (client-side), no sync
- **User Choice**: Users can use either or both

#### Step 3: Add Track Upload UI
```
FILE: app/frontend/src/components/focus/FocusTrackUpload.tsx (NEW)
- File input: Accept audio files (mp3, wav, m4a)
- Progress: Show upload progress bar
- Validation: Max 50MB, supported formats only
- Success: Add track to library display
```

#### Step 4: Handle Download/Playback
```
FILE: app/frontend/src/lib/focus/FocusPlayer.ts
- Function: getTrackUrl(r2_key: string): string
- Build: Full R2 download URL
- Return: Signed URL (if needed)
- Playback: Use HTML5 audio element
```

### Dependencies
- ✅ focus_libraries table exists
- ✅ focus_library_tracks table exists
- ❌ R2 integration not implemented
- ❌ Presigned URL endpoint needed
- ❌ Upload UI component needed

### Validation Checklist - R2 Upload
- [ ] Presigned URL endpoint works
- [ ] File uploads to R2 successfully
- [ ] Track record created in database
- [ ] Track playable after upload
- [ ] Tracks persist across devices
- [ ] File size validation works

### Validation Checklist - Reference Library Fallback
- [ ] Reference library still loads
- [ ] Can switch between uploaded + reference
- [ ] Both types play correctly
- [ ] No duplication of tracks

---

## 🟡 PRIORITY P4: Focus State Not Persisted in Sync

**Selected**: Option A - Add to Sync State  
**Status**: Ready for implementation

### Discovery Findings

#### Current State
```tsx
// app/frontend/src/lib/sync/SyncStateContext.tsx:43-49
interface SyncStateContextValue {
  focus: FocusStatusData | null;  // ✅ Field already exists!
  // ... other fields
}
```

#### Key Finding
- **The field ALREADY EXISTS in sync context!**
- Backend `/api/sync` returns focus data
- Frontend stores it in state (line 87)
- **BUT**: Components bypass it and query `/api/focus` directly

#### Issue Root Cause
- FocusStateContext polls separately (not using sync data)
- FocusTracks component doesn't use sync state
- Duplicate API calls (sync + component-level)
- No single source of truth

### Action Plan

#### Step 1: Update FocusStateContext
```
FILE: app/frontend/src/lib/focus/FocusStateContext.tsx
- Change: Stop polling /api/focus separately
- Instead: Import useSyncState hook
- Get focus data from: useSyncState().focus
- Remove: Duplicate polling logic
```

#### Step 2: Update FocusIndicator Component
```
FILE: app/frontend/src/components/focus/FocusIndicator.tsx
- Find: Component that shows focus status
- Change: useFocusStatus() → useSyncState().focus
- Update: UI to use sync data directly
```

#### Step 3: Update Focus Timer Display
```
FILE: app/frontend/src/components/focus/FocusTimer.tsx (or similar)
- Find: Component showing countdown
- Change: Use sync state instead of direct API call
- Update: Refresh logic to use sync poll (30s interval)
```

#### Step 4: Optimize Sync Interval (Optional Future)
```
FILE: app/frontend/src/lib/sync/SyncStateContext.tsx
- Consider: When focus session active, increase frequency (5s)
- Current: 30s interval might be too slow for timer
- Decision: Can implement later if needed
```

#### Step 5: Test Integration
```
FILE: tests/focus-persistence.spec.ts
- Verify: Focus data in sync response
- Verify: FocusStateContext uses sync data
- Verify: No duplicate /api/focus calls
- Verify: Timer updates correctly
```

### Dependencies
- ✅ SyncStateContext.focus field exists
- ✅ Backend returns focus data in sync endpoint
- ✅ FocusStatusData type defined
- ❌ Components need to be updated to use sync state
- ❌ FocusStateContext needs refactoring

### Validation Checklist
- [ ] FocusStateContext uses sync data
- [ ] No separate /api/focus calls
- [ ] Focus status updates in UI
- [ ] Timer display works correctly
- [ ] 30s sync interval sufficient (or implement faster)

---

## 🟡 PRIORITY P5: Zen Browser Transparency Issue

**Selected**: Option A - Add CSS Transparency Support  
**Status**: Ready for implementation

### Discovery Findings

#### Issue Details
- Browser: Zen Browser v3.3 (Firefox-based)
- Theme: Zen-Nebula v3.3
- Problem: Low transparency on app components
- Repo: https://github.com/JustAdumbPrsn/Zen-Nebula/releases/tag/v3.3

#### Root Cause Analysis
- Zen-Nebula theme modifies CSS variables for transparency
- App may not support `backdrop-filter` property
- CSS variables may not cascade correctly
- Browser-specific rendering issue

### Action Plan

#### Step 1: Test Environment Setup
```
- Install Zen Browser
- Install Zen-Nebula v3.3 theme
- Load app and check transparency
- Document baseline opacity issues
```

#### Step 2: Add CSS Variable Support
```
FILE: app/frontend/src/styles/variables.css or theme file
- Add: --backdrop-transparency: 0.85;
- Add: --bg-transparency: 0.9;
- Use: rgba(var(--color), var(--bg-transparency))
```

#### Step 3: Update Component Styles
```
FILES: Components with transparency issues
- Add: backdrop-filter: blur(4px); (with fallback)
- Add: -webkit-backdrop-filter: blur(4px); (Safari)
- Increase opacity on critical elements for Zen Browser
```

#### Step 4: Create Zen Browser Detection (Optional)
```
FILE: app/frontend/src/lib/browser-detect.ts
- Function: isZenBrowser(): boolean
- Check: userAgent for "Zen"
- Use: Apply Zen-specific CSS class if detected
```

#### Step 5: Add Zen-Specific CSS Override
```
FILE: app/frontend/src/styles/zen-browser.css (NEW)
- Selector: body.zen-browser
- Override: opacity/transparency values
- Example: .modal { opacity: 0.95 } (higher for visibility)
```

#### Step 6: Documentation
```
FILE: README.md or docs/
- Add: "Tested with Zen Browser v3.3 + Zen-Nebula theme"
- Note: "Some transparency effects may appear different in Zen Browser"
```

### Dependencies
- ✅ CSS files exist
- ❌ Need to test in Zen Browser (may not have access)
- ❌ Browser detection library may be needed
- ⚠️ Zen-Nebula theme documentation may be sparse

### Validation Checklist
- [ ] Components visible in Zen Browser
- [ ] Transparency appropriate (not too opaque)
- [ ] No CSS errors in console
- [ ] Other browsers unaffected
- [ ] Documentation updated

---

## 📊 SUMMARY - Ready for Phase 5

| Priority | Issue | Implementation | Effort | Key Files |
|----------|-------|-----------------|--------|-----------|
| **P0** | Session Termination | Centralized 401 handler + interceptor | 3-4h | apiClient.ts, SyncStateContext.tsx |
| **P1** | Plan My Day | 4 query methods + generate function | 4-6h | platform_repos.rs |
| **P2** | Onboarding | Disable modal (already done) + hide button | 0.5h | OnboardingProvider.tsx |
| **P3** | Focus Library | R2 presigned URL + IndexedDB fallback | 6-8h | routes/focus.rs, FocusTracks.tsx |
| **P4** | Focus Persistence | Remove duplicate polling, use sync state | 2h | FocusStateContext.tsx |
| **P5** | Zen Browser | CSS variable support + detection | 1-2h | styles files, browser-detect.ts |

---

## ✅ Discovery Complete

All priorities have actionable plans with:
- ✅ Code locations identified
- ✅ Dependencies documented
- ✅ Implementation steps outlined
- ✅ Validation criteria defined

**Next**: Phase 5 (FIX) - User approval to begin implementation

