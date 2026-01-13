"use client";

/**
 * Focus Tracks Component
 * Shows tracks from the "Focus" reference library
 * Allows playing focus music during sessions
 */

import { useState, useEffect, useCallback } from "react";
import { usePlayerStore } from "@/lib/player";
import { listFocusLibraries, createFocusLibrary, FocusLibrary } from "@/lib/api/focus-libraries";
import styles from "./FocusTracks.module.css";

// Use focus libraries from backend API
const FOCUS_LIBRARY_NAME = "Focus";

interface ReferenceTrack {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  durationMs?: number;
  audioUrl: string;
  storageId: string;
}

interface Library {
  id: string;
  name: string;
  tracks: ReferenceTrack[];
  createdAt: string;
  library_type?: string;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function FocusTracks() {
  const [focusLibrary, setFocusLibrary] = useState<FocusLibrary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const playerStore = usePlayerStore();

  // Load focus library from backend API
  useEffect(() => {
    async function loadFocusLibrary() {
      setIsLoading(true);
      try {
        const response = await listFocusLibraries(1, 100);
        // Find the "Focus" library from backend
        // Get the first library as default focus library
        if (response.libraries && response.libraries.length > 0) {
          const focusLib = response.libraries.find((lib) => lib.library_type === 'focus') || response.libraries[0];
          setFocusLibrary(focusLib);
        } else {
          // No libraries exist yet - user hasn't created any
          setFocusLibrary(null);
        }
      } catch (error) {
        console.error("Failed to load focus libraries:", error);
        setFocusLibrary(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadFocusLibrary();
  }, []);

  // Play a track
  const handlePlayTrack = useCallback(
    (track: ReferenceTrack, index: number) => {
      if (!focusLibrary) return;

      // For now, focus library doesn't include tracks in the API response
      // This is a placeholder for future track management
      // TODO: Integrate with track fetching when API supports it
      const queueTracks: Array<{ id: string; title: string; artist: string; source: string; audioUrl: string; duration?: number }> = [];

      if (queueTracks.length > 0) {
        playerStore.setQueue(queueTracks, index);
      }
    },
    [focusLibrary, playerStore]
  );

  // DEPRECATED: localStorage-based library creation (2026-01-10)
  // This should use backend API: POST /api/focus/libraries
  // Create focus library
  const handleCreateLibrary = useCallback(async () => {
    try {
      const newLibrary = await createFocusLibrary(FOCUS_LIBRARY_NAME);
      setFocusLibrary(null); // NOTE: Backend track persistence not yet implemented
    } catch (error) {
      console.error("Failed to create focus library:", error);
    }
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading focus tracks...</div>
      </div>
    );
  }

  if (!focusLibrary) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h3 className={styles.emptyTitle}>No Focus Library</h3>
          <p className={styles.emptyText}>
            Create a &quot;Focus&quot; library in Reference to add focus music.
          </p>
          <button className={styles.createButton} onClick={handleCreateLibrary}>
            Create Focus Library
          </button>
        </div>
      </div>
    );
  }

  // For now, focus library tracks are not yet available from API
  // Return empty state with message about upcoming feature
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Focus Music</h3>
        <span className={styles.count}>0 tracks</span>
      </div>
      <div className={styles.empty}>
        <p className={styles.emptyText}>
          Focus library feature coming soon.
        </p>
      </div>
    </div>
  );
}

