# Reference Tracks Visualizer - Frontend Documentation

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`

---

## Overview

The Reference Tracks Visualizer is a frontend-only renderer that displays analysis data, annotations, and regions for reference tracks. All analysis is performed by the backend - the frontend's role is strictly UI rendering and capturing user input.

### Key Principles

1. **Backend-Authored Analysis** - Frontend never performs audio analysis
2. **No R2 Credentials** - Audio access via backend signed URLs only
3. **API-First** - All data flows through the centralized API client
4. **Persistence** - Annotations/regions are persisted server-side, not in localStorage

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (UI Only)                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ TrackDetail  │  │ Visualizer   │  │ Annotation/Region      │ │
│  │ Page         │──│ Component    │──│ Controls               │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
│         │                 │                      │               │
│         └─────────────────┼──────────────────────┘               │
│                           ▼                                      │
│                 ┌──────────────────┐                             │
│                 │ API Client       │                             │
│                 │ (reference-      │                             │
│                 │  tracks.ts)      │                             │
│                 └──────────────────┘                             │
└─────────────────────────│────────────────────────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │ Backend API          │
              │ api.ecent.online     │
              │                      │
              │ • /reference/*       │
              │ • /frames/*          │
              │ • /blobs/*           │
              └──────────────────────┘
```

---

## Components

### TrackDetailPage

Main container component for the track detail view.

**Location:** `app/frontend/src/components/references/TrackDetailPage.tsx`

**Props:**
```typescript
interface TrackDetailPageProps {
  trackId: string;
  onBack?: () => void;
}
```

**Features:**
- Integrates all sub-components
- Manages audio playback via `<audio>` element
- Handles loop region enforcement
- Coordinates state between visualizer and control panels

### TrackVisualizer

Canvas-based waveform and timeline renderer.

**Location:** `app/frontend/src/components/references/TrackVisualizer.tsx`

**Props:**
```typescript
interface TrackVisualizerProps {
  streamUrl: string | null;
  duration: number;
  annotations: AnnotationResponse[];
  regions: RegionResponse[];
  events?: AnalysisEvent[];
  manifest?: FrameManifestResponse | null;
  loudnessData?: Float32Array | null;
  currentTime?: number;
  onSeek?: (timeSeconds: number) => void;
  onAddAnnotation?: (startMs: number, endMs?: number) => void;
  onAnnotationClick?: (annotation: AnnotationResponse) => void;
  onRegionClick?: (region: RegionResponse) => void;
  onCreateRegion?: (startMs: number, endMs: number) => void;
  activeLoop?: RegionResponse | null;
  height?: number;
  showBeats?: boolean;
  showTransients?: boolean;
}
```

**Features:**
- Waveform rendering from loudness data
- Beat/transient markers from backend events
- Interactive seeking (click to seek)
- Region creation via drag
- Annotation creation via double-click
- Playhead visualization
- Loop region indicator

### AnnotationControls

Panel for managing track annotations.

**Location:** `app/frontend/src/components/references/AnnotationControls.tsx`

**Features:**
- List view of all annotations (sorted by time)
- Create new annotation with category and color
- Edit existing annotations
- Delete annotations
- Color picker for visual customization

### RegionControls

Panel for managing track regions/sections.

**Location:** `app/frontend/src/components/references/RegionControls.tsx`

**Features:**
- List view of all regions (sorted by time)
- Section type selection (intro, verse, chorus, etc.)
- Loop toggle per region
- Create/edit/delete operations
- Activate region as playback loop

---

## API Client

**Location:** `app/frontend/src/lib/api/reference-tracks.ts`

### Tracks API

```typescript
// List all user tracks
referenceTracksApi.listTracks(page, pageSize)

// Get single track
referenceTracksApi.getTrack(trackId)

// Create track (after upload)
referenceTracksApi.createTrack(input)

// Update track metadata
referenceTracksApi.updateTrack(trackId, input)

// Delete track
referenceTracksApi.deleteTrack(trackId)
```

### Upload API

```typescript
// Get signed upload URL
referenceTracksApi.initUpload(filename, mimeType, fileSize)
// Returns: { url: string, r2_key: string, expires_at: string }

// Upload file directly to R2 (not via backend)
referenceTracksApi.uploadFile(signedUrl, file)
```

### Streaming API

```typescript
// Get signed stream URL for audio playback
referenceTracksApi.getStreamUrl(trackId)
// Returns: { url: string, expires_at: string }
```

### Annotations API

```typescript
referenceTracksApi.listAnnotations(trackId)
referenceTracksApi.createAnnotation(trackId, input)
referenceTracksApi.updateAnnotation(annotationId, input)
referenceTracksApi.deleteAnnotation(annotationId)
```

### Regions API

```typescript
referenceTracksApi.listRegions(trackId)
referenceTracksApi.createRegion(trackId, input)
referenceTracksApi.updateRegion(regionId, input)
referenceTracksApi.deleteRegion(regionId)
```

### Frames API

```typescript
// Get analysis manifest
framesApi.getManifest(analysisId)

// Get frame data for time range
framesApi.getFrames(analysisId, fromMs, toMs)

// Get specific chunk
framesApi.getChunk(analysisId, chunkIndex)

// Get events (beats, transients, etc.)
framesApi.getEvents(analysisId, options)
```

---

## React Hooks

**Location:** `app/frontend/src/lib/hooks/useReferenceTracks.ts`

### useTracks

Fetches paginated list of user's tracks.

```typescript
const {
  tracks,
  loading,
  error,
  page,
  totalPages,
  refresh,
  nextPage,
  prevPage,
} = useTracks(pageSize);
```

### useTrack

Fetches single track with all associated data.

```typescript
const {
  track,
  analysis,
  annotations,
  regions,
  loading,
  error,
  streamUrl,
  refresh,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  addRegion,
  updateRegion,
  deleteRegion,
} = useTrack(trackId);
```

### useFrameData

Fetches frame manifest and provides frame data access.

```typescript
const {
  manifest,
  loading,
  error,
  getFramesForRange,
  events,
} = useFrameData(analysisId);
```

### useUpload

Handles file upload flow.

```typescript
const {
  uploading,
  progress,
  error,
  uploadTrack,
} = useUpload();
```

---

## Frame Data Parsing

Binary frame data is received as base64-encoded strings. Utility functions decode this:

```typescript
import { decodeFrameData, getBandData } from '@/lib/api/reference-tracks';

// Decode all bands from a chunk
const decoded = decodeFrameData(chunk.data_base64, manifest.frame_layout, chunk.frame_count);

// Get specific band
const loudness = getBandData(decoded, 'loudness');
```

### Frame Time Conversion

```typescript
import { frameToTimeMs, timeToFrame } from '@/lib/api/reference-tracks';

const timeMs = frameToTimeMs(frameIndex, manifest.hop_ms);
const frame = timeToFrame(timeMs, manifest.hop_ms);
```

---

## Audio Playback

Audio is played via the native `<audio>` element using backend-signed URLs:

```typescript
const { streamUrl } = useTrack(trackId);

// In component
<audio
  ref={audioRef}
  src={streamUrl}
  preload="auto"
  crossOrigin="anonymous"
/>
```

### Loop Region Enforcement

When a loop region is active, playback is constrained:

```typescript
useEffect(() => {
  if (!audio || !activeLoop) return;
  
  const handleTimeUpdate = () => {
    if (audio.currentTime * 1000 >= activeLoop.end_time_ms) {
      audio.currentTime = activeLoop.start_time_ms / 1000;
    }
  };
  
  audio.addEventListener('timeupdate', handleTimeUpdate);
  return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
}, [activeLoop]);
```

---

## Security Considerations

### No R2 Credentials in Frontend

The frontend **never** has access to R2 credentials. All storage access is via:

1. **Signed upload URLs** - Obtained from `/reference/upload/init`
2. **Signed stream URLs** - Obtained from `/reference/tracks/:id/stream`

### Origin Verification

All state-changing requests (POST/PATCH/DELETE) include Origin header which is verified by backend CSRF middleware.

### Authentication

All API requests include session cookie automatically (HttpOnly, Secure, SameSite=None).

---

## Testing

### Playwright Tests

**Location:** `app/frontend/tests/reference-tracks.spec.ts`

```bash
# Run reference tracks tests
npx playwright test reference-tracks
```

### Test Coverage

| Test | Description |
|------|-------------|
| Load reference library | Page loads with heading |
| Display track list | Tracks or empty state shown |
| Render visualizer | Canvas renders when track selected |
| Create annotation | Annotation created and persists after reload |
| Create loop region | Region with loop flag persists |
| Seek via waveform | Clicking waveform seeks audio |
| Play audio | Audio plays via signed URL |
| Activate loop | Loop region constrains playback |
| Delete annotation | Annotation removed from list |
| No R2 credentials | Page content has no credentials |

---

## File Structure

```
app/frontend/src/
├── components/references/
│   ├── index.ts
│   ├── ReferenceLibrary.tsx           # Existing library component
│   ├── TrackDetailPage.tsx            # Main detail view
│   ├── TrackDetailPage.module.css
│   ├── TrackVisualizer.tsx            # Waveform/timeline canvas
│   ├── TrackVisualizer.module.css
│   ├── AnnotationControls.tsx         # Annotation panel
│   ├── AnnotationControls.module.css
│   ├── RegionControls.tsx             # Region panel
│   └── RegionControls.module.css
├── lib/
│   ├── api/
│   │   ├── index.ts
│   │   └── reference-tracks.ts        # API client + types
│   └── hooks/
│       └── useReferenceTracks.ts      # React hooks
└── tests/
    └── reference-tracks.spec.ts       # Playwright tests
```

---

## Future Enhancements

1. **Progressive Loading** - Load frame chunks on-demand as timeline scrolls
2. **IndexedDB Caching** - Cache frame data locally with fingerprint validation
3. **Zoom/Pan** - Allow zooming into specific time regions
4. **Spectrum View** - Display frequency spectrum from `spectrum` band
5. **Comparison Mode** - Side-by-side track comparison
6. **Export** - Export annotations/regions as JSON or project file

