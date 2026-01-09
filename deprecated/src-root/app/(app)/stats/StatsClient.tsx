"use client";

/**
 * Stats Client Component
 *
 * Read-only statistics:
 * - Time spent
 * - Sessions completed
 * - Interests engaged
 *
 * No goals. No targets. No charts that scream at you.
 */

import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";

interface Stats {
  focusSessions: number;
  totalFocusTime: number;
  questsCompleted: number;
  booksRead: number;
  workoutsLogged: number;
  daysActive: number;
}

interface StatsClientProps {
  userId: string;
}

interface FocusStatsResponse {
  completedSessions?: number;
  totalFocusTime?: number;
}

export function StatsClient({ userId: _userId }: StatsClientProps) {
  const [stats, setStats] = useState<Stats>({
    focusSessions: 0,
    totalFocusTime: 0,
    questsCompleted: 0,
    booksRead: 0,
    workoutsLogged: 0,
    daysActive: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch focus stats
      const focusResponse = await fetch(`/api/focus?stats=true&period=${period}`);
      if (focusResponse.ok) {
        const focusData = await focusResponse.json() as FocusStatsResponse;
        setStats((prev) => ({
          ...prev,
          focusSessions: focusData.completedSessions || 0,
          totalFocusTime: focusData.totalFocusTime || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const statCards = [
    {
      label: "Focus Sessions",
      value: stats.focusSessions,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
    },
    {
      label: "Time Focused",
      value: formatDuration(stats.totalFocusTime),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "Quests Done",
      value: stats.questsCompleted,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 12 2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
    },
    {
      label: "Days Active",
      value: stats.daysActive || "-",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Stats</h1>
        <p className={styles.subtitle}>A quiet look at your activity.</p>
      </header>

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${period === "week" ? styles.active : ""}`}
          onClick={() => setPeriod("week")}
        >
          This Week
        </button>
        <button
          className={`${styles.filterBtn} ${period === "month" ? styles.active : ""}`}
          onClick={() => setPeriod("month")}
        >
          This Month
        </button>
        <button
          className={`${styles.filterBtn} ${period === "all" ? styles.active : ""}`}
          onClick={() => setPeriod("all")}
        >
          All Time
        </button>
      </div>

      <main className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>Loading stats...</div>
        ) : (
          <div className={styles.grid}>
            {statCards.map((card) => (
              <div key={card.label} className={styles.statCard}>
                <div className={styles.statIcon}>{card.icon}</div>
                <div className={styles.statValue}>{card.value}</div>
                <div className={styles.statLabel}>{card.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.note}>
          <p>These are just numbers. They don&apos;t define you.</p>
        </div>
      </main>
    </div>
  );
}

