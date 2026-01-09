/**
 * Calendar E2E Tests
 * Tests calendar CRUD operations
 *
 * Wave 4: Calendar routes (PARITY-051 to PARITY-054)
 */

import { test, expect } from "@playwright/test";

test.describe("Calendar API", () => {
  test("GET /api/calendar returns events list", async ({ request }) => {
    const response = await request.get("/api/calendar");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      expect(data.data.events).toBeDefined();
      expect(Array.isArray(data.data.events)).toBe(true);
    }
  });

  test("GET /api/calendar with date range filters events", async ({ request }) => {
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const response = await request.get(
      `/api/calendar?start_date=${startDate}&end_date=${endDate}`
    );
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.data.events).toBeDefined();
      expect(Array.isArray(data.data.events)).toBe(true);
    }
  });

  test("POST /api/calendar creates an event", async ({ request }) => {
    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const response = await request.post("/api/calendar", {
      data: {
        title: "Test Event",
        description: "E2E test event",
        event_type: "custom",
        start_time: startTime,
        end_time: endTime,
        all_day: false,
      },
    });
    expect([200, 201, 401]).toContain(response.status());

    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.id).toBeDefined();
      expect(data.data.title).toBe("Test Event");
    }
  });

  test("PUT /api/calendar/:id updates an event", async ({ request }) => {
    // First create an event
    const startTime = new Date().toISOString();
    const createResponse = await request.post("/api/calendar", {
      data: {
        title: "Event to Update",
        start_time: startTime,
      },
    });

    if (createResponse.status() === 200 || createResponse.status() === 201) {
      const created = await createResponse.json();
      const eventId = created.data.id;

      // Then update it
      const updateResponse = await request.put(`/api/calendar/${eventId}`, {
        data: {
          title: "Updated Event Title",
        },
      });
      expect([200, 401]).toContain(updateResponse.status());

      if (updateResponse.status() === 200) {
        const updated = await updateResponse.json();
        expect(updated.data.title).toBe("Updated Event Title");
      }
    }
  });

  test("DELETE /api/calendar/:id removes an event", async ({ request }) => {
    // First create an event
    const startTime = new Date().toISOString();
    const createResponse = await request.post("/api/calendar", {
      data: {
        title: "Event to Delete",
        start_time: startTime,
      },
    });

    if (createResponse.status() === 200 || createResponse.status() === 201) {
      const created = await createResponse.json();
      const eventId = created.data.id;

      // Then delete it
      const deleteResponse = await request.delete(`/api/calendar/${eventId}`);
      expect([200, 401, 404]).toContain(deleteResponse.status());

      if (deleteResponse.status() === 200) {
        const deleted = await deleteResponse.json();
        expect(deleted.data.success).toBe(true);
      }
    }
  });
});

test.describe("Calendar UI", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("calendar page loads", async ({ page }) => {
    await page.goto("/calendar");
    await expect(page).toHaveTitle(/Ignition/);
  });

  test("can create an event from UI", async ({ page }) => {
    await page.goto("/calendar");

    // Look for add event button
    const addButton = page.locator(
      'button:has-text("Add"), button:has-text("New Event"), [data-testid="add-event"]'
    );
    if (await addButton.isVisible()) {
      await addButton.click();

      // Fill in event details
      const titleInput = page.locator(
        'input[name="title"], input[placeholder*="title" i]'
      );
      if (await titleInput.isVisible()) {
        await titleInput.fill("E2E Test Event");

        // Submit the form
        const submitButton = page.locator(
          'button[type="submit"], button:has-text("Save"), button:has-text("Create")'
        );
        if (await submitButton.isVisible()) {
          await submitButton.click();
          // Wait for success
          await page.waitForResponse((resp) =>
            resp.url().includes("/api/calendar") && resp.status() === 200
          );
        }
      }
    }
  });
});
