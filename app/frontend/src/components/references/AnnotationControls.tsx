/**
 * Annotation Controls Component
 *
 * Panel for creating and editing annotations on a reference track.
 */

'use client';

import { useState, useCallback } from 'react';
import type { AnnotationResponse, CreateAnnotationInput, UpdateAnnotationInput } from '@/lib/api/reference-tracks';
import styles from './AnnotationControls.module.css';

// ============================================
// Types
// ============================================

export interface AnnotationControlsProps {
  annotations: AnnotationResponse[];
  selectedAnnotation: AnnotationResponse | null;
  onSelect: (annotation: AnnotationResponse | null) => void;
  onCreate: (input: CreateAnnotationInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateAnnotationInput) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
  /** Current playback time in ms for quick annotation */
  currentTimeMs?: number;
  /** Track duration in ms */
  durationMs?: number;
}

// ============================================
// Constants
// ============================================

const CATEGORIES = [
  { value: 'general', label: 'General', color: '#6b7280' },
  { value: 'technique', label: 'Technique', color: '#3b82f6' },
  { value: 'mix', label: 'Mix', color: '#10b981' },
  { value: 'mastering', label: 'Mastering', color: '#8b5cf6' },
  { value: 'arrangement', label: 'Arrangement', color: '#f59e0b' },
  { value: 'production', label: 'Production', color: '#ef4444' },
] as const;

const DEFAULT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

// ============================================
// Helpers
// ============================================

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor((ms % 1000) / 10);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
}

function parseTime(str: string): number | null {
  const match = str.match(/^(\d+):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;

  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const millis = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;

  return (minutes * 60 + seconds) * 1000 + millis;
}

// ============================================
// Component
// ============================================

export function AnnotationControls({
  annotations,
  selectedAnnotation,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  currentTimeMs = 0,
}: AnnotationControlsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateAnnotationInput>>({});
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setFormData({});
    setIsCreating(false);
    setIsEditing(false);
  }, []);

  const handleCreateClick = useCallback(() => {
    setFormData({
      start_time_ms: currentTimeMs,
      title: '',
      category: 'general',
      color: DEFAULT_COLORS[annotations.length % DEFAULT_COLORS.length],
    });
    setIsCreating(true);
    setIsEditing(false);
    onSelect(null);
  }, [currentTimeMs, annotations.length, onSelect]);

  const handleEditClick = useCallback(() => {
    if (!selectedAnnotation) return;
    setFormData({
      start_time_ms: selectedAnnotation.start_time_ms,
      end_time_ms: selectedAnnotation.end_time_ms ?? undefined,
      title: selectedAnnotation.title,
      content: selectedAnnotation.content ?? undefined,
      category: selectedAnnotation.category,
      color: selectedAnnotation.color,
    });
    setIsEditing(true);
    setIsCreating(false);
  }, [selectedAnnotation]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.start_time_ms === undefined) return;

    setSaving(true);
    try {
      if (isEditing && selectedAnnotation) {
        await onUpdate(selectedAnnotation.id, {
          start_time_ms: formData.start_time_ms,
          end_time_ms: formData.end_time_ms,
          title: formData.title,
          content: formData.content,
          category: formData.category,
          color: formData.color,
        });
      } else {
        await onCreate({
          start_time_ms: formData.start_time_ms,
          end_time_ms: formData.end_time_ms,
          title: formData.title,
          content: formData.content,
          category: formData.category,
          color: formData.color,
        });
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  }, [formData, isEditing, selectedAnnotation, onCreate, onUpdate, resetForm]);

  const handleDelete = useCallback(async () => {
    if (!selectedAnnotation) return;
    if (!confirm('Delete this annotation?')) return;

    setSaving(true);
    try {
      await onDelete(selectedAnnotation.id);
      resetForm();
      onSelect(null);
    } finally {
      setSaving(false);
    }
  }, [selectedAnnotation, onDelete, resetForm, onSelect]);

  const showForm = isCreating || isEditing;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Annotations</h3>
        <button
          type="button"
          className={styles.addButton}
          onClick={handleCreateClick}
          disabled={saving}
        >
          + Add
        </button>
      </div>

      {/* Annotation list */}
      <div className={styles.list}>
        {annotations.length === 0 && !showForm && (
          <p className={styles.empty}>No annotations yet. Double-click the waveform or click Add to create one.</p>
        )}
        {annotations.map((annotation) => (
          <div
            key={annotation.id}
            className={`${styles.item} ${selectedAnnotation?.id === annotation.id ? styles.itemSelected : ''}`}
            onClick={() => onSelect(annotation)}
          >
            <div
              className={styles.itemColor}
              style={{ backgroundColor: annotation.color }}
            />
            <div className={styles.itemContent}>
              <span className={styles.itemTitle}>{annotation.title}</span>
              <span className={styles.itemTime}>
                {formatTime(annotation.start_time_ms)}
                {annotation.end_time_ms && ` - ${formatTime(annotation.end_time_ms)}`}
              </span>
            </div>
            <span className={`${styles.itemCategory} ${styles[`category_${annotation.category}`]}`}>
              {annotation.category}
            </span>
          </div>
        ))}
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label>
              Title
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Annotation title"
                required
                autoFocus
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              Start Time
              <input
                type="text"
                value={formData.start_time_ms !== undefined ? formatTime(formData.start_time_ms) : ''}
                onChange={(e) => {
                  const ms = parseTime(e.target.value);
                  if (ms !== null) setFormData({ ...formData, start_time_ms: ms });
                }}
                placeholder="0:00.00"
              />
            </label>
            <label>
              End Time (optional)
              <input
                type="text"
                value={formData.end_time_ms ? formatTime(formData.end_time_ms) : ''}
                onChange={(e) => {
                  const ms = parseTime(e.target.value);
                  setFormData({ ...formData, end_time_ms: ms ?? undefined });
                }}
                placeholder="0:00.00"
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              Category
              <select
                value={formData.category || 'general'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as CreateAnnotationInput['category'] })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              Color
              <div className={styles.colorPicker}>
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`${styles.colorOption} ${formData.color === color ? styles.colorSelected : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              Notes
              <textarea
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </label>
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={resetForm} disabled={saving}>
              Cancel
            </button>
            {isEditing && selectedAnnotation && (
              <button type="button" className={styles.deleteButton} onClick={handleDelete} disabled={saving}>
                Delete
              </button>
            )}
            <button type="submit" className={styles.saveButton} disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Selected annotation actions */}
      {selectedAnnotation && !showForm && (
        <div className={styles.selectedActions}>
          <button type="button" onClick={handleEditClick}>Edit</button>
          <button type="button" className={styles.deleteButton} onClick={handleDelete} disabled={saving}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

