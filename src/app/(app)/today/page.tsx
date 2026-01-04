/**
 * Today Page (Home within app shell)
 * Dashboard view showing today's overview and quick actions
 */

import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Today",
  description: "Your daily dashboard - quests, focus sessions, and progress.",
};

export default async function TodayPage() {
  const session = await auth();

  // Session is guaranteed by middleware, but handle edge case
  const greeting = getGreeting();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {greeting}, {firstName}
        </h1>
        <p className={styles.subtitle}>
          Here&apos;s what&apos;s on your plate today.
        </p>
      </header>

      <div className={styles.grid}>
        {/* Primary Actions */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Get Started</h2>
          <div className={styles.actions}>
            <Link href="/focus" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <span className={styles.actionLabel}>Start Focus</span>
            </Link>

            <Link href="/planner" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <span className={styles.actionLabel}>Plan Day</span>
            </Link>

            <Link href="/quests" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="m9 15 2 2 4-4" />
                </svg>
              </div>
              <span className={styles.actionLabel}>Quests</span>
            </Link>

            <Link href="/exercise" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6.5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                  <path d="M4 21v-7l-2-4 4-2 4 4-2 4" />
                  <path d="M10 5l4 4" />
                  <path d="M21 3l-6 6" />
                  <path d="M18 22V12l2-4-3-1" />
                </svg>
              </div>
              <span className={styles.actionLabel}>Exercise</span>
            </Link>
          </div>
        </section>

        {/* Production Tools */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Production</h2>
          <div className={styles.actions}>
            <Link href="/hub" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                  <path d="M6 8h.001" />
                  <path d="M10 8h.001" />
                  <path d="M14 8h.001" />
                  <path d="M18 8h.001" />
                  <path d="M8 12h.001" />
                  <path d="M12 12h.001" />
                  <path d="M16 12h.001" />
                  <path d="M7 16h10" />
                </svg>
              </div>
              <span className={styles.actionLabel}>Shortcuts</span>
            </Link>

            <Link href="/arrange" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M3 15h18" />
                  <path d="M9 3v18" />
                </svg>
              </div>
              <span className={styles.actionLabel}>Arrange</span>
            </Link>

            <Link href="/reference" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <path d="M6 15h12" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <span className={styles.actionLabel}>Reference</span>
            </Link>

            <Link href="/templates" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <span className={styles.actionLabel}>Templates</span>
            </Link>
          </div>
        </section>

        {/* Knowledge & Learning */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Learn & Grow</h2>
          <div className={styles.actions}>
            <Link href="/learn" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <span className={styles.actionLabel}>Learn</span>
            </Link>

            <Link href="/infobase" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <span className={styles.actionLabel}>Infobase</span>
            </Link>

            <Link href="/goals" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <span className={styles.actionLabel}>Goals</span>
            </Link>

            <Link href="/progress" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="20" x2="12" y2="10" />
                  <line x1="18" y1="20" x2="18" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="16" />
                </svg>
              </div>
              <span className={styles.actionLabel}>Progress</span>
            </Link>
          </div>
        </section>

        {/* Rewards Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Rewards</h2>
            <Link href="/market" className={styles.sectionLink}>
              Visit Market
            </Link>
          </div>
          <div className={styles.rewardCard}>
            <p className={styles.rewardText}>
              Complete quests and focus sessions to earn coins and XP.
              Redeem rewards in the Market!
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}


