# Reference Tracks Frontend Swap Plan (Post-20G)

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Enumerate all frontend reference-track API calls and map them to backend endpoints

---

## Executive Summary

The current ReferenceLibrary component uses **client-side storage** (IndexedDB + localStorage):
- Audio files stored in IndexedDB
- Library/track metadata stored in localStorage
- Analysis computed client-side via Web Audio API
- Annotations/regions not persisted to backend

**Target state:** All data flows through the Rust backend API:
- Audio files uploaded to R2 via backend signed URLs
- Track metadata persisted in Postgres
- Analysis triggered and stored by backend
- Annotations/regions CRUD via backend API

---

## Current Frontend API Calls

### ReferenceLibrary.tsx (Lines 55-78)

| Function | Current Implementation | Target Backend Call |
|----------|----------------------|---------------------|
| `loadLibraries()` | `localStorage.getItem()` | `referenceTracksApi.listTracks()` |
| `saveLibraries()` | `localStorage.setItem()` | N/A (backend persists automatically) |
| `storeAudioFile()` | IndexedDB | `referenceTracksApi.initUpload()` + `uploadFile()` |
| `getAudioFileUrl()` | IndexedDB blob URL | `referenceTracksApi.getStreamUrl()` |
| `deleteAudioFile()` | IndexedDB delete | `referenceTracksApi.deleteTrack()` |
| `analyzeAudio()` | Web Audio API client-side | `referenceTracksApi.startAnalysis()` + `getAnalysis()` |

### Local Storage Functions (Lines 53-78)

| Function | File | Current | Target |
|----------|------|---------|--------|
| `loadLibraries()` | ReferenceLibrary.tsx:53 | localStorage | `referenceTracksApi.listTracks()` |
| `saveLibraries()` | ReferenceLibrary.tsx:64 | localStorage | Remove (backend persists) |
| `generateId()` | ReferenceLibrary.tsx:78 | crypto random | Backend generates UUID |

### File Storage (lib/player/local-storage.ts)

| Function | Current | Target |
|----------|---------|--------|
| `storeAudioFile()` | IndexedDB put | `initUpload()` → signed URL → `PUT` |
| `getAudioFileUrl()` | IndexedDB blob | `getStreamUrl()` → signed URL |
| `deleteAudioFile()` | IndexedDB delete | `deleteTrack()` |
| `deleteAudioFiles()` | IndexedDB batch delete | Multiple `deleteTrack()` calls |

### Analysis (lib/player/*)

| Function | Current | Target |
|----------|---------|--------|
| `analyzeAudio()` | Web Audio API | `startAnalysis()` then poll `getAnalysis()` |
| `getCachedAnalysis()` | IndexedDB | `getAnalysis()` (backend caches) |
| `saveAnalysisToCache()` | IndexedDB | Remove (backend persists) |
| `generateContentHash()` | SHA-256 client | Remove (backend handles dedup) |

### Annotations/Regions (Not yet in ReferenceLibrary.tsx)

Need to add:
| Operation | Backend Call |
|-----------|-------------|
| List annotations | `referenceTracksApi.listAnnotations(trackId)` |
| Create annotation | `referenceTracksApi.createAnnotation(trackId, input)` |
| Update annotation | `referenceTracksApi.updateAnnotation(id, input)` |
| Delete annotation | `referenceTracksApi.deleteAnnotation(id)` |
| List regions | `referenceTracksApi.listRegions(trackId)` |
| Create region | `referenceTracksApi.createRegion(trackId, input)` |
| Update region | `referenceTracksApi.updateRegion(id, input)` |
| Delete region | `referenceTracksApi.deleteRegion(id)` |

---

## Backend API Endpoints (Already Implemented)

From `app/backend/crates/api/src/routes/reference.rs`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/reference/tracks` | GET | List tracks (paginated) |
| `/reference/tracks` | POST | Create track metadata |
| `/reference/tracks/:id` | GET | Get single track |
| `/reference/tracks/:id` | PATCH | Update track |
| `/reference/tracks/:id` | DELETE | Delete track + R2 file |
| `/reference/upload` | POST | Upload track file |
| `/reference/upload/init` | POST | Get signed upload URL |
| `/reference/tracks/:id/analysis` | GET | Get analysis |
| `/reference/tracks/:id/analysis` | POST | Start analysis |
| `/reference/tracks/:id/stream` | GET | Get signed stream URL |
| `/reference/tracks/:id/annotations` | GET | List annotations |
| `/reference/tracks/:id/annotations` | POST | Create annotation |
| `/reference/annotations/:id` | GET/PATCH/DELETE | Annotation CRUD |
| `/reference/tracks/:id/regions` | GET | List regions |
| `/reference/tracks/:id/regions` | POST | Create region |
| `/reference/regions/:id` | GET/PATCH/DELETE | Region CRUD |

---

## Swap Strategy

### Phase 1: Create Backend-Integrated Component

Create a new component `ReferenceLibraryV2.tsx` that:
1. Uses `referenceTracksApi` for all data operations
2. Removes IndexedDB/localStorage usage
3. Uses signed URLs for audio streaming
4. Supports annotations and regions

### Phase 2: Route Swap

Replace the page component to use V2:
- `app/frontend/src/app/reference/page.tsx` → import `ReferenceLibraryV2`

### Phase 3: Cleanup

Move old component to deprecated:
- `ReferenceLibrary.tsx` → `deprecated/app/frontend/src/components/references/ReferenceLibrary.tsx`

---

## Files to Modify

| File | Change |
|------|--------|
| `app/frontend/src/components/references/ReferenceLibraryV2.tsx` | Create new backend-integrated component |
| `app/frontend/src/app/reference/page.tsx` | Import ReferenceLibraryV2 |
| `app/frontend/src/lib/api/reference-tracks.ts` | Already complete (verify hooks) |
| `app/frontend/tests/reference-tracks.spec.ts` | Enable and update E2E tests |

---

## E2E Test Plan

### Critical Listening Loop Tests

1. **Upload → Analyze → Visualizer**
   - Upload audio file via signed URL
   - Trigger backend analysis
   - Verify visualizer renders with backend data

2. **Create Marker → Reload → Persists**
   - Create annotation at current time
   - Reload page
   - Verify annotation still visible

3. **Access Control (Negative)**
   - Try to access another user's track
   - Verify 403 Forbidden response

### Test Fixtures Required

- Test audio file (small WAV or MP3)
- Authenticated test user
- Backend running (or mocked)

---

## Validation Criteria

- [ ] No IndexedDB usage in new component
- [ ] No localStorage for libraries/tracks
- [ ] All audio streams via signed URLs from backend
- [ ] Annotations/regions CRUD works
- [ ] E2E tests pass
- [ ] No R2 credentials exposed in frontend

---

## References

- [reference_tracks_domain.md](./reference_tracks_domain.md) - Backend domain docs
- [reference_tracks_frames_contract.md](./reference_tracks_frames_contract.md) - Frame data API
- [API_CONTRACTS_PLAN.md](./API_CONTRACTS_PLAN.md) - API conventions
- [validation_reference_tracks_v1.md](./validation_reference_tracks_v1.md) - Backend validation

