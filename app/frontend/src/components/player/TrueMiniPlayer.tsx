"use client";

/**
 * TrueMiniPlayer Component
 * A floating, compact audio player with waveform visualization
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  usePlayerStore,
  useCurrentTrack,
  usePlayerVisible,
  useIsPlaying,
  useCurrentTime,
  useDuration,
  togglePlayPause,
  pause,
  seek,
  formatTime,
  initAudioController,
  loadPlayerSettings,
  setVolume,
  loadQueueState,
  migratePlayerStorage,
  loadAndPlay,
} from "@/lib/player";
import styles from "./TrueMiniPlayer.module.css";

export function TrueMiniPlayer() {
  const track = useCurrentTrack();
  const isPlayerVisible = usePlayerVisible();
  const isPlaying = useIsPlaying();
  const currentTime = useCurrentTime();
  const duration = useDuration();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const audioInitialized = useRef(false);
  const lastLoadedTrackId = useRef<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize audio controller
  useEffect(() => {
    if (audioInitialized.current) return;
    audioInitialized.current = true;

    initAudioController();
    migratePlayerStorage();

    const savedSettings = loadPlayerSettings();
    usePlayerStore.getState().updateSettings(savedSettings);
    setVolume(savedSettings.volume);

    const savedQueue = loadQueueState();
    if (savedQueue && savedQueue.queue.length > 0) {
      usePlayerStore.getState().restoreQueue(
        savedQueue.queue,
        savedQueue.queueIndex,
        savedQueue.currentTime
      );
    }
  }, []);

  // Load new track
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

  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        // Gradient from accent to a lighter color
        const hue = 220 + (i / bufferLength) * 40;
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    draw();
  }, []);

  // Setup audio analyser for visualizer
  useEffect(() => {
    if (!showVisualizer) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const audioController = (window as unknown as { __audioController?: { audio: HTMLAudioElement; context?: AudioContext; analyser?: AnalyserNode } }).__audioController;

    if (!audioController?.audio) return;

    try {
      // Create or get audio context
      let audioContext = audioController.context;
      let analyser = audioController.analyser;

      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audioController.audio);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        audioController.context = audioContext;
        audioController.analyser = analyser;
      }

      if (analyser) {
        analyserRef.current = analyser;
        drawVisualizer();
      }
    } catch (err) {
      console.error("[TrueMiniPlayer] Failed to setup analyser:", err);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showVisualizer, drawVisualizer]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const seekTime = percent * duration;
    seek(seekTime);
  }, [duration]);

  const handleClose = useCallback(() => {
    pause();
    usePlayerStore.getState().clearQueue();
    usePlayerStore.getState().setVisible(false);
  }, []);

  if (!isPlayerVisible || !track) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`${styles.miniPlayer} ${isExpanded ? styles.expanded : ""}`}>
      {/* Compact view */}
      <div className={styles.compactView}>
        {/* Play/Pause button */}
        <button className={styles.playBtn} onClick={togglePlayPause} aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progress bar with waveform-style look */}
        <div className={styles.progressWrapper} onClick={handleSeek}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            {/* Simulated waveform bars */}
            <div className={styles.waveformBars}>
              {Array.from({ length: 30 }).map((_, i) => {
                const height = 20 + Math.sin(i * 0.5) * 40 + Math.random() * 20;
                return (
                  <div
                    key={i}
                    className={styles.waveformBar}
                    style={{
                      height: `${height}%`,
                      opacity: (i / 30) * 100 < progress ? 1 : 0.4,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Track info */}
        <div className={styles.trackInfo}>
          <span className={styles.trackTitle}>{track.title}</span>
          <span className={styles.trackTime}>{formatTime(currentTime)}</span>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <button
            className={`${styles.controlBtn} ${showVisualizer ? styles.active : ""}`}
            onClick={() => setShowVisualizer(!showVisualizer)}
            aria-label="Visualizer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M4 9v6h2V9H4zm4-3v12h2V6H8zm4-2v16h2V4h-2zm4 4v8h2v-8h-2zm4 2v4h2v-4h-2z" />
            </svg>
          </button>
          <button className={styles.controlBtn} onClick={() => setIsExpanded(!isExpanded)} aria-label="Expand">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              {isExpanded ? (
                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
              ) : (
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              )}
            </svg>
          </button>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded visualizer view */}
      {isExpanded && showVisualizer && (
        <div className={styles.visualizerSection}>
          <canvas
            ref={canvasRef}
            width={280}
            height={60}
            className={styles.visualizerCanvas}
          />
        </div>
      )}
    </div>
  );
}

export default TrueMiniPlayer;
