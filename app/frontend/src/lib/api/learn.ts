/**
 * Learn API
 *
 * API client methods for learning system (topics, lessons, drills, progress).
 * All calls go through the backend at api.ecent.online.
 *
 * PARITY-037: Learn routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiDelete, apiGet, apiPost, apiPut } from './client';

// ============================================
// Types
// ============================================

export type LessonStatus = 'not_started' | 'in_progress' | 'completed' | 'review';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LearnTopic {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  lesson_count: number;
  completed_count: number;
}

export interface LearnLesson {
  id: string;
  topic_id: string;
  key: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  difficulty: Difficulty;
  xp_reward: number;
  coin_reward: number;
  status: LessonStatus;
  has_quiz: boolean;
  has_audio: boolean;
}

export interface LessonContent {
  id: string;
  title: string;
  content_markdown: string | null;
  quiz_json: unknown | null;
  audio_url: string | null;
  progress: LessonProgress;
}

export interface LessonProgress {
  status: LessonStatus;
  started_at: string | null;
  completed_at: string | null;
  quiz_score: number | null;
  attempts: number;
}

export interface LearnDrill {
  id: string;
  topic_id: string;
  key: string;
  title: string;
  description: string | null;
  drill_type: string;
  difficulty: Difficulty;
  duration_seconds: number;
  xp_reward: number;
  best_score: number | null;
  current_streak: number;
}

export interface LearnProgressSummary {
  topics_started: number;
  lessons_completed: number;
  total_lessons: number;
  drills_practiced: number;
  total_xp_earned: number;
  current_streak_days: number;
}

export interface LearnOverview {
  progress: LearnProgressSummary;
  review_count: number;
  topics: LearnTopic[];
}

export interface ReviewCard {
  id: string;
  front: string;
  back: string;
  conceptId: string | null;
  cardType: string;
  dueAt: string;
  intervalDays: number;
  easeFactor: number;
  lapses: number;
}

export interface ReviewItems {
  cards: ReviewCard[];
  totalDue: number;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  category: string;
  aliases: string[];
  relatedConcepts: string[];
}

export interface RecipeTemplate {
  id: string;
  title: string;
  synth: string;
  targetType: string;
  descriptors: string[];
  mono: boolean;
  cpuBudget: string;
  macroCount: number;
  recipeJson: unknown;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  synth: string;
  patchName: string;
  tags: string[];
  notes: string | null;
  whatLearned: string | null;
  whatBroke: string | null;
  presetReference: string | null;
  createdAt: string;
  updatedAt: string;
}

// Request types
export interface CompleteLessonRequest {
  quiz_score?: number;
}

export interface SubmitDrillRequest {
  score: number;
  correct_count: number;
  total_count: number;
  time_seconds: number;
}

// Response wrappers
interface OverviewWrapper {
  items: LearnOverview;
}

interface TopicsWrapper {
  topics: LearnTopic[];
}

interface LessonsWrapper {
  lessons: LearnLesson[];
}

interface DrillsWrapper {
  drills: LearnDrill[];
}

interface LessonContentWrapper {
  lesson: LessonContent;
}

interface LessonProgressWrapper {
  progress: LessonProgress;
}

interface ReviewWrapper {
  review: {
    cards: {
      id: string;
      front: string;
      back: string;
      concept_id: string | null;
      card_type: string;
      due_at: string;
      interval_days: number;
      ease_factor: number;
      lapses: number;
    }[];
    total_due: number;
  };
}

interface ProgressWrapper {
  progress: LearnProgressSummary;
}

interface GlossaryWrapper {
  entries: {
    id: string;
    term: string;
    definition: string;
    category: string;
    aliases: string[] | null;
    related_concepts: string[] | null;
  }[];
}

interface RecipesWrapper {
  recipes: {
    id: string;
    title: string;
    synth: string;
    target_type: string;
    descriptors: string[] | null;
    mono: boolean;
    cpu_budget: string;
    macro_count: number;
    recipe_json: unknown;
    created_at: string;
  }[];
}

interface RecipeWrapper {
  recipe: {
    id: string;
    title: string;
    synth: string;
    target_type: string;
    descriptors: string[] | null;
    mono: boolean;
    cpu_budget: string;
    macro_count: number;
    recipe_json: unknown;
    created_at: string;
  };
}

interface DeleteWrapper {
  success: boolean;
}

interface JournalWrapper {
  entries: {
    id: string;
    synth: string;
    patch_name: string;
    tags: string[] | null;
    notes: string | null;
    what_learned: string | null;
    what_broke: string | null;
    preset_reference: string | null;
    created_at: string;
    updated_at: string;
  }[];
}

interface JournalEntryWrapper {
  entry: {
    id: string;
    synth: string;
    patch_name: string;
    tags: string[] | null;
    notes: string | null;
    what_learned: string | null;
    what_broke: string | null;
    preset_reference: string | null;
    created_at: string;
    updated_at: string;
  };
}

interface CompleteLessonResult {
  result: CompleteLessonResult;
}

interface DrillResult {
  result: DrillResultInfo;
}

interface DrillResultInfo {
  drill_id: string;
  score: number;
  xp_awarded: number;
  is_new_best: boolean;
  streak_continued: boolean;
  new_streak: number;
}

// ============================================
// Overview API
// ============================================

/** Get learning overview */
export async function getLearnOverview(): Promise<LearnOverview> {
  const response = await apiGet<OverviewWrapper>('/api/learn');
  return response.items;
}

/** Get learning progress summary */
export async function getLearnProgress(): Promise<LearnProgressSummary> {
  const response = await apiGet<ProgressWrapper>('/api/learn/progress');
  return response.progress;
}

/** Get items due for review */
export async function getReviewItems(): Promise<ReviewItems> {
  const response = await apiGet<ReviewWrapper>('/api/learn/review');
  return {
    cards: response.review.cards.map((card) => ({
      id: card.id,
      front: card.front,
      back: card.back,
      conceptId: card.concept_id,
      cardType: card.card_type,
      dueAt: card.due_at,
      intervalDays: card.interval_days,
      easeFactor: card.ease_factor,
      lapses: card.lapses,
    })),
    totalDue: response.review.total_due,
  };
}

export async function submitReview(cardId: string, grade: number): Promise<ReviewCard> {
  const response = await apiPost<{ result: { card: {
    id: string;
    front: string;
    back: string;
    concept_id: string | null;
    card_type: string;
    due_at: string;
    interval_days: number;
    ease_factor: number;
    lapses: number;
  } } }>('/api/learn/review', { card_id: cardId, grade });
  const card = response.result.card;
  return {
    id: card.id,
    front: card.front,
    back: card.back,
    conceptId: card.concept_id,
    cardType: card.card_type,
    dueAt: card.due_at,
    intervalDays: card.interval_days,
    easeFactor: card.ease_factor,
    lapses: card.lapses,
  };
}

// ============================================
// Topics API
// ============================================

/** List all topics with progress */
export async function listTopics(): Promise<LearnTopic[]> {
  const response = await apiGet<TopicsWrapper>('/api/learn/topics');
  return response.topics;
}

/** List lessons for a topic */
export async function listLessons(topicId: string): Promise<LearnLesson[]> {
  const response = await apiGet<LessonsWrapper>(`/api/learn/topics/${topicId}/lessons`);
  return response.lessons;
}

/** List drills for a topic */
export async function listDrills(topicId: string): Promise<LearnDrill[]> {
  const response = await apiGet<DrillsWrapper>(`/api/learn/topics/${topicId}/drills`);
  return response.drills;
}

// ============================================
// Lessons API
// ============================================

/** Get lesson content */
export async function getLesson(id: string): Promise<LessonContent> {
  const response = await apiGet<LessonContentWrapper>(`/api/learn/lessons/${id}`);
  return response.lesson;
}

/** Start a lesson */
export async function startLesson(id: string): Promise<LessonProgress> {
  const response = await apiPost<LessonProgressWrapper>(`/api/learn/lessons/${id}/start`);
  return response.progress;
}

/** Complete a lesson */
export async function completeLesson(id: string, data?: CompleteLessonRequest): Promise<CompleteLessonResult> {
  const response = await apiPost<{ result: CompleteLessonResult }>(
    `/api/learn/lessons/${id}/complete`,
    data || {}
  );
  return response.result;
}

// ============================================
// Drills API
// ============================================

/** Submit drill result */
export async function submitDrill(id: string, data: SubmitDrillRequest): Promise<DrillResultInfo> {
  const response = await apiPost<DrillResult>(`/api/learn/drills/${id}/submit`, data);
  return response.result;
}

// ============================================
// Glossary API
// ============================================

export async function listGlossaryEntries(query?: string, category?: string): Promise<GlossaryEntry[]> {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (category) params.set("category", category);
  const url = params.toString() ? `/api/learn/glossary?${params.toString()}` : "/api/learn/glossary";
  const response = await apiGet<GlossaryWrapper>(url);
  return response.entries.map((entry) => ({
    id: entry.id,
    term: entry.term,
    definition: entry.definition,
    category: entry.category,
    aliases: entry.aliases || [],
    relatedConcepts: entry.related_concepts || [],
  }));
}

// ============================================
// Recipes API
// ============================================

export interface CreateRecipeRequest {
  title: string;
  synth: string;
  targetType: string;
  descriptors: string[];
  mono: boolean;
  cpuBudget: string;
  macroCount: number;
  recipeJson: unknown;
}

export async function listRecipes(): Promise<RecipeTemplate[]> {
  const response = await apiGet<RecipesWrapper>("/api/learn/recipes");
  return response.recipes.map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    synth: recipe.synth,
    targetType: recipe.target_type,
    descriptors: recipe.descriptors || [],
    mono: recipe.mono,
    cpuBudget: recipe.cpu_budget,
    macroCount: recipe.macro_count,
    recipeJson: recipe.recipe_json,
    createdAt: recipe.created_at,
  }));
}

export async function createRecipe(data: CreateRecipeRequest): Promise<RecipeTemplate> {
  const response = await apiPost<RecipeWrapper>("/api/learn/recipes", {
    title: data.title,
    synth: data.synth,
    target_type: data.targetType,
    descriptors: data.descriptors.length ? data.descriptors : null,
    mono: data.mono,
    cpu_budget: data.cpuBudget,
    macro_count: data.macroCount,
    recipe_json: data.recipeJson,
  });
  const recipe = response.recipe;
  return {
    id: recipe.id,
    title: recipe.title,
    synth: recipe.synth,
    targetType: recipe.target_type,
    descriptors: recipe.descriptors || [],
    mono: recipe.mono,
    cpuBudget: recipe.cpu_budget,
    macroCount: recipe.macro_count,
    recipeJson: recipe.recipe_json,
    createdAt: recipe.created_at,
  };
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const response = await apiDelete<DeleteWrapper>(`/api/learn/recipes/${id}`);
  return response.success;
}

// ============================================
// Journal API
// ============================================

export interface CreateJournalEntryRequest {
  synth: string;
  patchName: string;
  tags: string[];
  notes: string | null;
  whatLearned: string | null;
  whatBroke: string | null;
  presetReference: string | null;
}

export type UpdateJournalEntryRequest = Partial<CreateJournalEntryRequest>;

export async function listJournalEntries(): Promise<JournalEntry[]> {
  const response = await apiGet<JournalWrapper>("/api/learn/journal");
  return response.entries.map((entry) => ({
    id: entry.id,
    synth: entry.synth,
    patchName: entry.patch_name,
    tags: entry.tags || [],
    notes: entry.notes,
    whatLearned: entry.what_learned,
    whatBroke: entry.what_broke,
    presetReference: entry.preset_reference,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  }));
}

export async function createJournalEntry(data: CreateJournalEntryRequest): Promise<JournalEntry> {
  const response = await apiPost<JournalEntryWrapper>("/api/learn/journal", {
    synth: data.synth,
    patch_name: data.patchName,
    tags: data.tags.length ? data.tags : null,
    notes: data.notes,
    what_learned: data.whatLearned,
    what_broke: data.whatBroke,
    preset_reference: data.presetReference,
  });
  const entry = response.entry;
  return {
    id: entry.id,
    synth: entry.synth,
    patchName: entry.patch_name,
    tags: entry.tags || [],
    notes: entry.notes,
    whatLearned: entry.what_learned,
    whatBroke: entry.what_broke,
    presetReference: entry.preset_reference,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  };
}

export async function updateJournalEntry(id: string, data: UpdateJournalEntryRequest): Promise<JournalEntry> {
  const response = await apiPut<JournalEntryWrapper>(`/api/learn/journal/${id}`, {
    synth: data.synth ?? null,
    patch_name: data.patchName ?? null,
    tags: data.tags ?? null,
    notes: data.notes ?? null,
    what_learned: data.whatLearned ?? null,
    what_broke: data.whatBroke ?? null,
    preset_reference: data.presetReference ?? null,
  });
  const entry = response.entry;
  return {
    id: entry.id,
    synth: entry.synth,
    patchName: entry.patch_name,
    tags: entry.tags || [],
    notes: entry.notes,
    whatLearned: entry.what_learned,
    whatBroke: entry.what_broke,
    presetReference: entry.preset_reference,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  };
}

export async function deleteJournalEntry(id: string): Promise<boolean> {
  const response = await apiDelete<DeleteWrapper>(`/api/learn/journal/${id}`);
  return response.success;
}
