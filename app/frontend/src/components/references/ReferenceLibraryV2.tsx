/**
 * ReferenceLibraryV2 Component
 *
 * Backend-integrated reference library interface.
 * All data flows through the Rust backend API.
 * - Audio files stored in R2 via backend signed URLs
 * - Track metadata in Postgres
 * - Analysis triggered and stored by backend
 * - Annotations/regions CRUD via backend API
 *
 * Frontend performs 0% auth logic beyond forwarding cookies.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  usePlayerStore,
  formatTime,
  type QueueTrack,
} from "@/lib/player";
import { AudioAnalysisPanel } from "@/components/player";
import { QuickModeHeader } from "@/components/ui/QuickModeHeader";
import {
  referenceTracksApi,
  type ReferenceTrackResponse,
  type AnnotationResponse,
  type RegionResponse,
  type CreateAnnotationInput,
  type CreateRegionInput,
  ApiClientError,
} from "@/lib/api/reference-tracks";
import { useVault } from "@/lib/auth/VaultProvider";
import styles from "./ReferenceLibrary.module.css";

// ============================================
// Types
// ============================================

interface TrackWithDetails extends ReferenceTrackResponse {
  streamUrl?: string;
  annotations: AnnotationResponse[];
  regions: RegionResponse[];
}

// ============================================
// Component
// ============================================

export function ReferenceLibraryV2() {
  const [tracks, setTracks] = useState<ReferenceTrackResponse[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<TrackWithDetails | null>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [showRegionForm, setShowRegionForm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const playerStore = usePlayerStore();
  const { isLocked: isVaultLocked } = useVault();

  // Detect quick mode from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsQuickMode(params.get("quick") === "1");
    }
  }, []);

  // Load tracks from backend on mount
  useEffect(() => {
    async function loadTracks() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await referenceTracksApi.listTracks(1, 100);
        setTracks(response.data);
      } catch (e: unknown) {
        if (e instanceof ApiClientError) {
          if (e.isAuthError()) {
            setError("Please sign in to view your reference tracks.");
          } else {
            setError(`Failed to load tracks: ${e.message}`);
          }
        } else {
          setError("Failed to load tracks. Please try again.");
        }
        console.error("Failed to load tracks:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadTracks();
  }, []);

  // Handle file upload
  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const audioFiles = fileArray.filter(
      (f) =>
        f.type.startsWith("audio/") ||
        /\.(mp3|wav|flac|ogg|m4a|aac|webm)$/i.test(f.name)
    );

    if (audioFiles.length === 0) {
      setError("No audio files found in selection");
      return;
    }

    setIsUploading(true);
    setError(null);

    for (const file of audioFiles) {
      try {
        setUploadProgress(`Uploading ${file.name}...`);

        // Get signed upload URL from backend
        const { url: signedUrl, r2_key } = await referenceTracksApi.initUpload(
          file.name,
          file.type,
          file.size
        );

        // Upload file directly to R2 via signed URL
        setUploadProgress(`Uploading ${file.name} to storage...`);
        await referenceTracksApi.uploadFile(signedUrl, file, file.type);

        // Create track metadata in backend
        setUploadProgress(`Creating track record for ${file.name}...`);
        const track = await referenceTracksApi.createTrack({
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          r2_key,
          file_size_bytes: file.size,
          mime_type: file.type,
        });

        // Add to local state
        setTracks((prev) => [...prev, track]);

        // Trigger analysis
        setUploadProgress(`Starting analysis for ${file.name}...`);
        await referenceTracksApi.startAnalysis(track.id);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Upload failed";
        setError(`Failed to upload ${file.name}: ${message}`);
        console.error(`Failed to upload ${file.name}:`, e);
      }
    }

    setIsUploading(false);
    setUploadProgress(null);
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        handleUpload(files);
      }
      event.target.value = "";
    },
    [handleUpload]
  );

  // Select track and load details
  const handleSelectTrack = useCallback(
    async (track: ReferenceTrackResponse) => {
      setError(null);
      setShowAnalysisPanel(true);

      try {
        // Load stream URL, annotations, and regions in parallel
        const [streamResponse, annotations, regions] = await Promise.all([
          referenceTracksApi.getStreamUrl(track.id),
          referenceTracksApi.listAnnotations(track.id),
          referenceTracksApi.listRegions(track.id),
        ]);

        const trackWithDetails: TrackWithDetails = {
          ...track,
          streamUrl: streamResponse.url,
          annotations,
          regions,
        };

        setSelectedTrack(trackWithDetails);

        // Set up player queue with signed URL
        const queueTrack: QueueTrack = {
          id: track.id,
          title: track.name,
          artist: track.artist || "Reference Track",
          source: "Reference Library",
          audioUrl: streamResponse.url,
          duration: track.duration_seconds || undefined,
        };
        playerStore.setQueue([queueTrack], 0);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load track";
        setError(message);
        console.error("Failed to load track details:", e);
      }
    },
    [playerStore]
  );

  // Delete track
  const handleDeleteTrack = useCallback(
    async (trackId: string) => {
      if (!confirm("Delete this track? This cannot be undone.")) return;

      try {
        await referenceTracksApi.deleteTrack(trackId);
        setTracks((prev) => prev.filter((t) => t.id !== trackId));
        if (selectedTrack?.id === trackId) {
          setSelectedTrack(null);
          setShowAnalysisPanel(false);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Delete failed";
        setError(`Failed to delete track: ${message}`);
        console.error("Failed to delete track:", e);
      }
    },
    [selectedTrack]
  );

  // Create annotation
  const handleCreateAnnotation = useCallback(
    async (input: CreateAnnotationInput) => {
      if (!selectedTrack) return;

      try {
        const annotation = await referenceTracksApi.createAnnotation(
          selectedTrack.id,
          input
        );
        setSelectedTrack((prev) =>
          prev
            ? { ...prev, annotations: [...prev.annotations, annotation] }
            : null
        );
        setShowAnnotationForm(false);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to create";
        setError(`Failed to create annotation: ${message}`);
        console.error("Failed to create annotation:", e);
      }
    },
    [selectedTrack]
  );

  // Delete annotation
  const handleDeleteAnnotation = useCallback(
    async (annotationId: string) => {
      if (!selectedTrack) return;

      try {
        await referenceTracksApi.deleteAnnotation(annotationId);
        setSelectedTrack((prev) =>
          prev
            ? {
                ...prev,
                annotations: prev.annotations.filter((a) => a.id !== annotationId),
              }
            : null
        );
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to delete";
        setError(`Failed to delete annotation: ${message}`);
        console.error("Failed to delete annotation:", e);
      }
    },
    [selectedTrack]
  );

  // Create region
  const handleCreateRegion = useCallback(
    async (input: CreateRegionInput) => {
      if (!selectedTrack) return;

      try {
        const region = await referenceTracksApi.createRegion(
          selectedTrack.id,
          input
        );
        setSelectedTrack((prev) =>
          prev ? { ...prev, regions: [...prev.regions, region] } : null
        );
        setShowRegionForm(false);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to create";
        setError(`Failed to create region: ${message}`);
        console.error("Failed to create region:", e);
      }
    },
    [selectedTrack]
  );

  // Delete region
  const handleDeleteRegion = useCallback(
    async (regionId: string) => {
      if (!selectedTrack) return;

      try {
        await referenceTracksApi.deleteRegion(regionId);
        setSelectedTrack((prev) =>
          prev
            ? { ...prev, regions: prev.regions.filter((r) => r.id !== regionId) }
            : null
        );
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to delete";
        setError(`Failed to delete region: ${message}`);
        console.error("Failed to delete region:", e);
      }
    },
    [selectedTrack]
  );

  // Close analysis panel
  const handleCloseAnalysis = useCallback(() => {
    setShowAnalysisPanel(false);
    setSelectedTrack(null);
    setShowAnnotationForm(false);
    setShowRegionForm(false);
  }, []);

  // Format file size
  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Refresh track (e.g., after analysis completes)
  const handleRefreshTrack = useCallback(async () => {
    if (!selectedTrack) return;

    try {
      const updatedTrack = await referenceTracksApi.getTrack(selectedTrack.id);
      const [annotations, regions] = await Promise.all([
        referenceTracksApi.listAnnotations(selectedTrack.id),
        referenceTracksApi.listRegions(selectedTrack.id),
      ]);

      setSelectedTrack({
        ...updatedTrack,
        streamUrl: selectedTrack.streamUrl,
        annotations,
        regions,
      });

      setTracks((prev) =>
        prev.map((t) => (t.id === updatedTrack.id ? updatedTrack : t))
      );
    } catch (e) {
      console.error("Failed to refresh track:", e);
    }
  }, [selectedTrack]);

  return (
    <>
      {isQuickMode && <QuickModeHeader title="Quick Start - Reference Library" />}

      <div className={styles.container} data-testid="reference-library">
        {/* Vault Status Banner */}
        {isVaultLocked && (
          <div className={styles.vaultLockedBanner} role="status" aria-live="polite">
            <p className={styles.vaultLockedText}>
              🔒 Reference tracks are encrypted. Unlock vault to upload or modify tracks.
            </p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
            <button
              onClick={() => setError(null)}
              className={styles.closeButton}
              aria-label="Dismiss error"
              type="button"
            >
              ×
            </button>
          </div>
        )}

        {/* Sidebar: Track List */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Tracks</h2>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.webm"
              onChange={handleFileInputChange}
              style={{ display: "none" }}
              data-testid="file-input"
            />
            <button
              className={styles.addButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isVaultLocked}
              type="button"
              title={isVaultLocked ? "Unlock vault to upload tracks" : ""}
            >
              {isUploading ? "Uploading..." : "+ Upload"}
            </button>
          </div>

          {uploadProgress && (
            <div className={styles.uploadProgress}>{uploadProgress}</div>
          )}

          <div className={styles.trackList}>
            {isLoading ? (
              <div className={styles.emptyState}>
                <p>Loading tracks...</p>
              </div>
            ) : tracks.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No tracks yet</p>
                <p className={styles.emptyHint}>
                  Upload audio files to add reference tracks
                </p>
              </div>
            ) : (
              tracks.map((track) => (
                <div
                  key={track.id}
                  className={`${styles.trackItem} ${
                    track.id === selectedTrack?.id ? styles.selected : ""
                  } ${track.status !== "ready" ? styles.processing : ""}`}
                  data-testid="track-list-item"
                >
                  <button
                    className={styles.trackContent}
                    onClick={() => handleSelectTrack(track)}
                    type="button"
                  >
                    <span className={styles.trackName}>
                      {track.status === "processing" ? "(processing) " : ""}
                      {track.status === "uploading" ? "(uploading) " : ""}
                      {track.status === "error" ? "(error) " : ""}
                      {track.name}
                    </span>
                    <span className={styles.trackMeta}>
                      {track.duration_seconds &&
                        formatTime(track.duration_seconds)}
                      {track.file_size_bytes &&
                        ` - ${formatBytes(track.file_size_bytes)}`}
                      {track.bpm && ` - ${track.bpm} BPM`}
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
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          {selectedTrack ? (
            <>
              <div className={styles.libraryHeader}>
                <div className={styles.libraryTitle}>
                  <h2>{selectedTrack.name}</h2>
                  {selectedTrack.status === "processing" && (
                    <span className={styles.processingBadge}>
                      Analysis in progress...
                      <button
                        onClick={handleRefreshTrack}
                        className={styles.refreshButton}
                        type="button"
                      >
                        Refresh
                      </button>
                    </span>
                  )}
                </div>
                <div className={styles.libraryActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => setShowAnnotationForm(true)}
                    type="button"
                  >
                    + Marker
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => setShowRegionForm(true)}
                    type="button"
                  >
                    + Region
                  </button>
                </div>
              </div>

              {/* Track Metadata */}
              <div className={styles.trackMetadata}>
                <span>Duration: {selectedTrack.duration_seconds ? formatTime(selectedTrack.duration_seconds) : "Unknown"}</span>
                {selectedTrack.bpm && <span>BPM: {selectedTrack.bpm}</span>}
                {selectedTrack.key_signature && <span>Key: {selectedTrack.key_signature}</span>}
                {selectedTrack.artist && <span>Artist: {selectedTrack.artist}</span>}
              </div>

              {/* Visualizer Placeholder */}
              <div className={styles.visualizerContainer} data-testid="track-visualizer">
                <canvas id="waveform-canvas" className={styles.waveformCanvas} />
                <div className={styles.playbackControls}>
                  <span data-testid="current-time">0:00</span>
                  <span> / </span>
                  <span>{selectedTrack.duration_seconds ? formatTime(selectedTrack.duration_seconds) : "0:00"}</span>
                </div>
              </div>

              {/* Annotation Form */}
              {showAnnotationForm && (
                <AnnotationForm
                  onSubmit={handleCreateAnnotation}
                  onCancel={() => setShowAnnotationForm(false)}
                />
              )}

              {/* Region Form */}
              {showRegionForm && (
                <RegionForm
                  onSubmit={handleCreateRegion}
                  onCancel={() => setShowRegionForm(false)}
                  trackDurationMs={
                    selectedTrack.duration_seconds
                      ? selectedTrack.duration_seconds * 1000
                      : 60000
                  }
                />
              )}

              {/* Annotations List */}
              <div className={styles.annotationsList} data-testid="annotations-panel">
                <h3>Markers ({selectedTrack.annotations.length})</h3>
                {selectedTrack.annotations.length === 0 ? (
                  <p className={styles.emptyHint}>No markers yet</p>
                ) : (
                  selectedTrack.annotations.map((annotation) => (
                    <div key={annotation.id} className={styles.annotationItem}>
                      <div className={styles.annotationContent}>
                        <span className={styles.annotationTitle}>
                          {annotation.title}
                        </span>
                        <span className={styles.annotationTime}>
                          {formatTime(annotation.start_time_ms / 1000)}
                          {annotation.end_time_ms &&
                            ` - ${formatTime(annotation.end_time_ms / 1000)}`}
                        </span>
                        <span
                          className={styles.annotationCategory}
                          style={{ backgroundColor: annotation.color }}
                        >
                          {annotation.category}
                        </span>
                      </div>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleDeleteAnnotation(annotation.id)}
                        title="Delete"
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Regions List */}
              <div className={styles.regionsList} data-testid="region-controls">
                <h3>Regions ({selectedTrack.regions.length})</h3>
                {selectedTrack.regions.length === 0 ? (
                  <p className={styles.emptyHint}>No regions yet</p>
                ) : (
                  selectedTrack.regions.map((region) => (
                    <div key={region.id} className={styles.regionItem}>
                      <div className={styles.regionContent}>
                        <span className={styles.regionName}>{region.name}</span>
                        <span className={styles.regionTime}>
                          {formatTime(region.start_time_ms / 1000)} -{" "}
                          {formatTime(region.end_time_ms / 1000)}
                        </span>
                        <span className={styles.regionType}>
                          {region.section_type}
                        </span>
                        {region.is_loop && (
                          <span
                            className={styles.loopBadge}
                            data-testid="loop-badge"
                          >
                            LOOP
                          </span>
                        )}
                      </div>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleDeleteRegion(region.id)}
                        title="Delete"
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>Select a track to view details</p>
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
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <div className={styles.analysisPanelContent}>
              <AudioAnalysisPanel
                analysis={null}
                trackName={selectedTrack.name}
              />
            </div>
          </aside>
        )}
      </div>
    </>
  );
}

// ============================================
// Annotation Form Component
// ============================================

function AnnotationForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: CreateAnnotationInput) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CreateAnnotationInput["category"]>("general");
  const [startTimeMs, setStartTimeMs] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      content: content.trim() || undefined,
      category,
      start_time_ms: startTimeMs,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h4>New Marker</h4>
      <div className={styles.formField}>
        <label htmlFor="annotation-title">Title</label>
        <input
          id="annotation-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Marker title..."
          required
          autoFocus
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="annotation-content">Notes</label>
        <textarea
          id="annotation-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Optional notes..."
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="annotation-category">Category</label>
        <select
          id="annotation-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as CreateAnnotationInput["category"])}
        >
          <option value="general">General</option>
          <option value="technique">Technique</option>
          <option value="mix">Mix</option>
          <option value="mastering">Mastering</option>
          <option value="arrangement">Arrangement</option>
          <option value="production">Production</option>
        </select>
      </div>
      <div className={styles.formField}>
        <label htmlFor="annotation-time">Time (seconds)</label>
        <input
          id="annotation-time"
          type="number"
          min="0"
          step="0.1"
          value={startTimeMs / 1000}
          onChange={(e) => setStartTimeMs(parseFloat(e.target.value) * 1000)}
        />
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryButton}>
          Create
        </button>
        <button type="button" onClick={onCancel} className={styles.ghostButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ============================================
// Region Form Component
// ============================================

function RegionForm({
  onSubmit,
  onCancel,
  trackDurationMs,
}: {
  onSubmit: (input: CreateRegionInput) => void;
  onCancel: () => void;
  trackDurationMs: number;
}) {
  const [name, setName] = useState("");
  const [sectionType, setSectionType] =
    useState<CreateRegionInput["section_type"]>("custom");
  const [startTimeMs, setStartTimeMs] = useState(0);
  const [endTimeMs, setEndTimeMs] = useState(Math.min(10000, trackDurationMs));
  const [isLoop, setIsLoop] = useState(false);
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (endTimeMs <= startTimeMs) {
      alert("End time must be after start time");
      return;
    }
    onSubmit({
      name: name.trim(),
      section_type: sectionType,
      start_time_ms: startTimeMs,
      end_time_ms: endTimeMs,
      is_loop: isLoop,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h4>New Region</h4>
      <div className={styles.formField}>
        <label htmlFor="region-name">Name</label>
        <input
          id="region-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Region name..."
          required
          autoFocus
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="region-section-type">Section Type</label>
        <select
          id="region-section-type"
          value={sectionType}
          onChange={(e) =>
            setSectionType(e.target.value as CreateRegionInput["section_type"])
          }
        >
          <option value="intro">Intro</option>
          <option value="verse">Verse</option>
          <option value="chorus">Chorus</option>
          <option value="bridge">Bridge</option>
          <option value="breakdown">Breakdown</option>
          <option value="buildup">Buildup</option>
          <option value="drop">Drop</option>
          <option value="outro">Outro</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      <div className={styles.formField}>
        <label htmlFor="region-start">Start (seconds)</label>
        <input
          id="region-start"
          type="number"
          min="0"
          step="0.1"
          value={startTimeMs / 1000}
          onChange={(e) => setStartTimeMs(parseFloat(e.target.value) * 1000)}
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="region-end">End (seconds)</label>
        <input
          id="region-end"
          type="number"
          min="0"
          step="0.1"
          value={endTimeMs / 1000}
          onChange={(e) => setEndTimeMs(parseFloat(e.target.value) * 1000)}
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="region-loop">
          <input
            id="region-loop"
            type="checkbox"
            checked={isLoop}
            onChange={(e) => setIsLoop(e.target.checked)}
          />
          Loop Region
        </label>
      </div>
      <div className={styles.formField}>
        <label htmlFor="region-notes">Notes</label>
        <textarea
          id="region-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
        />
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryButton}>
          Create
        </button>
        <button type="button" onClick={onCancel} className={styles.ghostButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default ReferenceLibraryV2;
