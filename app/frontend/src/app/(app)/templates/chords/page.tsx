/**
 * Chord Templates Page
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getTemplatesByCategory } from "@/lib/data";
import styles from "../drums/page.module.css";

export const metadata: Metadata = {
  title: "Chord Progressions",
  description: "Harmonic templates and chord progressions for music production.",
};

export default function ChordTemplatesPage() {
  const templates = getTemplatesByCategory("chords");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/templates" className={styles.backLink}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Templates
        </Link>
        <h1 className={styles.title}>Chord Progressions</h1>
        <p className={styles.subtitle}>
          {templates.length} harmonic templates and progressions
        </p>
      </header>

      <div className={styles.templateGrid}>
        {templates.map((template) => (
          <div key={template.id} className={styles.templateCard}>
            <div className={styles.templateHeader}>
              <h2 className={styles.templateName}>{template.name}</h2>
              <span className={styles.difficulty} data-level={template.difficulty}>
                {template.difficulty}
              </span>
            </div>
            <p className={styles.templateDescription}>{template.description}</p>
            <div className={styles.templateMeta}>
              <span>{template.bpm} BPM</span>
              <span>{template.timeSignature}</span>
              <span>{template.bars} bars</span>
            </div>
            <div className={styles.templateTags}>
              {template.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

