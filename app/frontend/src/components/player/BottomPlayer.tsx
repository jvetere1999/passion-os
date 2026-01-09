/**
 * BottomPlayer Component
 * Global persistent audio player that appears at the bottom of the screen
 */

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  usePlayerStore,
  useCurrentTrack,
  usePlayerVisible,
  useIsPlaying,
  usePlayerSettings,
  useCurrentTime,
  useDuration,
  initAudioController,
  loadAndPlay,
  togglePlayPause,
  pause,
  seek,
  setVolume,
  loadPlayerSettings,
  savePlayerSettings,
  loadQueueState,
  saveQueueState,
  saveQueueStateImmediate,
  migratePlayerStorage,
  clearQueueState,
  formatTime,
} from "@/lib/player";
import { Waveform } from "./Waveform";
import { AudioVisualizer } from "./AudioVisualizerRave";
import styles from "./BottomPlayer.module.css";

// Lazy import to avoid circular dependency
import dynamic from "next/dynamic";
const TrackAnalysisPopup = dynamic(
  () => import("./TrackAnalysisPopup").then((mod) => mod.TrackAnalysisPopup),
  { ssr: false }
);

export function BottomPlayer() {
  const track = useCurrentTrack();
  const isVisible = usePlayerVisible();
  const isPlaying = useIsPlaying();
  const settings = usePlayerSettings();
  const currentTime = useCurrentTime();
  const duration = useDuration();

  const lastLoadedTrackId = useRef<string | null>(null);
  const queueRestored = useRef(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Add padding to body when player is visible
  useEffect(() => {
    if (isVisible && !isMinimized) {
      document.body.style.paddingBottom = "90px";
    } else if (isVisible && isMinimized) {
      document.body.style.paddingBottom = "48px";
    } else {
      document.body.style.paddingBottom = "";
    }
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [isVisible, isMinimized]);

  // Initialize audio on mount - use getState to avoid dependency on store
  useEffect(() => {
    initAudioController();
    migratePlayerStorage();

    // Load saved settings
    const savedSettings = loadPlayerSettings();
    usePlayerStore.getState().updateSettings(savedSettings);
    setVolume(savedSettings.volume);

    // Restore queue state
    const savedQueue = loadQueueState();
    if (savedQueue && savedQueue.queue.length > 0) {
      usePlayerStore.getState().restoreQueue(
        savedQueue.queue,
        savedQueue.queueIndex,
        savedQueue.currentTime
      );
      queueRestored.current = true;
    }
  }, []); // Empty dependency array - only run once on mount

  // Load new track when it changes
  useEffect(() => {
    const state = usePlayerStore.getState();
    if (
      state.currentTrack &&
      state.status === "loading" &&
      state.currentTrack.id !== lastLoadedTrackId.current
    ) {
      lastLoadedTrackId.current = state.currentTrack.id;
      loadAndPlay(state.currentTrack.audioUrl);
    }
  }, [track]);

  // Subscribe to store changes for queue persistence
  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe((state) => {
      if (state.queue.length > 0) {
        saveQueueState(state.queue, state.queueIndex, state.currentTime);
      }
    });

    return () => unsubscribe();
  }, []);

  // Save queue before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = usePlayerStore.getState();
      if (state.queue.length > 0) {
        saveQueueStateImmediate(
          state.queue,
          state.queueIndex,
          state.currentTime
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);


  const handleSeek = useCallback((time: number) => {
    seek(time);
  }, []);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setVolume(value);
      usePlayerStore.getState().updateSettings({ volume: value });
      savePlayerSettings({ ...settings, volume: value });
    },
    [settings]
  );

  const handlePrevious = useCallback(() => {
    usePlayerStore.getState().previous();
  }, []);

  const handleNext = useCallback(() => {
    usePlayerStore.getState().next();
  }, []);

  const handleToggleRepeat = useCallback(() => {
    const modes: ("off" | "one" | "all")[] = ["off", "one", "all"];
    const currentIndex = modes.indexOf(settings.repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];

    usePlayerStore.getState().updateSettings({ repeatMode: nextMode });
    savePlayerSettings({ ...settings, repeatMode: nextMode });
  }, [settings]);

  const handleClose = useCallback(() => {
    pause();
    usePlayerStore.getState().clearQueue();
    clearQueueState();
    lastLoadedTrackId.current = null;
    usePlayerStore.getState().setVisible(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  // Analysis panel state
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get audio element reference
  useEffect(() => {
    // Access audio element from the player store/controller
    const audioController = (window as unknown as { __audioController?: { audio: HTMLAudioElement } }).__audioController;
    if (audioController?.audio) {
      audioRef.current = audioController.audio;
    }
  }, [isVisible]);

  const handleToggleAnalysis = useCallback(() => {
    setShowAnalysisPanel((prev) => !prev);
  }, []);

  const handleToggleVisualizer = useCallback(() => {
    setShowVisualizer((prev) => !prev);
  }, []);

  const handleCloseAnalysis = useCallback(() => {
    setShowAnalysisPanel(false);
  }, []);


  if (!isVisible || !track) {
    return null;
  }

  // Minimized view
  if (isMinimized) {
    return (
      <div
        className={`${styles.player} ${styles.minimized}`}
        role="region"
        aria-label="Audio player (minimized)"
      >
        <div className={styles.minimizedControls}>
          <button
            className={`${styles.controlButton} ${styles.playButtonMini}`}
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
            type="button"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className={styles.minimizedInfo}>
            <span className={styles.minimizedTitle}>{track.title}</span>
            <span className={styles.minimizedTime}>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <button
            className={styles.expandButton}
            onClick={handleMinimize}
            aria-label="Expand player"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
            </svg>
          </button>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close player"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.player} role="region" aria-label="Audio player">
      {/* Waveform display */}
      {track.audioUrl && (
        <div className={styles.waveformWrapper}>
          <Waveform
            audioUrl={track.audioUrl}
            trackId={track.id}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            height={32}
            barWidth={2}
            barGap={1}
          />
        </div>
      )}

      {/* Controls row */}
      <div className={styles.controls}>
        {/* Track info */}
        <div className={styles.trackInfo}>
          <div className={styles.trackTitle}>{track.title}</div>
          {track.artist && (
            <div className={styles.trackArtist}>{track.artist}</div>
          )}
        </div>

        {/* Playback controls */}
        <div className={styles.playbackControls}>
          <button
            className={styles.controlButton}
            onClick={handlePrevious}
            aria-label="Previous track"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            className={`${styles.controlButton} ${styles.playButton}`}
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
            type="button"
          >
            {isPlaying ? (
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="24"
                height="24"
              >
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="24"
                height="24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            className={styles.controlButton}
            onClick={handleNext}
            aria-label="Next track"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Time display */}
        <div className={styles.timeDisplay}>
          <span>{formatTime(currentTime)}</span>
          <span className={styles.timeSeparator}>/</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Secondary controls */}
        <div className={styles.secondaryControls}>
          {/* Repeat button */}
          <button
            className={`${styles.controlButton} ${settings.repeatMode !== "off" ? styles.active : ""}`}
            onClick={handleToggleRepeat}
            aria-label={`Repeat: ${settings.repeatMode}`}
            title={`Repeat: ${settings.repeatMode}`}
            type="button"
          >
            {settings.repeatMode === "one" ? (
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="18"
                height="18"
              >
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                <text x="12" y="14" fontSize="8" textAnchor="middle">
                  1
                </text>
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="18"
                height="18"
              >
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
              </svg>
            )}
          </button>

          {/* Volume control */}
          <div className={styles.volumeControl}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.volume}
              onChange={handleVolumeChange}
              className={styles.volumeSlider}
              aria-label="Volume"
            />
          </div>

          {/* Analysis button */}
          <button
            className={`${styles.analyzeButton} ${showAnalysisPanel ? styles.active : ""}`}
            onClick={handleToggleAnalysis}
            aria-label="Open analysis panel"
            title="Analyze track"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
            </svg>
          </button>

          {/* Visualizer button */}
          <button
            className={`${styles.analyzeButton} ${showVisualizer ? styles.active : ""}`}
            onClick={handleToggleVisualizer}
            aria-label="Toggle visualizer"
            title="Audio Visualizer"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M4 9v6h2V9H4zm4-3v12h2V6H8zm4-2v16h2V4h-2zm4 4v8h2v-8h-2zm4 2v4h2v-4h-2z" />
            </svg>
          </button>

          {/* Minimize button */}
          <button
            className={styles.minimizeButton}
            onClick={handleMinimize}
            aria-label="Minimize player"
            title="Minimize"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
            </svg>
          </button>

          {/* Close button */}
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close player"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Track Analysis Popup */}
      {showAnalysisPanel && (
        <TrackAnalysisPopup
          track={track}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          onClose={handleCloseAnalysis}
        />
      )}

      {/* Audio Visualizer */}
      {showVisualizer && (
        <div className={styles.visualizerPanel}>
          <AudioVisualizer
            audioElement={audioRef.current}
            isPlaying={isPlaying}
            onClose={() => setShowVisualizer(false)}
          />
        </div>
      )}
    </div>
  );
}

export default BottomPlayer;

