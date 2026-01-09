"use client";

/**
 * STORAGE RULE: Focus pause state is fetched from D1 via /api/focus/pause API.
 * localStorage is DEPRECATED for focus_paused_state (behavior-affecting data).
 * focus_settings (cosmetic only) remains in localStorage.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { FocusTracks } from "@/components/focus";
import { markMomentumShown } from "@/lib/today/momentum";
import { activateSoftLanding } from "@/lib/today/softLanding";
import { isTodaySoftLandingEnabled } from "@/lib/flags";
import { DISABLE_MASS_LOCAL_PERSISTENCE } from "@/lib/storage/deprecation";
import styles from "./page.module.css";

// Types
type FocusMode = "focus" | "break" | "long_break";
type TimerStatus = "idle" | "running" | "paused";
type ViewMode = "timer" | "history" | "settings";

interface FocusSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  planned_duration: number;
  actual_duration: number | null;
  status: "active" | "completed" | "abandoned";
  mode: FocusMode;
}

interface FocusStats {
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number;
  streak: number;
  todayFocusTime?: number;
  weekFocusTime?: number;
}

interface WeeklyData {
  day: string;
  minutes: number;
  sessions: number;
}

interface FocusClientProps {
  initialStats?: FocusStats;
  initialSession?: FocusSession | null;
}

interface TimerSettings {
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
};

const MODE_LABELS: Record<FocusMode, string> = {
  focus: "Focus",
  break: "Break",
  long_break: "Long Break",
};

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Format seconds to human readable
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Get day of week label
function getDayLabel(dayIndex: number): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[dayIndex];
}

// Generate weekly data from sessions
function generateWeeklyData(sessions: FocusSession[]): WeeklyData[] {
  const today = new Date();
  const weekData: WeeklyData[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const daySessions = sessions.filter((s) => {
      const sessionDate = new Date(s.started_at);
      return sessionDate >= dayStart && sessionDate < dayEnd && s.status === "completed";
    });

    const totalMinutes = daySessions.reduce((sum, s) => {
      return sum + Math.floor((s.actual_duration || 0) / 60);
    }, 0);

    weekData.push({
      day: getDayLabel(date.getDay()),
      minutes: totalMinutes,
      sessions: daySessions.length,
    });
  }

  return weekData;
}

export function FocusClient({ initialStats, initialSession }: FocusClientProps) {

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("timer");

  // Timer settings
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [editingSettings, setEditingSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);

  // Calculate durations from settings (in seconds)
  const getDurations = useCallback(() => ({
    focus: settings.focusDuration * 60,
    break: settings.breakDuration * 60,
    long_break: settings.longBreakDuration * 60,
  }), [settings]);

  // Timer state
  const [mode, setMode] = useState<FocusMode>("focus");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [timeRemaining, setTimeRemaining] = useState(settings.focusDuration * 60);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(initialSession || null);

  // Stats state
  const [stats, setStats] = useState<FocusStats>(initialStats || {
    totalSessions: 0,
    completedSessions: 0,
    totalFocusTime: 0,
    streak: 0,
  });

  // History state
  const [sessionHistory, setSessionHistory] = useState<FocusSession[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Loading state for timer actions (FO-01: loading feedback)
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Refs for timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Calculate progress (0 to 1)
  const durations = getDurations();
  const totalDuration = durations[mode];
  const progress = 1 - timeRemaining / totalDuration;
  const circumference = 2 * Math.PI * 90; // r=90
  const strokeDashoffset = circumference * (1 - progress);

  // Fetch stats on mount
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/focus?stats=true&period=day");
      if (response.ok) {
        const data = await response.json() as {
          totalSessions?: number;
          completedSessions?: number;
          totalFocusTime?: number;
        };
        setStats({
          totalSessions: data.totalSessions || 0,
          completedSessions: data.completedSessions || 0,
          totalFocusTime: data.totalFocusTime || 0,
          streak: 0, // TODO: Calculate streak
        });
      }
    } catch (error) {
      console.error("Failed to fetch focus stats:", error);
    }
  }, []);

  // Check for active session on mount
  const checkActiveSession = useCallback(async () => {
    try {
      const response = await fetch("/api/focus/active");
      if (response.ok) {
        const data = await response.json() as { session?: FocusSession | null };
        if (data.session) {
          setCurrentSession(data.session);
          setMode(data.session.mode);

          // Calculate remaining time
          const startTime = new Date(data.session.started_at).getTime();
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = Math.max(0, data.session.planned_duration - elapsed);

          setTimeRemaining(remaining);
          if (remaining > 0) {
            setStatus("running");
          }
        }
      }
    } catch (error) {
      console.error("Failed to check active session:", error);
    }
  }, []);

  // Fetch session history
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch("/api/focus?pageSize=50");
      if (response.ok) {
        const data = await response.json() as { items?: FocusSession[] };
        const sessions = data.items || [];
        setSessionHistory(sessions);
        setWeeklyData(generateWeeklyData(sessions));
      }
    } catch (error) {
      console.error("Failed to fetch session history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Load settings from localStorage (cosmetic, allowed)
  useEffect(() => {
    const savedSettings = localStorage.getItem("focus_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as TimerSettings;
        setSettings(parsed);
        setEditingSettings(parsed);
        setTimeRemaining(parsed.focusDuration * 60);
      } catch {
        // Use defaults
      }
    }

    // Load paused state from D1 (source of truth)
    fetch("/api/focus/pause")
      .then((res) => res.json())
      .then((data) => {
        const typedData = data as { pauseState?: { mode: FocusMode; timeRemaining: number; pausedAt: string } | null };
        if (typedData.pauseState) {
          setMode(typedData.pauseState.mode);
          setTimeRemaining(typedData.pauseState.timeRemaining);
          setStatus("paused");
        } else if (!DISABLE_MASS_LOCAL_PERSISTENCE) {
          // Only check localStorage if deprecation is disabled
          const pausedState = localStorage.getItem("focus_paused_state");
          if (pausedState) {
            try {
              const parsed = JSON.parse(pausedState) as {
                mode: FocusMode;
                timeRemaining: number;
                pausedAt: string;
              };
              const pausedTime = new Date(parsed.pausedAt).getTime();
              const hourAgo = Date.now() - 60 * 60 * 1000;
              if (pausedTime > hourAgo) {
                setMode(parsed.mode);
                setTimeRemaining(parsed.timeRemaining);
                setStatus("paused");
              } else {
                localStorage.removeItem("focus_paused_state");
              }
            } catch {
              localStorage.removeItem("focus_paused_state");
            }
          }
        }
      })
      .catch(console.error);
  }, []);

  // Save paused state to D1 (source of truth)
  useEffect(() => {
    if (status === "paused") {
      const pausedState = {
        mode,
        timeRemaining,
        pausedAt: new Date().toISOString(),
      };

      // Only write to localStorage if deprecation is disabled
      if (!DISABLE_MASS_LOCAL_PERSISTENCE) {
        localStorage.setItem("focus_paused_state", JSON.stringify(pausedState));
      }

      // Sync to D1 for cross-device and refresh persistence
      fetch("/api/focus/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          mode,
          timeRemaining,
        }),
      }).catch((err) => console.error("Failed to sync pause state:", err));
    } else if (status === "running" || status === "idle") {
      // Clear paused state when running or idle
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("focus_paused_state");
      }

      // Also clear from D1
      fetch("/api/focus/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      }).catch((err) => console.error("Failed to clear pause state:", err));
    }
  }, [status, mode, timeRemaining]);

  useEffect(() => {
    fetchStats();
    checkActiveSession();
    fetchHistory();
  }, [fetchStats, checkActiveSession, fetchHistory]);

  // Handle timer completion
  const handleTimerComplete = useCallback(async () => {
    setStatus("idle");

    // Play notification sound (optional)
    try {
      const audio = new Audio("/sounds/timer-complete.mp3");
      audio.play().catch(() => {});
    } catch {
      // Ignore audio errors
    }

    // Show notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`${MODE_LABELS[mode]} Complete!`, {
        body: mode === "focus" ? "Time for a break!" : "Ready to focus?",
        icon: "/icon-192.png",
      });
    }

    // Complete session in database
    // Note: XP and coins are awarded server-side via activity events
    if (currentSession) {
      try {
        await fetch(`/api/focus/${currentSession.id}/complete`, {
          method: "POST",
        });
        setCurrentSession(null);
        fetchStats();

        // Mark momentum as shown for first completion in session
        // This triggers the momentum banner on the Today page
        if (mode === "focus") {
          markMomentumShown();

          // Activate soft landing mode for reduced-choice Today
          if (isTodaySoftLandingEnabled()) {
            activateSoftLanding("focus");
          }
        }
      } catch (error) {
        console.error("Failed to complete session:", error);
      }
    }

    // Auto-switch mode
    if (mode === "focus") {
      const sessionsBeforeLong = settings.sessionsBeforeLongBreak;
      const nextMode = stats.completedSessions > 0 && (stats.completedSessions + 1) % sessionsBeforeLong === 0
        ? "long_break"
        : "break";
      setMode(nextMode);
      const nextDurations = getDurations();
      setTimeRemaining(nextDurations[nextMode]);

      // Auto-start break if enabled
      if (settings.autoStartBreaks) {
        setTimeout(() => setStatus("running"), 1000);
      }
    } else {
      setMode("focus");
      const nextDurations = getDurations();
      setTimeRemaining(nextDurations.focus);

      // Auto-start focus if enabled
      if (settings.autoStartFocus) {
        setTimeout(() => setStatus("running"), 1000);
      }
    }

    // Refresh history
    fetchHistory();
  }, [mode, currentSession, stats.completedSessions, fetchStats, fetchHistory, settings, getDurations]);

  // Timer tick effect
  useEffect(() => {
    if (status === "running") {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer complete - will be handled by separate effect
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  // Effect to handle timer reaching zero
  useEffect(() => {
    if (timeRemaining === 0 && status === "running") {
      handleTimerComplete();
    }
  }, [timeRemaining, status, handleTimerComplete]);

  // Update document title with timer
  useEffect(() => {
    if (status === "running" || status === "paused") {
      const statusPrefix = status === "paused" ? "(Paused) " : "";
      document.title = `${statusPrefix}${formatTime(timeRemaining)} - ${MODE_LABELS[mode]} | Focus`;
    } else {
      document.title = "Focus | Ignition";
    }

    return () => {
      document.title = "Focus | Ignition";
    };
  }, [timeRemaining, status, mode]);

  // Start timer
  const handleStart = async () => {
    if (status === "paused") {
      setStatus("running");
      return;
    }

    setIsActionLoading(true);
    setStatus("running");
    startTimeRef.current = Date.now();

    // Create session in database
    try {
      const response = await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          planned_duration: durations[mode],
        }),
      });

      if (response.ok) {
        const data = await response.json() as { session?: FocusSession };
        if (data.session) {
          setCurrentSession(data.session);
        }
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Pause timer
  const handlePause = () => {
    setStatus("paused");
  };

  // Reset timer
  const handleReset = async () => {
    setIsActionLoading(true);
    setStatus("idle");
    setTimeRemaining(durations[mode]);

    // Abandon session if active
    if (currentSession) {
      try {
        await fetch(`/api/focus/${currentSession.id}/abandon`, {
          method: "POST",
        });
        setCurrentSession(null);

        // Activate soft landing mode on abandon (if focus mode)
        if (mode === "focus" && isTodaySoftLandingEnabled()) {
          activateSoftLanding("focus");
        }
      } catch (error) {
        console.error("Failed to abandon session:", error);
      }
    }
    setIsActionLoading(false);
  };

  // Skip to next mode
  const handleSkip = async () => {
    // Abandon current session
    if (currentSession) {
      try {
        await fetch(`/api/focus/${currentSession.id}/abandon`, {
          method: "POST",
        });
        setCurrentSession(null);

        // Activate soft landing mode on skip/abandon (if focus mode)
        if (mode === "focus" && isTodaySoftLandingEnabled()) {
          activateSoftLanding("focus");
        }
      } catch (error) {
        console.error("Failed to abandon session:", error);
      }
    }

    setStatus("idle");

    // Switch to next mode
    if (mode === "focus") {
      const sessionsBeforeLong = settings.sessionsBeforeLongBreak;
      const nextMode = stats.completedSessions > 0 && stats.completedSessions % sessionsBeforeLong === 0
        ? "long_break"
        : "break";
      setMode(nextMode);
      setTimeRemaining(durations[nextMode]);
    } else {
      setMode("focus");
      setTimeRemaining(durations.focus);
    }
  };

  // Change mode
  const handleModeChange = (newMode: FocusMode) => {
    if (status === "running") return; // Can't change mode while running
    setMode(newMode);
    setTimeRemaining(durations[newMode]);
    setStatus("idle");
  };

  // Save settings
  const handleSaveSettings = () => {
    setSettings(editingSettings);
    localStorage.setItem("focus_settings", JSON.stringify(editingSettings));
    // Update timer if idle
    if (status === "idle") {
      const newDurations = {
        focus: editingSettings.focusDuration * 60,
        break: editingSettings.breakDuration * 60,
        long_break: editingSettings.longBreakDuration * 60,
      };
      setTimeRemaining(newDurations[mode]);
    }
    setViewMode("timer");
  };

  // Reset settings to default
  const handleResetSettings = () => {
    setEditingSettings(DEFAULT_SETTINGS);
  };

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className={styles.page}>
      {/* View Mode Tabs */}
      <div className={styles.viewTabs}>
        <button
          className={`${styles.viewTab} ${viewMode === "timer" ? styles.active : ""}`}
          onClick={() => setViewMode("timer")}
        >
          Timer
        </button>
        <button
          className={`${styles.viewTab} ${viewMode === "history" ? styles.active : ""}`}
          onClick={() => setViewMode("history")}
        >
          History
        </button>
        <button
          className={`${styles.viewTab} ${viewMode === "settings" ? styles.active : ""}`}
          onClick={() => setViewMode("settings")}
        >
          Settings
        </button>
      </div>

      {/* Persistent Mini Timer (visible when not on timer view and session is active) */}
      {viewMode !== "timer" && status === "running" && (
        <div className={styles.miniTimer}>
          <div className={styles.miniTimerContent}>
            <span className={styles.miniTimerTime}>{formatTime(timeRemaining)}</span>
            <span className={styles.miniTimerLabel}>{MODE_LABELS[mode]}</span>
          </div>
          <button
            className={styles.miniTimerButton}
            onClick={() => setViewMode("timer")}
          >
            View
          </button>
        </div>
      )}

      {/* Timer View */}
      {viewMode === "timer" && (
        <>
          <div className={styles.timerContainer}>
            <div className={styles.timer}>
              <div className={styles.timerRing}>
                <svg viewBox="0 0 200 200" className={styles.timerSvg}>
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="var(--color-border-secondary)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke={mode === "focus" ? "var(--color-accent-primary)" : "var(--color-success)"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 100 100)"
                    className={styles.progressRing}
                  />
                </svg>
                <div className={styles.timerContent}>
                  <span className={styles.timerTime}>{formatTime(timeRemaining)}</span>
                  <span className={styles.timerLabel}>{MODE_LABELS[mode]}</span>
                  {status === "running" && (
                    <span className={styles.timerStatus}>Running</span>
                  )}
                  {status === "paused" && (
                    <span className={styles.timerStatus}>Paused</span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.controls}>
              <button
                className={styles.controlButton}
                onClick={handleReset}
                aria-label="Reset"
                disabled={isActionLoading || (status === "idle" && timeRemaining === durations[mode])}
              >
                {isActionLoading ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" className={styles.spinner}>
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                )}
              </button>

              {status === "running" ? (
                <button className={styles.playButton} onClick={handlePause} aria-label="Pause" disabled={isActionLoading}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                </button>
              ) : (
                <button className={styles.playButton} onClick={handleStart} aria-label="Start" disabled={isActionLoading}>
                  {isActionLoading ? (
                    <svg width="32" height="32" viewBox="0 0 24 24" className={styles.spinner}>
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" />
                    </svg>
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>
              )}

              <button className={styles.controlButton} onClick={handleSkip} aria-label="Skip" disabled={isActionLoading}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 4 15 12 5 20 5 4" />
                  <line x1="19" y1="5" x2="19" y2="19" />
                </svg>
              </button>
            </div>

            <div className={styles.modeSelector}>
              <button
                className={`${styles.modeButton} ${mode === "focus" ? styles.active : ""}`}
                onClick={() => handleModeChange("focus")}
                disabled={status === "running"}
              >
                Focus
              </button>
              <button
                className={`${styles.modeButton} ${mode === "break" ? styles.active : ""}`}
                onClick={() => handleModeChange("break")}
                disabled={status === "running"}
              >
                Break
              </button>
              <button
                className={`${styles.modeButton} ${mode === "long_break" ? styles.active : ""}`}
                onClick={() => handleModeChange("long_break")}
                disabled={status === "running"}
              >
                Long Break
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.completedSessions}</span>
              <span className={styles.statLabel}>Sessions Today</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{formatDuration(stats.totalFocusTime)}</span>
              <span className={styles.statLabel}>Focus Time</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.streak}</span>
              <span className={styles.statLabel}>Streak</span>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className={styles.weeklyChart}>
            <h3 className={styles.sectionTitle}>This Week</h3>
            <div className={styles.chartContainer}>
              {weeklyData.map((day, index) => {
                const maxMinutes = Math.max(...weeklyData.map((d) => d.minutes), 60);
                const heightPercent = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
                return (
                  <div key={index} className={styles.chartBar}>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.bar}
                        style={{ height: `${Math.max(heightPercent, 2)}%` }}
                        title={`${day.minutes} min, ${day.sessions} sessions`}
                      />
                    </div>
                    <span className={styles.barLabel}>{day.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Focus Music */}
          <FocusTracks />
        </>
      )}

      {/* History View */}
      {viewMode === "history" && (
        <div className={styles.historySection}>
          <h3 className={styles.sectionTitle}>Session History</h3>
          {historyLoading ? (
            <div className={styles.loadingState}>Loading...</div>
          ) : sessionHistory.length === 0 ? (
            <div className={styles.emptyState}>No sessions recorded yet. Start your first focus session!</div>
          ) : (
            <div className={styles.historyList}>
              {sessionHistory.map((session) => (
                <div key={session.id} className={styles.historyItem}>
                  <div className={styles.historyInfo}>
                    <span className={`${styles.historyMode} ${styles[session.mode]}`}>
                      {MODE_LABELS[session.mode]}
                    </span>
                    <span className={styles.historyDate}>{formatDate(session.started_at)}</span>
                  </div>
                  <div className={styles.historyDetails}>
                    <span className={`${styles.historyStatus} ${styles[session.status]}`}>
                      {session.status === "completed" ? "Completed" : session.status === "abandoned" ? "Abandoned" : "Active"}
                    </span>
                    <span className={styles.historyDuration}>
                      {session.actual_duration ? formatDuration(session.actual_duration) : formatDuration(session.planned_duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings View */}
      {viewMode === "settings" && (
        <div className={styles.settingsSection}>
          <h3 className={styles.sectionTitle}>Timer Settings</h3>
          <div className={styles.settingsForm}>
            <div className={styles.settingRow}>
              <label className={styles.settingLabel}>Focus Duration (minutes)</label>
              <input
                type="number"
                className={styles.settingInput}
                min="1"
                max="120"
                value={editingSettings.focusDuration}
                onChange={(e) => setEditingSettings({ ...editingSettings, focusDuration: parseInt(e.target.value) || 25 })}
              />
            </div>
            <div className={styles.settingRow}>
              <label className={styles.settingLabel}>Short Break (minutes)</label>
              <input
                type="number"
                className={styles.settingInput}
                min="1"
                max="30"
                value={editingSettings.breakDuration}
                onChange={(e) => setEditingSettings({ ...editingSettings, breakDuration: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className={styles.settingRow}>
              <label className={styles.settingLabel}>Long Break (minutes)</label>
              <input
                type="number"
                className={styles.settingInput}
                min="1"
                max="60"
                value={editingSettings.longBreakDuration}
                onChange={(e) => setEditingSettings({ ...editingSettings, longBreakDuration: parseInt(e.target.value) || 15 })}
              />
            </div>
            <div className={styles.settingRow}>
              <label className={styles.settingLabel}>Long Break After (sessions)</label>
              <input
                type="number"
                className={styles.settingInput}
                min="2"
                max="10"
                value={editingSettings.sessionsBeforeLongBreak}
                onChange={(e) => setEditingSettings({ ...editingSettings, sessionsBeforeLongBreak: parseInt(e.target.value) || 4 })}
              />
            </div>
            <div className={styles.settingRow}>
              <label className={styles.settingLabel}>Auto-start Breaks</label>
              <button
                type="button"
                className={`${styles.toggleButton} ${editingSettings.autoStartBreaks ? styles.active : ""}`}
                onClick={() => setEditingSettings({ ...editingSettings, autoStartBreaks: !editingSettings.autoStartBreaks })}
              >
                {editingSettings.autoStartBreaks ? "On" : "Off"}
              </button>
            </div>
            <div className={styles.settingRow}>
              <label className={styles.settingLabel}>Auto-start Focus</label>
              <button
                type="button"
                className={`${styles.toggleButton} ${editingSettings.autoStartFocus ? styles.active : ""}`}
                onClick={() => setEditingSettings({ ...editingSettings, autoStartFocus: !editingSettings.autoStartFocus })}
              >
                {editingSettings.autoStartFocus ? "On" : "Off"}
              </button>
            </div>
          </div>
          <div className={styles.settingsActions}>
            <button className={styles.secondaryButton} onClick={handleResetSettings}>
              Reset to Defaults
            </button>
            <button className={styles.primaryButton} onClick={handleSaveSettings}>
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

