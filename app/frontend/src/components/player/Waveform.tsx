/**
 * Waveform Component
 * Displays an audio waveform with playback progress and seek-on-click
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  generateWaveform,
  getCachedWaveform,
  getAmplitudeColor,
  formatTime,
  type WaveformData,
  type AudioAnnotations,
} from "@/lib/player";
import styles from "./Waveform.module.css";

interface WaveformProps {
  audioUrl: string;
  trackId: string;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  onAddMarker?: (time: number) => void;
  annotations?: AudioAnnotations;
  height?: number;
  barWidth?: number;
  barGap?: number;
  playedColor?: string;
  unplayedColor?: string;
  theme?: "light" | "dark";
}

export function Waveform({
  audioUrl,
  trackId,
  currentTime,
  duration,
  onSeek,
  onAddMarker,
  annotations,
  height = 40,
  barWidth: _barWidth = 2,
  barGap = 1,
  playedColor = "var(--accent-primary, #ff764d)",
  unplayedColor: _unplayedColor = "var(--bg-tertiary, #444)",
  theme = "dark",
}: WaveformProps) {
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  // Load waveform when track changes
  useEffect(() => {
    if (!trackId || !audioUrl) return;

    const cached = getCachedWaveform(trackId);
    if (cached) {
      setWaveformData(cached);
      return;
    }

    setLoading(true);
    setWaveformData(null);

    generateWaveform(audioUrl, trackId)
      .then((data) => {
        if (data) {
          setWaveformData(data);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [trackId, audioUrl]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = theme === "dark" ? "#1a1a1c" : "#f6f6f6";
    ctx.fillRect(0, 0, containerWidth, height);

    if (!waveformData || waveformData.peaks.length === 0) {
      // Placeholder line
      ctx.fillStyle = theme === "dark" ? "#333" : "#ddd";
      ctx.fillRect(0, height / 2 - 1, containerWidth, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      return;
    }

    const peaks = waveformData.normalizedPeaks || waveformData.peaks;
    const singleBarWidth = containerWidth / peaks.length;
    const centerY = height / 2;
    const progress = duration > 0 ? currentTime / duration : 0;
    const playheadX = progress * containerWidth;

    // Draw regions first (background)
    if (annotations?.regions) {
      for (const region of annotations.regions) {
        const x0 = (region.t0 / duration) * containerWidth;
        const x1 = (region.t1 / duration) * containerWidth;
        ctx.fillStyle = (region.color || "#3b82f6") + "33";
        ctx.fillRect(x0, 0, x1 - x0, height);
      }
    }

    // Draw waveform bars
    for (let i = 0; i < peaks.length; i++) {
      const peak = peaks[i];
      const barHeight = peak * (height - 8);
      const x = i * singleBarWidth;
      const y = centerY - barHeight / 2;

      // Color based on played position
      if (x < playheadX) {
        ctx.fillStyle = playedColor;
      } else {
        ctx.fillStyle = getAmplitudeColor(peak, theme);
      }

      ctx.fillRect(x, y, Math.max(1, singleBarWidth - barGap), barHeight);
    }

    // Draw markers
    if (annotations?.markers) {
      for (const marker of annotations.markers) {
        const x = (marker.t / duration) * containerWidth;
        ctx.strokeStyle = marker.color || "#f59e0b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Marker label
        if (marker.label) {
          ctx.fillStyle = marker.color || "#f59e0b";
          ctx.font = "10px system-ui";
          ctx.fillText(marker.label, x + 4, 12);
        }
      }
    }

    // Draw playhead
    if (duration > 0) {
      ctx.strokeStyle = theme === "dark" ? "#fff" : "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }

    // Draw hover position
    if (hoverPosition !== null) {
      const hoverX = hoverPosition * containerWidth;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [waveformData, currentTime, duration, containerWidth, height, barGap, playedColor, theme, annotations, hoverPosition]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onSeek || !duration || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / containerWidth));
      const time = percent * duration;
      onSeek(time);
    },
    [onSeek, duration, containerWidth]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onAddMarker || !duration || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / containerWidth));
      const time = percent * duration;
      onAddMarker(time);
    },
    [onAddMarker, duration, containerWidth]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || !duration) {
        setHoverPosition(null);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / containerWidth));
      setHoverPosition(percent);
    },
    [containerWidth, duration]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverPosition(null);
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      {loading && <div className={styles.loading}>Loading waveform...</div>}
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="slider"
        aria-label="Audio waveform"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
      />
      <div className={styles.timeDisplay}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

export default Waveform;

