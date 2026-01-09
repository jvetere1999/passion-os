/**
 * Type declarations for audio visualizer libraries
 *
 * These libraries don't ship with TypeScript declarations,
 * so we provide minimal declarations to satisfy the compiler.
 */

// Butterchurn - Milkdrop visualizer
declare module "butterchurn" {
  interface ButterchurnVisualizer {
    setRendererSize(width: number, height: number): void;
    loadPreset(preset: unknown, blendTime: number): void;
    launchSongTitleAnim(title: string): void;
    render(): void;
    connectAudio(node: AudioNode): void;
  }

  interface ButterchurnStatic {
    createVisualizer(
      audioCtx: AudioContext,
      canvas: HTMLCanvasElement,
      options: { width: number; height: number; pixelRatio?: number }
    ): ButterchurnVisualizer;
  }

  const butterchurn: ButterchurnStatic;
  export default butterchurn;
}

declare module "butterchurn-presets" {
  const presets: Record<string, unknown>;
  export default presets;
}

// AudioMotion Analyzer
declare module "audiomotion-analyzer" {
  interface AudioMotionOptions {
    source?: AudioNode;
    audioCtx?: AudioContext;
    mode?: number;
    gradient?: string;
    showScaleX?: boolean;
    showScaleY?: boolean;
    showPeaks?: boolean;
    showBgColor?: boolean;
    overlay?: boolean;
    bgAlpha?: number;
    smoothing?: number;
    fftSize?: number;
    minFreq?: number;
    maxFreq?: number;
    minDecibels?: number;
    maxDecibels?: number;
    barSpace?: number;
    lumiBars?: boolean;
    reflexRatio?: number;
    reflexAlpha?: number;
    reflexBright?: number;
    lineWidth?: number;
    fillAlpha?: number;
    radial?: boolean;
    spinSpeed?: number;
    stereo?: boolean;
    splitGradient?: boolean;
    weightingFilter?: string;
  }

  class AudioMotionAnalyzer {
    constructor(container?: HTMLElement | null, options?: AudioMotionOptions);
    setCanvasSize(width: number, height: number): void;
    connectInput(source: AudioNode): void;
    disconnectInput(): void;
    destroy(): void;
    toggleAnalyzer(state?: boolean): void;
    canvas: HTMLCanvasElement;
    isOn: boolean;
  }

  export default AudioMotionAnalyzer;
}

// WaveSurfer.js - already has types via @types/wavesurfer.js or built-in
// No declaration needed if using wavesurfer.js v7+ which includes types

