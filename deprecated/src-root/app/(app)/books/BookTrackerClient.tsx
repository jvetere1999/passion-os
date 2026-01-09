"use client";

/**
 * Book Tracker Client Component
 * Track reading progress, log books, and build reading habits
 *
 * Auto-refresh: Refetches on focus after 2 minutes staleness (per SYNC.md)
 */

import { useState, useEffect, useCallback } from "react";
import { useAutoRefresh } from "@/lib/hooks";
import styles from "./page.module.css";

interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: "reading" | "completed" | "want-to-read" | "dnf";
  rating: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  notes: string;
  coverUrl: string | null;
  genre: string;
  createdAt: string;
}

interface ReadingSession {
  id: string;
  bookId: string;
  pagesRead: number;
  duration: number; // minutes
  notes: string;
  date: string;
}

interface ReadingStats {
  booksThisYear: number;
  pagesThisMonth: number;
  currentStreak: number;
  averageRating: number;
}

const GENRES = [
  "Fiction",
  "Non-Fiction",
  "Fantasy",
  "Sci-Fi",
  "Mystery",
  "Romance",
  "Thriller",
  "Biography",
  "Self-Help",
  "Business",
  "History",
  "Science",
  "Philosophy",
  "Poetry",
  "Other",
];

export function BookTrackerClient() {
  const [books, setBooks] = useState<Book[]>([]);
  const [_sessions, setSessions] = useState<ReadingSession[]>([]);
  const [stats, setStats] = useState<ReadingStats>({
    booksThisYear: 0,
    pagesThisMonth: 0,
    currentStreak: 0,
    averageRating: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reading" | "completed" | "all" | "want">("reading");
  const [showAddBook, setShowAddBook] = useState(false);
  const [showLogSession, setShowLogSession] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Form state
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    totalPages: 0,
    genre: "Fiction",
    notes: "",
  });

  const [sessionLog, setSessionLog] = useState({
    bookId: "",
    pagesRead: 0,
    duration: 30,
    notes: "",
  });

  // Load data
  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/books");
      if (res.ok) {
        const data = await res.json() as { books: Book[]; sessions: ReadingSession[]; stats: ReadingStats };
        setBooks(data.books || []);
        setSessions(data.sessions || []);
        setStats(data.stats || { booksThisYear: 0, pagesThisMonth: 0, currentStreak: 0, averageRating: 0 });
      }
    } catch (error) {
      console.error("Failed to load books:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh: refetch on focus after 2 minute staleness (per SYNC.md)
  // Pauses on page unload, soft refreshes on reload if stale
  useAutoRefresh({
    onRefresh: loadData,
    refreshKey: "books",
    stalenessMs: 120000, // 2 minutes per SYNC.md contract
    refreshOnMount: true,
    refetchOnFocus: true,
    refetchOnVisible: true,
    enabled: !isLoading && !showAddBook && !showLogSession,
  });

  // Add book
  const handleAddBook = async () => {
    if (!newBook.title.trim()) return;

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_book",
          ...newBook,
          status: "want-to-read",
        }),
      });

      if (res.ok) {
        setShowAddBook(false);
        setNewBook({ title: "", author: "", totalPages: 0, genre: "Fiction", notes: "" });
        loadData();
      }
    } catch (error) {
      console.error("Failed to add book:", error);
    }
  };

  // Start reading a book
  const handleStartReading = async (bookId: string) => {
    try {
      await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_reading",
          bookId,
        }),
      });
      loadData();
    } catch (error) {
      console.error("Failed to start reading:", error);
    }
  };

  // Log reading session
  const handleLogSession = async () => {
    if (!sessionLog.bookId || sessionLog.pagesRead <= 0) return;

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_session",
          ...sessionLog,
        }),
      });

      if (res.ok) {
        setShowLogSession(false);
        setSessionLog({ bookId: "", pagesRead: 0, duration: 30, notes: "" });
        loadData();
      }
    } catch (error) {
      console.error("Failed to log session:", error);
    }
  };

  // Mark book as completed
  const handleCompleteBook = async (bookId: string, rating: number) => {
    try {
      await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_book",
          bookId,
          rating,
        }),
      });
      loadData();
    } catch (error) {
      console.error("Failed to complete book:", error);
    }
  };

  // Delete book
  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("Delete this book?")) return;

    try {
      await fetch("/api/books", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      loadData();
    } catch (error) {
      console.error("Failed to delete book:", error);
    }
  };

  // Filter books by tab
  const filteredBooks = books.filter((book) => {
    switch (activeTab) {
      case "reading":
        return book.status === "reading";
      case "completed":
        return book.status === "completed";
      case "want":
        return book.status === "want-to-read";
      default:
        return true;
    }
  });

  // Currently reading books for session logging
  const readingBooks = books.filter((b) => b.status === "reading");

  if (isLoading) {
    return <div className={styles.loading}>Loading your library...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.booksThisYear}</span>
          <span className={styles.statLabel}>Books This Year</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.pagesThisMonth}</span>
          <span className={styles.statLabel}>Pages This Month</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.currentStreak}</span>
          <span className={styles.statLabel}>Day Streak</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "-"}</span>
          <span className={styles.statLabel}>Avg Rating</span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.primaryButton} onClick={() => setShowAddBook(true)}>
          Add Book
        </button>
        {readingBooks.length > 0 && (
          <button className={styles.secondaryButton} onClick={() => setShowLogSession(true)}>
            Log Reading Session
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "reading" ? styles.active : ""}`}
          onClick={() => setActiveTab("reading")}
        >
          Currently Reading ({books.filter((b) => b.status === "reading").length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "completed" ? styles.active : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed ({books.filter((b) => b.status === "completed").length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "want" ? styles.active : ""}`}
          onClick={() => setActiveTab("want")}
        >
          Want to Read ({books.filter((b) => b.status === "want-to-read").length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "all" ? styles.active : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All ({books.length})
        </button>
      </div>

      {/* Book List */}
      <div className={styles.bookGrid}>
        {filteredBooks.map((book) => (
          <div key={book.id} className={styles.bookCard}>
            <div className={styles.bookCover}>
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} />
              ) : (
                <div className={styles.placeholderCover}>
                  <span>{book.title.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className={styles.bookInfo}>
              <h3 className={styles.bookTitle}>{book.title}</h3>
              <p className={styles.bookAuthor}>{book.author}</p>
              <span className={styles.bookGenre}>{book.genre}</span>

              {book.status === "reading" && (
                <div className={styles.progressSection}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${(book.currentPage / book.totalPages) * 100}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    {book.currentPage} / {book.totalPages} pages
                  </span>
                </div>
              )}

              {book.status === "completed" && book.rating && (
                <div className={styles.rating}>
                  {"*".repeat(book.rating)}{"*".repeat(5 - book.rating).split("").map(() => "-").join("")}
                </div>
              )}

              <div className={styles.bookActions}>
                {book.status === "want-to-read" && (
                  <button
                    className={styles.smallButton}
                    onClick={() => handleStartReading(book.id)}
                  >
                    Start Reading
                  </button>
                )}
                {book.status === "reading" && (
                  <>
                    <button
                      className={styles.smallButton}
                      onClick={() => {
                        setSessionLog({ ...sessionLog, bookId: book.id });
                        setShowLogSession(true);
                      }}
                    >
                      Log Progress
                    </button>
                    <button
                      className={styles.smallButton}
                      onClick={() => setSelectedBook(book)}
                    >
                      Finish
                    </button>
                  </>
                )}
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteBook(book.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredBooks.length === 0 && (
          <div className={styles.emptyState}>
            <p>No books in this category yet.</p>
            <button onClick={() => setShowAddBook(true)}>Add your first book</button>
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      {showAddBook && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Add New Book</h2>
            <div className={styles.form}>
              <input
                type="text"
                placeholder="Book title"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Author"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
              />
              <input
                type="number"
                placeholder="Total pages"
                value={newBook.totalPages || ""}
                onChange={(e) => setNewBook({ ...newBook, totalPages: parseInt(e.target.value) || 0 })}
              />
              <select
                value={newBook.genre}
                onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <textarea
                placeholder="Notes (optional)"
                value={newBook.notes}
                onChange={(e) => setNewBook({ ...newBook, notes: e.target.value })}
              />
              <div className={styles.modalActions}>
                <button onClick={() => setShowAddBook(false)}>Cancel</button>
                <button onClick={handleAddBook} disabled={!newBook.title.trim()}>
                  Add Book
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Session Modal */}
      {showLogSession && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Log Reading Session</h2>
            <div className={styles.form}>
              <select
                value={sessionLog.bookId}
                onChange={(e) => setSessionLog({ ...sessionLog, bookId: e.target.value })}
              >
                <option value="">Select a book</option>
                {readingBooks.map((book) => (
                  <option key={book.id} value={book.id}>{book.title}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Pages read"
                value={sessionLog.pagesRead || ""}
                onChange={(e) => setSessionLog({ ...sessionLog, pagesRead: parseInt(e.target.value) || 0 })}
              />
              <input
                type="number"
                placeholder="Duration (minutes)"
                value={sessionLog.duration || ""}
                onChange={(e) => setSessionLog({ ...sessionLog, duration: parseInt(e.target.value) || 0 })}
              />
              <textarea
                placeholder="Notes (optional)"
                value={sessionLog.notes}
                onChange={(e) => setSessionLog({ ...sessionLog, notes: e.target.value })}
              />
              <div className={styles.modalActions}>
                <button onClick={() => setShowLogSession(false)}>Cancel</button>
                <button
                  onClick={handleLogSession}
                  disabled={!sessionLog.bookId || sessionLog.pagesRead <= 0}
                >
                  Log Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Book Modal */}
      {selectedBook && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Finish &quot;{selectedBook.title}&quot;</h2>
            <p>How would you rate this book?</p>
            <div className={styles.ratingButtons}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  className={styles.ratingButton}
                  onClick={() => {
                    handleCompleteBook(selectedBook.id, rating);
                    setSelectedBook(null);
                  }}
                >
                  {rating} {"*".repeat(rating)}
                </button>
              ))}
            </div>
            <button onClick={() => setSelectedBook(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

