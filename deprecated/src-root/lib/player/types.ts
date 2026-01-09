/**
 * Player Types
 * Core types for audio playback, queue management, and waveform data
 */

// ============================================
// Player Status Types
// ============================================

export type RepeatMode = "off" | "one" | "all";

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

// ============================================
// Queue Track Types
// ============================================

export interface QueueTrack {
  id: string;
  title: string;
  artist?: string;
  source?: string;
  audioUrl: string;
  duration?: number;
  waveform?: WaveformPeaks;
  /** If this is a reference track, links to the reference store */
  referenceTrackId?: string;
}

export interface WaveformPeaks {
  peaks: number[];
  normalizedPeaks?: number[];
}

// ============================================
// Player Settings (persisted)
// ============================================

export interface PlayerSettings {
  autoplayNext: boolean;
  repeatMode: RepeatMode;
  volume: number;
  shuffle: boolean;
}

// ============================================
// Player State
// ============================================

export interface PlayerState {
  currentTrack: QueueTrack | null;
  status: PlayerStatus;
  currentTime: number;
  duration: number;
  queue: QueueTrack[];
  queueIndex: number;
  settings: PlayerSettings;
  error: string | null;
  isVisible: boolean;
}

// ============================================
// Waveform Data
// ============================================

export interface WaveformData {
  peaks: number[];
  normalizedPeaks: number[];
  duration: number;
  sampleRate: number;
  generatedAt: string;
}

export interface WaveformCacheEntry {
  id: string;
  data: WaveformData;
  createdAt: string;
}

// ============================================
// Audio Analysis Types
// ============================================

export interface FrequencyBand {
  name: "lows" | "mids" | "highs";
  freqRange: [number, number];
  energy: number;
  peak: number;
  average: number;
  color: string;
}

export interface FrequencySpectrum {
  version: 1;
  analyzedAt: string;
  bands: FrequencyBand[];
  overallRMS: number;
  dynamicRange: number;
  crestFactor: number;
  peakAmplitude: number;
}

export interface AudioAnalysis {
  version: 1;
  bpm?: number;
  key?: string;
  confidence?: number;
  source: "heuristic" | "webaudio";
  spectrum?: FrequencySpectrum;
}

// ============================================
// Audio Annotation Types
// ============================================

export interface AudioAnnotationMarker {
  id: string;
  t: number; // Timestamp in seconds
  label: string;
  color?: string;
}

export interface AudioAnnotationRegion {
  id: string;
  t0: number; // Start timestamp in seconds
  t1: number; // End timestamp in seconds
  label: string;
  color?: string;
}

export interface AudioAnnotationNote {
  id: string;
  t: number; // Timestamp in seconds
  body: string;
}

export interface AudioAnnotations {
  version: 1;
  markers: AudioAnnotationMarker[];
  regions: AudioAnnotationRegion[];
  notes: AudioAnnotationNote[];
}

// ============================================
// Constants
// ============================================

export const DEFAULT_SETTINGS: PlayerSettings = {
  autoplayNext: true,
  repeatMode: "off",
  volume: 0.8,
  shuffle: false,
};

export const ANNOTATION_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEAA7", // Yellow
  "#DDA0DD", // Plum
  "#FF8C42", // Orange
  "#98D8C8", // Mint
];

