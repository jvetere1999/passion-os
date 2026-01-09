/**
 * Butterchurn Visualizer Adapter
 *
 * Milkdrop-style music visualizer using butterchurn library.
 * Tuned for bass music with presets that emphasize low frequencies.
 *
 * Note: butterchurn and butterchurn-presets are dynamically imported
 * to keep the server bundle clean. Type declarations are in audio-libs.d.ts
 */

import type { VisualizerAdapter, VisualizerContext } from "../types";


/**
 * Bass-focused preset names that work well with bass music
 * These are selected from the butterchurn-presets library
 */
const BASS_FOCUSED_PRESETS = [
  "Flexi - infused with the spiral",
  "Geiss - Cosmic Dust 2",
  "Rovastar - Fractopia",
  "Unchained - Beat Demo 2.1",
  "martin - disco mix 3",
  "Aderrasi - Caustic Senses",
  "cope + martin - mother-of-pearl",
  "fiShbRaiN - Stimulus Package (Bash 2.1)",
  "Flexi + Martin - dive",
  "Geiss - Cauldron",
  "Rovastar + Loadus - FractalDrop (Active Strobe Mix)",
  "Zylot - Block Of Sound",
];

interface ButterchurnVisualizerMethods {
  setRendererSize(width: number, height: number): void;
  loadPreset(preset: unknown, blendTime: number): void;
  launchSongTitleAnim(title: string): void;
  render(): void;
  connectAudio(node: AudioNode): void;
}

export class ButterchurnAdapter implements VisualizerAdapter {
  private visualizer: ButterchurnVisualizerMethods | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private containerEl: HTMLElement | null = null;
  private rafId: number | null = null;
  private presets: Record<string, unknown> = {};
  private presetNames: string[] = [];
  private currentPresetIndex = 0;
  private isRunning = false;

  async mount(context: VisualizerContext): Promise<void> {
    const { audioCtx, analyserNode, containerEl } = context;
    this.containerEl = containerEl;

    // Clear container
    containerEl.innerHTML = "";

    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.display = "block";
    containerEl.appendChild(this.canvas);

    // Dynamically import butterchurn
    const [butterchurnModule, presetsModule] = await Promise.all([
      import("butterchurn"),
      import("butterchurn-presets"),
    ]);

    const butterchurn = butterchurnModule.default;
    this.presets = presetsModule.default;

    // Filter to bass-focused presets that exist
    const allPresetNames = Object.keys(this.presets);
    this.presetNames = BASS_FOCUSED_PRESETS.filter((name) =>
      allPresetNames.includes(name)
    );

    // If none found, use first 12 available presets
    if (this.presetNames.length === 0) {
      this.presetNames = allPresetNames.slice(0, 12);
    }

    // Get container dimensions
    const rect = containerEl.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);

    // Set canvas size
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * pixelRatio;
    this.canvas.height = height * pixelRatio;

    // Create visualizer
    this.visualizer = butterchurn.createVisualizer(audioCtx, this.canvas, {
      width: Math.floor(width * pixelRatio),
      height: Math.floor(height * pixelRatio),
      pixelRatio,
    });

    // Connect to analyser node for audio data
    this.visualizer.connectAudio(analyserNode);

    // Load initial preset
    this.loadPresetByIndex(0);

    // Start render loop
    this.isRunning = true;
    this.renderLoop();
  }

  resize(): void {
    if (!this.canvas || !this.visualizer || !this.containerEl) return;

    const rect = this.containerEl.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * pixelRatio;
    this.canvas.height = height * pixelRatio;

    this.visualizer.setRendererSize(
      Math.floor(width * pixelRatio),
      Math.floor(height * pixelRatio)
    );
  }

  unmount(): void {
    this.isRunning = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.canvas && this.containerEl?.contains(this.canvas)) {
      this.containerEl.removeChild(this.canvas);
    }

    this.canvas = null;
    this.visualizer = null;
    this.containerEl = null;
  }

  /**
   * Load a preset by index
   */
  loadPresetByIndex(index: number): void {
    if (!this.visualizer || this.presetNames.length === 0) return;

    this.currentPresetIndex =
      ((index % this.presetNames.length) + this.presetNames.length) %
      this.presetNames.length;

    const presetName = this.presetNames[this.currentPresetIndex];
    const preset = this.presets[presetName];

    if (preset) {
      this.visualizer.loadPreset(preset, 2.0); // 2 second blend
    }
  }

  /**
   * Load next preset
   */
  nextPreset(): void {
    this.loadPresetByIndex(this.currentPresetIndex + 1);
  }

  /**
   * Load previous preset
   */
  previousPreset(): void {
    this.loadPresetByIndex(this.currentPresetIndex - 1);
  }

  /**
   * Get current preset name
   */
  getCurrentPresetName(): string {
    return this.presetNames[this.currentPresetIndex] || "Unknown";
  }

  private renderLoop = (): void => {
    if (!this.isRunning || !this.visualizer) return;

    this.visualizer.render();
    this.rafId = requestAnimationFrame(this.renderLoop);
  };
}

