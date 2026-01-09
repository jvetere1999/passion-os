"use client";

/**
 * Ignitions Client Component
 *
 * A curated list of ways to begin.
 * Not tasks. Not plans. Just ways to start.
 *
 * Categories:
 * - Body: Physical movement starters
 * - Mind: Mental focus starters
 * - Space: Environment starters
 * - Create: Creative work starters
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface Ignition {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: "body" | "mind" | "space" | "create";
  action?: {
    type: "focus" | "link";
    duration?: number;
    href?: string;
  };
}

const ignitions: Ignition[] = [
  // Body
  {
    id: "stretch",
    title: "30-second stretch",
    description: "Stand up. Reach for the ceiling. Done.",
    duration: "30s",
    category: "body",
  },
  {
    id: "water",
    title: "Drink water",
    description: "Fill a glass. Drink it. That counts.",
    duration: "1m",
    category: "body",
  },
  {
    id: "walk",
    title: "Walk to the window",
    description: "Look outside for a moment. Then decide what's next.",
    duration: "1m",
    category: "body",
  },
  {
    id: "breathe",
    title: "Three deep breaths",
    description: "In through nose, out through mouth. Three times.",
    duration: "30s",
    category: "body",
  },
  // Mind
  {
    id: "focus-5",
    title: "5-minute focus",
    description: "Set a timer. Work on one thing. Just five minutes.",
    duration: "5m",
    category: "mind",
    action: { type: "focus", duration: 5 },
  },
  {
    id: "write-one",
    title: "Write one sentence",
    description: "Open a doc. Write one sentence about anything.",
    duration: "2m",
    category: "mind",
  },
  {
    id: "list-three",
    title: "List three things",
    description: "What are three things you could do? Just list them.",
    duration: "2m",
    category: "mind",
  },
  {
    id: "close-tabs",
    title: "Close three tabs",
    description: "Pick three browser tabs to close. That's progress.",
    duration: "1m",
    category: "mind",
  },
  // Space
  {
    id: "clear-surface",
    title: "Clear one surface",
    description: "Pick any surface. Clear it. Feels good.",
    duration: "3m",
    category: "space",
  },
  {
    id: "trash-one",
    title: "Throw one thing away",
    description: "Look around. Find one thing to trash or recycle.",
    duration: "1m",
    category: "space",
  },
  {
    id: "open-blinds",
    title: "Let light in",
    description: "Open blinds or curtains. Natural light helps.",
    duration: "30s",
    category: "space",
  },
  // Create
  {
    id: "open-daw",
    title: "Open your DAW",
    description: "Just open it. Look at a project. That's starting.",
    duration: "2m",
    category: "create",
    action: { type: "link", href: "/arrange" },
  },
  {
    id: "play-chord",
    title: "Play one chord",
    description: "Open an instrument. Play one chord. Done.",
    duration: "1m",
    category: "create",
  },
  {
    id: "listen-30",
    title: "Listen for 30 seconds",
    description: "Put on a reference track. Listen for 30 seconds.",
    duration: "30s",
    category: "create",
    action: { type: "link", href: "/reference" },
  },
  {
    id: "sketch-idea",
    title: "Sketch an idea",
    description: "Draw, write, or hum something. Anything counts.",
    duration: "2m",
    category: "create",
  },
];

const categoryLabels: Record<string, string> = {
  body: "Body",
  mind: "Mind",
  space: "Space",
  create: "Create",
};

const categoryIcons: Record<string, React.ReactNode> = {
  body: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="5" r="3" />
      <path d="M12 8v8" />
      <path d="M8 21l4-5 4 5" />
      <path d="M6 13l6 3 6-3" />
    </svg>
  ),
  mind: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  space: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  create: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
};

export function IgnitionsClient() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "body" | "mind" | "space" | "create">("all");
  const [started, setStarted] = useState<string | null>(null);

  const handleStart = useCallback((ignition: Ignition) => {
    setStarted(ignition.id);

    // If it has an action, execute it
    if (ignition.action) {
      if (ignition.action.type === "focus" && ignition.action.duration) {
        // Navigate to focus with preset duration
        router.push(`/focus?duration=${ignition.action.duration}`);
      } else if (ignition.action.type === "link" && ignition.action.href) {
        router.push(ignition.action.href);
      }
    }

    // Clear after 3 seconds
    setTimeout(() => setStarted(null), 3000);
  }, [router]);

  const filteredIgnitions = filter === "all"
    ? ignitions
    : ignitions.filter(i => i.category === filter);

  // Group by category if showing all
  const groupedIgnitions = filter === "all"
    ? Object.entries(
        filteredIgnitions.reduce((acc, ignition) => {
          if (!acc[ignition.category]) acc[ignition.category] = [];
          acc[ignition.category].push(ignition);
          return acc;
        }, {} as Record<string, Ignition[]>)
      )
    : [["all", filteredIgnitions] as [string, Ignition[]]];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ignitions</h1>
        <p className={styles.subtitle}>Ways to begin. Pick one.</p>
      </header>

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        {(["body", "mind", "space", "create"] as const).map((cat) => (
          <button
            key={cat}
            className={`${styles.filterBtn} ${filter === cat ? styles.active : ""}`}
            onClick={() => setFilter(cat)}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      <main className={styles.content}>
        {groupedIgnitions.map(([category, items]) => (
          <section key={category} className={styles.categorySection}>
            {filter === "all" && (
              <h2 className={styles.categoryTitle}>
                <span className={styles.categoryIcon}>{categoryIcons[category]}</span>
                {categoryLabels[category]}
              </h2>
            )}
            <div className={styles.grid}>
              {items.map((ignition) => (
                <button
                  key={ignition.id}
                  className={`${styles.ignitionCard} ${started === ignition.id ? styles.started : ""}`}
                  onClick={() => handleStart(ignition)}
                  disabled={started === ignition.id}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>{ignition.title}</span>
                    <span className={styles.cardDuration}>{ignition.duration}</span>
                  </div>
                  <p className={styles.cardDescription}>{ignition.description}</p>
                  {started === ignition.id && (
                    <div className={styles.startedBadge}>Started</div>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className={styles.footer}>
        <p>Starting is the hardest part. You just did it.</p>
      </footer>
    </div>
  );
}

