/**
 * Data layer barrel export
 */

// Full shortcuts data (real DAW shortcuts)
export {
  products,
  getProductById,
  allShortcuts,
  allFeatures,
  getShortcutsByProduct,
  getShortcutsWithProduct,
  getShortcutsGroupedByCategory,
  searchShortcuts as searchAllShortcuts,
  getGroupsForProduct,
  getTagsForProduct,
  getProductStats,
  type Shortcut,
  type Product,
  type ShortcutWithProduct,
  type FeatureEntry,
  type Entry,
} from "./shortcuts/index";

// Simplified DAW data for hub pages (backward compat)
export {
  getDAWs,
  getDAWById,
  searchShortcuts,
  type DAWData,
} from "./daws";

// Full templates data (real music templates)
export {
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
  getTemplatesGroupedByGenre,
  type BuiltInTemplate,
  type LaneTemplateType,
  type TemplateNote,
  type LaneSettings,
  type Difficulty,
} from "./templates/index";

// Legacy templates (backward compat for existing pages)
export {
  getTemplateCategories,
  getTemplatesByCategory,
  getTemplateById as getLegacyTemplateById,
  searchTemplates as searchLegacyTemplates,
  type Template,
  type TemplateCategory,
} from "./templates-legacy";

