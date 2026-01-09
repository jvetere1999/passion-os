"use client";

/**
 * MiniPlayer Component
 * Compact floating player with visualizer and focus timer
 * Shows on desktop when both focus and audio are active
 *
 * STORAGE RULE: Focus pause state is fetched from D1 via /api/focus/pause API.
 * localStorage is DEPRECATED for focus_paused_state (behavior-affecting data).
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  useCurrentTrack,
  usePlayerVisible,
  useIsPlaying,
  useCurrentTime,
  useDuration,
  togglePlayPause,
} from "@/lib/player";
import { AudioVisualizer } from "@/components/player/AudioVisualizerRave";
import { DISABLE_MASS_LOCAL_PERSISTENCE } from "@/lib/storage/deprecation";
import styles from "./MiniPlayer.module.css";

interface FocusSession {
  id: string;
  started_at: string;
  planned_duration: number;
  status: "active" | "completed" | "abandoned";
  mode: "focus" | "break" | "long_break";
}

interface PausedState {
  mode: "focus" | "break" | "long_break";
  timeRemaining: number;
  pausedAt: string;
}

function formatTime(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function MiniPlayer() {
  // Player state
  const track = useCurrentTrack();
  const isPlayerVisible = usePlayerVisible();
  const isPlaying = useIsPlaying();
  const _currentTime = useCurrentTime();
  const _duration = useDuration();

  // Focus state
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);
  const [pausedState, setPausedState] = useState<PausedState | null>(null);
  const [focusTimeRemaining, setFocusTimeRemaining] = useState(0);
  const [focusLoading, setFocusLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // UI state
  const [isMinimized, setIsMinimized] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);

  const isFocusActive = focusSession !== null && focusSession.status === "active";
  const isFocusPaused = !focusSession && pausedState !== null;
  const showFocus = !focusLoading && (isFocusActive || isFocusPaused);
  const showPlayer = isPlayerVisible && track;

  // Only show mini player when both focus and audio are active
  const shouldShow = showFocus && showPlayer;

  // Calculate focus progress
  const focusTotalDuration = focusSession?.planned_duration || 25 * 60;
  const focusProgress = focusTotalDuration > 0 ? 1 - (focusTimeRemaining / focusTotalDuration) : 0;

  // Get audio element reference
  useEffect(() => {
    const audioController = (window as unknown as { __audioController?: { audio: HTMLAudioElement } }).__audioController;
    if (audioController?.audio) {
      audioRef.current = audioController.audio;
    }
  }, [isPlayerVisible]);

  // Check for paused state - D1 is source of truth
  const checkPausedState = useCallback(async () => {
    // Always check D1 first (source of truth)
    try {
      const response = await fetch("/api/focus/pause");
      if (response.ok) {
        const data = await response.json() as { pauseState: PausedState | null };
        if (data.pauseState) {
          setPausedState(data.pauseState);
          setFocusTimeRemaining(data.pauseState.timeRemaining);
          return true;
        }
      }
    } catch {
      // Ignore D1 fetch errors
    }

    // Only fall back to localStorage if deprecation is disabled
    if (!DISABLE_MASS_LOCAL_PERSISTENCE) {
      try {
        const stored = localStorage.getItem("focus_paused_state");
        if (stored) {
          const parsed = JSON.parse(stored) as PausedState;
          const pausedTime = new Date(parsed.pausedAt).getTime();
          const hourAgo = Date.now() - 60 * 60 * 1000;
          if (pausedTime > hourAgo) {
            setPausedState(parsed);
            setFocusTimeRemaining(parsed.timeRemaining);
            return true;
          } else {
            localStorage.removeItem("focus_paused_state");
          }
        }
      } catch {
        localStorage.removeItem("focus_paused_state");
      }
    }

    setPausedState(null);
    return false;
  }, []);

  // Fetch active focus session
  const fetchFocusSession = useCallback(async () => {
    try {
      const response = await fetch("/api/focus/active");
      if (response.ok) {
        const data = await response.json() as { session?: FocusSession | null };
        if (data.session && data.session.status === "active") {
          setFocusSession(data.session);
          setPausedState(null);
          const startTime = new Date(data.session.started_at).getTime();
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = Math.max(0, data.session.planned_duration - elapsed);
          setFocusTimeRemaining(remaining);
        } else {
          setFocusSession(null);
          await checkPausedState();
        }
      }
    } catch (error) {
      console.error("Failed to fetch focus session:", error);
    } finally {
      setFocusLoading(false);
    }
  }, [checkPausedState]);

  // Initialize focus state
  useEffect(() => {
    checkPausedState();
    fetchFocusSession();
    const pollInterval = setInterval(fetchFocusSession, 30000);
    return () => clearInterval(pollInterval);
  }, [fetchFocusSession, checkPausedState]);

  // Focus timer countdown
  useEffect(() => {
    if (!focusSession || focusSession.status !== "active") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setFocusTimeRemaining((prev) => {
        if (prev <= 1) {
          fetchFocusSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [focusSession, fetchFocusSession]);

  if (!shouldShow) return null;

  // Circular progress SVG parameters
  const circleRadius = 16;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - focusProgress);

  return (
    <div className={`${styles.miniPlayer} ${isMinimized ? styles.minimized : ""}`}>
      <div className={styles.header}>
        <button
          className={styles.toggleBtn}
          onClick={() => setIsMinimized(!isMinimized)}
          aria-label={isMinimized ? "Expand mini player" : "Minimize mini player"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isMinimized ? (
              <polyline points="18 15 12 9 6 15" />
            ) : (
              <polyline points="6 9 12 15 18 9" />
            )}
          </svg>
        </button>
        <span className={styles.title}>Focus + Audio</span>
      </div>

      {!isMinimized && (
        <div className={styles.content}>
          {/* Focus Timer Section */}
          <div className={styles.focusSection}>
            <div className={styles.circularTimer}>
              <svg className={styles.circularSvg} viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r={circleRadius}
                  fill="none"
                  stroke="var(--color-border-primary)"
                  strokeWidth="2"
                />
                <circle
                  cx="20"
                  cy="20"
                  r={circleRadius}
                  fill="none"
                  stroke="var(--color-accent-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 20 20)"
                  className={styles.progressCircle}
                />
              </svg>
              <span className={styles.timerText}>{formatTime(focusTimeRemaining)}</span>
            </div>
            <div className={styles.focusInfo}>
              <span className={styles.focusMode}>
                {focusSession?.mode === "focus" ? "Focus" :
                 focusSession?.mode === "break" ? "Break" : "Long Break"}
              </span>
              {isFocusPaused && <span className={styles.pausedBadge}>Paused</span>}
            </div>
          </div>

          {/* Player Section */}
          <div className={styles.playerSection}>
            <div className={styles.playerControls}>
              <button
                className={styles.playBtn}
                onClick={() => togglePlayPause()}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>
              <div className={styles.trackInfo}>
                <span className={styles.trackTitle}>{track.title}</span>
                <span className={styles.trackArtist}>{track.artist || "Unknown"}</span>
              </div>
              <button
                className={`${styles.visualizerBtn} ${showVisualizer ? styles.active : ""}`}
                onClick={() => setShowVisualizer(!showVisualizer)}
                aria-label="Toggle visualizer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                  <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
                  <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
                  <path d="M9 12c1 0 3 1 3 3s-2 3-3 3-3-1-3-3 2-3 3-3" />
                  <path d="M15 12c-1 0-3 1-3 3s2 3 3 3 3-1 3-3-2-3-3-3" />
                </svg>
              </button>
            </div>

            {/* Visualizer */}
            {showVisualizer && audioRef.current && (
              <div className={styles.visualizerContainer}>
                <AudioVisualizer
                  audioElement={audioRef.current}
                  isPlaying={isPlaying}
                  onClose={() => setShowVisualizer(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
