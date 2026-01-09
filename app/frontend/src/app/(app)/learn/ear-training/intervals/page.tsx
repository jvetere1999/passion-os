/**
 * Interval Training Page
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { IntervalGame } from "./IntervalGame";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Interval Training - Ignition",
  description: "Train your ear to recognize musical intervals.",
};

export default async function IntervalTrainingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/learn/ear-training/intervals");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/learn/ear-training" className={styles.backLink}>
          &larr; Back to Ear Training
        </Link>
        <h1 className={styles.title}>Interval Recognition</h1>
        <p className={styles.subtitle}>
          Learn to identify the distance between two notes
        </p>
      </header>

      <IntervalGame />
    </div>
  );
}

