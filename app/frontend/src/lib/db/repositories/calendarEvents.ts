/**
 * Calendar Events Repository
 * CRUD operations for calendar events in D1
 */

import type { D1Database } from "@cloudflare/workers-types";
import type {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from "../types";

/**
 * Get all calendar events for a user
 */
export async function getCalendarEvents(
  db: D1Database,
  userId: string
): Promise<CalendarEvent[]> {
  const result = await db
    .prepare(
      `SELECT * FROM calendar_events WHERE user_id = ? ORDER BY start_time ASC`
    )
    .bind(userId)
    .all<CalendarEvent>();

  return result.results;
}

/**
 * Get calendar events within a date range
 */
export async function getCalendarEventsInRange(
  db: D1Database,
  userId: string,
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  const result = await db
    .prepare(
      `SELECT * FROM calendar_events 
       WHERE user_id = ? 
       AND start_time >= ? 
       AND start_time <= ?
       ORDER BY start_time ASC`
    )
    .bind(userId, startDate, endDate)
    .all<CalendarEvent>();

  return result.results;
}

/**
 * Get a single calendar event by ID
 */
export async function getCalendarEventById(
  db: D1Database,
  id: string,
  userId: string
): Promise<CalendarEvent | null> {
  const result = await db
    .prepare(`SELECT * FROM calendar_events WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .first<CalendarEvent>();

  return result;
}

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(
  db: D1Database,
  input: CreateCalendarEventInput
): Promise<CalendarEvent> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO calendar_events (
        id, user_id, title, description, event_type,
        start_time, end_time, all_day, location,
        recurrence_rule, recurrence_end, parent_event_id,
        workout_id, color, reminder_minutes, metadata,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.user_id,
      input.title,
      input.description || null,
      input.event_type,
      input.start_time,
      input.end_time,
      input.all_day ? 1 : 0,
      input.location || null,
      input.recurrence_rule || null,
      input.recurrence_end || null,
      input.parent_event_id || null,
      input.workout_id || null,
      input.color || null,
      input.reminder_minutes || null,
      input.metadata || null,
      now,
      now
    )
    .run();

  const event = await getCalendarEventById(db, id, input.user_id);
  if (!event) {
    throw new Error("Failed to create calendar event");
  }

  return event;
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  db: D1Database,
  id: string,
  userId: string,
  input: UpdateCalendarEventInput
): Promise<CalendarEvent | null> {
  const existing = await getCalendarEventById(db, id, userId);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE calendar_events SET
        title = ?,
        description = ?,
        event_type = ?,
        start_time = ?,
        end_time = ?,
        all_day = ?,
        location = ?,
        recurrence_rule = ?,
        recurrence_end = ?,
        workout_id = ?,
        color = ?,
        reminder_minutes = ?,
        metadata = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?`
    )
    .bind(
      input.title ?? existing.title,
      input.description ?? existing.description,
      input.event_type ?? existing.event_type,
      input.start_time ?? existing.start_time,
      input.end_time ?? existing.end_time,
      input.all_day !== undefined ? (input.all_day ? 1 : 0) : existing.all_day,
      input.location ?? existing.location,
      input.recurrence_rule ?? existing.recurrence_rule,
      input.recurrence_end ?? existing.recurrence_end,
      input.workout_id ?? existing.workout_id,
      input.color ?? existing.color,
      input.reminder_minutes ?? existing.reminder_minutes,
      input.metadata ?? existing.metadata,
      now,
      id,
      userId
    )
    .run();

  return getCalendarEventById(db, id, userId);
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  db: D1Database,
  id: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .prepare(`DELETE FROM calendar_events WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .run();

  return result.meta.changes > 0;
}

