/**
 * Exercise API
 *
 * API client methods for exercise, workouts, sessions, and training programs.
 * All calls go through the backend at api.ecent.online.
 *
 * PARITY-032: Exercise routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost, apiDelete } from './client';

// ============================================
// Types
// ============================================

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  equipment: string[];
  description: string | null;
  is_builtin: boolean;
}

export interface WorkoutExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  rest_seconds: number | null;
  notes: string | null;
  sort_order: number;
}

export interface WorkoutSection {
  id: string;
  name: string;
  section_type: string;
  sort_order: number;
  exercises: WorkoutExercise[];
}

export interface Workout {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  difficulty: string;
  workout_type: string;
  is_template: boolean;
  sections: WorkoutSection[];
}

export interface ExerciseSet {
  id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  notes: string | null;
}

export interface WorkoutSession {
  id: string;
  workout_id: string;
  workout_name: string;
  started_at: string;
  completed_at: string | null;
  status: 'active' | 'completed' | 'abandoned';
  duration_seconds: number | null;
  notes: string | null;
  sets: ExerciseSet[];
}

export interface PersonalRecord {
  id: string;
  exercise_id: string;
  exercise_name: string;
  record_type: string;
  value: number;
  achieved_at: string;
}

export interface TrainingProgram {
  id: string;
  name: string;
  description: string | null;
  duration_weeks: number;
  days_per_week: number;
  difficulty: string;
  goal: string;
  is_active: boolean;
  started_at: string | null;
  current_week: number;
  current_day: number;
}

// Request types
export interface CreateExerciseRequest {
  name: string;
  category: string;
  muscle_groups?: string[];
  equipment?: string[];
  description?: string;
}

export interface CreateWorkoutRequest {
  name: string;
  description?: string;
  difficulty?: string;
  workout_type?: string;
  sections?: {
    name: string;
    section_type: string;
    exercises: {
      exercise_id: string;
      sets: number;
      reps_min?: number;
      reps_max?: number;
      weight_kg?: number;
      duration_seconds?: number;
      rest_seconds?: number;
    }[];
  }[];
}

export interface LogSetRequest {
  exercise_id: string;
  set_number: number;
  reps?: number;
  weight_kg?: number;
  duration_seconds?: number;
  notes?: string;
}

export interface CompleteSessionRequest {
  notes?: string;
}

export interface CreateProgramRequest {
  name: string;
  description?: string;
  duration_weeks: number;
  days_per_week: number;
  difficulty?: string;
  goal?: string;
}

// Response wrappers
interface ExercisesWrapper {
  exercises: Exercise[];
}

interface WorkoutsWrapper {
  workouts: Workout[];
}

interface SessionsWrapper {
  sessions: WorkoutSession[];
}

interface ProgramsWrapper {
  programs: TrainingProgram[];
}

interface SessionStartResult {
  session_id: string;
  workout_id: string;
  started_at: string;
}

interface LogSetResult {
  set_id: string;
  set_number: number;
  is_personal_record: boolean;
  record_type: string | null;
}

interface CompleteSessionResult {
  session_id: string;
  workout_id: string;
  duration_seconds: number;
  total_sets: number;
  total_volume_kg: number;
  xp_awarded: number;
  personal_records: PersonalRecord[];
}

// ============================================
// Exercise API
// ============================================

/** List all exercises */
export async function listExercises(): Promise<Exercise[]> {
  const response = await apiGet<ExercisesWrapper>('/api/exercise');
  return response.exercises;
}

/** Create a custom exercise */
export async function createExercise(data: CreateExerciseRequest): Promise<Exercise> {
  const response = await apiPost<{ exercise: Exercise }>('/api/exercise', data);
  return response.exercise;
}

/** Get exercise by ID */
export async function getExercise(id: string): Promise<Exercise> {
  const response = await apiGet<{ exercise: Exercise }>(`/api/exercise/${id}`);
  return response.exercise;
}

/** Delete a custom exercise */
export async function deleteExercise(id: string): Promise<void> {
  await apiDelete<{ deleted: boolean }>(`/api/exercise/${id}`);
}

/** Seed builtin exercises (admin) */
export async function seedExercises(): Promise<{ seeded: number }> {
  const response = await apiPost<{ seeded: number }>('/api/exercise/seed');
  return response;
}

// ============================================
// Workout API
// ============================================

/** List all workouts */
export async function listWorkouts(): Promise<Workout[]> {
  const response = await apiGet<WorkoutsWrapper>('/api/exercise/workouts');
  return response.workouts;
}

/** Create a workout */
export async function createWorkout(data: CreateWorkoutRequest): Promise<Workout> {
  const response = await apiPost<{ workout: Workout }>('/api/exercise/workouts', data);
  return response.workout;
}

/** Get workout by ID */
export async function getWorkout(id: string): Promise<Workout> {
  const response = await apiGet<{ workout: Workout }>(`/api/exercise/workouts/${id}`);
  return response.workout;
}

/** Delete a workout */
export async function deleteWorkout(id: string): Promise<void> {
  await apiDelete<{ deleted: boolean }>(`/api/exercise/workouts/${id}`);
}

// ============================================
// Session API
// ============================================

/** List workout sessions */
export async function listSessions(): Promise<WorkoutSession[]> {
  const response = await apiGet<SessionsWrapper>('/api/exercise/sessions');
  return response.sessions;
}

/** Start a workout session */
export async function startSession(workoutId: string): Promise<SessionStartResult> {
  const response = await apiPost<{ result: SessionStartResult }>('/api/exercise/sessions/start', {
    workout_id: workoutId,
  });
  return response.result;
}

/** Get active session */
export async function getActiveSession(): Promise<WorkoutSession | null> {
  try {
    const response = await apiGet<{ session: WorkoutSession }>('/api/exercise/sessions/active');
    return response.session;
  } catch {
    return null;
  }
}

/** Log a set in the active session */
export async function logSet(data: LogSetRequest): Promise<LogSetResult> {
  const response = await apiPost<{ result: LogSetResult }>('/api/exercise/sessions/log-set', data);
  return response.result;
}

/** Complete the active session */
export async function completeSession(data?: CompleteSessionRequest): Promise<CompleteSessionResult> {
  const response = await apiPost<{ result: CompleteSessionResult }>('/api/exercise/sessions/complete', data || {});
  return response.result;
}

// ============================================
// Program API
// ============================================

/** List training programs */
export async function listPrograms(): Promise<TrainingProgram[]> {
  const response = await apiGet<ProgramsWrapper>('/api/exercise/programs');
  return response.programs;
}

/** Create a training program */
export async function createProgram(data: CreateProgramRequest): Promise<TrainingProgram> {
  const response = await apiPost<{ program: TrainingProgram }>('/api/exercise/programs', data);
  return response.program;
}

/** Get program by ID */
export async function getProgram(id: string): Promise<TrainingProgram> {
  const response = await apiGet<{ program: TrainingProgram }>(`/api/exercise/programs/${id}`);
  return response.program;
}

/** Activate a program */
export async function activateProgram(id: string): Promise<TrainingProgram> {
  const response = await apiPost<{ program: TrainingProgram }>(`/api/exercise/programs/${id}/activate`);
  return response.program;
}
