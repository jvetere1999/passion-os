/**
 * Settings Page
 * User preferences and account settings
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account and preferences.",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Manage your account and preferences.
        </p>
      </header>

      <SettingsClient user={session.user} />
    </div>
  );
}

