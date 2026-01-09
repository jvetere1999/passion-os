"use client";

/**
 * Mobile Do Client Component
 *
 * Execution-only surfaces: Focus, Continue Plan, Quests
 * No planning, just action.
 */

import Link from "next/link";
import styles from "./MobileDo.module.css";

interface MobileDoClientProps {
  focusActive: boolean;
  hasIncompletePlanItem: boolean;
  nextPlanItem: {
    id: string;
    title: string;
    actionUrl: string;
  } | null;
}

export function MobileDoClient({
  focusActive,
  hasIncompletePlanItem,
  nextPlanItem,
}: MobileDoClientProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Do</h1>
        <p className={styles.subtitle}>Execute. No planning here.</p>
      </header>

      <div className={styles.actions}>
        {/* Focus - Primary Action */}
        <Link href="/focus" className={styles.primaryCard}>
          <div className={styles.cardIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>
              {focusActive ? "Continue Focus" : "Start Focus"}
            </h2>
            <p className={styles.cardDescription}>
              {focusActive ? "Session in progress" : "Deep work timer"}
            </p>
          </div>
          <div className={styles.cardArrow}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>

        {/* Continue Plan Item - if exists */}
        {hasIncompletePlanItem && nextPlanItem && (
          <Link href={nextPlanItem.actionUrl} className={styles.secondaryCard}>
            <div className={styles.cardIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Continue Plan</h3>
              <p className={styles.cardDescription}>{nextPlanItem.title}</p>
            </div>
            <div className={styles.cardArrow}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        )}

        {/* Quests */}
        <Link href="/quests" className={styles.secondaryCard}>
          <div className={styles.cardIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>Quests</h3>
            <p className={styles.cardDescription}>Small wins, big progress</p>
          </div>
          <div className={styles.cardArrow}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>

        {/* Habits */}
        <Link href="/habits" className={styles.secondaryCard}>
          <div className={styles.cardIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>Habits</h3>
            <p className={styles.cardDescription}>Daily check-ins</p>
          </div>
          <div className={styles.cardArrow}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>

        {/* Exercise */}
        <Link href="/exercise" className={styles.secondaryCard}>
          <div className={styles.cardIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>Exercise</h3>
            <p className={styles.cardDescription}>Log a workout</p>
          </div>
          <div className={styles.cardArrow}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}

