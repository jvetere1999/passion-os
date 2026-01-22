"use client";

import styles from "./StatusToast.module.css";

type StatusToastTone = "info" | "success" | "warning" | "error";

interface StatusToastProps {
  title: string;
  message?: string;
  tone?: StatusToastTone;
  isLoading?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function StatusToast({
  title,
  message,
  tone = "info",
  isLoading = false,
  action,
}: StatusToastProps) {
  return (
    <div className={styles.toast} data-tone={tone} aria-live="polite">
      <div
        className={`${styles.indicator} ${isLoading ? styles.indicatorLoading : ""}`}
      />
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        {message && <p className={styles.message}>{message}</p>}
        {action && (
          <button className={styles.action} type="button" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
