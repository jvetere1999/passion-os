"use client";

/**
 * Progress Client Component
 * Displays user stats with Persona 5 style skill wheel
 *
 * Auto-refresh: Refetches on focus after 1 minute staleness (per SYNC.md)
 *
 * API: Uses backend at api.ecent.online via @ignition/api-client
 */

import { useState, useEffect, useCallback } from "react";
import { SkillWheel, DEFAULT_SKILLS, type Skill } from "@/components/progress";
import { useAutoRefresh } from "@/lib/hooks";
import { getGamificationSummary } from "@/lib/api/gamification";
import styles from "./page.module.css";

interface ProgressStats {
  totalXp: number;
  questsCompleted: number;
  focusHours: number;
  currentStreak: number;
  level: number;
  coins: number;
  xpToNextLevel: number;
  xpProgressPercent: number;
  achievementCount: number;
}

export function ProgressClient() {
  const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS);
  const [stats, setStats] = useState<ProgressStats>({
    totalXp: 0,
    questsCompleted: 0,
    focusHours: 0,
    currentStreak: 0,
    level: 1,
    coins: 0,
    xpToNextLevel: 100,
    xpProgressPercent: 0,
    achievementCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivities, _setRecentActivities] = useState<{ label: string; xp: number; skill: string }[]>([]);

  // Fetch gamification summary from backend
  const fetchGamificationData = useCallback(async () => {
    try {
      const summary = await getGamificationSummary();
      setStats((prev) => ({
        ...prev,
        totalXp: Number(summary.total_xp),
        level: summary.current_level,
        currentStreak: summary.current_streak,
        coins: Number(summary.coins),
        xpToNextLevel: summary.xp_to_next_level,
        xpProgressPercent: summary.xp_progress_percent,
        achievementCount: summary.achievement_count,
      }));
    } catch (e) {
      console.error("Failed to fetch gamification data:", e);
    }
  }, []);

  // Load skills from backend (future: will be from /api/user/skills on backend)
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch gamification summary
        await fetchGamificationData();

        // Try to fetch skills from legacy endpoint (TODO: migrate to backend)
        try {
          const response = await fetch("/api/user/skills");
          if (response.ok) {
            const data = await response.json() as { skills?: Skill[] };
            if (data.skills && data.skills.length > 0) {
              setSkills(data.skills);
            }
          }
        } catch (e) {
          console.error("Failed to fetch skills:", e);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [fetchGamificationData]);

  // Auto-refresh: refetch on focus after 1 minute staleness (per SYNC.md)
  useAutoRefresh({
    onRefresh: fetchGamificationData,
    refreshKey: "progress",
    stalenessMs: 60000, // 1 minute per SYNC.md contract
    refreshOnMount: true,
    refetchOnFocus: true,
    refetchOnVisible: true,
    enabled: !isLoading,
  });

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading progress...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Progress</h1>
        <p className={styles.subtitle}>
          Track your growth and unlock your potential.
        </p>
      </header>

      {/* Level Progress Bar */}
      <div className={styles.levelSection} data-testid="level-section">
        <div className={styles.levelInfo}>
          <span className={styles.levelLabel}>Level {stats.level}</span>
          <span className={styles.xpLabel}>{stats.totalXp} / {stats.xpToNextLevel} XP</span>
        </div>
        <div className={styles.levelProgress}>
          <div
            className={styles.levelProgressFill}
            style={{ width: `${stats.xpProgressPercent}%` }}
            data-testid="xp-progress-bar"
          />
        </div>
      </div>

      {/* Skill Wheel */}
      <div className={styles.wheelSection}>
        <SkillWheel skills={skills} size={360} />
      </div>

      {/* Quick Stats */}
      <div className={styles.statsGrid} data-testid="stats-grid">
        <div className={styles.statCard} data-testid="stat-xp">
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Total XP</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.statIcon}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <span className={styles.statValue} data-testid="total-xp">{stats.totalXp.toLocaleString()}</span>
          <span className={styles.statChange}>Level {stats.level}</span>
        </div>

        <div className={styles.statCard} data-testid="stat-coins">
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Coins</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.statIcon}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v12M9 9h6M9 15h6" />
            </svg>
          </div>
          <span className={styles.statValue} data-testid="total-coins">{stats.coins.toLocaleString()}</span>
          <span className={styles.statChange}>{stats.coins === 0 ? "Earn coins" : "Available"}</span>
        </div>

        <div className={styles.statCard} data-testid="stat-streak">
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Current Streak</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.statIcon}>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className={styles.statValue} data-testid="current-streak">{stats.currentStreak}</span>
          <span className={styles.statChange}>{stats.currentStreak === 0 ? "Start a streak" : "days"}</span>
        </div>

        <div className={styles.statCard} data-testid="stat-achievements">
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Achievements</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.statIcon}>
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
          <span className={styles.statValue} data-testid="achievement-count">{stats.achievementCount}</span>
          <span className={styles.statChange}>{stats.achievementCount === 0 ? "Unlock achievements" : "Unlocked"}</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.activitySection}>
        <div className={styles.activityHeader}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
        </div>

        {recentActivities.length === 0 ? (
          <div className={styles.emptyActivity}>
            <p>Complete quests, focus sessions, and activities to earn XP!</p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {recentActivities.map((activity, i) => (
              <div key={i} className={styles.activityItem}>
                <span className={styles.activityLabel}>{activity.label}</span>
                <span className={styles.activityXp}>+{activity.xp} XP</span>
                <span className={styles.activitySkill}>{activity.skill}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

