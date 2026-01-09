/**
 * EmptyState Component
 * Standard empty state with title, description, icon, and optional action
 *
 * Usage:
 * <EmptyState
 *   title="No items yet"
 *   description="Create your first item to get started"
 *   icon={<SomeIcon />}
 *   action={{ label: "Create Item", href: "/create" }}
 * />
 */

import Link from "next/link";
import type { EmptyStateProps } from "@/lib/ui/contract";
import { Button } from "./Button";
import styles from "./States.module.css";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className={`${styles.state} ${styles.empty}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <div className={styles.action}>
          {action.href ? (
            <Link href={action.href}>
              <Button variant="primary">{action.label}</Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

