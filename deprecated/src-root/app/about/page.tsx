import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About - Ignition",
  description: "Learn more about Ignition - a starter engine for focus, movement, and learning.",
};

const features = [
  {
    category: "Productivity",
    items: [
      { name: "Today Dashboard", description: "Daily command center with personalized plan generation" },
      { name: "Focus Timer", description: "Pomodoro-style deep work sessions with break reminders" },
      { name: "Planner", description: "Calendar for scheduling events, workouts, and focus blocks" },
      { name: "Quests", description: "Daily and weekly challenges with XP rewards" },
      { name: "Habits", description: "Track daily routines with streak counting" },
      { name: "Goals", description: "Long-term objectives with milestone tracking" },
    ],
  },
  {
    category: "Fitness",
    items: [
      { name: "Exercise Library", description: "800+ exercises with muscle targeting" },
      { name: "Workout Builder", description: "Create custom workouts with sections" },
      { name: "Personal Records", description: "Automatic PR tracking for lifts" },
      { name: "Training Programs", description: "Multi-week structured training plans" },
    ],
  },
  {
    category: "Learning & Growth",
    items: [
      { name: "Book Tracker", description: "Track reading progress and build reading habits" },
      { name: "Learning Suite", description: "Courses, flashcards, recipes, and journal" },
      { name: "Progress & XP", description: "Gamification with levels and skill trees" },
      { name: "Market", description: "Spend coins on personal rewards" },
    ],
  },
  {
    category: "Music Production",
    items: [
      { name: "DAW Shortcuts", description: "Quick reference for Ableton, Logic, FL Studio, and more" },
      { name: "Arrange View", description: "Piano roll and drum sequencer" },
      { name: "Templates", description: "Melody, drum, and chord pattern templates" },
      { name: "Reference Tracks", description: "Audio analysis with BPM and key detection" },
      { name: "Infobase", description: "Music production knowledge database" },
    ],
  },
];

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>
        Back to Home
      </Link>

      <h1 className={styles.title}>About Ignition</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What is Ignition?</h2>
        <p className={styles.text}>
          Ignition is a starter engine that helps you begin with minimal friction. It combines focus timers,
          workout tracking, reading logs, and production tools into a unified experience. Start with one thing.
          Build momentum naturally.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Features</h2>
        <div className={styles.featureCategories}>
          {features.map((category) => (
            <div key={category.category} className={styles.featureCategory}>
              <h3 className={styles.categoryTitle}>{category.category}</h3>
              <ul className={styles.featureList}>
                {category.items.map((item) => (
                  <li key={item.name} className={styles.featureItem}>
                    <strong>{item.name}</strong>
                    <span className={styles.featureDesc}>{item.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Gamification</h2>
        <div className={styles.gamificationGrid}>
          <div className={styles.gamificationItem}>
            <h4>XP and Levels</h4>
            <p>Earn XP for focus sessions, workouts, quests, and more. Level up as you grow.</p>
          </div>
          <div className={styles.gamificationItem}>
            <h4>Coins</h4>
            <p>Earn coins alongside XP and spend them on personal rewards in the Market.</p>
          </div>
          <div className={styles.gamificationItem}>
            <h4>Skills</h4>
            <p>Build five skills: Knowledge, Guts, Proficiency, Kindness, and Charm.</p>
          </div>
          <div className={styles.gamificationItem}>
            <h4>Streaks</h4>
            <p>Maintain daily streaks for habits, focus, and workouts with bonus multipliers.</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Get Started</h2>
        <p className={styles.text}>
          <Link href="/auth/signin" className={styles.ctaLink}>Sign in</Link> with your Google or Microsoft
          account to start using Ignition. New users need admin approval before accessing the app.
        </p>
        <div className={styles.ctaButtons}>
          <Link href="/auth/signin" className={styles.primaryButton}>
            Sign In
          </Link>
          <Link href="/help" className={styles.secondaryButton}>
            View Documentation
          </Link>
        </div>
      </section>
    </main>
  );
}

