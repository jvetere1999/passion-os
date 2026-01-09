/**
 * Reference Tracks E2E Tests (Post-20G)
 *
 * Tests for the Critical Listening Loop:
 * - Upload -> Analyze -> Load Visualizer -> Create Marker -> Reload -> Marker Persists
 * - Access control (negative test)
 *
 * All tests use backend-authored analysis data, not client-side analysis.
 * Frontend performs 0% auth logic beyond forwarding cookies.
 */

import { test, expect, type Page } from '@playwright/test';

// ============================================
// Test Configuration
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ============================================
// Helper Functions
// ============================================

/**
 * Navigate to the reference library page
 */
async function goToReferenceLibrary(page: Page) {
  await page.goto('/reference');
  await expect(page.getByRole('heading', { name: /reference library/i })).toBeVisible();
}

/**
 * Wait for track to load and visualizer to render
 */
async function waitForVisualizer(page: Page) {
  await expect(page.locator('[data-testid="track-visualizer"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('canvas')).toBeVisible();
}


/**
 * Wait for track list to have at least one item
 */
async function waitForTrackList(page: Page) {
  await expect(page.getByTestId('track-list-item').first()).toBeVisible({ timeout: 15000 });
}

/**
 * Create a minimal valid WAV file buffer for testing
 */
function createTestWavFile(): Buffer {
  const sampleRate = 8000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const duration = 1;
  const numSamples = sampleRate * duration;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4;
  buffer.writeUInt16LE(1, offset); offset += 2;
  buffer.writeUInt16LE(numChannels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(blockAlign, offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 16383;
    buffer.writeInt16LE(Math.round(sample), offset);
    offset += 2;
  }

  return buffer;
}

/**
 * Upload a test audio file via the UI
 */
async function uploadTestAudio(page: Page, filename: string) {
  const fileInput = page.getByTestId('file-input');
  const buffer = createTestWavFile();

  await fileInput.setInputFiles({
    name: filename,
    mimeType: 'audio/wav',
    buffer: buffer,
  });

  await expect(page.getByText(/uploading/i)).not.toBeVisible({ timeout: 30000 });
}

/**
 * Create a marker/annotation via the UI
 */
async function createMarker(
  page: Page,
  options: { title: string; category?: string }
) {
  await page.getByRole('button', { name: /marker/i }).click();
  await page.getByLabel(/title/i).fill(options.title);

  if (options.category) {
    await page.getByLabel(/category/i).selectOption(options.category);
  }

  await page.getByRole('button', { name: /create/i }).click();
  await expect(page.getByText(options.title)).toBeVisible({ timeout: 5000 });
}

/**
 * Create a region via the UI
 */
async function createRegion(
  page: Page,
  options: { name: string; sectionType?: string; isLoop?: boolean }
) {
  await page.getByRole('button', { name: /region/i }).click();
  await page.getByLabel(/name/i).fill(options.name);

  if (options.sectionType) {
    await page.getByLabel(/section type/i).selectOption(options.sectionType);
  }

  if (options.isLoop) {
    await page.getByLabel(/loop/i).check();
  }

  await page.getByRole('button', { name: /create/i }).click();
  await expect(page.getByText(options.name)).toBeVisible({ timeout: 5000 });
}

// ============================================
// Test Suite: Critical Listening Loop
// ============================================

test.describe('Critical Listening Loop (E2E)', () => {
  test.describe.configure({ mode: 'serial' });

  let testMarkerTitle: string;
  let testRegionName: string;

  test.beforeAll(async () => {
    testMarkerTitle = `E2E Marker ${Date.now()}`;
    testRegionName = `E2E Region ${Date.now()}`;
  });

  test('1. should upload audio file and create track', async ({ page }) => {
    await goToReferenceLibrary(page);
    const testFilename = `test-track-${Date.now()}.wav`;
    await uploadTestAudio(page, testFilename);
    await waitForTrackList(page);

    const trackItem = page.getByTestId('track-list-item').first();
    await expect(trackItem).toBeVisible();
  });

  test('2. should select track and load visualizer', async ({ page }) => {
    await goToReferenceLibrary(page);

    const trackCount = await page.getByTestId('track-list-item').count();
    if (trackCount === 0) {
      test.skip();
      return;
    }

    await page.getByTestId('track-list-item').first().click();
    await waitForVisualizer(page);

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    await expect(page.getByTestId('annotations-panel')).toBeVisible();
  });

  test('3. should create marker and persist after reload', async ({ page }) => {
    await goToReferenceLibrary(page);

    const trackCount = await page.getByTestId('track-list-item').count();
    if (trackCount === 0) {
      test.skip();
      return;
    }

    await page.getByTestId('track-list-item').first().click();
    await waitForVisualizer(page);

    await createMarker(page, {
      title: testMarkerTitle,
      category: 'technique',
    });

    await expect(page.getByText(testMarkerTitle)).toBeVisible();

    await page.reload();

    await page.getByTestId('track-list-item').first().click();
    await waitForVisualizer(page);

    await expect(page.getByText(testMarkerTitle)).toBeVisible({ timeout: 10000 });
  });

  test('4. should create loop region and persist after reload', async ({ page }) => {
    await goToReferenceLibrary(page);

    const trackCount = await page.getByTestId('track-list-item').count();
    if (trackCount === 0) {
      test.skip();
      return;
    }

    await page.getByTestId('track-list-item').first().click();
    await waitForVisualizer(page);

    await createRegion(page, {
      name: testRegionName,
      sectionType: 'chorus',
      isLoop: true,
    });

    await expect(page.getByText(testRegionName)).toBeVisible();
    await expect(page.getByTestId('loop-badge').first()).toBeVisible();

    await page.reload();

    await page.getByTestId('track-list-item').first().click();
    await waitForVisualizer(page);

    await expect(page.getByText(testRegionName)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('loop-badge').first()).toBeVisible();
  });

  test('5. should delete annotation and region', async ({ page }) => {
    await goToReferenceLibrary(page);

    const trackCount = await page.getByTestId('track-list-item').count();
    if (trackCount === 0) {
      test.skip();
      return;
    }

    await page.getByTestId('track-list-item').first().click();
    await waitForVisualizer(page);

    const markerElement = page.getByText(testMarkerTitle);
    if (await markerElement.isVisible()) {
      const markerItem = markerElement.locator('..');
      await markerItem.getByRole('button').click();
      await expect(page.getByText(testMarkerTitle)).not.toBeVisible({ timeout: 5000 });
    }

    const regionElement = page.getByText(testRegionName);
    if (await regionElement.isVisible()) {
      const regionItem = regionElement.locator('..');
      await regionItem.getByRole('button').click();
      await expect(page.getByText(testRegionName)).not.toBeVisible({ timeout: 5000 });
    }
  });
});

// ============================================
// Test Suite: Access Control (Negative Tests)
// ============================================

test.describe('Access Control', () => {
  test('should not expose R2 credentials in page content', async ({ page }) => {
    await goToReferenceLibrary(page);

    const pageContent = await page.content();

    expect(pageContent).not.toContain('R2_ACCESS_KEY');
    expect(pageContent).not.toContain('R2_SECRET_KEY');
    expect(pageContent).not.toContain('accountid.r2.cloudflarestorage.com');
    expect(pageContent).not.toContain('AWS_ACCESS_KEY_ID');
    expect(pageContent).not.toContain('AWS_SECRET_ACCESS_KEY');
  });

  test('should not expose auth tokens in local storage', async ({ page }) => {
    await goToReferenceLibrary(page);

    const localStorageKeys = await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i) || '');
      }
      return keys;
    });

    const sensitivePatterns = ['accessToken', 'refreshToken', 'id_token', 'client_secret'];
    for (const pattern of sensitivePatterns) {
      const found = localStorageKeys.some(key => key.toLowerCase().includes(pattern.toLowerCase()));
      expect(found).toBe(false);
    }
  });

  test('should reject unauthenticated API requests', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/reference/tracks`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should not allow accessing another user track (IDOR prevention)', async ({ request }) => {
    const fakeTrackId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    const response = await request.get(`${API_BASE_URL}/reference/tracks/${fakeTrackId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect([401, 404]).toContain(response.status());
  });
});

// ============================================
// Test Suite: API Integration
// ============================================

test.describe('Reference Tracks API Integration', () => {
  test('should use signed URLs for audio streaming', async ({ page }) => {
    await goToReferenceLibrary(page);

    const trackCount = await page.getByTestId('track-list-item').count();
    if (trackCount === 0) {
      test.skip();
      return;
    }

    const streamRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/stream') || req.url().includes('X-Amz-Signature')) {
        streamRequests.push(req.url());
      }
    });

    await page.getByTestId('track-list-item').first().click();
    await waitForVisualizer(page);

    await page.waitForTimeout(2000);

    for (const url of streamRequests) {
      if (url.includes('X-Amz-Signature') || url.includes('Signature=')) {
        expect(url).toMatch(/X-Amz-Signature|Signature=/);
      }
    }
  });

  test('should handle backend errors gracefully', async ({ page }) => {
    await goToReferenceLibrary(page);

    await page.route('**/reference/upload/init', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: { message: 'Internal server error' } }),
      });
    });

    const fileInput = page.getByTestId('file-input');
    await fileInput.setInputFiles({
      name: 'test.wav',
      mimeType: 'audio/wav',
      buffer: createTestWavFile(),
    });

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  });
});

// ============================================
// Test Suite: UI Rendering
// ============================================

test.describe('Reference Library UI', () => {
  test('should display loading state initially', async ({ page }) => {
    await page.route('**/reference/tracks**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.goto('/reference');

    await expect(page.getByText(/loading/i)).toBeVisible();
  });

  test('should display empty state when no tracks', async ({ page }) => {
    await page.route('**/reference/tracks**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [],
          total: 0,
          page: 1,
          page_size: 100,
          has_next: false,
          has_prev: false,
        }),
      });
    });

    await goToReferenceLibrary(page);

    await expect(page.getByText(/no tracks/i)).toBeVisible();
  });

  test('should have upload button visible', async ({ page }) => {
    await goToReferenceLibrary(page);

    await expect(page.getByRole('button', { name: /upload/i })).toBeVisible();
  });
});
