"use client";

/**
 * Ideas Client Component
 *
 * Quick capture for music ideas with helpful tools:
 * - Voice memo (record audio)
 * - Text note
 * - Key/BPM picker
 * - Mood/energy tags
 *
 * ADHD-friendly:
 * - One dominant action
 * - Quick entry
 * - No overwhelming options
 *
 * STORAGE RULE: Ideas are stored in D1 via /api/ideas API.
 * localStorage fallback is DEPRECATED when DISABLE_MASS_LOCAL_PERSISTENCE is enabled.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { DISABLE_MASS_LOCAL_PERSISTENCE } from "@/lib/storage/deprecation";
import styles from "./page.module.css";

interface Idea {
  id: string;
  type: "text" | "audio" | "melody";
  content: string;
  key?: string;
  bpm?: number;
  mood?: string;
  createdAt: string;
  audioUrl?: string;
}

interface IdeasClientProps {
  userId: string;
}

const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MODES = ["Major", "Minor"];
const MOODS = ["Energetic", "Chill", "Dark", "Uplifting", "Melancholic", "Aggressive"];
const BPM_PRESETS = [80, 100, 120, 140, 160];

export function IdeasClient({ userId: _userId }: IdeasClientProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [newIdea, setNewIdea] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>("Major");
  const [selectedBpm, setSelectedBpm] = useState<number | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showTools, setShowTools] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load ideas from D1 on mount
  useEffect(() => {
    async function fetchIdeas() {
      try {
        const response = await fetch("/api/ideas");
        if (response.ok) {
          const data = await response.json() as { ideas: Array<{
            id: string;
            title: string;
            content: string | null;
            category: string;
            tags: string[];
            isPinned: boolean;
            createdAt: string;
          }> };
          // Map D1 format to component format
          const mapped: Idea[] = (data.ideas || []).map((idea) => ({
            id: idea.id,
            type: "text" as const,
            content: idea.title,
            key: undefined,
            bpm: undefined,
            mood: idea.tags?.[0] || undefined,
            createdAt: idea.createdAt,
          }));
          setIdeas(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch ideas:", error);
        // Fallback to localStorage only if deprecation is disabled
        if (!DISABLE_MASS_LOCAL_PERSISTENCE) {
          try {
            const stored = localStorage.getItem("music_ideas");
            if (stored) {
              setIdeas(JSON.parse(stored));
            }
          } catch { /* ignore */ }
        }
      }
      setIsLoading(false);
    }
    fetchIdeas();
  }, []);

  // Save idea to D1
  const saveIdea = useCallback(async (idea: Idea) => {
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: idea.content,
          content: "",
          category: "general",
          key: idea.key,
          bpm: idea.bpm,
          mood: idea.mood,
          tags: idea.mood ? [idea.mood] : [],
        }),
      });
      if (response.ok) {
        const data = await response.json() as { idea: { id: string } };
        // Update local state with server-generated ID
        setIdeas(prev => [{ ...idea, id: data.idea.id }, ...prev.filter(i => i.id !== idea.id)]);
      }
    } catch (error) {
      console.error("Failed to save idea:", error);
    }
  }, []);

  // Handle quick capture
  const handleQuickCapture = useCallback(async () => {
    if (!newIdea.trim()) return;

    const idea: Idea = {
      id: `temp_${Date.now()}`,
      type: "text",
      content: newIdea.trim(),
      key: selectedKey ? `${selectedKey} ${selectedMode}` : undefined,
      bpm: selectedBpm || undefined,
      mood: selectedMood || undefined,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setIdeas(prev => [idea, ...prev]);
    setNewIdea("");
    setSelectedKey(null);
    setSelectedBpm(null);
    setSelectedMood(null);
    setShowTools(false);
    inputRef.current?.focus();

    // Save to D1
    await saveIdea(idea);
  }, [newIdea, selectedKey, selectedMode, selectedBpm, selectedMood, saveIdea]);

  // Handle voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);

        const idea: Idea = {
          id: `temp_${Date.now()}`,
          type: "audio",
          content: "Voice memo",
          audioUrl,
          createdAt: new Date().toISOString(),
        };

        // Optimistic update
        setIdeas(prev => [idea, ...prev]);
        // Save to D1 (audio URL is local only for now)
        await saveIdea(idea);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }, [saveIdea]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Delete idea
  const handleDelete = useCallback(async (id: string) => {
    // Optimistic update
    setIdeas(prev => prev.filter(idea => idea.id !== id));
    // Delete from D1
    try {
      await fetch(`/api/ideas?id=${id}`, { method: "DELETE" });
    } catch (error) {
      console.error("Failed to delete idea:", error);
    }
  }, []);

  // Handle key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQuickCapture();
    }
  }, [handleQuickCapture]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ideas</h1>
        <p className={styles.subtitle}>Capture it before it disappears.</p>
      </header>

      {/* Quick Capture */}
      <div className={styles.captureSection}>
        <div className={styles.captureInput}>
          <input
            ref={inputRef}
            type="text"
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type an idea..."
            className={styles.input}
            autoFocus
          />
          <button
            className={styles.captureBtn}
            onClick={handleQuickCapture}
            disabled={!newIdea.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Tool Toggles */}
        <div className={styles.toolToggles}>
          <button
            className={`${styles.toolToggle} ${showTools ? styles.active : ""}`}
            onClick={() => setShowTools(!showTools)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Tools
          </button>
          <button
            className={`${styles.recordToggle} ${isRecording ? styles.recording : ""}`}
            onClick={isRecording ? stopRecording : startRecording}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isRecording ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            {isRecording ? "Stop" : "Record"}
          </button>
        </div>

        {/* Tools Panel */}
        {showTools && (
          <div className={styles.toolsPanel}>
            {/* Key Picker */}
            <div className={styles.toolGroup}>
              <label className={styles.toolLabel}>Key</label>
              <div className={styles.keyPicker}>
                <div className={styles.keyGrid}>
                  {KEYS.map((key) => (
                    <button
                      key={key}
                      className={`${styles.keyBtn} ${selectedKey === key ? styles.selected : ""}`}
                      onClick={() => setSelectedKey(selectedKey === key ? null : key)}
                    >
                      {key}
                    </button>
                  ))}
                </div>
                <div className={styles.modeToggle}>
                  {MODES.map((mode) => (
                    <button
                      key={mode}
                      className={`${styles.modeBtn} ${selectedMode === mode ? styles.selected : ""}`}
                      onClick={() => setSelectedMode(mode)}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BPM Picker */}
            <div className={styles.toolGroup}>
              <label className={styles.toolLabel}>BPM</label>
              <div className={styles.bpmPicker}>
                {BPM_PRESETS.map((bpm) => (
                  <button
                    key={bpm}
                    className={`${styles.bpmBtn} ${selectedBpm === bpm ? styles.selected : ""}`}
                    onClick={() => setSelectedBpm(selectedBpm === bpm ? null : bpm)}
                  >
                    {bpm}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood Tags */}
            <div className={styles.toolGroup}>
              <label className={styles.toolLabel}>Mood</label>
              <div className={styles.moodPicker}>
                {MOODS.map((mood) => (
                  <button
                    key={mood}
                    className={`${styles.moodBtn} ${selectedMood === mood ? styles.selected : ""}`}
                    onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ideas List */}
      <main className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>Loading ideas...</div>
        ) : ideas.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3>No ideas yet</h3>
            <p>Type something above to capture your first idea.</p>
          </div>
        ) : (
          <ul className={styles.ideaList}>
            {ideas.map((idea) => (
              <li key={idea.id} className={styles.ideaItem}>
                <div className={styles.ideaContent}>
                  {idea.type === "audio" && idea.audioUrl ? (
                    <audio src={idea.audioUrl} controls className={styles.audioPlayer} />
                  ) : (
                    <p className={styles.ideaText}>{idea.content}</p>
                  )}
                  {(idea.key || idea.bpm || idea.mood) && (
                    <div className={styles.ideaTags}>
                      {idea.key && <span className={styles.keyTag}>{idea.key}</span>}
                      {idea.bpm && <span className={styles.bpmTag}>{idea.bpm} BPM</span>}
                      {idea.mood && <span className={styles.moodTag}>{idea.mood}</span>}
                    </div>
                  )}
                </div>
                <div className={styles.ideaMeta}>
                  <span className={styles.ideaTime}>{formatTime(idea.createdAt)}</span>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(idea.id)}
                    aria-label="Delete idea"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

