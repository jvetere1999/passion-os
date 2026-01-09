"use client";

/**
 * Mobile Progress Screen
 *
 * API: Uses backend at api.ecent.online via @ignition/api-client
 */

import { useState, useEffect } from "react";
import { getGamificationSummary, type GamificationSummary } from "@/lib/api/gamification";
import styles from "./MobileProgress.module.css";

interface MobileProgressProps {
  userId: string;
}

export function MobileProgress({ userId }: MobileProgressProps) {
  void userId;

  const [stats, setStats] = useState<GamificationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const summary = await getGamificationSummary();
        setStats(summary);
      } catch (e) {
        console.error("Failed to load gamification stats:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <h1>Progress</h1>
        </header>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const level = stats?.current_level ?? 1;
  const totalXp = Number(stats?.total_xp ?? 0);
  const xpToNext = stats?.xp_to_next_level ?? 100;
  const xpPercent = stats?.xp_progress_percent ?? 0;
  const coins = Number(stats?.coins ?? 0);
  const streak = stats?.current_streak ?? 0;
  const achievements = stats?.achievement_count ?? 0;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>Progress</h1>
      </header>

      {/* Level Card */}
      <div className={styles.levelCard} data-testid="mobile-level-card">
        <div className={styles.levelInfo}>
          <span className={styles.levelLabel}>Level</span>
          <span className={styles.levelNumber} data-testid="mobile-level">{level}</span>
        </div>
        <div className={styles.xpInfo}>
          <div className={styles.xpBar}>
            <div className={styles.xpFill} style={{ width: `${xpPercent}%` }} data-testid="mobile-xp-bar" />
          </div>
          <span className={styles.xpText}>{totalXp} / {xpToNext} XP</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid} data-testid="mobile-stats-grid">
        <div className={styles.statCard}>
          <span className={styles.statValue} data-testid="mobile-coins">{coins}</span>
          <span className={styles.statLabel}>Coins</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} data-testid="mobile-achievements">{achievements}</span>
          <span className={styles.statLabel}>Achievements</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} data-testid="mobile-streak">{streak}</span>
          <span className={styles.statLabel}>Day Streak</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalXp}</span>
          <span className={styles.statLabel}>Total XP</span>
        </div>
      </div>

      {/* Skills Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Skills</h2>
        <div className={styles.comingSoon}>
          <p>Skill tracking coming soon</p>
        </div>
      </section>

      {/* Activity Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        <div className={styles.comingSoon}>
          <p>No recent activity</p>
        </div>
      </section>
    </div>
  );
}

