/**
 * Track Visualizer Component
 *
 * Renders waveform, annotations, and regions for a reference track.
 * Audio access is via backend signed URLs - never R2 credentials.
 */

'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { AnnotationResponse, RegionResponse, FrameManifestResponse, AnalysisEvent } from '@/lib/api/reference-tracks';
import styles from './TrackVisualizer.module.css';

// ============================================
// Types
// ============================================

export interface TrackVisualizerProps {
  /** Stream URL from backend (signed) */
  streamUrl: string | null;
  /** Track duration in seconds */
  duration: number;
  /** Annotations to display */
  annotations: AnnotationResponse[];
  /** Regions to display */
  regions: RegionResponse[];
  /** Analysis events (beats, transients, etc.) */
  events?: AnalysisEvent[];
  /** Frame manifest for rendering */
  manifest?: FrameManifestResponse | null;
  /** Loudness data for waveform */
  loudnessData?: Float32Array | null;
  /** Current playback time in seconds */
  currentTime?: number;
  /** Called when user seeks */
  onSeek?: (timeSeconds: number) => void;
  /** Called when user clicks to add annotation */
  onAddAnnotation?: (startMs: number, endMs?: number) => void;
  /** Called when user clicks annotation */
  onAnnotationClick?: (annotation: AnnotationResponse) => void;
  /** Called when user clicks region */
  onRegionClick?: (region: RegionResponse) => void;
  /** Called when region is created via drag */
  onCreateRegion?: (startMs: number, endMs: number) => void;
  /** Active loop region (for playback) */
  activeLoop?: RegionResponse | null;
  /** Height of the visualizer */
  height?: number;
  /** Show beat markers */
  showBeats?: boolean;
  /** Show transient markers */
  showTransients?: boolean;
}

// ============================================
// Constants
// ============================================

const DEFAULT_HEIGHT = 120;
const _ANNOTATION_HEIGHT = 24; // Reserved for future use
const REGION_OPACITY = 0.2;

const SECTION_COLORS: Record<string, string> = {
  intro: '#4ade80',
  verse: '#60a5fa',
  chorus: '#f472b6',
  bridge: '#fbbf24',
  breakdown: '#a78bfa',
  buildup: '#fb923c',
  drop: '#ef4444',
  outro: '#6b7280',
  custom: '#94a3b8',
};

// ============================================
// Component
// ============================================

export function TrackVisualizer({
  streamUrl: _streamUrl,
  duration,
  annotations,
  regions,
  events = [],
  manifest: _manifest,
  loudnessData,
  currentTime = 0,
  onSeek,
  onAddAnnotation,
  onAnnotationClick,
  onRegionClick,
  onCreateRegion,
  activeLoop,
  height = DEFAULT_HEIGHT,
  showBeats = true,
  showTransients = false,
}: TrackVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const durationMs = duration * 1000;

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Convert time to x position
  const timeToX = useCallback(
    (timeMs: number) => (timeMs / durationMs) * containerWidth,
    [durationMs, containerWidth]
  );

  // Convert x position to time
  const xToTime = useCallback(
    (x: number) => (x / containerWidth) * durationMs,
    [durationMs, containerWidth]
  );

  // Beats and transients from events
  const beats = useMemo(
    () => events.filter((e) => e.type === 'beat' || e.type === 'downbeat'),
    [events]
  );
  const transients = useMemo(
    () => events.filter((e) => e.type === 'transient'),
    [events]
  );

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, containerWidth, height);

    // Draw waveform from loudness data
    if (loudnessData && loudnessData.length > 0) {
      const barWidth = containerWidth / loudnessData.length;
      const centerY = height / 2;
      const maxHeight = height * 0.8;

      ctx.fillStyle = '#3b82f6';

      for (let i = 0; i < loudnessData.length; i++) {
        const value = loudnessData[i];
        // Normalize loudness (typically -60 to 0 dB) to 0-1
        const normalized = Math.max(0, Math.min(1, (value + 60) / 60));
        const barHeight = normalized * maxHeight;

        ctx.fillRect(
          i * barWidth,
          centerY - barHeight / 2,
          Math.max(1, barWidth - 1),
          barHeight
        );
      }
    } else {
      // Placeholder waveform
      ctx.fillStyle = '#374151';
      ctx.fillRect(0, height / 2 - 2, containerWidth, 4);
    }

    // Draw beat markers
    if (showBeats && beats.length > 0) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
      ctx.lineWidth = 1;

      for (const beat of beats) {
        const x = timeToX(beat.time_ms);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Downbeats are thicker
        if (beat.type === 'downbeat') {
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
          ctx.lineWidth = 1;
        }
      }
    }

    // Draw transient markers
    if (showTransients && transients.length > 0) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';

      for (const transient of transients) {
        const x = timeToX(transient.time_ms);
        ctx.beginPath();
        ctx.arc(x, 10, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw playhead
    const playheadX = timeToX(currentTime * 1000);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    // Draw drag selection
    if (isDragging && dragStart !== null && dragEnd !== null) {
      const startX = timeToX(dragStart);
      const endX = timeToX(dragEnd);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.fillRect(Math.min(startX, endX), 0, Math.abs(endX - startX), height);
    }
  }, [
    containerWidth,
    height,
    loudnessData,
    currentTime,
    beats,
    transients,
    showBeats,
    showTransients,
    isDragging,
    dragStart,
    dragEnd,
    timeToX,
  ]);

  // Handle click/seek
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDragging) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const timeMs = xToTime(x);

      if (onSeek) {
        onSeek(timeMs / 1000);
      }
    },
    [isDragging, xToTime, onSeek]
  );

  // Handle drag to create region
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onCreateRegion) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const timeMs = xToTime(x);

      setIsDragging(true);
      setDragStart(timeMs);
      setDragEnd(timeMs);
    },
    [xToTime, onCreateRegion]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const timeMs = xToTime(x);
      setDragEnd(timeMs);
    },
    [isDragging, xToTime]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || dragStart === null || dragEnd === null) {
      setIsDragging(false);
      return;
    }

    const startMs = Math.min(dragStart, dragEnd);
    const endMs = Math.max(dragStart, dragEnd);

    // Only create region if drag was significant (> 100ms)
    if (endMs - startMs > 100 && onCreateRegion) {
      onCreateRegion(startMs, endMs);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, onCreateRegion]);

  // Double-click to add annotation
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onAddAnnotation) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const timeMs = xToTime(x);
      onAddAnnotation(timeMs);
    },
    [xToTime, onAddAnnotation]
  );

  return (
    <div className={styles.container}>
      {/* Regions layer */}
      <div className={styles.regionsLayer}>
        {regions.map((region) => {
          const left = timeToX(region.start_time_ms);
          const width = timeToX(region.end_time_ms) - left;
          const color = region.color || SECTION_COLORS[region.section_type] || SECTION_COLORS.custom;
          const isActive = activeLoop?.id === region.id;
          const isHovered = hoveredRegion === region.id;

          return (
            <div
              key={region.id}
              className={`${styles.region} ${isActive ? styles.regionActive : ''} ${isHovered ? styles.regionHovered : ''}`}
              style={{
                left: `${left}px`,
                width: `${width}px`,
                backgroundColor: color,
                opacity: isActive ? 0.4 : REGION_OPACITY,
              }}
              onClick={() => onRegionClick?.(region)}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
            >
              <span className={styles.regionLabel}>{region.name}</span>
            </div>
          );
        })}
      </div>

      {/* Waveform canvas */}
      <div
        ref={containerRef}
        className={styles.waveformContainer}
        style={{ height: `${height}px` }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>

      {/* Annotations layer */}
      <div className={styles.annotationsLayer}>
        {annotations.map((annotation) => {
          const left = timeToX(annotation.start_time_ms);
          const isRange = annotation.end_time_ms !== null;
          const width = isRange
            ? timeToX(annotation.end_time_ms!) - left
            : 4;
          const isHovered = hoveredAnnotation === annotation.id;

          return (
            <div
              key={annotation.id}
              className={`${styles.annotation} ${isRange ? styles.annotationRange : styles.annotationPoint} ${isHovered ? styles.annotationHovered : ''}`}
              style={{
                left: `${left}px`,
                width: isRange ? `${width}px` : undefined,
                backgroundColor: annotation.color,
              }}
              onClick={() => onAnnotationClick?.(annotation)}
              onMouseEnter={() => setHoveredAnnotation(annotation.id)}
              onMouseLeave={() => setHoveredAnnotation(null)}
              title={annotation.title}
            >
              {isHovered && (
                <div className={styles.annotationTooltip}>
                  <strong>{annotation.title}</strong>
                  {annotation.content && <p>{annotation.content}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active loop indicator */}
      {activeLoop && (
        <div
          className={styles.loopIndicator}
          style={{
            left: `${timeToX(activeLoop.start_time_ms)}px`,
            width: `${timeToX(activeLoop.end_time_ms) - timeToX(activeLoop.start_time_ms)}px`,
          }}
        />
      )}
    </div>
  );
}

