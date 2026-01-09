"use client";

/**
 * Patch Journal Client Component
 * Log and track synthesis experiments
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./page.module.css";

interface JournalEntry {
  id: string;
  synth: "serum" | "vital" | "other";
  patchName: string;
  tags: string[];
  notes: string;
  whatLearned: string;
  whatBroke: string;
  presetReference: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "passion_patch_journal_v1";

interface JournalClientProps {
  userId: string;
}

export function JournalClient({ userId }: JournalClientProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [synthFilter, setSynthFilter] = useState<"all" | "serum" | "vital" | "other">("all");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Form state
  const [formSynth, setFormSynth] = useState<"serum" | "vital" | "other">("serum");
  const [formPatchName, setFormPatchName] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formWhatLearned, setFormWhatLearned] = useState("");
  const [formWhatBroke, setFormWhatBroke] = useState("");
  const [formPresetRef, setFormPresetRef] = useState("");

  // Load entries
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load journal:", e);
    }
  }, []);

  // Save entries
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error("Failed to save journal:", e);
    }
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSynth = synthFilter === "all" || entry.synth === synthFilter;
      const matchesSearch =
        !searchQuery ||
        entry.patchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSynth && matchesSearch;
    });
  }, [entries, synthFilter, searchQuery]);

  const resetForm = useCallback(() => {
    setFormSynth("serum");
    setFormPatchName("");
    setFormTags("");
    setFormNotes("");
    setFormWhatLearned("");
    setFormWhatBroke("");
    setFormPresetRef("");
    setIsEditing(false);
    setSelectedEntry(null);
  }, []);

  const handleCreate = useCallback(() => {
    resetForm();
    setIsEditing(true);
  }, [resetForm]);

  const handleEdit = useCallback((entry: JournalEntry) => {
    setSelectedEntry(entry);
    setFormSynth(entry.synth);
    setFormPatchName(entry.patchName);
    setFormTags(entry.tags.join(", "));
    setFormNotes(entry.notes);
    setFormWhatLearned(entry.whatLearned);
    setFormWhatBroke(entry.whatBroke);
    setFormPresetRef(entry.presetReference);
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formPatchName.trim()) return;

    const tags = formTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (selectedEntry) {
      // Update existing
      setEntries((prev) =>
        prev.map((e) =>
          e.id === selectedEntry.id
            ? {
                ...e,
                synth: formSynth,
                patchName: formPatchName.trim(),
                tags,
                notes: formNotes.trim(),
                whatLearned: formWhatLearned.trim(),
                whatBroke: formWhatBroke.trim(),
                presetReference: formPresetRef.trim(),
                updatedAt: new Date().toISOString(),
              }
            : e
        )
      );
    } else {
      // Create new
      const newEntry: JournalEntry = {
        id: crypto.randomUUID(),
        synth: formSynth,
        patchName: formPatchName.trim(),
        tags,
        notes: formNotes.trim(),
        whatLearned: formWhatLearned.trim(),
        whatBroke: formWhatBroke.trim(),
        presetReference: formPresetRef.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setEntries((prev) => [newEntry, ...prev]);
    }
    resetForm();
  }, [
    selectedEntry,
    formSynth,
    formPatchName,
    formTags,
    formNotes,
    formWhatLearned,
    formWhatBroke,
    formPresetRef,
    resetForm,
  ]);

  const handleDelete = useCallback((id: string) => {
    if (confirm("Delete this journal entry?")) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  }, []);

  if (isEditing) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{selectedEntry ? "Edit Entry" : "New Entry"}</h1>
        </header>

        <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Synth</label>
              <div className={styles.synthButtons}>
                {(["serum", "vital", "other"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.synthBtn} ${formSynth === s ? styles.active : ""}`}
                    onClick={() => setFormSynth(s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Patch Name *</label>
              <input
                type="text"
                value={formPatchName}
                onChange={(e) => setFormPatchName(e.target.value)}
                placeholder="My Bass Patch"
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Tags (comma separated)</label>
            <input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="bass, fm, dark"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Notes</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="What were you trying to create? What settings did you use?"
              rows={4}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>What I Learned</label>
              <textarea
                value={formWhatLearned}
                onChange={(e) => setFormWhatLearned(e.target.value)}
                placeholder="Key insights from this experiment..."
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label>What Broke / Issues</label>
              <textarea
                value={formWhatBroke}
                onChange={(e) => setFormWhatBroke(e.target.value)}
                placeholder="Problems encountered..."
                rows={3}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Preset Reference (optional)</label>
            <input
              type="text"
              value={formPresetRef}
              onChange={(e) => setFormPresetRef(e.target.value)}
              placeholder="Path to preset or reference name"
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn} disabled={!formPatchName.trim()}>
              Save Entry
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Patch Journal</h1>
          <p className={styles.subtitle}>Track your synthesis experiments and learnings</p>
        </div>
        <button className={styles.createBtn} onClick={handleCreate}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Entry
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filters}>
          {(["all", "serum", "vital", "other"] as const).map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${synthFilter === s ? styles.active : ""}`}
              onClick={() => setSynthFilter(s)}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <h3>No journal entries yet</h3>
          <p>Start documenting your synthesis experiments</p>
          <button className={styles.createBtn} onClick={handleCreate}>
            Create First Entry
          </button>
        </div>
      ) : (
        <div className={styles.entries}>
          {filteredEntries.map((entry) => (
            <div key={entry.id} className={styles.entryCard}>
              <div className={styles.entryHeader}>
                <span className={`${styles.synthBadge} ${styles[entry.synth]}`}>
                  {entry.synth}
                </span>
                <span className={styles.entryDate}>
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className={styles.entryName}>{entry.patchName}</h3>
              {entry.notes && <p className={styles.entryNotes}>{entry.notes}</p>}
              {entry.tags.length > 0 && (
                <div className={styles.entryTags}>
                  {entry.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              )}
              {(entry.whatLearned || entry.whatBroke) && (
                <div className={styles.entryMeta}>
                  {entry.whatLearned && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Learned:</span>
                      <span>{entry.whatLearned}</span>
                    </div>
                  )}
                  {entry.whatBroke && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Issues:</span>
                      <span>{entry.whatBroke}</span>
                    </div>
                  )}
                </div>
              )}
              <div className={styles.entryActions}>
                <button onClick={() => handleEdit(entry)}>Edit</button>
                <button onClick={() => handleDelete(entry.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JournalClient;

