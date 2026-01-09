/**
 * Database repositories barrel export
 */

// Quests
export {
  createQuest,
  getQuest,
  updateQuest,
  deleteQuest,
  listQuests,
  getDueQuests,
  completeQuest,
  type ListQuestsOptions,
} from "./quests";

// Focus Sessions
export {
  createFocusSession,
  getFocusSession,
  completeFocusSession,
  abandonFocusSession,
  getActiveFocusSession,
  listFocusSessions,
  getFocusStats,
  type ListFocusSessionsOptions,
  type FocusStats,
} from "./focusSessions";

// Projects
export {
  createProject,
  getProject,
  updateProject,
  deleteProject,
  listProjects,
  toggleProjectStarred,
  type ListProjectsOptions,
} from "./projects";

// Infobase
export {
  createInfobaseEntry,
  getInfobaseEntry,
  updateInfobaseEntry,
  deleteInfobaseEntry,
  listInfobaseEntries,
  getCategories,
  toggleInfobaseEntryPinned,
  type ListInfobaseEntriesOptions,
} from "./infobase";

// User Settings
export {
  getUserSettings,
  updateUserSettings,
  getCustomSettings,
  setCustomSetting,
  DEFAULT_SETTINGS,
  type UpdateSettingsInput,
} from "./userSettings";

// Daily Plans & Today State
export {
  getDailyPlanSummary,
  isFirstDay,
  hasFocusActive,
  hasActiveStreak,
  getTodayServerState,
  getDynamicUIData,
  type PlanItem,
  type DailyPlanSummary,
  type TodayServerState,
  type QuickPick,
  type ResumeLast,
  type InterestPrimer,
  type DynamicUIData,
} from "./dailyPlans";
