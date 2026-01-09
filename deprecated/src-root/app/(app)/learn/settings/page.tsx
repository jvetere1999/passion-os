"use client";

/**
 * Learning Settings Page
 * Configure learning preferences
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface LearnSettings {
  synthPreference: "serum" | "vital" | "both";
  dailyReviewTarget: number;
  dailyLessonTarget: number;
  showBothMappings: boolean;
  newCardsPerDay: number;
  sessionReminderTime: string | null;
}

const STORAGE_KEY = "passion_learn_settings_v1";

export default function LearnSettingsPage() {
  const [settings, setSettings] = useState<LearnSettings>({
    synthPreference: "both",
    dailyReviewTarget: 20,
    dailyLessonTarget: 1,
    showBothMappings: false,
    newCardsPerDay: 10,
    sessionReminderTime: null,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, []);

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }, [settings]);

  const updateSetting = <K extends keyof LearnSettings>(
    key: K,
    value: LearnSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Learning Settings</h1>
          <p className={styles.subtitle}>Customize your learning experience</p>
        </div>
        <Link href="/learn" className={styles.backBtn}>
          Back to Dashboard
        </Link>
      </header>

      <div className={styles.sections}>
        {/* Synth Preference */}
        <section className={styles.section}>
          <h2>Synth Preference</h2>
          <p className={styles.sectionDesc}>
            Choose which synth you want to focus on. This affects which mappings and examples are shown.
          </p>
          <div className={styles.synthOptions}>
            {(["serum", "vital", "both"] as const).map((synth) => (
              <button
                key={synth}
                className={`${styles.synthBtn} ${settings.synthPreference === synth ? styles.active : ""}`}
                onClick={() => updateSetting("synthPreference", synth)}
              >
                <span className={styles.synthName}>
                  {synth === "both" ? "Both" : synth.charAt(0).toUpperCase() + synth.slice(1)}
                </span>
                <span className={styles.synthDesc}>
                  {synth === "serum" && "Focus on Serum examples and mappings"}
                  {synth === "vital" && "Focus on Vital examples and mappings"}
                  {synth === "both" && "See examples for both synths side by side"}
                </span>
              </button>
            ))}
          </div>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={settings.showBothMappings}
              onChange={(e) => updateSetting("showBothMappings", e.target.checked)}
            />
            <span>Always show mappings for both synths (even with a preference set)</span>
          </label>
        </section>

        {/* Daily Goals */}
        <section className={styles.section}>
          <h2>Daily Goals</h2>
          <p className={styles.sectionDesc}>
            Set your daily learning targets to build consistent practice habits.
          </p>

          <div className={styles.goalGroup}>
            <label>Daily Review Target</label>
            <div className={styles.sliderRow}>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={settings.dailyReviewTarget}
                onChange={(e) => updateSetting("dailyReviewTarget", parseInt(e.target.value))}
              />
              <span className={styles.sliderValue}>{settings.dailyReviewTarget} cards</span>
            </div>
            <p className={styles.goalHint}>
              Recommended: 15-25 cards (~10-15 minutes)
            </p>
          </div>

          <div className={styles.goalGroup}>
            <label>New Cards Per Day</label>
            <div className={styles.sliderRow}>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={settings.newCardsPerDay}
                onChange={(e) => updateSetting("newCardsPerDay", parseInt(e.target.value))}
              />
              <span className={styles.sliderValue}>{settings.newCardsPerDay} cards</span>
            </div>
            <p className={styles.goalHint}>
              New cards add to your review queue over time. Start low.
            </p>
          </div>

          <div className={styles.goalGroup}>
            <label>Daily Lesson Target</label>
            <div className={styles.sliderRow}>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={settings.dailyLessonTarget}
                onChange={(e) => updateSetting("dailyLessonTarget", parseInt(e.target.value))}
              />
              <span className={styles.sliderValue}>
                {settings.dailyLessonTarget} lesson{settings.dailyLessonTarget !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </section>

        {/* Reminders */}
        <section className={styles.section}>
          <h2>Reminders</h2>
          <p className={styles.sectionDesc}>
            Get reminded to practice at a consistent time each day.
          </p>

          <div className={styles.reminderRow}>
            <label>Daily Reminder</label>
            <input
              type="time"
              value={settings.sessionReminderTime || ""}
              onChange={(e) => updateSetting("sessionReminderTime", e.target.value || null)}
              className={styles.timeInput}
            />
            {settings.sessionReminderTime && (
              <button
                className={styles.clearBtn}
                onClick={() => updateSetting("sessionReminderTime", null)}
              >
                Clear
              </button>
            )}
          </div>
          <p className={styles.goalHint}>
            Note: Browser notifications must be enabled for reminders to work.
          </p>
        </section>

        {/* Data Management */}
        <section className={styles.section}>
          <h2>Data Management</h2>
          <p className={styles.sectionDesc}>
            Manage your learning data and progress.
          </p>

          <div className={styles.dataActions}>
            <button className={styles.dataBtn}>
              Export Progress
            </button>
            <button className={styles.dataBtnDanger}>
              Reset All Progress
            </button>
          </div>
        </section>
      </div>

      <div className={styles.footer}>
        <button className={styles.saveBtn} onClick={handleSave}>
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

