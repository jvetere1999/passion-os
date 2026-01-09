/**
 * Audio Controller
 * Manages HTMLAudioElement for reliable playback
 * Client-side only - do not import in server components
 */

"use client";

import { usePlayerStore } from "./store";

let audio: HTMLAudioElement | null = null;
let isInitialized = false;

/**
 * Get human-readable error message
 */
function getAudioError(error: MediaError | null | undefined): string {
  if (!error) return "Unknown audio error";

  switch (error.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return "Playback aborted";
    case MediaError.MEDIA_ERR_NETWORK:
      return "Network error loading audio";
    case MediaError.MEDIA_ERR_DECODE:
      return "Audio decode error";
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return "Audio format not supported";
    default:
      return "Unknown audio error";
  }
}

/**
 * Initialize the audio element
 */
export function initAudioController(): HTMLAudioElement {
  if (typeof window === "undefined") {
    throw new Error("Audio controller can only be initialized in browser");
  }

  if (audio && isInitialized) {
    return audio;
  }

  audio = new Audio();
  audio.preload = "metadata";


  // Event listeners
  audio.addEventListener("loadedmetadata", () => {
    usePlayerStore.getState().setDuration(audio?.duration || 0);
  });

  audio.addEventListener("timeupdate", () => {
    usePlayerStore.getState().setCurrentTime(audio?.currentTime || 0);
  });

  audio.addEventListener("play", () => {
    usePlayerStore.getState().setStatus("playing");
  });

  audio.addEventListener("pause", () => {
    usePlayerStore.getState().setStatus("paused");
  });

  audio.addEventListener("ended", () => {
    usePlayerStore.getState().handleEnded();
  });

  audio.addEventListener("error", () => {
    const errorMsg = getAudioError(audio?.error);
    usePlayerStore.getState().setError(errorMsg);
  });

  audio.addEventListener("waiting", () => {
    usePlayerStore.getState().setStatus("loading");
  });

  isInitialized = true;
  return audio;
}

/**
 * Load and play an audio URL
 */
export async function loadAndPlay(url: string): Promise<void> {
  if (!audio) {
    initAudioController();
  }

  if (!audio) return;

  try {
    // Reset the audio element for new source
    audio.pause();
    audio.currentTime = 0;
    audio.src = url;

    // Wait for the audio to be ready
    await new Promise<void>((resolve, reject) => {
      const onCanPlay = () => {
        audio?.removeEventListener("canplay", onCanPlay);
        audio?.removeEventListener("error", onError);
        resolve();
      };
      const onError = () => {
        audio?.removeEventListener("canplay", onCanPlay);
        audio?.removeEventListener("error", onError);
        reject(new Error("Failed to load audio"));
      };
      audio?.addEventListener("canplay", onCanPlay);
      audio?.addEventListener("error", onError);
      audio?.load();
    });

    // Try to play
    await audio.play();
  } catch (e) {
    console.error("Failed to play audio:", e);
    usePlayerStore.getState().setStatus("paused");
    usePlayerStore.getState().setError("Click play to start audio");
  }
}

/**
 * Play
 */
export async function play(): Promise<void> {
  if (!audio) return;

  try {
    await audio.play();
  } catch (e) {
    console.error("Failed to play:", e);
    usePlayerStore.getState().setError("Failed to play");
  }
}

/**
 * Pause
 */
export function pause(): void {
  if (!audio) return;
  audio.pause();
}

/**
 * Toggle play/pause
 */
export async function togglePlayPause(): Promise<void> {
  if (!audio) return;

  if (audio.paused) {
    await play();
  } else {
    pause();
  }
}

/**
 * Seek to a specific time
 */
export function seek(time: number): void {
  if (!audio) return;
  audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
}

/**
 * Seek by percentage (0-1)
 */
export function seekByPercent(percent: number): void {
  if (!audio || !audio.duration) return;
  seek(percent * audio.duration);
}

/**
 * Set volume (0-1)
 */
export function setVolume(volume: number): void {
  if (!audio) return;
  audio.volume = Math.max(0, Math.min(1, volume));
}

/**
 * Get current volume
 */
export function getVolume(): number {
  return audio?.volume ?? 0.8;
}

/**
 * Skip forward by seconds
 */
export function skipForward(seconds: number = 10): void {
  if (!audio) return;
  seek(audio.currentTime + seconds);
}

/**
 * Skip backward by seconds
 */
export function skipBackward(seconds: number = 10): void {
  if (!audio) return;
  seek(audio.currentTime - seconds);
}

/**
 * Get audio element (for waveform integration)
 */
export function getAudioElement(): HTMLAudioElement | null {
  return audio;
}

/**
 * Dispose audio controller
 */
export function disposeAudioController(): void {
  if (audio) {
    audio.pause();
    audio.src = "";
    audio = null;
    isInitialized = false;
  }
}

