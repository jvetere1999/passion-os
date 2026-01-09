"use client";

/**
 * Mobile Quests Screen
 */

import styles from "./MobileQuests.module.css";

interface MobileQuestsProps {
  userId: string;
}

export function MobileQuests({ userId }: MobileQuestsProps) {
  void userId;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>Quests</h1>
      </header>

      {/* Quest Categories */}
      <div className={styles.categories}>
        <button className={`${styles.categoryBtn} ${styles.active}`}>All</button>
        <button className={styles.categoryBtn}>Daily</button>
        <button className={styles.categoryBtn}>Weekly</button>
        <button className={styles.categoryBtn}>Custom</button>
      </div>

      {/* Empty State */}
      <div className={styles.emptyState}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <h2>No Quests Yet</h2>
        <p>Start your journey by creating your first quest</p>
        <button className={styles.createBtn}>Create Quest</button>
      </div>
    </div>
  );
}

