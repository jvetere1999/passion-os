/**
 * Courses Page
 * Browse available courses
 */

import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Courses",
  description: "Browse Serum and Vital synthesis courses.",
};

export default function CoursesPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Courses</h1>
        <p className={styles.subtitle}>
          Master synthesis with structured learning paths
        </p>
      </header>

      <div className={styles.comingSoon}>
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="12" y1="6" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h2>Coming Soon</h2>
        <p>
          Structured courses for Serum and Vital are currently in development.
          Check back soon for comprehensive learning paths covering oscillators,
          filters, modulation, and sound design techniques.
        </p>
      </div>
    </div>
  );
}

