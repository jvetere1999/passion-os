/**
 * Soft Landing Utility Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isSoftLandingActive,
  getSoftLandingSource,
  activateSoftLanding,
  clearSoftLanding,
  isSoftLandingCleared,
  getSoftLandingState,
  buildSoftLandingUrl,
  isSoftLandingUrl,
  parseSoftLandingParams,
} from "../softLanding";

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

// Replace global sessionStorage
Object.defineProperty(globalThis, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

describe("Soft Landing Utility", () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    vi.clearAllMocks();
  });

  describe("isSoftLandingActive", () => {
    it("returns false when not set", () => {
      expect(isSoftLandingActive()).toBe(false);
    });

    it("returns true when set to 1", () => {
      mockSessionStorage.setItem("passion_soft_landing_v1", "1");
      expect(isSoftLandingActive()).toBe(true);
    });

    it("returns false when cleared (set to 0)", () => {
      mockSessionStorage.setItem("passion_soft_landing_v1", "0");
      expect(isSoftLandingActive()).toBe(false);
    });
  });

  describe("getSoftLandingSource", () => {
    it("returns null when not set", () => {
      expect(getSoftLandingSource()).toBe(null);
    });

    it("returns focus when set to focus", () => {
      mockSessionStorage.setItem("passion_soft_landing_source", "focus");
      expect(getSoftLandingSource()).toBe("focus");
    });

    it("returns quest when set to quest", () => {
      mockSessionStorage.setItem("passion_soft_landing_source", "quest");
      expect(getSoftLandingSource()).toBe("quest");
    });

    it("returns null for invalid source", () => {
      mockSessionStorage.setItem("passion_soft_landing_source", "invalid");
      expect(getSoftLandingSource()).toBe(null);
    });
  });

  describe("activateSoftLanding", () => {
    it("sets state to 1 and source", () => {
      activateSoftLanding("focus");
      expect(mockSessionStorage.getItem("passion_soft_landing_v1")).toBe("1");
      expect(mockSessionStorage.getItem("passion_soft_landing_source")).toBe("focus");
    });

    it("does not overwrite if already set", () => {
      mockSessionStorage.setItem("passion_soft_landing_v1", "0");
      mockSessionStorage.setItem("passion_soft_landing_source", "quest");
      activateSoftLanding("focus");
      // Should not change - only first activation counts
      expect(mockSessionStorage.getItem("passion_soft_landing_v1")).toBe("0");
      expect(mockSessionStorage.getItem("passion_soft_landing_source")).toBe("quest");
    });
  });

  describe("clearSoftLanding", () => {
    it("sets state to 0", () => {
      mockSessionStorage.setItem("passion_soft_landing_v1", "1");
      clearSoftLanding();
      expect(mockSessionStorage.getItem("passion_soft_landing_v1")).toBe("0");
    });
  });

  describe("isSoftLandingCleared", () => {
    it("returns false when not set", () => {
      expect(isSoftLandingCleared()).toBe(false);
    });

    it("returns false when active", () => {
      mockSessionStorage.setItem("passion_soft_landing_v1", "1");
      expect(isSoftLandingCleared()).toBe(false);
    });

    it("returns true when cleared", () => {
      mockSessionStorage.setItem("passion_soft_landing_v1", "0");
      expect(isSoftLandingCleared()).toBe(true);
    });
  });

  describe("getSoftLandingState", () => {
    it("returns inactive when not set", () => {
      expect(getSoftLandingState()).toBe("inactive");
    });

    it("returns active when 1", () => {
      mockSessionStorage.setItem("passion_soft_landing_v1", "1");
      expect(getSoftLandingState()).toBe("active");
    });

    it("returns cleared when 0", () => {
      mockSessionStorage.setItem("passion_soft_landing_v1", "0");
      expect(getSoftLandingState()).toBe("cleared");
    });
  });

  describe("buildSoftLandingUrl", () => {
    it("builds URL with mode, from, and status", () => {
      const url = buildSoftLandingUrl("focus", "complete");
      expect(url).toBe("/today?mode=soft&from=focus&status=complete");
    });

    it("builds URL for abandon", () => {
      const url = buildSoftLandingUrl("quest", "abandon");
      expect(url).toBe("/today?mode=soft&from=quest&status=abandon");
    });
  });

  describe("isSoftLandingUrl", () => {
    it("returns true for soft landing URL", () => {
      expect(isSoftLandingUrl("/today?mode=soft&from=focus")).toBe(true);
    });

    it("returns false for normal URL", () => {
      expect(isSoftLandingUrl("/today")).toBe(false);
    });

    it("returns false for other mode values", () => {
      expect(isSoftLandingUrl("/today?mode=normal")).toBe(false);
    });
  });

  describe("parseSoftLandingParams", () => {
    it("parses soft landing params correctly", () => {
      const params = new URLSearchParams("mode=soft&from=focus&status=complete");
      const result = parseSoftLandingParams(params);

      expect(result.isSoftMode).toBe(true);
      expect(result.source).toBe("focus");
      expect(result.status).toBe("complete");
    });

    it("returns false for non-soft mode", () => {
      const params = new URLSearchParams("from=focus");
      const result = parseSoftLandingParams(params);

      expect(result.isSoftMode).toBe(false);
    });

    it("returns null for invalid source", () => {
      const params = new URLSearchParams("mode=soft&from=invalid");
      const result = parseSoftLandingParams(params);

      expect(result.isSoftMode).toBe(true);
      expect(result.source).toBe(null);
    });

    it("handles abandon status", () => {
      const params = new URLSearchParams("mode=soft&from=focus&status=abandon");
      const result = parseSoftLandingParams(params);

      expect(result.status).toBe("abandon");
    });
  });
});

describe("Soft Landing Flow", () => {
  beforeEach(() => {
    mockSessionStorage.clear();
  });

  it("complete flow: inactive -> active -> cleared", () => {
    // Initial state
    expect(getSoftLandingState()).toBe("inactive");
    expect(isSoftLandingActive()).toBe(false);

    // First action completion activates
    activateSoftLanding("focus");
    expect(getSoftLandingState()).toBe("active");
    expect(isSoftLandingActive()).toBe(true);
    expect(getSoftLandingSource()).toBe("focus");

    // User expands section, clears soft landing
    clearSoftLanding();
    expect(getSoftLandingState()).toBe("cleared");
    expect(isSoftLandingActive()).toBe(false);
    expect(isSoftLandingCleared()).toBe(true);
  });

  it("second action does not re-activate after clear", () => {
    // Activate
    activateSoftLanding("focus");
    expect(getSoftLandingState()).toBe("active");

    // Clear
    clearSoftLanding();
    expect(getSoftLandingState()).toBe("cleared");

    // Second action attempt
    activateSoftLanding("quest");
    // Should still be cleared (not re-activated)
    expect(getSoftLandingState()).toBe("cleared");
  });
});

