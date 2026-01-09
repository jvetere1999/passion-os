/**
 * Reference Library Page
 * Reference track library with audio playback, waveform visualization, and analysis
 *
 * Uses ReferenceLibraryV2 which is fully backend-integrated:
 * - All data flows through Rust backend API
 * - Audio files stored in R2 via signed URLs
 * - Annotations/regions persisted in Postgres
 */

import type { Metadata } from "next";
import { ReferenceLibraryV2 } from "@/components/references/ReferenceLibraryV2";
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

      <ReferenceLibraryV2 />
    </div>
  );
}

