/**
 * Books API
 *
 * API client methods for book tracking and reading sessions.
 * All calls go through the backend at api.ecent.online.
 *
 * PARITY-034: Books routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

// ============================================
// Types
// ============================================

export type BookStatus = 'want_to_read' | 'reading' | 'completed' | 'abandoned';

export interface Book {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  cover_url: string | null;
  total_pages: number | null;
  current_page: number;
  status: BookStatus;
  started_at: string | null;
  finished_at: string | null;
  rating: number | null;
  notes: string | null;
  tags: string[];
  created_at: string;
}

export interface ReadingSession {
  id: string;
  book_id: string;
  pages_read: number;
  duration_minutes: number | null;
  notes: string | null;
  logged_at: string;
}

export interface ReadingStats {
  total_books: number;
  books_completed: number;
  books_reading: number;
  total_pages_read: number;
  reading_sessions: number;
  total_reading_minutes: number;
  current_streak_days: number;
}

// Request types
export interface CreateBookRequest {
  title: string;
  author?: string;
  isbn?: string;
  cover_url?: string;
  total_pages?: number;
  status?: BookStatus;
  tags?: string[];
}

export interface UpdateBookRequest {
  title?: string;
  author?: string;
  isbn?: string;
  cover_url?: string;
  total_pages?: number;
  current_page?: number;
  status?: BookStatus;
  rating?: number;
  notes?: string;
  tags?: string[];
}

export interface LogReadingRequest {
  pages_read: number;
  duration_minutes?: number;
  notes?: string;
}

// Response wrappers
interface DataWrapper<T> {
  data: T;
}

interface BooksResponse {
  books: Book[];
  total: number;
}

interface SessionsResponse {
  sessions: ReadingSession[];
  total: number;
}

interface LogReadingResult {
  session_id: string;
  pages_read: number;
  new_page: number;
  book_completed: boolean;
  xp_awarded: number;
  coins_awarded: number;
}

// ============================================
// Book API
// ============================================

/** List all books */
export async function listBooks(status?: BookStatus): Promise<Book[]> {
  const path = status ? `/api/books?status=${status}` : '/api/books';
  const response = await apiGet<DataWrapper<BooksResponse>>(path);
  return response.data.books;
}

/** Get book by ID */
export async function getBook(id: string): Promise<Book> {
  const response = await apiGet<DataWrapper<Book>>(`/api/books/${id}`);
  return response.data;
}

/** Create a new book */
export async function createBook(data: CreateBookRequest): Promise<Book> {
  const response = await apiPost<DataWrapper<Book>>('/api/books', data);
  return response.data;
}

/** Update a book */
export async function updateBook(id: string, data: UpdateBookRequest): Promise<Book> {
  const response = await apiPut<DataWrapper<Book>>(`/api/books/${id}`, data);
  return response.data;
}

/** Delete a book */
export async function deleteBook(id: string): Promise<void> {
  await apiDelete<DataWrapper<{ deleted: boolean }>>(`/api/books/${id}`);
}

/** Get reading stats */
export async function getReadingStats(): Promise<ReadingStats> {
  const response = await apiGet<DataWrapper<ReadingStats>>('/api/books/stats');
  return response.data;
}

// ============================================
// Reading Session API
// ============================================

/** List reading sessions for a book */
export async function listReadingSessions(bookId: string): Promise<ReadingSession[]> {
  const response = await apiGet<DataWrapper<SessionsResponse>>(`/api/books/${bookId}/sessions`);
  return response.data.sessions;
}

/** Log a reading session */
export async function logReading(bookId: string, data: LogReadingRequest): Promise<LogReadingResult> {
  const response = await apiPost<DataWrapper<LogReadingResult>>(`/api/books/${bookId}/sessions`, data);
  return response.data;
}
