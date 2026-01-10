/**
 * Admin Documentation Page
 * Technical documentation accessible only to admins
 * 
 * Auth handled client-side via backend API session validation
 */

import type { Metadata } from "next";
import Link from "next/link";
import { readFile } from "fs/promises";
import { join } from "path";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Technical Documentation - Admin",
  description: "Technical documentation for Ignition administrators.",
  robots: { index: false, follow: false },
};

export default async function AdminDocsPage() {
  // Auth and admin verification handled client-side
  // AdminClient wrapper will redirect if not authenticated/authorized

  // Read the database schema markdown
  // NOTE: In the admin app, this path needs to point to the main repo docs
  let schemaContent = "";
  try {
    // Try relative path first (when deployed together)
    const schemaPath = join(process.cwd(), "..", "..", "docs", "DATABASE_SCHEMA.md");
    schemaContent = await readFile(schemaPath, "utf-8");
  } catch {
    try {
      // Fallback to root docs (when running standalone)
      const schemaPath = join(process.cwd(), "docs", "DATABASE_SCHEMA.md");
      schemaContent = await readFile(schemaPath, "utf-8");
    } catch {
      schemaContent = "# Documentation not found\n\nThe DATABASE_SCHEMA.md file could not be loaded.";
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Technical Documentation</h1>
        <p className={styles.subtitle}>
          Database schema, API routes, and system specifications.
        </p>
        <Link href="/" className={styles.backLink}>
          Back to Admin Console
        </Link>
      </header>

      <div className={styles.content}>
        <article className={styles.article}>
          <pre className={styles.markdown}>{schemaContent}</pre>
        </article>
      </div>
    </div>
  );
}

