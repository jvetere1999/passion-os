"Reference Tracks Frames Contract - time-indexed feature frames and events transport."

# Reference Tracks Frames Contract

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Define the contract for time-indexed frame data transport between backend and visualizer

---

## Overview

The frames contract defines how analysis data (waveform features, spectrum, loudness, events) is stored in the backend and transported to the frontend visualizer. The design prioritizes:

1. **Determinism** - Same audio + analyzer version = same results
2. **Efficient chunking** - Large analyses split into time-indexed chunks
3. **Stable timeline** - Immutable hop_ms defines frame-to-time mapping
4. **Binary transport** - Float data packed as bytea, base64-encoded for JSON

---

## Manifest JSON Shape

### Full Manifest Response

```json
{
  "version": "1.0",
  "hop_ms": 10,
  "frame_count": 30000,
  "duration_ms": 300000,
  "sample_rate": 44100,
  "bands": [
    {
      "name": "loudness",
      "data_type": "float32",
      "size": 1,
      "description": "Short-term loudness (LUFS)",
      "unit": "LUFS",
      "min_value": -60.0,
      "max_value": 0.0
    },
    {
      "name": "spectrum",
      "data_type": "float32",
      "size": 128,
      "description": "Mel-frequency spectrum (128 bins)",
      "unit": "dB"
    },
    {
      "name": "rms",
      "data_type": "float32",
      "size": 1,
      "description": "RMS level"
    }
  ],
  "bytes_per_frame": 520,
  "frame_layout": [
    { "band_name": "loudness", "byte_offset": 0, "byte_size": 4 },
    { "band_name": "spectrum", "byte_offset": 4, "byte_size": 512 },
    { "band_name": "rms", "byte_offset": 516, "byte_size": 4 }
  ],
  "fingerprint": "a1b2c3d4e5f6g7h8",
  "analyzer_version": "1.0.0",
  "chunk_size_frames": 1000,
  "total_chunks": 30
}
```

### Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Manifest schema version |
| `hop_ms` | integer | Time between frames (e.g., 10 = 100 fps) |
| `frame_count` | integer | Total number of frames |
| `duration_ms` | integer | Total track duration in milliseconds |
| `sample_rate` | integer | Audio sample rate (for reference) |
| `bands` | array | Band definitions (see below) |
| `bytes_per_frame` | integer | Total bytes per frame (sum of all bands) |
| `frame_layout` | array | Byte offsets for parsing |
| `fingerprint` | string | Determinism fingerprint (optional) |
| `analyzer_version` | string | Analyzer version that produced this |
| `chunk_size_frames` | integer | Frames per chunk (default: 1000) |
| `total_chunks` | integer | Total number of chunks |

### Band Definition

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique band identifier |
| `data_type` | string | Yes | Type: float32, float64, int16, uint8 |
| `size` | integer | Yes | Number of values per frame |
| `description` | string | No | Human-readable description |
| `unit` | string | No | Unit of measurement (dB, LUFS, Hz) |
| `min_value` | float | No | Minimum expected value |
| `max_value` | float | No | Maximum expected value |

### Standard Bands

| Band Name | Type | Size | Description |
|-----------|------|------|-------------|
| `loudness` | float32 | 1 | Short-term loudness (LUFS) |
| `loudness_range` | float32 | 1 | Loudness range (LRA) |
| `rms` | float32 | 1 | RMS level (dB) |
| `peak` | float32 | 1 | True peak level |
| `spectrum` | float32 | 128 | Mel-frequency spectrum |
| `spectrum_centroid` | float32 | 1 | Spectral centroid (Hz) |
| `spectrum_rolloff` | float32 | 1 | Spectral rolloff (Hz) |
| `crest_factor` | float32 | 1 | Peak to RMS ratio |

---

## Timeline Definition

### Frame-to-Time Mapping

```
time_ms = frame_index * hop_ms
frame_index = floor(time_ms / hop_ms)
```

### Example

With `hop_ms = 10` (100 fps):

| Frame | Time (ms) |
|-------|-----------|
| 0 | 0 |
| 1 | 10 |
| 100 | 1000 |
| 6000 | 60000 (1 minute) |

### Chunk Bounds

Chunks are contiguous, non-overlapping:

```
chunk_0: frames [0, 1000)     → time [0, 10000)
chunk_1: frames [1000, 2000)  → time [10000, 20000)
...
```

Last chunk may be partial.

---

## Events Structure

### Event Object

```json
{
  "type": "transient",
  "time_ms": 1234,
  "duration_ms": null,
  "confidence": 0.85,
  "data": {
    "strength": 0.9,
    "frequency_hz": 150
  }
}
```

### Event Types

| Type | Description | Has Duration |
|------|-------------|--------------|
| `transient` | Audio transient/attack | No |
| `beat` | Beat detection | No |
| `downbeat` | First beat of bar | No |
| `section_start` | Section boundary start | Yes |
| `section_end` | Section boundary end | No |
| `peak` | Loudness peak | No |
| `silence` | Silence region | Yes |
| `custom` | User-defined | Optional |

---

## API Endpoints

Base: `https://api.ecent.online/frames`

### GET /analysis/:analysis_id/manifest

Get the frame manifest for an analysis.

**Response:** `FrameManifestResponse`

### GET /analysis/:analysis_id/frames?from_ms=&to_ms=

Get frame data for a time range.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from_ms` | integer | Yes | Start time (inclusive) |
| `to_ms` | integer | Yes | End time (exclusive) |
| `bands` | string | No | Comma-separated band names |

**Response:**

```json
{
  "manifest": { ... },
  "requested_range": { "from_ms": 5000, "to_ms": 15000 },
  "actual_range": { "from_ms": 5000, "to_ms": 15000 },
  "chunks": [
    {
      "chunk_index": 0,
      "start_frame": 500,
      "end_frame": 1000,
      "start_time_ms": 5000,
      "end_time_ms": 10000,
      "frame_count": 500,
      "data_base64": "AAAA..."
    },
    {
      "chunk_index": 1,
      "start_frame": 1000,
      "end_frame": 1500,
      "start_time_ms": 10000,
      "end_time_ms": 15000,
      "frame_count": 500,
      "data_base64": "AAAA..."
    }
  ],
  "total_frames": 1000,
  "total_bytes": 520000
}
```

### GET /analysis/:analysis_id/events

Get events for an analysis.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from_ms` | integer | No | Start time filter |
| `to_ms` | integer | No | End time filter |
| `event_type` | string | No | Filter by event type |

**Response:**

```json
{
  "analysis_id": "...",
  "events": [ ... ],
  "count": 42
}
```

### GET /analysis/:analysis_id/chunks/:chunk_index

Get a specific chunk by index.

**Response:** Single `FrameChunkResponse`

---

## Binary Data Format

### Frame Data Packing

Frames are packed as contiguous bytes:

```
[frame_0][frame_1][frame_2]...[frame_n-1]
```

Each frame:
```
[band_0_values][band_1_values]...[band_m-1_values]
```

### Byte Order

- **Endianness:** Little-endian (x86 native)
- **Float format:** IEEE 754

### Frontend Parsing (TypeScript)

```typescript
function parseFrames(
  base64Data: string,
  frameLayout: FrameLayoutEntry[],
  frameCount: number
): Map<string, Float32Array[]> {
  const bytes = atob(base64Data);
  const buffer = new ArrayBuffer(bytes.length);
  const view = new DataView(buffer);
  
  for (let i = 0; i < bytes.length; i++) {
    view.setUint8(i, bytes.charCodeAt(i));
  }
  
  const bytesPerFrame = frameLayout.reduce((sum, e) => sum + e.byte_size, 0);
  const result = new Map<string, Float32Array[]>();
  
  for (const entry of frameLayout) {
    result.set(entry.band_name, []);
  }
  
  for (let f = 0; f < frameCount; f++) {
    const frameOffset = f * bytesPerFrame;
    
    for (const entry of frameLayout) {
      const offset = frameOffset + entry.byte_offset;
      const values = new Float32Array(entry.byte_size / 4);
      
      for (let i = 0; i < values.length; i++) {
        values[i] = view.getFloat32(offset + i * 4, true); // little-endian
      }
      
      result.get(entry.band_name)!.push(values);
    }
  }
  
  return result;
}
```

---

## Determinism & Versioning

### Fingerprint Calculation

```
fingerprint = hash(audio_content_hash + analyzer_version + analysis_params)
```

### Cache Validation

1. Frontend stores `fingerprint` with cached frame data
2. On load, compare with manifest `fingerprint`
3. If match, use cache; if mismatch, re-fetch

### Version Compatibility

| Manifest Version | Supported |
|-----------------|-----------|
| 1.0 | Current |

Breaking changes require new manifest version.

---

## Performance Considerations

### Chunk Size Tuning

| Scenario | Recommended chunk_size_frames |
|----------|------------------------------|
| Short tracks (<1 min) | 500-1000 |
| Medium tracks (1-5 min) | 1000 |
| Long tracks (>5 min) | 2000-5000 |

### Transfer Size Estimates

With standard bands (520 bytes/frame):

| Duration | Frames (100fps) | Raw Size | Base64 Size |
|----------|-----------------|----------|-------------|
| 1 min | 6,000 | 3.1 MB | 4.1 MB |
| 3 min | 18,000 | 9.4 MB | 12.5 MB |
| 5 min | 30,000 | 15.6 MB | 20.8 MB |

### Recommended Fetch Strategy

1. **Initial load:** Fetch manifest only
2. **Visible range:** Fetch chunks for visible timeline
3. **Prefetch:** Load adjacent chunks in background
4. **Cache:** Store chunks locally (IndexedDB)

---

## IDOR Prevention

Access control follows the chain:

```
analysis_id → track_id → user_id
```

All frame endpoints verify:
1. Analysis exists
2. Track exists and belongs to user
3. User is authenticated

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `analysis_frame_manifests` | Manifest metadata |
| `analysis_frame_data` | Binary chunk storage |
| `analysis_events` | Discrete events |

### Indexes

- `analysis_frame_data(manifest_id, start_time_ms, end_time_ms)` - Range queries
- `analysis_events(analysis_id, time_ms)` - Time-ordered events

See migration: `0009_analysis_frames_bytea.sql`

---

## References

- [reference_tracks_domain.md](./reference_tracks_domain.md) - Domain overview
- [API_CONTRACTS_PLAN.md](./API_CONTRACTS_PLAN.md) - API standards
- [ENDPOINT_NAMESPACE_MAP.md](./ENDPOINT_NAMESPACE_MAP.md) - Route mapping

