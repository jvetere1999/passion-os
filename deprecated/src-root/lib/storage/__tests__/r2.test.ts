import { describe, it, expect } from "vitest";
import { generateBlobKey, parseBlobKey } from "../r2";

describe("R2 Storage", () => {
  describe("generateBlobKey", () => {
    it("should generate a key with correct format", () => {
      const key = generateBlobKey("user123", "audio", "mp3");
      expect(key).toMatch(/^user123\/audio\/[a-f0-9-]+\.mp3$/);
    });

    it("should generate unique keys", () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        keys.add(generateBlobKey("user123", "audio", "mp3"));
      }
      expect(keys.size).toBe(100);
    });

    it("should include category in path", () => {
      expect(generateBlobKey("user", "audio", "mp3")).toContain("/audio/");
      expect(generateBlobKey("user", "images", "png")).toContain("/images/");
      expect(generateBlobKey("user", "exports", "zip")).toContain("/exports/");
    });
  });

  describe("parseBlobKey", () => {
    it("should parse valid key", () => {
      const result = parseBlobKey("user123/audio/abc123.mp3");
      expect(result).toEqual({
        userId: "user123",
        category: "audio",
        filename: "abc123.mp3",
      });
    });

    it("should parse all categories", () => {
      expect(parseBlobKey("user/audio/file.mp3")?.category).toBe("audio");
      expect(parseBlobKey("user/images/file.png")?.category).toBe("images");
      expect(parseBlobKey("user/exports/file.zip")?.category).toBe("exports");
      expect(parseBlobKey("user/other/file.bin")?.category).toBe("other");
    });

    it("should return null for invalid format", () => {
      expect(parseBlobKey("invalid")).toBeNull();
      expect(parseBlobKey("user/file.mp3")).toBeNull();
      expect(parseBlobKey("a/b/c/d.mp3")).toBeNull();
    });

    it("should return null for invalid category", () => {
      expect(parseBlobKey("user/videos/file.mp4")).toBeNull();
      expect(parseBlobKey("user/documents/file.pdf")).toBeNull();
    });

    it("should handle UUIDs in filename", () => {
      const key =
        "user123/audio/550e8400-e29b-41d4-a716-446655440000.mp3";
      const result = parseBlobKey(key);
      expect(result?.filename).toBe(
        "550e8400-e29b-41d4-a716-446655440000.mp3"
      );
    });
  });
});

