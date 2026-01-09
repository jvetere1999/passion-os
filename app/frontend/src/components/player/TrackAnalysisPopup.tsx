"use client";

/**
 * Track Analysis Popup
 * Shows detailed audio analysis for the current track
 * Data is cached globally in D1 for sharing across sessions
 */

import { useState, useEffect } from "react";
import { formatTime, type QueueTrack } from "@/lib/player";
import {
  getCachedAnalysis,
  generateContentHash,
  type CachedAnalysis,
} from "@/lib/player/analysis-cache";
import styles from "./TrackAnalysisPopup.module.css";

interface TrackAnalysisPopupProps {
  track: QueueTrack;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  onClose: () => void;
}

// Musical keys for display
const KEY_NAMES: Record<string, string> = {
  C: "C Major",
  "C#": "C# Major",
  D: "D Major",
  "D#": "D# Major",
  E: "E Major",
  F: "F Major",
  "F#": "F# Major",
  G: "G Major",
  "G#": "G# Major",
  A: "A Major",
  "A#": "A# Major",
  B: "B Major",
  Cm: "C Minor",
  "C#m": "C# Minor",
  Dm: "D Minor",
  "D#m": "D# Minor",
  Em: "E Minor",
  Fm: "F Minor",
  "F#m": "F# Minor",
  Gm: "G Minor",
  "G#m": "G# Minor",
  Am: "A Minor",
  "A#m": "A# Minor",
  Bm: "B Minor",
};

export function TrackAnalysisPopup({
  track,
  currentTime,
  duration,
  onSeek: _onSeek,
  onClose,
}: TrackAnalysisPopupProps) {
  const [analysis, setAnalysis] = useState<CachedAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cached analysis or compute it
  useEffect(() => {
    async function loadAnalysis() {
      setIsLoading(true);
      setError(null);

      try {
        // First try to fetch the audio and compute hash
        if (track.audioUrl) {
          const response = await fetch(track.audioUrl);
          const arrayBuffer = await response.arrayBuffer();
          const contentHash = await generateContentHash(arrayBuffer);

          // Check cache
          const cached = await getCachedAnalysis(contentHash);
          if (cached) {
            setAnalysis(cached);
            setIsLoading(false);
            return;
          }

          // TODO: If not cached, compute analysis here
          // For now, create a placeholder
          const newAnalysis: CachedAnalysis = {
            id: track.id,
            contentHash,
            name: track.title,
            durationMs: duration ? Math.round(duration * 1000) : undefined,
          };

          setAnalysis(newAnalysis);
        }
      } catch (e) {
        console.error("Failed to load analysis:", e);
        setError("Failed to load analysis data");
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalysis();
  }, [track, duration]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.trackInfo}>
            <h2 className={styles.title}>{track.title}</h2>
            {track.artist && <span className={styles.artist}>{track.artist}</span>}
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>Analyzing track...</span>
            </div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className={styles.statsGrid}>
                {/* Duration */}
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Duration</span>
                  <span className={styles.statValue}>
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Current Position */}
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Position</span>
                  <span className={styles.statValue}>
                    {formatTime(currentTime)}
                  </span>
                </div>

                {/* BPM */}
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>BPM</span>
                  <span className={styles.statValue}>
                    {analysis?.bpm ? Math.round(analysis.bpm) : "---"}
                  </span>
                </div>

                {/* Key */}
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Key</span>
                  <span className={styles.statValue}>
                    {analysis?.key ? KEY_NAMES[analysis.key] || analysis.key : "---"}
                  </span>
                </div>

                {/* Peak Level */}
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Peak</span>
                  <span className={styles.statValue}>
                    {analysis?.peakDb !== undefined
                      ? `${analysis.peakDb.toFixed(1)} dB`
                      : "---"}
                  </span>
                </div>

                {/* RMS Level */}
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>RMS</span>
                  <span className={styles.statValue}>
                    {analysis?.rmsDb !== undefined
                      ? `${analysis.rmsDb.toFixed(1)} dB`
                      : "---"}
                  </span>
                </div>

                {/* LUFS */}
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>LUFS</span>
                  <span className={styles.statValue}>
                    {analysis?.lufs !== undefined
                      ? analysis.lufs.toFixed(1)
                      : "---"}
                  </span>
                </div>

                {/* Frequency Profile */}
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Profile</span>
                  <span className={styles.statValue}>
                    {analysis?.frequencyProfile || "---"}
                  </span>
                </div>
              </div>

              {/* Waveform Preview */}
              {analysis?.waveformData && (
                <div className={styles.waveformSection}>
                  <h3 className={styles.sectionTitle}>Waveform</h3>
                  <div className={styles.waveformPreview}>
                    {analysis.waveformData.map((value, i) => (
                      <div
                        key={i}
                        className={styles.waveformBar}
                        style={{
                          height: `${Math.max(2, value * 100)}%`,
                          backgroundColor:
                            i / analysis.waveformData!.length < currentTime / duration
                              ? "var(--accent-primary)"
                              : "var(--text-muted)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* DJ Notes Section */}
              <div className={styles.notesSection}>
                <h3 className={styles.sectionTitle}>DJ Notes</h3>
                <div className={styles.notesList}>
                  <div className={styles.noteItem}>
                    <span className={styles.noteIcon}>*</span>
                    <span>
                      {analysis?.bpm
                        ? `Tempo: ${Math.round(analysis.bpm)} BPM - good for ${
                            analysis.bpm < 100
                              ? "downtempo/chill"
                              : analysis.bpm < 120
                              ? "house/disco"
                              : analysis.bpm < 140
                              ? "tech house/techno"
                              : "drum & bass/jungle"
                          }`
                        : "Tempo not detected"}
                    </span>
                  </div>
                  <div className={styles.noteItem}>
                    <span className={styles.noteIcon}>*</span>
                    <span>
                      {analysis?.frequencyProfile
                        ? `Frequency: ${analysis.frequencyProfile} - ${
                            analysis.frequencyProfile === "bass-heavy"
                              ? "great for club systems"
                              : analysis.frequencyProfile === "bright"
                              ? "cuts through the mix"
                              : analysis.frequencyProfile === "mid-focused"
                              ? "strong vocal/melodic presence"
                              : "well-balanced mix"
                          }`
                        : "Frequency analysis pending"}
                    </span>
                  </div>
                  <div className={styles.noteItem}>
                    <span className={styles.noteIcon}>*</span>
                    <span>
                      {analysis?.lufs !== undefined
                        ? `Loudness: ${analysis.lufs.toFixed(1)} LUFS - ${
                            analysis.lufs > -8
                              ? "very loud, may need gain reduction"
                              : analysis.lufs > -14
                              ? "good streaming level"
                              : "dynamic, may need gain boost"
                          }`
                        : "Loudness not measured"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.hint}>
            Analysis data is cached and shared across sessions
          </span>
        </div>
      </div>
    </div>
  );
}

