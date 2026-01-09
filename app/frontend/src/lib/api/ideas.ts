/**
 * Ideas API
 *
 * API client methods for idea capture and management.
 * All calls go through the backend at api.ecent.online.
 *
 * Wave 4: Ideas routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

// ============================================
// Types
// ============================================

export interface Idea {
  id: string;
  title: string;
  content: string | null;
  category: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateIdeaRequest {
  title: string;
  content?: string;
  category?: string;
  tags?: string[];
  // Music-specific fields
  key?: string;
  bpm?: number;
  mood?: string;
}

export interface UpdateIdeaRequest {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  is_pinned?: boolean;
}

interface IdeasListResponse {
  data: {
    ideas: Idea[];
  };
}

interface IdeaResponse {
  data: Idea;
}

interface DeleteResponse {
  data: { success: boolean };
}

// ============================================
// API Functions
// ============================================

/**
 * List all ideas (sorted by pinned, then date)
 */
export async function getIdeas(): Promise<Idea[]> {
  const response = await apiGet<IdeasListResponse>('/api/ideas');
  return response.data.ideas;
}

/**
 * Get a single idea by ID
 */
export async function getIdea(id: string): Promise<Idea> {
  const response = await apiGet<IdeaResponse>(`/api/ideas/${id}`);
  return response.data;
}

/**
 * Create a new idea
 */
export async function createIdea(idea: CreateIdeaRequest): Promise<Idea> {
  const response = await apiPost<IdeaResponse>('/api/ideas', idea);
  return response.data;
}

/**
 * Update an existing idea
 */
export async function updateIdea(
  id: string,
  updates: UpdateIdeaRequest
): Promise<Idea> {
  const response = await apiPut<IdeaResponse>(`/api/ideas/${id}`, updates);
  return response.data;
}

/**
 * Delete an idea
 */
export async function deleteIdea(id: string): Promise<boolean> {
  const response = await apiDelete<DeleteResponse>(`/api/ideas/${id}`);
  return response.data.success;
}

/**
 * Toggle pin status on an idea
 */
export async function togglePin(id: string, isPinned: boolean): Promise<Idea> {
  return updateIdea(id, { is_pinned: isPinned });
}

/**
 * Create a quick music idea
 */
export async function createMusicIdea(options: {
  title: string;
  key?: string;
  bpm?: number;
  mood?: string;
  content?: string;
}): Promise<Idea> {
  return createIdea({
    title: options.title,
    content: options.content,
    category: 'music',
    key: options.key,
    bpm: options.bpm,
    mood: options.mood,
  });
}
