/**
 * Practice Page
 * Practice exercises and projects
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Practice",
  description: "Practice synthesis skills with guided exercises.",
};

export default async function PracticePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/learn/practice");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Practice</h1>
        <p className={styles.subtitle}>
          Apply your knowledge with guided exercises and projects
        </p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>Exercises</h2>
          <p className={styles.description}>
            Short, focused practice sessions to reinforce specific concepts.
          </p>
          <div className={styles.emptyState}>
            <p>Complete course lessons to unlock practice exercises.</p>
            <Link href="/learn/courses" className={styles.linkBtn}>
              Browse Courses
            </Link>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Projects</h2>
          <p className={styles.description}>
            Larger creative projects that combine multiple skills.
          </p>
          <div className={styles.emptyState}>
            <p>Complete course modules to unlock capstone projects.</p>
            <Link href="/learn/courses" className={styles.linkBtn}>
              Browse Courses
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

