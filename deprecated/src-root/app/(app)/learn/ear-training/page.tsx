/**
 * Ear Training Hub
 * Central hub for all ear training exercises
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Ear Training - Ignition",
  description: "Train your ears with interval, chord, and note recognition exercises.",
};

const drillCategories = [
  {
    id: "intervals",
    title: "Interval Recognition",
    description: "Learn to identify the distance between two notes",
    icon: "M",
    href: "/learn/ear-training/intervals",
    difficulty: "Beginner",
    estimatedTime: "2-5 min",
  },
  {
    id: "notes",
    title: "Note Recognition",
    description: "Identify single notes and octaves by ear",
    icon: "N",
    href: "/learn/ear-training/notes",
    difficulty: "Beginner",
    estimatedTime: "2-3 min",
  },
  {
    id: "chords",
    title: "Chord Quality",
    description: "Distinguish between major, minor, diminished, and augmented chords",
    icon: "C",
    href: "/learn/ear-training/chords",
    difficulty: "Intermediate",
    estimatedTime: "3-5 min",
  },
  {
    id: "scales",
    title: "Scale Recognition",
    description: "Identify major, minor, and modal scales",
    icon: "S",
    href: "/learn/ear-training/scales",
    difficulty: "Intermediate",
    estimatedTime: "3-5 min",
  },
  {
    id: "progressions",
    title: "Chord Progressions",
    description: "Recognize common chord progressions by ear",
    icon: "P",
    href: "/learn/ear-training/progressions",
    difficulty: "Advanced",
    estimatedTime: "5-10 min",
  },
  {
    id: "rhythm",
    title: "Rhythm Training",
    description: "Tap along and identify rhythm patterns",
    icon: "R",
    href: "/learn/ear-training/rhythm",
    difficulty: "Beginner",
    estimatedTime: "2-5 min",
  },
];

export default async function EarTrainingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/learn/ear-training");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/learn" className={styles.backLink}>
          &larr; Back to Learn
        </Link>
        <h1 className={styles.title}>Ear Training</h1>
        <p className={styles.subtitle}>
          Train your ears with interactive exercises. Start small, practice daily.
        </p>
      </header>

      <section className={styles.quickStart}>
        <h2 className={styles.sectionTitle}>Quick Start</h2>
        <div className={styles.quickActions}>
          <Link href="/learn/ear-training/intervals?mode=quick" className={styles.quickAction}>
            <span className={styles.quickIcon}>2 min</span>
            <span>Quick Interval Drill</span>
          </Link>
          <Link href="/learn/ear-training/notes?mode=quick" className={styles.quickAction}>
            <span className={styles.quickIcon}>2 min</span>
            <span>Note Recognition</span>
          </Link>
          <Link href="/learn/ear-training/chords?mode=quick" className={styles.quickAction}>
            <span className={styles.quickIcon}>3 min</span>
            <span>Chord Quality</span>
          </Link>
        </div>
      </section>

      <section className={styles.drills}>
        <h2 className={styles.sectionTitle}>All Exercises</h2>
        <div className={styles.drillGrid}>
          {drillCategories.map((drill) => (
            <Link key={drill.id} href={drill.href} className={styles.drillCard}>
              <div className={styles.drillIcon}>{drill.icon}</div>
              <div className={styles.drillContent}>
                <h3 className={styles.drillTitle}>{drill.title}</h3>
                <p className={styles.drillDescription}>{drill.description}</p>
                <div className={styles.drillMeta}>
                  <span className={`${styles.difficulty} ${styles[drill.difficulty.toLowerCase()]}`}>
                    {drill.difficulty}
                  </span>
                  <span className={styles.time}>{drill.estimatedTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.tips}>
        <h2 className={styles.sectionTitle}>Tips for Success</h2>
        <ul className={styles.tipsList}>
          <li>Practice for 5-10 minutes daily rather than long sessions</li>
          <li>Start with intervals - they are the foundation of everything</li>
          <li>Use headphones for best results</li>
          <li>Sing or hum the notes back - this reinforces learning</li>
          <li>Be patient - ear training takes time but the results are worth it</li>
        </ul>
      </section>
    </div>
  );
}

