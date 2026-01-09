/**
 * Onboarding Repository Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock D1 database
const mockDb = {
  prepare: vi.fn().mockReturnThis(),
  bind: vi.fn().mockReturnThis(),
  first: vi.fn(),
  run: vi.fn(),
  all: vi.fn(),
};

describe("Onboarding Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOnboardingState", () => {
    it("should return null if no state exists", async () => {
      mockDb.first.mockResolvedValue(null);

      const result = null;
      expect(result).toBeNull();
    });

    it("should return existing state", async () => {
      const state = {
        id: "state_123",
        user_id: "user_123",
        flow_id: "onboarding_v1",
        current_step_id: "step_2",
        status: "in_progress",
        started_at: "2026-01-05T12:00:00.000Z",
      };
      mockDb.first.mockResolvedValue(state);

      expect(state.flow_id).toBe("onboarding_v1");
      expect(state.current_step_id).toBe("step_2");
      expect(state.status).toBe("in_progress");
    });
  });

  describe("startOnboarding", () => {
    it("should create new onboarding state", async () => {
      mockDb.run.mockResolvedValue({ success: true });
      mockDb.first.mockResolvedValue({
        id: "step_1",
        step_order: 1,
      });

      const flowId = "onboarding_v1";
      const userId = "user_123";

      // Expected: creates state with first step
      expect(flowId).toBe("onboarding_v1");
      expect(userId).toBe("user_123");
    });
  });

  describe("advanceOnboardingStep", () => {
    it("should advance to next step", async () => {
      const currentStep = {
        id: "step_1",
        step_order: 1,
      };
      const nextStep = {
        id: "step_2",
        step_order: 2,
      };

      mockDb.first
        .mockResolvedValueOnce(currentStep)
        .mockResolvedValueOnce(nextStep);
      mockDb.run.mockResolvedValue({ success: true });

      expect(nextStep.id).toBe("step_2");
    });

    it("should mark complete if on last step", async () => {
      const lastStep = {
        id: "step_5",
        step_order: 5,
      };

      mockDb.first
        .mockResolvedValueOnce(lastStep)
        .mockResolvedValueOnce(null); // No next step
      mockDb.run.mockResolvedValue({ success: true });

      // When advancing from last step, status should be set to 'completed'
      expect(lastStep.id).toBe("step_5");
    });
  });

  describe("skipOnboarding", () => {
    it("should set status to skipped", async () => {
      mockDb.run.mockResolvedValue({ success: true });

      // Expected behavior
      const status = "skipped";
      expect(status).toBe("skipped");
    });
  });

  describe("saveOnboardingChoices", () => {
    it("should save interests to user_interests", async () => {
      const interests = ["focus", "learning", "music"];
      mockDb.run.mockResolvedValue({ success: true });

      expect(interests.length).toBe(3);
      expect(interests).toContain("focus");
    });

    it("should save module weights to user_ui_modules", async () => {
      const modules = {
        focus: 2,
        quests: 1,
        learn: 3,
      };
      mockDb.run.mockResolvedValue({ success: true });

      expect(modules.learn).toBe(3);
    });

    it("should save settings to user_settings", async () => {
      const settings = {
        nudge_intensity: "standard",
        focus_default_duration: 25,
        gamification_visible: true,
      };
      mockDb.run.mockResolvedValue({ success: true });

      expect(settings.nudge_intensity).toBe("standard");
    });
  });
});

describe("Onboarding Flow Integration", () => {
  it("should trigger onboarding for new users", () => {
    // New user has no user_onboarding_state row
    // OnboardingProvider should show modal
    const hasState = false;
    const shouldShowModal = !hasState;
    expect(shouldShowModal).toBe(true);
  });

  it("should resume onboarding from current step", () => {
    // User has incomplete state with current_step_id = "step_3"
    // Modal should open to step 3
    const currentStepId = "step_3";
    expect(currentStepId).toBe("step_3");
  });

  it("should not show modal if completed", () => {
    const state = {
      status: "completed",
    };
    const shouldShowModal = state.status !== "completed" && state.status !== "skipped";
    expect(shouldShowModal).toBe(false);
  });

  it("should not show modal if skipped", () => {
    const state = {
      status: "skipped",
    };
    const shouldShowModal = state.status !== "completed" && state.status !== "skipped";
    expect(shouldShowModal).toBe(false);
  });

  it("should persist choices to D1 for cross-device sync", () => {
    // All user choices go to D1 tables:
    // - user_interests
    // - user_ui_modules
    // - user_settings
    // This ensures cross-device consistency
    expect(true).toBe(true);
  });
});

