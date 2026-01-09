import { describe, it, expect } from "vitest";
import {
  generateId,
  now,
  parseJSON,
  toJSON,
  boolToInt,
  intToBool,
  getPaginationSQL,
  validateRequired,
  validateMaxLength,
  validateEnum,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../utils";

describe("Database Utilities", () => {
  describe("generateId", () => {
    it("should generate a valid UUID", () => {
      const id = generateId();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("should generate unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe("now", () => {
    it("should return a valid ISO timestamp", () => {
      const timestamp = now();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should be parseable as a Date", () => {
      const timestamp = now();
      const date = new Date(timestamp);
      expect(date.getTime()).not.toBeNaN();
    });
  });

  describe("parseJSON", () => {
    it("should parse valid JSON", () => {
      const result = parseJSON<{ foo: string }>('{"foo": "bar"}');
      expect(result).toEqual({ foo: "bar" });
    });

    it("should return null for null input", () => {
      const result = parseJSON(null);
      expect(result).toBeNull();
    });

    it("should return null for invalid JSON", () => {
      const result = parseJSON("not json");
      expect(result).toBeNull();
    });

    it("should handle arrays", () => {
      const result = parseJSON<string[]>('["a", "b", "c"]');
      expect(result).toEqual(["a", "b", "c"]);
    });
  });

  describe("toJSON", () => {
    it("should stringify objects", () => {
      const result = toJSON({ foo: "bar" });
      expect(result).toBe('{"foo":"bar"}');
    });

    it("should return null for null input", () => {
      const result = toJSON(null);
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = toJSON(undefined);
      expect(result).toBeNull();
    });

    it("should stringify arrays", () => {
      const result = toJSON(["a", "b"]);
      expect(result).toBe('["a","b"]');
    });
  });

  describe("boolToInt / intToBool", () => {
    it("should convert true to 1", () => {
      expect(boolToInt(true)).toBe(1);
    });

    it("should convert false to 0", () => {
      expect(boolToInt(false)).toBe(0);
    });

    it("should convert 1 to true", () => {
      expect(intToBool(1)).toBe(true);
    });

    it("should convert 0 to false", () => {
      expect(intToBool(0)).toBe(false);
    });

    it("should convert other numbers to false", () => {
      expect(intToBool(2)).toBe(false);
      expect(intToBool(-1)).toBe(false);
    });
  });

  describe("getPaginationSQL", () => {
    it("should use defaults when no options provided", () => {
      const result = getPaginationSQL({});
      expect(result).toEqual({
        limit: DEFAULT_PAGE_SIZE,
        offset: 0,
      });
    });

    it("should calculate offset correctly", () => {
      const result = getPaginationSQL({ page: 3, pageSize: 10 });
      expect(result).toEqual({
        limit: 10,
        offset: 20,
      });
    });

    it("should enforce max page size", () => {
      const result = getPaginationSQL({ pageSize: 1000 });
      expect(result.limit).toBe(MAX_PAGE_SIZE);
    });

    it("should enforce minimum page of 1", () => {
      const result = getPaginationSQL({ page: 0 });
      expect(result.offset).toBe(0);
    });

    it("should handle negative page", () => {
      const result = getPaginationSQL({ page: -5 });
      expect(result.offset).toBe(0);
    });
  });

  describe("validateRequired", () => {
    it("should pass for non-empty string", () => {
      expect(() => validateRequired("hello", "field")).not.toThrow();
    });

    it("should throw for empty string", () => {
      expect(() => validateRequired("", "field")).toThrow("field is required");
    });

    it("should throw for whitespace-only string", () => {
      expect(() => validateRequired("   ", "field")).toThrow(
        "field is required"
      );
    });

    it("should throw for null", () => {
      expect(() => validateRequired(null, "field")).toThrow(
        "field is required"
      );
    });

    it("should throw for undefined", () => {
      expect(() => validateRequired(undefined, "field")).toThrow(
        "field is required"
      );
    });
  });

  describe("validateMaxLength", () => {
    it("should pass for string within limit", () => {
      expect(() => validateMaxLength("hello", 10, "field")).not.toThrow();
    });

    it("should pass for null", () => {
      expect(() => validateMaxLength(null, 10, "field")).not.toThrow();
    });

    it("should pass for undefined", () => {
      expect(() => validateMaxLength(undefined, 10, "field")).not.toThrow();
    });

    it("should throw for string exceeding limit", () => {
      expect(() => validateMaxLength("hello world", 5, "field")).toThrow(
        "field must be at most 5 characters"
      );
    });
  });

  describe("validateEnum", () => {
    const allowed = ["a", "b", "c"] as const;

    it("should pass for valid value", () => {
      expect(() => validateEnum("a", allowed, "field")).not.toThrow();
    });

    it("should throw for invalid value", () => {
      expect(() => validateEnum("d", allowed, "field")).toThrow(
        "field must be one of: a, b, c"
      );
    });

    it("should throw for null", () => {
      expect(() => validateEnum(null, allowed, "field")).toThrow();
    });
  });
});

