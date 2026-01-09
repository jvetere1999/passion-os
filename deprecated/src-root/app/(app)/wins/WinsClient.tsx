"use client";

/**
 * Wins Client Component
 *
 * Shows auto-logged wins:
 * - First action of the day
 * - Completed focus sessions
 * - Completed quests
 *
 * No streaks. No comparisons. Just proof that you started.
 */

import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";

interface Win {
  id: string;
  type: "first_action" | "focus_complete" | "quest_complete" | "workout" | "reading";
  title: string;
  description: string;
  timestamp: string;
  date: string;
}

interface WinsClientProps {
  userId: string;
}

interface FocusItem {
  id: string;
  status: string;
  ended_at: string;
  actual_duration: number;
}

interface FocusResponse {
  items?: FocusItem[];
}

export function WinsClient({ userId: _userId }: WinsClientProps) {
  const [wins, setWins] = useState<Win[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today" | "week">("today");

  const fetchWins = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch activity events that count as wins
      const response = await fetch(`/api/focus?stats=true&period=week`);
      if (response.ok) {
        const data = await response.json() as FocusResponse;

        // Transform focus completions into wins
        const focusWins: Win[] = [];
        if (data.items) {
          data.items
            .filter((item) => item.status === "completed")
            .slice(0, 20)
            .forEach((item) => {
              focusWins.push({
                id: item.id,
                type: "focus_complete",
                title: "Focus session completed",
                description: `${Math.round((item.actual_duration || 0) / 60)} minutes of focused work`,
                timestamp: item.ended_at,
                date: new Date(item.ended_at).toLocaleDateString(),
              });
            });
        }

        // Sort by most recent
        focusWins.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setWins(focusWins);
      }
    } catch (error) {
      console.error("Failed to fetch wins:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWins();
  }, [fetchWins]);

  const filteredWins = wins.filter((win) => {
    const winDate = new Date(win.timestamp);
    const now = new Date();

    if (filter === "today") {
      return winDate.toDateString() === now.toDateString();
    } else if (filter === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return winDate >= weekAgo;
    }
    return true;
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  const getWinIcon = (type: Win["type"]) => {
    switch (type) {
      case "first_action":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case "focus_complete":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        );
      case "quest_complete":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 12 2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        );
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Wins</h1>
        <p className={styles.subtitle}>Proof that you started.</p>
      </header>

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === "today" ? styles.active : ""}`}
          onClick={() => setFilter("today")}
        >
          Today
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "week" ? styles.active : ""}`}
          onClick={() => setFilter("week")}
        >
          This Week
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
      </div>

      <main className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>Loading wins...</div>
        ) : filteredWins.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <h3>No wins yet {filter === "today" ? "today" : filter === "week" ? "this week" : ""}</h3>
            <p>Start something small. That counts.</p>
          </div>
        ) : (
          <ul className={styles.winsList}>
            {filteredWins.map((win) => (
              <li key={win.id} className={styles.winItem}>
                <div className={styles.winIcon}>{getWinIcon(win.type)}</div>
                <div className={styles.winContent}>
                  <h3 className={styles.winTitle}>{win.title}</h3>
                  <p className={styles.winDescription}>{win.description}</p>
                </div>
                <div className={styles.winTime}>{formatTime(win.timestamp)}</div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

