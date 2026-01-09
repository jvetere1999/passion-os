/**
 * SectionHeader Component
 * Standard section header with title, subtitle, and optional action
 *
 * Usage:
 * <SectionHeader
 *   title="Daily Plan"
 *   subtitle="Your tasks for today"
 *   action={<Button size="sm">View All</Button>}
 *   level={2}
 * />
 */

import type { SectionHeaderProps } from "@/lib/ui/contract";
import styles from "./SectionHeader.module.css";

export function SectionHeader({
  title,
  subtitle,
  action,
  level = 2,
}: SectionHeaderProps) {
  const Heading = `h${level}` as const;

  return (
    <div className={styles.header}>
      <div className={styles.text}>
        <Heading className={styles.title}>{title}</Heading>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

