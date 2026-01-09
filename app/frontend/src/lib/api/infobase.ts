/**
 * Infobase API
 *
 * API client methods for knowledge base entries.
 * All calls go through the backend at api.ecent.online.
 *
 * Wave 4: Infobase routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

// ============================================
// Types
// ============================================

export interface InfobaseEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateInfobaseEntryRequest {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}

export interface UpdateInfobaseEntryRequest {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
}

interface EntriesListResponse {
  data: {
    entries: InfobaseEntry[];
  };
}

interface EntryResponse {
  data: InfobaseEntry;
}

interface DeleteResponse {
  data: { success: boolean };
}

// ============================================
// API Functions
// ============================================

/**
 * List all infobase entries with optional filtering
 */
export async function getEntries(options?: {
  category?: string;
  search?: string;
}): Promise<InfobaseEntry[]> {
  let path = '/api/infobase';
  const params = new URLSearchParams();
  if (options?.category) params.set('category', options.category);
  if (options?.search) params.set('search', options.search);
  if (params.toString()) path += `?${params.toString()}`;

  const response = await apiGet<EntriesListResponse>(path);
  return response.data.entries;
}

/**
 * Get a single entry by ID
 */
export async function getEntry(id: string): Promise<InfobaseEntry> {
  const response = await apiGet<EntryResponse>(`/api/infobase/${id}`);
  return response.data;
}

/**
 * Create a new infobase entry
 */
export async function createEntry(
  entry: CreateInfobaseEntryRequest
): Promise<InfobaseEntry> {
  const response = await apiPost<EntryResponse>('/api/infobase', entry);
  return response.data;
}

/**
 * Update an existing entry
 */
export async function updateEntry(
  id: string,
  updates: UpdateInfobaseEntryRequest
): Promise<InfobaseEntry> {
  const response = await apiPut<EntryResponse>(`/api/infobase/${id}`, updates);
  return response.data;
}

/**
 * Delete an entry
 */
export async function deleteEntry(id: string): Promise<boolean> {
  const response = await apiDelete<DeleteResponse>(`/api/infobase/${id}`);
  return response.data.success;
}

/**
 * Search entries by text
 */
export async function searchEntries(query: string): Promise<InfobaseEntry[]> {
  return getEntries({ search: query });
}

/**
 * Get entries by category
 */
export async function getEntriesByCategory(category: string): Promise<InfobaseEntry[]> {
  return getEntries({ category });
}
