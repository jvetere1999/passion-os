/**
 * Track Analysis Cache Repository
 * Stores computed audio analysis in D1 keyed by content hash
 * Allows sharing analysis data across sessions and devices
 */

import type { D1Database } from "@cloudflare/workers-types";

export interface CachedTrackAnalysis {
  id: string;
  contentHash: string;
  name: string;
  durationMs?: number;
  bpm?: number;
  key?: string;
  peakDb?: number;
  rmsDb?: number;
  lufs?: number;
  frequencyProfile?: "bass-heavy" | "mid-focused" | "bright" | "balanced";
  waveformData?: number[];
  createdAt: string;
  updatedAt: string;
}

interface DbRow {
  id: string;
  content_hash: string;
  name: string;
  duration_ms: number | null;
  bpm: number | null;
  key: string | null;
  peak_db: number | null;
  rms_db: number | null;
  lufs: number | null;
  frequency_profile: string | null;
  waveform_data: string | null;
  created_at: string;
  updated_at: string;
}

function rowToAnalysis(row: DbRow): CachedTrackAnalysis {
  return {
    id: row.id,
    contentHash: row.content_hash,
    name: row.name,
    durationMs: row.duration_ms ?? undefined,
    bpm: row.bpm ?? undefined,
    key: row.key ?? undefined,
    peakDb: row.peak_db ?? undefined,
    rmsDb: row.rms_db ?? undefined,
    lufs: row.lufs ?? undefined,
    frequencyProfile: row.frequency_profile as CachedTrackAnalysis["frequencyProfile"],
    waveformData: row.waveform_data ? JSON.parse(row.waveform_data) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get analysis by content hash
 */
export async function getAnalysisByHash(
  db: D1Database,
  contentHash: string
): Promise<CachedTrackAnalysis | null> {
  const result = await db
    .prepare("SELECT * FROM track_analysis_cache WHERE content_hash = ?")
    .bind(contentHash)
    .first<DbRow>();

  return result ? rowToAnalysis(result) : null;
}

/**
 * Get analysis by ID
 */
export async function getAnalysisById(
  db: D1Database,
  id: string
): Promise<CachedTrackAnalysis | null> {
  const result = await db
    .prepare("SELECT * FROM track_analysis_cache WHERE id = ?")
    .bind(id)
    .first<DbRow>();

  return result ? rowToAnalysis(result) : null;
}

/**
 * Save or update analysis
 */
export async function saveAnalysis(
  db: D1Database,
  analysis: Omit<CachedTrackAnalysis, "createdAt" | "updatedAt">
): Promise<CachedTrackAnalysis> {
  const now = new Date().toISOString();
  const waveformJson = analysis.waveformData
    ? JSON.stringify(analysis.waveformData)
    : null;

  await db
    .prepare(
      `INSERT INTO track_analysis_cache 
       (id, content_hash, name, duration_ms, bpm, key, peak_db, rms_db, lufs, frequency_profile, waveform_data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(content_hash) DO UPDATE SET
         name = excluded.name,
         duration_ms = excluded.duration_ms,
         bpm = excluded.bpm,
         key = excluded.key,
         peak_db = excluded.peak_db,
         rms_db = excluded.rms_db,
         lufs = excluded.lufs,
         frequency_profile = excluded.frequency_profile,
         waveform_data = excluded.waveform_data,
         updated_at = excluded.updated_at`
    )
    .bind(
      analysis.id,
      analysis.contentHash,
      analysis.name,
      analysis.durationMs ?? null,
      analysis.bpm ?? null,
      analysis.key ?? null,
      analysis.peakDb ?? null,
      analysis.rmsDb ?? null,
      analysis.lufs ?? null,
      analysis.frequencyProfile ?? null,
      waveformJson,
      now,
      now
    )
    .run();

  return {
    ...analysis,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Delete analysis by hash
 */
export async function deleteAnalysisByHash(
  db: D1Database,
  contentHash: string
): Promise<void> {
  await db
    .prepare("DELETE FROM track_analysis_cache WHERE content_hash = ?")
    .bind(contentHash)
    .run();
}

/**
 * Get multiple analyses by hashes
 */
export async function getAnalysesByHashes(
  db: D1Database,
  hashes: string[]
): Promise<Map<string, CachedTrackAnalysis>> {
  if (hashes.length === 0) return new Map();

  const placeholders = hashes.map(() => "?").join(",");
  const result = await db
    .prepare(
      `SELECT * FROM track_analysis_cache WHERE content_hash IN (${placeholders})`
    )
    .bind(...hashes)
    .all<DbRow>();

  const map = new Map<string, CachedTrackAnalysis>();
  for (const row of result.results) {
    map.set(row.content_hash, rowToAnalysis(row));
  }
  return map;
}

/**
 * Generate content hash from file data
 * Uses Web Crypto API for SHA-256
 */
export async function generateContentHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

