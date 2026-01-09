/**
 * Calendar Events API Route
 * CRUD operations for calendar events
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getCalendarEvents,
  getCalendarEventsInRange,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/db/repositories/calendarEvents";
import { ensureUserExists } from "@/lib/db/repositories/users";
import type { D1Database } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Force dynamic rendering
export const dynamic = "force-dynamic";

/**
 * Helper to get D1 database from Cloudflare context
 */
async function getDB(): Promise<D1Database | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as unknown as { DB?: D1Database }).DB ?? null;
  } catch {
    // Fallback for environments where getCloudflareContext isn't available
    try {
      const env = (globalThis as unknown as { env?: { DB?: D1Database } }).env;
      return env?.DB ?? null;
    } catch {
      return null;
    }
  }
}

/**
 * GET /api/calendar
 * Get all calendar events for the authenticated user
 * Query params: startDate, endDate (optional, for range queries)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    console.log("[calendar] GET - session:", session?.user?.id ? "authenticated" : "no session");

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDB();
    console.log("[calendar] GET - db available:", !!db);

    if (!db) {
      // Return empty array if no database (local dev without D1)
      console.log("[calendar] GET - no DB, returning empty array");
      return NextResponse.json({ events: [] });
    }

    // Get the database user ID (may differ from session ID if using different OAuth providers)
    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let events;
    if (startDate && endDate) {
      events = await getCalendarEventsInRange(
        db,
        dbUser.id,
        startDate,
        endDate
      );
    } else {
      events = await getCalendarEvents(db, dbUser.id);
    }

    console.log("[calendar] GET - found events:", events.length);
    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET /api/calendar error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar
 * Create a new calendar event
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    console.log("[calendar] POST - session:", session?.user?.id ? "authenticated" : "no session");

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDB();
    console.log("[calendar] POST - db available:", !!db);

    if (!db) {
      console.log("[calendar] POST - no DB, returning 503");
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Ensure user exists in database (for JWT session users)
    console.log("[calendar] POST - ensuring user exists:", session.user.id);
    let dbUser;
    try {
      dbUser = await ensureUserExists(db, session.user.id, {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      });
      console.log("[calendar] POST - user ensured, using ID:", dbUser.id);
    } catch (userError) {
      console.error("[calendar] POST - failed to ensure user:", userError);
      return NextResponse.json(
        { error: `Failed to ensure user: ${userError instanceof Error ? userError.message : "Unknown"}` },
        { status: 500 }
      );
    }

    const body = await request.json() as {
      title?: string;
      description?: string;
      event_type?: string;
      start_time?: string;
      end_time?: string;
      all_day?: boolean;
      location?: string;
      recurrence_rule?: string;
      recurrence_end?: string;
      parent_event_id?: string;
      workout_id?: string;
      color?: string;
      reminder_minutes?: number;
      metadata?: string;
    };

    console.log("[calendar] POST - body:", JSON.stringify(body));

    // Validate required fields
    if (!body.title || !body.event_type || !body.start_time || !body.end_time) {
      console.log("[calendar] POST - missing required fields");
      return NextResponse.json(
        { error: `Missing required fields: title=${!!body.title}, event_type=${!!body.event_type}, start_time=${!!body.start_time}, end_time=${!!body.end_time}` },
        { status: 400 }
      );
    }

    console.log("[calendar] POST - creating event...");
    const event = await createCalendarEvent(db, {
      user_id: dbUser.id, // Use the database user ID, not session ID
      title: body.title,
      description: body.description || null,
      event_type: body.event_type as "meeting" | "appointment" | "workout" | "other",
      start_time: body.start_time,
      end_time: body.end_time,
      all_day: body.all_day ? 1 : 0,
      location: body.location || null,
      recurrence_rule: body.recurrence_rule || null,
      recurrence_end: body.recurrence_end || null,
      parent_event_id: body.parent_event_id || null,
      workout_id: body.workout_id || null,
      color: body.color || null,
      reminder_minutes: body.reminder_minutes || null,
      metadata: body.metadata || null,
    });

    console.log("[calendar] POST - event created:", event.id);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("POST /api/calendar error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create event: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/calendar
 * Update an existing calendar event
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDB();
    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Get the database user ID
    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    const body = await request.json() as {
      id?: string;
      title?: string;
      description?: string;
      event_type?: string;
      start_time?: string;
      end_time?: string;
      all_day?: boolean | number;
      location?: string;
      recurrence_rule?: string;
      recurrence_end?: string;
      workout_id?: string;
      color?: string;
      reminder_minutes?: number;
      metadata?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Event ID required" },
        { status: 400 }
      );
    }

    const event = await updateCalendarEvent(db, body.id, dbUser.id, {
      title: body.title,
      description: body.description,
      event_type: body.event_type as "meeting" | "appointment" | "workout" | "other" | undefined,
      start_time: body.start_time,
      end_time: body.end_time,
      all_day: body.all_day !== undefined ? (body.all_day ? 1 : 0) : undefined,
      location: body.location,
      recurrence_rule: body.recurrence_rule,
      recurrence_end: body.recurrence_end,
      workout_id: body.workout_id,
      color: body.color,
      reminder_minutes: body.reminder_minutes,
      metadata: body.metadata,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("PUT /api/calendar error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to update event: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar
 * Delete a calendar event
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDB();
    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Get the database user ID
    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Event ID required" },
        { status: 400 }
      );
    }

    const deleted = await deleteCalendarEvent(db, id, dbUser.id);

    if (!deleted) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/calendar error:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}

