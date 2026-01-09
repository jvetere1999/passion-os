/**
 * Books API
 * CRUD operations for book tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";
import { ensureUserExists } from "@/lib/db/repositories/users";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ books: [], sessions: [], stats: { booksThisYear: 0, pagesThisMonth: 0, currentStreak: 0, averageRating: 0 } });
    }

    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    // Get books
    const booksResult = await db
      .prepare(`SELECT * FROM books WHERE user_id = ? ORDER BY created_at DESC`)
      .bind(dbUser.id)
      .all();

    // Get recent sessions
    const sessionsResult = await db
      .prepare(`SELECT * FROM reading_sessions WHERE user_id = ? ORDER BY date DESC LIMIT 20`)
      .bind(dbUser.id)
      .all();

    // Calculate stats
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const booksThisYearResult = await db
      .prepare(`SELECT COUNT(*) as count FROM books WHERE user_id = ? AND status = 'completed' AND finished_at >= ?`)
      .bind(dbUser.id, yearStart)
      .first() as { count: number } | null;

    const pagesThisMonthResult = await db
      .prepare(`SELECT SUM(pages_read) as total FROM reading_sessions WHERE user_id = ? AND date >= ?`)
      .bind(dbUser.id, monthStart)
      .first() as { total: number | null } | null;

    const avgRatingResult = await db
      .prepare(`SELECT AVG(rating) as avg FROM books WHERE user_id = ? AND rating IS NOT NULL`)
      .bind(dbUser.id)
      .first() as { avg: number | null } | null;

    // Calculate streak (simple version)
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    const recentSessions = (sessionsResult.results || []) as Array<{ date: string }>;
    const sessionDates = new Set(recentSessions.map((s) => s.date.split("T")[0]));

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      if (sessionDates.has(checkDate) || (i === 0 && !sessionDates.has(today))) {
        if (sessionDates.has(checkDate)) streak++;
        else if (i === 0) continue; // Allow today to be missing
        else break;
      } else if (i > 0) {
        break;
      }
    }

    const books = (booksResult.results || []).map((row) => ({
      id: (row as Record<string, unknown>).id,
      title: (row as Record<string, unknown>).title,
      author: (row as Record<string, unknown>).author,
      totalPages: (row as Record<string, unknown>).total_pages,
      currentPage: (row as Record<string, unknown>).current_page,
      status: (row as Record<string, unknown>).status,
      rating: (row as Record<string, unknown>).rating,
      startedAt: (row as Record<string, unknown>).started_at,
      finishedAt: (row as Record<string, unknown>).finished_at,
      notes: (row as Record<string, unknown>).notes,
      coverUrl: (row as Record<string, unknown>).cover_url,
      genre: (row as Record<string, unknown>).genre,
      createdAt: (row as Record<string, unknown>).created_at,
    }));

    const sessions = (sessionsResult.results || []).map((row) => ({
      id: (row as Record<string, unknown>).id,
      bookId: (row as Record<string, unknown>).book_id,
      pagesRead: (row as Record<string, unknown>).pages_read,
      duration: (row as Record<string, unknown>).duration,
      notes: (row as Record<string, unknown>).notes,
      date: (row as Record<string, unknown>).date,
    }));

    return NextResponse.json({
      books,
      sessions,
      stats: {
        booksThisYear: booksThisYearResult?.count || 0,
        pagesThisMonth: pagesThisMonthResult?.total || 0,
        currentStreak: streak,
        averageRating: avgRatingResult?.avg || 0,
      },
    });
  } catch (error) {
    console.error("GET /api/books error:", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    const body = await request.json() as {
      action: string;
      title?: string;
      author?: string;
      totalPages?: number;
      genre?: string;
      notes?: string;
      status?: string;
      bookId?: string;
      pagesRead?: number;
      duration?: number;
      rating?: number;
    };
    const now = new Date().toISOString();

    if (body.action === "add_book") {
      const id = `book_${Date.now()}`;
      await db
        .prepare(`INSERT INTO books (id, user_id, title, author, total_pages, current_page, status, genre, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`)
        .bind(id, dbUser.id, body.title, body.author || "", body.totalPages || 0, body.status || "want-to-read", body.genre || "Other", body.notes || "", now, now)
        .run();
      return NextResponse.json({ success: true, id });
    }

    if (body.action === "start_reading") {
      await db
        .prepare(`UPDATE books SET status = 'reading', started_at = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
        .bind(now, now, body.bookId, dbUser.id)
        .run();
      return NextResponse.json({ success: true });
    }

    if (body.action === "log_session") {
      const sessionId = `session_${Date.now()}`;

      // Insert session
      await db
        .prepare(`INSERT INTO reading_sessions (id, user_id, book_id, pages_read, duration, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(sessionId, dbUser.id, body.bookId, body.pagesRead, body.duration || 0, body.notes || "", now)
        .run();

      // Update book progress
      await db
        .prepare(`UPDATE books SET current_page = current_page + ?, updated_at = ? WHERE id = ? AND user_id = ?`)
        .bind(body.pagesRead, now, body.bookId, dbUser.id)
        .run();

      return NextResponse.json({ success: true, sessionId });
    }

    if (body.action === "complete_book") {
      await db
        .prepare(`UPDATE books SET status = 'completed', rating = ?, finished_at = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
        .bind(body.rating, now, now, body.bookId, dbUser.id)
        .run();

      // Also update current_page to total_pages
      await db
        .prepare(`UPDATE books SET current_page = total_pages WHERE id = ? AND user_id = ?`)
        .bind(body.bookId, dbUser.id)
        .run();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/books error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    const body = await request.json() as { bookId: string };

    // Delete sessions first
    await db
      .prepare(`DELETE FROM reading_sessions WHERE book_id = ? AND user_id = ?`)
      .bind(body.bookId, dbUser.id)
      .run();

    // Delete book
    await db
      .prepare(`DELETE FROM books WHERE id = ? AND user_id = ?`)
      .bind(body.bookId, dbUser.id)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/books error:", error);
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}

