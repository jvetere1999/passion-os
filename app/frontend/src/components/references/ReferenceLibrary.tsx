/**
 * ReferenceLibrary Component
 * Main reference library interface with library list, track list, and analysis panel
 *
 * Audio files are stored in IndexedDB for persistence across sessions.
 * Files are only accessible on the machine they were added on.
 * Supports quick mode via ?quick=1 query param
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import {
  usePlayerStore,
  formatTime,
  analyzeAudio,
  type QueueTrack,
  type AudioAnalysis,
  type AudioAnnotations,
  getCachedAnalysis,
  saveAnalysisToCache,
  generateContentHash,
} from "@/lib/player";
import {
  storeAudioFile,
  getAudioFileUrl,
  deleteAudioFile,
  deleteAudioFiles,
} from "@/lib/player/local-storage";
import { AudioAnalysisPanel } from "@/components/player";
import { QuickModeHeader } from "@/components/ui/QuickModeHeader";
import styles from "./ReferenceLibrary.module.css";

// ============================================
// Types (local client-side storage for now)
// ============================================

interface ReferenceTrack {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  durationMs?: number;
  audioUrl: string; // Object URL from IndexedDB blob
  analysis?: AudioAnalysis;
  annotations?: AudioAnnotations;
  /** ID used to retrieve file from IndexedDB */
  storageId: string;
}

interface Library {
  id: string;
  name: string;
  tracks: ReferenceTrack[];
  createdAt: string;
}

// ============================================
// Storage Key
// ============================================

const STORAGE_KEY = "passion_reference_libraries_v2";

function loadLibraries(): Library[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLibraries(libraries: Library[]): void {
  if (typeof window === "undefined") return;
  try {
    // Don't persist audioUrl (blob URLs) - they'll be regenerated from IndexedDB
    const serialized = libraries.map((lib) => ({
      ...lib,
      tracks: lib.tracks.map((track) => ({
        ...track,
        audioUrl: "", // Will be loaded from IndexedDB on next session
      })),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (e) {
    console.error("Failed to save libraries:", e);
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================
// Component
// ============================================

export function ReferenceLibrary() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [isCreatingLibrary, setIsCreatingLibrary] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState("");
  const [processingCount, setProcessingCount] = useState(0);
  const [isRestoringUrls, setIsRestoringUrls] = useState(false);
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [isQuickMode, setIsQuickMode] = useState(false);

  const playerStore = usePlayerStore();

  // Detect quick mode from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const quick = params.get("quick") === "1";
      setIsQuickMode(quick);
      // In quick mode, show import options
      if (quick) {
        setShowImportOptions(true);
      }
    }
  }, []);

  // Load libraries on mount and restore audio URLs from IndexedDB
  useEffect(() => {
    async function loadAndRestoreLibraries() {
      const loadedLibraries = loadLibraries();

      if (loadedLibraries.length === 0) {
        setLibraries([]);
        return;
      }

      setIsRestoringUrls(true);

      // Restore audio URLs from IndexedDB for all tracks
      const restoredLibraries = await Promise.all(
        loadedLibraries.map(async (lib) => {
          const restoredTracks = await Promise.all(
            lib.tracks.map(async (track) => {
              // If track has a storageId, try to load from IndexedDB
              if (track.storageId) {
                try {
                  const audioUrl = await getAudioFileUrl(track.storageId);
                  if (audioUrl) {
                    return { ...track, audioUrl };
                  }
                } catch (e) {
                  console.error("Failed to restore audio for track:", track.name, e);
                }
              }
              return track;
            })
          );
          return { ...lib, tracks: restoredTracks };
        })
      );

      setLibraries(restoredLibraries);
      setIsRestoringUrls(false);
    }

    loadAndRestoreLibraries();
  }, []);

  const selectedLibrary = libraries.find((l) => l.id === selectedLibraryId) || null;
  const selectedTrack = selectedLibrary?.tracks.find((t) => t.id === selectedTrackId) || null;

  // Create new library
  const handleCreateLibrary = useCallback(() => {
    if (!newLibraryName.trim()) return;

    const newLibrary: Library = {
      id: generateId(),
      name: newLibraryName.trim(),
      tracks: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [...libraries, newLibrary];
    setLibraries(updated);
    saveLibraries(updated);
    setSelectedLibraryId(newLibrary.id);
    setIsCreatingLibrary(false);
    setNewLibraryName("");
  }, [newLibraryName, libraries]);

  // Delete library
  const handleDeleteLibrary = useCallback(async () => {
    if (!selectedLibraryId) return;
    if (!confirm("Delete this library and all its tracks?")) return;

    // Revoke object URLs and delete from IndexedDB
    const lib = libraries.find((l) => l.id === selectedLibraryId);
    if (lib) {
      // Revoke blob URLs
      lib.tracks.forEach((track) => {
        if (track.audioUrl) URL.revokeObjectURL(track.audioUrl);
      });

      // Delete files from IndexedDB
      const storageIds = lib.tracks
        .filter((t) => t.storageId)
        .map((t) => t.storageId);
      if (storageIds.length > 0) {
        try {
          await deleteAudioFiles(storageIds);
        } catch (e) {
          console.error("Failed to delete audio files from storage:", e);
        }
      }
    }

    const updated = libraries.filter((l) => l.id !== selectedLibraryId);
    setLibraries(updated);
    saveLibraries(updated);
    setSelectedLibraryId(null);
    setSelectedTrackId(null);
  }, [selectedLibraryId, libraries]);

  // Import files - now a shared function that processes files
  const processImportedFiles = useCallback(async (files: FileList | File[]) => {
    if (!selectedLibraryId || !selectedLibrary) return;

    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const audioFiles = fileArray.filter(
      (f) =>
        f.type.startsWith("audio/") ||
        /\.(mp3|wav|flac|ogg|m4a|aac|webm)$/i.test(f.name)
    );

    if (audioFiles.length === 0) {
      alert("No audio files found in selection");
      return;
    }

    setProcessingCount(audioFiles.length);
    setShowImportOptions(false);

    const newTracks: ReferenceTrack[] = [];

    for (const file of audioFiles) {
      const trackId = generateId();
      const storageId = `audio_${trackId}`;

      // Store file in IndexedDB for persistence
      try {
        await storeAudioFile(storageId, file);
      } catch (e) {
        console.error("Failed to store audio file:", file.name, e);
        setProcessingCount((c) => c - 1);
        continue;
      }

      // Create blob URL for immediate playback
      const audioUrl = URL.createObjectURL(file);

      const track: ReferenceTrack = {
        id: trackId,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        audioUrl,
        storageId,
      };

      newTracks.push(track);

      // Analyze track in background with caching
      try {
        const arrayBuffer = await file.arrayBuffer();

        // Generate content hash for cache lookup
        const contentHash = await generateContentHash(arrayBuffer);

        // Check cache first
        const cachedAnalysis = await getCachedAnalysis(contentHash);

        if (cachedAnalysis) {
          // Use cached analysis - construct proper AudioAnalysis object
          track.analysis = {
            version: 1,
            source: "webaudio",
            bpm: cachedAnalysis.bpm,
          } as AudioAnalysis;
          track.durationMs = cachedAnalysis.durationMs;
        } else {
          // Compute analysis
          const analysis = await analyzeAudio(arrayBuffer);
          track.analysis = analysis || undefined;

          // Get duration from audio context
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const audioContext = new AudioContextClass();
          try {
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
            track.durationMs = Math.round(audioBuffer.duration * 1000);
          } finally {
            await audioContext.close();
          }

          // Save to cache - only save properties we have
          await saveAnalysisToCache({
            id: trackId,
            contentHash,
            name: file.name,
            durationMs: track.durationMs,
            bpm: analysis?.bpm,
          });
        }
      } catch (e) {
        console.error("Failed to analyze track:", file.name, e);
      }

      setProcessingCount((c) => c - 1);
    }

    const updatedLibrary = {
      ...selectedLibrary,
      tracks: [...selectedLibrary.tracks, ...newTracks],
    };

    const updated = libraries.map((l) =>
      l.id === selectedLibraryId ? updatedLibrary : l
    );
    setLibraries(updated);
    saveLibraries(updated);
  }, [selectedLibraryId, selectedLibrary, libraries]);

  // Handle file input change (for visible file input on iOS)
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processImportedFiles(files);
    }
    // Reset input so same file can be selected again
    event.target.value = "";
  }, [processImportedFiles]);

  // Legacy import files method (uses hidden input - kept for desktop)
  const handleImportFiles = useCallback(async () => {
    if (!selectedLibraryId || !selectedLibrary) return;

    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "audio/*";

    input.onchange = async () => {
      const files = input.files;
      if (files) {
        await processImportedFiles(files);
      }
    };

    input.click();
  }, [selectedLibraryId, selectedLibrary, processImportedFiles]);

  // Select and play track
  const handleSelectTrack = useCallback(
    async (track: ReferenceTrack) => {
      if (!selectedLibrary) return;

      setSelectedTrackId(track.id);
      setShowAnalysisPanel(true);

      // Build queue from all tracks in the library
      const trackIndex = selectedLibrary.tracks.findIndex((t) => t.id === track.id);

      const queueTracks: QueueTrack[] = selectedLibrary.tracks
        .filter((t) => t.audioUrl) // Only tracks with valid URLs
        .map((t) => ({
          id: t.id,
          title: t.name,
          artist: selectedLibrary.name,
          source: "Reference Library",
          audioUrl: t.audioUrl,
          duration: t.durationMs ? t.durationMs / 1000 : undefined,
        }));

      if (queueTracks.length > 0) {
        playerStore.setQueue(queueTracks, trackIndex >= 0 ? trackIndex : 0);
      }
    },
    [selectedLibrary, playerStore]
  );

  // Delete track
  const handleDeleteTrack = useCallback(
    async (trackId: string) => {
      if (!selectedLibrary || !selectedLibraryId) return;
      if (!confirm("Delete this track?")) return;

      const track = selectedLibrary.tracks.find((t) => t.id === trackId);
      if (track) {
        // Revoke blob URL
        if (track.audioUrl) {
          URL.revokeObjectURL(track.audioUrl);
        }

        // Delete from IndexedDB
        if (track.storageId) {
          try {
            await deleteAudioFile(track.storageId);
          } catch (e) {
            console.error("Failed to delete audio file from storage:", e);
          }
        }
      }

      const updatedLibrary = {
        ...selectedLibrary,
        tracks: selectedLibrary.tracks.filter((t) => t.id !== trackId),
      };

      const updated = libraries.map((l) =>
        l.id === selectedLibraryId ? updatedLibrary : l
      );
      setLibraries(updated);
      saveLibraries(updated);

      if (selectedTrackId === trackId) {
        setSelectedTrackId(null);
        setShowAnalysisPanel(false);
      }
    },
    [selectedLibrary, selectedLibraryId, libraries, selectedTrackId]
  );

  // Close analysis panel
  const handleCloseAnalysis = useCallback(() => {
    setShowAnalysisPanel(false);
    setSelectedTrackId(null);
  }, []);

  // Format file size
  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const analysisStats = selectedLibrary
    ? {
        total: selectedLibrary.tracks.length,
        analyzed: selectedLibrary.tracks.filter((t) => t.analysis).length,
      }
    : { total: 0, analyzed: 0 };

  return (
    <>
      {/* Quick Mode Header */}
      {isQuickMode && <QuickModeHeader title="Quick Start - Reference Library" />}

      <div className={styles.container}>
        {/* Sidebar: Libraries */}
        <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Libraries</h2>
          <button
            className={styles.addButton}
            onClick={() => setIsCreatingLibrary(true)}
            type="button"
          >
            + New
          </button>
        </div>

        {isCreatingLibrary && (
          <div className={styles.createForm}>
            <input
              type="text"
              value={newLibraryName}
              onChange={(e) => setNewLibraryName(e.target.value)}
              placeholder="Library name..."
              className={styles.input}
              onKeyDown={(e) => e.key === "Enter" && handleCreateLibrary()}
              autoFocus
            />
            <div className={styles.createActions}>
              <button
                className={styles.primaryButton}
                onClick={handleCreateLibrary}
                type="button"
              >
                Create
              </button>
              <button
                className={styles.ghostButton}
                onClick={() => setIsCreatingLibrary(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className={styles.libraryList}>
          {libraries.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No libraries yet</p>
              <p className={styles.emptyHint}>
                Create a library to organize your reference tracks
              </p>
            </div>
          ) : (
            libraries.map((library) => (
              <button
                key={library.id}
                className={`${styles.libraryItem} ${
                  library.id === selectedLibraryId ? styles.selected : ""
                }`}
                onClick={() => setSelectedLibraryId(library.id)}
                type="button"
              >
                <span className={styles.libraryName}>{library.name}</span>
                <span className={styles.libraryCount}>
                  {library.tracks.length} tracks
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {selectedLibrary ? (
          <>
            <div className={styles.libraryHeader}>
              <div className={styles.libraryTitle}>
                <h2>{selectedLibrary.name}</h2>
                {processingCount > 0 && (
                  <span className={styles.processingBadge}>
                    Processing {processingCount} track
                    {processingCount === 1 ? "" : "s"}...
                  </span>
                )}
              </div>
              <div className={styles.libraryActions}>
                {/* Hidden file input for iOS PWA compatibility */}
                <input
                  type="file"
                  id="audio-file-input"
                  multiple
                  accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.webm"
                  onChange={handleFileInputChange}
                  style={{ display: "none" }}
                />

                {/* Import button with options dropdown */}
                <div className={styles.importDropdown}>
                  <button
                    className={styles.actionButton}
                    onClick={() => setShowImportOptions(!showImportOptions)}
                    type="button"
                  >
                    + Import
                  </button>
                  {showImportOptions && (
                    <div className={styles.dropdownMenu}>
                      <label
                        htmlFor="audio-file-input"
                        className={styles.dropdownItem}
                      >
                        Select Files
                      </label>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => {
                          setShowImportOptions(false);
                          handleImportFiles();
                        }}
                        type="button"
                      >
                        Browse (Desktop)
                      </button>
                    </div>
                  )}
                </div>

                <button
                  className={`${styles.actionButton} ${styles.danger}`}
                  onClick={handleDeleteLibrary}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Analysis Status */}
            {selectedLibrary.tracks.length > 0 && (
              <div className={styles.analysisStatus}>
                <span className={styles.statusItem}>
                  {analysisStats.analyzed}/{analysisStats.total} analyzed
                </span>
                {isRestoringUrls && (
                  <span className={styles.statusItem}>
                    Restoring audio files...
                  </span>
                )}
              </div>
            )}

            {/* Track List */}
            <div className={styles.trackList}>
              {selectedLibrary.tracks.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No tracks yet</p>
                  <p className={styles.emptyHint}>
                    Import audio files to add reference tracks
                  </p>
                </div>
              ) : (
                selectedLibrary.tracks.map((track) => (
                  <div
                    key={track.id}
                    className={`${styles.trackItem} ${
                      track.id === selectedTrackId ? styles.selected : ""
                    } ${!track.analysis ? styles.processing : ""}`}
                  >
                    <button
                      className={styles.trackContent}
                      onClick={() => handleSelectTrack(track)}
                      type="button"
                    >
                      <span className={styles.trackName}>
                        {!track.analysis ? `(processing) ` : ""}
                        {track.name}
                      </span>
                      <span className={styles.trackMeta}>
                        {track.durationMs && formatTime(track.durationMs / 1000)}
                        {track.size && ` - ${formatBytes(track.size)}`}
                        {track.analysis?.bpm && ` - ~${track.analysis.bpm} BPM`}
                      </span>
                    </button>
                    <div className={styles.trackActions}>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleDeleteTrack(track.id)}
                        title="Delete"
                        type="button"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          width="16"
                          height="16"
                        >
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <p>Select a library or create a new one</p>
          </div>
        )}
      </main>

      {/* Analysis Panel */}
      {showAnalysisPanel && selectedTrack && (
        <aside className={styles.analysisPanel}>
          <div className={styles.analysisPanelHeader}>
            <h3>{selectedTrack.name}</h3>
            <button
              className={styles.closeButton}
              onClick={handleCloseAnalysis}
              aria-label="Close analysis"
              type="button"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="20"
                height="20"
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          <div className={styles.analysisPanelContent}>
            <AudioAnalysisPanel
              analysis={selectedTrack.analysis || null}
              trackName={selectedTrack.name}
            />
          </div>
        </aside>
      )}
    </div>
    </>
  );
}

export default ReferenceLibrary;

