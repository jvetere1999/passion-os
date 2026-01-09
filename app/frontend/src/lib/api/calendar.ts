/**
 * Calendar API
 *
 * API client methods for calendar events.
 * All calls go through the backend at api.ecent.online.
 *
 * Wave 4: Calendar routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

// ============================================
// Types
// ============================================

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  timezone: string | null;
  location: string | null;
  color: string | null;
  reminder_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  event_type?: string;
  start_time: string;
  end_time?: string;
  all_day?: boolean;
  timezone?: string;
  location?: string;
  workout_id?: string;
  habit_id?: string;
  goal_id?: string;
  recurrence_rule?: string;
  recurrence_end?: string;
  color?: string;
  reminder_minutes?: number;
}

export interface UpdateCalendarEventRequest {
  title?: string;
  description?: string;
  event_type?: string;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  timezone?: string;
  location?: string;
  color?: string;
  reminder_minutes?: number;
}

interface EventsListResponse {
  data: {
    events: CalendarEvent[];
  };
}

interface EventResponse {
  data: CalendarEvent;
}

interface DeleteResponse {
  data: { success: boolean };
}

// ============================================
// API Functions
// ============================================

/**
 * List all calendar events
 */
export async function getEvents(options?: {
  startDate?: string;
  endDate?: string;
}): Promise<CalendarEvent[]> {
  let path = '/api/calendar';
  if (options?.startDate && options?.endDate) {
    path += `?start_date=${encodeURIComponent(options.startDate)}&end_date=${encodeURIComponent(options.endDate)}`;
  }
  const response = await apiGet<EventsListResponse>(path);
  return response.data.events;
}

/**
 * Get events in a date range
 */
export async function getEventsInRange(
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  return getEvents({ startDate, endDate });
}

/**
 * Get a single event by ID
 */
export async function getEvent(id: string): Promise<CalendarEvent> {
  const response = await apiGet<EventResponse>(`/api/calendar/${id}`);
  return response.data;
}

/**
 * Create a new calendar event
 */
export async function createEvent(
  event: CreateCalendarEventRequest
): Promise<CalendarEvent> {
  const response = await apiPost<EventResponse>('/api/calendar', event);
  return response.data;
}

/**
 * Update an existing event
 */
export async function updateEvent(
  id: string,
  updates: UpdateCalendarEventRequest
): Promise<CalendarEvent> {
  const response = await apiPut<EventResponse>(`/api/calendar/${id}`, updates);
  return response.data;
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string): Promise<boolean> {
  const response = await apiDelete<DeleteResponse>(`/api/calendar/${id}`);
  return response.data.success;
}
