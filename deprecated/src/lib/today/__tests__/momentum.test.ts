/**
 * Momentum Utility Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  shouldShowMomentum,
  isMomentumShown,
  isMomentumDismissed,
  markMomentumShown,
  dismissMomentum,
  getMomentumState,
  MOMENTUM_MESSAGE,
} from "../momentum";

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

describe("Momentum Utility", () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    vi.clearAllMocks();
  });

  describe("shouldShowMomentum", () => {
    it("returns true when momentum key is not set", () => {
      expect(shouldShowMomentum()).toBe(true);
    });

    it("returns false when momentum is shown", () => {
      mockSessionStorage.setItem("passion_momentum_v1", "shown");
      expect(shouldShowMomentum()).toBe(false);
    });

    it("returns false when momentum is dismissed", () => {
      mockSessionStorage.setItem("passion_momentum_v1", "dismissed");
      expect(shouldShowMomentum()).toBe(false);
    });
  });

  describe("isMomentumShown", () => {
    it("returns false when not set", () => {
      expect(isMomentumShown()).toBe(false);
    });

    it("returns true when shown", () => {
      mockSessionStorage.setItem("passion_momentum_v1", "shown");
      expect(isMomentumShown()).toBe(true);
    });

    it("returns false when dismissed", () => {
      mockSessionStorage.setItem("passion_momentum_v1", "dismissed");
      expect(isMomentumShown()).toBe(false);
    });
  });

  describe("isMomentumDismissed", () => {
    it("returns false when not set", () => {
      expect(isMomentumDismissed()).toBe(false);
    });

    it("returns false when shown", () => {
      mockSessionStorage.setItem("passion_momentum_v1", "shown");
      expect(isMomentumDismissed()).toBe(false);
    });

    it("returns true when dismissed", () => {
      mockSessionStorage.setItem("passion_momentum_v1", "dismissed");
      expect(isMomentumDismissed()).toBe(true);
    });
  });

  describe("markMomentumShown", () => {
    it("sets state to shown when not set", () => {
      markMomentumShown();
      expect(mockSessionStorage.getItem("passion_momentum_v1")).toBe("shown");
    });

    it("does not overwrite if already set", () => {
      mockSessionStorage.setItem("passion_momentum_v1", "dismissed");
      markMomentumShown();
      // Should not change from dismissed to shown
      expect(mockSessionStorage.getItem("passion_momentum_v1")).toBe("dismissed");
    });
  });

  describe("dismissMomentum", () => {
    it("sets state to dismissed", () => {
      dismissMomentum();
      expect(mockSessionStorage.getItem("passion_momentum_v1")).toBe("dismissed");
    });

    it("overwrites shown state", () => {
      mockSessionStorage.setItem("passion_momentum_v1", "shown");
      dismissMomentum();
      expect(mockSessionStorage.getItem("passion_momentum_v1")).toBe("dismissed");
    });
  });

  describe("getMomentumState", () => {
    it("returns pending when not set", () => {
      expect(getMomentumState()).toBe("pending");
    });

    it("returns shown when shown", () => {
      mockSessionStorage.setItem("passion_momentum_v1", "shown");
      expect(getMomentumState()).toBe("shown");
    });

    it("returns dismissed when dismissed", () => {
      mockSessionStorage.setItem("passion_momentum_v1", "dismissed");
      expect(getMomentumState()).toBe("dismissed");
    });
  });

  describe("MOMENTUM_MESSAGE", () => {
    it("is a short, neutral message", () => {
      expect(MOMENTUM_MESSAGE).toBe("Good start.");
      expect(MOMENTUM_MESSAGE.split(" ").length).toBeLessThanOrEqual(5);
    });
  });
});

describe("Momentum Flow", () => {
  beforeEach(() => {
    mockSessionStorage.clear();
  });

  it("complete flow: pending -> shown -> dismissed", () => {
    // Initial state
    expect(getMomentumState()).toBe("pending");
    expect(shouldShowMomentum()).toBe(true);

    // First completion
    markMomentumShown();
    expect(getMomentumState()).toBe("shown");
    expect(shouldShowMomentum()).toBe(false);
    expect(isMomentumShown()).toBe(true);

    // User dismisses
    dismissMomentum();
    expect(getMomentumState()).toBe("dismissed");
    expect(shouldShowMomentum()).toBe(false);
    expect(isMomentumShown()).toBe(false);
    expect(isMomentumDismissed()).toBe(true);
  });

  it("second completion does not re-trigger", () => {
    // First completion
    markMomentumShown();
    expect(getMomentumState()).toBe("shown");

    // Dismiss
    dismissMomentum();
    expect(getMomentumState()).toBe("dismissed");

    // Second completion attempt
    markMomentumShown();
    // Should still be dismissed
    expect(getMomentumState()).toBe("dismissed");
  });
});

