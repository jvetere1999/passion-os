/**
 * Region Controls Component
 *
 * Panel for creating and editing regions (sections/loops) on a reference track.
 */

'use client';

import { useState, useCallback } from 'react';
import type { RegionResponse, CreateRegionInput, UpdateRegionInput } from '@/lib/api/reference-tracks';
import styles from './RegionControls.module.css';

export interface RegionControlsProps {
  regions: RegionResponse[];
  selectedRegion: RegionResponse | null;
  activeLoop: RegionResponse | null;
  onSelect: (region: RegionResponse | null) => void;
  onSetLoop: (region: RegionResponse | null) => void;
  onCreate: (input: CreateRegionInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateRegionInput) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
  durationMs?: number;
}

const SECTION_TYPES = [
  { value: 'intro', label: 'Intro', color: '#4ade80' },
  { value: 'verse', label: 'Verse', color: '#60a5fa' },
  { value: 'chorus', label: 'Chorus', color: '#f472b6' },
  { value: 'bridge', label: 'Bridge', color: '#fbbf24' },
  { value: 'breakdown', label: 'Breakdown', color: '#a78bfa' },
  { value: 'buildup', label: 'Buildup', color: '#fb923c' },
  { value: 'drop', label: 'Drop', color: '#ef4444' },
  { value: 'outro', label: 'Outro', color: '#6b7280' },
  { value: 'custom', label: 'Custom', color: '#94a3b8' },
] as const;

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDuration(startMs: number, endMs: number): string {
  const durationMs = endMs - startMs;
  const totalSeconds = Math.floor(durationMs / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function parseTime(str: string): number | null {
  const match = str.match(/^(\d+):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const millis = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
  return (minutes * 60 + seconds) * 1000 + millis;
}

export function RegionControls({
  regions,
  selectedRegion,
  activeLoop,
  onSelect,
  onSetLoop,
  onCreate,
  onUpdate,
  onDelete,
  durationMs = 0,
}: RegionControlsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateRegionInput>>({});
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setFormData({});
    setIsCreating(false);
    setIsEditing(false);
  }, []);

  const handleCreateClick = useCallback(() => {
    setFormData({
      start_time_ms: 0,
      end_time_ms: Math.min(10000, durationMs),
      name: '',
      section_type: 'custom',
      color: SECTION_TYPES.find((t) => t.value === 'custom')?.color,
      is_loop: false,
    });
    setIsCreating(true);
    setIsEditing(false);
    onSelect(null);
  }, [durationMs, onSelect]);

  const handleEditClick = useCallback(() => {
    if (!selectedRegion) return;
    setFormData({
      start_time_ms: selectedRegion.start_time_ms,
      end_time_ms: selectedRegion.end_time_ms,
      name: selectedRegion.name,
      section_type: selectedRegion.section_type,
      color: selectedRegion.color,
      is_loop: selectedRegion.is_loop,
      notes: selectedRegion.notes ?? undefined,
    });
    setIsEditing(true);
    setIsCreating(false);
  }, [selectedRegion]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.start_time_ms === undefined || formData.end_time_ms === undefined) return;
    setSaving(true);
    try {
      if (isEditing && selectedRegion) {
        await onUpdate(selectedRegion.id, formData as UpdateRegionInput);
      } else {
        await onCreate(formData as CreateRegionInput);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  }, [formData, isEditing, selectedRegion, onCreate, onUpdate, resetForm]);

  const handleDelete = useCallback(async () => {
    if (!selectedRegion) return;
    if (!confirm('Delete this region?')) return;
    setSaving(true);
    try {
      if (activeLoop?.id === selectedRegion.id) onSetLoop(null);
      await onDelete(selectedRegion.id);
      resetForm();
      onSelect(null);
    } finally {
      setSaving(false);
    }
  }, [selectedRegion, activeLoop, onDelete, onSetLoop, resetForm, onSelect]);

  const handleSetLoop = useCallback(() => {
    if (!selectedRegion) return;
    onSetLoop(activeLoop?.id === selectedRegion.id ? null : selectedRegion);
  }, [selectedRegion, activeLoop, onSetLoop]);

  const showForm = isCreating || isEditing;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Regions</h3>
        <button type="button" className={styles.addButton} onClick={handleCreateClick} disabled={saving}>+ Add</button>
      </div>

      <div className={styles.list}>
        {regions.length === 0 && !showForm && (
          <p className={styles.empty}>No regions yet. Drag on the waveform or click Add to create one.</p>
        )}
        {regions.map((region) => {
          const sectionType = SECTION_TYPES.find((t) => t.value === region.section_type);
          const isActive = activeLoop?.id === region.id;
          const isSelected = selectedRegion?.id === region.id;
          return (
            <div key={region.id} className={`${styles.item} ${isSelected ? styles.itemSelected : ''} ${isActive ? styles.itemActive : ''}`} onClick={() => onSelect(region)}>
              <div className={styles.itemColor} style={{ backgroundColor: region.color || sectionType?.color }} />
              <div className={styles.itemContent}>
                <span className={styles.itemName}>{region.name}</span>
                <span className={styles.itemTime}>{formatTime(region.start_time_ms)} - {formatTime(region.end_time_ms)} <span className={styles.itemDuration}>({formatDuration(region.start_time_ms, region.end_time_ms)})</span></span>
              </div>
              <span className={`${styles.itemType} ${styles[`type_${region.section_type}`]}`}>{sectionType?.label || region.section_type}</span>
              {region.is_loop && <span className={styles.loopBadge} aria-label="loop">Loop</span>}
            </div>
          );
        })}
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label>Name<input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Region name" required autoFocus /></label>
          </div>
          <div className={styles.formRow}>
            <label>Start Time<input type="text" value={formData.start_time_ms !== undefined ? formatTime(formData.start_time_ms) : ''} onChange={(e) => { const ms = parseTime(e.target.value); if (ms !== null) setFormData({ ...formData, start_time_ms: ms }); }} placeholder="0:00" /></label>
            <label>End Time<input type="text" value={formData.end_time_ms !== undefined ? formatTime(formData.end_time_ms) : ''} onChange={(e) => { const ms = parseTime(e.target.value); if (ms !== null) setFormData({ ...formData, end_time_ms: ms }); }} placeholder="0:10" /></label>
          </div>
          <div className={styles.formRow}>
            <label>Section Type<select value={formData.section_type || 'custom'} onChange={(e) => { const type = e.target.value as CreateRegionInput['section_type']; const st = SECTION_TYPES.find((t) => t.value === type); setFormData({ ...formData, section_type: type, color: st?.color || formData.color }); }}>{SECTION_TYPES.map((type) => (<option key={type.value} value={type.value}>{type.label}</option>))}</select></label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.checkboxLabel}><input type="checkbox" checked={formData.is_loop || false} onChange={(e) => setFormData({ ...formData, is_loop: e.target.checked })} />Mark as loop region</label>
          </div>
          <div className={styles.formRow}>
            <label>Notes<textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." rows={2} /></label>
          </div>
          <div className={styles.formActions}>
            <button type="button" onClick={resetForm} disabled={saving}>Cancel</button>
            {isEditing && selectedRegion && <button type="button" className={styles.deleteButton} onClick={handleDelete} disabled={saving}>Delete</button>}
            <button type="submit" className={styles.saveButton} disabled={saving}>{saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      )}

      {selectedRegion && !showForm && (
        <div className={styles.selectedActions}>
          <button type="button" className={activeLoop?.id === selectedRegion.id ? styles.loopActiveButton : ''} onClick={handleSetLoop}>{activeLoop?.id === selectedRegion.id ? 'Stop Loop' : 'Loop'}</button>
          <button type="button" onClick={handleEditClick}>Edit</button>
          <button type="button" className={styles.deleteButton} onClick={handleDelete} disabled={saving}>Delete</button>
        </div>
      )}
    </div>
  );
}

