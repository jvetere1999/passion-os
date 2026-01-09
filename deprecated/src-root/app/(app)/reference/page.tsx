/**
 * Reference Library Page
 * Reference track library with audio playback, waveform visualization, and analysis
 */

import type { Metadata } from "next";
import { ReferenceLibrary } from "@/components/references/ReferenceLibrary";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Reference Library",
  description:
    "Manage your reference tracks with waveform visualization and audio analysis.",
};

export default function ReferencePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Reference Library</h1>
        <p className={styles.subtitle}>
          Analyze and compare reference tracks for your productions.
        </p>
      </header>

      <ReferenceLibrary />
    </div>
  );
}

