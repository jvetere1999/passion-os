/**
 * PageHeader Component
 * Standard page header with title, subtitle, and optional actions
 *
 * Usage:
 * <PageHeader
 *   title="Today"
 *   subtitle="Your daily dashboard"
 *   actions={<Button>Action</Button>}
 *   backLink={{ href: "/", label: "Back" }}
 * />
 */

import Link from "next/link";
import type { PageHeaderProps } from "@/lib/ui/contract";
import styles from "./PageHeader.module.css";

export function PageHeader({
  title,
  subtitle,
  actions,
  backLink,
}: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {backLink && (
        <Link href={backLink.href} className={styles.backLink}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>{backLink.label}</span>
        </Link>
      )}
      <div className={styles.content}>
        <div className={styles.text}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}

