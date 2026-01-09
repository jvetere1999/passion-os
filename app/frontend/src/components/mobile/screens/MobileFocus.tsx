"use client";

/**
 * Mobile Focus Screen
 */

import { useState, useEffect, useCallback } from "react";
import styles from "./MobileFocus.module.css";

interface MobileFocusProps {
  userId: string;
}

type FocusMode = "focus" | "break";

export function MobileFocus({ userId }: MobileFocusProps) {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<FocusMode>("focus");
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);

  // Timer logic
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timer complete
          setIsActive(false);
          return mode === "focus" ? breakDuration * 60 : focusDuration * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, mode, focusDuration, breakDuration]);

  const handleStart = useCallback(() => {
    setIsActive(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsActive(false);
    setTimeRemaining(mode === "focus" ? focusDuration * 60 : breakDuration * 60);
  }, [mode, focusDuration, breakDuration]);

  const handleModeSwitch = useCallback((newMode: FocusMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeRemaining(newMode === "focus" ? focusDuration * 60 : breakDuration * 60);
  }, [focusDuration, breakDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = mode === "focus"
    ? 1 - timeRemaining / (focusDuration * 60)
    : 1 - timeRemaining / (breakDuration * 60);

  // Suppress unused userId warning for now
  void userId;

  return (
    <div className={styles.screen}>
      {/* Mode Tabs */}
      <div className={styles.modeTabs}>
        <button
          className={`${styles.modeTab} ${mode === "focus" ? styles.active : ""}`}
          onClick={() => handleModeSwitch("focus")}
        >
          Focus
        </button>
        <button
          className={`${styles.modeTab} ${mode === "break" ? styles.active : ""}`}
          onClick={() => handleModeSwitch("break")}
        >
          Break
        </button>
      </div>

      {/* Timer */}
      <div className={styles.timerSection}>
        <div className={styles.timerRing}>
          <svg viewBox="0 0 100 100" className={styles.progressRing}>
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--m-border-primary)"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={mode === "focus" ? "var(--m-accent-primary)" : "#34d399"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${progress * 283} 283`}
              transform="rotate(-90 50 50)"
              className={styles.progressCircle}
            />
          </svg>
          <div className={styles.timerDisplay}>
            <span className={styles.time}>{formatTime(timeRemaining)}</span>
            <span className={styles.modeLabel}>
              {mode === "focus" ? "Focus Time" : "Break Time"}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {isActive ? (
          <button className={styles.pauseBtn} onClick={handlePause}>
            <PauseIcon />
            <span>Pause</span>
          </button>
        ) : (
          <button className={styles.startBtn} onClick={handleStart}>
            <PlayIcon />
            <span>Start</span>
          </button>
        )}
        <button className={styles.resetBtn} onClick={handleReset}>
          <ResetIcon />
          <span>Reset</span>
        </button>
      </div>

      {/* Duration Settings */}
      <div className={styles.settings}>
        <div className={styles.setting}>
          <label>Focus Duration</label>
          <div className={styles.stepper}>
            <button onClick={() => setFocusDuration((d) => Math.max(5, d - 5))}>-</button>
            <span>{focusDuration} min</span>
            <button onClick={() => setFocusDuration((d) => Math.min(60, d + 5))}>+</button>
          </div>
        </div>
        <div className={styles.setting}>
          <label>Break Duration</label>
          <div className={styles.stepper}>
            <button onClick={() => setBreakDuration((d) => Math.max(1, d - 1))}>-</button>
            <span>{breakDuration} min</span>
            <button onClick={() => setBreakDuration((d) => Math.min(30, d + 1))}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

