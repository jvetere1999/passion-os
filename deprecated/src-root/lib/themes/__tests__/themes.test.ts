/**
 * Theme System Tests
 */

import { describe, it, expect } from "vitest";
import {
  getThemes,
  getThemeById,
  getThemesByMode,
  resolveTheme,
} from "../index";

describe("Theme System", () => {
  describe("getThemes", () => {
    it("should return an array of themes", () => {
      const themes = getThemes();

      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);
    });

    it("should include both light and dark themes", () => {
      const themes = getThemes();
      const hasLight = themes.some((t) => t.mode === "light");
      const hasDark = themes.some((t) => t.mode === "dark");

      expect(hasLight).toBe(true);
      expect(hasDark).toBe(true);
    });

    it("should have valid theme structure", () => {
      const themes = getThemes();

      for (const theme of themes) {
        expect(theme).toHaveProperty("id");
        expect(theme).toHaveProperty("name");
        expect(theme).toHaveProperty("mode");
        expect(theme).toHaveProperty("vars");
        expect(theme).toHaveProperty("meta");
        expect(["light", "dark"]).toContain(theme.mode);
      }
    });
  });

  describe("getThemeById", () => {
    it("should return theme for valid ID", () => {
      const theme = getThemeById("ableton-live-dark");

      expect(theme).toBeDefined();
      expect(theme?.id).toBe("ableton-live-dark");
      expect(theme?.name).toBe("Live Dark");
    });

    it("should return undefined for invalid ID", () => {
      const theme = getThemeById("invalid-theme");

      expect(theme).toBeUndefined();
    });
  });

  describe("getThemesByMode", () => {
    it("should return only dark themes", () => {
      const themes = getThemesByMode("dark");

      expect(themes.length).toBeGreaterThan(0);
      expect(themes.every((t) => t.mode === "dark")).toBe(true);
    });

    it("should return only light themes", () => {
      const themes = getThemesByMode("light");

      expect(themes.length).toBeGreaterThan(0);
      expect(themes.every((t) => t.mode === "light")).toBe(true);
    });
  });

  describe("resolveTheme", () => {
    it("should return theme for valid ID", () => {
      const theme = resolveTheme("ableton-disco");

      expect(theme.id).toBe("ableton-disco");
      expect(theme.name).toBe("Disco");
    });

    it("should return default theme for invalid ID", () => {
      const theme = resolveTheme("invalid-id");

      expect(theme).toBeDefined();
      expect(theme.id).toBeDefined();
    });

    it("should resolve system to a valid theme", () => {
      // Mock matchMedia for test environment
      const originalMatchMedia = globalThis.matchMedia;
      globalThis.matchMedia = ((query: string) => ({
        matches: query.includes("dark"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      })) as typeof window.matchMedia;

      try {
        const theme = resolveTheme("system");

        expect(theme).toBeDefined();
        expect(["light", "dark"]).toContain(theme.mode);
      } finally {
        globalThis.matchMedia = originalMatchMedia;
      }
    });
  });

  describe("theme vars", () => {
    it("should have all required CSS variables", () => {
      const themes = getThemes();
      const requiredVars = [
        "--bg-primary",
        "--bg-secondary",
        "--text-primary",
        "--text-secondary",
        "--accent-primary",
        "--border-default",
        "--focus-ring",
      ];

      for (const theme of themes) {
        for (const varName of requiredVars) {
          expect(theme.vars[varName]).toBeDefined();
          expect(theme.vars[varName]).toBeTruthy();
        }
      }
    });

    it("should have valid hex color values", () => {
      const themes = getThemes();
      const hexColorRegex = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

      for (const theme of themes) {
        const bgPrimary = theme.vars["--bg-primary"];
        expect(hexColorRegex.test(bgPrimary)).toBe(true);
      }
    });
  });

  describe("theme metadata", () => {
    it("should have valid source type", () => {
      const themes = getThemes();

      for (const theme of themes) {
        expect(["ableton-ask", "custom", "system"]).toContain(
          theme.meta.sourceType
        );
      }
    });
  });

  describe("available themes", () => {
    it("should include Live Dark theme", () => {
      const theme = getThemeById("ableton-live-dark");
      expect(theme).toBeDefined();
    });

    it("should include Live Light theme", () => {
      const theme = getThemeById("ableton-live-light");
      expect(theme).toBeDefined();
    });

    it("should include Mid Dark theme", () => {
      const theme = getThemeById("ableton-mid-dark");
      expect(theme).toBeDefined();
    });

    it("should include Mid Light theme", () => {
      const theme = getThemeById("ableton-mid-light");
      expect(theme).toBeDefined();
    });

    it("should include Disco theme", () => {
      const theme = getThemeById("ableton-disco");
      expect(theme).toBeDefined();
    });

    it("should include Mint theme", () => {
      const theme = getThemeById("ableton-mint");
      expect(theme).toBeDefined();
    });
  });
});

