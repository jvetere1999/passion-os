/**
 * Templates Page
 * Music production templates gallery
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getTemplateCategories } from "@/lib/data";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Templates",
  description: "Music production templates for drums, melodies, and chords.",
};

export default function TemplatesPage() {
  const categories = getTemplateCategories();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Templates</h1>
        <p className={styles.subtitle}>
          Start your productions with proven templates.
        </p>
      </header>

      <div className={styles.categories}>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/templates/${category.id}`}
            className={styles.categoryCard}
          >
            <div className={styles.categoryIcon}>
              <CategoryIcon id={category.id} />
            </div>
            <div className={styles.categoryContent}>
              <h2 className={styles.categoryName}>{category.name}</h2>
              <p className={styles.categoryDescription}>{category.description}</p>
              <span className={styles.categoryCount}>
                {category.count} templates
              </span>
            </div>
          </Link>
        ))}
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Templates</h2>
        <div className={styles.emptyState}>
          <p>Browse categories above to find templates.</p>
        </div>
      </section>
    </div>
  );
}

function CategoryIcon({ id }: { id: string }) {
  switch (id) {
    case "drums":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
          <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
          <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
          <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
        </svg>
      );
    case "melody":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case "chords":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
          <line x1="6" y1="4" x2="6" y2="20" />
          <line x1="10" y1="4" x2="10" y2="20" />
          <line x1="14" y1="4" x2="14" y2="20" />
          <line x1="18" y1="4" x2="18" y2="20" />
        </svg>
      );
    default:
      return null;
  }
}

