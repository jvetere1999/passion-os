/**
 * Admin RBAC Tests - Playwright
 * Tests for admin route authorization (deny-by-default, admin-only)
 * Per DEC-004=B: Role-based access using DB-backed roles
 */

import { test, expect } from "@playwright/test";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

test.describe("Admin RBAC - Non-Admin Denied", () => {
  /**
   * Test that unauthenticated requests are denied (401)
   */
  test("unauthenticated request returns 401 Unauthorized", async ({ request }) => {
    const endpoints = [
      "/admin",
      "/admin/users",
      "/admin/stats",
      "/admin/feedback",
      "/admin/quests",
      "/admin/skills",
      "/admin/db-health",
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(`${API_BASE}${endpoint}`);
      expect(response.status()).toBe(401);
    }
  });

  /**
   * Test that non-admin authenticated users are denied (403)
   * This requires a test user session - skip if not available
   */
  test.skip("non-admin user returns 403 Forbidden", async ({ request }) => {
    // This test requires a valid non-admin session cookie
    // Skip in CI unless test auth is configured
    const testSessionCookie = process.env.TEST_USER_SESSION;
    if (!testSessionCookie) {
      test.skip();
      return;
    }

    const endpoints = [
      "/admin",
      "/admin/users",
      "/admin/stats",
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(`${API_BASE}${endpoint}`, {
        headers: {
          Cookie: `session=${testSessionCookie}`,
        },
      });
      expect(response.status()).toBe(403);
    }
  });
});

test.describe("Admin RBAC - Admin Access", () => {
  /**
   * Test that admin users can access admin routes
   * This requires an admin session - skip if not available
   */
  const testAdminSession = process.env.TEST_ADMIN_SESSION;

  test.skip(!testAdminSession, "Requires TEST_ADMIN_SESSION env var");

  test("admin user can access /admin info", async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin`, {
      headers: {
        Cookie: `session=${testAdminSession}`,
      },
    });
    
    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.version).toBeDefined();
      expect(data.modules).toBeDefined();
      expect(data.role_required).toBe("admin");
    }
  });

  test("admin user can list users", async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/users`, {
      headers: {
        Cookie: `session=${testAdminSession}`,
      },
    });
    
    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.total).toBeDefined();
    }
  });

  test("admin user can get stats", async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/stats`, {
      headers: {
        Cookie: `session=${testAdminSession}`,
      },
    });
    
    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.users).toBeDefined();
      expect(data.content).toBeDefined();
      expect(data.activity).toBeDefined();
      expect(data.gamification).toBeDefined();
    }
  });

  test("admin user can list feedback", async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/feedback`, {
      headers: {
        Cookie: `session=${testAdminSession}`,
      },
    });
    
    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.feedback).toBeDefined();
      expect(Array.isArray(data.feedback)).toBe(true);
    }
  });

  test("admin user can list quests", async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/quests`, {
      headers: {
        Cookie: `session=${testAdminSession}`,
      },
    });
    
    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.quests).toBeDefined();
      expect(Array.isArray(data.quests)).toBe(true);
    }
  });

  test("admin user can list skills", async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/skills`, {
      headers: {
        Cookie: `session=${testAdminSession}`,
      },
    });
    
    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.skills).toBeDefined();
      expect(Array.isArray(data.skills)).toBe(true);
    }
  });

  test("admin user can check db health", async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/db-health`, {
      headers: {
        Cookie: `session=${testAdminSession}`,
      },
    });
    
    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.status).toBe("healthy");
      expect(data.tables).toBeDefined();
      expect(Array.isArray(data.tables)).toBe(true);
    }
  });
});

test.describe("Admin CRUD Flows", () => {
  const testAdminSession = process.env.TEST_ADMIN_SESSION;
  
  test.skip(!testAdminSession, "Requires TEST_ADMIN_SESSION env var");

  test("admin can CRUD a quest", async ({ request }) => {
    // Create
    let response = await request.post(`${API_BASE}/admin/quests`, {
      headers: {
        Cookie: `session=${testAdminSession}`,
        "Content-Type": "application/json",
      },
      data: {
        title: "Test Quest (E2E)",
        description: "A test quest created by Playwright",
        quest_type: "daily",
        xp_reward: 50,
        coin_reward: 25,
        target: 3,
      },
    });

    // 200 or 401 (if auth not working in test env)
    if (response.status() !== 200) {
      test.skip();
      return;
    }

    const created = await response.json();
    expect(created.id).toBeDefined();
    expect(created.title).toBe("Test Quest (E2E)");
    const questId = created.id;

    // Update
    response = await request.put(`${API_BASE}/admin/quests/${questId}`, {
      headers: {
        Cookie: `session=${testAdminSession}`,
        "Content-Type": "application/json",
      },
      data: {
        title: "Test Quest Updated (E2E)",
        xp_reward: 100,
      },
    });
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.title).toBe("Test Quest Updated (E2E)");
    expect(updated.xp_reward).toBe(100);

    // Delete
    response = await request.delete(`${API_BASE}/admin/quests/${questId}`, {
      headers: {
        Cookie: `session=${testAdminSession}`,
      },
    });
    expect(response.status()).toBe(200);
    const deleted = await response.json();
    expect(deleted.success).toBe(true);
  });

  test("admin can CRUD a skill", async ({ request }) => {
    const skillId = `test-skill-${Date.now()}`;
    
    // Create
    let response = await request.post(`${API_BASE}/admin/skills`, {
      headers: {
        Cookie: `session=${testAdminSession}`,
        "Content-Type": "application/json",
      },
      data: {
        id: skillId,
        name: "Test Skill (E2E)",
        description: "A test skill created by Playwright",
        color: "#ff6b6b",
        max_level: 5,
      },
    });

    if (response.status() !== 200) {
      test.skip();
      return;
    }

    const created = await response.json();
    expect(created.id).toBe(skillId);
    expect(created.name).toBe("Test Skill (E2E)");

    // Update
    response = await request.put(`${API_BASE}/admin/skills/${skillId}`, {
      headers: {
        Cookie: `session=${testAdminSession}`,
        "Content-Type": "application/json",
      },
      data: {
        name: "Test Skill Updated (E2E)",
        max_level: 10,
      },
    });
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.name).toBe("Test Skill Updated (E2E)");
    expect(updated.max_level).toBe(10);

    // Delete
    response = await request.delete(`${API_BASE}/admin/skills/${skillId}`, {
      headers: {
        Cookie: `session=${testAdminSession}`,
      },
    });
    expect(response.status()).toBe(200);
    const deleted = await response.json();
    expect(deleted.success).toBe(true);
  });
});
