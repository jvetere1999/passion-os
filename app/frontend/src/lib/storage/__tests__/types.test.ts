import { describe, it, expect } from "vitest";
import {
  getCategoryFromMimeType,
  getExtensionFromMimeType,
  isAllowedMimeType,
  getSizeLimit,
  validateFileSize,
  SIZE_LIMITS,
} from "../types";

describe("Storage Types", () => {
  describe("getCategoryFromMimeType", () => {
    it("should return audio for audio MIME types", () => {
      expect(getCategoryFromMimeType("audio/mpeg")).toBe("audio");
      expect(getCategoryFromMimeType("audio/wav")).toBe("audio");
      expect(getCategoryFromMimeType("audio/ogg")).toBe("audio");
    });

    it("should return images for image MIME types", () => {
      expect(getCategoryFromMimeType("image/jpeg")).toBe("images");
      expect(getCategoryFromMimeType("image/png")).toBe("images");
      expect(getCategoryFromMimeType("image/webp")).toBe("images");
    });

    it("should return exports for zip files", () => {
      expect(getCategoryFromMimeType("application/zip")).toBe("exports");
      expect(getCategoryFromMimeType("application/x-zip-compressed")).toBe(
        "exports"
      );
    });

    it("should return other for unknown types", () => {
      expect(getCategoryFromMimeType("text/plain")).toBe("other");
      expect(getCategoryFromMimeType("application/json")).toBe("other");
      expect(getCategoryFromMimeType("unknown/type")).toBe("other");
    });
  });

  describe("getExtensionFromMimeType", () => {
    it("should return correct extension for audio types", () => {
      expect(getExtensionFromMimeType("audio/mpeg")).toBe("mp3");
      expect(getExtensionFromMimeType("audio/mp3")).toBe("mp3");
      expect(getExtensionFromMimeType("audio/wav")).toBe("wav");
      expect(getExtensionFromMimeType("audio/flac")).toBe("flac");
    });

    it("should return correct extension for image types", () => {
      expect(getExtensionFromMimeType("image/jpeg")).toBe("jpg");
      expect(getExtensionFromMimeType("image/png")).toBe("png");
      expect(getExtensionFromMimeType("image/webp")).toBe("webp");
      expect(getExtensionFromMimeType("image/svg+xml")).toBe("svg");
    });

    it("should return correct extension for document types", () => {
      expect(getExtensionFromMimeType("application/pdf")).toBe("pdf");
      expect(getExtensionFromMimeType("application/json")).toBe("json");
      expect(getExtensionFromMimeType("text/plain")).toBe("txt");
    });

    it("should return bin for unknown types", () => {
      expect(getExtensionFromMimeType("unknown/type")).toBe("bin");
    });
  });

  describe("isAllowedMimeType", () => {
    it("should return true for allowed audio types", () => {
      expect(isAllowedMimeType("audio/mpeg")).toBe(true);
      expect(isAllowedMimeType("audio/wav")).toBe(true);
      expect(isAllowedMimeType("audio/ogg")).toBe(true);
    });

    it("should return true for allowed image types", () => {
      expect(isAllowedMimeType("image/jpeg")).toBe(true);
      expect(isAllowedMimeType("image/png")).toBe(true);
      expect(isAllowedMimeType("image/webp")).toBe(true);
    });

    it("should return true for allowed document types", () => {
      expect(isAllowedMimeType("application/pdf")).toBe(true);
      expect(isAllowedMimeType("application/zip")).toBe(true);
    });

    it("should return false for disallowed types", () => {
      expect(isAllowedMimeType("application/octet-stream")).toBe(false);
      expect(isAllowedMimeType("video/mp4")).toBe(false);
      expect(isAllowedMimeType("application/x-executable")).toBe(false);
    });
  });

  describe("getSizeLimit", () => {
    it("should return audio limit for audio types", () => {
      expect(getSizeLimit("audio/mpeg")).toBe(SIZE_LIMITS.MAX_AUDIO_SIZE);
      expect(getSizeLimit("audio/wav")).toBe(SIZE_LIMITS.MAX_AUDIO_SIZE);
    });

    it("should return image limit for image types", () => {
      expect(getSizeLimit("image/jpeg")).toBe(SIZE_LIMITS.MAX_IMAGE_SIZE);
      expect(getSizeLimit("image/png")).toBe(SIZE_LIMITS.MAX_IMAGE_SIZE);
    });

    it("should return general limit for other types", () => {
      expect(getSizeLimit("application/pdf")).toBe(SIZE_LIMITS.MAX_FILE_SIZE);
      expect(getSizeLimit("application/zip")).toBe(SIZE_LIMITS.MAX_FILE_SIZE);
    });
  });

  describe("validateFileSize", () => {
    it("should pass for files within limit", () => {
      const result = validateFileSize(1024, "audio/mpeg");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should fail for audio files exceeding limit", () => {
      const result = validateFileSize(
        SIZE_LIMITS.MAX_AUDIO_SIZE + 1,
        "audio/mpeg"
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds limit");
    });

    it("should fail for image files exceeding limit", () => {
      const result = validateFileSize(
        SIZE_LIMITS.MAX_IMAGE_SIZE + 1,
        "image/jpeg"
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds limit");
    });

    it("should pass for files at exact limit", () => {
      const result = validateFileSize(SIZE_LIMITS.MAX_AUDIO_SIZE, "audio/mpeg");
      expect(result.valid).toBe(true);
    });
  });
});

