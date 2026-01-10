// API client for user inbox
import { API_BASE_URL } from './index';

export interface InboxItem {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface InboxListResponse {
  items: InboxItem[];
  total: number;
  page: number;
  page_size: number;
}

export async function listInboxItems(page: number = 1, pageSize: number = 50): Promise<InboxListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/user/inbox?page=${page}&page_size=${pageSize}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to list inbox items: ${response.status}`);
  }

  const data = await response.json() as { data: InboxListResponse };
  return data.data;
}

export async function getInboxItem(id: string): Promise<InboxItem> {
  const response = await fetch(`${API_BASE_URL}/api/user/inbox/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to get inbox item: ${response.status}`);
  }

  const data = await response.json() as { data: InboxItem };
  return data.data;
}

export async function createInboxItem(
  title: string,
  description?: string,
  tags?: string[]
): Promise<InboxItem> {
  const response = await fetch(`${API_BASE_URL}/api/user/inbox`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, tags }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create inbox item: ${response.status}`);
  }

  const data = await response.json() as { data: InboxItem };
  return data.data;
}

export async function updateInboxItem(
  id: string,
  updates: {
    title?: string;
    description?: string;
    tags?: string[];
  }
): Promise<InboxItem> {
  const response = await fetch(`${API_BASE_URL}/api/user/inbox/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update inbox item: ${response.status}`);
  }

  const data = await response.json() as { data: InboxItem };
  return data.data;
}

export async function deleteInboxItem(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/user/inbox/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete inbox item: ${response.status}`);
  }
}
