/**
 * Track Detail Page Component
 *
 * Main view for a single reference track with visualizer, playback, and controls.
 * All audio access is via backend signed URLs - never R2 credentials.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTrack, useFrameData } from '@/lib/hooks/useReferenceTracks';
import { TrackVisualizer } from './TrackVisualizer';
import { AnnotationControls } from './AnnotationControls';
import { RegionControls } from './RegionControls';
import type {
  AnnotationResponse,
  RegionResponse,
  CreateAnnotationInput,
  CreateRegionInput
} from '@/lib/api/reference-tracks';
import styles from './TrackDetailPage.module.css';

// ============================================
// Types
// ============================================

export interface TrackDetailPageProps {
  trackId: string;
  onBack?: () => void;
}

// ============================================
// Component
// ============================================

export function TrackDetailPage({ trackId, onBack }: TrackDetailPageProps) {
  const {
    track,
    analysis,
    annotations,
    regions,
    loading,
    error,
    streamUrl,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    addRegion,
    updateRegion,
    deleteRegion,
  } = useTrack(trackId);

  const { manifest, events, getFramesForRange } = useFrameData(analysis?.id ?? null);

  // Audio playback state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  // UI state
  const [selectedAnnotation, setSelectedAnnotation] = useState<AnnotationResponse | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionResponse | null>(null);
  const [activeLoop, setActiveLoop] = useState<RegionResponse | null>(null);
  const [loudnessData, setLoudnessData] = useState<Float32Array | null>(null);

  // Load loudness data for visualizer
  useEffect(() => {
    if (!analysis?.id || !manifest) return;

    getFramesForRange(0, manifest.duration_ms).then((frames) => {
      const loudness = frames.get('loudness');
      if (loudness) {
        setLoudnessData(loudness);
      }
    }).catch(console.error);
  }, [analysis?.id, manifest, getFramesForRange]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (activeLoop) {
        audio.currentTime = activeLoop.start_time_ms / 1000;
        audio.play();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [activeLoop]);

  // Loop enforcement
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeLoop) return;

    const handleTimeUpdate = () => {
      const currentMs = audio.currentTime * 1000;
      if (currentMs >= activeLoop.end_time_ms) {
        audio.currentTime = activeLoop.start_time_ms / 1000;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [activeLoop]);

  // Playback controls
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying]);

  const handleSeek = useCallback((timeSeconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = timeSeconds;
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // Annotation handlers
  const handleAddAnnotation = useCallback(async (startMs: number, endMs?: number) => {
    const title = prompt('Annotation title:');
    if (!title) return;

    await addAnnotation({
      start_time_ms: Math.round(startMs),
      end_time_ms: endMs ? Math.round(endMs) : undefined,
      title,
      category: 'general',
    });
  }, [addAnnotation]);

  const handleAnnotationClick = useCallback((annotation: AnnotationResponse) => {
    setSelectedAnnotation(annotation);
    setSelectedRegion(null);
    // Seek to annotation start
    handleSeek(annotation.start_time_ms / 1000);
  }, [handleSeek]);

  // Region handlers
  const handleCreateRegion = useCallback(async (startMs: number, endMs: number) => {
    const name = prompt('Region name:');
    if (!name) return;

    await addRegion({
      start_time_ms: Math.round(startMs),
      end_time_ms: Math.round(endMs),
      name,
      section_type: 'custom',
    });
  }, [addRegion]);

  const handleRegionClick = useCallback((region: RegionResponse) => {
    setSelectedRegion(region);
    setSelectedAnnotation(null);
    // Seek to region start
    handleSeek(region.start_time_ms / 1000);
  }, [handleSeek]);

  const handleSetLoop = useCallback((region: RegionResponse | null) => {
    setActiveLoop(region);
    if (region && audioRef.current) {
      audioRef.current.currentTime = region.start_time_ms / 1000;
    }
  }, []);

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading track...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Error loading track: {error.message}</p>
        <button onClick={onBack}>Go back</button>
      </div>
    );
  }

  if (!track) {
    return (
      <div className={styles.error}>
        <p>Track not found</p>
        <button onClick={onBack}>Go back</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        {onBack && (
          <button className={styles.backButton} onClick={onBack}>
            ← Back
          </button>
        )}
        <div className={styles.trackInfo}>
          <h1 className={styles.trackName}>{track.name}</h1>
          {track.artist && <p className={styles.trackArtist}>{track.artist}</p>}
        </div>
        {track.status !== 'ready' && (
          <span className={`${styles.statusBadge} ${styles[`status_${track.status}`]}`}>
            {track.status}
          </span>
        )}
      </header>

      {/* Audio element (hidden) */}
      {streamUrl && (
        <audio
          ref={audioRef}
          src={streamUrl}
          preload="auto"
          crossOrigin="anonymous"
        />
      )}

      {/* Visualizer */}
      <section className={styles.visualizerSection}>
        <TrackVisualizer
          streamUrl={streamUrl}
          duration={duration || (track.duration_seconds ?? 0)}
          annotations={annotations}
          regions={regions}
          events={events?.events}
          manifest={manifest}
          loudnessData={loudnessData}
          currentTime={currentTime}
          onSeek={handleSeek}
          onAddAnnotation={handleAddAnnotation}
          onAnnotationClick={handleAnnotationClick}
          onRegionClick={handleRegionClick}
          onCreateRegion={handleCreateRegion}
          activeLoop={activeLoop}
          height={150}
          showBeats
        />
      </section>

      {/* Playback controls */}
      <section className={styles.controls}>
        <button className={styles.playButton} onClick={togglePlay} disabled={!streamUrl}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <span className={styles.time}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <input
          type="range"
          className={styles.seekBar}
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={(e) => handleSeek(parseFloat(e.target.value))}
        />
        <div className={styles.volumeControl}>
          <span>🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
          />
        </div>
      </section>

      {/* Sidebar panels */}
      <div className={styles.panels}>
        <AnnotationControls
          annotations={annotations}
          selectedAnnotation={selectedAnnotation}
          onSelect={setSelectedAnnotation}
          onCreate={async (input: CreateAnnotationInput) => { await addAnnotation(input); }}
          onUpdate={updateAnnotation}
          onDelete={deleteAnnotation}
          currentTimeMs={currentTime * 1000}
          durationMs={duration * 1000}
        />
        <RegionControls
          regions={regions}
          selectedRegion={selectedRegion}
          activeLoop={activeLoop}
          onSelect={setSelectedRegion}
          onSetLoop={handleSetLoop}
          onCreate={async (input: CreateRegionInput) => { await addRegion(input); }}
          onUpdate={updateRegion}
          onDelete={deleteRegion}
          durationMs={duration * 1000}
        />
      </div>

      {/* Track metadata */}
      <section className={styles.metadata}>
        <h3>Track Info</h3>
        <dl>
          {track.album && (
            <>
              <dt>Album</dt>
              <dd>{track.album}</dd>
            </>
          )}
          {track.genre && (
            <>
              <dt>Genre</dt>
              <dd>{track.genre}</dd>
            </>
          )}
          {track.bpm && (
            <>
              <dt>BPM</dt>
              <dd>{track.bpm}</dd>
            </>
          )}
          {track.key_signature && (
            <>
              <dt>Key</dt>
              <dd>{track.key_signature}</dd>
            </>
          )}
          {analysis && (
            <>
              <dt>Analysis</dt>
              <dd>{analysis.status}</dd>
            </>
          )}
        </dl>
      </section>
    </div>
  );
}

