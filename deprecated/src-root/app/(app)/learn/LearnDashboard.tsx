"use client";

/**
 * Learn Dashboard Client Component
 * Shows continue item, review queue, weak areas, and activity
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface DashboardData {
  continueItem: {
    type: string;
    id: string;
    title: string;
    courseName: string;
    moduleName: string;
    progressPct: number;
  } | null;
  dueReviewCount: number;
  estimatedReviewMinutes: number;
  weakAreas: {
    conceptId: string;
    term: string;
    suggestedLessonId: string;
    suggestedLessonTitle: string;
    lapseCount: number;
  }[];
  recentActivity: {
    type: string;
    title: string;
    completedAt: string;
  }[];
  streak: {
    current: number;
    longest: number;
    isActiveToday: boolean;
  };
  stats: {
    lessonsCompleted: number;
    exercisesCompleted: number;
    projectsCompleted: number;
    reviewCardsTotal: number;
    avgRetention: number;
  };
  diagnosticCompleted: boolean;
}

interface LearnDashboardProps {
  userId: string;
}

export function LearnDashboard({ userId }: LearnDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, use mock data until API is ready
    const mockData: DashboardData = {
      continueItem: null,
      dueReviewCount: 0,
      estimatedReviewMinutes: 0,
      weakAreas: [],
      recentActivity: [],
      streak: { current: 0, longest: 0, isActiveToday: false },
      stats: {
        lessonsCompleted: 0,
        exercisesCompleted: 0,
        projectsCompleted: 0,
        reviewCardsTotal: 0,
        avgRetention: 0,
      },
      diagnosticCompleted: false,
    };
    setData(mockData);
    setLoading(false);
  }, [userId]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return <div className={styles.error}>Failed to load dashboard</div>;
  }

  // Show diagnostic prompt if not completed
  if (!data.diagnosticCompleted) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Welcome to the Learning Suite</h1>
          <p className={styles.subtitle}>
            Master Serum and Vital synthesis with structured courses and spaced repetition.
          </p>
        </header>

        <div className={styles.diagnosticCard}>
          <div className={styles.diagnosticIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2>Take the Diagnostic Assessment</h2>
          <p>
            Start with a quick 5-minute assessment to identify your current skill level
            and get personalized course recommendations.
          </p>
          <Link href="/learn/diagnostic" className={styles.diagnosticBtn}>
            Start Diagnostic
          </Link>
          <button className={styles.skipBtn}>Skip for now</button>
        </div>

        <div className={styles.quickStart}>
          <h3>Or jump right in:</h3>
          <div className={styles.quickStartCards}>
            <Link href="/learn/courses" className={styles.quickCard}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Browse Courses</span>
            </Link>
            <Link href="/learn/glossary" className={styles.quickCard}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span>Explore Glossary</span>
            </Link>
            <Link href="/learn/recipes" className={styles.quickCard}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3h6v5l4 9H5l4-9V3z" />
                <line x1="9" y1="3" x2="15" y2="3" />
              </svg>
              <span>Recipe Generator</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Learning Dashboard</h1>
            <p className={styles.subtitle}>Keep your momentum going</p>
          </div>
          <div className={styles.streakBadge}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span>{data.streak.current} day streak</span>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Continue Learning */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Continue Learning</h2>
          {data.continueItem ? (
            <Link
              href={`/learn/${data.continueItem.type}/${data.continueItem.id}`}
              className={styles.continueCard}
            >
              <div className={styles.continueInfo}>
                <span className={styles.continueBadge}>{data.continueItem.courseName}</span>
                <h3>{data.continueItem.title}</h3>
                <p>{data.continueItem.moduleName}</p>
              </div>
              <div className={styles.continueProgress}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${data.continueItem.progressPct}%` }}
                  />
                </div>
                <span>{data.continueItem.progressPct}% complete</span>
              </div>
            </Link>
          ) : (
            <div className={styles.emptyCard}>
              <p>No lessons in progress</p>
              <Link href="/learn/courses" className={styles.startBtn}>
                Start a Course
              </Link>
            </div>
          )}
        </section>

        {/* Review Queue */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Due for Review</h2>
          {data.dueReviewCount > 0 ? (
            <Link href="/learn/review" className={styles.reviewCard}>
              <div className={styles.reviewCount}>{data.dueReviewCount}</div>
              <div className={styles.reviewInfo}>
                <h3>Cards due today</h3>
                <p>~{data.estimatedReviewMinutes} minutes</p>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ) : (
            <div className={styles.emptyCard}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p>All caught up!</p>
              <span>No reviews due today</span>
            </div>
          )}
        </section>

        {/* Weak Areas */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Areas to Improve</h2>
          {data.weakAreas.length > 0 ? (
            <ul className={styles.weakList}>
              {data.weakAreas.slice(0, 3).map((area) => (
                <li key={area.conceptId} className={styles.weakItem}>
                  <div className={styles.weakInfo}>
                    <h4>{area.term}</h4>
                    <Link href={`/learn/lesson/${area.suggestedLessonId}`}>
                      Review: {area.suggestedLessonTitle}
                    </Link>
                  </div>
                  <span className={styles.lapseCount}>{area.lapseCount} lapses</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyCard}>
              <p>No weak areas identified yet</p>
              <span>Complete some lessons and reviews first</span>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actions}>
            <Link href="/learn/recipes" className={styles.actionCard}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3h6v5l4 9H5l4-9V3z" />
              </svg>
              <span>Generate Recipe</span>
            </Link>
            <Link href="/learn/journal" className={styles.actionCard}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Log a Patch</span>
            </Link>
            <Link href="/learn/practice" className={styles.actionCard}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span>Practice</span>
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>Your Progress</h2>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{data.stats.lessonsCompleted}</span>
              <span className={styles.statLabel}>Lessons</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{data.stats.exercisesCompleted}</span>
              <span className={styles.statLabel}>Exercises</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{data.stats.projectsCompleted}</span>
              <span className={styles.statLabel}>Projects</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{data.stats.avgRetention}%</span>
              <span className={styles.statLabel}>Retention</span>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          {data.recentActivity.length > 0 ? (
            <ul className={styles.activityList}>
              {data.recentActivity.map((activity, i) => (
                <li key={i} className={styles.activityItem}>
                  <span className={styles.activityType}>{activity.type}</span>
                  <span className={styles.activityTitle}>{activity.title}</span>
                  <span className={styles.activityDate}>
                    {new Date(activity.completedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyCard}>
              <p>No recent activity</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default LearnDashboard;

