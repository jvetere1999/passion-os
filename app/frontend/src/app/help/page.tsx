/**
 * Help Page
 * User documentation and guides
 */

import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Help - Ignition",
  description: "User guide and documentation for Ignition.",
};

const sections = [
  { title: "Getting Started", href: "/help/getting-started", description: "First steps with Ignition" },
  { title: "Today Dashboard", href: "/help/today", description: "Your daily command center" },
  { title: "Focus Timer", href: "/help/focus", description: "Pomodoro-style focus sessions" },
  { title: "Planner", href: "/help/planner", description: "Calendar and event management" },
  { title: "Quests", href: "/help/quests", description: "Daily and weekly challenges" },
  { title: "Habits", href: "/help/habits", description: "Build consistent routines" },
  { title: "Goals", href: "/help/goals", description: "Long-term objectives with milestones" },
  { title: "Exercise & Workouts", href: "/help/exercise", description: "Fitness tracking and PRs" },
  { title: "Training Programs", href: "/help/programs", description: "Multi-week training plans" },
  { title: "Book Tracker", href: "/help/books", description: "Track your reading progress" },
  { title: "Progress & XP", href: "/help/progress", description: "Gamification and leveling" },
  { title: "Market", href: "/help/market", description: "Spend coins on rewards" },
  { title: "Production Tools", href: "/help/production", description: "DAW shortcuts, arrange view, and more" },
  { title: "Learning Suite", href: "/help/learning", description: "Courses, flashcards, and journal" },
  { title: "Settings", href: "/help/settings", description: "Customize your experience" },
  { title: "Mobile App", href: "/help/mobile", description: "iOS/iPadOS PWA usage" },
  { title: "Keyboard Shortcuts", href: "/help/shortcuts", description: "Navigate faster with shortcuts" },
];

export default function HelpPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Help Center</h1>
        <p className={styles.subtitle}>
          Learn how to get started with Ignition.
        </p>
      </header>

      <section className={styles.quickStart}>
        <h2 className={styles.sectionTitle}>Quick Start</h2>
        <ol className={styles.quickList}>
          <li>Sign in with Google or Microsoft</li>
          <li>Complete age verification (16+)</li>
          <li>Wait for account approval</li>
          <li>Start with the Today dashboard</li>
        </ol>
      </section>

      <section className={styles.concepts}>
        <h2 className={styles.sectionTitle}>Core Concepts</h2>
        <div className={styles.conceptGrid}>
          <div className={styles.concept}>
            <h3>XP and Levels</h3>
            <p>Everything earns XP. Focus = 25 XP, Workouts = 50 XP, Lessons = 30 XP.</p>
          </div>
          <div className={styles.concept}>
            <h3>Coins</h3>
            <p>Earned alongside XP. Spend in Market on personal rewards.</p>
          </div>
          <div className={styles.concept}>
            <h3>Skills</h3>
            <p>Five skills: Knowledge, Guts, Proficiency, Kindness, Charm.</p>
          </div>
          <div className={styles.concept}>
            <h3>Streaks</h3>
            <p>Maintain daily streaks for habits, focus, and workouts.</p>
          </div>
        </div>
      </section>

      <section className={styles.sections}>
        <h2 className={styles.sectionTitle}>Documentation</h2>
        <div className={styles.grid}>
          {sections.map((section) => (
            <Link key={section.href} href={section.href} className={styles.card}>
              <h3 className={styles.cardTitle}>{section.title}</h3>
              <p className={styles.cardDescription}>{section.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.support}>
        <h2 className={styles.sectionTitle}>Need More Help?</h2>
        <p className={styles.supportText}>
          Can&apos;t find what you&apos;re looking for?
        </p>
        <div className={styles.supportActions}>
          <Link href="/contact" className={styles.supportLink}>
            Contact Support
          </Link>
          <Link href="/feedback" className={styles.supportLink}>
            Send Feedback
          </Link>
        </div>
      </section>
    </div>
  );
}

