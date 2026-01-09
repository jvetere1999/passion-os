/**
 * Camelot Wheel / Harmonic Wheel Page
 *
 * Low-friction harmonic reference for DJs and musicians.
 * Supports both Camelot notation (DJ-style) and Circle of Fifths (theory-style).
 *
 * Route: /wheel
 * Purpose: Reference tool, not an action - exploration without commitment.
 */

import type { Metadata } from "next";
import { HarmonicWheelClient } from "./HarmonicWheelClient";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Harmonic Wheel",
  description: "See how keys relate. A visual tool for harmonic mixing and music theory.",
};

export default function WheelPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Harmonic Wheel</h1>
        <p className={styles.subtitle}>See how keys relate.</p>
      </header>

      <main className={styles.content}>
        <HarmonicWheelClient />
      </main>
    </div>
  );
}

