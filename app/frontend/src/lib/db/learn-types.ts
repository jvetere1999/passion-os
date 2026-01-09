/**
 * Learning Suite Types
 * Type definitions for the synth learning platform
 */

import type { ISOTimestamp } from "./types";

// ============================================
// Enums / Literal Types
// ============================================

export type SynthScope = "serum" | "vital" | "both";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type EntityType = "course" | "module" | "lesson" | "exercise" | "project";
export type ProgressStatus = "not_started" | "in_progress" | "completed";
export type CardType = "definition" | "identification" | "application";
export type ReviewGrade = 0 | 1 | 2 | 3; // again, hard, good, easy
export type SourceType = "concept" | "quiz_miss" | "manual";
export type RecipeTargetType = "bass" | "lead" | "pad" | "pluck" | "fx" | "arp";
export type PostStatus = "visible" | "hidden" | "removed";
export type ReportReason = "spam" | "harassment" | "off_topic" | "misinformation" | "other";
export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";
export type ModActionType =
  | "post_remove" | "post_restore" | "post_hide"
  | "thread_lock" | "thread_unlock"
  | "user_warn" | "user_mute" | "user_unmute"
  | "report_dismiss" | "report_action";

// ============================================
// Content Entities (R1 - read-mostly)
// ============================================

export interface Course {
  id: string;
  title: string;
  slug: string;
  synthScope: SynthScope;
  difficulty: Difficulty;
  description: string;
  learningOutcomes: string[];
  estimatedHours: number;
  tags: string[];
  orderIndex: number;
  isPublished: boolean;
  version: number;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface LearnModule {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  description: string | null;
  prereqModuleIds: string[];
  orderIndex: number;
  estimatedMinutes: number;
  isPublished: boolean;
  version: number;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  description: string | null;
  mdxContent: string;
  widgetManifest: WidgetManifest | null;
  quizSpec: QuizSpec | null;
  troubleshooting: TroubleshootingItem[];
  conceptIds: string[];
  synthScope: SynthScope;
  difficulty: Difficulty | null;
  estimatedMinutes: number;
  orderIndex: number;
  isPublished: boolean;
  version: number;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface WidgetManifest {
  widgets: WidgetConfig[];
}

export interface WidgetConfig {
  id: string;
  type: "envelope" | "lfo" | "filter" | "unison" | "wavetable";
  props: Record<string, unknown>;
  position: "inline" | "sidebar";
}

export interface QuizSpec {
  questions: QuizQuestion[];
  passingScore: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
}

export interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  prompt: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  conceptId?: string;
  points: number;
}

export interface TroubleshootingItem {
  issue: string;
  cause: string;
  solution: string;
}

export interface Concept {
  id: string;
  term: string;
  definition: string;
  aliases: string[];
  category: string | null;
  relatedConceptIds: string[];
  prereqConceptIds: string[];
  confusionConceptIds: string[];
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface SynthMapping {
  id: string;
  conceptId: string | null;
  lessonId: string | null;
  synth: "serum" | "vital";
  uiArea: string | null;
  parameterName: string | null;
  steps: string[];
  gotchas: string[];
  tips: string[];
  createdAt: ISOTimestamp;
}

export interface Exercise {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  description: string | null;
  checklist: ChecklistItem[];
  rubric: RubricItem[] | null;
  conceptIds: string[];
  synthScope: SynthScope;
  difficulty: Difficulty | null;
  estimatedMinutes: number;
  orderIndex: number;
  isPublished: boolean;
  version: number;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface ChecklistItem {
  id: string;
  text: string;
  hint?: string;
  required: boolean;
}

export interface RubricItem {
  id: string;
  criterion: string;
  description: string;
  weight: number; // 0-100
}

export interface LearnProject {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  brief: string;
  checklist: ChecklistItem[];
  rubric: RubricItem[] | null;
  conceptIds: string[];
  recommendedLessonIds: string[];
  synthScope: SynthScope;
  difficulty: Difficulty | null;
  estimatedHours: number;
  orderIndex: number;
  isPublished: boolean;
  version: number;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface RecipeTemplate {
  id: string;
  title: string;
  synth: SynthScope;
  targetType: RecipeTargetType;
  descriptorTags: string[];
  oscillatorSetup: OscillatorSetup;
  filterSettings: FilterSettings | null;
  envelopeConfig: EnvelopeConfig | null;
  lfoConfig: LfoConfig | null;
  macroMappings: MacroMapping[];
  explanation: string | null;
  variations: RecipeVariation[];
  troubleshooting: string[];
  isPublished: boolean;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface OscillatorSetup {
  oscA: OscillatorConfig;
  oscB?: OscillatorConfig;
  sub?: { enabled: boolean; octave: number; shape: string };
  noise?: { enabled: boolean; level: number; color: string };
}

export interface OscillatorConfig {
  wavetable: string;
  position: number;
  warp: { type: string; amount: number };
  unison: { voices: number; detune: number; blend: number; width: number };
  octave: number;
  semitone: number;
  fine: number;
  level: number;
  pan: number;
}

export interface FilterSettings {
  enabled: boolean;
  type: string;
  cutoff: number;
  resonance: number;
  drive: number;
  keytrack: number;
  envAmount: number;
}

export interface EnvelopeConfig {
  amp: ADSREnvelope;
  filter?: ADSREnvelope;
  mod?: ADSREnvelope[];
}

export interface ADSREnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  curve?: number;
}

export interface LfoConfig {
  lfos: LfoSettings[];
}

export interface LfoSettings {
  id: number;
  shape: string;
  rate: number;
  tempoSync: boolean;
  phase: number;
  retrigger: boolean;
  destinations: { target: string; amount: number }[];
}

export interface MacroMapping {
  macroNumber: number;
  name: string;
  mappings: { target: string; min: number; max: number }[];
}

export interface RecipeVariation {
  name: string;
  description: string;
  changes: Record<string, unknown>;
}

// ============================================
// User State Entities (D1 - write-heavy)
// ============================================

export interface LearnUserSettings {
  userId: string;
  synthPreference: SynthScope;
  dailyReviewTarget: number;
  dailyLessonTarget: number;
  showBothMappings: boolean;
  diagnosticCompleted: boolean;
  diagnosticResults: DiagnosticResults | null;
  streakCurrent: number;
  streakLongest: number;
  streakLastDate: string | null;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface DiagnosticResults {
  weakConcepts: string[];
  recommendedCourseIds: string[];
  skillLevels: Record<string, number>;
  completedAt: ISOTimestamp;
}

export interface LearnProgress {
  id: string;
  userId: string;
  entityType: EntityType;
  entityId: string;
  status: ProgressStatus;
  progressPct: number;
  notes: string | null;
  confidence: number | null;
  startedAt: ISOTimestamp | null;
  completedAt: ISOTimestamp | null;
  lastSeenAt: ISOTimestamp;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  lessonId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  answers: QuizAnswer[];
  missedConceptIds: string[];
  timeTakenSeconds: number | null;
  createdAt: ISOTimestamp;
}

export interface QuizAnswer {
  questionId: string;
  userAnswer: string | number;
  correct: boolean;
}

export interface ReviewCard {
  id: string;
  userId: string;
  sourceType: SourceType;
  sourceId: string | null;
  conceptId: string | null;
  cardType: CardType;
  front: string;
  back: string;
  dueAt: ISOTimestamp;
  intervalDays: number;
  ease: number;
  lapses: number;
  reviews: number;
  lastReviewedAt: ISOTimestamp | null;
  suspended: boolean;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface ReviewHistory {
  id: string;
  cardId: string;
  userId: string;
  grade: ReviewGrade;
  intervalBefore: number | null;
  intervalAfter: number | null;
  easeBefore: number | null;
  easeAfter: number | null;
  timeTakenMs: number | null;
  createdAt: ISOTimestamp;
}

export interface SavedRecipe {
  id: string;
  userId: string;
  title: string;
  synth: "serum" | "vital";
  targetType: RecipeTargetType | null;
  recipeData: RecipeTemplate;
  tags: string[];
  notes: string | null;
  sourceTemplateId: string | null;
  isFavorite: boolean;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface PatchJournalEntry {
  id: string;
  userId: string;
  synth: "serum" | "vital" | "other";
  patchName: string;
  tags: string[];
  notes: string | null;
  whatLearned: string | null;
  whatBroke: string | null;
  presetReference: string | null;
  relatedLessonIds: string[];
  relatedConceptIds: string[];
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

// ============================================
// Community Entities
// ============================================

export interface LearnThread {
  id: string;
  lessonId: string;
  postCount: number;
  isLocked: boolean;
  lockedBy: string | null;
  lockedAt: ISOTimestamp | null;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface LearnPost {
  id: string;
  threadId: string;
  userId: string;
  body: string;
  replyToId: string | null;
  status: PostStatus;
  editCount: number;
  reportCount: number;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface LearnReport {
  id: string;
  postId: string;
  reporterId: string;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  resolvedAt: ISOTimestamp | null;
  resolverId: string | null;
  createdAt: ISOTimestamp;
}

export interface LearnModAction {
  id: string;
  actorId: string;
  actionType: ModActionType;
  targetType: "post" | "thread" | "user" | "report";
  targetId: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: ISOTimestamp;
}

// ============================================
// Input Types (for API)
// ============================================

export interface CreateProgressInput {
  entityType: EntityType;
  entityId: string;
  status?: ProgressStatus;
}

export interface UpdateProgressInput {
  status?: ProgressStatus;
  progressPct?: number;
  notes?: string;
  confidence?: number;
}

export interface SubmitQuizInput {
  lessonId: string;
  answers: { questionId: string; answer: string | number }[];
  timeTakenSeconds?: number;
}

export interface GradeReviewInput {
  cardId: string;
  grade: ReviewGrade;
  timeTakenMs?: number;
}

export interface CreateRecipeInput {
  title: string;
  synth: "serum" | "vital";
  targetType?: RecipeTargetType;
  recipeData: Partial<RecipeTemplate>;
  tags?: string[];
  notes?: string;
  sourceTemplateId?: string;
}

export interface CreateJournalInput {
  synth: "serum" | "vital" | "other";
  patchName: string;
  tags?: string[];
  notes?: string;
  whatLearned?: string;
  whatBroke?: string;
  presetReference?: string;
  relatedLessonIds?: string[];
  relatedConceptIds?: string[];
}

export interface CreatePostInput {
  threadId: string;
  body: string;
  replyToId?: string;
}

export interface CreateReportInput {
  postId: string;
  reason: ReportReason;
  detail?: string;
}

// ============================================
// View Types (combined for UI)
// ============================================

export interface LessonWithMappings extends Lesson {
  mappings: {
    serum: SynthMapping[];
    vital: SynthMapping[];
  };
  concepts: Concept[];
  module: LearnModule;
  course: Course;
  progress?: LearnProgress;
  thread?: LearnThread;
}

export interface CourseWithModules extends Course {
  modules: (LearnModule & {
    lessons: Lesson[];
    exercises: Exercise[];
  })[];
  projects: LearnProject[];
  progress?: {
    completedLessons: number;
    totalLessons: number;
    completedExercises: number;
    totalExercises: number;
  };
}

export interface DashboardData {
  continueItem: {
    type: EntityType;
    id: string;
    title: string;
    courseName: string;
    moduleName: string;
    progressPct: number;
  } | null;
  dueReviewCount: number;
  estimatedReviewMinutes: number;
  weakAreas: {
    conceptId: string;
    term: string;
    suggestedLessonId: string;
    suggestedLessonTitle: string;
    lapseCount: number;
  }[];
  recentActivity: {
    type: string;
    title: string;
    completedAt: ISOTimestamp;
  }[];
  streak: {
    current: number;
    longest: number;
    isActiveToday: boolean;
  };
  stats: {
    lessonsCompleted: number;
    exercisesCompleted: number;
    projectsCompleted: number;
    reviewCardsTotal: number;
    avgRetention: number;
  };
}

export interface ReviewSession {
  cards: ReviewCard[];
  newCardsToday: number;
  reviewCardsToday: number;
  estimatedMinutes: number;
}

