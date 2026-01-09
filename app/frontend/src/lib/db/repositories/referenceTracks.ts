/**
 * Reference Tracks Repository
 * Handles R2-backed audio file metadata in D1
 */

import type { D1Database } from "@cloudflare/workers-types";

// ============================================
// Types
// ============================================

export interface ReferenceTrack {
  id: string;
  user_id: string;
  title: string;
  artist: string | null;
  r2_key: string;
  mime_type: string;
  bytes: number;
  sha256: string | null;
  duration_seconds: number | null;
  tags_json: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export interface TrackAnalysis {
  id: string;
  track_id: string;
  bpm: number | null;
  key: string | null;
  energy: number | null;
  danceability: number | null;
  sections_json: string | null;
  waveform_json: string | null;
  analyzed_at: string;
  created_at: string;
}

export interface CreateTrackInput {
  title: string;
  artist?: string;
  r2_key: string;
  mime_type: string;
  bytes: number;
  sha256?: string;
  duration_seconds?: number;
  tags?: string[];
}

export interface AnalysisInput {
  bpm?: number;
  key?: string;
  energy?: number;
  danceability?: number;
  sections?: unknown[];
  waveform?: number[];
}

// ============================================
// Track CRUD Operations
// ============================================

/**
 * Create a new reference track
 */
export async function createReferenceTrack(
  db: D1Database,
  userId: string,
  input: CreateTrackInput
): Promise<ReferenceTrack> {
  const id = `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO reference_tracks (id, user_id, title, artist, r2_key, mime_type, bytes, sha256, duration_seconds, tags_json, visibility, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'private', ?, ?)
    `)
    .bind(
      id,
      userId,
      input.title,
      input.artist || null,
      input.r2_key,
      input.mime_type,
      input.bytes,
      input.sha256 || null,
      input.duration_seconds || null,
      input.tags ? JSON.stringify(input.tags) : null,
      now,
      now
    )
    .run();

  return {
    id,
    user_id: userId,
    title: input.title,
    artist: input.artist || null,
    r2_key: input.r2_key,
    mime_type: input.mime_type,
    bytes: input.bytes,
    sha256: input.sha256 || null,
    duration_seconds: input.duration_seconds || null,
    tags_json: input.tags ? JSON.stringify(input.tags) : null,
    visibility: "private",
    created_at: now,
    updated_at: now,
  };
}

/**
 * Get all tracks for a user
 */
export async function getUserTracks(
  db: D1Database,
  userId: string
): Promise<ReferenceTrack[]> {
  const result = await db
    .prepare(`
      SELECT * FROM reference_tracks
      WHERE user_id = ?
      ORDER BY created_at DESC
    `)
    .bind(userId)
    .all<ReferenceTrack>();

  return result.results || [];
}

/**
 * Get a single track by ID
 */
export async function getTrackById(
  db: D1Database,
  trackId: string,
  userId: string
): Promise<ReferenceTrack | null> {
  return db
    .prepare(`
      SELECT * FROM reference_tracks
      WHERE id = ? AND user_id = ?
    `)
    .bind(trackId, userId)
    .first<ReferenceTrack>();
}

/**
 * Update track metadata
 */
export async function updateTrack(
  db: D1Database,
  trackId: string,
  userId: string,
  updates: Partial<Pick<ReferenceTrack, "title" | "artist" | "duration_seconds">> & { tags?: string[] }
): Promise<boolean> {
  const now = new Date().toISOString();
  const fields: string[] = ["updated_at = ?"];
  const values: (string | number | null)[] = [now];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.artist !== undefined) {
    fields.push("artist = ?");
    values.push(updates.artist);
  }
  if (updates.duration_seconds !== undefined) {
    fields.push("duration_seconds = ?");
    values.push(updates.duration_seconds);
  }
  if (updates.tags !== undefined) {
    fields.push("tags_json = ?");
    values.push(JSON.stringify(updates.tags));
  }

  values.push(trackId, userId);

  const result = await db
    .prepare(`
      UPDATE reference_tracks
      SET ${fields.join(", ")}
      WHERE id = ? AND user_id = ?
    `)
    .bind(...values)
    .run();

  return result.meta.changes > 0;
}

/**
 * Delete a track
 */
export async function deleteTrack(
  db: D1Database,
  trackId: string,
  userId: string
): Promise<{ deleted: boolean; r2_key: string | null }> {
  // Get the R2 key before deletion for cleanup
  const track = await getTrackById(db, trackId, userId);
  if (!track) {
    return { deleted: false, r2_key: null };
  }

  const result = await db
    .prepare(`
      DELETE FROM reference_tracks
      WHERE id = ? AND user_id = ?
    `)
    .bind(trackId, userId)
    .run();

  return {
    deleted: result.meta.changes > 0,
    r2_key: track.r2_key,
  };
}

// ============================================
// Analysis Operations
// ============================================

/**
 * Get analysis for a track
 */
export async function getTrackAnalysis(
  db: D1Database,
  trackId: string
): Promise<TrackAnalysis | null> {
  return db
    .prepare(`
      SELECT * FROM track_analysis_cache
      WHERE track_id = ?
    `)
    .bind(trackId)
    .first<TrackAnalysis>();
}

/**
 * Save or update track analysis
 */
export async function saveTrackAnalysis(
  db: D1Database,
  trackId: string,
  analysis: AnalysisInput
): Promise<TrackAnalysis> {
  const id = `analysis_${trackId}`;
  const now = new Date().toISOString();

  // Upsert the analysis
  await db
    .prepare(`
      INSERT INTO track_analysis_cache (id, track_id, bpm, key, energy, danceability, sections_json, waveform_json, analyzed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(track_id) DO UPDATE SET
        bpm = excluded.bpm,
        key = excluded.key,
        energy = excluded.energy,
        danceability = excluded.danceability,
        sections_json = excluded.sections_json,
        waveform_json = excluded.waveform_json,
        analyzed_at = excluded.analyzed_at
    `)
    .bind(
      id,
      trackId,
      analysis.bpm || null,
      analysis.key || null,
      analysis.energy || null,
      analysis.danceability || null,
      analysis.sections ? JSON.stringify(analysis.sections) : null,
      analysis.waveform ? JSON.stringify(analysis.waveform) : null,
      now,
      now
    )
    .run();

  return {
    id,
    track_id: trackId,
    bpm: analysis.bpm || null,
    key: analysis.key || null,
    energy: analysis.energy || null,
    danceability: analysis.danceability || null,
    sections_json: analysis.sections ? JSON.stringify(analysis.sections) : null,
    waveform_json: analysis.waveform ? JSON.stringify(analysis.waveform) : null,
    analyzed_at: now,
    created_at: now,
  };
}

/**
 * Get track with analysis
 */
export async function getTrackWithAnalysis(
  db: D1Database,
  trackId: string,
  userId: string
): Promise<{ track: ReferenceTrack; analysis: TrackAnalysis | null } | null> {
  const track = await getTrackById(db, trackId, userId);
  if (!track) {
    return null;
  }

  const analysis = await getTrackAnalysis(db, trackId);
  return { track, analysis };
}

// ============================================
// Search and Filter
// ============================================

/**
 * Search tracks by title or artist
 */
export async function searchTracks(
  db: D1Database,
  userId: string,
  query: string
): Promise<ReferenceTrack[]> {
  const searchPattern = `%${query}%`;
  const result = await db
    .prepare(`
      SELECT * FROM reference_tracks
      WHERE user_id = ?
        AND (title LIKE ? OR artist LIKE ?)
      ORDER BY created_at DESC
      LIMIT 50
    `)
    .bind(userId, searchPattern, searchPattern)
    .all<ReferenceTrack>();

  return result.results || [];
}

/**
 * Get tracks by tag
 */
export async function getTracksByTag(
  db: D1Database,
  userId: string,
  tag: string
): Promise<ReferenceTrack[]> {
  // SQLite JSON functions to search in tags_json
  const result = await db
    .prepare(`
      SELECT * FROM reference_tracks
      WHERE user_id = ?
        AND tags_json LIKE ?
      ORDER BY created_at DESC
    `)
    .bind(userId, `%"${tag}"%`)
    .all<ReferenceTrack>();

  return result.results || [];
}

