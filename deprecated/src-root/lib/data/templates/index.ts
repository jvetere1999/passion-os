/**
 * Templates Module
 * Built-in music templates for drums, melodies, and chord progressions
 */

export * from "./types";

import { drumTemplates } from "./drums";
import { melodyTemplates } from "./melodies";
import { chordTemplates } from "./chords";
import type { BuiltInTemplate, LaneTemplateType, Difficulty } from "./types";

// Re-export individual template arrays
export { drumTemplates } from "./drums";
export { melodyTemplates } from "./melodies";
export { chordTemplates } from "./chords";

/**
 * All built-in templates combined
 */
export const allTemplates: BuiltInTemplate[] = [
  ...drumTemplates,
  ...melodyTemplates,
  ...chordTemplates,
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): BuiltInTemplate | undefined {
  return allTemplates.find((t) => t.id === id);
}

/**
 * Get template by slug
 */
export function getTemplateBySlug(slug: string): BuiltInTemplate | undefined {
  return allTemplates.find((t) => t.slug === slug);
}

/**
 * Get templates by type
 */
export function getTemplatesByType(type: LaneTemplateType): BuiltInTemplate[] {
  return allTemplates.filter((t) => t.type === type);
}

/**
 * Get templates by genre
 */
export function getTemplatesByGenre(genre: string): BuiltInTemplate[] {
  return allTemplates.filter(
    (t) => t.genre.toLowerCase() === genre.toLowerCase()
  );
}

/**
 * Get templates by tag
 */
export function getTemplatesByTag(tag: string): BuiltInTemplate[] {
  const lowerTag = tag.toLowerCase();
  return allTemplates.filter((t) =>
    t.tags.some((tg) => tg.toLowerCase() === lowerTag)
  );
}

/**
 * Get templates by difficulty
 */
export function getTemplatesByDifficulty(
  difficulty: Difficulty
): BuiltInTemplate[] {
  return allTemplates.filter((t) => t.difficulty === difficulty);
}

/**
 * Get related templates for a template
 */
export function getRelatedTemplates(
  template: BuiltInTemplate
): BuiltInTemplate[] {
  if (!template.relatedTemplates) return [];
  return template.relatedTemplates
    .map((id) => getTemplateById(id))
    .filter((t): t is BuiltInTemplate => t !== undefined);
}

/**
 * Get all unique genres
 */
export function getAllGenres(): string[] {
  const genres = new Set<string>();
  for (const template of allTemplates) {
    genres.add(template.genre);
  }
  return Array.from(genres).sort();
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const template of allTemplates) {
    template.tags.forEach((t) => tags.add(t));
  }
  return Array.from(tags).sort();
}

/**
 * Search templates
 */
export function searchTemplates(query: string): BuiltInTemplate[] {
  const lowerQuery = query.toLowerCase();
  return allTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.genre.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get template statistics
 */
export function getTemplateStats(): {
  total: number;
  drums: number;
  melodies: number;
  chords: number;
  genres: number;
  tags: number;
} {
  return {
    total: allTemplates.length,
    drums: drumTemplates.length,
    melodies: melodyTemplates.length,
    chords: chordTemplates.length,
    genres: getAllGenres().length,
    tags: getAllTags().length,
  };
}

/**
 * Get EDM-focused templates (electronic genre + edm tags)
 */
export function getEDMTemplates(): BuiltInTemplate[] {
  return allTemplates.filter(
    (t) =>
      t.genre === "Electronic" ||
      t.tags.some((tag) =>
        [
          "edm",
          "house",
          "techno",
          "trance",
          "dubstep",
          "future-bass",
          "dnb",
          "drum-and-bass",
          "electronic",
        ].includes(tag.toLowerCase())
      )
  );
}

/**
 * Get templates grouped by type
 */
export function getTemplatesGroupedByType(): Record<
  LaneTemplateType,
  BuiltInTemplate[]
> {
  return {
    drums: drumTemplates,
    melody: melodyTemplates,
    chord: chordTemplates,
  };
}

/**
 * Get templates grouped by genre
 */
export function getTemplatesGroupedByGenre(): Record<
  string,
  BuiltInTemplate[]
> {
  const grouped: Record<string, BuiltInTemplate[]> = {};
  for (const template of allTemplates) {
    if (!grouped[template.genre]) {
      grouped[template.genre] = [];
    }
    grouped[template.genre].push(template);
  }
  return grouped;
}

