/**
 * Player Store (Zustand)
 * Global state management for audio player with queue management
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  PlayerState,
  PlayerSettings,
  PlayerStatus,
  QueueTrack,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";

// ============================================
// Initial State
// ============================================

const initialState: Omit<PlayerState, "settings"> & { settings: PlayerSettings } = {
  currentTrack: null,
  status: "idle",
  currentTime: 0,
  duration: 0,
  queue: [],
  queueIndex: -1,
  settings: DEFAULT_SETTINGS,
  error: null,
  isVisible: false,
};

// ============================================
// Store Actions Interface
// ============================================

interface PlayerActions {
  // Queue management
  setQueue: (tracks: QueueTrack[], startIndex?: number) => void;
  addToQueue: (tracks: QueueTrack[]) => void;
  clearQueue: () => void;
  setTrackIndex: (index: number) => void;

  // Playback state
  setStatus: (status: PlayerStatus) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setError: (error: string | null) => void;

  // Settings
  updateSettings: (settings: Partial<PlayerSettings>) => void;

  // Visibility
  setVisible: (visible: boolean) => void;

  // Navigation
  next: () => void;
  previous: () => void;
  handleEnded: () => void;

  // State management
  reset: () => void;
  restoreQueue: (
    tracks: QueueTrack[],
    startIndex?: number,
    startTime?: number
  ) => void;
  getState: () => PlayerState;
}

// ============================================
// Create Store
// ============================================

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setQueue: (tracks, startIndex = 0) => {
      set({
        queue: tracks,
        queueIndex: startIndex,
        currentTrack: tracks[startIndex] || null,
        status: tracks[startIndex] ? "loading" : "idle",
        isVisible: tracks.length > 0,
        error: null,
      });
    },

    addToQueue: (tracks) => {
      set((state) => ({
        queue: [...state.queue, ...tracks],
      }));
    },

    clearQueue: () => {
      set({
        queue: [],
        queueIndex: -1,
        currentTrack: null,
        status: "idle",
        currentTime: 0,
        duration: 0,
      });
    },

    setTrackIndex: (index) => {
      const { queue } = get();
      const track = queue[index];
      if (!track) return;

      set({
        queueIndex: index,
        currentTrack: track,
        status: "loading",
        currentTime: 0,
        error: null,
      });
    },

    setStatus: (status) => set({ status }),
    setCurrentTime: (currentTime) => set({ currentTime }),
    setDuration: (duration) => set({ duration }),
    setError: (error) => set({ error, status: error ? "error" : get().status }),

    updateSettings: (settings) => {
      set((state) => ({
        settings: { ...state.settings, ...settings },
      }));
    },

    setVisible: (isVisible) => set({ isVisible }),

    next: () => {
      const { queue, queueIndex, settings } = get();
      if (queue.length === 0) return;

      let nextIndex = queueIndex + 1;

      if (nextIndex >= queue.length) {
        if (settings.repeatMode === "all") {
          nextIndex = 0;
        } else {
          set({ status: "paused" });
          return;
        }
      }

      const track = queue[nextIndex];
      set({
        queueIndex: nextIndex,
        currentTrack: track,
        status: "loading",
        currentTime: 0,
        error: null,
      });
    },

    previous: () => {
      const { queue, queueIndex, currentTime, settings } = get();
      if (queue.length === 0) return;

      // If more than 3 seconds in, restart current track
      if (currentTime > 3) {
        set({ currentTime: 0 });
        return;
      }

      let prevIndex = queueIndex - 1;

      if (prevIndex < 0) {
        if (settings.repeatMode === "all") {
          prevIndex = queue.length - 1;
        } else {
          prevIndex = 0;
        }
      }

      const track = queue[prevIndex];
      set({
        queueIndex: prevIndex,
        currentTrack: track,
        status: "loading",
        currentTime: 0,
        error: null,
      });
    },

    handleEnded: () => {
      const { settings } = get();

      if (settings.repeatMode === "one") {
        set({ currentTime: 0, status: "loading" });
      } else if (settings.autoplayNext) {
        get().next();
      } else {
        set({ status: "paused" });
      }
    },

    reset: () => set(initialState),

    restoreQueue: (tracks, startIndex = 0, startTime = 0) => {
      set({
        queue: tracks,
        queueIndex: startIndex,
        currentTrack: tracks[startIndex] || null,
        currentTime: startTime,
        status: "paused", // Start paused, user must click play
        isVisible: tracks.length > 0,
        error: null,
      });
    },

    getState: () => {
      const state = get();
      return {
        currentTrack: state.currentTrack,
        status: state.status,
        currentTime: state.currentTime,
        duration: state.duration,
        queue: state.queue,
        queueIndex: state.queueIndex,
        settings: state.settings,
        error: state.error,
        isVisible: state.isVisible,
      };
    },
  }))
);

// ============================================
// Selector Hooks
// ============================================

export const useCurrentTrack = () => usePlayerStore((s) => s.currentTrack);
export const usePlayerStatus = () => usePlayerStore((s) => s.status);
export const useIsPlaying = () => usePlayerStore((s) => s.status === "playing");
export const usePlayerVisible = () => usePlayerStore((s) => s.isVisible);
export const usePlayerSettings = () => usePlayerStore((s) => s.settings);
export const useCurrentTime = () => usePlayerStore((s) => s.currentTime);
export const useDuration = () => usePlayerStore((s) => s.duration);
export const useQueue = () => usePlayerStore((s) => s.queue);
export const useQueueIndex = () => usePlayerStore((s) => s.queueIndex);

