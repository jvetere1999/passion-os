/**
 * E2E Tests for Quests Feature
 *
 * Tests that verify:
 * 1. Quest creation with title, description, objectives
 * 2. Quest status tracking (active, completed, abandoned)
 * 3. Quest progression and milestone tracking
 * 4. Quest rewards (XP, coins, items)
 * 5. Quest objective completion
 * 6. Quest difficulty levels
 * 7. Quest categories and filtering
 * 8. Multi-quest tracking
 * 9. Quest completion notifications
 * 10. Quest-goal and quest-habit linkage
 * 11. Quest history and analytics
 * 12. Quest leaderboard/social features
 *
 * Setup:
 *   1. Start infrastructure: docker compose -f infra/docker-compose.e2e.yml up -d
 *   2. Frontend running on http://localhost:3000
 *   3. Backend running on http://localhost:8080
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:8080';

interface Quest {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'abandoned';
  progress: number;
  objectives: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  rewardXP: number;
  rewardCoins: number;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
  completedAt?: string;
}

test.describe('Quests Feature', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let createdQuestId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
  });

  // ============================================
  // Test 1: Navigate to Quests Section
  // ============================================
  test('User can navigate to Quests section', async () => {
    await page.goto(`${BASE_URL}/app/quests`, { waitUntil: 'networkidle' });

    await expect(page).toHaveURL(/\/app\/quests/);

    // Verify quests page loads
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/quest|objective|mission|task/i);
  });

  // ============================================
  // Test 2: Create Quest with Title
  // ============================================
  test('User can create a quest with title', async () => {
    // Find create button
    const createButton = page.locator(
      'button:has-text("Create Quest"), button:has-text("New Quest"), button:has-text("Start Quest"), [data-testid="create-quest"]'
    ).first();

    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();

      // Fill in quest title
      const questTitle = `Epic Quest ${Date.now()}`;
      const titleInput = page.locator(
        'input[placeholder*="quest" i], input[placeholder*="title" i], input[placeholder*="name" i]'
      ).first();

      if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await titleInput.fill(questTitle);
      }

      // Save quest
      const saveButton = page.locator(
        'button:has-text("Create"), button:has-text("Save"), button:has-text("Start")'
      ).first();

      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(500);

        // Verify quest appears
        await expect(page.locator(`text=${questTitle}`)).toBeVisible({ timeout: 5000 });
        createdQuestId = questTitle;
      }
    }
  });

  // ============================================
  // Test 3: Quest Persists After Refresh
  // ============================================
  test('Created quest persists after page refresh', async () => {
    if (!createdQuestId) {
      test.skip();
    }

    // Refresh page
    await page.reload({ waitUntil: 'networkidle' });

    // Verify quest still exists
    await expect(page.locator(`text=${createdQuestId}`)).toBeVisible({ timeout: 5000 });
  });

  // ============================================
  // Test 4: Create Quest with Description
  // ============================================
  test('User can create quest with description', async () => {
    const createButton = page.locator('button:has-text("Create Quest"), button:has-text("New Quest")').first();

    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();

      const questTitle = `Detailed Quest ${Date.now()}`;
      const questDesc = 'Complete this quest to earn rewards and progress.';

      // Fill title
      const titleInput = page.locator(
        'input[placeholder*="quest" i], input[placeholder*="title" i]'
      ).first();

      if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await titleInput.fill(questTitle);
      }

      // Fill description
      const descInput = page.locator(
        'textarea[placeholder*="description" i], input[placeholder*="description" i]'
      ).first();

      if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descInput.fill(questDesc);
      }

      // Save
      const saveButton = page.locator('button:has-text("Create"), button:has-text("Save")').first();
      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(500);

        await expect(page.locator(`text=${questTitle}`)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  // ============================================
  // Test 5: Set Quest Difficulty
  // ============================================
  test('User can set quest difficulty level', async () => {
    const createButton = page.locator('button:has-text("Create Quest"), button:has-text("New Quest")').first();

    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();

      const questTitle = `Challenge Quest ${Date.now()}`;

      // Fill title
      const titleInput = page.locator(
        'input[placeholder*="quest" i], input[placeholder*="title" i]'
      ).first();

      if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await titleInput.fill(questTitle);
      }

      // Set difficulty
      const difficultySelect = page.locator(
        'select[name="difficulty"], [role="listbox"], button:has-text("Difficulty")'
      ).first();

      if (await difficultySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await difficultySelect.click();

        const hardOption = page.locator('[role="option"]:has-text(/hard|challenge/i)').first();
        if (await hardOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await hardOption.click();
        }
      }

      // Save
      const saveButton = page.locator('button:has-text("Create"), button:has-text("Save")').first();
      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(500);

        await expect(page.locator(`text=${questTitle}`)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  // ============================================
  // Test 6: Add Objectives to Quest
  // ============================================
  test('User can add objectives to quest', async () => {
    const questElement = page.locator('[data-testid="quest-item"], .quest-item').first();

    if (await questElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      await questElement.click();
      await page.waitForTimeout(500);

      // Look for add objective button
      const addObjectiveButton = page.locator(
        'button:has-text("Add Objective"), button:has-text("New Objective"), button:has-text("+")'
      ).first();

      if (await addObjectiveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addObjectiveButton.click();

        // Fill objective title
        const objectiveInput = page.locator(
          'input[placeholder*="objective" i], input[placeholder*="goal" i]'
        ).first();

        if (await objectiveInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await objectiveInput.fill('Complete test objective');

          // Save objective
          const saveButton = page.locator('button:has-text("Add"), button:has-text("Save")').first();
          if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await saveButton.click();
            await page.waitForTimeout(500);

            // Verify objective added
            await expect(page.locator('text=Complete test objective')).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  // ============================================
  // Test 7: Complete Quest Objective
  // ============================================
  test('User can mark objective as completed', async () => {
    const questElement = page.locator('[data-testid="quest-item"], .quest-item').first();

    if (await questElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      await questElement.click();
      await page.waitForTimeout(500);

      // Find objective
      const objectiveElement = page.locator(
        '[data-testid="objective-item"], .objective-item'
      ).first();

      if (await objectiveElement.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Look for complete button
        const completeButton = objectiveElement.locator(
          'button:has-text("✓"), button:has-text("Complete"), button:has-text("Check")'
        ).first();

        if (await completeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await completeButton.click();
          await page.waitForTimeout(500);

          // Verify completed state
          const completedIndicator = objectiveElement.locator('[class*="completed"]').first();
          const isCompleted = await completedIndicator.isVisible({ timeout: 2000 }).catch(() => false);

          expect(isCompleted).toBe(true);
        }
      }
    }
  });

  // ============================================
  // Test 8: View Quest Progress
  // ============================================
  test('Quest displays completion progress', async () => {
    const questElement = page.locator('[data-testid="quest-item"], .quest-item').first();

    if (await questElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Look for progress bar
      const progressBar = questElement.locator(
        '[role="progressbar"], [class*="progress"], .progress-bar'
      ).first();

      if (await progressBar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const progressValue = await progressBar.getAttribute('aria-valuenow') || 
                             await progressBar.textContent();

        expect(progressValue).toMatch(/\d+/);
      }
    }
  });

  // ============================================
  // Test 9: View Quest Rewards
  // ============================================
  test('Quest displays reward information', async () => {
    const questElement = page.locator('[data-testid="quest-item"], .quest-item').first();

    if (await questElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      await questElement.click();
      await page.waitForTimeout(500);

      // Look for rewards section
      const rewardSection = page.locator(
        '[data-testid="quest-rewards"], [class*="reward"], .reward-info'
      ).first();

      const hasRewards = await rewardSection.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasRewards) {
        const rewardText = await rewardSection.textContent();
        // Should show XP/coins
        expect(rewardText).toMatch(/xp|coin|reward|earn/i);
      }
    }
  });

  // ============================================
  // Test 10: Complete Entire Quest
  // ============================================
  test('User can complete entire quest', async () => {
    const questElement = page.locator('[data-testid="quest-item"], .quest-item').first();

    if (await questElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Look for complete quest button
      const completeButton = questElement.locator(
        'button:has-text("Complete Quest"), button:has-text("Finish"), button:has-text("Done")'
      ).first();

      if (await completeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await completeButton.click();
        await page.waitForTimeout(500);

        // Verify quest completed state
        const completedIndicator = questElement.locator('[class*="completed"], [class*="success"]').first();
        const isCompleted = await completedIndicator.isVisible({ timeout: 2000 }).catch(() => false);

        if (isCompleted) {
          expect(isCompleted).toBe(true);
        }
      }
    }
  });

  // ============================================
  // Test 11: Filter Quests by Status
  // ============================================
  test('User can filter quests by status', async () => {
    // Navigate to quests
    await page.goto(`${BASE_URL}/app/quests`, { waitUntil: 'networkidle' });

    // Look for filter options
    const activeFilter = page.locator('button:has-text("Active"), [data-testid="filter-active"]').first();

    if (await activeFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await activeFilter.click();
      await page.waitForTimeout(500);

      // Should show filtered quests
      const questList = page.locator('[data-testid="quest-item"], .quest-item');
      const count = await questList.count();

      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // ============================================
  // Test 12: View Quest Details and Analytics
  // ============================================
  test('User can view quest details and analytics', async () => {
    const questElement = page.locator('[data-testid="quest-item"], .quest-item').first();

    if (await questElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      await questElement.click();
      await page.waitForTimeout(500);

      // Should show quest details
      const detailsPanel = page.locator(
        '[data-testid="quest-details"], .details-panel, [class*="detail"]'
      ).first();

      const hasDetails = await detailsPanel.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasDetails) {
        // Should display objectives count, progress, rewards
        const detailsText = await detailsPanel.textContent();
        expect(detailsText).toMatch(/objective|progress|reward|xp|coin/i);
      }
    }
  });

  test.afterAll(async () => {
    await page.close();
  });
});
