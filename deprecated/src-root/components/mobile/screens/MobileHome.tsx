"use client";

/**
 * Mobile Home Screen
 * Today view with quick actions for mobile
 */

import type { User } from "next-auth";
import styles from "./MobileHome.module.css";

interface MobileHomeProps {
  user: User;
}

export function MobileHome({ user }: MobileHomeProps) {
  const greeting = getGreeting();
  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div className={styles.screen}>
      {/* Greeting */}
      <section className={styles.greeting}>
        <h1>{greeting}, {firstName}</h1>
        <p>{formatDate(new Date())}</p>
      </section>

      {/* Quick Actions */}
      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionGrid}>
          <QuickActionCard
            icon={<ClockIcon />}
            label="Start Focus"
            color="purple"
          />
          <QuickActionCard
            icon={<StarIcon />}
            label="New Quest"
            color="yellow"
          />
          <QuickActionCard
            icon={<CalendarIcon />}
            label="Add Event"
            color="blue"
          />
          <QuickActionCard
            icon={<NoteIcon />}
            label="Quick Note"
            color="green"
          />
        </div>
      </section>

      {/* Today's Focus */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Today&apos;s Focus</h2>
        <div className={styles.emptyState}>
          <p>No active focus session</p>
          <button className={styles.primaryBtn}>Start Focus</button>
        </div>
      </section>

      {/* Active Quests */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Active Quests</h2>
        <div className={styles.emptyState}>
          <p>No quests for today</p>
          <button className={styles.secondaryBtn}>Browse Quests</button>
        </div>
      </section>

      {/* Upcoming */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Upcoming</h2>
        <div className={styles.emptyState}>
          <p>No upcoming events</p>
        </div>
      </section>
    </div>
  );
}

// Helper Components
function QuickActionCard({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: "purple" | "yellow" | "blue" | "green";
}) {
  return (
    <button className={`${styles.actionCard} ${styles[color]}`}>
      <span className={styles.actionIcon}>{icon}</span>
      <span className={styles.actionLabel}>{label}</span>
    </button>
  );
}

// Icons
function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// Helpers
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

