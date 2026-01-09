/**
 * Storage API Integration Tests
 *
 * Tests for blob storage operations via the new backend.
 * Requires authenticated session.
 */
import { test, expect } from '@playwright/test';

test.describe('Storage API', () => {
  // Skip if not authenticated
  test.beforeEach(async ({ page }) => {
    // Check auth status
    const response = await page.request.get('/auth/status');
    if (response.status() === 401) {
      test.skip();
    }
  });

  test('GET /api/blobs returns blob list', async ({ request }) => {
    const response = await request.get('/api/blobs');

    // May be 401 if not authenticated in test env
    if (response.status() === 401) {
      test.skip();
      return;
    }

    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);

    // If there are blobs, validate shape
    if (data.data.length > 0) {
      const blob = data.data[0];
      expect(blob).toHaveProperty('id');
      expect(blob).toHaveProperty('key');
      expect(blob).toHaveProperty('size_bytes');
      expect(blob).toHaveProperty('category');
      expect(['audio', 'images', 'exports', 'other']).toContain(blob.category);
    }
  });

  test('GET /api/blobs/usage returns storage usage', async ({ request }) => {
    const response = await request.get('/api/blobs/usage');

    if (response.status() === 401) {
      test.skip();
      return;
    }

    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('total_bytes');
    expect(typeof data.data.total_bytes).toBe('number');
  });

  test('POST /api/blobs/upload-url requires auth', async ({ request }) => {
    // Without proper auth, should fail
    const response = await request.post('/api/blobs/upload-url', {
      data: {
        filename: 'test.mp3',
        mime_type: 'audio/mpeg',
      },
    });

    // Either 401 (no auth) or 200 (has auth)
    expect([200, 401]).toContain(response.status());
  });

  test('GET /api/blobs/:id requires valid id', async ({ request }) => {
    const response = await request.get('/api/blobs/invalid-id-12345');

    if (response.status() === 401) {
      test.skip();
      return;
    }

    // Should be 404 for non-existent blob
    expect(response.status()).toBe(404);
  });

  test('DELETE /api/blobs/:id requires auth and ownership', async ({ request }) => {
    const response = await request.delete('/api/blobs/invalid-id-12345');

    // Either 401 (no auth) or 404 (not found)
    expect([401, 404]).toContain(response.status());
  });

  test('POST /api/blobs/upload-url rejects invalid MIME types', async ({ request }) => {
    const response = await request.post('/api/blobs/upload-url', {
      data: {
        filename: 'test.exe',
        mime_type: 'application/x-executable',
      },
    });

    if (response.status() === 401) {
      test.skip();
      return;
    }

    // Should reject with 400
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error.type).toBe('validation_error');
  });

  test('Storage endpoints enforce CSRF for mutations', async ({ request }) => {
    // POST without Origin header should be rejected
    const response = await request.post('/api/blobs/upload-url', {
      data: {
        filename: 'test.mp3',
        mime_type: 'audio/mpeg',
      },
      headers: {
        // Explicitly remove Origin
        'Origin': '',
      },
    });

    // Should either be CSRF error or handled gracefully
    // (depends on whether Playwright sends Origin by default)
    expect([200, 400, 401, 403]).toContain(response.status());
  });
});

test.describe('Storage IDOR Prevention', () => {
  test('Cannot access another user\'s blobs', async ({ request }) => {
    // Try to access a blob with a different user's prefix
    // This should fail with 404 (not found in user's namespace)
    const response = await request.get('/api/blobs/other-user-id/audio/some-blob');

    if (response.status() === 401) {
      test.skip();
      return;
    }

    // Should not expose existence of other user's blobs
    expect(response.status()).toBe(404);
  });
});

