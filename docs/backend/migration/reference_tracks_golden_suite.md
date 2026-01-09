# Reference Tracks Golden Suite

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Define deterministic test fixtures, invariants, and validation methods for reference tracks

---

## Overview

The golden suite establishes a reproducible testing baseline for reference tracks functionality. It ensures:

1. **Determinism** - Same input hash + version produces identical outputs
2. **Sync Tolerance** - Audio playback/UI sync within 20-40ms alignment
3. **Perf Sanity** - Time-to-first-visual measured (no hardcoded thresholds)

---

## Test Categories

### 1. Backend Determinism Tests

**Location:** `app/backend/crates/api/src/tests/reference_golden_tests.rs`

#### Invariants

| Invariant | Description | Verification |
|-----------|-------------|--------------|
| HASH-001 | Same audio content hash → same track ID generation | Hash function is stable |
| HASH-002 | Analysis output is reproducible | Same audio → same BPM/key |
| ORDER-001 | Annotations list order is stable (by start_time_ms) | ORDER BY enforced |
| ORDER-002 | Regions list order is stable (by start_time_ms) | ORDER BY enforced |
| TIME-001 | Timestamps use UTC consistently | All created_at/updated_at are UTC |

#### Fixtures

```rust
// Golden fixture: known audio file with expected analysis
const GOLDEN_AUDIO_SHA256: &str = "abc123..."; // Actual hash of test audio
const GOLDEN_BPM: f32 = 120.0;
const GOLDEN_KEY: &str = "C major";
const GOLDEN_DURATION_MS: i64 = 180000; // 3 minutes
```

#### Test Cases

| Test | Input | Expected Output | Verification |
|------|-------|-----------------|--------------|
| `test_track_creation_deterministic` | Fixed JSON + user_id | Same UUID generation | UUID v4 from RNG seed |
| `test_annotation_ordering_stable` | 5 annotations (unordered insert) | Sorted by start_time_ms | Assert order |
| `test_region_ordering_stable` | 3 regions (unordered insert) | Sorted by start_time_ms | Assert order |
| `test_analysis_reproducible` | Golden audio bytes | Expected BPM/key | Tolerance ±0.5 BPM |

---

### 2. Frontend E2E Sync Tests

**Location:** `tests/reference-tracks-golden.spec.ts`

#### Sync Tolerance Invariants

| Invariant | Description | Tolerance |
|-----------|-------------|-----------|
| SYNC-001 | Waveform position matches audio currentTime | ≤40ms |
| SYNC-002 | Annotation highlight appears at correct time | ≤20ms |
| SYNC-003 | Region loop boundary is accurate | ≤20ms |
| SYNC-004 | Visualizer frame update aligns with playback | ≤40ms |

#### Test Cases

| Test | Action | Assertion |
|------|--------|-----------|
| `test_waveform_sync_on_seek` | Seek to 30s | Waveform cursor at 30s ±40ms |
| `test_annotation_highlight_timing` | Play through annotation at 10s | Highlight visible within 20ms of 10s |
| `test_region_loop_precision` | Set loop 5s-10s, play past 10s | Loops back to 5s within 20ms |
| `test_visualizer_frame_alignment` | Play for 5s | Visualizer updates within 40ms of audio |

#### Measurement Method

```typescript
// Measure sync using high-resolution timer
const measureSync = async (page: Page, trackId: string) => {
  const audioTime = await page.evaluate(() => {
    const audio = document.querySelector('audio');
    return audio?.currentTime || 0;
  });
  
  const visualTime = await page.evaluate(() => {
    // Get displayed time from UI
    const display = document.querySelector('[data-testid="current-time"]');
    return parseFloat(display?.textContent || '0');
  });
  
  const drift = Math.abs(audioTime - visualTime) * 1000; // ms
  return drift;
};
```

---

### 3. Performance Measurements

**Location:** `tests/reference-tracks-perf.spec.ts`

#### Metrics (No Hardcoded Thresholds)

Performance metrics are **measured and reported**, not asserted against fixed values. Regressions are detected by comparing against baseline.

| Metric | Description | Measurement Point |
|--------|-------------|-------------------|
| TTFV-001 | Time to first visual (visualizer render) | First frame painted after play |
| TTFA-001 | Time to first audio (sound plays) | First audio sample after play |
| TTLA-001 | Time to load annotations | Annotations visible after track load |
| TTLR-001 | Time to load regions | Regions visible after track load |
| TTAW-001 | Time to analyze waveform | Waveform displayed after load |

#### Baseline File

**Location:** `tests/fixtures/reference-tracks-perf-baseline.json`

```json
{
  "version": "1.0.0",
  "timestamp": "2026-01-07T00:00:00Z",
  "measurements": {
    "TTFV-001": { "p50": 150, "p95": 300, "unit": "ms" },
    "TTFA-001": { "p50": 50, "p95": 150, "unit": "ms" },
    "TTLA-001": { "p50": 100, "p95": 250, "unit": "ms" },
    "TTLR-001": { "p50": 100, "p95": 250, "unit": "ms" },
    "TTAW-001": { "p50": 500, "p95": 1200, "unit": "ms" }
  }
}
```

#### Regression Detection

```typescript
// Report measurements without failing on specific values
const reportMetrics = (metrics: Record<string, number>) => {
  // Write to JSON for CI comparison
  fs.writeFileSync(
    '.tmp/perf-report.json',
    JSON.stringify({ timestamp: new Date().toISOString(), metrics })
  );
  
  // Log for visibility
  console.log('[PERF] Reference Tracks Metrics:', metrics);
};
```

---

## Running the Suite

### Backend Determinism Tests

```bash
# Run from project root
cd app/backend/crates/api
cargo test reference_golden --no-fail-fast 2>&1 | tee ../../../../.tmp/golden_backend.log
```

### Frontend E2E Tests

```bash
# Run from project root
npx playwright test tests/reference-tracks-golden.spec.ts --reporter=html 2>&1 | tee .tmp/golden_e2e.log
```

### Performance Baseline Update

```bash
# Generate new baseline (run when intentional changes are made)
PERF_BASELINE_UPDATE=true npx playwright test tests/reference-tracks-perf.spec.ts 2>&1 | tee .tmp/golden_perf.log
```

---

## CI Integration

### GitHub Actions Workflow Addition

```yaml
# .github/workflows/golden-suite.yml (excerpt)
golden-suite:
  runs-on: ubuntu-latest
  steps:
    - name: Run backend determinism tests
      run: |
        cd app/backend/crates/api
        cargo test reference_golden --no-fail-fast
    
    - name: Run frontend sync tests
      run: npx playwright test tests/reference-tracks-golden.spec.ts
    
    - name: Run performance measurements
      run: npx playwright test tests/reference-tracks-perf.spec.ts
    
    - name: Compare performance baseline
      run: node scripts/compare-perf-baseline.mjs
```

---

## Fixtures

### Test Audio Files

**Location:** `tests/fixtures/audio/`

| File | Purpose | Duration | SHA256 |
|------|---------|----------|--------|
| `golden-120bpm.mp3` | Known BPM test | 30s | TBD |
| `golden-silence.mp3` | Edge case: no analysis | 5s | TBD |
| `golden-complex.mp3` | Multiple tempo changes | 60s | TBD |

### Test Data

**Location:** `tests/fixtures/reference-tracks/`

| File | Purpose |
|------|---------|
| `track-with-annotations.json` | Pre-populated track with 5 annotations |
| `track-with-regions.json` | Pre-populated track with 3 loop regions |
| `empty-track.json` | Minimal track (no annotations/regions) |

---

## Invariant Enforcement

### Pre-Commit Hook

Add to `.husky/pre-commit`:

```bash
# Run determinism subset on commit
cd app/backend/crates/api
cargo test reference_golden_quick --no-fail-fast || exit 1
```

### PR Gate

All PRs modifying `app/backend/crates/api/src/routes/reference.rs` or `app/frontend/src/components/references/` must pass the full golden suite.

---

## Versioning

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Initial golden suite |

---

## References

- [validation_reference_tracks_v1.md](./validation_reference_tracks_v1.md) - Domain validation
- [reference_tracks_swap_plan_post20G.md](./reference_tracks_swap_plan_post20G.md) - Frontend swap plan
- [feature_parity_checklist.md](./feature_parity_checklist.md) - Overall parity tracking
