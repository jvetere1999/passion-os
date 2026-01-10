// API client for focus libraries
import { API_BASE_URL } from './index';

export interface FocusLibrary {
  id: string;
  name: string;
  description?: string;
  library_type: string;
  tracks_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface FocusLibrariesListResponse {
  libraries: FocusLibrary[];
  total: number;
  page: number;
  page_size: number;
}

export async function listFocusLibraries(page: number = 1, pageSize: number = 50): Promise<FocusLibrariesListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/focus/libraries?page=${page}&page_size=${pageSize}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to list focus libraries: ${response.status}`);
  }

  const data = await response.json() as { data: FocusLibrariesListResponse };
  return data.data;
}

export async function getFocusLibrary(id: string): Promise<FocusLibrary> {
  const response = await fetch(`${API_BASE_URL}/api/focus/libraries/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to get focus library: ${response.status}`);
  }

  const data = await response.json() as { data: FocusLibrary };
  return data.data;
}

export async function createFocusLibrary(
  name: string,
  description?: string,
  libraryType: string = 'custom'
): Promise<FocusLibrary> {
  const response = await fetch(`${API_BASE_URL}/api/focus/libraries`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, library_type: libraryType }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create focus library: ${response.status}`);
  }

  const data = await response.json() as { data: FocusLibrary };
  return data.data;
}

export async function deleteFocusLibrary(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/focus/libraries/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete focus library: ${response.status}`);
  }
}

export async function toggleFocusLibraryFavorite(id: string): Promise<FocusLibrary> {
  const response = await fetch(`${API_BASE_URL}/api/focus/libraries/${id}/favorite`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle library favorite: ${response.status}`);
  }

  const data = await response.json() as { data: FocusLibrary };
  return data.data;
}
