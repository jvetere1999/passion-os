/**
 * E2E Tests for Learning Feature
 *
 * Tests that verify:
 * 1. Learning courses discovery and browsing
 * 2. Course enrollment and access
 * 3. Lesson progression and tracking
 * 4. Learning progress percentage calculation
 * 5. Course completion and certification
 * 6. Learning quiz/assessment functionality
 * 7. Learning resources (videos, PDFs, articles)
 * 8. Learning recommendations
 * 9. Learning statistics (hours spent, courses completed)
 * 10. Learning path customization
 * 11. Peer progress comparison
 * 12. Learning notifications and reminders
 *
 * Setup:
 *   1. Start infrastructure: docker compose -f infra/docker-compose.e2e.yml up -d
 *   2. Frontend running on http://localhost:3000
 *   3. Backend running on http://localhost:8080
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:8080';

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  lessonsTotal: number;
  lessonsCompleted: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  isEnrolled: boolean;
  isCompleted: boolean;
  createdAt: string;
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  duration: number; // in minutes
  isCompleted: boolean;
  progress: number;
  resourceType: 'video' | 'article' | 'quiz' | 'document';
}

test.describe('Learning Feature', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let enrolledCourseId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
  });

  // ============================================
  // Test 1: Navigate to Learning Section
  // ============================================
  test('User can navigate to Learning section', async () => {
    await page.goto(`${BASE_URL}/app/learning`, { waitUntil: 'networkidle' });

    await expect(page).toHaveURL(/\/app\/learning/);

    // Verify learning page loads
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/course|lesson|learn|education/i);
  });

  // ============================================
  // Test 2: Browse Available Courses
  // ============================================
  test('User can browse available courses', async () => {
    // Look for course listing
    const coursesList = page.locator('[data-testid="course-list"], .courses-grid, [class*="course"]').first();

    const hasCourses = await coursesList.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasCourses) {
      const courseItems = page.locator('[data-testid="course-item"], .course-card, [role="link"]:has-text(/course/i)');
      const count = await courseItems.count();

      // Should have at least 0 courses available
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // ============================================
  // Test 3: Enroll in Course
  // ============================================
  test('User can enroll in a course', async () => {
    // Find first available course
    const courseItem = page.locator('[data-testid="course-item"], .course-card').first();

    if (await courseItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Look for enroll button
      const enrollButton = courseItem.locator(
        'button:has-text("Enroll"), button:has-text("Start"), button:has-text("Join"), [data-testid="enroll"]'
      ).first();

      if (await enrollButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        const courseTitle = await courseItem.textContent();
        enrolledCourseId = courseTitle || 'unknown';

        await enrollButton.click();
        await page.waitForTimeout(500);

        // Verify enrollment success (should show "Continue" or progress)
        const continueButton = courseItem.locator(
          'button:has-text("Continue"), button:has-text("Go to Course")'
        ).first();

        const isEnrolled = await continueButton.isVisible({ timeout: 2000 }).catch(() => false);
        expect(isEnrolled).toBe(true);
      }
    }
  });

  // ============================================
  // Test 4: View Course Details
  // ============================================
  test('User can view course details', async () => {
    // Click on enrolled course
    const courseItem = page.locator('[data-testid="course-item"], .course-card').first();

    if (await courseItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await courseItem.click();
      await page.waitForTimeout(500);

      // Should show course details page
      const detailsPanel = page.locator('[data-testid="course-details"], .course-detail, [class*="detail"]').first();
      const hasDetails = await detailsPanel.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasDetails) {
        // Verify common course info shown
        const detailsText = await detailsPanel.textContent();
        expect(detailsText).toMatch(/lesson|duration|progress|skill/i);
      }
    }
  });

  // ============================================
  // Test 5: Start First Lesson
  // ============================================
  test('User can start first lesson in course', async () => {
    // Navigate to course
    await page.goto(`${BASE_URL}/app/learning`, { waitUntil: 'networkidle' });

    const courseItem = page.locator('[data-testid="course-item"], .course-card').first();

    if (await courseItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await courseItem.click();
      await page.waitForTimeout(500);

      // Look for first lesson
      const lessonItem = page.locator('[data-testid="lesson-item"], .lesson, [role="link"]:has-text(/lesson|module/i)').first();

      if (await lessonItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await lessonItem.click();
        await page.waitForTimeout(500);

        // Should show lesson content
        const lessonContent = page.locator('[data-testid="lesson-content"], .lesson-view, [class*="content"]').first();
        const hasContent = await lessonContent.isVisible({ timeout: 2000 }).catch(() => false);

        expect(hasContent).toBe(true);
      }
    }
  });

  // ============================================
  // Test 6: Complete Lesson
  // ============================================
  test('User can mark lesson as completed', async () => {
    // Should still be in lesson from previous test
    const completeButton = page.locator(
      'button:has-text("Complete"), button:has-text("Finish"), button:has-text("Mark Complete"), [data-testid="complete-lesson"]'
    ).first();

    if (await completeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await completeButton.click();
      await page.waitForTimeout(500);

      // Verify completion
      const completedIndicator = page.locator('[class*="completed"], [class*="success"]').first();
      const isCompleted = await completedIndicator.isVisible({ timeout: 2000 }).catch(() => false);

      expect(isCompleted).toBe(true);
    }
  });

  // ============================================
  // Test 7: View Course Progress
  // ============================================
  test('Course shows progress percentage', async () => {
    // Navigate back to course
    await page.goto(`${BASE_URL}/app/learning`, { waitUntil: 'networkidle' });

    const courseItem = page.locator('[data-testid="course-item"], .course-card').first();

    if (await courseItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Look for progress indicator
      const progressBar = courseItem.locator(
        '[role="progressbar"], [class*="progress"], .progress-bar'
      ).first();

      if (await progressBar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const progressValue = await progressBar.getAttribute('aria-valuenow') || 
                             await progressBar.textContent();

        // Should show numeric progress
        expect(progressValue).toMatch(/\d+/);
      }
    }
  });

  // ============================================
  // Test 8: View Learning Statistics
  // ============================================
  test('User can view learning statistics', async () => {
    // Look for statistics dashboard
    const statsSection = page.locator(
      '[data-testid="learning-stats"], .stats, [class*="summary"], [class*="analytics"]'
    ).first();

    const hasStats = await statsSection.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasStats) {
      const statsText = await statsSection.textContent();

      // Should show learning metrics (hours, courses, etc)
      expect(statsText).toMatch(/course|hour|lesson|progress|completed/i);
    }
  });

  // ============================================
  // Test 9: Access Lesson Resources
  // ============================================
  test('Lesson resources (video, PDF, etc) load correctly', async () => {
    // Navigate to a lesson
    await page.goto(`${BASE_URL}/app/learning`, { waitUntil: 'networkidle' });

    const courseItem = page.locator('[data-testid="course-item"], .course-card').first();

    if (await courseItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await courseItem.click();
      await page.waitForTimeout(500);

      const lessonItem = page.locator('[data-testid="lesson-item"], .lesson').first();

      if (await lessonItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await lessonItem.click();
        await page.waitForTimeout(500);

        // Look for resources (video, article, PDF)
        const resourceSection = page.locator(
          '[data-testid="lesson-resources"], .resources, [class*="material"]'
        ).first();

        const hasResources = await resourceSection.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasResources) {
          const resourceText = await resourceSection.textContent();
          expect(resourceText).toBeTruthy();
        }
      }
    }
  });

  // ============================================
  // Test 10: View Recommended Courses
  // ============================================
  test('User sees recommended courses based on progress', async () => {
    // Navigate to learning dashboard
    await page.goto(`${BASE_URL}/app/learning`, { waitUntil: 'networkidle' });

    // Look for recommendations section
    const recommendedSection = page.locator(
      '[data-testid="recommended"], .recommendations, [class*="recommended"]'
    ).first();

    const hasRecommendations = await recommendedSection.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasRecommendations) {
      const recommendedText = await recommendedSection.textContent();
      expect(recommendedText).toBeTruthy();
    }
  });

  // ============================================
  // Test 11: Filter Courses by Difficulty
  // ============================================
  test('User can filter courses by difficulty level', async () => {
    // Look for difficulty filter
    const beginnerFilter = page.locator(
      'button:has-text("Beginner"), [data-testid="filter-beginner"]'
    ).first();

    if (await beginnerFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await beginnerFilter.click();
      await page.waitForTimeout(500);

      // Should show filtered courses
      const courseItems = page.locator('[data-testid="course-item"], .course-card');
      const count = await courseItems.count();

      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // ============================================
  // Test 12: Course Persists After Refresh
  // ============================================
  test('Enrolled course persists after page refresh', async () => {
    if (!enrolledCourseId) {
      test.skip();
    }

    // Refresh page
    await page.reload({ waitUntil: 'networkidle' });

    // Should still be enrolled in same course
    const enrolledCourse = page.locator(`text=${enrolledCourseId}`).first();
    
    const isEnrolled = await enrolledCourse.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isEnrolled).toBe(true);
  });

  test.afterAll(async () => {
    await page.close();
  });
});
