"use client";

/**
 * Mobile Progress Screen
 */

import styles from "./MobileProgress.module.css";

interface MobileProgressProps {
  userId: string;
}

export function MobileProgress({ userId }: MobileProgressProps) {
  void userId;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>Progress</h1>
      </header>

      {/* Level Card */}
      <div className={styles.levelCard}>
        <div className={styles.levelInfo}>
          <span className={styles.levelLabel}>Level</span>
          <span className={styles.levelNumber}>1</span>
        </div>
        <div className={styles.xpInfo}>
          <div className={styles.xpBar}>
            <div className={styles.xpFill} style={{ width: "25%" }} />
          </div>
          <span className={styles.xpText}>250 / 1000 XP</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>0</span>
          <span className={styles.statLabel}>Focus Hours</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>0</span>
          <span className={styles.statLabel}>Quests Done</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>0</span>
          <span className={styles.statLabel}>Day Streak</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>0</span>
          <span className={styles.statLabel}>Coins</span>
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

