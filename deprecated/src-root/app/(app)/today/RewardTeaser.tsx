"use client";

/**
 * RewardTeaser Component
 * Shows progress toward next achievement on Today page
 *
 * API: Uses backend at api.ecent.online via @ignition/api-client
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAchievementTeaser, type AchievementTeaser } from "@/lib/api/gamification";
import styles from "./RewardTeaser.module.css";

export function RewardTeaser() {
  const [teaser, setTeaser] = useState<AchievementTeaser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTeaser() {
      try {
        const data = await getAchievementTeaser();
        setTeaser(data);
      } catch (error) {
        console.error("Failed to fetch reward teaser:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeaser();
  }, []);

  if (isLoading || !teaser) {
    return null;
  }

  const progressPercent = Math.min(100, (teaser.progress / teaser.progress_max) * 100);

  return (
    <Link href="/progress" className={styles.teaser}>
      <div className={styles.icon}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      </div>
      <div className={styles.content}>
        <span className={styles.label}>Next: {teaser.achievement.name}</span>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>
        <span className={styles.progressText}>{teaser.progress_label}</span>
      </div>
      <div className={styles.rewards}>
        {teaser.achievement.reward_coins > 0 && (
          <span className={styles.reward}>+{teaser.achievement.reward_coins} coins</span>
        )}
      </div>
    </Link>
  );
}

