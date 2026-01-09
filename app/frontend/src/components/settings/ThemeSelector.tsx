"use client";

/**
 * Theme Selector Component
 * Allows users to select from available themes
 */

import { useTheme } from "@/lib/theme";
import styles from "./ThemeSelector.module.css";

export function ThemeSelector() {
  const {
    currentTheme,
    themeId,
    lightThemes,
    darkThemes,
    setThemeById,
    toggleMode,
  } = useTheme();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Theme</h3>
        <button
          className={styles.toggleBtn}
          onClick={toggleMode}
          title={`Switch to ${currentTheme.mode === "dark" ? "light" : "dark"} mode`}
        >
          {currentTheme.mode === "dark" ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* System option */}
      <div className={styles.section}>
        <button
          className={`${styles.themeOption} ${themeId === "system" ? styles.active : ""}`}
          onClick={() => setThemeById("system")}
        >
          <div className={styles.themePreview} style={{ background: "linear-gradient(135deg, #f5f5f5 50%, #1e1e1e 50%)" }} />
          <span className={styles.themeName}>System</span>
          {themeId === "system" && <span className={styles.checkmark}>&#10003;</span>}
        </button>
      </div>

      {/* Dark themes */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Dark Themes</h4>
        <div className={styles.themeGrid}>
          {darkThemes.map((theme) => (
            <button
              key={theme.id}
              className={`${styles.themeOption} ${themeId === theme.id ? styles.active : ""}`}
              onClick={() => setThemeById(theme.id)}
              title={theme.name}
            >
              <div
                className={styles.themePreview}
                style={{
                  backgroundColor: theme.vars["--bg-primary"],
                  borderColor: theme.vars["--border-default"],
                }}
              >
                <div
                  className={styles.accentDot}
                  style={{ backgroundColor: theme.vars["--accent-primary"] }}
                />
              </div>
              <span className={styles.themeName}>{theme.name}</span>
              {themeId === theme.id && <span className={styles.checkmark}>&#10003;</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Light themes */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Light Themes</h4>
        <div className={styles.themeGrid}>
          {lightThemes.map((theme) => (
            <button
              key={theme.id}
              className={`${styles.themeOption} ${themeId === theme.id ? styles.active : ""}`}
              onClick={() => setThemeById(theme.id)}
              title={theme.name}
            >
              <div
                className={styles.themePreview}
                style={{
                  backgroundColor: theme.vars["--bg-primary"],
                  borderColor: theme.vars["--border-default"],
                }}
              >
                <div
                  className={styles.accentDot}
                  style={{ backgroundColor: theme.vars["--accent-primary"] }}
                />
              </div>
              <span className={styles.themeName}>{theme.name}</span>
              {themeId === theme.id && <span className={styles.checkmark}>&#10003;</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Current theme info */}
      <div className={styles.info}>
        <span className={styles.infoLabel}>Current:</span>
        <span className={styles.infoValue}>
          {themeId === "system" ? "System" : currentTheme.name}
        </span>
      </div>
    </div>
  );
}

