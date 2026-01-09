/**
 * Unit tests for performance instrumentation
 */

import { describe, it, expect } from "vitest";
import {
  getRequestContext,
  recordTiming,
  memoize,
} from "../request-context";

describe("request-context", () => {
  // Helper to create a mock Request
  function createMockRequest(options: { perfDebug?: boolean } = {}): Request {
    const headers = new Headers();
    if (options.perfDebug) {
      headers.set("x-perf-debug", "1");
    }
    return new Request("https://test.com/api/test", { headers });
  }

  describe("getRequestContext", () => {
    it("should create a new context for a request", () => {
      const request = createMockRequest();
      const ctx = getRequestContext(request);

      expect(ctx).toBeDefined();
      expect(ctx.timings).toBeDefined();
      expect(ctx.timings.requestId).toBeDefined();
      expect(ctx.timings.route).toBe("/api/test");
      expect(ctx.memoized).toBeInstanceOf(Map);
      expect(ctx.perfDebug).toBe(false);
    });

    it("should detect x-perf-debug header", () => {
      const request = createMockRequest({ perfDebug: true });
      const ctx = getRequestContext(request);

      expect(ctx.perfDebug).toBe(true);
    });

    it("should return same context for same request", () => {
      const request = createMockRequest();
      const ctx1 = getRequestContext(request);
      const ctx2 = getRequestContext(request);

      expect(ctx1).toBe(ctx2);
    });

    it("should return different contexts for different requests", () => {
      const request1 = createMockRequest();
      const request2 = createMockRequest();
      const ctx1 = getRequestContext(request1);
      const ctx2 = getRequestContext(request2);

      expect(ctx1).not.toBe(ctx2);
    });
  });

  describe("recordTiming", () => {
    it("should record a timing metric", () => {
      const request = createMockRequest();
      recordTiming(request, "auth_parse_ms", 5.5);

      const ctx = getRequestContext(request);
      expect(ctx.timings.auth_parse_ms).toBe(5.5);
    });
  });

  describe("memoize", () => {
    it("should cache and return the same value", async () => {
      const request = createMockRequest();
      let callCount = 0;

      const compute = async () => {
        callCount++;
        return { value: "test" };
      };

      const result1 = await memoize(request, "test-key", compute);
      const result2 = await memoize(request, "test-key", compute);

      expect(callCount).toBe(1); // Only computed once
      expect(result1).toBe(result2); // Same reference
      expect(result1.value).toBe("test");
    });

    it("should use different keys independently", async () => {
      const request = createMockRequest();
      let callCount = 0;

      const compute1 = async () => {
        callCount++;
        return "value1";
      };
      const compute2 = async () => {
        callCount++;
        return "value2";
      };

      const result1 = await memoize(request, "key1", compute1);
      const result2 = await memoize(request, "key2", compute2);

      expect(callCount).toBe(2);
      expect(result1).toBe("value1");
      expect(result2).toBe("value2");
    });
  });
});

