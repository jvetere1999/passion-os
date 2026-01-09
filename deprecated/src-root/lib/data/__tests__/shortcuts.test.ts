/**
 * Shortcuts Data Layer Tests
 */

import { describe, it, expect } from "vitest";
import {
  getDAWs,
  getDAWById,
  searchShortcuts,
} from "../daws";
import {
  products,
  getProductById,
  allShortcuts,
  getShortcutsByProduct,
  getShortcutsWithProduct,
  searchShortcuts as searchAllShortcuts,
  getGroupsForProduct,
  getProductStats,
} from "../shortcuts/index";

describe("DAWs Module", () => {
  describe("getDAWs", () => {
    it("should return array of DAWs", () => {
      const daws = getDAWs();

      expect(Array.isArray(daws)).toBe(true);
      expect(daws.length).toBeGreaterThan(0);
    });

    it("should include common DAWs", () => {
      const daws = getDAWs();
      const dawIds = daws.map((d) => d.id);

      expect(dawIds).toContain("ableton");
      expect(dawIds).toContain("logic");
      expect(dawIds).toContain("flstudio");
    });

    it("should have required properties for each DAW", () => {
      const daws = getDAWs();

      for (const daw of daws) {
        expect(daw).toHaveProperty("id");
        expect(daw).toHaveProperty("name");
        expect(daw).toHaveProperty("color");
        expect(typeof daw.id).toBe("string");
        expect(typeof daw.name).toBe("string");
        expect(daw.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe("getDAWById", () => {
    it("should return DAW data for valid ID", () => {
      const daw = getDAWById("ableton");

      expect(daw).not.toBeNull();
      expect(daw?.id).toBe("ableton");
      expect(daw?.name).toContain("Ableton");
    });

    it("should return null for invalid ID", () => {
      const daw = getDAWById("invalid-daw");

      expect(daw).toBeNull();
    });

    it("should include shortcuts array", () => {
      const daw = getDAWById("ableton");

      expect(daw?.shortcuts).toBeDefined();
      expect(Array.isArray(daw?.shortcuts)).toBe(true);
      expect(daw?.shortcuts.length).toBeGreaterThan(0);
    });

    it("should include categories array", () => {
      const daw = getDAWById("ableton");

      expect(daw?.categories).toBeDefined();
      expect(Array.isArray(daw?.categories)).toBe(true);
    });
  });

  describe("searchShortcuts", () => {
    it("should find shortcuts by action name", () => {
      const results = searchShortcuts("play");

      expect(results.length).toBeGreaterThan(0);
    });

    it("should include DAW info in results", () => {
      const results = searchShortcuts("undo");

      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        expect(result).toHaveProperty("dawId");
        expect(result).toHaveProperty("dawName");
      }
    });

    it("should return empty array for no matches", () => {
      const results = searchShortcuts("xyznonexistent");

      expect(results).toEqual([]);
    });
  });
});

describe("Shortcuts Module (Real Data)", () => {
  describe("products", () => {
    it("should have products defined", () => {
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
    });

    it("should have required properties for each product", () => {
      for (const product of products) {
        expect(product).toHaveProperty("productId");
        expect(product).toHaveProperty("name");
        expect(product).toHaveProperty("vendor");
      }
    });
  });

  describe("getProductById", () => {
    it("should return product for valid ID", () => {
      const product = getProductById("ableton12suite");

      expect(product).toBeDefined();
      expect(product?.name).toContain("Ableton");
    });

    it("should return undefined for invalid ID", () => {
      const product = getProductById("invalid");

      expect(product).toBeUndefined();
    });
  });

  describe("allShortcuts", () => {
    it("should have shortcuts from multiple products", () => {
      expect(allShortcuts.length).toBeGreaterThan(100);

      const productIds = new Set(allShortcuts.map((s) => s.productId));
      expect(productIds.size).toBeGreaterThan(1);
    });

    it("should have valid shortcut structure", () => {
      for (const shortcut of allShortcuts.slice(0, 10)) {
        expect(shortcut).toHaveProperty("id");
        expect(shortcut).toHaveProperty("productId");
        expect(shortcut).toHaveProperty("command");
        expect(shortcut).toHaveProperty("keys");
      }
    });
  });

  describe("getShortcutsByProduct", () => {
    it("should return shortcuts for ableton", () => {
      const shortcuts = getShortcutsByProduct("ableton12suite");

      expect(shortcuts.length).toBeGreaterThan(50);
      expect(shortcuts.every((s) => s.productId === "ableton12suite")).toBe(true);
    });

    it("should return shortcuts for flstudio", () => {
      const shortcuts = getShortcutsByProduct("flstudio");

      expect(shortcuts.length).toBeGreaterThan(50);
      expect(shortcuts.every((s) => s.productId === "flstudio")).toBe(true);
    });
  });

  describe("getShortcutsWithProduct", () => {
    it("should include product info", () => {
      const shortcuts = getShortcutsWithProduct("ableton12suite");

      expect(shortcuts.length).toBeGreaterThan(0);
      for (const shortcut of shortcuts.slice(0, 5)) {
        expect(shortcut).toHaveProperty("productName");
        expect(shortcut).toHaveProperty("group");
      }
    });
  });

  describe("searchAllShortcuts", () => {
    it("should find shortcuts by command", () => {
      const results = searchAllShortcuts("undo");

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.command.toLowerCase().includes("undo"))).toBe(true);
    });

    it("should be case-insensitive", () => {
      const lowerResults = searchAllShortcuts("save");
      const upperResults = searchAllShortcuts("SAVE");

      expect(lowerResults.length).toBe(upperResults.length);
    });
  });

  describe("getGroupsForProduct", () => {
    it("should return groups for ableton", () => {
      const groups = getGroupsForProduct("ableton12suite");

      expect(groups.length).toBeGreaterThan(0);
      expect(groups.some((g) => g.includes("View") || g.includes("Navigation"))).toBe(true);
    });
  });

  describe("getProductStats", () => {
    it("should return stats for ableton", () => {
      const stats = getProductStats("ableton12suite");

      expect(stats.totalShortcuts).toBeGreaterThan(50);
      expect(stats.groups).toBeGreaterThan(0);
    });
  });
});

