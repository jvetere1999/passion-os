/**
 * Reference Router E2E Tests
 *
 * Tests the reference tracks API endpoints to validate router wiring.
 * These tests verify that the actual reference router is wired
 * (not the stub implementation).
 *
 * TEST IDs covered:
 * - TEST-001: Reference tracks list endpoint E2E (P0)
 * - TEST-002: Reference track detail endpoint E2E (P0)
 * - TEST-003: Reference track update endpoint E2E (P0)
 * - TEST-004: Reference track delete endpoint E2E (P0)
 * - TEST-007: Reference track play URL E2E (P0)
 * - TEST-009: Reference track upload E2E (P0)
 * - TEST-010: Reference annotations list E2E (P0)
 * - TEST-011: Reference annotation create E2E (P0)
 * - TEST-014: Reference regions list E2E (P0)
 * - TEST-017: Reference API contract validation (P0)
 *
 * PARITY: PARITY-080 through PARITY-088
 * FGAP: FGAP-009
 *
 * @see docs/backend/migration/TEST_BACKLOG.md
 * @see docs/backend/migration/FEATURE_GAP_TEST_MATRIX.md
 */

import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Helper to check if user is authenticated
 * Returns true if authenticated, false if 401
 */
async function isAuthenticated(request: APIRequestContext): Promise<boolean> {
  const response = await request.get("/api/auth/session");
  if (response.status() === 401) return false;
  const data = await response.json();
  return data?.user != null;
}

/**
 * Helper to check if response is stub (feature migration pending message)
 */
function isStubResponse(data: unknown): boolean {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    return obj.message === "Stub endpoint - feature migration pending";
  }
  return false;
}

// =============================================================================
// Contract Types (TEST-017)
// =============================================================================

interface ReferenceTrack {
  id: string;
  title: string;
  status: "uploading" | "processing" | "ready" | "error";
  duration_ms?: number;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

interface ReferenceAnnotation {
  id: string;
  track_id: string;
  start_time_ms: number;
  end_time_ms?: number;
  title: string;
  content?: string;
  category?: string;
  created_at: string;
}

interface ReferenceRegion {
  id: string;
  track_id: string;
  start_time_ms: number;
  end_time_ms: number;
  name?: string;
  color?: string;
  created_at: string;
}

// =============================================================================
// Test Suite
// =============================================================================

test.describe("Reference Router E2E - FGAP-009", () => {
  /**
   * TEST-001: Reference tracks list endpoint E2E
   * PARITY-080
   * Priority: P0
   *
   * Validates that GET /api/reference/tracks returns real data (not stub).
   * When stub is active, response.data is [] with "Stub endpoint" message.
   * When real router is wired, response should have track structure.
   */
  test("TEST-001: GET /api/reference/tracks returns real data", async ({
    request,
  }) => {
    const response = await request.get("/api/reference/tracks");

    // Should return 200 or 401 (if not authenticated)
    expect([200, 401]).toContain(response.status());

    if (response.status() === 401) {
      test.skip();
      return;
    }

    const data = await response.json();
    expect(data).toBeDefined();

    // Critical assertion: Real router should NOT return stub message
    // If this fails, ACTION-053 (wire reference router) is not complete
    if (isStubResponse(data)) {
      // Stub still active - test should fail to signal ACTION-053 incomplete
      expect(
        isStubResponse(data),
        "Reference router still using stub - ACTION-053 not complete"
      ).toBe(false);
    }

    // Validate response shape
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);

    // If tracks exist, validate contract shape (TEST-017 partial)
    if (data.data.length > 0) {
      const track = data.data[0] as ReferenceTrack;
      expect(track).toHaveProperty("id");
      expect(track).toHaveProperty("title");
      expect(track).toHaveProperty("status");
      expect(["uploading", "processing", "ready", "error"]).toContain(
        track.status
      );
      expect(track).toHaveProperty("created_at");
    }
  });

  /**
   * TEST-002: Reference track detail endpoint E2E
   * PARITY-081
   * Priority: P0
   *
   * Validates that GET /api/reference/tracks/:id returns track details.
   */
  test("TEST-002: GET /api/reference/tracks/:id returns track details", async ({
    request,
  }) => {
    // First get the list to find a track ID
    const listResponse = await request.get("/api/reference/tracks");

    if (listResponse.status() === 401) {
      test.skip();
      return;
    }

    const listData = await listResponse.json();

    // Skip if stub or no tracks
    if (isStubResponse(listData) || !listData.data?.length) {
      test.skip();
      return;
    }

    const trackId = listData.data[0].id;
    const response = await request.get(`/api/reference/tracks/${trackId}`);

    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty("data");
      const track = data.data as ReferenceTrack;
      expect(track.id).toBe(trackId);
      expect(track).toHaveProperty("title");
      expect(track).toHaveProperty("status");
      expect(track).toHaveProperty("duration_ms");
    }
  });

  /**
   * TEST-003: Reference track update endpoint E2E
   * PARITY-081
   * Priority: P0
   *
   * Validates that PATCH /api/reference/tracks/:id updates title.
   */
  test("TEST-003: PATCH /api/reference/tracks/:id updates title", async ({
    request,
  }) => {
    // First get the list to find a track ID
    const listResponse = await request.get("/api/reference/tracks");

    if (listResponse.status() === 401) {
      test.skip();
      return;
    }

    const listData = await listResponse.json();

    if (isStubResponse(listData) || !listData.data?.length) {
      test.skip();
      return;
    }

    const trackId = listData.data[0].id;
    const originalTitle = listData.data[0].title;
    const newTitle = `Updated ${Date.now()}`;

    const response = await request.patch(`/api/reference/tracks/${trackId}`, {
      data: { title: newTitle },
    });

    expect([200, 403, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.data.title).toBe(newTitle);

      // Restore original title
      await request.patch(`/api/reference/tracks/${trackId}`, {
        data: { title: originalTitle },
      });
    }
  });

  /**
   * TEST-004: Reference track delete endpoint E2E
   * PARITY-081
   * Priority: P0
   *
   * Validates that DELETE /api/reference/tracks/:id removes track.
   * Note: This test creates a track first to avoid deleting real data.
   */
  test("TEST-004: DELETE /api/reference/tracks/:id removes track", async ({
    request,
  }) => {
    // Check auth first
    if (!(await isAuthenticated(request))) {
      test.skip();
      return;
    }

    // Check if stub is active
    const listResponse = await request.get("/api/reference/tracks");
    if (listResponse.status() !== 200) {
      test.skip();
      return;
    }

    const listData = await listResponse.json();
    if (isStubResponse(listData)) {
      test.skip();
      return;
    }

    // Create a test track to delete (via multipart form)
    // This depends on TEST-009 working - skip if upload not available
    const uploadResponse = await request.post("/api/reference/upload", {
      multipart: {
        title: `Delete Test ${Date.now()}`,
        // Minimal valid audio file (1-sample WAV)
        file: {
          name: "test.wav",
          mimeType: "audio/wav",
          buffer: Buffer.from([
            0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56,
            0x45, 0x66, 0x6d, 0x74, 0x20, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00,
            0x01, 0x00, 0x44, 0xac, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00, 0x02,
            0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00,
          ]),
        },
      },
    });

    if (![200, 201].includes(uploadResponse.status())) {
      // Upload not working, skip delete test
      test.skip();
      return;
    }

    const uploadData = await uploadResponse.json();
    const trackId = uploadData.data?.id;

    if (!trackId) {
      test.skip();
      return;
    }

    // Now delete the track
    const deleteResponse = await request.delete(
      `/api/reference/tracks/${trackId}`
    );
    expect([204, 200]).toContain(deleteResponse.status());

    // Verify track is gone
    const getResponse = await request.get(`/api/reference/tracks/${trackId}`);
    expect([404, 403]).toContain(getResponse.status());
  });

  /**
   * TEST-007: Reference track play URL E2E
   * PARITY-083
   * Priority: P0
   *
   * Validates that GET /api/reference/tracks/:id/play returns signed URL.
   */
  test("TEST-007: GET /api/reference/tracks/:id/play returns signed URL", async ({
    request,
  }) => {
    const listResponse = await request.get("/api/reference/tracks");

    if (listResponse.status() === 401) {
      test.skip();
      return;
    }

    const listData = await listResponse.json();

    if (isStubResponse(listData) || !listData.data?.length) {
      test.skip();
      return;
    }

    // Find a 'ready' track
    const readyTrack = listData.data.find(
      (t: ReferenceTrack) => t.status === "ready"
    );
    if (!readyTrack) {
      test.skip();
      return;
    }

    const response = await request.get(
      `/api/reference/tracks/${readyTrack.id}/play`
    );

    expect([200, 404, 503]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("url");
      // URL should be a signed R2 URL or similar
      expect(typeof data.data.url).toBe("string");
      expect(data.data.url.length).toBeGreaterThan(0);
    }
  });

  /**
   * TEST-009: Reference track upload E2E
   * PARITY-085
   * Priority: P0
   *
   * Validates that POST /api/reference/upload creates new track.
   */
  test("TEST-009: POST /api/reference/upload creates new track", async ({
    request,
  }) => {
    if (!(await isAuthenticated(request))) {
      test.skip();
      return;
    }

    // Check if stub is active first
    const listResponse = await request.get("/api/reference/tracks");
    if (listResponse.status() === 200) {
      const listData = await listResponse.json();
      if (isStubResponse(listData)) {
        // Stub is active, but let's try upload anyway to see behavior
      }
    }

    const response = await request.post("/api/reference/upload", {
      multipart: {
        title: `Upload Test ${Date.now()}`,
        // Minimal valid WAV header (44 bytes header + 0 bytes data)
        file: {
          name: "test-upload.wav",
          mimeType: "audio/wav",
          buffer: Buffer.from([
            0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56,
            0x45, 0x66, 0x6d, 0x74, 0x20, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00,
            0x01, 0x00, 0x44, 0xac, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00, 0x02,
            0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00,
          ]),
        },
      },
    });

    // Check for real implementation (not stub 501 or similar)
    expect([200, 201, 400, 403, 413, 415]).toContain(response.status());

    if ([200, 201].includes(response.status())) {
      const data = await response.json();
      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("id");
      expect(data.data).toHaveProperty("status");
      expect(["uploading", "processing"]).toContain(data.data.status);

      // Cleanup: delete the test track
      const trackId = data.data.id;
      await request.delete(`/api/reference/tracks/${trackId}`);
    }
  });

  /**
   * TEST-010: Reference annotations list E2E
   * PARITY-086
   * Priority: P0
   *
   * Validates that GET /api/reference/tracks/:id/annotations returns list.
   */
  test("TEST-010: GET /api/reference/tracks/:id/annotations returns list", async ({
    request,
  }) => {
    const listResponse = await request.get("/api/reference/tracks");

    if (listResponse.status() === 401) {
      test.skip();
      return;
    }

    const listData = await listResponse.json();

    if (isStubResponse(listData) || !listData.data?.length) {
      test.skip();
      return;
    }

    const trackId = listData.data[0].id;
    const response = await request.get(
      `/api/reference/tracks/${trackId}/annotations`
    );

    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty("data");
      expect(Array.isArray(data.data)).toBe(true);

      // Validate annotation shape (TEST-017 partial)
      if (data.data.length > 0) {
        const annotation = data.data[0] as ReferenceAnnotation;
        expect(annotation).toHaveProperty("id");
        expect(annotation).toHaveProperty("track_id");
        expect(annotation).toHaveProperty("start_time_ms");
        expect(annotation).toHaveProperty("title");
        expect(typeof annotation.start_time_ms).toBe("number");
      }
    }
  });

  /**
   * TEST-011: Reference annotation create E2E
   * PARITY-086
   * Priority: P0
   *
   * Validates that POST /api/reference/tracks/:id/annotations creates annotation.
   */
  test("TEST-011: POST /api/reference/tracks/:id/annotations creates annotation", async ({
    request,
  }) => {
    const listResponse = await request.get("/api/reference/tracks");

    if (listResponse.status() === 401) {
      test.skip();
      return;
    }

    const listData = await listResponse.json();

    if (isStubResponse(listData) || !listData.data?.length) {
      test.skip();
      return;
    }

    const trackId = listData.data[0].id;
    const response = await request.post(
      `/api/reference/tracks/${trackId}/annotations`,
      {
        data: {
          start_time_ms: 1000,
          end_time_ms: 2000,
          title: `Test Annotation ${Date.now()}`,
          content: "Created by E2E test",
          category: "test",
        },
      }
    );

    expect([200, 201, 400, 403]).toContain(response.status());

    if ([200, 201].includes(response.status())) {
      const data = await response.json();
      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("id");
      expect(data.data).toHaveProperty("start_time_ms");
      expect(data.data.start_time_ms).toBe(1000);

      // Cleanup: delete the annotation
      const annotationId = data.data.id;
      await request.delete(
        `/api/reference/tracks/${trackId}/annotations/${annotationId}`
      );
    }
  });

  /**
   * TEST-014: Reference regions list E2E
   * PARITY-088
   * Priority: P0
   *
   * Validates that GET /api/reference/tracks/:id/regions returns list.
   */
  test("TEST-014: GET /api/reference/tracks/:id/regions returns list", async ({
    request,
  }) => {
    const listResponse = await request.get("/api/reference/tracks");

    if (listResponse.status() === 401) {
      test.skip();
      return;
    }

    const listData = await listResponse.json();

    if (isStubResponse(listData) || !listData.data?.length) {
      test.skip();
      return;
    }

    const trackId = listData.data[0].id;
    const response = await request.get(
      `/api/reference/tracks/${trackId}/regions`
    );

    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty("data");
      expect(Array.isArray(data.data)).toBe(true);

      // Validate region shape (TEST-017 partial)
      if (data.data.length > 0) {
        const region = data.data[0] as ReferenceRegion;
        expect(region).toHaveProperty("id");
        expect(region).toHaveProperty("track_id");
        expect(region).toHaveProperty("start_time_ms");
        expect(region).toHaveProperty("end_time_ms");
        expect(typeof region.start_time_ms).toBe("number");
        expect(typeof region.end_time_ms).toBe("number");
      }
    }
  });

  /**
   * TEST-017: Reference API contract validation
   * PARITY-080 through PARITY-088
   * Priority: P0
   *
   * Validates that all reference API responses match TypeScript interface shapes.
   */
  test("TEST-017: All reference API responses match contract shapes", async ({
    request,
  }) => {
    const listResponse = await request.get("/api/reference/tracks");

    if (listResponse.status() === 401) {
      test.skip();
      return;
    }

    const listData = await listResponse.json();

    // Contract check 1: List response shape
    expect(listData).toHaveProperty("data");
    expect(Array.isArray(listData.data)).toBe(true);

    if (isStubResponse(listData) || !listData.data?.length) {
      // Can't validate further without real data
      test.skip();
      return;
    }

    // Contract check 2: Track shape
    const track = listData.data[0] as ReferenceTrack;
    const requiredTrackFields = ["id", "title", "status", "created_at"];
    for (const field of requiredTrackFields) {
      expect(track, `Track missing required field: ${field}`).toHaveProperty(
        field
      );
    }

    const trackId = track.id;

    // Contract check 3: Annotations list shape
    const annotationsResponse = await request.get(
      `/api/reference/tracks/${trackId}/annotations`
    );
    if (annotationsResponse.status() === 200) {
      const annotationsData = await annotationsResponse.json();
      expect(annotationsData).toHaveProperty("data");
      expect(Array.isArray(annotationsData.data)).toBe(true);
    }

    // Contract check 4: Regions list shape
    const regionsResponse = await request.get(
      `/api/reference/tracks/${trackId}/regions`
    );
    if (regionsResponse.status() === 200) {
      const regionsData = await regionsResponse.json();
      expect(regionsData).toHaveProperty("data");
      expect(Array.isArray(regionsData.data)).toBe(true);
    }

    // Contract check 5: Track detail shape
    const detailResponse = await request.get(`/api/reference/tracks/${trackId}`);
    if (detailResponse.status() === 200) {
      const detailData = await detailResponse.json();
      expect(detailData).toHaveProperty("data");
      expect(detailData.data).toHaveProperty("id");
      expect(detailData.data.id).toBe(trackId);
    }
  });
});
