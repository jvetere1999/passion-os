// API client for user references
import { API_BASE_URL } from './index';

export interface UserReference {
  id: string;
  title: string;
  content?: string;
  url?: string;
  category?: string;
  tags?: string[];
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferencesListResponse {
  items: UserReference[];
  total: number;
  page: number;
  page_size: number;
}

export async function listReferences(
  page: number = 1,
  pageSize: number = 50,
  category?: string
): Promise<ReferencesListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('page_size', pageSize.toString());
  if (category) params.append('category', category);

  const response = await fetch(`${API_BASE_URL}/api/references?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to list references: ${response.status}`);
  }

  const data = await response.json() as { data: ReferencesListResponse };
  return data.data;
}

export async function getReference(id: string): Promise<UserReference> {
  const response = await fetch(`${API_BASE_URL}/api/references/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to get reference: ${response.status}`);
  }

  const data = await response.json() as { data: UserReference };
  return data.data;
}

export async function createReference(
  title: string,
  content?: string,
  url?: string,
  category?: string,
  tags?: string[]
): Promise<UserReference> {
  const response = await fetch(`${API_BASE_URL}/api/references`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, url, category, tags }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create reference: ${response.status}`);
  }

  const data = await response.json() as { data: UserReference };
  return data.data;
}

export async function updateReference(
  id: string,
  updates: {
    title?: string;
    content?: string;
    url?: string;
    category?: string;
    tags?: string[];
    is_pinned?: boolean;
    is_archived?: boolean;
  }
): Promise<UserReference> {
  const response = await fetch(`${API_BASE_URL}/api/references/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update reference: ${response.status}`);
  }

  const data = await response.json() as { data: UserReference };
  return data.data;
}

export async function deleteReference(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/references/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete reference: ${response.status}`);
  }
}
