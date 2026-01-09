/**
 * Note Recognition Training Page
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NoteGame } from "./NoteGame";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Note Recognition - Ignition",
  description: "Train your ear to identify single notes and octaves.",
};

export default async function NoteTrainingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/learn/ear-training/notes");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/learn/ear-training" className={styles.backLink}>
          &larr; Back to Ear Training
        </Link>
        <h1 className={styles.title}>Note Recognition</h1>
        <p className={styles.subtitle}>
          Identify single notes and octaves by ear
        </p>
      </header>

      <NoteGame />
    </div>
  );
}

