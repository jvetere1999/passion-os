/**
 * Templates Data Layer Tests
 */

import { describe, it, expect } from "vitest";
import {
  allTemplates,
  drumTemplates,
  melodyTemplates,
  chordTemplates,
  getTemplateById,
  getTemplateBySlug,
  getTemplatesByType,
  getTemplatesByGenre,
  getTemplatesByTag,
  getTemplatesByDifficulty,
  getRelatedTemplates,
  getAllGenres,
  getAllTags,
  searchTemplates,
  getTemplateStats,
  getEDMTemplates,
  getTemplatesGroupedByType,
} from "../templates/index";

describe("Templates Module", () => {
  describe("allTemplates", () => {
    it("should have templates defined", () => {
      expect(Array.isArray(allTemplates)).toBe(true);
      expect(allTemplates.length).toBeGreaterThan(0);
    });

    it("should include drums, melodies, and chords", () => {
      const types = new Set(allTemplates.map((t) => t.type));

      expect(types.has("drums")).toBe(true);
      expect(types.has("melody")).toBe(true);
      expect(types.has("chord")).toBe(true);
    });

    it("should have valid template structure", () => {
      for (const template of allTemplates.slice(0, 5)) {
        expect(template).toHaveProperty("id");
        expect(template).toHaveProperty("slug");
        expect(template).toHaveProperty("name");
        expect(template).toHaveProperty("type");
        expect(template).toHaveProperty("description");
        expect(template).toHaveProperty("bpm");
        expect(template).toHaveProperty("bars");
        expect(template).toHaveProperty("notes");
        expect(template).toHaveProperty("tags");
        expect(template).toHaveProperty("genre");
        expect(template).toHaveProperty("difficulty");
      }
    });
  });

  describe("drumTemplates", () => {
    it("should have drum templates", () => {
      expect(drumTemplates.length).toBeGreaterThan(5);
      expect(drumTemplates.every((t) => t.type === "drums")).toBe(true);
    });

    it("should include EDM patterns", () => {
      const edmDrums = drumTemplates.filter(
        (t) =>
          t.genre === "Electronic" ||
          t.tags.some((tag) =>
            ["edm", "house", "techno", "dubstep", "future-bass"].includes(tag)
          )
      );
      expect(edmDrums.length).toBeGreaterThan(3);
    });
  });

  describe("melodyTemplates", () => {
    it("should have melody templates", () => {
      expect(melodyTemplates.length).toBeGreaterThan(2);
      expect(melodyTemplates.every((t) => t.type === "melody")).toBe(true);
    });

    it("should include EDM melodies", () => {
      const edmMelodies = melodyTemplates.filter(
        (t) => t.genre === "Electronic"
      );
      expect(edmMelodies.length).toBeGreaterThan(0);
    });
  });

  describe("chordTemplates", () => {
    it("should have chord templates", () => {
      expect(chordTemplates.length).toBeGreaterThan(3);
      expect(chordTemplates.every((t) => t.type === "chord")).toBe(true);
    });

    it("should include EDM progressions", () => {
      const edmChords = chordTemplates.filter(
        (t) => t.genre === "Electronic"
      );
      expect(edmChords.length).toBeGreaterThan(0);
    });
  });

  describe("getTemplateById", () => {
    it("should return template for valid ID", () => {
      const template = getTemplateById("four-on-the-floor");

      expect(template).toBeDefined();
      expect(template?.id).toBe("four-on-the-floor");
      expect(template?.name).toBe("Four on the Floor");
    });

    it("should return undefined for invalid ID", () => {
      const template = getTemplateById("invalid-template");

      expect(template).toBeUndefined();
    });
  });

  describe("getTemplateBySlug", () => {
    it("should find template by slug", () => {
      const template = getTemplateBySlug("future-bass-drop");

      expect(template).toBeDefined();
      expect(template?.slug).toBe("future-bass-drop");
    });
  });

  describe("getTemplatesByType", () => {
    it("should return drums only", () => {
      const drums = getTemplatesByType("drums");

      expect(drums.length).toBeGreaterThan(0);
      expect(drums.every((t) => t.type === "drums")).toBe(true);
    });

    it("should return melodies only", () => {
      const melodies = getTemplatesByType("melody");

      expect(melodies.length).toBeGreaterThan(0);
      expect(melodies.every((t) => t.type === "melody")).toBe(true);
    });

    it("should return chords only", () => {
      const chords = getTemplatesByType("chord");

      expect(chords.length).toBeGreaterThan(0);
      expect(chords.every((t) => t.type === "chord")).toBe(true);
    });
  });

  describe("getTemplatesByGenre", () => {
    it("should find electronic templates", () => {
      const electronic = getTemplatesByGenre("Electronic");

      expect(electronic.length).toBeGreaterThan(5);
    });

    it("should be case-insensitive", () => {
      const lower = getTemplatesByGenre("electronic");
      const upper = getTemplatesByGenre("ELECTRONIC");

      expect(lower.length).toBe(upper.length);
    });
  });

  describe("getTemplatesByTag", () => {
    it("should find templates by edm tag", () => {
      const edm = getTemplatesByTag("edm");

      expect(edm.length).toBeGreaterThan(0);
    });

    it("should find templates by house tag", () => {
      const house = getTemplatesByTag("house");

      expect(house.length).toBeGreaterThan(0);
    });
  });

  describe("getTemplatesByDifficulty", () => {
    it("should filter by beginner", () => {
      const beginner = getTemplatesByDifficulty("beginner");

      expect(beginner.length).toBeGreaterThan(0);
      expect(beginner.every((t) => t.difficulty === "beginner")).toBe(true);
    });

    it("should filter by intermediate", () => {
      const intermediate = getTemplatesByDifficulty("intermediate");

      expect(intermediate.length).toBeGreaterThan(0);
      expect(intermediate.every((t) => t.difficulty === "intermediate")).toBe(
        true
      );
    });
  });

  describe("searchTemplates", () => {
    it("should find templates by name", () => {
      const results = searchTemplates("house");

      expect(results.length).toBeGreaterThan(0);
    });

    it("should find templates by genre", () => {
      const results = searchTemplates("electronic");

      expect(results.length).toBeGreaterThan(3);
    });

    it("should find templates by tag", () => {
      const results = searchTemplates("dubstep");

      expect(results.length).toBeGreaterThan(0);
    });

    it("should return empty array for no matches", () => {
      const results = searchTemplates("xyznonexistent");

      expect(results).toEqual([]);
    });
  });

  describe("getEDMTemplates", () => {
    it("should return EDM-focused templates", () => {
      const edm = getEDMTemplates();

      expect(edm.length).toBeGreaterThan(10);
    });

    it("should include multiple types", () => {
      const edm = getEDMTemplates();
      const types = new Set(edm.map((t) => t.type));

      expect(types.size).toBeGreaterThan(1);
    });
  });

  describe("getAllGenres", () => {
    it("should return unique genres", () => {
      const genres = getAllGenres();

      expect(genres.length).toBeGreaterThan(2);
      expect(genres).toContain("Electronic");
    });
  });

  describe("getAllTags", () => {
    it("should return unique tags", () => {
      const tags = getAllTags();

      expect(tags.length).toBeGreaterThan(20);
      expect(tags).toContain("edm");
      expect(tags).toContain("house");
    });
  });

  describe("getTemplateStats", () => {
    it("should return statistics", () => {
      const stats = getTemplateStats();

      expect(stats.total).toBeGreaterThan(15);
      expect(stats.drums).toBeGreaterThan(5);
      expect(stats.melodies).toBeGreaterThan(2);
      expect(stats.chords).toBeGreaterThan(3);
      expect(stats.genres).toBeGreaterThan(2);
      expect(stats.tags).toBeGreaterThan(20);
    });
  });

  describe("getRelatedTemplates", () => {
    it("should return related templates", () => {
      const template = getTemplateById("four-on-the-floor");
      if (!template) throw new Error("Template not found");

      const related = getRelatedTemplates(template);

      expect(related.length).toBeGreaterThan(0);
    });
  });

  describe("getTemplatesGroupedByType", () => {
    it("should group templates by type", () => {
      const grouped = getTemplatesGroupedByType();

      expect(grouped.drums.length).toBeGreaterThan(0);
      expect(grouped.melody.length).toBeGreaterThan(0);
      expect(grouped.chord.length).toBeGreaterThan(0);
    });
  });
});

