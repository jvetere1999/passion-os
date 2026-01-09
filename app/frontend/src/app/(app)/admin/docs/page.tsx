/**
 * Admin Documentation Page
 * Technical documentation accessible only to admins
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { readFile } from "fs/promises";
import { join } from "path";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Technical Documentation - Admin",
  description: "Technical documentation for Ignition administrators.",
  robots: { index: false, follow: false },
};

export default async function AdminDocsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if user is admin
  if (!isAdminEmail(session.user.email)) {
    redirect("/today");
  }

  // Read the database schema markdown
  let schemaContent = "";
  try {
    const schemaPath = join(process.cwd(), "docs", "DATABASE_SCHEMA.md");
    schemaContent = await readFile(schemaPath, "utf-8");
  } catch {
    schemaContent = "# Documentation not found\n\nThe DATABASE_SCHEMA.md file could not be loaded.";
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Technical Documentation</h1>
        <p className={styles.subtitle}>
          Database schema, API routes, and system specifications.
        </p>
        <a href="/admin" className={styles.backLink}>
          Back to Admin Console
        </a>
      </header>

      <div className={styles.content}>
        <article className={styles.article}>
          <pre className={styles.markdown}>{schemaContent}</pre>
        </article>
      </div>
    </div>
  );
}

