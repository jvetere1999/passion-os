/**
 * Player Persistence
 * Saves and loads player preferences and queue to localStorage
 * Client-side only
 */

"use client";

import type { PlayerSettings, QueueTrack } from "./types";
import { DEFAULT_SETTINGS } from "./types";

// ============================================
// Storage Keys & Version
// ============================================

export const PLAYER_STORAGE_VERSION = 2;

const STORAGE_KEY = "passion_player_v1";
const QUEUE_STORAGE_KEY = "passion_player_queue_v1";

// ============================================
// Types
// ============================================

interface PlayerStorageV2 {
  version: 2;
  settings: PlayerSettings;
}

export interface QueueStorage {
  version: typeof PLAYER_STORAGE_VERSION;
  queue: SerializedQueueTrack[];
  queueIndex: number;
  currentTime: number;
  updatedAt: string;
}

export interface SerializedQueueTrack {
  id: string;
  title: string;
  artist?: string;
  source?: string;
  audioUrl: string;
  duration?: number;
}

// ============================================
// Settings Persistence
// ============================================

export function loadPlayerSettings(): PlayerSettings {
  if (typeof localStorage === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored) as { version?: number; settings?: PlayerSettings };

    if (!parsed.version || (parsed.version !== 1 && parsed.version !== 2)) {
      return DEFAULT_SETTINGS;
    }

    return {
      ...DEFAULT_SETTINGS,
      ...parsed.settings,
    };
  } catch (e) {
    console.error("Failed to load player settings:", e);
    return DEFAULT_SETTINGS;
  }
}

export function savePlayerSettings(settings: PlayerSettings): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    const storage: PlayerStorageV2 = {
      version: PLAYER_STORAGE_VERSION,
      settings,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (e) {
    console.error("Failed to save player settings:", e);
  }
}

// ============================================
// Queue Persistence
// ============================================

function serializeTrack(track: QueueTrack): SerializedQueueTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    source: track.source,
    audioUrl: track.audioUrl,
    duration: track.duration,
  };
}

function deserializeTrack(serialized: SerializedQueueTrack): QueueTrack | null {
  if (!serialized.id || typeof serialized.id !== "string") return null;
  if (!serialized.title || typeof serialized.title !== "string") return null;
  if (!serialized.audioUrl || typeof serialized.audioUrl !== "string")
    return null;

  return {
    id: serialized.id,
    title: serialized.title,
    artist: serialized.artist,
    source: serialized.source,
    audioUrl: serialized.audioUrl,
    duration: serialized.duration,
  };
}

function validateQueueStorage(data: unknown): data is QueueStorage {
  if (!data || typeof data !== "object") return false;

  const storage = data as Record<string, unknown>;

  if (storage.version !== PLAYER_STORAGE_VERSION) return false;
  if (!Array.isArray(storage.queue)) return false;
  if (typeof storage.queueIndex !== "number") return false;
  if (storage.currentTime !== null && typeof storage.currentTime !== "number")
    return false;

  return true;
}

export function loadQueueState(): {
  queue: QueueTrack[];
  queueIndex: number;
  currentTime: number;
} | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);

    if (!validateQueueStorage(parsed)) {
      console.warn("Invalid queue storage format, clearing");
      localStorage.removeItem(QUEUE_STORAGE_KEY);
      return null;
    }

    // Check if data is too old (24 hours)
    const updatedAt = new Date(parsed.updatedAt).getTime();
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;
    if (now - updatedAt > maxAge) {
      console.info("Queue data expired, clearing");
      localStorage.removeItem(QUEUE_STORAGE_KEY);
      return null;
    }

    const queue: QueueTrack[] = [];
    for (const serialized of parsed.queue) {
      const track = deserializeTrack(serialized);
      if (track) {
        queue.push(track);
      }
    }

    if (queue.length === 0) {
      return null;
    }

    let queueIndex = parsed.queueIndex;
    if (queueIndex >= queue.length) {
      queueIndex = queue.length - 1;
    }
    if (queueIndex < 0) {
      queueIndex = 0;
    }

    let currentTime = parsed.currentTime;
    if (currentTime === null || !isFinite(currentTime) || currentTime < 0) {
      currentTime = 0;
    }

    return {
      queue,
      queueIndex,
      currentTime,
    };
  } catch (e) {
    console.error("Failed to load queue state:", e);
    return null;
  }
}

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 2000;

export function saveQueueState(
  queue: QueueTrack[],
  queueIndex: number,
  currentTime: number
): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  saveDebounceTimer = setTimeout(() => {
    try {
      if (queue.length === 0) {
        localStorage.removeItem(QUEUE_STORAGE_KEY);
        return;
      }

      const serializedQueue = queue.map(serializeTrack);

      let sanitizedTime = currentTime;
      if (!isFinite(sanitizedTime) || sanitizedTime < 0) {
        sanitizedTime = 0;
      }

      const storage: QueueStorage = {
        version: PLAYER_STORAGE_VERSION,
        queue: serializedQueue,
        queueIndex,
        currentTime: sanitizedTime,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(storage));
    } catch (e) {
      console.error("Failed to save queue state:", e);
    }
  }, SAVE_DEBOUNCE_MS);
}

export function saveQueueStateImmediate(
  queue: QueueTrack[],
  queueIndex: number,
  currentTime: number
): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }

  try {
    if (queue.length === 0) {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
      return;
    }

    const serializedQueue = queue.map(serializeTrack);

    let sanitizedTime = currentTime;
    if (!isFinite(sanitizedTime) || sanitizedTime < 0) {
      sanitizedTime = 0;
    }

    const storage: QueueStorage = {
      version: PLAYER_STORAGE_VERSION,
      queue: serializedQueue,
      queueIndex,
      currentTime: sanitizedTime,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(storage));
  } catch (e) {
    console.error("Failed to save queue state:", e);
  }
}

export function clearQueueState(): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }

  localStorage.removeItem(QUEUE_STORAGE_KEY);
}

export function migratePlayerStorage(): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const parsed = JSON.parse(stored);
    if (parsed.version === 1) {
      const migrated: PlayerStorageV2 = {
        version: 2,
        settings: {
          ...DEFAULT_SETTINGS,
          ...parsed.settings,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    }
  } catch {
    // Migration failed, will use defaults
  }
}

