"use client";

/**
 * Reference Track Analysis Panel
 * Full-featured popup panel for analyzing reference tracks
 * Accessible from the bottom player at any point in the UI
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useReferenceStore,
  useAnalyzingTrack,
  useAnalysisPanelOpen,
  type Marker,
} from "@/lib/player/reference-store";
import { formatTime } from "@/lib/player";
import styles from "./AnalysisPanel.module.css";

// Marker type colors and labels
const MARKER_TYPES: Record<Marker["type"], { label: string; color: string }> = {
  intro: { label: "Intro", color: "#64d2ff" },
  verse: { label: "Verse", color: "#87c157" },
  chorus: { label: "Chorus", color: "#ff764d" },
  hook: { label: "Hook", color: "#ff6b9d" },
  buildup: { label: "Build", color: "#ffc107" },
  drop: { label: "Drop", color: "#e87878" },
  breakdown: { label: "Break", color: "#8bb8e8" },
  bridge: { label: "Bridge", color: "#b8d060" },
  outro: { label: "Outro", color: "#50b8b8" },
  section: { label: "Section", color: "#a0a0a0" },
  custom: { label: "Custom", color: "#808080" },
};

// Musical keys for selection
const MUSICAL_KEYS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
  "Am", "A#m", "Bm", "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m",
];

interface AnalysisPanelProps {
  currentTime?: number;
  onSeek?: (time: number) => void;
}

export function AnalysisPanel({ currentTime = 0, onSeek }: AnalysisPanelProps) {
  const isOpen = useAnalysisPanelOpen();
  const track = useAnalyzingTrack();
  const closePanel = useReferenceStore((s) => s.closeAnalysisPanel);
  const updateTrack = useReferenceStore((s) => s.updateTrack);
  const addMarker = useReferenceStore((s) => s.addMarker);
  const updateMarker = useReferenceStore((s) => s.updateMarker);
  const deleteMarker = useReferenceStore((s) => s.deleteMarker);
  const addTag = useReferenceStore((s) => s.addTag);
  const removeTag = useReferenceStore((s) => s.removeTag);

  const [activeTab, setActiveTab] = useState<"markers" | "info" | "notes">("markers");
  const [newMarkerType, setNewMarkerType] = useState<Marker["type"]>("section");
  const [newMarkerLabel, setNewMarkerLabel] = useState("");
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [isEditingBpm, setIsEditingBpm] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [tempBpm, setTempBpm] = useState("");
  const [tempKey, setTempKey] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, closePanel]);

  // Add marker at current time
  const handleAddMarker = useCallback(() => {
    if (!track) return;

    const markerConfig = MARKER_TYPES[newMarkerType];
    addMarker(track.id, {
      time: currentTime,
      label: newMarkerLabel || markerConfig.label,
      color: markerConfig.color,
      type: newMarkerType,
    });
    setNewMarkerLabel("");
  }, [track, currentTime, newMarkerType, newMarkerLabel, addMarker]);

  // Handle marker click - seek to position
  const handleMarkerClick = useCallback(
    (marker: Marker) => {
      if (onSeek) {
        onSeek(marker.time);
      }
    },
    [onSeek]
  );

  // Save BPM
  const handleSaveBpm = useCallback(() => {
    if (!track) return;
    const bpm = parseFloat(tempBpm);
    if (!isNaN(bpm) && bpm > 0 && bpm < 300) {
      updateTrack(track.id, { bpm });
    }
    setIsEditingBpm(false);
  }, [track, tempBpm, updateTrack]);

  // Save Key
  const handleSaveKey = useCallback(() => {
    if (!track) return;
    if (MUSICAL_KEYS.includes(tempKey)) {
      updateTrack(track.id, { key: tempKey });
    }
    setIsEditingKey(false);
  }, [track, tempKey, updateTrack]);

  // Add tag
  const handleAddTag = useCallback(() => {
    if (!track || !newTag.trim()) return;
    addTag(track.id, newTag.trim());
    setNewTag("");
  }, [track, newTag, addTag]);

  // Update notes
  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!track) return;
      updateTrack(track.id, { notes: e.target.value });
    },
    [track, updateTrack]
  );

  if (!isOpen || !track) return null;

  return (
    <div className={styles.overlay} onClick={closePanel}>
      <div
        ref={panelRef}
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.trackInfo}>
            <h2 className={styles.trackName}>{track.name}</h2>
            <span className={styles.trackArtist}>{track.artist}</span>
          </div>
          <button
            className={styles.closeBtn}
            onClick={closePanel}
            aria-label="Close panel"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className={styles.statsBar}>
          {/* BPM */}
          <div className={styles.stat}>
            <span className={styles.statLabel}>BPM</span>
            {isEditingBpm ? (
              <input
                type="number"
                className={styles.statInput}
                value={tempBpm}
                onChange={(e) => setTempBpm(e.target.value)}
                onBlur={handleSaveBpm}
                onKeyDown={(e) => e.key === "Enter" && handleSaveBpm()}
                autoFocus
                min="20"
                max="300"
              />
            ) : (
              <button
                className={styles.statValue}
                onClick={() => {
                  setTempBpm(track.bpm?.toString() || "");
                  setIsEditingBpm(true);
                }}
              >
                {track.bpm || "---"}
              </button>
            )}
          </div>

          {/* Key */}
          <div className={styles.stat}>
            <span className={styles.statLabel}>Key</span>
            {isEditingKey ? (
              <select
                className={styles.statSelect}
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                onBlur={handleSaveKey}
                autoFocus
              >
                <option value="">--</option>
                {MUSICAL_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            ) : (
              <button
                className={styles.statValue}
                onClick={() => {
                  setTempKey(track.key || "");
                  setIsEditingKey(true);
                }}
              >
                {track.key || "---"}
              </button>
            )}
          </div>

          {/* Duration */}
          <div className={styles.stat}>
            <span className={styles.statLabel}>Duration</span>
            <span className={styles.statValueFixed}>{formatTime(track.duration)}</span>
          </div>

          {/* Current Position */}
          <div className={styles.stat}>
            <span className={styles.statLabel}>Position</span>
            <span className={styles.statValueFixed}>{formatTime(currentTime)}</span>
          </div>

          {/* Markers Count */}
          <div className={styles.stat}>
            <span className={styles.statLabel}>Markers</span>
            <span className={styles.statValueFixed}>{track.markers.length}</span>
          </div>

          {/* Analysis */}
          {track.analysis && (
            <>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Peak</span>
                <span className={styles.statValueFixed}>{track.analysis.peakDb.toFixed(1)} dB</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>RMS</span>
                <span className={styles.statValueFixed}>{track.analysis.rmsDb.toFixed(1)} dB</span>
              </div>
              {track.analysis.lufs && (
                <div className={styles.stat}>
                  <span className={styles.statLabel}>LUFS</span>
                  <span className={styles.statValueFixed}>{track.analysis.lufs.toFixed(1)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "markers" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("markers")}
          >
            Markers
          </button>
          <button
            className={`${styles.tab} ${activeTab === "info" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("info")}
          >
            Info & Tags
          </button>
          <button
            className={`${styles.tab} ${activeTab === "notes" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("notes")}
          >
            Notes
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* Markers Tab */}
          {activeTab === "markers" && (
            <div className={styles.markersTab}>
              {/* Add Marker Controls */}
              <div className={styles.addMarker}>
                <div className={styles.addMarkerRow}>
                  <select
                    className={styles.markerTypeSelect}
                    value={newMarkerType}
                    onChange={(e) => setNewMarkerType(e.target.value as Marker["type"])}
                  >
                    {Object.entries(MARKER_TYPES).map(([type, config]) => (
                      <option key={type} value={type}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className={styles.markerLabelInput}
                    placeholder="Label (optional)"
                    value={newMarkerLabel}
                    onChange={(e) => setNewMarkerLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMarker()}
                  />
                  <button className={styles.addMarkerBtn} onClick={handleAddMarker}>
                    + Add at {formatTime(currentTime)}
                  </button>
                </div>
              </div>

              {/* Markers List */}
              <div className={styles.markersList}>
                {track.markers.length === 0 ? (
                  <div className={styles.emptyState}>
                    No markers yet. Add markers to highlight key moments in the track.
                  </div>
                ) : (
                  track.markers.map((marker) => (
                    <div
                      key={marker.id}
                      className={`${styles.markerItem} ${editingMarkerId === marker.id ? styles.markerEditing : ""}`}
                      onClick={() => handleMarkerClick(marker)}
                    >
                      <div
                        className={styles.markerColor}
                        style={{ backgroundColor: marker.color }}
                      />
                      <div className={styles.markerTime}>{formatTime(marker.time)}</div>
                      <div className={styles.markerLabel}>
                        {editingMarkerId === marker.id ? (
                          <input
                            type="text"
                            className={styles.markerEditInput}
                            defaultValue={marker.label}
                            onBlur={(e) => {
                              updateMarker(track.id, marker.id, { label: e.target.value });
                              setEditingMarkerId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                updateMarker(track.id, marker.id, {
                                  label: (e.target as HTMLInputElement).value,
                                });
                                setEditingMarkerId(null);
                              } else if (e.key === "Escape") {
                                setEditingMarkerId(null);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          marker.label
                        )}
                      </div>
                      <span className={styles.markerType}>{MARKER_TYPES[marker.type].label}</span>
                      <div className={styles.markerActions}>
                        <button
                          className={styles.markerActionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMarkerId(marker.id);
                          }}
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className={styles.markerActionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMarker(track.id, marker.id);
                          }}
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Info & Tags Tab */}
          {activeTab === "info" && (
            <div className={styles.infoTab}>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <label className={styles.infoLabel}>Genre</label>
                  <input
                    type="text"
                    className={styles.infoInput}
                    value={track.genre || ""}
                    onChange={(e) => updateTrack(track.id, { genre: e.target.value })}
                    placeholder="e.g., House, Techno, Hip-Hop"
                  />
                </div>
                <div className={styles.infoRow}>
                  <label className={styles.infoLabel}>Album</label>
                  <input
                    type="text"
                    className={styles.infoInput}
                    value={track.album || ""}
                    onChange={(e) => updateTrack(track.id, { album: e.target.value })}
                    placeholder="Album name"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className={styles.tagsSection}>
                <label className={styles.infoLabel}>Tags</label>
                <div className={styles.tagsList}>
                  {track.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                      <button
                        className={styles.tagRemove}
                        onClick={() => removeTag(track.id, tag)}
                      >
                        x
                      </button>
                    </span>
                  ))}
                  <div className={styles.addTagWrapper}>
                    <input
                      type="text"
                      className={styles.addTagInput}
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                      placeholder="Add tag..."
                    />
                  </div>
                </div>
              </div>

              {/* File Info */}
              <div className={styles.fileInfo}>
                <h4 className={styles.fileInfoTitle}>File Information</h4>
                <div className={styles.fileInfoGrid}>
                  <span className={styles.fileInfoLabel}>Size</span>
                  <span className={styles.fileInfoValue}>
                    {(track.fileSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <span className={styles.fileInfoLabel}>Added</span>
                  <span className={styles.fileInfoValue}>
                    {new Date(track.addedAt).toLocaleDateString()}
                  </span>
                  <span className={styles.fileInfoLabel}>Plays</span>
                  <span className={styles.fileInfoValue}>{track.playCount}</span>
                  {track.lastPlayedAt && (
                    <>
                      <span className={styles.fileInfoLabel}>Last Played</span>
                      <span className={styles.fileInfoValue}>
                        {new Date(track.lastPlayedAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div className={styles.notesTab}>
              <textarea
                className={styles.notesTextarea}
                value={track.notes}
                onChange={handleNotesChange}
                placeholder="Add notes about this track...&#10;&#10;Examples:&#10;- Great bass tone at 1:30&#10;- Reference for vocal processing&#10;- Sidechain compression on synth stabs&#10;- Mix bus saturation amount"
              />
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <span className={styles.footerHint}>
              Click markers to jump to position
            </span>
          </div>
          <div className={styles.footerRight}>
            <button className={styles.footerBtn} onClick={closePanel}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

