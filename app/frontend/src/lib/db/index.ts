/**
 * Database module barrel export
 */

// Client utilities
export { getDB, query, queryOne, execute, batch, type D1Result } from "./client";

// Repository utilities
export {
  generateId,
  now,
  computeContentHash,
  parseJSON,
  toJSON,
  boolToInt,
  intToBool,
  getPaginationSQL,
  paginatedQuery,
  validateRequired,
  validateMaxLength,
  validateEnum,
  type PaginatedResult,
  type PaginationOptions,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "./utils";

// Types
export type {
  // Common types
  ISOTimestamp,
  JSONString,
  QuestStatus,
  QuestPriority,
  FocusSessionStatus,
  FocusMode,
  ProjectStatus,
  LaneTemplateType,
  PlanTemplateType,
  RecurrenceType,
  RewardType,
  // Entity types
  LogEvent,
  Quest,
  ScheduleRule,
  PlanTemplate,
  SkillTree,
  RewardLedgerEntry,
  FocusSession,
  Project,
  ReferenceLibrary,
  ReferenceTrack,
  InfobaseEntry,
  LaneTemplate,
  UserSettings,
  // Calendar types
  CalendarEvent,
  CalendarEventType,
  // Exercise types
  Exercise,
  Workout,
  WorkoutExercise,
  WorkoutSession,
  ExerciseSet,
  PersonalRecord,
  // Input types
  CreateQuestInput,
  UpdateQuestInput,
  CreateFocusSessionInput,
  CreateProjectInput,
  UpdateProjectInput,
  CreateInfobaseEntryInput,
  UpdateInfobaseEntryInput,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from "./types";

// Repositories
export * as quests from "./repositories/quests";
export * as focusSessions from "./repositories/focusSessions";
export * as projects from "./repositories/projects";
export * as infobase from "./repositories/infobase";
export * as userSettings from "./repositories/userSettings";
export * as calendarEvents from "./repositories/calendarEvents";

// Re-export commonly used repository functions
export {
  createQuest,
  getQuest,
  updateQuest,
  deleteQuest,
  listQuests,
  getDueQuests,
  completeQuest,
  createFocusSession,
  getFocusSession,
  completeFocusSession,
  abandonFocusSession,
  getActiveFocusSession,
  listFocusSessions,
  getFocusStats,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  listProjects,
  toggleProjectStarred,
  createInfobaseEntry,
  getInfobaseEntry,
  updateInfobaseEntry,
  deleteInfobaseEntry,
  listInfobaseEntries,
  getCategories,
  toggleInfobaseEntryPinned,
  getUserSettings,
  updateUserSettings,
  getCustomSettings,
  setCustomSetting,
  DEFAULT_SETTINGS,
} from "./repositories";

// Track Analysis Cache
export {
  getAnalysisByHash,
  getAnalysisById,
  saveAnalysis,
  deleteAnalysisByHash,
  getAnalysesByHashes,
  generateContentHash as generateDbContentHash,
  type CachedTrackAnalysis,
} from "./repositories/track-analysis";

