/**
 * AudioSegment Types
 * Shared types for the audio segment and visualizer adapters
 */

/**
 * VisualizerAdapter Interface
 * All visualizer implementations must conform to this interface.
 * This ensures consistent lifecycle management and prevents resource leaks.
 */
export interface VisualizerAdapter {
  /**
   * Mount the visualizer into the container
   * Called when switching to this visualizer mode
   */
  mount(context: VisualizerContext): Promise<void> | void;

  /**
   * Handle container resize
   * Called on window resize and fullscreen changes
   */
  resize(): void;

  /**
   * Unmount and cleanup the visualizer
   * Must cancel all RAF loops, remove event listeners, and clear the container
   */
  unmount(): void;
}

/**
 * Context passed to visualizer adapters during mount
 */
export interface VisualizerContext {
  /** The audio element for playback */
  audioEl: HTMLAudioElement;
  /** The shared AudioContext (created on user gesture) */
  audioCtx: AudioContext;
  /** The single MediaElementSourceNode (created once) */
  mediaSourceNode: MediaElementAudioSourceNode;
  /** The analyser node for visualization data */
  analyserNode: AnalyserNode;
  /** Optional gain node for analysis chain */
  analysisNode?: GainNode;
  /** The container element to render into */
  containerEl: HTMLElement;
}

/**
 * Visualizer mode enum
 */
export type VisualizerMode = "butterchurn" | "audiomotion" | "wavesurfer";

/**
 * Track metadata for display and Media Session API
 */
export interface TrackMetadata {
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  duration?: number;
}

/**
 * Bass shake configuration
 */
export interface ShakeConfig {
  /** Enable/disable shake effect */
  enabled: boolean;
  /** Intensity multiplier (0-1) */
  intensity: number;
  /** Smoothing/decay factor (0-1, higher = more smoothing) */
  smoothing: number;
  /** Energy threshold to trigger shake (0-1) */
  threshold: number;
  /** Maximum translation in pixels */
  maxTranslate: number;
  /** Maximum rotation in degrees */
  maxRotate: number;
  /** Maximum scale factor (1.0 = no scale, 1.03 = 3% larger) */
  maxScale: number;
}

/**
 * Default shake configuration tuned for bass music
 */
export const DEFAULT_SHAKE_CONFIG: ShakeConfig = {
  enabled: true,
  intensity: 0.7,
  smoothing: 0.85,
  threshold: 0.3,
  maxTranslate: 8,
  maxRotate: 1.5,
  maxScale: 1.02,
};

/**
 * Audio EQ/processing configuration for bass enhancement
 */
export interface AudioProcessingConfig {
  /** Low shelf frequency (Hz) */
  lowShelfFreq: number;
  /** Low shelf gain (dB) */
  lowShelfGain: number;
  /** Sub-bass peak frequency (Hz) */
  subPeakFreq: number;
  /** Sub-bass peak gain (dB) */
  subPeakGain: number;
  /** Sub-bass peak Q factor */
  subPeakQ: number;
  /** Compressor threshold (dB) */
  compThreshold: number;
  /** Compressor ratio */
  compRatio: number;
  /** Compressor attack (seconds) */
  compAttack: number;
  /** Compressor release (seconds) */
  compRelease: number;
}

/**
 * Default audio processing config tuned for bass music
 */
export const DEFAULT_AUDIO_PROCESSING: AudioProcessingConfig = {
  lowShelfFreq: 80,
  lowShelfGain: 4,
  subPeakFreq: 50,
  subPeakGain: 3,
  subPeakQ: 1.2,
  compThreshold: -12,
  compRatio: 4,
  compAttack: 0.003,
  compRelease: 0.25,
};

/**
 * Keyboard shortcut definitions
 */
export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: " ",
  SEEK_BACK: "ArrowLeft",
  SEEK_FORWARD: "ArrowRight",
  VOLUME_DOWN: "ArrowDown",
  VOLUME_UP: "ArrowUp",
  MODE_BUTTERCHURN: "1",
  MODE_AUDIOMOTION: "2",
  MODE_WAVESURFER: "3",
  MODE_PREV: "[",
  MODE_NEXT: "]",
  FULLSCREEN: "f",
  PRESET_NEXT: "n",
  PRESET_PREV: "p",
  SHAKE_TOGGLE: "s",
  HELP_TOGGLE: "?",
} as const;

