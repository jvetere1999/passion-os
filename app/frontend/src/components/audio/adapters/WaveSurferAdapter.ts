/**
 * WaveSurfer Waveform Adapter
 *
 * Waveform visualization using wavesurfer.js.
 *
 * CRITICAL: WaveSurfer Configuration Requirements
 * ================================================
 *
 * WaveSurfer MUST be configured to use the HTMLAudioElement backend (MediaElement)
 * for the following reasons:
 *
 * 1. SINGLE SOURCE NODE REQUIREMENT:
 *    The Web Audio API only allows ONE MediaElementSourceNode per HTMLAudioElement.
 *    Creating multiple source nodes throws a DOMException.
 *    Our AudioSegment already creates one MediaElementSourceNode for the shared
 *    audio graph (EQ, compressor, analyser). WaveSurfer cannot create another.
 *
 * 2. PLAYBACK STATE SYNC:
 *    By using the existing HTMLAudioElement, WaveSurfer automatically stays in
 *    sync with the transport controls (play/pause/seek) without extra wiring.
 *
 * 3. AUDIO GRAPH INTEGRITY:
 *    WaveSurfer in "backend: MediaElement" mode only renders the waveform UI
 *    and listens to media element events. It does NOT:
 *    - Create its own AudioContext
 *    - Create a MediaElementSourceNode
 *    - Interfere with our audio processing chain
 *
 * This adapter uses `media` option to pass the existing audio element, ensuring
 * WaveSurfer uses it for playback state rather than creating its own audio handling.
 */

import type { VisualizerAdapter, VisualizerContext } from "../types";

// WaveSurfer types (simplified)
interface WaveSurferInstance {
  destroy(): void;
  setOptions(options: Record<string, unknown>): void;
  on(event: string, callback: (...args: unknown[]) => void): void;
  un(event: string, callback: (...args: unknown[]) => void): void;
  getWrapper(): HTMLElement;
}

interface WaveSurferOptions {
  container: HTMLElement | string;
  media?: HTMLMediaElement;
  waveColor?: string | CanvasGradient;
  progressColor?: string | CanvasGradient;
  cursorColor?: string;
  cursorWidth?: number;
  barWidth?: number;
  barGap?: number;
  barRadius?: number;
  barHeight?: number;
  height?: number | "auto";
  normalize?: boolean;
  splitChannels?: boolean;
  interact?: boolean;
  hideScrollbar?: boolean;
  autoScroll?: boolean;
  autoCenter?: boolean;
  sampleRate?: number;
  minPxPerSec?: number;
  fillParent?: boolean;
  mediaControls?: boolean;
  backend?: "WebAudio" | "MediaElement";
  peaks?: Float32Array[];
  duration?: number;
}

interface WaveSurferStatic {
  create(options: WaveSurferOptions): WaveSurferInstance;
}

/**
 * Bass-focused waveform colors
 */
const WAVE_CONFIG = {
  waveColor: "rgba(255, 120, 80, 0.6)", // Orange-red for energy
  progressColor: "rgba(255, 180, 100, 0.9)", // Brighter played section
  cursorColor: "#ff5722",
  cursorWidth: 2,
  barWidth: 3,
  barGap: 1,
  barRadius: 2,
  barHeight: 1,
  normalize: true,
  hideScrollbar: true,
  fillParent: true,
  interact: true, // Allow clicking to seek
  autoCenter: true,
  minPxPerSec: 50,
};

export class WaveSurferAdapter implements VisualizerAdapter {
  private wavesurfer: WaveSurferInstance | null = null;
  private containerEl: HTMLElement | null = null;
  private wrapperEl: HTMLDivElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  async mount(context: VisualizerContext): Promise<void> {
    const { audioEl, containerEl } = context;
    this.containerEl = containerEl;

    // Clear container
    containerEl.innerHTML = "";

    // Create wrapper for WaveSurfer
    this.wrapperEl = document.createElement("div");
    this.wrapperEl.style.width = "100%";
    this.wrapperEl.style.height = "100%";
    this.wrapperEl.style.display = "flex";
    this.wrapperEl.style.alignItems = "center";
    this.wrapperEl.style.justifyContent = "center";
    this.wrapperEl.style.background = "rgba(0, 0, 0, 0.3)";
    containerEl.appendChild(this.wrapperEl);

    // Dynamically import wavesurfer.js
    const WaveSurferModule = await import("wavesurfer.js");
    const WaveSurfer = WaveSurferModule.default as unknown as WaveSurferStatic;

    // Get container height for waveform
    const rect = containerEl.getBoundingClientRect();
    const height = Math.max(Math.floor(rect.height * 0.6), 100);

    /**
     * Create WaveSurfer with MediaElement backend
     *
     * By passing `media: audioEl`, WaveSurfer uses the existing HTMLAudioElement
     * for playback state. It will NOT create:
     * - A new AudioContext
     * - A new MediaElementSourceNode
     *
     * This is essential because our AudioSegment already has a single
     * MediaElementSourceNode connected to the audio graph.
     */
    this.wavesurfer = WaveSurfer.create({
      container: this.wrapperEl,
      media: audioEl, // Use existing audio element
      height,
      ...WAVE_CONFIG,
    });

    // Set up resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(containerEl);
  }

  resize(): void {
    if (!this.wavesurfer || !this.containerEl) return;

    const rect = this.containerEl.getBoundingClientRect();
    const height = Math.max(Math.floor(rect.height * 0.6), 100);

    this.wavesurfer.setOptions({ height });
  }

  unmount(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.wavesurfer) {
      try {
        this.wavesurfer.destroy();
      } catch {
        // Ignore cleanup errors
      }
      this.wavesurfer = null;
    }

    if (this.wrapperEl && this.containerEl?.contains(this.wrapperEl)) {
      this.containerEl.removeChild(this.wrapperEl);
    }

    this.wrapperEl = null;
    this.containerEl = null;
  }
}

