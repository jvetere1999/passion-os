/**
 * Books E2E Tests
 * Tests the reading flow: add book -> log reading session
 *
 * PARITY-034: Books routes
 */

import { test, expect } from "@playwright/test";

test.describe("Books API", () => {
  test("GET /api/books returns books list", async ({ request }) => {
    const response = await request.get("/api/books");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      if (data.data.books) {
        expect(Array.isArray(data.data.books)).toBe(true);
      }
    }
  });

  test("GET /api/books/stats returns reading stats", async ({ request }) => {
    const response = await request.get("/api/books/stats");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      // Check stat fields exist
      if (data.data.total_books !== undefined) {
        expect(typeof data.data.total_books).toBe("number");
      }
    }
  });

  test("GET /api/books with status filter", async ({ request }) => {
    const response = await request.get("/api/books?status=reading");
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
    }
  });
});

test.describe("Book + Reading Session Flow", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("complete flow: add book -> log reading session", async ({ request }) => {
    // 1. Create a book
    const createBookResponse = await request.post("/api/books", {
      data: {
        title: "E2E Test Book",
        author: "Test Author",
        total_pages: 300,
        status: "reading",
        tags: ["test", "e2e"],
      },
    });

    if (createBookResponse.status() === 401) {
      test.skip();
      return;
    }

    expect([200, 201]).toContain(createBookResponse.status());
    const bookData = await createBookResponse.json();
    expect(bookData.data).toBeDefined();
    expect(bookData.data.id).toBeDefined();
    expect(bookData.data.title).toBe("E2E Test Book");
    const bookId = bookData.data.id;

    // 2. Log a reading session
    const logReadingResponse = await request.post(`/api/books/${bookId}/sessions`, {
      data: {
        pages_read: 25,
        duration_minutes: 30,
        notes: "Good reading session!",
      },
    });

    expect([200, 201]).toContain(logReadingResponse.status());
    const readingData = await logReadingResponse.json();
    expect(readingData.data).toBeDefined();
    expect(readingData.data.session_id).toBeDefined();
    expect(readingData.data.pages_read).toBe(25);
    expect(readingData.data.new_page).toBe(25);

    // 3. Verify book was updated
    const getBookResponse = await request.get(`/api/books/${bookId}`);
    expect(getBookResponse.status()).toBe(200);
    const updatedBook = await getBookResponse.json();
    expect(updatedBook.data.current_page).toBe(25);

    // 4. List reading sessions
    const sessionsResponse = await request.get(`/api/books/${bookId}/sessions`);
    expect(sessionsResponse.status()).toBe(200);
    const sessionsData = await sessionsResponse.json();
    expect(sessionsData.data.sessions).toBeDefined();
    expect(Array.isArray(sessionsData.data.sessions)).toBe(true);
    expect(sessionsData.data.sessions.length).toBeGreaterThanOrEqual(1);

    // 5. Update book status
    const updateResponse = await request.put(`/api/books/${bookId}`, {
      data: {
        current_page: 300,
        status: "completed",
        rating: 5,
      },
    });
    expect(updateResponse.status()).toBe(200);

    // 6. Cleanup: delete the book
    const deleteResponse = await request.delete(`/api/books/${bookId}`);
    expect([200, 204]).toContain(deleteResponse.status());
  });

  test("book completion awards XP/coins", async ({ request }) => {
    // Create book
    const createResponse = await request.post("/api/books", {
      data: {
        title: "Quick Test Book",
        total_pages: 100,
        status: "reading",
      },
    });

    if (createResponse.status() === 401) {
      test.skip();
      return;
    }

    const bookData = await createResponse.json();
    const bookId = bookData.data.id;

    // Log reading to complete book
    const logResponse = await request.post(`/api/books/${bookId}/sessions`, {
      data: {
        pages_read: 100,
        duration_minutes: 120,
      },
    });

    expect(logResponse.status()).toBe(200);
    const result = await logResponse.json();

    // Should get XP and coins for completing book
    if (result.data.book_completed) {
      expect(result.data.xp_awarded).toBeGreaterThan(0);
      expect(result.data.coins_awarded).toBeGreaterThan(0);
    }

    // Cleanup
    await request.delete(`/api/books/${bookId}`);
  });
});

test.describe("Books Page UI", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should intercept books API calls", async ({ page }) => {
    let apiCalled = false;

    await page.route("**/api/books**", (route) => {
      apiCalled = true;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            books: [],
            total: 0,
          },
        }),
      });
    });

    // Navigate to books page (adjust path as needed)
    await page.goto("/books");
    await page.waitForLoadState("networkidle");

    // Verify API was called
    expect(apiCalled).toBe(true);
  });
});
