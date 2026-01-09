/**
 * Admin Documentation Page
 * Technical documentation accessible only to admins
 */

import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { readFile } from "fs/promises";
import { join } from "path";
import styles from "./page.module.css";

// Main app URL for redirects
const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || "https://ignition.ecent.online";

export const metadata: Metadata = {
  title: "Technical Documentation - Admin",
  description: "Technical documentation for Ignition administrators.",
  robots: { index: false, follow: false },
};

export default async function AdminDocsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(`${MAIN_APP_URL}/auth/signin`);
  }

  // Check if user is admin
  if (!isAdminEmail(session.user.email)) {
    redirect(`${MAIN_APP_URL}/today`);
  }

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

