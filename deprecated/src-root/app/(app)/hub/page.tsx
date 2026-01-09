/**
 * Hub Page
 * DAW keyboard shortcuts browser
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getDAWs } from "@/lib/data";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Shortcuts Hub",
  description: "Browse keyboard shortcuts for your favorite DAWs.",
};

export default function HubPage() {
  const daws = getDAWs();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Shortcuts Hub</h1>
        <p className={styles.subtitle}>
          Master your DAW with keyboard shortcuts.
        </p>
      </header>

      <div className={styles.searchBar}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.searchIcon}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          placeholder="Search shortcuts..."
          className={styles.searchInput}
        />
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Select Your DAW</h2>
        <div className={styles.dawGrid}>
          {daws.map((daw) => (
            <Link
              key={daw.id}
              href={`/hub/${daw.id}`}
              className={styles.dawCard}
              style={{ "--daw-color": daw.color } as React.CSSProperties}
            >
              <div className={styles.dawIcon}>
                <span className={styles.dawInitial}>{daw.name[0]}</span>
              </div>
              <span className={styles.dawName}>{daw.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Tips</h2>
        <div className={styles.tipsList}>
          <div className={styles.tip}>
            <span className={styles.tipNumber}>1</span>
            <div>
              <strong>Learn incrementally</strong>
              <p>Focus on 3-5 new shortcuts per week</p>
            </div>
          </div>
          <div className={styles.tip}>
            <span className={styles.tipNumber}>2</span>
            <div>
              <strong>Practice with intention</strong>
              <p>Use shortcuts consciously until they become automatic</p>
            </div>
          </div>
          <div className={styles.tip}>
            <span className={styles.tipNumber}>3</span>
            <div>
              <strong>Customize your workflow</strong>
              <p>Remap keys that feel awkward for your hands</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

