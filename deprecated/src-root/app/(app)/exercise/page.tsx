/**
 * Exercise Page
 * Workout tracking with sets, reps, weight, and RPE
 */

import type { Metadata } from "next";
import { ExerciseClient } from "./ExerciseClient";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Exercise",
  description: "Track your workouts, sets, reps, and personal records.",
};

export default function ExercisePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Exercise</h1>
        <p className={styles.subtitle}>
          Track your workouts and personal records.
        </p>
      </header>

      <ExerciseClient />
    </div>
  );
}

