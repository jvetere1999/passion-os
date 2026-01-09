/**
 * AudioMotion Spectrum Analyzer Adapter
 *
 * Real-time spectrum analyzer using audiomotion-analyzer.
 * Configured with emphasis on bass frequencies for bass music visualization.
 *
 * Note: audiomotion-analyzer is dynamically imported to keep the server bundle clean.
 * Type declarations are in audio-libs.d.ts
 */

import type { VisualizerAdapter, VisualizerContext } from "../types";

/**
 * Bass-tuned configuration for AudioMotion
 * Emphasizes sub-bass and bass frequencies (20-300 Hz)
 */
const BASS_CONFIG = {
  mode: 3, // Graph mode with bars
  gradient: "rainbow", // Good contrast for bass
  showScaleX: false,
  showScaleY: false,
  showPeaks: true,
  showBgColor: true,
  overlay: true,
  bgAlpha: 0.7,
  smoothing: 0.7, // Lower = more responsive to transients
  fftSize: 8192, // Large FFT for better bass resolution
  minFreq: 20, // Start from sub-bass
  maxFreq: 8000, // Focus on lower frequencies
  minDecibels: -85,
  maxDecibels: -25,
  barSpace: 0.2,
  lumiBars: true,
  reflexRatio: 0.3, // Mirror effect
  reflexAlpha: 0.25,
  reflexBright: 1,
  lineWidth: 2,
  fillAlpha: 0.6,
  weightingFilter: "", // No weighting to keep bass prominent
};

export class AudioMotionAdapter implements VisualizerAdapter {
  private analyzer: InstanceType<typeof import("audiomotion-analyzer").default> | null = null;
  private containerEl: HTMLElement | null = null;
  private wrapperEl: HTMLDivElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  async mount(context: VisualizerContext): Promise<void> {
    const { audioCtx, analyserNode, containerEl } = context;
    this.containerEl = containerEl;

    // Clear container
    containerEl.innerHTML = "";

    // Create wrapper for AudioMotion
    this.wrapperEl = document.createElement("div");
    this.wrapperEl.style.width = "100%";
    this.wrapperEl.style.height = "100%";
    this.wrapperEl.style.position = "relative";
    containerEl.appendChild(this.wrapperEl);

    // Dynamically import audiomotion-analyzer
    const AudioMotionModule = await import("audiomotion-analyzer");
    const AudioMotion = AudioMotionModule.default;

    // Create analyzer with bass-tuned config
    this.analyzer = new AudioMotion(this.wrapperEl, {
      ...BASS_CONFIG,
      audioCtx,
      source: analyserNode,
    });

    // Ensure it's running
    if (!this.analyzer.isOn) {
      this.analyzer.toggleAnalyzer(true);
    }

    // Set up resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(containerEl);

    // Initial resize
    this.resize();
  }

  resize(): void {
    if (!this.analyzer || !this.containerEl) return;

    const rect = this.containerEl.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 1);
    const height = Math.max(Math.floor(rect.height), 1);

    this.analyzer.setCanvasSize(width, height);
  }

  unmount(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.analyzer) {
      try {
        this.analyzer.disconnectInput();
        this.analyzer.destroy();
      } catch {
        // Ignore cleanup errors
      }
      this.analyzer = null;
    }

    if (this.wrapperEl && this.containerEl?.contains(this.wrapperEl)) {
      this.containerEl.removeChild(this.wrapperEl);
    }

    this.wrapperEl = null;
    this.containerEl = null;
  }
}

