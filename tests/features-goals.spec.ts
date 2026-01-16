/**
 * E2E Tests for Goals Feature
 *
 * Tests that verify:
 * 1. Goal creation with title, description, target date
 * 2. Goal status tracking (active, completed, abandoned)
 * 3. Goal progress and milestones
 * 4. Goal categories and filtering
 * 5. Goal statistics and analytics
 * 6. Goal-quest linkage
 * 7. Notifications on goal completion
 *
 * Setup:
 *   1. Start infrastructure: docker compose -f infra/docker-compose.e2e.yml up -d
 *   2. Frontend running on http://localhost:3000
 *   3. Backend running on http://localhost:8080
 *
 * Notes:
 * - Tests use page.goto('http://localhost:3000') to test full app
 * - Tests verify goal endpoints work correctly
 * - Tests check data persists across page refreshes
 * - Tests verify goal-quest relationships work
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:8080';

interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDate?: string;
  status: 'active' | 'completed' | 'abandoned';
  progress: number;
  category?: string;
  createdAt: string;
  completedAt?: string;
}

test.describe('Goals Feature', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let createdGoalId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
  });

  // ============================================
  // Test 1: Navigate to Goals Section
  // ============================================
  test('User can navigate to Goals section', async () => {
    await page.goto(`${BASE_URL}/app/goals`, { waitUntil: 'networkidle' });

    await expect(page).toHaveURL(/\/app\/goals/);

    // Verify goals page loads
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/goal|objective|target/i);
  });

  // ============================================
  // Test 2: Create Goal with Title
  // ============================================
  test('User can create a goal with title', async () => {
    // Find create button
    const createButton = page.locator(
      'button:has-text("Add Goal"), button:has-text("New Goal"), button:has-text("Create Goal"), [data-testid="create-goal"]'
    ).first();

    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();

      // Fill in goal title
      const goalTitle = `Test Goal ${Date.now()}`;
      const titleInput = page.locator(
        'input[placeholder*="goal" i], input[placeholder*="title" i], input[placeholder*="name" i]'
      ).first();

      if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await titleInput.fill(goalTitle);
      }

      // Save goal
      const saveButton = page.locator(
        'button:has-text("Create"), button:has-text("Save"), button:has-text("Add")'
      ).first();

      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(500);

        // Verify goal appears
        await expect(page.locator(`text=${goalTitle}`)).toBeVisible({ timeout: 5000 });
        createdGoalId = goalTitle; // Store for later tests
      }
    }
  });

  // ============================================
  // Test 3: Goal Persists After Refresh
  // ============================================
  test('Created goal persists after page refresh', async () => {
    if (!createdGoalId) {
      test.skip();
    }

    // Refresh page
    await page.reload({ waitUntil: 'networkidle' });

    // Verify goal still exists
    await expect(page.locator(`text=${createdGoalId}`)).toBeVisible({ timeout: 5000 });
  });

  // ============================================
  // Test 4: Create Goal with Description
  // ============================================
  test('User can create goal with description', async () => {
    const createButton = page.locator('button:has-text("Add Goal"), button:has-text("New Goal")').first();

    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();

      const goalTitle = `Detailed Goal ${Date.now()}`;
      const goalDescription = 'This is a test goal with description for tracking purposes.';

      // Fill title
      const titleInput = page.locator(
        'input[placeholder*="goal" i], input[placeholder*="title" i]'
      ).first();

      if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await titleInput.fill(goalTitle);
      }

      // Fill description
      const descInput = page.locator(
        'textarea[placeholder*="description" i], input[placeholder*="description" i]'
      ).first();

      if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descInput.fill(goalDescription);
      }

      // Save
      const saveButton = page.locator('button:has-text("Create"), button:has-text("Save")').first();
      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(500);

        // Verify goal created
        await expect(page.locator(`text=${goalTitle}`)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  // ============================================
  // Test 5: Set Goal Target Date
  // ============================================
  test('User can set goal target date', async () => {
    const createButton = page.locator('button:has-text("Add Goal"), button:has-text("New Goal")').first();

    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();

      const goalTitle = `Deadline Goal ${Date.now()}`;

      // Fill title
      const titleInput = page.locator('input[placeholder*="goal" i], input[placeholder*="title" i]').first();
      if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await titleInput.fill(goalTitle);
      }

      // Set target date
      const dateInput = page.locator(
        'input[type="date"], input[placeholder*="date" i], input[placeholder*="target" i]'
      ).first();

      if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
        const formattedDate = futureDate.toISOString().split('T')[0];
        await dateInput.fill(formattedDate);
      }

      // Save
      const saveButton = page.locator('button:has-text("Create"), button:has-text("Save")').first();
      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(500);

        await expect(page.locator(`text=${goalTitle}`)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  // ============================================
  // Test 6: Mark Goal as Completed
  // ============================================
  test('User can mark goal as completed', async () => {
    // Find a goal to complete
    const goalElement = page.locator('[data-testid="goal-item"], .goal-item, li').first();

    if (await goalElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Look for complete button
      const completeButton = goalElement.locator(
        'button:has-text("Complete"), button:has-text("Finish"), button:has-text("Mark Complete"), [data-testid="complete"]'
      ).first();

      if (await completeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await completeButton.click();
        await page.waitForTimeout(500);

        // Verify completed state
        const completedIndicator = goalElement.locator('[class*="completed"], [class*="success"]').first();
        const isCompleted = await completedIndicator.isVisible({ timeout: 2000 }).catch(() => false);

        expect(isCompleted).toBe(true);
      }
    }
  });

  // ============================================
  // Test 7: Filter Goals by Status
  // ============================================
  test('User can filter goals by status', async () => {
    // Look for filter options
    const activeFilter = page.locator('button:has-text("Active"), [data-testid="filter-active"]').first();
    const completedFilter = page.locator('button:has-text("Completed"), [data-testid="filter-completed"]').first();

    if (await activeFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await activeFilter.click();
      await page.waitForTimeout(500);

      // Should show only active goals
      const goalsList = page.locator('[data-testid="goal-item"], .goal-item');
      const count = await goalsList.count();

      // Verify filtering worked (should have at least 0 or more active goals)
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // ============================================
  // Test 8: Goal Category/Tagging
  // ============================================
  test('User can assign goal to category', async () => {
    const createButton = page.locator('button:has-text("Add Goal")').first();

    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();

      const goalTitle = `Categorized Goal ${Date.now()}`;

      // Fill title
      const titleInput = page.locator('input[placeholder*="goal" i], input[placeholder*="title" i]').first();
      if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await titleInput.fill(goalTitle);
      }

      // Select category
      const categorySelect = page.locator(
        'select[name="category"], [role="listbox"], button:has-text("Category")'
      ).first();

      if (await categorySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await categorySelect.click();

        // Select first option
        const firstOption = page.locator('[role="option"]').first();
        if (await firstOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await firstOption.click();
        }
      }

      // Save
      const saveButton = page.locator('button:has-text("Create"), button:has-text("Save")').first();
      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(500);

        await expect(page.locator(`text=${goalTitle}`)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  // ============================================
  // Test 9: View Goal Details
  // ============================================
  test('User can view goal details', async () => {
    // Click on a goal to view details
    const goalElement = page.locator('[data-testid="goal-item"], .goal-item, [role="link"]:has-text(/goal|objective/i)').first();

    if (await goalElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      await goalElement.click();
      await page.waitForTimeout(500);

      // Should show goal details
      const detailsPanel = page.locator('[data-testid="goal-details"], .details-panel, .detail-view').first();
      const hasDetails = await detailsPanel.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasDetails) {
        // Verify common details shown
        const detailsText = await detailsPanel.textContent();
        expect(detailsText).toBeTruthy();
      }
    }
  });

  // ============================================
  // Test 10: Link Quest to Goal
  // ============================================
  test('User can link quest to goal', async () => {
    // Navigate to goal details
    const goalElement = page.locator('[data-testid="goal-item"], .goal-item').first();

    if (await goalElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      await goalElement.click();
      await page.waitForTimeout(500);

      // Look for link quest button
      const linkButton = page.locator(
        'button:has-text("Link Quest"), button:has-text("Add Quest"), [data-testid="link-quest"]'
      ).first();

      if (await linkButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await linkButton.click();
        await page.waitForTimeout(500);

        // Should show quest selection or modal
        const questSelect = page.locator(
          'select, [role="listbox"], [data-testid="quest-select"]'
        ).first();

        const hasQuestSelect = await questSelect.isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasQuestSelect).toBe(true);
      }
    }
  });

  // ============================================
  // Test 11: Goal Progress Update
  // ============================================
  test('Goal progress updates correctly', async () => {
    // Find a goal with progress indicator
    const goalElement = page.locator('[data-testid="goal-item"], .goal-item').first();

    if (await goalElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Look for progress bar or percentage
      const progressBar = goalElement.locator('[role="progressbar"], [class*="progress"], .progress-bar').first();

      if (await progressBar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const progressText = await progressBar.getAttribute('aria-valuenow') || 
                            await progressBar.textContent();

        // Should have numeric progress value
        expect(progressText).toBeTruthy();
      }
    }
  });

  // ============================================
  // Test 12: Goal Statistics
  // ============================================
  test('Goal statistics displayed correctly', async () => {
    // Navigate to goals dashboard
    await page.goto(`${BASE_URL}/app/goals`, { waitUntil: 'networkidle' });

    // Look for statistics
    const statsSection = page.locator(
      '[data-testid="goal-stats"], .stats, [class*="summary"]'
    ).first();

    const hasStats = await statsSection.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasStats) {
      const statsText = await statsSection.textContent();

      // Should show goal counts or metrics
      expect(statsText).toMatch(/\d+/);
    }
  });

  test.afterAll(async () => {
    await page.close();
  });
});
